import axios, { AxiosInstance } from 'axios';
import { Course, Module, Lesson } from '@/lib/types/course';
import { AccessRequest } from '@/lib/types/accessRequest';
import { User as AuthUser, LoginResponse } from '@/lib/types/auth';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface Organization {
  id: number;
  name: string;
  domain: string;
  logo: string | null;
  theme: string;
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Create axios instance with default config
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
}) as AxiosInstance;

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// List of endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/auth/request_otp/',
  '/auth/verify_otp/',
  '/auth/token_refresh/'
];

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
    config.url?.includes(endpoint)
  );

  if (!isPublicEndpoint) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // If no token is found, redirect to login
      window.location.href = '/login';
      return Promise.reject('No authentication token found');
    }
  }

  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url === '/auth/token_refresh/') {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshApi = axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await refreshApi.post('/auth/token_refresh/', {
        refresh: refreshToken
      });

      const { access } = response.data;
      localStorage.setItem(TOKEN_KEY, access);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      processQueue();
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

interface CourseEnrollment {
  id: string;
  status: 'ENROLLED' | 'COMPLETED' | 'DROPPED';
  progress: number;
  enrolled_at: string;
  completed_at?: string;
  dropped_at?: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_approved: boolean;
  approval_date: string | null;
  organization: {
    id: string;
    name: string;
    domain: string;
    logo: string | null;
    theme: string;
    is_active: boolean;
  };
  dark_mode: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

class ApiService {
  // Auth methods
  async requestRegistrationOTP(email: string): Promise<void> {
    await api.post('/auth/request_otp/', { email, purpose: 'registration' });
  }

  async requestLoginOTP(email: string): Promise<void> {
    try {
      await api.post('/auth/request_otp/', { email, purpose: 'login' });
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw {
          response: {
            data: {
              error: {
                message: "No account found with this email address. Please register first.",
                code: 404,
                details: null
              }
            },
            status: 404
          }
        };
      }
      throw error;
    }
  }

  async register(email: string, otp: string): Promise<void> {
    const response = await api.post('/auth/verify_otp/', { 
      email, 
      otp,
      purpose: 'registration'
    });
    if (response.data.message !== 'Registration request submitted successfully') {
      throw new Error('Unexpected response from server');
    }
  }

  async verifyOTP(email: string, otp: string): Promise<LoginResponse> {
    const response = await api.post('/auth/verify_otp/', { 
      email, 
      otp,
      purpose: 'login'
    });
    
    if (response.data.message === 'Registration request submitted successfully') {
      throw {
        response: {
          data: {
            error: {
              message: "Your registration request has been submitted. You will receive an email once approved.",
              code: 400,
              details: null
            }
          },
          status: 400
        }
      };
    }
    
    const { access, refresh, user } = response.data;
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    
    return { access, refresh, user };
  }

  async verifyAuth(): Promise<{ user: any; token: string } | null> {
    try {
      const response = await api.get('/users/me/');
      const token = localStorage.getItem(TOKEN_KEY);
      return {
        user: response.data,
        token: token || ''
      };
    } catch (error) {
      return null;
    }
  }

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Course endpoints
  courses = {
    list: async (params?: { 
      show_deleted?: boolean;
      page?: number;
      page_size?: number;
      search?: string;
      view?: string;
      ordering?: string;
    }): Promise<PaginatedResponse<Course>> => {
      const response = await api.get('/courses/', { params });
      return response.data;
    },
    get: async (id: string): Promise<Course> => {
      const response = await api.get(`/courses/${id}/`);
      return response.data;
    },
    create: async (data: Partial<Course>): Promise<Course> => {
      const response = await api.post('/courses/', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Course>): Promise<Course> => {
      const response = await api.patch(`/courses/${id}/`, data);
      return response.data;
    },
    delete: async (id: string): Promise<void> => {
      await api.delete(`/courses/${id}/`);
    },
    restore: async (id: string): Promise<Course> => {
      const response = await api.post(`/courses/${id}/restore/`);
      return response.data;
    },
    enroll: async (id: string): Promise<Course> => {
      const response = await api.post(`/courses/${id}/enroll/`);
      return response.data;
    },
    unenroll: async (id: string): Promise<Course> => {
      const response = await api.post(`/courses/${id}/unenroll/`);
      return response.data;
    },
    complete: async (id: string, data: { user_id: string }): Promise<Course> => {
      if (!data?.user_id) {
        throw new Error('user_id is required');
      }
      // If user_id is 'current', use the regular complete endpoint
      if (data.user_id === 'current') {
        const response = await api.post(`/courses/${id}/complete/`);
        return response.data;
      }
      // Otherwise use admin_complete endpoint
      const response = await api.post(`/courses/${id}/admin_complete/`, { user_id: data.user_id });
      return response.data;
    },
    getEnrollment: async (courseId: string, userId: number): Promise<{ status: string }> => {
      const response = await api.get(`/courses/${courseId}/enrollments/${userId}/`);
      return response.data;
    },
    modules: {
      list: async (courseId: string, params?: { show_deleted?: boolean }): Promise<Module[]> => {
        const response = await api.get(`/courses/${courseId}/modules/`, { params });
        return response.data;
      },
      get: async (courseId: string, id: string): Promise<Module> => {
        const response = await api.get(`/courses/${courseId}/modules/${id}/`);
        return response.data;
      },
      create: async (courseId: string, data: Partial<Module>): Promise<Module> => {
        const response = await api.post(`/courses/${courseId}/modules/`, data);
        return response.data;
      },
      update: async (courseId: string, id: string, data: Partial<Module>): Promise<Module> => {
        const response = await api.patch(`/courses/${courseId}/modules/${id}/`, data);
        return response.data;
      },
      delete: async (courseId: string, id: string): Promise<void> => {
        await api.delete(`/courses/${courseId}/modules/${id}/`);
      },
      restore: async (courseId: string, id: string): Promise<Module> => {
        const response = await api.post(`/courses/${courseId}/modules/${id}/restore/`);
        return response.data;
      },
    },
    lessons: {
      list: async (courseId: string, moduleId: string, params?: { show_deleted?: boolean }): Promise<Lesson[]> => {
        const response = await api.get(`/courses/${courseId}/modules/${moduleId}/lessons/`, { params });
        return response.data;
      },
      get: async (courseId: string, moduleId: string, id: string): Promise<Lesson> => {
        const response = await api.get(`/courses/${courseId}/modules/${moduleId}/lessons/${id}/`);
        return response.data;
      },
      create: async (courseId: string, moduleId: string, data: Partial<Lesson>): Promise<{ data: Lesson }> => {
        const response = await api.post(`/courses/${courseId}/modules/${moduleId}/lessons/`, data);
        return response.data;
      },
      update: async (courseId: string, moduleId: string, id: string, data: Partial<Lesson>): Promise<{ data: Lesson }> => {
        const response = await api.patch(`/courses/${courseId}/modules/${moduleId}/lessons/${id}/`, data);
        return response.data;
      },
      delete: async (courseId: string, moduleId: string, id: string): Promise<void> => {
        await api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${id}/`);
      },
      restore: async (courseId: string, moduleId: string, id: string): Promise<{ data: Lesson }> => {
        const response = await api.post(`/courses/${courseId}/modules/${moduleId}/lessons/${id}/restore/`);
        return response.data;
      },
    },
    assessments: {
      create: async (courseId: string, data: any) => {
        const response = await api.post(`/courses/${courseId}/assessments/`, data);
        return response.data;
      },
      update: async (courseId: string, assessmentId: string, data: any) => {
        const response = await api.put(`/courses/${courseId}/assessments/${assessmentId}/`, data);
        return response.data;
      },
      delete: async (courseId: string, assessmentId: string) => {
        const response = await api.delete(`/courses/${courseId}/assessments/${assessmentId}/`);
        return response.data;
      },
      list: async (courseId: string) => {
        const response = await api.get(`/courses/${courseId}/assessments/`);
        return response.data;
      },
    },
  };

  // Enrollment endpoints
  enrollments = {
    list: () => api.get<CourseEnrollment[]>('/enrollments/'),
    get: (id: string) => api.get<CourseEnrollment>(`/enrollments/${id}/`),
    create: (data: Partial<CourseEnrollment>) => 
      api.post<CourseEnrollment>('/enrollments/', data),
    update: (id: string, data: Partial<CourseEnrollment>) => 
      api.put<CourseEnrollment>(`/enrollments/${id}/`, data),
    delete: (id: string) => api.delete(`/enrollments/${id}/`),
  };

  // Access Request endpoints
  accessRequests = {
    list: (params?: string) => 
      api.get<PaginatedResponse<AccessRequest>>(`/access_requests/${params ? `?${params}` : ''}`),
    get: (id: number) => api.get<AccessRequest>(`/access_requests/${id}/`),
    approve: (id: number) => api.post<AccessRequest>(`/access_requests/${id}/approve/`),
    reject: (id: number) => api.post(`/access_requests/${id}/reject/`),
    revoke: (id: number) => api.post<AccessRequest>(`/access_requests/${id}/revoke/`),
    restore: (id: number) => api.post<AccessRequest>(`/access_requests/${id}/restore/`),
  };

  // User endpoints
  users = {
    list: (params?: string) => api.get<PaginatedResponse<User>>(`/users/${params ? `?${params}` : ''}`),
    get: (id: string) => api.get<User>(`/users/${id === 'me' ? 'me/' : `${id}/`}`),
    update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id === 'me' ? 'me/' : `${id}/`}`, data),
    delete: (id: string) => api.delete(`/users/${id}/`),
    revoke: (id: string) => api.post<User>(`/users/${id}/revoke/`),
    restore: (id: string) => api.post<User>(`/users/${id}/restore/`),
  };

  // Organization endpoints
  organizations = {
    get: (id: string) => api.get<Organization>(`/organizations/${id}/`),
    update: (id: string, data: Partial<Organization>) => 
      api.patch<Organization>(`/organizations/${id}/`, data),
  };

  // Stats endpoint
  stats = {
    get: () => api.get('/stats/'),
  };

  assessments = {
    submit: async (courseId: string, assessmentId: string, formData: FormData) => {
      console.log('API Service - Submitting file:', {
        courseId,
        assessmentId,
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? value.name : value
        }))
      });
      const response = await api.post(`/courses/${courseId}/assessments/${assessmentId}/submit/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('API Service - Submit response:', response);
      return response.data;
    },
    get: async (courseId: string, assessmentId: string) => {
      const response = await api.get(`/courses/${courseId}/assessments/${assessmentId}/`);
      return response.data;
    },
    getSubmission: async (courseId: string, assessmentId: string) => {
      const response = await api.get(`/courses/${courseId}/assessments/${assessmentId}/submissions/`);
      return response.data;
    },
    deleteSubmission: async (courseId: string, assessmentId: string, submissionId: string) => {
      const response = await api.delete(`/courses/${courseId}/assessments/${assessmentId}/delete_submission/?submission_id=${submissionId}`);
      return response.data;
    },
    create: async (data: {
      assessable_type: string;
      assessable_id: string;
      title: string;
      description: string;
      assessment_type: string;
      file_submission?: {
        allowed_file_types: string[];
        max_file_size_mb: number;
        submission_instructions: string;
      };
    }) => {
      const response = await api.post('/assessments/', data);
      return response.data;
    },
  };
}

export const apiService = new ApiService(); 
export interface User {
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
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}

export type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'LOADING' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'VERIFY_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'VERIFY_FAILURE' };

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface OTPVerifyResponse {
  token: string;
  user: User;
} 
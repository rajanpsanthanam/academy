import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './lib/context/AuthContext';
import { ThemeProvider } from './themes/ThemeProvider';
import { AuthThemeProvider } from './themes/AuthThemeProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Dashboard from '@/pages/portal/Dashboard';
import { CourseDetail } from '@/pages/portal/CourseDetail';
import { LessonDetail } from '@/pages/portal/LessonDetail';
import { ModuleDetail } from '@/pages/portal/ModuleDetail';
import { AdminPage } from '@/pages/admin/AdminPage';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { SearchButton } from '@/components/layout/SearchButton';
import Courses from '@/pages/portal/Courses';
import Settings from '@/pages/portal/Settings';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import ManageCourses from '@/pages/admin/ManageCourses';
import AdminSettings from '@/pages/admin/Settings';
import AccessRequests from '@/pages/admin/AccessRequests';
import Users from '@/pages/admin/Users';
import { AuthLayout } from '@/components/layout/AuthLayout';
import CourseSubmissions from '@/pages/admin/CourseSubmissions';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes with AuthThemeProvider */}
          <Route
            path="/login"
            element={
              <AuthThemeProvider>
                <AuthLayout>
                  <LoginForm />
                </AuthLayout>
              </AuthThemeProvider>
            }
          />
          <Route
            path="/register"
            element={
              <AuthThemeProvider>
                <AuthLayout>
                  <RegisterForm />
                </AuthLayout>
              </AuthThemeProvider>
            }
          />
          
          {/* Protected routes with ThemeProvider */}
          <Route
            path="/portal"
            element={
              <ThemeProvider>
                <ProtectedRoute>
                  <PortalLayout />
                </ProtectedRoute>
              </ThemeProvider>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/enrolled" element={<Courses filter="PUBLISHED" />} />
            <Route path="courses/dropped" element={<Courses filter="DRAFT" />} />
            <Route path="courses/completed" element={<Courses filter="COMPLETED" />} />
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route
              path="courses/:courseId/modules/:moduleId"
              element={<ModuleDetail />}
            />
            <Route
              path="courses/:courseId/modules/:moduleId/lessons/:lessonId"
              element={<LessonDetail />}
            />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin routes with ThemeProvider */}
          <Route
            path="/admin"
            element={
              <ThemeProvider>
                <ProtectedRoute requiresAdmin>
                  <AdminPage />
                </ProtectedRoute>
              </ThemeProvider>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="access-requests" element={<AccessRequests />} />
            <Route path="submissions" element={<CourseSubmissions />} />
          </Route>

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-center" />
        <SearchButton />
      </AuthProvider>
    </Router>
  );
}

export default App;

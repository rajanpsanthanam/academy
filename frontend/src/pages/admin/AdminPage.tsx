import { AdminLayout } from '@/components/layout/AdminLayout';
import { Outlet, useLocation } from 'react-router-dom';

interface AdminPageProps {
  children?: React.ReactNode;
}

export function AdminPage({ children }: AdminPageProps) {
  const location = useLocation();
  const isAdminHome = location.pathname === '/admin';

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
} 
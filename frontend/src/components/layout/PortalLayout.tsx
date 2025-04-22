import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { BaseLayout } from './BaseLayout';
import { MainSidebar } from './MainSidebar';

interface PortalLayoutProps {
  children?: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <BaseLayout showSidebar sidebarType="main">
      {children || <Outlet />}
    </BaseLayout>
  );
} 
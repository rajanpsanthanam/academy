import { ReactNode } from 'react';
import { BaseLayout } from './BaseLayout';

export type LayoutType = 'portal' | 'admin' | 'auth';

interface LayoutFactoryProps {
  children: ReactNode;
  type?: LayoutType;
}

export function LayoutFactory({ children, type = 'portal' }: LayoutFactoryProps) {
  switch (type) {
    case 'admin':
      return (
        <BaseLayout 
          showSidebar={true} 
          sidebarType="admin"
          className="admin-layout"
        >
          {children}
        </BaseLayout>
      );
    case 'auth':
      return (
        <BaseLayout 
          showHeader={false} 
          className="auth-layout"
        >
          {children}
        </BaseLayout>
      );
    default:
      return (
        <BaseLayout 
          showSidebar={true}
          sidebarType="main"
          className="portal-layout"
        >
          {children}
        </BaseLayout>
      );
  }
} 
import { ReactNode } from 'react';
import { LayoutFactory } from './LayoutFactory';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <LayoutFactory type="admin">
      {children}
    </LayoutFactory>
  );
} 
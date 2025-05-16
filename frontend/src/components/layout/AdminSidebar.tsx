import { Users, BookOpen, Settings, UserPlus, LayoutDashboard, FileText } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: UserPlus, label: 'Access Requests', path: '/admin/access-requests' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
    { icon: FileText, label: 'Submissions', path: '/admin/submissions' },
    { icon: Settings, label: 'Settings', path: '/admin/settings', isBottom: true },
  ];

  return <Sidebar items={menuItems} onClose={onClose} />;
} 
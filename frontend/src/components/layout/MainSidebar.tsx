import { LayoutDashboard, Settings, BookOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MainSidebarProps {
  onClose?: () => void;
}

export function MainSidebar({ onClose }: MainSidebarProps) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/portal' },
    { icon: BookOpen, label: 'Courses', path: '/portal/courses' },
    { icon: Settings, label: 'Settings', path: '/portal/settings', isBottom: true },
  ];

  return <Sidebar items={menuItems} onClose={onClose} />;
} 
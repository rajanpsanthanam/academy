import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ClipboardList, Users, BookOpen, Settings } from 'lucide-react';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Access Requests',
    href: '/admin/access-requests',
    icon: ClipboardList,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Courses',
    href: '/admin/courses',
    icon: BookOpen,
    subItems: [
      {
        title: 'All Courses',
        href: '/admin/courses',
      },
      {
        title: 'Enrolled',
        href: '/admin/courses/enrolled',
      },
      {
        title: 'Dropped',
        href: '/admin/courses/dropped',
      },
      {
        title: 'Completed',
        href: '/admin/courses/completed',
      },
    ],
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]; 
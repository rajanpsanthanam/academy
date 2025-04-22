import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContentWrapperProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  full: 'max-w-full'
};

export function ContentWrapper({ 
  children, 
  className,
  maxWidth = 'lg'
}: ContentWrapperProps) {
  return (
    <div className={cn(
      'w-full mx-auto px-4 py-6',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
} 
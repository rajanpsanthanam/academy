import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  type: 'dashboard' | 'course' | 'module' | 'lesson';
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />}
          {item.href || item.onClick ? (
            <Button
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent hover:text-foreground capitalize"
              onClick={item.onClick}
            >
              {item.type}
            </Button>
          ) : (
            <span className="text-foreground capitalize">{item.type}</span>
          )}
        </div>
      ))}
    </div>
  );
} 
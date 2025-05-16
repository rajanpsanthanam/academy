import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { LucideIcon, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  path: string;
  subItems?: { label: string; path: string }[];
  isBottom?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ items, className = '', onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const renderMenuItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = item.path === '/admin' || item.path === '/portal'
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.includes(item.path);
    
    return (
      <div key={item.path} className="flex flex-col">
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            "w-full justify-start",
            hasSubItems && "mb-1"
          )}
          onClick={() => {
            if (hasSubItems) {
              toggleExpand(item.path);
            } else {
              navigate(item.path);
              onClose?.();
            }
          }}
        >
          <Icon className="mr-2 h-4 w-4" />
          {item.label}
          {hasSubItems && (
            <div className="ml-auto">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </Button>
        {hasSubItems && isExpanded && (
          <div className="ml-4 space-y-1">
            {item.subItems?.map((subItem) => {
              const isSubActive = location.pathname === subItem.path;
              return (
                <Button
                  key={subItem.path}
                  variant={isSubActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(subItem.path);
                    onClose?.();
                  }}
                >
                  {subItem.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const mainItems = items.filter(item => !item.isBottom);
  const bottomItems = items.filter(item => item.isBottom);

  return (
    <div className={`w-64 border-r bg-background h-[calc(100vh-4rem)] ${className}`}>
      <nav className="flex flex-col h-full">
        <div className="flex-1 p-4 space-y-1">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mb-4"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          {mainItems.map(renderMenuItem)}
        </div>
        {bottomItems.length > 0 && (
          <div className="p-4 border-t">
            {bottomItems.map(renderMenuItem)}
          </div>
        )}
      </nav>
    </div>
  );
} 
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { getMediaUrl } from '@/lib/utils';
import { Button } from '../ui/button';
import { Search, Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { OrganizationLogo } from './OrganizationLogo';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAuth();

  const logoUrl = state.user?.organization?.logo ? getMediaUrl(state.user.organization.logo) : null;
  const isAdminView = location.pathname.startsWith('/admin');

  const handleSearchClick = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <header className="border-b">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4 py-4 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={state.user?.organization?.name || "Organization"}
                className="h-8 w-auto"
              />
            ) : (
              <OrganizationLogo 
                name={state.user?.organization?.name || "Organization"} 
                className="h-8 w-8"
              />
            )}
          </div>
          <div className="md:hidden flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 h-9 px-3"
              onClick={handleSearchClick}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Search...</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <UserMenu />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 h-9 px-3"
            onClick={handleSearchClick}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Search...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
} 
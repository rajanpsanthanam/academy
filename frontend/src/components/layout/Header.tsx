import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { getMediaUrl } from '@/lib/utils';
import { Button } from '../ui/button';
import { Search, Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { SearchBar } from './SearchBar';
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
          <div className="flex-1 flex justify-center">
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
          <div className="md:hidden">
            <UserMenu />
          </div>
        </div>
        <div className="w-full md:w-auto md:flex-1 md:max-w-2xl px-4 md:px-0">
          {!isAdminView && <SearchBar />}
        </div>
        <div className="hidden md:block">
          <UserMenu />
        </div>
      </div>
    </header>
  );
} 
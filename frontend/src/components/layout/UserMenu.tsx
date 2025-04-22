import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { apiService } from '@/lib/services/apiService';
import { GeometricAvatar } from './GeometricAvatar';

export function UserMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useAuth();

  const isAdminView = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    try {
      await apiService.logout();
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAdminClick = () => {
    if (!isAdminView) {
      navigate('/admin', { replace: true });
    }
  };

  const handleDashboardClick = () => {
    if (isAdminView) {
      navigate('/portal', { replace: true });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={state.user?.email || ''} />
            <AvatarFallback>
              {state.user?.email ? (
                <GeometricAvatar email={state.user.email} />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  U
                </div>
              )}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{state.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {state.user?.is_staff && (
          <DropdownMenuItem onClick={isAdminView ? handleDashboardClick : handleAdminClick}>
            {isAdminView ? (
              <>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Portal</span>
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin</span>
              </>
            )}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
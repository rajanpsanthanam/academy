import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { MainSidebar } from './MainSidebar';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '../ui/button';
import { Menu } from 'lucide-react';

interface BaseLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showSidebar?: boolean;
  sidebarType?: 'main' | 'admin';
  className?: string;
}

export function BaseLayout({ 
  children, 
  showHeader = true,
  showSidebar = false,
  sidebarType = 'main',
  className = ''
}: BaseLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1200px] mx-auto">
        {showHeader && (
          <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        )}
        <div className="flex min-h-[calc(100vh-4rem)]">
          {showSidebar && (
            <>
              {/* Mobile Sidebar */}
              <div className={`lg:hidden fixed inset-0 bg-background/80 z-50 ${isSidebarOpen ? 'block' : 'hidden'}`}>
                <div className="w-64 h-full border-r bg-background">
                  {sidebarType === 'main' ? (
                    <MainSidebar onClose={() => setIsSidebarOpen(false)} />
                  ) : (
                    <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
                  )}
                </div>
              </div>
              
              {/* Desktop Sidebar */}
              <div className="hidden lg:block w-64 border-r bg-background">
                {sidebarType === 'main' ? <MainSidebar /> : <AdminSidebar />}
              </div>
            </>
          )}
          <main className={`flex-1 ${showSidebar ? 'lg:ml-0' : ''}`}>
            <div className="h-full px-4 py-6">
              <div className="max-w-3xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 
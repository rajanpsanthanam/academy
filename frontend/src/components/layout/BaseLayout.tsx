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
      {/* Main Container */}
      <div className="min-h-screen flex justify-center">
        <div className="w-full max-w-[1200px] relative">
          {/* Fixed Header */}
          {showHeader && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-background">
              <div className="flex justify-center">
                <div className="w-full max-w-[1200px] border-b">
                  <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                </div>
              </div>
            </div>
          )}

          {/* Sidebar */}
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
              <div className="hidden lg:block fixed top-16 w-64 h-[calc(100vh-4rem)] border-r bg-background">
                {sidebarType === 'main' ? <MainSidebar /> : <AdminSidebar />}
              </div>
            </>
          )}

          {/* Content Area */}
          <div className={`flex-1 ${showSidebar ? 'lg:ml-64' : ''} ${showHeader ? 'mt-16' : ''}`}>
            <main className="h-full px-4 py-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
} 
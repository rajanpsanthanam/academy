import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Left side with modern design */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-16 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200/5 via-slate-300/5 to-slate-400/5 animate-gradient" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-slate-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-slate-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-slate-500/20 rounded-full blur-3xl animate-float-more-delayed" />
        
        {/* Content */}
        <div className="relative z-10 text-center space-y-6">
          <h1 className="text-5xl font-bold text-slate-800 mb-4 animate-fade-in">
            Welcome Back
          </h1>
          <p className="text-xl text-slate-600 animate-fade-in-delayed">
            Your learning journey starts here
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <div className="w-12 h-12 rounded-full bg-slate-300/20 animate-bounce" />
            <div className="w-12 h-12 rounded-full bg-slate-400/20 animate-bounce-delayed" />
            <div className="w-12 h-12 rounded-full bg-slate-500/20 animate-bounce-more-delayed" />
          </div>
        </div>
      </div>

      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
} 
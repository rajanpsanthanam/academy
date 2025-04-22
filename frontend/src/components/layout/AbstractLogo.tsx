import { cn } from '@/lib/utils';

interface AbstractLogoProps {
  className?: string;
}

export function AbstractLogo({ className }: AbstractLogoProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative w-8 h-8">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/40" />
        
        {/* Overlapping shapes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary/60" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary/60" />
        </div>
        
        {/* Accent elements */}
        <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-primary/80" />
        <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-primary/80" />
      </div>
    </div>
  );
} 
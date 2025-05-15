import { cn } from '@/lib/utils';

interface OrganizationLogoProps {
  name: string;
  className?: string;
}

export function OrganizationLogo({ name, className }: OrganizationLogoProps) {
  // Get the first letter of the organization name
  const initial = name.charAt(0).toUpperCase();
  
  // Generate a consistent color based on the organization name
  const getColor = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const bgColor = getColor(name);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
        style={{ backgroundColor: bgColor }}
      >
        {initial}
      </div>
    </div>
  );
} 
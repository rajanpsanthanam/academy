import { getInitials, stringToColor, getShape } from '@/lib/utils/avatar';

interface GeometricAvatarProps {
  email: string;
}

export function GeometricAvatar({ email }: GeometricAvatarProps) {
  const color = stringToColor(email);
  const shape = getShape(email);
  const initials = getInitials(email);

  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      {shape === 'circle' && (
        <div className="w-6 h-6 rounded-full bg-white/20" />
      )}
      {shape === 'square' && (
        <div className="w-6 h-6 bg-white/20" />
      )}
      {shape === 'triangle' && (
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-white/20" />
      )}
    </div>
  );
} 
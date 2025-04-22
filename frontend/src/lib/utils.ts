import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(path: string | null): string | null {
  if (!path) return null;
  
  // Check if the path is already an absolute URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Use environment variable or default to localhost:8000
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  // Remove any leading slashes from the path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${backendUrl}/${cleanPath}`;
}

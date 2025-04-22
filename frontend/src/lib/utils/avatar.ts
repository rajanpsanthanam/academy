export function getInitials(email: string): string {
  return email
    .split('@')[0]
    .split('.')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

export function getShape(str: string): string {
  const shapes = ['circle', 'square', 'triangle'];
  const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % shapes.length;
  return shapes[index];
} 
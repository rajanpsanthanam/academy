# Layout System Documentation

## Overview
The layout system is designed to provide a consistent and maintainable structure for the application. It uses a combination of React components and Tailwind CSS for styling.

## Component Structure

### BaseLayout
The root layout component that provides the basic structure for all pages.

```tsx
<BaseLayout>
  ├── Header
  └── Content Area
      ├── Sidebar
      └── Main Content
</BaseLayout>
```

#### Props
- `children`: ReactNode - The main content to be displayed
- `showHeader`: boolean (default: true) - Controls header visibility
- `showSidebar`: boolean (default: false) - Controls sidebar visibility
- `sidebarType`: 'main' | 'admin' - Determines which sidebar to display
- `className`: string - Additional CSS classes

### Header
The top navigation bar that spans the full width of the container.

```tsx
<Header>
  ├── Logo
  ├── Search Bar
  └── User Menu
</Header>
```

### Sidebar System
A reusable sidebar system with two implementations:

1. **MainSidebar**
   - Dashboard
   - My Courses
   - Learning Path
   - Settings

2. **AdminSidebar**
   - Dashboard
   - Users
   - Courses
   - Settings

#### Shared Sidebar Component
The base `Sidebar` component that both main and admin sidebars use:

```tsx
interface SidebarItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}
```

## Styling

### Container Width
- Max-width: 1440px
- Centered on the page
- Responsive design

### Spacing
- Header height: 4rem (64px)
- Sidebar width: 16rem (256px)
- Content padding: 1rem (16px)

### Colors
- Background: bg-background
- Borders: border-r for sidebar
- Active states: secondary variant for buttons

## Usage Examples

### Main Layout
```tsx
<BaseLayout showSidebar sidebarType="main">
  <YourComponent />
</BaseLayout>
```

### Admin Layout
```tsx
<BaseLayout showSidebar sidebarType="admin">
  <YourAdminComponent />
</BaseLayout>
```

### Without Sidebar
```tsx
<BaseLayout showSidebar={false}>
  <YourComponent />
</BaseLayout>
```

## Best Practices

1. **Component Usage**
   - Always use `BaseLayout` as the root component for pages
   - Use appropriate `sidebarType` for different sections
   - Keep content within the max-width container

2. **Styling**
   - Use Tailwind classes consistently
   - Maintain proper spacing and alignment
   - Follow the established color scheme

3. **Responsive Design**
   - The layout is responsive by default
   - Content adjusts to container width
   - Sidebar remains fixed width

## Future Improvements

1. **Responsive Sidebar**
   - Add mobile-friendly sidebar
   - Implement collapse/expand functionality
   - Add responsive breakpoints

2. **Theme Support**
   - Add dark/light mode support
   - Implement theme switching
   - Maintain consistent styling

3. **Accessibility**
   - Add ARIA labels
   - Improve keyboard navigation
   - Ensure proper contrast ratios 
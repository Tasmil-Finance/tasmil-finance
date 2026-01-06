# Two-Sidebar Layout Setup Guide

This guide covers the complete setup and configuration of the Two-Sidebar layout system for building responsive multi-panel interfaces in your Next.js frontend.

## Prerequisites

- Node.js 18+ and pnpm
- Next.js 14+ project with TypeScript
- Tailwind CSS configured
- Basic understanding of React hooks and context

## Installation

### 1. Core Dependencies

The following packages are required for the Two-Sidebar layout:

```json
{
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-separator": "^1.1.8",
  "@radix-ui/react-sheet": "^1.2.4",
  "@radix-ui/react-tooltip": "^1.2.8",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^0.562.0"
}
```

### 2. Supporting Libraries

Required for responsive behavior and animations:

```json
{
  "framer-motion": "^12.23.26",
  "tailwind-merge": "^3.4.0",
  "tailwindcss-animate": "^1.0.7"
}
```

## File Structure

After setup, your project will have the following Two-Sidebar related structure:

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── sidebar.tsx              # Single sidebar component
│   │   │   ├── multi-sidebar.tsx        # Multi-sidebar provider & hooks
│   │   │   ├── sheet.tsx                # Mobile sheet component
│   │   │   └── button-v2.tsx            # Button component
│   │   └── layout/
│   │       ├── multi-sidebar-layout.tsx # Main layout component
│   │       ├── app-sidebar.tsx          # Left sidebar content
│   │       ├── chat-history-sidebar.tsx # Right sidebar content
│   │       ├── chat-history-wrapper.tsx # Chat history container
│   │       ├── mobile-sidebar-content.tsx # Mobile sidebar content
│   │       ├── header-sidebar.tsx       # Sidebar header
│   │       ├── footer-sidebar.tsx       # Sidebar footer
│   │       ├── nav-group.tsx            # Navigation group
│   │       └── sidebar-data.ts          # Sidebar configuration
│   └── hooks/
│       └── common/
│           └── use-mobile.ts            # Mobile detection hook
└── docs/
    └── two-sidebar/                     # Documentation
```

## Core Components

### 1. Multi-Sidebar Provider (`src/components/ui/multi-sidebar.tsx`)

The main provider that manages two-sidebar state:

```typescript
type MultiSidebarContextProps = {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  isMobile: boolean;
};
```

Key features:
- **Dual Sidebar Management**: Independent control of left and right sidebars
- **Mobile Responsiveness**: Automatic mobile detection and behavior
- **State Persistence**: Cookie-based state persistence for desktop
- **Context Provider**: React context for accessing sidebar state

### 2. Multi-Sidebar Layout (`src/components/layout/multi-sidebar-layout.tsx`)

The main layout component that orchestrates the entire interface:

```typescript
interface MultiSidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
  showRightSidebar?: boolean;
  showHeader?: boolean;
}
```

Features:
- **Responsive Design**: Different layouts for mobile and desktop
- **Flexible Configuration**: Optional right sidebar and header
- **Smooth Animations**: CSS transitions for sidebar state changes
- **Mobile Sheets**: Sheet components for mobile sidebar display

### 3. Sidebar Components

Individual sidebar components for different content:

- **AppSidebar**: Main navigation sidebar (left)
- **ChatHistoryWrapper**: Chat history sidebar (right)
- **MobileSidebarContent**: Mobile-optimized sidebar content

## Configuration Files

### 1. Sidebar Data (`src/components/layout/sidebar-data.ts`)

Centralized configuration for sidebar content:

```typescript
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType;
  badge?: string;
  disabled?: boolean;
}

export interface NavGroup {
  items: NavItem[];
}

export interface SidebarData {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navGroups: NavGroup[];
}
```

### 2. Mobile Detection Hook (`src/hooks/common/use-mobile.ts`)

Custom hook for responsive behavior:

```typescript
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
}
```

## CSS Configuration

### 1. Tailwind CSS Variables

Add these CSS variables to your global styles:

```css
/* globals.css */
:root {
  --left-sidebar-width: 16rem;
  --right-sidebar-width: 20rem;
  --sidebar-width-icon: 5rem;
}

/* Sidebar animations */
.sidebar-transition {
  transition: width 300ms ease-in-out, transform 300ms ease-in-out;
}

/* Mobile sheet animations */
.sheet-enter {
  transform: translateX(-100%);
}

.sheet-enter-active {
  transform: translateX(0);
  transition: transform 300ms ease-out;
}

.sheet-exit {
  transform: translateX(0);
}

.sheet-exit-active {
  transform: translateX(-100%);
  transition: transform 300ms ease-in;
}
```

### 2. Responsive Breakpoints

Configure Tailwind breakpoints for sidebar behavior:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',    // Sidebar breakpoint
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}
```

## Setup Process

### 1. Basic Layout Setup

```tsx
// app/layout.tsx
import { MultiSidebarLayout } from '@/components/layout/multi-sidebar-layout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MultiSidebarLayout>
          {children}
        </MultiSidebarLayout>
      </body>
    </html>
  );
}
```

### 2. Page-Specific Configuration

```tsx
// app/dashboard/page.tsx
import { MultiSidebarLayout } from '@/components/layout/multi-sidebar-layout';

export default function DashboardPage() {
  return (
    <MultiSidebarLayout 
      showRightSidebar={true}
      showHeader={true}
    >
      <div className="p-6">
        <h1>Dashboard Content</h1>
        {/* Your page content */}
      </div>
    </MultiSidebarLayout>
  );
}
```

### 3. Custom Sidebar Content

```tsx
// components/layout/custom-sidebar.tsx
import { SidebarContent, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';

export function CustomSidebar() {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="font-semibold">Your App</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav className="space-y-2">
          <a href="/dashboard" className="sidebar-link">
            Dashboard
          </a>
          <a href="/settings" className="sidebar-link">
            Settings
          </a>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <div className="user-info">
          <span>John Doe</span>
          <span className="text-sm text-muted-foreground">john@example.com</span>
        </div>
      </SidebarFooter>
    </>
  );
}
```

## Mobile Configuration

### 1. Mobile-First Approach

The layout automatically adapts to mobile devices:

```typescript
// Mobile behavior
- Left sidebar: Slides in from left as sheet
- Right sidebar: Slides in from right as sheet
- Both sidebars: Closed by default on mobile
- Header: Compact mobile header with hamburger menu
```

### 2. Mobile Sheet Configuration

```tsx
// Mobile sheet customization
<Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
  <SheetContent 
    side="left" 
    className="w-[280px] p-0"
  >
    <MobileSidebarContent onClose={() => setLeftSidebarOpen(false)} />
  </SheetContent>
</Sheet>
```

### 3. Touch Gestures

Enable swipe gestures for mobile:

```typescript
// Add to mobile sheet component
const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0].clientX;
};

const handleTouchEnd = (e: TouchEvent) => {
  const touchEndX = e.changedTouches[0].clientX;
  const swipeDistance = touchStartX - touchEndX;
  
  if (swipeDistance > 50) {
    // Swipe left - close sidebar
    setLeftSidebarOpen(false);
  }
};
```

## State Management

### 1. Sidebar State Persistence

Desktop sidebar states are persisted using cookies:

```typescript
const MULTI_SIDEBAR_COOKIE_NAME = "multi_sidebar_state";
const MULTI_SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Save state
document.cookie = `${MULTI_SIDEBAR_COOKIE_NAME}_left=${newState}; path=/; max-age=${MULTI_SIDEBAR_COOKIE_MAX_AGE}`;
```

### 2. Initial State Configuration

```tsx
// Load initial state from cookies
const getInitialSidebarState = (side: 'left' | 'right', defaultValue: boolean) => {
  if (typeof window === 'undefined') return defaultValue;
  
  const cookieName = `${MULTI_SIDEBAR_COOKIE_NAME}_${side}`;
  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
  
  if (cookie) {
    return cookie.split('=')[1] === 'true';
  }
  
  return defaultValue;
};
```

### 3. Context Integration

```tsx
// Using sidebar context in components
import { useMultiSidebar } from '@/components/ui/multi-sidebar';

export function MyComponent() {
  const { 
    leftSidebarOpen, 
    rightSidebarOpen, 
    toggleLeftSidebar, 
    toggleRightSidebar 
  } = useMultiSidebar();

  return (
    <div>
      <button onClick={toggleLeftSidebar}>
        Toggle Left Sidebar
      </button>
      <button onClick={toggleRightSidebar}>
        Toggle Right Sidebar
      </button>
    </div>
  );
}
```

## Animation Configuration

### 1. CSS Transitions

```css
/* Sidebar animations */
.sidebar-container {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-content {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile sheet animations */
.mobile-sheet {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Framer Motion Integration

```tsx
// Enhanced animations with Framer Motion
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedSidebar({ isOpen, children }: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'var(--sidebar-width)', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="sidebar-container"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Accessibility Configuration

### 1. ARIA Labels and Roles

```tsx
// Accessible sidebar implementation
<div
  role="navigation"
  aria-label="Main navigation"
  aria-expanded={leftSidebarOpen}
>
  <button
    aria-label="Toggle navigation sidebar"
    aria-controls="left-sidebar"
    onClick={toggleLeftSidebar}
  >
    <PanelLeft />
  </button>
</div>
```

### 2. Keyboard Navigation

```tsx
// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + B to toggle left sidebar
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      toggleLeftSidebar();
    }
    
    // Ctrl/Cmd + Shift + B to toggle right sidebar
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
      event.preventDefault();
      toggleRightSidebar();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [toggleLeftSidebar, toggleRightSidebar]);
```

### 3. Focus Management

```tsx
// Focus management for mobile sheets
const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const trapFocus = (element: HTMLElement) => {
  const focusable = element.querySelectorAll(focusableElements);
  const firstFocusable = focusable[0] as HTMLElement;
  const lastFocusable = focusable[focusable.length - 1] as HTMLElement;

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });
};
```

## Troubleshooting

### Common Issues

1. **Sidebar not showing on mobile**
   - Check mobile detection hook is working
   - Verify sheet components are properly imported
   - Ensure z-index values are correct

2. **State not persisting**
   - Check cookie settings and domain
   - Verify localStorage fallback is implemented
   - Test in different browsers

3. **Animation glitches**
   - Check CSS transition properties
   - Verify transform origins are set correctly
   - Test on different screen sizes

4. **Layout shifts**
   - Use CSS Grid or Flexbox for stable layouts
   - Set explicit widths for sidebar containers
   - Implement proper loading states

### Debug Commands

```bash
# Check responsive behavior
# Resize browser window and check console
console.log('Mobile:', window.innerWidth < 768);

# Check sidebar state
console.log('Left sidebar:', leftSidebarOpen);
console.log('Right sidebar:', rightSidebarOpen);

# Check cookies
console.log('Cookies:', document.cookie);
```

## Performance Optimization

### 1. Lazy Loading

```tsx
// Lazy load sidebar content
const LazyRightSidebar = lazy(() => import('./right-sidebar'));

export function OptimizedLayout({ children }: { children: React.ReactNode }) {
  const { rightSidebarOpen } = useMultiSidebar();

  return (
    <div className="layout">
      {children}
      {rightSidebarOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <LazyRightSidebar />
        </Suspense>
      )}
    </div>
  );
}
```

### 2. Memoization

```tsx
// Memoize sidebar components
const MemoizedLeftSidebar = memo(LeftSidebar);
const MemoizedRightSidebar = memo(RightSidebar);

export function PerformantLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarProvider>
      <MemoizedLeftSidebar />
      <main>{children}</main>
      <MemoizedRightSidebar />
    </MultiSidebarProvider>
  );
}
```

### 3. CSS Optimization

```css
/* Use transform instead of width for better performance */
.sidebar-optimized {
  width: var(--sidebar-width);
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
}

.sidebar-optimized.open {
  transform: translateX(0);
}

/* Use will-change for animations */
.sidebar-animating {
  will-change: transform;
}
```

## Best Practices

1. **Mobile-First Design**: Always design for mobile first, then enhance for desktop
2. **Accessibility**: Include proper ARIA labels and keyboard navigation
3. **Performance**: Use CSS transforms for animations, lazy load content
4. **State Management**: Persist sidebar states appropriately
5. **Testing**: Test on various screen sizes and devices
6. **User Experience**: Provide clear visual feedback for all interactions

## Next Steps

Once setup is complete, see the [Usage Guide](./usage.md) for detailed examples of how to customize sidebar content, implement advanced features, and integrate with your application's routing and state management.
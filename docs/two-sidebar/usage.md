# Two-Sidebar Layout Usage Guide

This guide covers how to effectively use the Two-Sidebar layout system to build responsive multi-panel interfaces with customizable sidebars and advanced features.

## Basic Usage Patterns

### 1. Simple Two-Sidebar Layout

```tsx
import { MultiSidebarLayout } from '@/components/layout/multi-sidebar-layout';

export function BasicLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout 
      showRightSidebar={true}
      showHeader={true}
    >
      <div className="p-6">
        {children}
      </div>
    </MultiSidebarLayout>
  );
}

// Usage in page
export default function DashboardPage() {
  return (
    <BasicLayout>
      <h1>Dashboard</h1>
      <p>Your main content goes here</p>
    </BasicLayout>
  );
}
```

### 2. Conditional Sidebar Display

```tsx
import { MultiSidebarLayout } from '@/components/layout/multi-sidebar-layout';
import { useRouter } from 'next/router';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // Show right sidebar only on specific routes
  const showRightSidebar = ['/chat', '/messages'].includes(router.pathname);
  
  // Hide header on fullscreen routes
  const showHeader = !router.pathname.startsWith('/fullscreen');

  return (
    <MultiSidebarLayout 
      showRightSidebar={showRightSidebar}
      showHeader={showHeader}
    >
      {children}
    </MultiSidebarLayout>
  );
}
```

### 3. Custom Sidebar Triggers

```tsx
import { useMultiSidebar } from '@/components/ui/multi-sidebar';
import { PanelLeft, MessageSquare } from 'lucide-react';

export function CustomHeader() {
  const { toggleLeftSidebar, toggleRightSidebar, leftSidebarOpen, rightSidebarOpen } = useMultiSidebar();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleLeftSidebar}
          className={`p-2 rounded-md transition-colors ${
            leftSidebarOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
          }`}
          aria-label="Toggle navigation"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">My Application</h1>
      </div>

      <button
        onClick={toggleRightSidebar}
        className={`p-2 rounded-md transition-colors ${
          rightSidebarOpen ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'
        }`}
        aria-label="Toggle chat"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    </header>
  );
}
```

## Advanced Sidebar Customization

### 1. Dynamic Left Sidebar Content

```tsx
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { Home, Settings, Users, BarChart } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  active?: boolean;
}

export function DynamicLeftSidebar({ user, navItems }: {
  user: { name: string; email: string; avatar: string };
  navItems: NavItem[];
}) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-2">
          <img 
            src={user.avatar} 
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={item.active}
                  tooltip={item.title}
                >
                  <a href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-3">
          <button className="w-full text-left p-2 rounded-md hover:bg-gray-100 text-sm">
            Sign Out
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
```

### 2. Collapsible Navigation Groups

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { 
  SidebarGroup, 
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';

interface NavGroup {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export function CollapsibleNavGroup({ group }: { group: NavGroup }) {
  const [isOpen, setIsOpen] = useState(group.defaultOpen ?? true);

  return (
    <SidebarGroup>
      <SidebarGroupLabel asChild>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full"
        >
          <span>{group.title}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </SidebarGroupLabel>

      {isOpen && (
        <SidebarMenu>
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={item.active}>
                <a href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
}
```

### 3. Right Sidebar with Tabs

```tsx
import { useState } from 'react';
import { MessageSquare, Clock, Bell } from 'lucide-react';

type TabType = 'chat' | 'history' | 'notifications';

export function TabbedRightSidebar() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const tabs = [
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare },
    { id: 'history' as TabType, label: 'History', icon: Clock },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Headers */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatContent />}
        {activeTab === 'history' && <HistoryContent />}
        {activeTab === 'notifications' && <NotificationsContent />}
      </div>
    </div>
  );
}

function ChatContent() {
  return (
    <div className="h-full p-4">
      <h3 className="font-semibold mb-4">Chat</h3>
      {/* Chat interface */}
    </div>
  );
}

function HistoryContent() {
  return (
    <div className="h-full p-4">
      <h3 className="font-semibold mb-4">History</h3>
      {/* History list */}
    </div>
  );
}

function NotificationsContent() {
  return (
    <div className="h-full p-4">
      <h3 className="font-semibold mb-4">Notifications</h3>
      {/* Notifications list */}
    </div>
  );
}
```

## Responsive Behavior Customization

### 1. Custom Mobile Layout

```tsx
import { useIsMobile } from '@/hooks/common/use-mobile';
import { useMultiSidebar } from '@/components/ui/multi-sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export function CustomMobileLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { 
    leftSidebarOpen, 
    rightSidebarOpen, 
    setLeftSidebarOpen, 
    setRightSidebarOpen 
  } = useMultiSidebar();

  if (!isMobile) {
    return <DesktopLayout>{children}</DesktopLayout>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Left Mobile Sheet */}
      <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <MobileNavigation onClose={() => setLeftSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Right Mobile Sheet */}
      <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
        <SheetContent side="right" className="w-[320px] p-0">
          <MobileRightPanel onClose={() => setRightSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

### 2. Breakpoint-Specific Behavior

```tsx
import { useEffect, useState } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const breakpoint = useBreakpoint();
  const showRightSidebar = ['lg', 'xl', '2xl'].includes(breakpoint);
  const showLeftSidebar = breakpoint !== 'sm';

  return (
    <MultiSidebarLayout 
      showRightSidebar={showRightSidebar}
      showHeader={true}
      className={`breakpoint-${breakpoint}`}
    >
      {children}
    </MultiSidebarLayout>
  );
}
```

### 3. Adaptive Sidebar Width

```tsx
import { useEffect, useState } from 'react';

export function AdaptiveSidebar({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState('16rem');

  useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth;
      if (width < 1024) setSidebarWidth('14rem');
      else if (width < 1280) setSidebarWidth('16rem');
      else setSidebarWidth('18rem');
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div 
      className="sidebar-adaptive"
      style={{ '--sidebar-width': sidebarWidth } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
```

## State Management Integration

### 1. Redux Integration

```tsx
import { useSelector, useDispatch } from 'react-redux';
import { toggleLeftSidebar, toggleRightSidebar } from '@/store/ui-slice';

export function ReduxSidebarLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { leftSidebarOpen, rightSidebarOpen } = useSelector((state: RootState) => state.ui);

  const handleToggleLeft = () => dispatch(toggleLeftSidebar());
  const handleToggleRight = () => dispatch(toggleRightSidebar());

  return (
    <div className="layout-with-redux">
      <button onClick={handleToggleLeft}>Toggle Left</button>
      <button onClick={handleToggleRight}>Toggle Right</button>
      
      <MultiSidebarProvider 
        defaultLeftOpen={leftSidebarOpen}
        defaultRightOpen={rightSidebarOpen}
      >
        {children}
      </MultiSidebarProvider>
    </div>
  );
}
```

### 2. Zustand Integration

```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebar: (open: boolean) => void;
  setRightSidebar: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      leftSidebarOpen: true,
      rightSidebarOpen: false,
      toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setLeftSidebar: (open) => set({ leftSidebarOpen: open }),
      setRightSidebar: (open) => set({ rightSidebarOpen: open }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
);

export function ZustandSidebarLayout({ children }: { children: React.ReactNode }) {
  const { 
    leftSidebarOpen, 
    rightSidebarOpen, 
    toggleLeftSidebar, 
    toggleRightSidebar 
  } = useSidebarStore();

  return (
    <MultiSidebarProvider 
      defaultLeftOpen={leftSidebarOpen}
      defaultRightOpen={rightSidebarOpen}
    >
      {children}
    </MultiSidebarProvider>
  );
}
```

### 3. URL State Synchronization

```tsx
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function URLSyncedSidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { leftSidebarOpen, rightSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen } = useMultiSidebar();

  // Sync URL params with sidebar state
  useEffect(() => {
    const { leftSidebar, rightSidebar } = router.query;
    
    if (leftSidebar !== undefined) {
      setLeftSidebarOpen(leftSidebar === 'true');
    }
    
    if (rightSidebar !== undefined) {
      setRightSidebarOpen(rightSidebar === 'true');
    }
  }, [router.query]);

  // Update URL when sidebar state changes
  useEffect(() => {
    const query = { ...router.query };
    
    if (leftSidebarOpen !== undefined) {
      query.leftSidebar = leftSidebarOpen.toString();
    }
    
    if (rightSidebarOpen !== undefined) {
      query.rightSidebar = rightSidebarOpen.toString();
    }

    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [leftSidebarOpen, rightSidebarOpen]);

  return <>{children}</>;
}
```

## Advanced Features

### 1. Resizable Sidebars

```tsx
import { useState, useRef, useCallback } from 'react';

export function ResizableSidebar({ 
  children, 
  minWidth = 200, 
  maxWidth = 400, 
  defaultWidth = 300 
}: {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing && sidebarRef.current) {
        const newWidth = mouseMoveEvent.clientX - sidebarRef.current.offsetLeft;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing, minWidth, maxWidth]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div
      ref={sidebarRef}
      className="resizable-sidebar"
      style={{ width: `${width}px` }}
    >
      {children}
      <div
        className="resize-handle"
        onMouseDown={startResizing}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#3b82f6' : 'transparent',
        }}
      />
    </div>
  );
}
```

### 2. Sidebar with Search

```tsx
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface SearchableSidebarProps {
  items: NavItem[];
  placeholder?: string;
}

export function SearchableSidebar({ items, placeholder = "Search..." }: SearchableSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.href.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <a href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No items found
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
```

### 3. Contextual Right Sidebar

```tsx
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export function ContextualRightSidebar() {
  const router = useRouter();

  const sidebarContent = useMemo(() => {
    switch (router.pathname) {
      case '/dashboard':
        return <DashboardSidebar />;
      case '/chat':
        return <ChatSidebar />;
      case '/settings':
        return <SettingsSidebar />;
      default:
        return <DefaultSidebar />;
    }
  }, [router.pathname]);

  return (
    <div className="contextual-sidebar">
      {sidebarContent}
    </div>
  );
}

function DashboardSidebar() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Dashboard Tools</h3>
      <div className="space-y-2">
        <button className="w-full text-left p-2 rounded hover:bg-gray-100">
          Export Data
        </button>
        <button className="w-full text-left p-2 rounded hover:bg-gray-100">
          Generate Report
        </button>
      </div>
    </div>
  );
}

function ChatSidebar() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Chat History</h3>
      {/* Chat history content */}
    </div>
  );
}

function SettingsSidebar() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Quick Settings</h3>
      {/* Settings shortcuts */}
    </div>
  );
}

function DefaultSidebar() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Tools</h3>
      <p className="text-gray-500">No specific tools for this page</p>
    </div>
  );
}
```

## Animation and Transitions

### 1. Custom Animations

```tsx
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedSidebarLayout({ children }: { children: React.ReactNode }) {
  const { leftSidebarOpen, rightSidebarOpen } = useMultiSidebar();

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <AnimatePresence>
        {leftSidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-64 bg-white border-r"
          >
            <LeftSidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        animate={{
          marginLeft: leftSidebarOpen ? 0 : 0,
          marginRight: rightSidebarOpen ? 0 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1"
      >
        {children}
      </motion.main>

      {/* Right Sidebar */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-80 bg-white border-l"
          >
            <RightSidebarContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 2. Staggered Animations

```tsx
import { motion } from 'framer-motion';

export function StaggeredNavigation({ items }: { items: NavItem[] }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.nav
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {items.map((item, index) => (
        <motion.div key={item.href} variants={itemVariants}>
          <a
            href={item.href}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </a>
        </motion.div>
      ))}
    </motion.nav>
  );
}
```

## Performance Optimization

### 1. Virtual Scrolling for Large Lists

```tsx
import { FixedSizeList as List } from 'react-window';

export function VirtualizedSidebar({ items }: { items: NavItem[] }) {
  const ItemRenderer = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <a
        href={items[index].href}
        className="flex items-center gap-3 p-2 hover:bg-gray-100"
      >
        <items[index].icon className="h-4 w-4" />
        <span>{items[index].title}</span>
      </a>
    </div>
  );

  return (
    <Sidebar>
      <SidebarContent>
        <List
          height={600}
          itemCount={items.length}
          itemSize={40}
          itemData={items}
        >
          {ItemRenderer}
        </List>
      </SidebarContent>
    </Sidebar>
  );
}
```

### 2. Lazy Loading Sidebar Content

```tsx
import { lazy, Suspense } from 'react';

const LazyRightSidebar = lazy(() => import('./right-sidebar'));
const LazyLeftSidebar = lazy(() => import('./left-sidebar'));

export function LazyLoadedLayout({ children }: { children: React.ReactNode }) {
  const { leftSidebarOpen, rightSidebarOpen } = useMultiSidebar();

  return (
    <div className="flex h-screen">
      {leftSidebarOpen && (
        <Suspense fallback={<SidebarSkeleton />}>
          <LazyLeftSidebar />
        </Suspense>
      )}

      <main className="flex-1">
        {children}
      </main>

      {rightSidebarOpen && (
        <Suspense fallback={<SidebarSkeleton />}>
          <LazyRightSidebar />
        </Suspense>
      )}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="w-64 bg-gray-100 animate-pulse">
      <div className="p-4 space-y-4">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
}
```

## Testing

### 1. Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiSidebarLayout } from '@/components/layout/multi-sidebar-layout';

describe('MultiSidebarLayout', () => {
  it('toggles left sidebar correctly', () => {
    render(
      <MultiSidebarLayout>
        <div>Test content</div>
      </MultiSidebarLayout>
    );

    const toggleButton = screen.getByLabelText('Toggle navigation');
    fireEvent.click(toggleButton);

    // Assert sidebar state change
  });

  it('adapts to mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(
      <MultiSidebarLayout>
        <div>Test content</div>
      </MultiSidebarLayout>
    );

    // Assert mobile behavior
  });
});
```

### 2. Hook Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useMultiSidebar, MultiSidebarProvider } from '@/components/ui/multi-sidebar';

describe('useMultiSidebar', () => {
  it('toggles sidebar state correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MultiSidebarProvider>{children}</MultiSidebarProvider>
    );

    const { result } = renderHook(() => useMultiSidebar(), { wrapper });

    act(() => {
      result.current.toggleLeftSidebar();
    });

    expect(result.current.leftSidebarOpen).toBe(false);
  });
});
```

## Best Practices

1. **Responsive Design**: Always test on multiple screen sizes
2. **Accessibility**: Include proper ARIA labels and keyboard navigation
3. **Performance**: Use lazy loading and virtualization for large datasets
4. **State Management**: Choose appropriate state management based on complexity
5. **Animation**: Use CSS transforms for better performance
6. **Testing**: Write comprehensive tests for sidebar functionality
7. **User Experience**: Provide clear visual feedback and smooth transitions

## Common Use Cases

### Dashboard Layout

```tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout 
      showRightSidebar={true}
      showHeader={true}
    >
      <div className="p-6 space-y-6">
        {children}
      </div>
    </MultiSidebarLayout>
  );
}
```

### Chat Application

```tsx
export function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout 
      showRightSidebar={true}
      showHeader={false}
    >
      <div className="h-full flex flex-col">
        {children}
      </div>
    </MultiSidebarLayout>
  );
}
```

### Settings Page

```tsx
export function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout 
      showRightSidebar={false}
      showHeader={true}
    >
      <div className="max-w-4xl mx-auto p-6">
        {children}
      </div>
    </MultiSidebarLayout>
  );
}
```

This comprehensive usage guide should help you build sophisticated multi-sidebar layouts with advanced features, responsive behavior, and optimal performance. Remember to consider accessibility, test thoroughly, and optimize for your specific use cases.
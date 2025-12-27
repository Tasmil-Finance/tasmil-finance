"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const [activeRect, setActiveRect] = React.useState<DOMRect | null>(null);
  const listRef: React.MutableRefObject<HTMLDivElement | null> =
    React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateActiveTab = () => {
      const activeTab = list.querySelector('[data-state="active"]');
      if (activeTab) {
        setActiveRect(activeTab.getBoundingClientRect());
      }
    };

    updateActiveTab();
    const observer = new MutationObserver(updateActiveTab);
    observer.observe(list, { attributes: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.List
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center rounded-full bg-foreground/5 p-1 text-muted-foreground",
        className
      )}
      ref={(node) => {
        if (typeof ref === "function") ref(node);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        else if (ref) (ref as any).current = node;
        listRef.current = node;
      }}
      {...props}
    >
      {props.children}
      {activeRect && (
        <motion.div
          animate={{
            width: activeRect.width,
            x:
              activeRect.left -
              (listRef.current?.getBoundingClientRect().left || 0),
          }}
          initial={false}
          style={{
            position: "absolute",
            top: "8%",
            left: "0",
            bottom: "8%",
            height: "84%",
            borderRadius: "9999px",
            backgroundColor: "rgba(74,74,80,0.3)",
            zIndex: 0,
            cursor: "pointer",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
      )}
    </TabsPrimitive.List>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    className={cn(
      "relative z-20 inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 font-medium text-base transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-white",
      className
    )}
    ref={ref}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    asChild
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    ref={ref}
    {...props}
  >
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      {props.children}
    </motion.div>
  </TabsPrimitive.Content>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

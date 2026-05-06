"use client";

import type { ActivityItem } from "@/features/account/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { FarmingActivity } from "./farming-activity";

interface ActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: ActivityItem[] | undefined;
  isLoading: boolean;
}

export function ActivityDrawer({ open, onOpenChange, activities, isLoading }: ActivityDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Activity Timeline</SheetTitle>
          <SheetDescription>
            Full history of account actions and automation events.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <FarmingActivity activities={activities} isLoading={isLoading} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

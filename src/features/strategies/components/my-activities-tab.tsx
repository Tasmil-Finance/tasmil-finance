"use client";

import { FileSearch, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/lib/utils";
import type { MyActivities } from "../types";

interface MyActivitiesTabProps {
  myActivities: MyActivities;
  className?: string;
}

export function MyActivitiesTab({
  myActivities,
  className,
}: MyActivitiesTabProps) {
  if (myActivities.status === "Empty") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <FileSearch className="h-12 w-12 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg">{myActivities.message}</p>
        <a
          href="https://debank.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-primary hover:underline"
        >
          View Your Positions on DeBank
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <p className="text-muted-foreground">Activities will appear here</p>
      </CardContent>
    </Card>
  );
}

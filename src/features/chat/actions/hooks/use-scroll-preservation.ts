"use client";

import { useCallback, useEffect, useRef } from "react";

/** Global scroll position store - persists across re-renders. */
const scrollPositions = new Map<string, number>();

/** Hook to preserve scroll position of a scrollable container across re-renders. */
export function useScrollPreservation(id: string) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    const savedPos = scrollPositions.get(id);
    if (el && savedPos !== undefined && savedPos > 0) {
      requestAnimationFrame(() => {
        el.scrollTop = savedPos;
      });
    }
  }, [id]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      scrollPositions.set(id, e.currentTarget.scrollTop);
    },
    [id]
  );

  return { scrollRef, handleScroll };
}

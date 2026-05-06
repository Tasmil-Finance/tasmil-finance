"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/ui/button";
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from "@/shared/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";
import { useOnboardingStore } from "@/store/use-onboarding";
import { welcomeSlides } from "../config/welcome-slides-data";
import { WelcomeSlide } from "./welcome-slide";

export function WelcomeModal() {
  const { welcomeModalOpen, completeWelcome, closeWelcomeModal } = useOnboardingStore();
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Reset position when the modal opens. reInit picks up final viewport
  // dimensions if Embla measured before layout settled.
  useEffect(() => {
    if (!welcomeModalOpen || !api) return;
    api.reInit();
    setCurrent(0);
    api.scrollTo(0, true);
  }, [welcomeModalOpen, api]);

  // Track the active slide; clean up the listener so it doesn't accumulate.
  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const handler = () => setCurrent(api.selectedScrollSnap());
    api.on("select", handler);
    return () => {
      api.off("select", handler);
    };
  }, [api]);

  const isLastSlide = current === welcomeSlides.length - 1;

  const handleNext = useCallback(() => {
    if (isLastSlide) return;
    api?.scrollNext();
  }, [api, isLastSlide]);

  const handlePrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const handleSkip = useCallback(() => {
    completeWelcome();
  }, [completeWelcome]);

  const handleGetStarted = useCallback(() => {
    completeWelcome();
  }, [completeWelcome]);

  // Close on outside-click / Esc closes the modal but DOES NOT mark complete,
  // so the user can replay later or be re-prompted on next session.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeWelcomeModal();
    },
    [closeWelcomeModal]
  );

  // Keyboard navigation while the modal is open.
  useEffect(() => {
    if (!welcomeModalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") handleNext();
      if (event.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [welcomeModalOpen, handleNext, handlePrev]);

  const progressPercent = ((current + 1) / welcomeSlides.length) * 100;

  const body = (
    <>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
          aria-hidden
        />
      </div>

      <Carousel
        setApi={setApi}
        // DialogContent is `display: grid`; without min-w-0 the intrinsic
        // width of the inner flex (5 × basis-full) lets the carousel
        // overflow the grid column. Force shrink-to-fit so the viewport
        // matches DialogContent's 512px max-w-lg.
        className="min-w-0"
        opts={{ watchDrag: true, loop: false, align: "start", containScroll: "trimSnaps" }}
      >
        {/*
          shadcn's CarouselContent / CarouselItem default to `-ml-4` / `pl-4`
          for inter-slide gaps in multi-item carousels. We render one slide
          at a time, full-width, so override both to ml-0/pl-0 — otherwise
          each slide's content drifts 16px further left than the last.
        */}
        <CarouselContent className="ml-0">
          {welcomeSlides.map((slide) => (
            <CarouselItem key={slide.title} className="pl-0">
              <WelcomeSlide slide={slide} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 pb-2">
        {welcomeSlides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-6 pb-6">
        <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
        {isLastSlide ? (
          <Button size="sm" onClick={handleGetStarted}>
            Get Started
          </Button>
        ) : (
          <Button size="sm" onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={welcomeModalOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="flex h-[90vh] flex-col gap-0 overflow-hidden rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetTitle className="sr-only">Welcome to Tasmil Finance</SheetTitle>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={welcomeModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden border-border p-0 sm:rounded-2xl">
        <DialogTitle className="sr-only">Welcome to Tasmil Finance</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  );
}

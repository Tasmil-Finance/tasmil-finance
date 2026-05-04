"use client";

import { PlayCircle } from "lucide-react";
import { useState } from "react";

interface WelcomeVideoProps {
  src: string;
  poster?: string;
}

type State = "idle" | "playing" | "errored";

export function WelcomeVideo({ src, poster }: WelcomeVideoProps) {
  const [state, setState] = useState<State>("idle");

  if (state === "errored") {
    return (
      <div
        className="relative mt-2 flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background"
        style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: "cover" } : undefined}
      >
        <span className="rounded-md bg-background/80 px-3 py-1.5 text-muted-foreground text-xs">
          Video coming soon
        </span>
      </div>
    );
  }

  if (state === "playing") {
    return (
      <div className="relative mt-2 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-border bg-black">
        {/** biome-ignore lint/a11y/useMediaCaption: intro reel without dialogue */}
        <video
          data-testid="welcome-video-element"
          src={src}
          poster={poster}
          controls
          autoPlay
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          onError={() => setState("errored")}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label="Play intro video"
      onClick={() => setState("playing")}
      className="group relative mt-2 flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background"
      style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: "cover" } : undefined}
    >
      <PlayCircle className="h-16 w-16 text-foreground/70 transition-transform group-hover:scale-105" />
      <span className="absolute right-3 bottom-2 rounded bg-background/70 px-2 py-0.5 text-muted-foreground text-xs">
        Watch intro
      </span>
    </button>
  );
}

"use client";

import { useEffect } from "react";
import { useWallet } from "@/shared/context/wallet-context";

interface Props {
  onConnected: () => void;
}

export function StepConnect({ onConnected }: Props) {
  const { isConnected, connect } = useWallet();

  useEffect(() => {
    if (isConnected) onConnected();
  }, [isConnected, onConnected]);

  const handleClick = () => {
    if (isConnected) {
      onConnected();
    } else {
      void connect();
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-center bg-background px-6">
      <h1 className="text-center font-bold text-5xl text-foreground tracking-tight md:text-6xl">
        Get started
      </h1>

      <button
        type="button"
        onClick={handleClick}
        className="relative mt-12 flex h-[280px] w-[280px] shrink-0 items-center justify-center rounded-full font-medium text-xl text-zinc-900 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] md:mt-16 md:h-[400px] md:w-[400px] md:text-2xl"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(217,249,157,0.95) 0%, rgba(190,242,100,0.9) 25%, rgba(132,204,22,0.85) 55%, rgba(101,163,13,0.85) 100%), radial-gradient(circle at 75% 75%, rgba(74,222,128,0.6), transparent 60%)",
          boxShadow:
            "0 0 120px rgba(132,204,22,0.4), inset 0 4px 60px rgba(255,255,255,0.25), inset 0 -10px 60px rgba(34,84,4,0.35)",
        }}
      >
        Continue
      </button>

      <div className="pointer-events-none absolute bottom-6 left-6 max-w-[160px] text-xs text-muted-foreground/70 leading-snug">
        Your portfolio keeps
        <br />
        thinking even when
        <br />
        you don't.
      </div>

      <div className="pointer-events-none absolute right-6 bottom-6 text-right text-xs text-muted-foreground/70 leading-snug">
        © 2026 Tasmil
        <br />
        X / Linkedin
      </div>
    </div>
  );
}

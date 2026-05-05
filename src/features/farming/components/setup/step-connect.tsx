"use client";

import { useWallet } from "@/shared/context/wallet-context";

interface Props {
  onConnected: () => void;
}

export function StepConnect({ onConnected }: Props) {
  const { isConnected, connect } = useWallet();

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
            "radial-gradient(circle at 30% 25%, rgba(197,240,255,0.95) 0%, rgba(125,217,255,0.92) 25%, rgba(56,182,240,0.88) 55%, rgba(0,140,200,0.85) 100%), radial-gradient(circle at 75% 75%, rgba(0,191,255,0.55), transparent 60%)",
          boxShadow:
            "0 0 120px rgba(0,191,255,0.4), inset 0 4px 60px rgba(255,255,255,0.3), inset 0 -10px 60px rgba(2,80,120,0.4)",
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

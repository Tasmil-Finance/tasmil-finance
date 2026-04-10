"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1600);
  }, []);

  return { ripples, createRipple };
}

interface RippleContainerProps {
  ripples: Ripple[];
}

export function RippleContainer({ ripples }: RippleContainerProps) {
  return (
    <span className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <span key={ripple.id} className="absolute inset-0">
            {/* Atmospheric halo - outermost layer */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "radial-gradient(circle, hsl(200 100% 75% / 0.08) 0%, hsl(210 100% 70% / 0.04) 40%, hsl(220 100% 65% / 0.02) 70%, transparent 90%)",
                mixBlendMode: "screen",
                filter: "blur(16px)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0 }}
              animate={{
                width: 600,
                height: 600,
                x: -300,
                y: -300,
                opacity: [0, 0.3, 0.15, 0],
              }}
              transition={{
                duration: 1.6,
                ease: [0.19, 1, 0.22, 1],
                opacity: { times: [0, 0.1, 0.7, 1], duration: 1.6 },
              }}
            />

            {/* Diffuse glow with iridescence */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "radial-gradient(circle, hsl(190 100% 78% / 0.2) 0%, hsl(200 100% 75% / 0.12) 25%, hsl(210 100% 72% / 0.06) 50%, hsl(220 100% 68% / 0.03) 75%, transparent 95%)",
                mixBlendMode: "screen",
                filter: "blur(14px)",
                boxShadow: "0 0 40px hsl(200 100% 75% / 0.15), 0 0 80px hsl(210 100% 70% / 0.08)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0 }}
              animate={{
                width: 520,
                height: 520,
                x: -260,
                y: -260,
                opacity: [0, 0.45, 0.22, 0],
              }}
              transition={{
                duration: 1.4,
                ease: [0.22, 1, 0.36, 1],
                opacity: { times: [0, 0.12, 0.75, 1], duration: 1.4 },
              }}
            />

            {/* Primary luminous layer */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "radial-gradient(circle, hsl(185 100% 80% / 0.35) 0%, hsl(190 100% 78% / 0.28) 20%, hsl(195 100% 76% / 0.22) 35%, hsl(200 100% 74% / 0.16) 50%, hsl(205 100% 72% / 0.1) 65%, hsl(210 100% 70% / 0.05) 80%, transparent 95%)",
                mixBlendMode: "plus-lighter",
                filter: "blur(8px)",
                boxShadow: "0 0 30px hsl(190 100% 78% / 0.3), 0 0 60px hsl(195 100% 76% / 0.18), 0 0 90px hsl(200 100% 74% / 0.1)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0, scale: 0.9 }}
              animate={{
                width: 450,
                height: 450,
                x: -225,
                y: -225,
                opacity: [0, 0.7, 0.35, 0],
                scale: 1,
              }}
              transition={{
                duration: 1.2,
                ease: [0.34, 1.56, 0.64, 1],
                opacity: { times: [0, 0.18, 0.8, 1], duration: 1.2 },
                scale: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] },
              }}
            />

            {/* Iridescent shimmer layer */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "radial-gradient(circle, hsl(180 100% 82% / 0.5) 0%, hsl(185 100% 80% / 0.4) 18%, hsl(190 100% 78% / 0.32) 32%, hsl(195 100% 76% / 0.24) 46%, hsl(200 100% 74% / 0.16) 60%, hsl(205 100% 72% / 0.08) 75%, transparent 90%)",
                mixBlendMode: "soft-light",
                filter: "blur(5px)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0 }}
              animate={{
                width: 400,
                height: 400,
                x: -200,
                y: -200,
                opacity: [0, 0.85, 0.45, 0],
              }}
              transition={{
                duration: 1.1,
                ease: [0.4, 0, 0.2, 1],
                opacity: { times: [0, 0.22, 0.82, 1], duration: 1.1 },
              }}
            />

            {/* Mid-range glow with depth */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "radial-gradient(circle, hsl(178 100% 85% / 0.55) 0%, hsl(182 100% 83% / 0.45) 16%, hsl(186 100% 81% / 0.36) 30%, hsl(190 100% 79% / 0.27) 44%, hsl(194 100% 77% / 0.18) 58%, hsl(198 100% 75% / 0.1) 72%, transparent 88%)",
                filter: "blur(4px)",
                boxShadow: "0 0 25px hsl(182 100% 83% / 0.35), 0 0 50px hsl(186 100% 81% / 0.22), inset 0 0 20px hsl(178 100% 87% / 0.18)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0 }}
              animate={{
                width: 340,
                height: 340,
                x: -170,
                y: -170,
                opacity: [0, 1, 0.65, 0.25, 0],
              }}
              transition={{
                duration: 1.0,
                ease: [0.4, 0, 0.2, 1],
                opacity: { times: [0, 0.26, 0.68, 0.9, 1], duration: 1.0 },
              }}
            />

            {/* Wave front ring */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "radial-gradient(circle, transparent 0%, transparent 12%, hsl(175 100% 87% / 0.65) 18%, hsl(178 100% 85% / 0.52) 24%, hsl(182 100% 83% / 0.38) 32%, hsl(186 100% 81% / 0.22) 42%, transparent 56%)",
                filter: "blur(2px)",
                boxShadow: "0 0 18px hsl(175 100% 87% / 0.45), inset 0 0 14px hsl(175 100% 90% / 0.28)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0 }}
              animate={{
                width: 310,
                height: 310,
                x: -155,
                y: -155,
                opacity: [0, 1, 0.75, 0.35, 0],
              }}
              transition={{
                duration: 0.92,
                ease: [0.4, 0, 0.2, 1],
                opacity: { times: [0, 0.3, 0.7, 0.92, 1], duration: 0.92 },
              }}
            />

            {/* Luminous core */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "radial-gradient(circle, hsl(172 100% 90% / 0.8) 0%, hsl(175 100% 88% / 0.68) 12%, hsl(178 100% 86% / 0.54) 24%, hsl(182 100% 84% / 0.4) 36%, hsl(186 100% 82% / 0.26) 50%, hsl(190 100% 80% / 0.14) 66%, transparent 82%)",
                filter: "blur(6px)",
                boxShadow: "0 0 22px hsl(175 100% 88% / 0.6), 0 0 44px hsl(178 100% 86% / 0.42), 0 0 66px hsl(182 100% 84% / 0.24), inset 0 0 28px hsl(170 100% 92% / 0.32)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0, scale: 0.6 }}
              animate={{
                width: 240,
                height: 240,
                x: -120,
                y: -120,
                opacity: [0, 1, 0.8, 0.45, 0],
                scale: 1.2,
              }}
              transition={{
                duration: 0.85,
                ease: [0.4, 0, 0.2, 1],
                opacity: { times: [0, 0.32, 0.66, 0.88, 1], duration: 0.85 },
                scale: { duration: 0.85, ease: [0.34, 1.56, 0.64, 1] },
              }}
            />

            {/* Bright center burst */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "radial-gradient(circle, hsl(168 100% 94% / 0.92) 0%, hsl(172 100% 92% / 0.78) 10%, hsl(175 100% 90% / 0.62) 20%, hsl(178 100% 88% / 0.46) 32%, hsl(182 100% 86% / 0.3) 46%, hsl(186 100% 84% / 0.16) 62%, transparent 78%)",
                filter: "blur(7px)",
                boxShadow: "0 0 20px hsl(168 100% 94% / 0.75), 0 0 40px hsl(172 100% 92% / 0.55), 0 0 60px hsl(175 100% 90% / 0.35), inset 0 0 35px hsl(165 100% 96% / 0.45)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{
                width: 180,
                height: 180,
                x: -90,
                y: -90,
                opacity: [0, 1, 0.88, 0.55, 0],
                scale: 1.35,
              }}
              transition={{
                duration: 0.78,
                ease: [0.4, 0, 0.2, 1],
                opacity: { times: [0, 0.36, 0.64, 0.86, 1], duration: 0.78 },
                scale: { duration: 0.78, ease: [0.34, 1.56, 0.64, 1] },
              }}
            />

            {/* Sharp definition ring */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                border: "2.5px solid hsl(175 100% 85% / 0.45)",
                boxShadow: "0 0 14px hsl(175 100% 85% / 0.38), 0 0 28px hsl(178 100% 83% / 0.22), inset 0 0 14px hsl(172 100% 88% / 0.28)",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0, borderWidth: 3.5 }}
              animate={{
                width: 360,
                height: 360,
                x: -180,
                y: -180,
                opacity: [0, 0.85, 0.48, 0],
                borderWidth: 0.8,
              }}
              transition={{
                duration: 0.95,
                ease: [0.4, 0, 0.2, 1],
                opacity: { times: [0, 0.28, 0.82, 1], duration: 0.95 },
                borderWidth: { duration: 0.95, ease: [0.4, 0, 0.6, 1] },
              }}
            />

            {/* Enhanced sparkle particles with organic motion */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const distance = 130 + (i % 3) * 25;
              const delay = 0.12 + (i % 4) * 0.025;
              return (
                <motion.span
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: i % 3 === 0 ? 5 : 4,
                    height: i % 3 === 0 ? 5 : 4,
                    background: `radial-gradient(circle, hsl(${170 + i * 2} 100% ${88 + i}% / 0.9) 0%, hsl(${175 + i * 2} 100% ${85 + i}% / 0.65) 45%, transparent 100%)`,
                    boxShadow: `0 0 10px hsl(${170 + i * 2} 100% ${88 + i}% / 0.75), 0 0 20px hsl(${175 + i * 2} 100% ${85 + i}% / 0.5)`,
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: Math.cos(angle) * distance + (Math.random() - 0.5) * 15,
                    y: Math.sin(angle) * distance + (Math.random() - 0.5) * 15,
                    opacity: [0, 1, 0.8, 0],
                    scale: [0, i % 3 === 0 ? 1.8 : 1.5, 1.2, 0],
                  }}
                  transition={{
                    duration: 0.65 + (i % 4) * 0.08,
                    ease: [0.4, 0, 0.2, 1],
                    delay,
                    opacity: { times: [0, 0.38, 0.78, 1], duration: 0.65 + (i % 4) * 0.08 },
                  }}
                />
              );
            })}

            {/* Subtle shimmer wave */}
            <motion.span
              className="absolute rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background: "conic-gradient(from 0deg, transparent 0%, hsl(175 100% 88% / 0.15) 10%, transparent 20%, hsl(180 100% 86% / 0.12) 30%, transparent 40%, hsl(175 100% 88% / 0.15) 50%, transparent 60%, hsl(180 100% 86% / 0.12) 70%, transparent 80%, hsl(175 100% 88% / 0.15) 90%, transparent 100%)",
                filter: "blur(3px)",
                mixBlendMode: "overlay",
              }}
              initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={{
                width: 380,
                height: 380,
                x: -190,
                y: -190,
                opacity: [0, 0.6, 0.3, 0],
                rotate: 180,
              }}
              transition={{
                duration: 1.15,
                ease: [0.4, 0, 0.2, 1],
                opacity: { times: [0, 0.25, 0.8, 1], duration: 1.15 },
                rotate: { duration: 1.15, ease: "linear" },
              }}
            />
          </span>
        ))}
      </AnimatePresence>
    </span>
  );
}

"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const BackgroundRippleEffect = ({
  rows = 8,
  cols = 27,
  cellSize = 56,
}: {
  rows?: number;
  cols?: number;
  cellSize?: number;
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [currentWaveRadius, setCurrentWaveRadius] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Auto-trigger random ripples
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const triggerRipple = () => {
      const randomRow = Math.floor(Math.random() * rows);
      const randomCol = Math.floor(Math.random() * cols);
      setClickedCell({ row: randomRow, col: randomCol });
      setRippleKey((k) => k + 1);
      setCurrentWaveRadius(0);
      
      // Animate wave radius
      const startTime = Date.now();
      const duration = 3000; // 3 seconds for wave to complete (slower)
      const maxRadius = 15; // Maximum wave radius
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Linear progression for consistent wave speed
        setCurrentWaveRadius(progress * maxRadius);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setClickedCell(null);
          setCurrentWaveRadius(0);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Schedule next ripple after current one completes + random delay
      const randomDelay = 2000 + Math.random() * 3000;
      timeoutId = setTimeout(triggerRipple, duration + randomDelay);
    };
    
    // Start first ripple after initial delay
    const initialDelay = 1000 + Math.random() * 2000;
    timeoutId = setTimeout(triggerRipple, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rows, cols]);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full pointer-events-none",
        "[--cell-border-color:rgba(63,63,70,0.4)] [--cell-fill-color:rgba(63,63,70,0.15)]",
        "dark:[--cell-border-color:rgba(63,63,70,0.4)] dark:[--cell-fill-color:rgba(63,63,70,0.15)]",
      )}
    >
      <div className="relative h-full w-full overflow-hidden">
        {/* Gradient overlays for fade at all edges */}
        <div 
          className="absolute left-0 top-0 z-10 h-full w-[30%] bg-gradient-to-r from-background to-transparent pointer-events-none"
        />
        <div 
          className="absolute right-0 top-0 z-10 h-full w-[30%] bg-gradient-to-l from-background to-transparent pointer-events-none"
        />
        <div 
          className="absolute top-0 left-0 z-10 w-full h-[30%] bg-gradient-to-b from-background to-transparent pointer-events-none"
        />
        <div 
          className="absolute bottom-0 left-0 z-10 w-full h-[40%] bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none"
        />
        
        <DivGrid
          key={`base-${rippleKey}`}
          className=""
          rows={rows}
          cols={cols}
          cellSize={cellSize}
          borderColor="var(--cell-border-color)"
          fillColor="var(--cell-fill-color)"
          clickedCell={clickedCell}
          currentWaveRadius={currentWaveRadius}
          onCellClick={() => {}}
          interactive={false}
        />
      </div>
    </div>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  currentWaveRadius: number;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = "#3f3f46",
  fillColor = "rgba(14,165,233,0.3)",
  clickedCell = null,
  currentWaveRadius = 0,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols],
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
    marginInline: "auto",
  };

  return (
    <div className={cn("relative z-3", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 70) : 0;
        const duration = 300 + distance * 100;

        const style: CellStyle = clickedCell
          ? {
              "--delay": `${delay}ms`,
              "--duration": `${duration}ms`,
            }
          : {};

        // Calculate if this cell is on the wave front (within a narrow band)
        const waveThickness = 2.5; // Narrower band for sharper wave
        const distanceFromWaveFront = Math.abs(distance - currentWaveRadius);
        const isOnWaveFront = clickedCell && distanceFromWaveFront < waveThickness;
        
        // Calculate intensity with smooth gradient
        let waveIntensity = 0;
        if (isOnWaveFront) {
          const normalizedDistance = distanceFromWaveFront / waveThickness;
          // Smooth easing
          waveIntensity = 1 - Math.pow(normalizedDistance, 1.2);
        }

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px] opacity-40 will-change-transform hover:opacity-60",
              !interactive && "pointer-events-none",
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: isOnWaveFront
                ? `rgba(82, 229, 255, ${waveIntensity})`
                : borderColor,
              borderWidth: isOnWaveFront ? '1px' : '0.5px',
              boxShadow: isOnWaveFront
                ? `0 0 ${waveIntensity * 30}px rgba(82, 229, 255, ${waveIntensity * 0.8}), 0 0 ${waveIntensity * 15}px rgba(82, 229, 255, ${waveIntensity * 0.6})`
                : undefined,
              transition: 'all 0.15s ease-out',
              ...style,
            }}
            onClick={
              interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
            }
          />
        );
      })}
    </div>
  );
};

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Typography } from "./typography";

// Import the CountUp library as a client-side only component
const CountUpLib = dynamic(() => import("react-countup"), {
  ssr: false,
});

interface CountUpProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;

  color?: any;
  className?: string;

  variant?: any;
  abbreviate?: boolean;
  animateOnlyOnce?: boolean;
}

// Helper function to format numbers with K, M, B abbreviations and trim trailing zeros
const formatWithAbbreviation = (num: number, decimals = 2): string => {
  let formatted: string;
  let suffix = "";
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  if (absNum >= 1_000_000_000) {
    formatted = (absNum / 1_000_000_000).toFixed(decimals);
    suffix = "B";
  } else if (absNum >= 1_000_000) {
    formatted = (absNum / 1_000_000).toFixed(decimals);
    suffix = "M";
  } else if (absNum >= 1000) {
    formatted = (absNum / 1000).toFixed(decimals);
    suffix = "K";
  } else if (absNum > 0 && absNum < 0.01) {
    // For very small numbers, use enough decimal places to show significant digits
    const significantDecimals = Math.max(
      decimals,
      Math.abs(Math.floor(Math.log10(absNum))) + 1
    );
    formatted = absNum.toFixed(significantDecimals);
  } else {
    // For numbers less than 1000, ensure decimal places are preserved
    formatted = absNum.toFixed(decimals);
  }

  // Trim trailing zeros after decimal point, then add suffix and negative sign
  const trimmed =
    formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "") + suffix;
  return isNegative ? "-" + trimmed : trimmed;
};

// Export CountUp as a client-side only component to avoid hydration issues
const CountUp = ({
  value,
  suffix = "",
  prefix = "",
  duration = 1,
  decimals = 8,
  color,
  className = "",
  variant = "p",
  abbreviate = true,
  animateOnlyOnce = true,
}: CountUpProps) => {
  const [isClient, setIsClient] = useState(false);
  const hasAnimatedRef = useRef(false);
  const previousValueRef = useRef<number | null>(null);

  useEffect(() => {
    setIsClient(true);
    return () => {
      // Reset animation state when component unmounts
      hasAnimatedRef.current = false;
    };
  }, []);

  // Track value changes for comparison
  useEffect(() => {
    previousValueRef.current = value;
  }, [value]);

  // Determine if we should animate
  const shouldAnimate = !hasAnimatedRef.current || !animateOnlyOnce;

  // Mark as animated after first render
  useEffect(() => {
    if (isClient && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
    }
  }, [isClient]);

  // Function to format and trim trailing zeros
  const formatNumber = (num: number): string => {
    if (abbreviate) {
      return formatWithAbbreviation(num, decimals);
    }
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    // Handle very small numbers with enough decimal places
    if (absNum > 0 && absNum < 0.01) {
      const significantDecimals = Math.max(
        decimals,
        Math.abs(Math.floor(Math.log10(absNum))) + 1
      );
      const formatted = absNum
        .toFixed(significantDecimals)
        .replace(/(\.\d*?)0+$/, "$1")
        .replace(/\.$/, "");
      return isNegative ? "-" + formatted : formatted;
    }

    // Format to fixed decimals and trim trailing zeros
    const formatted = absNum
      .toFixed(decimals)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");
    return isNegative ? "-" + formatted : formatted;
  };

  // Don't render anything on server
  if (!isClient) {
    return (
      <Typography className={className} color={color} variant={variant}>
        {prefix}0{suffix}
      </Typography>
    );
  }

  // If we shouldn't animate, just show the formatted value
  if (!shouldAnimate) {
    return (
      <Typography className={className} color={color} variant={variant}>
        {prefix}
        {formatNumber(value)}
        {suffix}
      </Typography>
    );
  }

  return (
    <Typography className={className} color={color} variant={variant}>
      <CountUpLib
        decimals={
          Math.abs(value) > 0 && Math.abs(value) < 0.01
            ? Math.max(
                decimals,
                Math.abs(Math.floor(Math.log10(Math.abs(value)))) + 1
              )
            : decimals
        }
        duration={duration}
        end={value}
        formattingFn={(n: number) => {
          let formattedNumber;

          if (abbreviate) {
            formattedNumber = formatWithAbbreviation(n, decimals);
          } else {
            const isNegative = n < 0;
            const absN = Math.abs(n);

            // Handle very small numbers
            if (absN > 0 && absN < 0.01) {
              const significantDecimals = Math.max(
                decimals,
                Math.abs(Math.floor(Math.log10(absN))) + 1
              );
              const formatted = absN
                .toFixed(significantDecimals)
                .replace(/(\.\d*?)0+$/, "$1")
                .replace(/\.$/, "");
              formattedNumber = isNegative ? "-" + formatted : formatted;
            } else {
              // Format with the specified decimals, then trim trailing zeros
              const formatted = absN
                .toFixed(decimals)
                .replace(/(\.\d*?)0+$/, "$1")
                .replace(/\.$/, "");
              formattedNumber = isNegative ? "-" + formatted : formatted;
            }
          }

          return `${prefix}${formattedNumber}${suffix}`;
        }}
      />
    </Typography>
  );
};

// Export the component wrapped in dynamic to ensure client-side only rendering
export default dynamic(() => Promise.resolve(CountUp), { ssr: false });

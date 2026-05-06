"use client";

import Image from "next/image";
import { useState } from "react";

interface WelcomeImageProps {
  src: string;
  alt: string;
  /** Fallback element rendered when the image fails to load. */
  fallback?: React.ReactNode;
}

export function WelcomeImage({ src, alt, fallback }: WelcomeImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return fallback ? fallback : null;
  }

  return (
    <div className="relative mt-2 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-border bg-muted/40">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 90vw, 480px"
        loading="lazy"
        className="object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}

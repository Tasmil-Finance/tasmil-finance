"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { VelocityScroll } from "@/components/ui/scroll-based-velocity";

const ABSTRACT_IMAGES = {
  mainObject: "/images/landing-v3/abstract/main-object.png",
} as const;

export const AbstractSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative h-[50vh] w-full overflow-hidden bg-black py-20 md:h-screen">
      <div className="absolute bottom-0 left-0 flex h-1/3 w-full items-center justify-center">
        <VelocityScroll
          className="font-bold text-6xl text-white/15 md:text-10xl"
          defaultVelocity={1}
          numRows={3}
        >
          TASMIL FINANCE
        </VelocityScroll>
      </div>

      <div className="absolute top-0 left-0 z-20 flex h-2/3 w-full animate-float-wide items-center justify-center">
        <div className="h-[80%] w-auto">
          <Image
            alt="Abstract Background"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            height={800}
            loading="eager"
            placeholder="blur"
            priority
            quality={85}
            src={ABSTRACT_IMAGES.mainObject}
            style={{
              width: "auto",
              height: "100%",
              objectFit: "contain",
            }}
            width={800}
          />
        </div>
      </div>

      <div
        className={`-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-30 h-[75vw] w-[75vw] transition-all duration-1000 md:h-[45vw] md:w-[45vw] ${
          isLoaded ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      />
    </section>
  );
};

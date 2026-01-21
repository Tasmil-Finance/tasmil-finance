"use client";

import { Canvas } from "@react-three/fiber";
import { Sparkles, Environment, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import { VoidCore } from "./VoidCore";
import { GlassHex } from "./GlassHex";

export function HighEndScene() {
    return (
        <div className="absolute inset-0 w-full h-full bg-[#050505]">
            <Canvas dpr={[1, 2]} gl={{ antialias: false }}> {/* Antialias false for PostProcessing */}
                <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={35} />

                {/* Environment for Glass Reflections */}
                <Environment preset="city" />

                <Suspense fallback={null}>
                    <VoidCore />

                    <GlassHex position={[-2.5, 0.5, 1]} title="MORPHO" apy="14.2%" />
                    <GlassHex position={[2.5, -0.5, 1]} title="PENDLE" apy="22.5%" />
                    <GlassHex position={[0, -2, 2]} title="AAVE" apy="8.5%" />

                    {/* Deep Space Background */}
                    <Sparkles count={800} scale={15} size={3} speed={0.4} opacity={0.6} color="#4a9eff" />
                </Suspense>

                {/* Post Processing for the "Video Look" */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={1}
                        mipmapBlur
                        intensity={1.5}
                        radius={0.6}
                    />
                    <Noise opacity={0.05} />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}

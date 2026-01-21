"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera, Cloud, Clouds } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GlassHex } from "./GlassHex";
// import { HexHive } from "./HexHive"; 

gsap.registerPlugin(ScrollTrigger);

function SceneContent() {
    const { camera } = useThree();

    // GSAP Scroll Animation
    useLayoutEffect(() => {
        // Wait for the DOM and Scene to be ready
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#landing-scroll-container",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.5, // Smooth scrubbing
                }
            });

            // Scroll Sequence:
            // 1. Move Camera to reveal sections
            tl.to(camera.position, {
                z: 6,
                y: -1,
                duration: 5,
            }, 0);
        });

        return () => ctx.revert();
    }, [camera]);

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={35} />
            <color attach="background" args={['#050812']} />

            {/* Ethereal Lighting */}
            <ambientLight intensity={0.5} color="#a0a0ff" />
            <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={2} color="#4a9eff" />
            <spotLight position={[-10, -10, -10]} angle={0.5} penumbra={1} intensity={1} color="#ff00bd" />

            {/* Nebula Clouds - Restored Background Atmosphere */}
            <Clouds material={THREE.MeshBasicMaterial}>
                <Cloud seed={1} scale={2} volume={5} color="#001830" fade={100} />
                <Cloud seed={2} scale={1} volume={2} color="#004060" fade={100} position={[0, -2, -5]} />
            </Clouds>

            {/* Clean Blurred Environment for Reflections */}
            <Environment preset="city" blur={1} />

            {/* Main Hero Object removed (TasmilLogo3D) per user request */}

            {/* Structured Background: The Vault Hive */}
            {/* <group position={[0, 0, -5]}>
                <HexHive />
            </group> */}

            {/* Vaults - Initially hidden or off-screen, animated in via scroll later */}
            <group position={[0, -10, 0]} name="vaults-group">
                <GlassHex position={[-2, 0, 0]} title="MORPHO" apy="14.2%" />
                <GlassHex position={[2, 0, 0]} title="PENDLE" apy="22.5%" />
                <GlassHex position={[0, -2, 1]} title="AAVE" apy="8.5%" />
            </group>

            <EffectComposer>
                <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
                <Noise opacity={0.05} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </>
    );
}

export function Experience() {
    return (
        <div className="absolute inset-0 w-full h-full bg-[#050505]">
            <Canvas dpr={[1, 2]} gl={{ antialias: false }}>
                <SceneContent />
            </Canvas>
        </div>
    );
}

"use client";

import { Canvas } from "@react-three/fiber";
import { Sparkles, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import { WolfPortal } from "./WolfPortal";
import { VaultOrbs } from "./VaultOrbs";
import { PortfolioSim } from "./PortfolioSim";

export function VaultLandingScene() {
    return (
        <div className="absolute inset-0 w-full h-full -z-0">
            <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />

                {/* Lighting */}
                <ambientLight intensity={0.5} color="#0D1117" />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00D4FF" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FFFFFF" />

                {/* Effects */}
                <Sparkles count={500} scale={20} size={2} speed={0.4} opacity={0.5} color="#00D4FF" />

                <Suspense fallback={null}>
                    {/* Main Hero Element */}
                    <WolfPortal />

                    {/* Floating Vaults */}
                    <VaultOrbs />

                    {/* Portfolio Background Sim */}
                    <PortfolioSim />
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 3}
                />
            </Canvas>
        </div>
    );
}

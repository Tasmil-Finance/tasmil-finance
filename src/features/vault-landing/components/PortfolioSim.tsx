"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function PortfolioSim() {
    const groupRef = useRef<THREE.Group>(null);

    // Create a grid of bars representing growth
    const bars = Array.from({ length: 10 }).map((_, i) => ({
        x: i - 4.5,
        height: 1 + Math.random() * 2,
        delay: i * 0.1
    }));

    useFrame((state) => {
        if (!groupRef.current) return;
        const time = state.clock.getElapsedTime();

        // Animate bars growing
        groupRef.current.children.forEach((child, i) => {
            if (child instanceof THREE.Mesh) {
                const targetHeight = Math.sin(time + bars[i].delay) * 1 + 2;
                child.scale.y = THREE.MathUtils.lerp(child.scale.y, targetHeight, 0.1);
                child.position.y = child.scale.y / 2;
            }
        });
    });

    return (
        <group ref={groupRef} position={[0, -4, 0]} rotation={[0, 0, 0]}>
            {bars.map((bar, i) => (
                <mesh key={i} position={[bar.x, bar.height / 2, 0]}>
                    <boxGeometry args={[0.5, 1, 0.5]} />
                    <meshStandardMaterial
                        color="#00D4FF"
                        transparent
                        opacity={0.8}
                        emissive="#00D4FF"
                        emissiveIntensity={0.2}
                    />
                </mesh>
            ))}
        </group>
    );
}

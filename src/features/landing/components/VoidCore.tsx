"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Float } from "@react-three/drei";

export function VoidCore() {
    const meshRef = useRef<THREE.Mesh>(null);
    const wireframeRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.rotation.x = time * 0.2;
            meshRef.current.rotation.y = time * 0.3;
        }
        if (wireframeRef.current) {
            wireframeRef.current.rotation.x = -time * 0.2;
            wireframeRef.current.rotation.y = -time * 0.3;
            const scale = 1.1 + Math.sin(time * 2) * 0.05;
            wireframeRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group position={[0, 0, 0]}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                {/* Inner Core - Solid Dark */}
                <mesh ref={meshRef}>
                    <icosahedronGeometry args={[1.5, 2]} />
                    <meshStandardMaterial
                        color="#000000"
                        roughness={0.1}
                        metalness={1}
                    />
                </mesh>

                {/* Outer Wireframe - Glowing */}
                <mesh ref={wireframeRef}>
                    <icosahedronGeometry args={[1.5, 2]} />
                    <meshStandardMaterial
                        color="#00D4FF"
                        emissive="#00D4FF"
                        emissiveIntensity={4} // High intensity for Bloom
                        wireframe
                        transparent
                        opacity={0.5}
                    />
                </mesh>

                {/* Inner Light Source */}
                <pointLight color="#00D4FF" intensity={5} distance={10} decay={2} />
            </Float>
        </group>
    );
}

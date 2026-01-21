"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function WolfPortal() {
    const pointsRef = useRef<THREE.Points>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    // Generate particles for the "Wolf/Portal" effect
    const particlesCount = 2000;
    const positions = useMemo(() => {
        const pos = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount; i++) {
            // Swirling portal shape
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 3;
            const y = (Math.random() - 0.5) * 6;

            pos[i * 3] = Math.cos(angle) * radius * (1 - Math.abs(y) / 6); // Taper at top/bottom
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = Math.sin(angle) * radius * (1 - Math.abs(y) / 6);
        }
        return pos;
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (pointsRef.current) {
            pointsRef.current.rotation.y = time * 0.1;
            // Pulse effect
            const scale = 1 + Math.sin(time * 2) * 0.05;
            pointsRef.current.scale.set(scale, scale, scale);
        }
        if (glowRef.current) {
            glowRef.current.rotation.z = -time * 0.2;
        }
    });

    return (
        <group position={[0, 0, -5]}>
            {/* Core "Eye" Glow */}
            <mesh ref={glowRef}>
                <torusGeometry args={[1.5, 0.1, 16, 100]} />
                <meshBasicMaterial color="#00D4FF" transparent opacity={0.5} />
            </mesh>

            {/* Particle Swarm */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    {/* @ts-ignore */}
                    <bufferAttribute
                        attach="attributes-position"
                        count={particlesCount}
                        array={positions}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.05}
                    color="#00D4FF"
                    transparent
                    opacity={0.6}
                    sizeAttenuation={true}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Yield "Orbs" emitting */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial
                    color="#0D1117"
                    emissive="#00D4FF"
                    emissiveIntensity={2}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
        </group>
    );
}

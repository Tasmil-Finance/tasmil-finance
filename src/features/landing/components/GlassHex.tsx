"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Text, Float, MeshTransmissionMaterial } from "@react-three/drei";

interface GlassHexProps {
    position: [number, number, number];
    title: string;
    apy: string;
}

export function GlassHex({ position, title, apy }: GlassHexProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (meshRef.current) {
            // Gentle idle rotation
            meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
        }
    });

    return (
        <group position={position}>
            <Float speed={3} rotationIntensity={0.2} floatIntensity={0.8}>
                <mesh
                    ref={meshRef}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                    scale={hovered ? 1.1 : 1}
                >
                    <cylinderGeometry args={[1.2, 1.2, 0.1, 6]} />
                    {/* Real Glass Material */}
                    <MeshTransmissionMaterial
                        backside
                        thickness={2}
                        roughness={0}
                        transmission={1}
                        ior={1.5}
                        chromaticAberration={0.1}
                        anisotropy={0.1}
                        color={hovered ? "#4a9eff" : "#ffffff"}
                        emissive={hovered ? "#00D4FF" : "#000000"}
                        emissiveIntensity={hovered ? 0.5 : 0}
                    />
                </mesh>

                <group position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
                    <Text
                        font="/fonts/GeistMono.ttf"
                        fontSize={0.25}
                        color="white"
                        position={[0, 0.2, 0]}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {title}
                    </Text>
                    <Text
                        font="/fonts/GeistMono.ttf"
                        fontSize={0.2}
                        color="#00D4FF"
                        position={[0, -0.2, 0]}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {apy}
                    </Text>
                </group>
            </Float>
        </group>
    );
}

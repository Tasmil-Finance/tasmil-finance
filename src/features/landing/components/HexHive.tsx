"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function HexHive({ count = 200, color = "#1A1B20", accentColor = "#00D4FF" }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Grid Layout Logic
    const particles = useMemo(() => {
        const temp = [];
        const hexRadius = 1.2;
        const xSpacing = hexRadius * 1.5; // Horizontal distance between centers
        const ySpacing = hexRadius * Math.sqrt(3); // Vertical distance

        let i = 0;
        // Create a wall grid (X/Y plane)
        const cols = 20;
        const rows = 12;

        for (let r = -rows / 2; r < rows / 2; r++) {
            for (let c = -cols / 2; c < cols / 2; c++) {
                // Hexagonal Offset
                const xOffset = (r % 2) * (xSpacing / 2);

                const x = c * xSpacing + xOffset;
                const y = r * (ySpacing / 2); // Tighter packing
                const z = -5; // Base depth behind hero

                // Random phase for breathing
                const phase = Math.random() * Math.PI * 2;

                temp.push({ x, y, z, phase });
                i++;
            }
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();

        particles.forEach((particle, i) => {
            let { x, y, z, phase } = particle;

            // "Breathing" effect: z-position pulsates
            // Creates a wave-like motion across the wall
            const zWave = Math.sin(time * 0.5 + x * 0.2 + y * 0.2) * 0.5;

            dummy.position.set(x, y, z + zWave);
            dummy.rotation.set(Math.PI / 2, 0, 0); // Face the camera

            // Slight scale pulse
            // const scale = 1 + Math.sin(time * 1 + phase) * 0.05;
            dummy.scale.set(1, 1, 1);

            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);

            // We could ideally update color instance too if using custom shader/drei Instance, 
            // but simpler for now to keep uniform material.
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
            <cylinderGeometry args={[1, 1, 0.2, 6]} /> {/* Hexagon Prism */}
            <meshStandardMaterial
                color={color}
                roughness={0.2}
                metalness={0.8}
                envMapIntensity={1}
            />
        </instancedMesh>
    );
}

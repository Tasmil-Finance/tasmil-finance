"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Float, Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

// Density: High
const count = 600;
// Range: Reduced to 5 to prevent overflow
const range = 5.0;

function CubeSwarm() {
    const mesh = useRef<THREE.InstancedMesh>(null);

    // Generate random positions and scales for the "data particles"
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const time = Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;

            // Position: Concentrate in the center, spread out slightly
            const x = (Math.random() - 0.5) * range;
            const y = (Math.random() - 0.5) * range;
            const z = (Math.random() - 0.5) * range;

            // Scale: slightly smaller base size to help with "clutter" feel
            // Mostly 0.3-0.5, some larger 0.8s
            const s = Math.random() > 0.9 ? 0.9 : 0.4;

            temp.push({ time, speed, x, y, z, s });
        }
        return temp;
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!mesh.current) return;

        // Rotate the entire swarm slowly
        mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
        mesh.current.rotation.z = state.clock.elapsedTime * 0.02;

        particles.forEach((particle, i) => {
            // Gentle floating motion for each cube independently
            const t = particle.time + state.clock.elapsedTime;

            dummy.position.set(
                particle.x + Math.sin(t * particle.speed) * 0.2,
                particle.y + Math.cos(t * particle.speed) * 0.2,
                particle.z + Math.sin(t * particle.speed * 0.5) * 0.2
            );

            // Fixed scale (no hover effect)
            dummy.scale.set(particle.s, particle.s, particle.s);

            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
                <boxGeometry args={[1, 1, 1]} />
                {/* "Tasmil Core" Palette Material - Brighter Blue */}
                <meshStandardMaterial
                    color="#00C2FF"
                    roughness={0.2}
                    metalness={0.8}
                    emissive="#0B1221"
                    emissiveIntensity={0.5}
                />
            </instancedMesh>
        </group>
    );
}

function CanvasWrapper() {
    return (
        <Canvas camera={{ position: [0, 0, 13], fov: 40 }} dpr={[1, 2]}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#3B82F6" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#00C2FF" />

            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                <CubeSwarm />
            </Float>

            <Environment preset="city" />
        </Canvas>
    )
}

export default function AbstractCube() {
    return (
        <div className="w-full h-full min-h-[500px]">
            <CanvasWrapper />
        </div>
    )
}

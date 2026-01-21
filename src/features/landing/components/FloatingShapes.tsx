"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export function FloatingShapes({ count = 50, color = "#00D4FF" }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Generate random positions and rotation speeds
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    // Dummy object for calculating matrices
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!meshRef.current) return;

        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;

            // Update time
            t = particle.t += speed / 2;

            // Oscillating movement
            const x = xFactor + Math.cos(t) + (Math.sin(t * 1) * factor) / 10;
            const y = yFactor + Math.sin(t) + (Math.cos(t * 2) * factor) / 10;
            const z = zFactor + Math.cos(t) + (Math.sin(t * 3) * factor) / 10;

            // Rotate the individual shape
            dummy.position.set(x, y, z);
            dummy.rotation.set(x, y, z); // Rotate based on position for randomness
            dummy.scale.setScalar(1 + Math.sin(t)); // Pulse scale slightly
            dummy.updateMatrix();

            meshRef.current?.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <>
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
                {/* Abstract Shape: Octahedron for a "Tech" feel */}
                <octahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.2}
                    wireframe={true} // Abstract Wireframe look
                    roughness={0}
                    metalness={0.5}
                />
            </instancedMesh>

            {/* Second layer of filled shapes for variety */}
            <instancedMesh args={[undefined, undefined, count / 2]}>
                <tetrahedronGeometry args={[0.3, 0]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.1}
                />
                {/* We would need separate logic for this, or just reuse the component with different props */}
            </instancedMesh>
        </>
    );
}

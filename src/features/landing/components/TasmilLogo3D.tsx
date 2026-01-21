import { useFrame, useLoader } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Float, Outlines } from "@react-three/drei";

export function TasmilLogo3D() {
    const meshRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const logoPlaneRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.Points>(null);

    // Load User Logo
    const texture = useLoader(THREE.TextureLoader, "/images/logo.png");

    // Generate particles for the "Explosion" effect
    const particlesCount = 100;
    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = 1.2 + Math.random() * 2; // Radius around the logo
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (meshRef.current) {
            // Subtle floating rotation base
            meshRef.current.rotation.y = time * 0.1;
        }
        if (coreRef.current) {
            // Core breathing
            const scale = 1 + Math.sin(time * 2) * 0.05;
            coreRef.current.scale.set(scale, scale, scale);
        }
        if (particlesRef.current) {
            // Particles swirling
            particlesRef.current.rotation.y = -time * 0.2;
        }
    });

    return (
        <group ref={meshRef}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* Main Crystal Prism Body - Jewel Like */}
                <mesh ref={coreRef}>
                    <cylinderGeometry args={[1.2, 1.2, 0.4, 6]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        roughness={0.05}
                        metalness={0.1}
                        transmission={0.95} // High transmission for clear glass
                        thickness={2} // Refraction depth
                        ior={1.6} // Diamond-like refractive index
                        clearcoat={1}
                        attenuationDistance={0.5}
                        attenuationColor="#00D4FF"
                    />
                </mesh>

                {/* Inner Glowing Hologram (The User's Logo) */}
                <mesh ref={logoPlaneRef} rotation={[Math.PI / 2, 0, Math.PI / 6]} position={[0, 0, 0]}>
                    <planeGeometry args={[1.4, 1.4]} />
                    <meshBasicMaterial
                        map={texture}
                        transparent
                        opacity={0.9}
                        side={THREE.DoubleSide}
                        depthWrite={false} // Allow seeing through to other side of glass
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>

                {/* Outer Energy Shell (Subtle Glow) */}
                <mesh scale={[1.05, 1.05, 1.05]}>
                    <cylinderGeometry args={[1.2, 1.2, 0.4, 6]} />
                    <meshBasicMaterial color="#00D4FF" wireframe transparent opacity={0.1} />
                </mesh>

                {/* Floating Particles - "Yield Stardust" - Softer */}
                <points ref={particlesRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[particlesPosition, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        size={0.05}
                        color="#00D4FF"
                        transparent
                        opacity={0.6}
                        blending={THREE.AdditiveBlending}
                    />
                </points>

                {/* Point Lights for self-illumination */}
                <pointLight color="#00D4FF" intensity={2} distance={5} />
            </Float>
        </group>
    );
}

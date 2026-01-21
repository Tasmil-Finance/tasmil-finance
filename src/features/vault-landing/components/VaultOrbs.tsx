import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Text, Float } from "@react-three/drei";

function HexagonCard({ position, title, apy, delay }: { position: [number, number, number], title: string, apy: string, delay: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        // Float animation
        meshRef.current.position.y = position[1] + Math.sin(time + delay) * 0.2;

        // Hover rotation
        if (hovered) {
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0.5, 0.1);
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, time * 0.5, 0.1);
        } else {
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
        }
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh
                    ref={meshRef}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                >
                    <cylinderGeometry args={[1.5, 1.5, 0.2, 6]} /> {/* Hexagon shape */}
                    <meshStandardMaterial
                        color={hovered ? "#00D4FF" : "#1A1B20"}
                        emissive={hovered ? "#00D4FF" : "#000000"}
                        emissiveIntensity={hovered ? 0.5 : 0}
                        roughness={0.3}
                        metalness={0.8}
                        wireframe={!hovered}
                    />
                </mesh>

                {/* Content */}
                <group position={[0, 0, 0.15]}>
                    <Text
                        font="/fonts/inter-bold.woff" // Fallback path, might need valid font url or generic
                        fontSize={0.3}
                        color={hovered ? "#000000" : "#FFFFFF"}
                        position={[0, 0.2, 0]}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {title}
                    </Text>
                    <Text
                        fontSize={0.2}
                        color={hovered ? "#000000" : "#00D4FF"}
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

export function VaultOrbs() {
    return (
        <group position={[0, -2, 0]}>
            <HexagonCard position={[-3, 0, 0]} title="Morpho" apy="14.7%" delay={0} />
            <HexagonCard position={[0, 0, 1]} title="Pendle" apy="22.1%" delay={1} />
            <HexagonCard position={[3, 0, 0]} title="Aave" apy="8.5%" delay={2} />
        </group>
    );
}

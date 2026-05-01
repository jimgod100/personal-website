import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  opacity: number;
  baseColor: string;
}

export default function WireframeZone({ opacity, baseColor }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current || opacity <= 0) return;
    const time = state.clock.elapsedTime;
    // Slow rotation
    groupRef.current.rotation.y = time * 0.05;
    groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
  });

  if (opacity <= 0.01) return null;

  return (
    <group ref={groupRef} position={[0, -2, 20]}>
      {/* A large central structure */}
      <mesh>
        <icosahedronGeometry args={[8, 1]} />
        <meshBasicMaterial 
          color={baseColor} 
          wireframe 
          transparent 
          opacity={opacity * 0.15} 
          depthWrite={false} 
        />
      </mesh>
      
      {/* Some floating geometric planes */}
      <mesh position={[-10, 5, -5]} rotation={[Math.PI/2, 0, 0]}>
        <planeGeometry args={[10, 10, 4, 4]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={opacity * 0.2} />
      </mesh>
      
      <mesh position={[10, -5, 5]} rotation={[0, Math.PI/4, 0]}>
        <planeGeometry args={[15, 15, 6, 6]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={opacity * 0.1} />
      </mesh>
    </group>
  );
}

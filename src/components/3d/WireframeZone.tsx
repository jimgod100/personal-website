import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  opacityRef: React.MutableRefObject<number>;
  baseColor: React.MutableRefObject<string> | string;
}

export default function WireframeZone({ opacityRef, baseColor }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const mat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const mat2Ref = useRef<THREE.MeshBasicMaterial>(null);
  const mat3Ref = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Slow rotation
    groupRef.current.rotation.y = time * 0.05;
    groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;

    const op = opacityRef.current;
    groupRef.current.visible = op > 0.01;
    if (op > 0.01) {
      if (mat1Ref.current) mat1Ref.current.opacity = op * 0.15;
      if (mat2Ref.current) mat2Ref.current.opacity = op * 0.2;
      if (mat3Ref.current) mat3Ref.current.opacity = op * 0.1;
    }
  });

  const colorValue = typeof baseColor === 'string' ? baseColor : baseColor.current;
  
  return (
    <group ref={groupRef} position={[0, -2, -15]} visible={false}>
      {/* A large central structure */}
      <mesh>
        <icosahedronGeometry args={[8, 1]} />
        <meshBasicMaterial 
          ref={mat1Ref}
          color={colorValue} 
          wireframe 
          transparent 
          opacity={0} 
          depthWrite={false} 
        />
      </mesh>
      
      {/* Some floating geometric planes */}
      <mesh position={[-10, 5, -5]} rotation={[Math.PI/2, 0, 0]}>
        <planeGeometry args={[10, 10, 4, 4]} />
        <meshBasicMaterial ref={mat2Ref} color={colorValue} wireframe transparent opacity={0} />
      </mesh>
      
      <mesh position={[10, -5, 5]} rotation={[0, Math.PI/4, 0]}>
        <planeGeometry args={[15, 15, 6, 6]} />
        <meshBasicMaterial ref={mat3Ref} color={colorValue} wireframe transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}


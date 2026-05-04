import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ScrollTube({ color, velocityData }: { color: React.MutableRefObject<string>, velocityData: React.MutableRefObject<{velocity: number, targetVelocity: number}> }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const { path } = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const z = (i / 60) * 50; 
      const x = Math.sin(z * 0.4) * 2;
      const y = Math.cos(z * 0.3) * 1.5;
      points.push(new THREE.Vector3(x, y, z));
    }
    return { path: new THREE.CatmullRomCurve3(points) };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      // Base pulse + velocity boost
      const v = velocityData.current.targetVelocity;
      materialRef.current.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5 + (v * 5);
      
      // Update color based on the current theme
      const col = new THREE.Color(color.current);
      materialRef.current.color.copy(col);
      materialRef.current.emissive.copy(col);
    }
    
    if (meshRef.current) {
      // Add slight twist based on scroll velocity
      const v = velocityData.current.velocity;
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, v * 0.05, 0.1);
    }
  });

  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[path, 150, 0.03, 8, false]} />
      <meshStandardMaterial 
        ref={materialRef}
        roughness={0.1}
        metalness={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

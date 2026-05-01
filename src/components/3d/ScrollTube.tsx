import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ScrollTube({ color }: { color: string }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

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
      materialRef.current.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <mesh>
      <tubeGeometry args={[path, 150, 0.03, 8, false]} />
      <meshStandardMaterial 
        ref={materialRef}
        color={color} 
        emissive={color}
        emissiveIntensity={1}
        roughness={0.1}
        metalness={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

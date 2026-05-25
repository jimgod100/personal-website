import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Gold/Amber energy tube — distinct from teal accent
const TUBE_COLOR_DARK = '#d4a853';  // Warm gold in dark mode
const TUBE_COLOR_LIGHT = '#b8860b'; // Darker gold in light mode

const _tubeColor = new THREE.Color();

export default function ScrollTube({ color, velocityData }: { color: React.MutableRefObject<string>, velocityData: React.MutableRefObject<{velocity: number, targetVelocity: number}> }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const isDarkRef = useRef(true);

  // Check theme once per frame via cached check
  const checkTheme = () => {
    isDarkRef.current = document.documentElement.getAttribute('data-theme') !== 'light';
  };

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
    checkTheme();

    if (materialRef.current) {
      // Base pulse + velocity boost
      const v = velocityData.current.targetVelocity;
      const baseEmissive = isDarkRef.current ? 0.8 : 0.3;
      materialRef.current.emissiveIntensity = baseEmissive + Math.sin(state.clock.elapsedTime * 2) * 0.5 + (v * 5);
      
      // Use fixed gold color instead of accent color
      const tubeHex = isDarkRef.current ? TUBE_COLOR_DARK : TUBE_COLOR_LIGHT;
      _tubeColor.set(tubeHex);
      materialRef.current.color.copy(_tubeColor);
      materialRef.current.emissive.copy(_tubeColor);
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
        metalness={0.7}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

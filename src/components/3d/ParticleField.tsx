import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  densityRef: React.MutableRefObject<{ particleDensity: number }>; // ref to avoid re-renders
  baseColor: string;
}

export default function ParticleField({ densityRef, baseColor }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Use a fixed max count and hide unused particles
  const MAX_COUNT = typeof window !== 'undefined' && window.innerWidth < 768 ? 800 : 2500;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(MAX_COUNT * 3);
    const phs = new Float32Array(MAX_COUNT);
    for (let i = 0; i < MAX_COUNT; i++) {
      // Spread particles over a long Z distance to match camera travel
      pos[i * 3 + 0] = (Math.random() - 0.5) * 40; // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60 + 20; // z (0 to 50 mostly)
      phs[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: phs };
  }, [MAX_COUNT]);

  const scales = useMemo(() => new Float32Array(MAX_COUNT).fill(1), [MAX_COUNT]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const targetActiveCount = MAX_COUNT * densityRef.current.particleDensity;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < MAX_COUNT; i++) {
      // Lerp scale towards 1 if active, 0 if inactive
      const targetBaseScale = i < targetActiveCount ? 1 : 0;
      scales[i] = THREE.MathUtils.lerp(scales[i], targetBaseScale, 0.1);
      
      if (scales[i] < 0.01 && targetBaseScale === 0) continue;

      const x = positions[i * 3 + 0];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const phase = phases[i];
      
      // Gentle drift
      dummy.position.set(
        x + Math.sin(time * 0.2 + phase) * 0.5,
        y + Math.cos(time * 0.3 + phase) * 0.5,
        z
      );
      
      // Pulse scale
      const scale = scales[i] * (1 + Math.sin(time * 1.5 + phase) * 0.5);
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_COUNT]}>
      <sphereGeometry args={[0.08, 4, 4]} />
      <meshBasicMaterial color={baseColor} transparent opacity={0.6} depthWrite={false} />
    </instancedMesh>
  );
}

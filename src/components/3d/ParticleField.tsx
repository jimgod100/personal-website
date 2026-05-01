/**
 * ParticleField — instanced sphere particles spread across the Z depth of the world.
 * density (0–1) smoothly fades particles out via opacity lerp instead of hard count cuts.
 */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  densityRef: React.MutableRefObject<{ particleDensity: number }>;
  baseColor: string;
}

export default function ParticleField({ densityRef, baseColor }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Guard against SSR where window is undefined
  const MAX_COUNT = useMemo(() => {
    if (typeof window === 'undefined') return 2500;
    return window.innerWidth < 768 ? 800 : 2500;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(MAX_COUNT * 3);
    const phs = new Float32Array(MAX_COUNT);
    for (let i = 0; i < MAX_COUNT; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60 + 20;
      phs[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: phs };
  }, [MAX_COUNT]);

  // Track scales for smooth fade out
  const scales = useMemo(() => new Float32Array(MAX_COUNT).fill(1), [MAX_COUNT]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Guard against max count changes
    if (meshRef.current.count !== MAX_COUNT) {
      meshRef.current.count = MAX_COUNT;
    }

    const time = state.clock.elapsedTime;
    const targetActiveCount = MAX_COUNT * densityRef.current.particleDensity;

    for (let i = 0; i < MAX_COUNT; i++) {
      // Smooth fade out: target scale is 1 if within active count, 0 otherwise
      const targetBaseScale = i < targetActiveCount ? 1 : 0;
      scales[i] = THREE.MathUtils.lerp(scales[i], targetBaseScale, 0.1);

      // Skip matrix updates for fully invisible particles
      if (scales[i] < 0.01 && targetBaseScale === 0) continue;

      const x = positions[i * 3 + 0];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const phase = phases[i];

      dummy.position.set(
        x + Math.sin(time * 0.2 + phase) * 0.5,
        y + Math.cos(time * 0.3 + phase) * 0.5,
        z,
      );

      // Combine base visibility scale with pulsing scale
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

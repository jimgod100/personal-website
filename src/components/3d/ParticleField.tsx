/**
 * ParticleField — instanced sphere particles spread across the Z depth of the world.
 * density (0–1) smoothly fades particles out via opacity lerp instead of hard count cuts.
 * Uses instanceColor for a teal → violet → rose gradient based on Z depth.
 */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Gradient palette for particle depth coloring
const COLOR_NEAR   = new THREE.Color('#2dd4bf'); // Bright Teal (front)
const COLOR_MID    = new THREE.Color('#818cf8'); // Indigo (middle)
const COLOR_FAR    = new THREE.Color('#f472b6'); // Pink Rose (back)
const _tempColor   = new THREE.Color();

interface Props {
  densityRef: React.MutableRefObject<{ particleDensity: number }>;
  baseColor: React.MutableRefObject<string> | string;
}

export default function ParticleField({ densityRef, baseColor }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Guard against SSR where window is undefined
  const MAX_COUNT = useMemo(() => {
    if (typeof window === 'undefined') return 2500;
    return window.innerWidth < 768 ? 800 : 2500;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { positions, phases, colors } = useMemo(() => {
    const pos = new Float32Array(MAX_COUNT * 3);
    const phs = new Float32Array(MAX_COUNT);
    const col = new Float32Array(MAX_COUNT * 3);

    for (let i = 0; i < MAX_COUNT; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 60 + 20;

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      phs[i] = Math.random() * Math.PI * 2;

      // Map Z position to gradient: near (z=50) → far (z=-10)
      const t = THREE.MathUtils.clamp((50 - z) / 60, 0, 1);
      if (t < 0.5) {
        // Near → Mid
        _tempColor.copy(COLOR_NEAR).lerp(COLOR_MID, t * 2);
      } else {
        // Mid → Far
        _tempColor.copy(COLOR_MID).lerp(COLOR_FAR, (t - 0.5) * 2);
      }
      // Add per-particle jitter for organic feel
      _tempColor.offsetHSL(
        (Math.random() - 0.5) * 0.06,  // hue jitter
        (Math.random() - 0.5) * 0.1,   // saturation jitter
        (Math.random() - 0.5) * 0.08   // lightness jitter
      );

      col[i * 3 + 0] = _tempColor.r;
      col[i * 3 + 1] = _tempColor.g;
      col[i * 3 + 2] = _tempColor.b;
    }
    return { positions: pos, phases: phs, colors: col };
  }, [MAX_COUNT]);

  // Track scales for smooth fade out
  const scales = useMemo(() => new Float32Array(MAX_COUNT).fill(1), [MAX_COUNT]);

  // Set instance colors once on mount
  React.useEffect(() => {
    if (!meshRef.current) return;
    const colorAttr = new THREE.InstancedBufferAttribute(colors, 3);
    meshRef.current.instanceColor = colorAttr;
  }, [colors]);

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
      <circleGeometry args={[0.08, 4]} />
      <meshBasicMaterial transparent opacity={0.6} depthWrite={false} vertexColors />
    </instancedMesh>
  );
}

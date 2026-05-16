/**
 * LoadingScreen — Port of lusion-reverse-engineered's LoadingGroup.
 * Full-screen shader overlay with:
 *  - Animated loading progress bar
 *  - "L"-shaped letter reveal animation
 *  - Post-load zoom + rotate transition
 * 
 * Uses: loadingScreen.vert.glsl, loadingScreen.frag.glsl
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from './shaders/loadingScreen.vert.glsl';
import fragmentShader from './shaders/loadingScreen.frag.glsl';

interface Props {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const { size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(true);

  const uniforms = useMemo(
    () => ({
      aspect: { value: size.width / size.height },
      loadingProgress: { value: 0 },
      postLoadSequenceProgress: { value: 0 },
    }),
    []
  );

  const loadingTarget = useRef(0);
  const isSequenceFinished = useRef(false);

  // Track THREE.DefaultLoadingManager progress
  useEffect(() => {
    const onProgress = (_url: string, loaded: number, total: number) => {
      loadingTarget.current = loaded / total;
    };

    THREE.DefaultLoadingManager.onProgress = onProgress;

    // Simulate initial loading if everything is cached
    const timer = setTimeout(() => {
      if (loadingTarget.current < 1) {
        loadingTarget.current = 1;
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Update aspect on resize
  useEffect(() => {
    uniforms.aspect.value = size.width / size.height;
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    if (isSequenceFinished.current) return;

    // Smoothly approach loading target
    uniforms.loadingProgress.value = THREE.MathUtils.lerp(
      uniforms.loadingProgress.value,
      loadingTarget.current,
      delta * 10
    );
    uniforms.loadingProgress.value = Math.min(uniforms.loadingProgress.value + 0.0000001, 1);

    // Post-load sequence
    if (uniforms.loadingProgress.value >= 0.999) {
      uniforms.loadingProgress.value = 1;
      uniforms.postLoadSequenceProgress.value = Math.min(
        uniforms.postLoadSequenceProgress.value + delta * 0.6,
        1
      );

      if (uniforms.postLoadSequenceProgress.value >= 1) {
        isSequenceFinished.current = true;
        setVisible(false);
        onComplete();
      }
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} renderOrder={9999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
      />
    </mesh>
  );
}

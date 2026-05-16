/**
 * EnvironmentSetup — Sets up HDR environment maps from lusion-reverse-engineered.
 * Provides realistic reflections and ambient lighting to the scene.
 *
 * Uses: quarry_01_1k.hdr, studio_small_08_1k.hdr, grid.png
 */
import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  scrollProgress: React.MutableRefObject<number>;
}

export default function EnvironmentSetup({ scrollProgress }: Props) {
  const { scene } = useThree();

  // Load grid texture for subtle background pattern
  // Using a simple approach without useTexture to avoid SSR issues
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/grid.png', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(20, 20);
      // Store for use in other components
      (scene.userData as any).gridTexture = texture;
    });
  }, [scene]);

  return (
    <>
      {/* HDRI from lusion-reverse-engineered for realistic reflections */}
      <Environment
        files="/hdri/quarry_01_1k.hdr"
        background={false}
      />
    </>
  );
}

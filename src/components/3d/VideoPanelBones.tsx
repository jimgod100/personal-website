/**
 * VideoPanelBones — Port of lusion-reverse-engineered's VideoPanelBones.
 * Loads panel-anim-bones GLB models and animates their corner bones
 * along bezier curves driven by scroll progress.
 * Creates a morph-like panel animation effect (Lusion's signature).
 *
 * Uses: panel-anim-bones.glb, panel-anim-bones-02.glb through 05.glb,
 *       panel-anim-wiggle-bones.glb
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const PANEL_MODELS = [
  '/models/panel-anim-bones.glb',
  '/models/panel-anim-bones-02.glb',
  '/models/panel-anim-bones-03.glb',
  '/models/panel-anim-bones-04.glb',
  '/models/panel-anim-bones-05.glb',
];

interface Props {
  scrollProgress: React.MutableRefObject<number>;
  baseColor: React.MutableRefObject<string>;
}

function SinglePanel({
  modelPath,
  position,
  scrollRange,
  baseColor,
  scrollProgress,
}: {
  modelPath: string;
  position: [number, number, number];
  scrollRange: [number, number];
  baseColor: React.MutableRefObject<string>;
  scrollProgress: React.MutableRefObject<number>;
}) {
  const { scene, animations } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Find bones in the model
  const bones = useRef<{
    tl?: THREE.Bone;
    tr?: THREE.Bone;
    bl?: THREE.Bone;
    br?: THREE.Bone;
  }>({});

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        const bone = child as THREE.Bone;
        if (bone.name.includes('TL') || bone.name.includes('tl')) bones.current.tl = bone;
        if (bone.name.includes('TR') || bone.name.includes('tr')) bones.current.tr = bone;
        if (bone.name.includes('BL') || bone.name.includes('bl')) bones.current.bl = bone;
        if (bone.name.includes('BR') || bone.name.includes('br')) bones.current.br = bone;
      }

      // Apply wireframe material with accent color
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: baseColor.current,
          roughness: 0.2,
          metalness: 0.6,
          transparent: true,
          opacity: 0.7,
          wireframe: false,
        });
      }
    });

    // Set up animation
    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clonedScene);
      const action = mixer.clipAction(animations[0]);
      action.play();
      action.setLoop(THREE.LoopRepeat, Infinity);
      mixerRef.current = mixer;
    }

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [clonedScene, animations]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update mixer
    mixerRef.current?.update(delta);

    // Calculate local progress within this panel's scroll range
    const scroll = scrollProgress.current;
    const localProgress = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(scroll, scrollRange[0], scrollRange[1], 0, 1),
      0,
      1
    );

    // Visibility
    const isVisible = scroll >= scrollRange[0] - 0.1 && scroll <= scrollRange[1] + 0.1;
    groupRef.current.visible = isVisible;

    if (!isVisible) return;

    // Animate bones along curves if they exist
    const { tl, tr, bl, br } = bones.current;
    const spread = localProgress * 2;
    if (tl) tl.position.x = -spread;
    if (tr) tr.position.x = spread;
    if (bl) bl.position.x = -spread;
    if (br) br.position.x = spread;

    // Gentle rotation
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2 + localProgress * Math.PI;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;

    // Update material color
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.color) mat.color.set(baseColor.current);
      }
    });
  });

  return (
    <group ref={groupRef} position={position} scale={1.5}>
      <primitive object={clonedScene} />
    </group>
  );
}

export default function VideoPanelBones({ scrollProgress, baseColor }: Props) {
  return (
    <group>
      {/* Distribute panels across different scroll ranges */}
      <SinglePanel
        modelPath={PANEL_MODELS[0]}
        position={[-4, 2, 8]}
        scrollRange={[0.1, 0.3]}
        baseColor={baseColor}
        scrollProgress={scrollProgress}
      />
      <SinglePanel
        modelPath={PANEL_MODELS[1]}
        position={[4, -1, 15]}
        scrollRange={[0.2, 0.45]}
        baseColor={baseColor}
        scrollProgress={scrollProgress}
      />
      <SinglePanel
        modelPath={PANEL_MODELS[2]}
        position={[-3, 0, 22]}
        scrollRange={[0.35, 0.6]}
        baseColor={baseColor}
        scrollProgress={scrollProgress}
      />
      <SinglePanel
        modelPath={PANEL_MODELS[3]}
        position={[3, 1, 28]}
        scrollRange={[0.5, 0.75]}
        baseColor={baseColor}
        scrollProgress={scrollProgress}
      />
      <SinglePanel
        modelPath={PANEL_MODELS[4]}
        position={[0, -1, 35]}
        scrollRange={[0.65, 0.9]}
        baseColor={baseColor}
        scrollProgress={scrollProgress}
      />
    </group>
  );
}

// Preload all panel models
PANEL_MODELS.forEach((path) => useGLTF.preload(path));

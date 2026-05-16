/**
 * FemaleCharacter — Loads and animates the female.glb model
 * from lusion-main with its associated animation.glb.
 * Placed in the hero zone, slowly rotating and with skeletal animation playback.
 *
 * Uses: female.glb, animation.glb
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  baseColor: React.MutableRefObject<string>;
  scrollProgress: React.MutableRefObject<number>;
}

export default function FemaleCharacter({ baseColor, scrollProgress }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/female.glb');
  const { scene: animScene, animations: animClips } = useGLTF('/models/animation.glb');

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Set up animation mixer
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (!clonedScene) return;

    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    // Try to play animations from animation.glb first, then from female.glb
    const clips = animClips.length > 0 ? animClips : animations;
    if (clips.length > 0) {
      // Fix track names (e.g., Mixamo prefix mismatch)
      const clip = clips[0].clone();
      clip.tracks.forEach((track) => {
        track.name = track.name.replace('mixamorig', '');
      });
      const action = mixer.clipAction(clip);
      action.play();
      action.setLoop(THREE.LoopRepeat, Infinity);
    }

    // Set up materials — give it a semi-transparent accent look
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Keep original materials but adjust for our scene
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.isMeshStandardMaterial) {
          mat.roughness = 0.3;
          mat.metalness = 0.5;
          mat.transparent = true;
          mat.opacity = 0.85;
        }
      }
    });

    return () => {
      mixer.stopAllAction();
    };
  }, [clonedScene, animations, animClips]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update animation
    mixerRef.current?.update(delta);

    // Slow rotation
    const scroll = scrollProgress.current;
    groupRef.current.rotation.y += delta * 0.3;

    // Fade out as user scrolls past hero
    const opacity = THREE.MathUtils.clamp(1 - scroll * 3, 0, 1);
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.transparent !== undefined) {
          mat.opacity = opacity * 0.85;
        }
      }
    });

    // Bob up and down
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 - 1.5;
  });

  return (
    <group ref={groupRef} position={[3, -1.5, -2]} scale={1.2}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/models/female.glb');
useGLTF.preload('/models/animation.glb');

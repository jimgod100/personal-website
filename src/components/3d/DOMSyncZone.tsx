import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

/**
 * DOMSyncZone mimics Lusion's WebGL-Scroll-Sync.
 * It finds all DOM elements with `data-webgl-sync` and tracks their screen coordinates,
 * projecting them into the 3D scene so that a 3D object is always perfectly aligned behind the DOM element.
 */
export default function DOMSyncZone({ color }: { color: React.MutableRefObject<string> }) {
  const { size, camera } = useThree();
  const [elements, setElements] = useState<HTMLElement[]>([]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const hoverStates = useRef<boolean[]>([]);
  const mixers = useRef<THREE.AnimationMixer[]>([]);

  // Load Lusion GLTF models
  const { scene: panelModel, animations: panelAnims } = useGLTF('/models/panel-anim-bones-02.glb');
  const { scene: femaleModel, animations: femaleAnims } = useGLTF('/models/female.glb');
  
  // Find all elements to sync on mount and after a short delay (in case Astro renders them late)
  useEffect(() => {
    let currentEls: HTMLElement[] = [];
    let enterListeners: (() => void)[] = [];
    let leaveListeners: (() => void)[] = [];
    
    const onEnter = (i: number) => { hoverStates.current[i] = true; };
    const onLeave = (i: number) => { hoverStates.current[i] = false; };

    const findElements = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-dom-sync]'));
      
      // Clean up old listeners
      currentEls.forEach((el, i) => {
        el.removeEventListener('mouseenter', enterListeners[i]);
        el.removeEventListener('mouseleave', leaveListeners[i]);
      });

      setElements(els);
      groupRefs.current = els.map(() => null);
      hoverStates.current = els.map(() => false);
      
      // Cleanup old mixers
      mixers.current = [];
      
      currentEls = els;

      // Add new listeners
      enterListeners = els.map((_, i) => () => onEnter(i));
      leaveListeners = els.map((_, i) => () => onLeave(i));

      els.forEach((el, i) => {
        el.addEventListener('mouseenter', enterListeners[i]);
        el.addEventListener('mouseleave', leaveListeners[i]);
      });
    };

    findElements();
    const timeout = setTimeout(findElements, 500); // safety fallback

    return () => {
      clearTimeout(timeout);
      currentEls.forEach((el, i) => {
        el.removeEventListener('mouseenter', enterListeners[i]);
        el.removeEventListener('mouseleave', leaveListeners[i]);
      });
    };
  }, []);

  useFrame((state, delta) => {
    // Update animations
    mixers.current.forEach(mixer => mixer.update(delta));

    elements.forEach((el, index) => {
      const group = groupRefs.current[index];
      if (!group) return;

      const rect = el.getBoundingClientRect();
      
      // Calculate Normalized Device Coordinates (NDC)
      // We want the center of the element
      const x = (rect.left + rect.width / 2) / window.innerWidth * 2 - 1;
      const y = -(rect.top + rect.height / 2) / window.innerHeight * 2 + 1;

      // Project NDC to World Space at a specific Z depth
      const vector = new THREE.Vector3(x, y, 0.5);
      vector.unproject(camera);

      // The vector is now a point on the ray from the camera. 
      // We need to place our mesh at a fixed distance from the camera or at z=0.
      // Since the camera is moving in Z, we'll place it slightly in front of the camera's Z.
      const targetZ = camera.position.z - 5; 
      
      // Calculate intersection with plane Z = targetZ
      const dir = vector.sub(camera.position).normalize();
      const distance = (targetZ - camera.position.z) / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));

      // Smooth interpolation for silky movement
      group.position.lerp(pos, 0.1);
      
      const isHovered = hoverStates.current[index];

      // Adjust scale to keep models visible behind cards without clipping
      const baseScale = index % 2 === 0 ? 1.0 : 1.2; // Panel = 1.0, Female = 1.2
      const targetScale = isHovered ? baseScale * 1.1 : baseScale;
      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      // We'll give it a gentle constant rotation, faster when hovered
      const rotSpeed = isHovered ? 0.05 : 0.01;
      group.rotation.x += rotSpeed;
      group.rotation.y += rotSpeed * 1.5;

      // Pulse color on children
      const col = new THREE.Color(color.current);
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m) {
            m.color?.copy(col);
            m.emissive?.copy(col);
            m.emissiveIntensity = 0.8;
            m.transparent = true;
            m.opacity = 0.4;
            m.wireframe = false;
            m.roughness = 0.1;
            m.metalness = 0.8;
          }
        }
      });
    });
  });

  if (elements.length === 0) return null;

  return (
    <group>
      {elements.map((_, i) => {
        // Alternate models for variety
        const isPanel = i % 2 === 0;
        const clonedScene = (isPanel ? panelModel : femaleModel).clone();
        const anims = isPanel ? panelAnims : femaleAnims;

        return (
          <group 
            key={i} 
            ref={(el) => {
              groupRefs.current[i] = el;
              if (el && anims.length > 0 && !mixers.current[i]) {
                const mixer = new THREE.AnimationMixer(el);
                const action = mixer.clipAction(anims[0]);
                action.play();
                mixers.current[i] = mixer;
              }
            }}
          >
            <primitive object={clonedScene} />
          </group>
        );
      })}
    </group>
  );
}

// Preload to avoid jitter
useGLTF.preload('/models/panel-anim-bones-02.glb');
useGLTF.preload('/models/female.glb');

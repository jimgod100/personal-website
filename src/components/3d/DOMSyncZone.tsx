import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Cached objects to avoid per-frame GC pressure
const _vec3 = new THREE.Vector3();
const _scaleVec = new THREE.Vector3();
const _color = new THREE.Color();
const _hsl = { h: 0, s: 0, l: 0 };

/**
 * DOMSyncZone mimics Lusion's WebGL-Scroll-Sync.
 * It finds all DOM elements with `data-dom-sync` and tracks their screen coordinates,
 * projecting them into the 3D scene so that a 3D object is always perfectly aligned behind the DOM element.
 */
export default function DOMSyncZone({ color }: { color: React.MutableRefObject<string> }) {
  const { size, camera } = useThree();
  const [elements, setElements] = useState<HTMLElement[]>([]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const hoverStates = useRef<boolean[]>([]);
  const mixers = useRef<THREE.AnimationMixer[]>([]);

  // We'll duplicate the base model up to N times
  const MAX_DOM_ELEMENTS = 10;

  // Load Lusion GLTF models
  const { scene: panelModel, animations: panelAnims } = useGLTF('/models/panel-anim-bones-02.glb');
  const { scene: femaleModel, animations: femaleAnims } = useGLTF('/models/female.glb');
  
  // Clone models properly for SkinnedMeshes and deep-clone materials to avoid affecting other components
  const clonedScenes = useMemo(() => {
    return Array.from({ length: MAX_DOM_ELEMENTS }).map((_, i) => {
      const isPanel = i % 2 === 0;
      const clone = SkeletonUtils.clone(isPanel ? panelModel : femaleModel);
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            mesh.material = (mesh.material as THREE.Material).clone();
          }
        }
      });
      return clone;
    });
  }, [panelModel, femaleModel, MAX_DOM_ELEMENTS]);
  
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

    const isDarkMode = document.documentElement.getAttribute('data-theme') !== 'light';

    elements.forEach((el, index) => {
      const group = groupRefs.current[index];
      if (!group) return;

      const rect = el.getBoundingClientRect();
      
      // Calculate Normalized Device Coordinates (NDC)
      // We want the center of the element
      const x = (rect.left + rect.width / 2) / window.innerWidth * 2 - 1;
      const y = -(rect.top + rect.height / 2) / window.innerHeight * 2 + 1;

      // Project NDC to World Space at a specific Z depth
      _vec3.set(x, y, 0.5);
      _vec3.unproject(camera);

      // The vector is now a point on the ray from the camera. 
      // We need to place our mesh at a fixed distance from the camera or at z=0.
      // Push models further back to stay strictly behind cards and avoid 'giant' look
      const targetZ = camera.position.z - 4; 
      
      // Calculate intersection with plane Z = targetZ
      const dir = _vec3.sub(camera.position).normalize();
      const distance = (targetZ - camera.position.z) / dir.z;
      // dir is now _vec3, so we need a separate vector for pos
      _scaleVec.copy(camera.position).add(dir.multiplyScalar(distance));

      // Smooth interpolation for silky movement
      group.position.lerp(_scaleVec, 0.1);
      
      const isHovered = hoverStates.current[index];

      // Smaller scales to fit neatly behind cards
      const baseScale = index % 2 === 0 ? 0.6 : 0.8; // Panel = 0.6, Female = 0.8
      const targetScale = isHovered ? baseScale * 1.15 : baseScale;
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, targetScale, 0.1));

      // We'll give it a gentle constant rotation, faster when hovered
      const rotSpeed = isHovered ? 0.05 : 0.01;
      group.rotation.x += rotSpeed;
      group.rotation.y += rotSpeed * 1.5;

      // Theme-aware Holographic styling
      _color.set(color.current);
      
      if (!isDarkMode) {
        // In Light Mode, we need the model to be darker/more saturated to be visible on white
        _color.getHSL(_hsl);
        _hsl.s = 1.0;
        _hsl.l = Math.min(_hsl.l, 0.35);
        _color.setHSL(_hsl.h, _hsl.s, _hsl.l);
      }

      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (m) {
            m.color?.copy(_color);
            m.emissive?.copy(_color);
            m.emissiveIntensity = isDarkMode ? (isHovered ? 2.5 : 1.5) : (isHovered ? 1.0 : 0.5);
            m.transparent = true;
            m.opacity = isDarkMode ? (isHovered ? 0.8 : 0.6) : (isHovered ? 0.95 : 0.85);
            m.wireframe = isHovered;
            m.roughness = 0.0;
            m.metalness = 1.0;
            // Additive blending looks amazing in dark mode, but breaks in light mode
            m.blending = isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending;
            m.depthWrite = !isDarkMode; // Allow transparency stacking in dark mode
          }
        }
      });
    });
  });

  if (elements.length === 0) return null;

  return (
    <group>
      {elements.map((_, i) => {
        if (i >= MAX_DOM_ELEMENTS) return null;
        
        // Alternate models for variety
        const isPanel = i % 2 === 0;
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
            <primitive object={clonedScenes[i]} />
          </group>
        );
      })}
    </group>
  );
}

// Preload to avoid jitter
useGLTF.preload('/models/panel-anim-bones-02.glb');
useGLTF.preload('/models/female.glb');

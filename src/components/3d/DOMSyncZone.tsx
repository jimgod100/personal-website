import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * DOMSyncZone mimics Lusion's WebGL-Scroll-Sync.
 * It finds all DOM elements with `data-webgl-sync` and tracks their screen coordinates,
 * projecting them into the 3D scene so that a 3D object is always perfectly aligned behind the DOM element.
 */
export default function DOMSyncZone({ color }: { color: React.MutableRefObject<string> }) {
  const { size, camera } = useThree();
  const [elements, setElements] = useState<HTMLElement[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const hoverStates = useRef<boolean[]>([]);
  
  // Find all elements to sync on mount and after a short delay (in case Astro renders them late)
  useEffect(() => {
    let currentEls: HTMLElement[] = [];
    let enterListeners: (() => void)[] = [];
    let leaveListeners: (() => void)[] = [];
    
    const onEnter = (i: number) => { hoverStates.current[i] = true; };
    const onLeave = (i: number) => { hoverStates.current[i] = false; };

    const findElements = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-webgl-sync]'));
      
      // Clean up old listeners
      currentEls.forEach((el, i) => {
        el.removeEventListener('mouseenter', enterListeners[i]);
        el.removeEventListener('mouseleave', leaveListeners[i]);
      });

      setElements(els);
      meshRefs.current = els.map(() => null);
      hoverStates.current = els.map(() => false);
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

  useFrame((state) => {
    elements.forEach((el, index) => {
      const mesh = meshRefs.current[index];
      if (!mesh) return;

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
      mesh.position.lerp(pos, 0.1);
      
      const isHovered = hoverStates.current[index];

      // Scale based on distance or rect size so it roughly matches the card size
      const targetScale = isHovered ? 1.5 : 1.0;
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      // We'll give it a gentle constant rotation, faster when hovered
      const rotSpeed = isHovered ? 0.05 : 0.01;
      mesh.rotation.x += rotSpeed;
      mesh.rotation.y += rotSpeed * 1.5;

      // Pulse color
      const col = new THREE.Color(color.current);
      (mesh.material as THREE.MeshStandardMaterial).color.copy(col);
      (mesh.material as THREE.MeshStandardMaterial).emissive.copy(col);
    });
  });

  if (elements.length === 0) return null;

  return (
    <group>
      {elements.map((_, i) => (
        <mesh key={i} ref={(el) => (meshRefs.current[i] = el)}>
          {/* A cool geometric shape behind each project card */}
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial 
            roughness={0.2}
            metalness={0.8}
            wireframe={true}
            transparent
            opacity={0.3}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

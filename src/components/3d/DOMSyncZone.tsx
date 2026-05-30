import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Cached objects to avoid per-frame GC pressure
const _vec3 = new THREE.Vector3();
const _scaleVec = new THREE.Vector3();
const _color = new THREE.Color();

const TILE_MODELS = [
  '/models/tile-1.glb',
  '/models/tile-2.glb',
  '/models/tile-3.glb',
  '/models/tile-4.glb',
];

/**
 * DOMSyncZone — Projects 3D tile models behind DOM elements with `data-dom-sync`.
 * Uses lightweight tile GLBs instead of heavy character models.
 */
export default function DOMSyncZone({ color }: { color: React.MutableRefObject<string> }) {
  const { camera } = useThree();
  const [elements, setElements] = useState<HTMLElement[]>([]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const hoverStates = useRef<boolean[]>([]);
  // P0-2 fix: cache mesh refs per clone to avoid per-frame traverse
  const meshRefsPerClone = useRef<THREE.MeshStandardMaterial[][]>([]);

  const MAX_DOM_ELEMENTS = 8;

  // Load all tile models
  const tile1 = useGLTF(TILE_MODELS[0]);
  const tile2 = useGLTF(TILE_MODELS[1]);
  const tile3 = useGLTF(TILE_MODELS[2]);
  const tile4 = useGLTF(TILE_MODELS[3]);
  const tileScenes = [tile1.scene, tile2.scene, tile3.scene, tile4.scene];

  // Clone models with deep-cloned materials and cache mesh material refs
  const clonedScenes = useMemo(() => {
    const meshRefs: THREE.MeshStandardMaterial[][] = [];

    const scenes = Array.from({ length: MAX_DOM_ELEMENTS }).map((_, i) => {
      const tileIndex = i % TILE_MODELS.length;
      const clone = tileScenes[tileIndex].clone(true);
      const mats: THREE.MeshStandardMaterial[] = [];

      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const clonedMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
            mesh.material = clonedMat;
            mats.push(clonedMat);
          }
        }
      });

      meshRefs.push(mats);
      return clone;
    });

    meshRefsPerClone.current = meshRefs;
    return scenes;
  }, [tile1.scene, tile2.scene, tile3.scene, tile4.scene]);

  // Find all elements to sync
  useEffect(() => {
    let currentEls: HTMLElement[] = [];
    let enterListeners: (() => void)[] = [];
    let leaveListeners: (() => void)[] = [];

    const onEnter = (i: number) => { hoverStates.current[i] = true; };
    const onLeave = (i: number) => { hoverStates.current[i] = false; };

    const findElements = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-dom-sync]'));

      currentEls.forEach((el, i) => {
        el.removeEventListener('mouseenter', enterListeners[i]);
        el.removeEventListener('mouseleave', leaveListeners[i]);
      });

      setElements(els);
      groupRefs.current = els.map(() => null);
      hoverStates.current = els.map(() => false);
      currentEls = els;

      enterListeners = els.map((_, i) => () => onEnter(i));
      leaveListeners = els.map((_, i) => () => onLeave(i));

      els.forEach((el, i) => {
        el.addEventListener('mouseenter', enterListeners[i]);
        el.addEventListener('mouseleave', leaveListeners[i]);
      });
    };

    findElements();
    const timeout = setTimeout(findElements, 500);

    return () => {
      clearTimeout(timeout);
      currentEls.forEach((el, i) => {
        el.removeEventListener('mouseenter', enterListeners[i]);
        el.removeEventListener('mouseleave', leaveListeners[i]);
      });
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    elements.forEach((el, index) => {
      const group = groupRefs.current[index];
      if (!group) return;

      const rect = el.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth * 2 - 1;
      const y = -(rect.top + rect.height / 2) / window.innerHeight * 2 + 1;

      // Project to world space
      _vec3.set(x, y, 0.5);
      _vec3.unproject(camera);
      const targetZ = camera.position.z - 4;
      const dir = _vec3.sub(camera.position).normalize();
      const distance = (targetZ - camera.position.z) / dir.z;
      _scaleVec.copy(camera.position).add(dir.multiplyScalar(distance));

      group.position.lerp(_scaleVec, 0.1);

      const isHovered = hoverStates.current[index];

      // Scale
      const targetScale = isHovered ? 0.9 : 0.7;
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, targetScale, 0.1));

      // Gentle floating bob (not constant rotation)
      group.rotation.y = THREE.MathUtils.lerp(
        group.rotation.y,
        Math.sin(time * 0.5 + index * 1.5) * 0.3,
        0.05
      );
      group.position.y += Math.sin(time * 0.8 + index * 2) * 0.002;

      // P0-2 fix: use cached material refs instead of traverse
      const mats = meshRefsPerClone.current[index];
      if (mats) {
        const targetEmissive = isHovered ? 0.4 : 0.0;
        for (let mi = 0; mi < mats.length; mi++) {
          const m = mats[mi];
          m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, targetEmissive, 0.1);
          if (isHovered && m.emissive) {
            _color.set(color.current);
            m.emissive.lerp(_color, 0.1);
          } else if (m.emissive) {
            m.emissive.lerp(_color.set(0x000000), 0.1);
          }
        }
      }
    });
  });

  return (
    <group visible={elements.length > 0}>
      {elements.map((_, i) => {
        if (i >= MAX_DOM_ELEMENTS) return null;
        return (
          <group
            key={i}
            ref={(el) => { groupRefs.current[i] = el; }}
          >
            <primitive object={clonedScenes[i]} />
          </group>
        );
      })}
    </group>
  );
}

// Preload tile models
TILE_MODELS.forEach((path) => useGLTF.preload(path));

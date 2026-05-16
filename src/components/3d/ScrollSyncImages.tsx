/**
 * ScrollSyncImages — Port of WebGL-Scroll-Sync-main.
 * Creates WebGL planes that perfectly overlay DOM image elements,
 * applying scroll-velocity-driven glitch distortion shaders.
 *
 * Uses: WebGL-Scroll-Sync images (0.webp–7.webp),
 *       scrollSyncImage.vert.glsl, scrollSyncImage.frag.glsl
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from './shaders/scrollSyncImage.vert.glsl';
import fragmentShader from './shaders/scrollSyncImage.frag.glsl';

const IMAGE_PATHS = [
  '/images/webgl-sync/0.webp',
  '/images/webgl-sync/1.webp',
  '/images/webgl-sync/2.webp',
  '/images/webgl-sync/3.webp',
  '/images/webgl-sync/4.webp',
  '/images/webgl-sync/5.webp',
  '/images/webgl-sync/6.webp',
  '/images/webgl-sync/7.webp',
];

interface Props {
  velocityData: React.MutableRefObject<{ velocity: number; targetVelocity: number }>;
}

interface ScrollSyncItem {
  domElement: HTMLElement;
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
}

export default function ScrollSyncImages({ velocityData }: Props) {
  const { gl, scene: mainScene, size } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [items, setItems] = useState<ScrollSyncItem[]>([]);
  const strengthRef = useRef(0);
  const prevScrollY = useRef(0);
  const timeRef = useRef(0);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), []);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  // Shared uniform refs
  const sharedUniforms = useMemo(
    () => ({
      u_resolution: { value: new THREE.Vector2(size.width, size.height) },
      u_scrollOffset: { value: new THREE.Vector2(0, 0) },
      u_time: { value: 0 },
      u_strength: { value: 0 },
    }),
    []
  );

  // Find DOM elements and create meshes
  useEffect(() => {
    const findElements = () => {
      const domElements = Array.from(
        document.querySelectorAll<HTMLElement>('[data-webgl-image]')
      );

      const newItems: ScrollSyncItem[] = domElements.map((el, i) => {
        const imgIndex = parseInt(el.getAttribute('data-webgl-image') || '0', 10);
        const texturePath = IMAGE_PATHS[imgIndex % IMAGE_PATHS.length];

        const material = new THREE.ShaderMaterial({
          uniforms: {
            u_texture: { value: textureLoader.load(texturePath) },
            u_domXY: { value: new THREE.Vector2(0, 0) },
            u_domWH: { value: new THREE.Vector2(1, 1) },
            u_resolution: sharedUniforms.u_resolution,
            u_scrollOffset: sharedUniforms.u_scrollOffset,
            u_time: sharedUniforms.u_time,
            u_strength: sharedUniforms.u_strength,
            u_rands: { value: new THREE.Vector4(0, 0, 0, 0) },
            u_id: { value: i },
          },
          vertexShader,
          fragmentShader,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;

        return { domElement: el, mesh, material };
      });

      setItems(newItems);
    };

    findElements();
    const timeout = setTimeout(findElements, 600);
    return () => clearTimeout(timeout);
  }, []);

  // Update resolution on resize
  useEffect(() => {
    sharedUniforms.u_resolution.value.set(size.width, size.height);
  }, [size]);

  useFrame((state, delta) => {
    const scrollY = window.scrollY;
    const scrollDelta = scrollY - prevScrollY.current;

    // Update strength (exponential decay + scroll boost)
    const targetStrength = (Math.abs(scrollDelta) * 10) / window.innerHeight;
    strengthRef.current *= Math.exp(-delta * 10);
    strengthRef.current += Math.min(targetStrength, 5);

    // Update shared uniforms
    timeRef.current += delta;
    sharedUniforms.u_time.value = timeRef.current;
    sharedUniforms.u_strength.value = Math.min(1, strengthRef.current);
    sharedUniforms.u_scrollOffset.value.set(window.scrollX, scrollY);

    // Update each item
    items.forEach((item) => {
      const rect = item.domElement.getBoundingClientRect();

      item.material.uniforms.u_domXY.value.set(
        rect.left + window.scrollX,
        rect.top + window.scrollY
      );
      item.material.uniforms.u_domWH.value.set(rect.width, rect.height);

      // Random glitch seed update
      if (Math.random() > Math.exp(-delta * 25 * (1 + strengthRef.current))) {
        item.material.uniforms.u_rands.value = new THREE.Vector4(
          Math.random(), Math.random(), Math.random(), Math.random()
        );
      }

      // Visibility optimization
      const canvasTop = scrollY;
      const canvasBottom = canvasTop + window.innerHeight;
      const itemTop = rect.top + scrollY;
      item.mesh.visible = itemTop < canvasBottom && itemTop + rect.height > canvasTop;
    });

    prevScrollY.current = scrollY;
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => (
        <primitive key={i} object={item.mesh} />
      ))}
    </group>
  );
}

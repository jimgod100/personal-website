/**
 * ProjectTilePortals — Port of lusion-reverse-engineered's ProjectTiles + ProjectTile.
 * Each project card gets a portal (render-to-texture) scene containing one of the
 * 4 tile GLB models. The portal camera follows mouse movement for a parallax effect.
 * The rendered texture is applied to a stretched plane with scroll-driven distortion,
 * animated rounded-corner mask, and IntersectionObserver reveal.
 *
 * Uses: tile-1.glb through tile-4.glb, studio_small_08_1k.hdr,
 *       projectTile.vert.glsl, projectTile.frag.glsl
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import projectTileVert from './shaders/projectTile.vert.glsl';
import projectTileFrag from './shaders/projectTile.frag.glsl';

const TILE_MODELS = [
  '/models/tile-1.glb',
  '/models/tile-2.glb',
  '/models/tile-3.glb',
  '/models/tile-4.glb',
];

const HORIZONTAL_MASK_CLOSED = 0.5;
const HORIZONTAL_MASK_OPEN = 0;
const CAMERA_MOVEMENT_COEF = 0.6;
const DEFAULT_CAM_POS = new THREE.Vector3(0, 0, 4);

interface TileProps {
  elementId: string;
  modelPath: string;
  index: number;
  color: React.MutableRefObject<string>;
}

function SingleTilePortal({ elementId, modelPath, index, color }: TileProps) {
  const { gl, camera: mainCamera, size } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Portal scene setup
  const portalScene = useMemo(() => new THREE.Scene(), []);
  const portalCamera = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(45, 16 / 9);
    cam.position.copy(DEFAULT_CAM_POS);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  // Render target
  const renderTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1024, 576, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      }),
    []
  );

  // Load the tile model
  const { scene: tileScene } = useGLTF(modelPath);

  // Add to portal scene
  useEffect(() => {
    const clone = tileScene.clone();
    portalScene.add(clone);

    // Add basic lighting to portal
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(3, 5, 4);
    portalScene.add(ambient, directional);

    portalScene.background = new THREE.Color('#eee');

    return () => {
      portalScene.remove(clone);
      portalScene.remove(ambient);
      portalScene.remove(directional);
    };
  }, [tileScene, portalScene]);

  // Shader material
  const shaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        maskAmount: { value: HORIZONTAL_MASK_CLOSED },
        aspect: { value: 16 / 9 },
        stretchAmount: { value: 0 },
        map: { value: renderTarget.texture },
      },
      vertexShader: projectTileVert,
      fragmentShader: projectTileFrag,
      transparent: true,
    });
  }, [renderTarget.texture]);

  // State
  const targetCameraPos = useRef(DEFAULT_CAM_POS.clone());
  const maskTarget = useRef(HORIZONTAL_MASK_CLOSED);
  const stretchTarget = useRef(0);
  const lastScrollY = useRef(0);
  const rect = useRef({ x: 0, y: 0, width: 300, height: 170 });

  // DOM interaction
  useEffect(() => {
    const el = document.getElementById(elementId);
    if (!el) return;

    const onMouseMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2 * CAMERA_MOVEMENT_COEF;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2 * CAMERA_MOVEMENT_COEF;
      targetCameraPos.current.set(DEFAULT_CAM_POS.x + x, DEFAULT_CAM_POS.y - y, DEFAULT_CAM_POS.z);
    };

    const onMouseLeave = () => {
      targetCameraPos.current.copy(DEFAULT_CAM_POS);
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    // IntersectionObserver for mask reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        maskTarget.current = entry.isIntersecting ? HORIZONTAL_MASK_OPEN : HORIZONTAL_MASK_CLOSED;
      });
    });
    observer.observe(el);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      observer.disconnect();
    };
  }, [elementId]);

  useFrame((state, delta) => {
    const el = document.getElementById(elementId);
    if (!el || !groupRef.current) return;

    // Update rect from DOM
    const domRect = el.getBoundingClientRect();
    rect.current = {
      x: domRect.left + domRect.width / 2,
      y: domRect.top + domRect.height / 2,
      width: domRect.width,
      height: domRect.height,
    };

    // Position the mesh to match DOM element via NDC -> world projection
    const ndcX = (rect.current.x / window.innerWidth) * 2 - 1;
    const ndcY = -(rect.current.y / window.innerHeight) * 2 + 1;

    const vec = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(mainCamera);
    const dir = vec.sub(mainCamera.position).normalize();
    const targetZ = mainCamera.position.z - 4;
    const dist = (targetZ - mainCamera.position.z) / dir.z;
    const pos = mainCamera.position.clone().add(dir.multiplyScalar(dist));

    groupRef.current.position.lerp(pos, 0.15);

    // Scale to match DOM size perfectly based on camera FOV and distance
    const vFov = (mainCamera as THREE.PerspectiveCamera).fov * Math.PI / 180;
    const distance = Math.abs(mainCamera.position.z - targetZ);
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
    const worldHeight = visibleHeight * (rect.current.height / window.innerHeight);
    const worldWidth = worldHeight * (rect.current.width / rect.current.height);
    groupRef.current.scale.set(worldWidth, worldHeight, 1);

    // Camera parallax
    portalCamera.position.lerp(targetCameraPos.current, delta * 8);

    // Mask animation
    shaderMat.uniforms.maskAmount.value = THREE.MathUtils.lerp(
      shaderMat.uniforms.maskAmount.value,
      maskTarget.current,
      delta * 3
    );

    // Scroll stretch
    const currentScrollY = window.scrollY;
    if (lastScrollY.current !== 0 && lastScrollY.current !== currentScrollY) {
      const distance = currentScrollY - lastScrollY.current;
      const speed = distance / Math.max(delta, 0.001);
      stretchTarget.current = THREE.MathUtils.clamp(speed * 0.00005, -1, 1);
    } else {
      stretchTarget.current = 0;
    }
    lastScrollY.current = currentScrollY;

    shaderMat.uniforms.stretchAmount.value = THREE.MathUtils.lerp(
      shaderMat.uniforms.stretchAmount.value,
      stretchTarget.current,
      delta * 5
    );

    // Render portal to texture
    gl.setRenderTarget(renderTarget);
    gl.render(portalScene, portalCamera);
    gl.setRenderTarget(null);
  });

  return (
    <group ref={groupRef}>
      <mesh material={shaderMat}>
        <planeGeometry args={[1, 1, 64, 1]} />
      </mesh>
    </group>
  );
}

interface PortalsProps {
  color: React.MutableRefObject<string>;
}

export default function ProjectTilePortals({ color }: PortalsProps) {
  const [tileElements, setTileElements] = useState<string[]>([]);

  useEffect(() => {
    const findTiles = () => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-webgl-sync]'));
      setTileElements(cards.map((el) => el.getAttribute('data-webgl-sync') || '').filter(Boolean));
    };
    findTiles();
    const timeout = setTimeout(findTiles, 800);
    return () => clearTimeout(timeout);
  }, []);

  if (tileElements.length === 0) return null;

  return (
    <group>
      {tileElements.map((slug, i) => (
        <SingleTilePortal
          key={slug}
          elementId={`tile-portal-${slug}`}
          modelPath={TILE_MODELS[i % TILE_MODELS.length]}
          index={i}
          color={color}
        />
      ))}
    </group>
  );
}

// Preload all tile models
TILE_MODELS.forEach((path) => useGLTF.preload(path));

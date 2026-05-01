/**
 * SceneWorld — root Three.js scene.
 * Manages fog, ambient light, camera updates (scroll + mouse parallax),
 * and mounts ParticleField + WireframeZone.
 *
 * Camera update order:
 *  1. useCameraIntro runs a GSAP tween on first mount (introFinished.current = false)
 *  2. Once intro completes, the useFrame block below takes full control
 *  ALL camera writes are gated behind introFinished.current to prevent fighting the tween.
 */
import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import ParticleField from './ParticleField';
import WireframeZone from './WireframeZone';
import { useCameraScroll } from './useCameraScroll';
import { useCameraIntro } from './useCameraIntro';

function getThemeColors() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    accent:   dark ? '#3dbab3' : '#1aa39c',
    fogColor: dark ? '#0f1113' : '#f8f9fa',
  };
}

export default function SceneWorld() {
  const { scene, camera } = useThree();
  const scrollData    = useCameraScroll();   // MutableRefObject<TimelineState>
  const introFinished = useCameraIntro();    // MutableRefObject<boolean>

  const accentColor = useRef(getThemeColors().accent);
  const mouse       = useRef({ x: 0, y: 0 });

  // ── Initial fog & background setup ───────────────────────────────────────
  useEffect(() => {
    const { fogColor } = getThemeColors();
    scene.fog        = new THREE.FogExp2(fogColor, 0.02);
    scene.background = new THREE.Color(fogColor);
    return () => { scene.fog = null; };
  }, [scene]);

  // ── Live dark-mode sync via MutationObserver ───────────────────────────
  useEffect(() => {
    const sync = () => {
      const { fogColor, accent } = getThemeColors();
      accentColor.current = accent;
      if (scene.fog instanceof THREE.FogExp2) scene.fog.color.set(fogColor);
      (scene.background as THREE.Color)?.set(fogColor);
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [scene]);

  // ── Mouse parallax listener ────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth)  *  2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * -2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // ── Per-frame: fog density + camera ─────────────────────────────────────
  useFrame(() => {
    const sd = scrollData.current;

    // Update fog density from scroll timeline
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, sd.fogDensity, 0.05);
    }

    // Camera is owned by GSAP until intro finishes
    if (!introFinished.current) return;

    // Scroll-driven Z + Y
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, sd.cameraZ, 0.08);
    const breathY = Math.sin(Date.now() * 0.001) * 0.1;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, sd.cameraY + breathY, 0.08);

    // Mouse parallax fades as camera moves deep into scene
    const parallaxFactor = Math.max(0, 1 - sd.cameraZ / 20);
    if (parallaxFactor > 0) {
      camera.position.x  = THREE.MathUtils.lerp(camera.position.x,  mouse.current.x *  0.5  * parallaxFactor, 0.05);
      camera.rotation.y  = THREE.MathUtils.lerp(camera.rotation.y,  -mouse.current.x * 0.05 * parallaxFactor, 0.05);
      camera.rotation.x  = THREE.MathUtils.lerp(camera.rotation.x,  mouse.current.y *  0.05 * parallaxFactor, 0.05);
    } else {
      camera.position.x  = THREE.MathUtils.lerp(camera.position.x,  0, 0.05);
      camera.rotation.y  = THREE.MathUtils.lerp(camera.rotation.y,  0, 0.05);
      camera.rotation.x  = THREE.MathUtils.lerp(camera.rotation.x,  0, 0.05);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <ParticleField densityRef={scrollData} baseColor={accentColor.current} />
      <WireframeZone  opacity={scrollData.current.wireframeOpacity} baseColor={accentColor.current} />
    </>
  );
}

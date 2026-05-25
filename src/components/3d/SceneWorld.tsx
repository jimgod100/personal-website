/**
 * SceneWorld — Root Three.js scene orchestrating ALL integrated features.
 * 
 * Integrates resources from 3 reference projects:
 * 
 * From lusion-reverse-engineered-main:
 *  - AnimatedNurbsTube (nurbs-canxerian.json curve)
 *  - VideoPanelBones (panel-anim-bones-*.glb models)
 *  - LoadingScreen (shader-based loading animation)
 *  - EnvironmentSetup (quarry_01_1k.hdr, grid.png)
 *  - PhysicsSandboxZone (physics-mask.glb concept)
 *  - HeroPhysicsZone (physics crosses + optimer font)
 *  - Project tile GLBs (tile-1 through tile-4)
 *
 * From lusion-main:
 *  - FemaleCharacter (female.glb + animation.glb)
 *  - DOMSyncZone (panel models synced to DOM)
 *  - Fonts (GT-Sectra, NB Akademie)
 *  - Textures (floor.jpg, c3.jpg, dark.png)
 *
 * From WebGL-Scroll-Sync-main:
 *  - ScrollSyncImages (glitch shader on DOM images, 0-7.webp)
 *
 * Camera update order:
 *  1. useCameraIntro runs a GSAP tween on first mount
 *  2. Once intro completes, useFrame takes full control
 */
import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Core zones (existing)
import ParticleField from './ParticleField';
import WireframeZone from './WireframeZone';
import HeroPhysicsZone from './HeroPhysicsZone';
import ScrollTube from './ScrollTube';
import DOMSyncZone from './DOMSyncZone';

// New integrated zones
import AnimatedNurbsTube from './AnimatedNurbsTube';
import VideoPanelBones from './VideoPanelBones';
import EnvironmentSetup from './EnvironmentSetup';
import PhysicsSandboxZone from './PhysicsSandboxZone';

import { useCameraScroll } from './useCameraScroll';
import { useCameraIntro } from './useCameraIntro';
import { interpolateTimeline } from './sceneTimeline';

function getThemeColors() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    accent:   dark ? '#3dbab3' : '#1aa39c',
    fogColor: dark ? '#0f1113' : '#f8f9fa',
  };
}

export default function SceneWorld() {
  const { scene, camera } = useThree();
  const { scrollData, velocityData, scrollProgressRef } = useCameraScroll();
  const introFinished = useCameraIntro();

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

  const lerpedProgress = useRef(0);
  const smoothedWireframeOpacity = useRef(0);

  // ── Per-frame: fog density + camera ─────────────────────────────────────
  useFrame((state, delta) => {
    // Smoothing scroll progress for better "experience" (體感)
    lerpedProgress.current = THREE.MathUtils.lerp(
      lerpedProgress.current,
      scrollProgressRef.current,
      delta * 4 // Smoothing factor
    );
    
    // Update timeline state with smoothed progress
    const sd = interpolateTimeline(lerpedProgress.current);
    smoothedWireframeOpacity.current = sd.wireframeOpacity;
    
    // Update fog density
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, sd.fogDensity, 0.05);
    }

    // Camera intro check
    if (!introFinished.current) return;

    // Apply smoothed camera movement
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, sd.cameraZ, 0.1);
    const breathY = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, sd.cameraY + breathY, 0.1);

    // Mouse parallax fades as camera moves deep into scene
    const parallaxFactor = Math.max(0, Math.min(1, 1 - Math.abs(sd.cameraZ - 12) / 30));
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
      {/* Loading screen removed — bypassed */}

      {/* ═══ Environment (lusion-reverse-engineered HDRI + grid) ═══ */}
      <EnvironmentSetup scrollProgress={scrollProgressRef} />

      {/* ═══ Lighting ═══ */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 20]} intensity={1.5} />

      {/* ═══ Zone 1: Hero ═══ */}
      {/* Particle Field */}
      <ParticleField densityRef={scrollData} baseColor={accentColor} />
      
      {/* Physics Stacking Crosses (existing) */}
      <HeroPhysicsZone baseColor={accentColor} />

      {/* ═══ Zone 2: About / Experience ═══ */}
      {/* Wireframe Zone */}
      <WireframeZone opacityRef={smoothedWireframeOpacity} baseColor={accentColor} />

      {/* Animated NURBS Tube (lusion-reverse-engineered: nurbs-canxerian.json) */}
      <AnimatedNurbsTube scrollProgress={scrollProgressRef} color={accentColor} />

      {/* Video Panel Bones (lusion-reverse-engineered: panel-anim-bones-*.glb) */}
      <VideoPanelBones scrollProgress={scrollProgressRef} baseColor={accentColor} />

      {/* ═══ Zone 3: Projects ═══ */}
      {/* DOM-to-WebGL Sync (lusion-main models synced to cards) */}
      <DOMSyncZone color={accentColor} />

      {/* ═══ Zone 4: Skills / Education ═══ */}
      {/* Physics Sandbox (lusion-reverse-engineered concept) */}
      <PhysicsSandboxZone baseColor={accentColor} scrollProgress={scrollProgressRef} />

      {/* ═══ Zone 5: Contact ═══ */}
      {/* Dynamic Scroll Tube */}
      <ScrollTube color={accentColor} velocityData={velocityData} />
    </>
  );
}

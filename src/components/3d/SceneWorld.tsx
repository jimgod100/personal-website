import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import ParticleField from './ParticleField';
import WireframeZone from './WireframeZone';
import { useCameraScroll } from './useCameraScroll';
import { useCameraIntro } from './useCameraIntro';

export default function SceneWorld() {
  const { scene, camera } = useThree();
  const scrollData = useCameraScroll();
  const introFinished = useCameraIntro();
  
  // Theme aware colors (simplified for now to match global theme vars conceptually)
  const isDark = typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') !== 'light';
  const accentColor = isDark ? '#3dbab3' : '#1aa39c';
  const fogColor = isDark ? '#0f1113' : '#f8f9fa';

  // Manage Fog
  useEffect(() => {
    scene.fog = new THREE.FogExp2(fogColor, scrollData.fogDensity);
    scene.background = new THREE.Color(fogColor);
    return () => {
      scene.fog = null;
    };
  }, [scene, fogColor]);

  // Update Fog density dynamically based on scroll
  useFrame(() => {
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, scrollData.fogDensity, 0.05);
    }
  });

  // Mouse Parallax for Zone 1 (Hero)
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // Update Camera based on scroll interpolation
  useFrame(() => {
    if (!introFinished.current) return; // Let GSAP handle intro

    // Lerp camera Z position based on scroll timeline
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, scrollData.cameraZ, 0.08);
    
    // Add subtle Y breathing + scroll Y drift
    const breathY = Math.sin(Date.now() * 0.001) * 0.1;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, scrollData.cameraY + breathY, 0.08);

    // Mouse parallax (strongest when scroll is 0, fades out as we move deep)
    const parallaxFactor = Math.max(0, 1 - scrollData.cameraZ / 20);
    if (parallaxFactor > 0) {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 0.5 * parallaxFactor, 0.05);
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -mouse.current.x * 0.05 * parallaxFactor, 0.05);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, mouse.current.y * 0.05 * parallaxFactor, 0.05);
    } else {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.05);
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, 0, 0.05);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0, 0.05);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Zone 1 & Background Particles */}
      <ParticleField density={scrollData.particleDensity} baseColor={accentColor} />
      
      {/* Zone 2 Wireframes */}
      <WireframeZone opacity={scrollData.wireframeOpacity} baseColor={accentColor} />
    </>
  );
}

/**
 * WorldCanvas — persistent full-screen R3F canvas, fixed behind all HTML content.
 * Mounted once at layout level via client:only="react".
 * aria-hidden so screen readers ignore the decorative 3D scene.
 */
import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SceneWorld from './3d/SceneWorld';

export default function WorldCanvas() {
  // Evaluated client-side only (this component is client:only="react")
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ powerPreference: 'high-performance', antialias: false }}
        frameloop={prefersReducedMotion ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          <SceneWorld />
        </Suspense>
      </Canvas>
    </div>
  );
}

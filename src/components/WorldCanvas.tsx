import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import SceneWorld from './3d/SceneWorld';

export default function WorldCanvas() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none', // Let clicks pass through to HTML
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
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

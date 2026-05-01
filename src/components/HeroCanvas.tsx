/**
 * HeroCanvas.tsx
 * React Three Fiber island — instanced particle field for the hero background.
 * 
 * Scroll binding: particles shift amplitude + rotation as user scrolls.
 * Dark mode sync: MutationObserver watches html[data-theme].
 * Mobile: reduces particles to 200. Below 768px: fully disabled (renders null).
 * prefers-reduced-motion: renders static frozen particles.
 */

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { InstancedMesh, Color, Object3D, MathUtils } from 'three';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DESKTOP_COUNT = 800;
const MOBILE_COUNT = 200;
const SPREAD = 8;

const COLORS = {
  light: {
    primary: '#1aa39c',   // teal-500
    secondary: '#6dcec8', // teal-300
    tertiary: '#0e6b66',  // teal-700
  },
  dark: {
    primary: '#3dbab3',   // teal-400
    secondary: '#6dcec8', // teal-300
    tertiary: '#1aa39c',  // teal-500
  },
};

/* ------------------------------------------------------------------ */
/*  Simple noise function (no dependencies)                            */
/* ------------------------------------------------------------------ */

function pseudoNoise(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/* ------------------------------------------------------------------ */
/*  Particle Field component (runs inside Canvas)                      */
/* ------------------------------------------------------------------ */

interface ParticleFieldProps {
  count: number;
  isDark: boolean;
  reducedMotion: boolean;
}

function ParticleField({ count, isDark, reducedMotion }: ParticleFieldProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const scrollProgress = useRef(0);

  // Generate initial positions
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * SPREAD * 2,
        y: (Math.random() - 0.5) * SPREAD * 2,
        z: (Math.random() - 0.5) * SPREAD,
        baseScale: 0.015 + Math.random() * 0.025,
        speed: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count]);

  // Colors
  const colorPalette = useMemo(() => {
    const palette = isDark ? COLORS.dark : COLORS.light;
    return {
      primary: new Color(palette.primary),
      secondary: new Color(palette.secondary),
      tertiary: new Color(palette.tertiary),
    };
  }, [isDark]);

  // Set initial colors
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const color = new Color();

    for (let i = 0; i < count; i++) {
      const t = i / count;
      if (t < 0.4) {
        color.copy(colorPalette.primary);
      } else if (t < 0.7) {
        color.copy(colorPalette.secondary);
      } else {
        color.copy(colorPalette.tertiary);
      }
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, colorPalette]);

  // Scroll listener — updates the ref (no re-render)
  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById('hero');
      if (!heroEl) return;
      const rect = heroEl.getBoundingClientRect();
      const heroHeight = heroEl.offsetHeight;
      // 0 when hero top is at viewport top, 1 when hero is fully scrolled past
      const progress = MathUtils.clamp(-rect.top / heroHeight, 0, 1);
      scrollProgress.current = progress;
    };

    // Use Lenis scroll event if available, otherwise native
    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.on('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    handleScroll(); // initial

    return () => {
      if (lenis) {
        lenis.off('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    const scroll = scrollProgress.current;

    // As scroll increases, amplitude grows and field rotates away
    const scrollAmplitude = reducedMotion ? 0 : 0.15 + scroll * 0.6;
    const rotationOffset = scroll * 0.3;

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // Breathing / floating motion
      const noise = pseudoNoise(p.x * 0.5, p.y * 0.5, time * 0.1);
      const floatY = Math.sin(time * p.speed + p.phase) * scrollAmplitude;
      const floatX = Math.cos(time * p.speed * 0.7 + p.phase) * scrollAmplitude * 0.5;
      const floatZ = noise * scrollAmplitude * 0.3;

      dummy.position.set(
        p.x + floatX,
        p.y + floatY,
        p.z + floatZ - scroll * 2, // push particles back as user scrolls
      );

      // Scale pulsing
      const scalePulse = reducedMotion ? 1 : 1 + Math.sin(time * 2 + p.phase) * 0.2;
      const fadeWithScroll = 1 - scroll * 0.5; // fade particles as user scrolls away
      const finalScale = p.baseScale * scalePulse * fadeWithScroll;
      dummy.scale.setScalar(Math.max(0.001, finalScale));

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    // Rotate the entire field subtly
    meshRef.current.rotation.y = rotationOffset + (reducedMotion ? 0 : time * 0.02);
    meshRef.current.rotation.x = rotationOffset * 0.3;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.7} toneMapped={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Main HeroCanvas component (exported to Astro)                      */
/* ------------------------------------------------------------------ */

export default function HeroCanvas() {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Viewport detection
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsSmallMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);

    // Reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    // Dark mode sync via MutationObserver
    const syncTheme = () => {
      setIsDark(
        document.documentElement.getAttribute('data-theme') === 'dark'
      );
    };
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      window.removeEventListener('resize', checkViewport);
      observer.disconnect();
    };
  }, []);

  // Fully disable Canvas on small mobile for performance
  if (isSmallMobile) return null;

  const count = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <Canvas
        frameloop="always"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <ParticleField
          count={count}
          isDark={isDark}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}

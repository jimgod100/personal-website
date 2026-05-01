/**
 * HeroCanvas.tsx
 * React Three Fiber island — Financial Data Network (Nodes & Edges).
 *
 * - InstancedMesh for nodes, BufferGeometry for edges.
 * - Nodes and edges pulse/breathe using simple trig functions.
 * - Scene orbits slightly based on mouse position.
 * - Camera pushes in/out based on scroll.
 * - Reduced particles on mobile, disabled below 768px.
 * - Respects prefers-reduced-motion (static frame).
 * - Pauses animation when document is hidden.
 */

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { InstancedMesh, Color, Object3D, MathUtils, Vector3, BufferGeometry, Float32BufferAttribute, LineSegments, AdditiveBlending } from 'three';

/* --- Constants --- */
const DESKTOP_COUNT = 250;
const MOBILE_COUNT = 80;
const SPREAD = 10;
const MAX_CONNECTION_DISTANCE = 2.8;

const COLORS = {
  light: {
    primary: '#1aa39c',
    secondary: '#6dcec8',
    tertiary: '#0e6b66',
    lines: '#1aa39c',
  },
  dark: {
    primary: '#3dbab3',
    secondary: '#6dcec8',
    tertiary: '#1aa39c',
    lines: '#3dbab3',
  },
};

/* --- Network Scene --- */
interface DataNetworkProps {
  count: number;
  isDark: boolean;
  reducedMotion: boolean;
}

function DataNetwork({ count, isDark, reducedMotion }: DataNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<InstancedMesh>(null);
  const linesRef = useRef<LineSegments>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const scrollProgress = useRef(0);

  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  // Pre-calculate node bases
  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        base: new Vector3(
          (Math.random() - 0.5) * SPREAD,
          (Math.random() - 0.5) * SPREAD,
          (Math.random() - 0.5) * SPREAD
        ),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        baseScale: 0.03 + Math.random() * 0.03,
      });
    }
    return arr;
  }, [count]);

  // Pre-calculate edges (pairs of indices)
  const edges = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (nodes[i].base.distanceTo(nodes[j].base) < MAX_CONNECTION_DISTANCE) {
          pairs.push([i, j]);
        }
      }
    }
    return pairs;
  }, [nodes, count]);

  // Geometry for lines
  const lineGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(edges.length * 6);
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geo;
  }, [edges]);

  const palette = isDark ? COLORS.dark : COLORS.light;

  // Set initial colors for nodes
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const color = new Color();

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      if (t < 0.5) color.set(palette.primary);
      else if (t < 0.8) color.set(palette.secondary);
      else color.set(palette.tertiary);
      
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, palette]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById('hero');
      if (!heroEl) return;
      const rect = heroEl.getBoundingClientRect();
      const progress = MathUtils.clamp(-rect.top / rect.height, 0, 1);
      scrollProgress.current = progress;
    };

    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.on('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    handleScroll();

    return () => {
      if (lenis) lenis.off('scroll', handleScroll);
      else window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useFrame((state) => {
    // Pause when hidden to save battery
    if (document.visibilityState === 'hidden') return;

    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    const scroll = scrollProgress.current;
    const scrollDampening = reducedMotion ? 0 : Math.max(0, 1 - scroll * 1.5); // stop breathing when scrolled away

    // Update nodes
    for (let i = 0; i < count; i++) {
      const p = nodes[i];
      // Slight orbit around base
      const offsetX = Math.sin(time * p.speed + p.phase) * 0.1 * scrollDampening;
      const offsetY = Math.cos(time * p.speed * 0.8 + p.phase) * 0.1 * scrollDampening;
      
      dummy.position.set(p.base.x + offsetX, p.base.y + offsetY, p.base.z);
      
      const pulse = 1 + Math.sin(time * p.speed * 2 + p.phase) * 0.2 * scrollDampening;
      dummy.scale.setScalar(p.baseScale * pulse);
      
      dummy.updateMatrix();
      if (meshRef.current) {
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;

    // Update lines
    if (linesRef.current) {
      const positions = linesRef.current.geometry.attributes.position.array as Float32Array;
      let idx = 0;
      for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i];
        const pA = nodes[a];
        const pB = nodes[b];
        
        // Match node offsets
        const offAx = Math.sin(time * pA.speed + pA.phase) * 0.1 * scrollDampening;
        const offAy = Math.cos(time * pA.speed * 0.8 + pA.phase) * 0.1 * scrollDampening;
        const offBx = Math.sin(time * pB.speed + pB.phase) * 0.1 * scrollDampening;
        const offBy = Math.cos(time * pB.speed * 0.8 + pB.phase) * 0.1 * scrollDampening;

        positions[idx++] = pA.base.x + offAx;
        positions[idx++] = pA.base.y + offAy;
        positions[idx++] = pA.base.z;
        positions[idx++] = pB.base.x + offBx;
        positions[idx++] = pB.base.y + offBy;
        positions[idx++] = pB.base.z;
      }
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Interactive mouse rotation + scroll translation
    if (groupRef.current && !reducedMotion) {
      targetRotation.current.x = (state.pointer.y * Math.PI) / 36; // max 5 deg
      targetRotation.current.y = (state.pointer.x * Math.PI) / 36;
      
      currentRotation.current.x = MathUtils.lerp(currentRotation.current.x, targetRotation.current.x, 0.05);
      currentRotation.current.y = MathUtils.lerp(currentRotation.current.y, targetRotation.current.y, 0.05);
      
      groupRef.current.rotation.x = currentRotation.current.x;
      groupRef.current.rotation.y = currentRotation.current.y + (time * 0.05 * scrollDampening); // Slow ambient spin

      // Parallax with scroll
      groupRef.current.position.y = scroll * 3;
      groupRef.current.position.z = scroll * -4;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial 
          color={palette.lines} 
          transparent 
          opacity={isDark ? 0.25 : 0.4} 
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/* --- Exported Component --- */
export default function HeroCanvas() {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsSmallMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const syncTheme = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
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
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <DataNetwork count={count} isDark={isDark} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

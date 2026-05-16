/**
 * useCameraScroll — maps page scroll progress (0→1) to scene timeline state.
 * Uses a ref (not state) so that reading in useFrame never triggers React re-renders.
 * Also exposes a raw scrollProgress ref for components that need 0-1 progress directly.
 */
import { useEffect, useRef } from 'react';
import { interpolateTimeline, type TimelineState } from './sceneTimeline';

export function useCameraScroll() {
  const scrollData = useRef<TimelineState>(interpolateTimeline(0));
  const velocityData = useRef({ velocity: 0, targetVelocity: 0 });
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      scrollProgressRef.current = progress;
      scrollData.current = interpolateTimeline(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    const tick = (currentTime: number) => {
      const currentScrollY = window.scrollY;
      const deltaTime = Math.max(1, currentTime - lastTime);
      
      const v = (currentScrollY - lastScrollY) / deltaTime;
      velocityData.current.velocity = v;
      // Inverse lerp speed to 0-10, cap at 1
      const normalizedV = Math.min(Math.abs(v) / 10, 1);
      velocityData.current.targetVelocity = normalizedV;

      lastScrollY = currentScrollY;
      lastTime = currentTime;
      requestAnimationFrame(tick);
    };
    const rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return { scrollData, velocityData, scrollProgressRef }; // Mutable refs for useFrame
}

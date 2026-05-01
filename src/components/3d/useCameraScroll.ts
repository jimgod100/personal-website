/**
 * useCameraScroll — maps page scroll progress (0→1) to scene timeline state.
 * Uses a ref (not state) so that reading in useFrame never triggers React re-renders.
 */
import { useEffect, useRef } from 'react';
import { interpolateTimeline, type TimelineState } from './sceneTimeline';

export function useCameraScroll() {
  const scrollData = useRef<TimelineState>(interpolateTimeline(0));

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      scrollData.current = interpolateTimeline(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return scrollData; // MutableRefObject<TimelineState> — read .current inside useFrame
}

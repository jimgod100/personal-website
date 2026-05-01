import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';

export function useCameraIntro() {
  const { camera } = useThree();
  const introFinished = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      introFinished.current = true;
      return;
    }

    // Start slightly behind and elevated
    camera.position.set(0, 1.5, -5);
    
    // Animate to neutral origin
    gsap.to(camera.position, {
      x: 0,
      y: 0,
      z: 0,
      duration: 2.2,
      ease: 'power3.out',
      onComplete: () => {
        introFinished.current = true;
      }
    });

    return () => {
      gsap.killTweensOf(camera.position);
    };
  }, [camera]);

  return introFinished;
}

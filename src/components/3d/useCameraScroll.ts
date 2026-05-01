import { useEffect, useState } from 'react';
import { interpolateTimeline } from './sceneTimeline';

export function useCameraScroll() {
  const [scrollData, setScrollData] = useState(() => interpolateTimeline(0));

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress (0 to 1)
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      const winHeight = window.innerHeight;
      
      const maxScroll = docHeight - winHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      
      setScrollData(interpolateTimeline(progress));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Initial call
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return scrollData;
}

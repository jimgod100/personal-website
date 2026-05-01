/**
 * scrollReveal.ts
 * Unified GSAP ScrollTrigger reveal animations using data attributes.
 * Loaded once in Layout.astro. Respects prefers-reduced-motion.
 *
 * API:
 * data-motion="fade-up" | "fade-in" | "blur-in" | "scale-up"
 * data-motion-stagger-group="groupName" (optional, groups elements for staggering)
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Make everything visible immediately
    document.querySelectorAll<HTMLElement>('[data-motion]').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
    return;
  }

  // Set initial state for all items to prevent FOUC (opacity 0)
  gsap.set('[data-motion]', { opacity: 0 });

  // 1. Process individual elements (no stagger group)
  const singleElements = document.querySelectorAll<HTMLElement>('[data-motion]:not([data-motion-stagger-group])');
  singleElements.forEach((el) => {
    const motion = el.getAttribute('data-motion');
    let fromVars: gsap.TweenVars = { opacity: 0 };
    
    if (motion === 'fade-up') fromVars = { opacity: 0, y: 30 };
    else if (motion === 'fade-in') fromVars = { opacity: 0 };
    else if (motion === 'blur-in') fromVars = { opacity: 0, filter: 'blur(8px)', y: 20 };
    else if (motion === 'scale-up') fromVars = { opacity: 0, scale: 0.95, y: 20 };

    gsap.fromTo(el, 
      fromVars,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        }
      }
    );
  });

  // 2. Process staggered groups
  const staggerGroups = new Set<string>();
  document.querySelectorAll<HTMLElement>('[data-motion-stagger-group]').forEach(el => {
    const groupName = el.getAttribute('data-motion-stagger-group');
    if (groupName) staggerGroups.add(groupName);
  });

  staggerGroups.forEach(groupName => {
    const elements = document.querySelectorAll<HTMLElement>(`[data-motion-stagger-group="${groupName}"]`);
    if (elements.length === 0) return;
    
    const motion = elements[0].getAttribute('data-motion');
    let fromVars: gsap.TweenVars = { opacity: 0 };
    
    if (motion === 'fade-up') fromVars = { opacity: 0, y: 30 };
    else if (motion === 'fade-in') fromVars = { opacity: 0 };
    else if (motion === 'scale-up') fromVars = { opacity: 0, y: 40, scale: 0.97 };
    else if (motion === 'blur-in') fromVars = { opacity: 0, filter: 'blur(4px)', y: 20 };

    gsap.fromTo(elements, 
      fromVars,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: elements[0],
          start: 'top 85%',
          once: true,
        }
      }
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
} else {
  initScrollReveal();
}

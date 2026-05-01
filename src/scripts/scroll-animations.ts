/**
 * scroll-animations.ts
 * GSAP ScrollTrigger reveal animations for all sections.
 * Loaded once in Layout.astro. Respects prefers-reduced-motion.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function initScrollAnimations() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Make everything visible immediately — no animation
    gsap.set(
      [
        '.about__paragraph',
        '.experience__card',
        '.project-card',
        '.skill-group',
        '.edu-goals__card',
        '.edu-goals__focus-areas',
        '.edu-goals__open-to',
        '.contact__lead',
        '.contact__link',
      ],
      { opacity: 1, y: 0, filter: 'none' }
    );
    return;
  }

  // --- Section heading reveal (all sections) ---
  gsap.utils.toArray<HTMLElement>('.section-heading').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    });
  });

  // --- About paragraphs: staggered fade-in-up ---
  const aboutParagraphs = gsap.utils.toArray<HTMLElement>('.about__paragraph');
  if (aboutParagraphs.length > 0) {
    gsap.from(aboutParagraphs, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.about__text',
        start: 'top 85%',
        once: true,
      },
    });
  }

  // --- About sidebar card ---
  const aboutCard = document.querySelector('.about__card');
  if (aboutCard) {
    gsap.from(aboutCard, {
      opacity: 0,
      y: 25,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: aboutCard,
        start: 'top 85%',
        once: true,
      },
    });
  }

  // --- Experience card ---
  const experienceCards = gsap.utils.toArray<HTMLElement>('.experience__card');
  if (experienceCards.length > 0) {
    gsap.from(experienceCards, {
      opacity: 0,
      y: 35,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: experienceCards[0],
        start: 'top 85%',
        once: true,
      },
    });
  }

  // --- Project cards: staggered reveal ---
  const projectCards = gsap.utils.toArray<HTMLElement>('.project-card');
  if (projectCards.length > 0) {
    gsap.from(projectCards, {
      opacity: 0,
      y: 40,
      scale: 0.97,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.projects__grid',
        start: 'top 85%',
        once: true,
      },
    });
  }

  // --- Skills groups: blur-to-sharp float-in ---
  const skillGroups = gsap.utils.toArray<HTMLElement>('.skill-group');
  if (skillGroups.length > 0) {
    gsap.from(skillGroups, {
      opacity: 0,
      y: 20,
      filter: 'blur(4px)',
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.skills__grid',
        start: 'top 85%',
        once: true,
      },
    });
  }

  // --- Education/Goals card ---
  const eduCard = document.querySelector('.edu-goals__card');
  if (eduCard) {
    gsap.from(eduCard, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: eduCard,
        start: 'top 85%',
        once: true,
      },
    });
  }

  const eduFocus = document.querySelector('.edu-goals__focus-areas');
  if (eduFocus) {
    gsap.from(eduFocus, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      delay: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: eduFocus,
        start: 'top 85%',
        once: true,
      },
    });
  }

  const eduSidebar = document.querySelector('.edu-goals__open-to');
  if (eduSidebar) {
    gsap.from(eduSidebar, {
      opacity: 0,
      y: 25,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: eduSidebar,
        start: 'top 85%',
        once: true,
      },
    });
  }

  // --- Contact links: staggered ---
  const contactLinks = gsap.utils.toArray<HTMLElement>('.contact__link');
  if (contactLinks.length > 0) {
    gsap.from(contactLinks, {
      opacity: 0,
      x: -20,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.contact__links',
        start: 'top 85%',
        once: true,
      },
    });
  }

  const contactLead = document.querySelector('.contact__lead');
  if (contactLead) {
    gsap.from(contactLead, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: contactLead,
        start: 'top 85%',
        once: true,
      },
    });
  }

  // --- Hero text: entrance animation (not scroll-triggered, plays on load) ---
  const heroTimeline = gsap.timeline({ delay: 0.2 });

  heroTimeline
    .from('.hero__eyebrow', {
      opacity: 0,
      y: 15,
      duration: 0.5,
      ease: 'power2.out',
    })
    .from(
      '.hero__headline',
      {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
      },
      '-=0.3'
    )
    .from(
      '.hero__subheadline',
      {
        opacity: 0,
        y: 15,
        duration: 0.5,
        ease: 'power2.out',
      },
      '-=0.3'
    )
    .from(
      '.hero__ctas',
      {
        opacity: 0,
        y: 15,
        duration: 0.5,
        ease: 'power2.out',
      },
      '-=0.2'
    )
    .from(
      '.hero__meta',
      {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
      },
      '-=0.2'
    );
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
  initScrollAnimations();
}

export interface TimelineState {
  cameraZ: number;
  cameraY: number;
  particleDensity: number;
  wireframeOpacity: number;
  fogDensity: number;
  nurbsTubeProgress: number;
}

/**
 * Simplified timeline with compressed camera Z range (12 → -40).
 * 
 * Zone 1 (0.0–0.2):  Hero — particles, glass crosses
 * Zone 2 (0.2–0.4):  About/Experience — wireframes, NURBS tube draws
 * Zone 3 (0.4–0.7):  Projects — DOM-synced tile models
 * Zone 4 (0.7–1.0):  Skills/Education/Contact — fade out
 */
export const sceneTimeline = [
  {
    scroll: 0,
    cameraZ: 12,
    cameraY: -0.5,
    particleDensity: 1.0,
    wireframeOpacity: 0.0,
    fogDensity: 0.015,
    nurbsTubeProgress: 0,
  },
  {
    scroll: 0.2,
    cameraZ: 4,
    cameraY: -0.3,
    particleDensity: 0.7,
    wireframeOpacity: 0.6,
    fogDensity: 0.02,
    nurbsTubeProgress: 0.4,
  },
  {
    scroll: 0.4,
    cameraZ: -8,
    cameraY: 0.1,
    particleDensity: 0.4,
    wireframeOpacity: 0.9,
    fogDensity: 0.025,
    nurbsTubeProgress: 0.85,
  },
  {
    scroll: 0.6,
    cameraZ: -20,
    cameraY: -0.1,
    particleDensity: 0.2,
    wireframeOpacity: 0.5,
    fogDensity: 0.03,
    nurbsTubeProgress: 1.0,
  },
  {
    scroll: 0.8,
    cameraZ: -30,
    cameraY: 0.2,
    particleDensity: 0.05,
    wireframeOpacity: 0.15,
    fogDensity: 0.035,
    nurbsTubeProgress: 1.0,
  },
  {
    scroll: 1.0,
    cameraZ: -40,
    cameraY: 0,
    particleDensity: 0.0,
    wireframeOpacity: 0.0,
    fogDensity: 0.04,
    nurbsTubeProgress: 1.0,
  },
];

/** Smooth ease-in-out so zone transitions feel organic, not mechanical */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function interpolateTimeline(progress: number): TimelineState {
  const p = Math.max(0, Math.min(1, progress));

  let idx = 0;
  for (let i = 0; i < sceneTimeline.length - 1; i++) {
    if (p >= sceneTimeline[i].scroll) idx = i;
  }

  const current = sceneTimeline[idx];
  const next = sceneTimeline[idx + 1] ?? current;

  let localP = 0;
  if (next.scroll > current.scroll) {
    localP = easeInOut((p - current.scroll) / (next.scroll - current.scroll));
  }

  const lerp = (a: number, b: number) => a + (b - a) * localP;

  return {
    cameraZ:           lerp(current.cameraZ, next.cameraZ),
    cameraY:           lerp(current.cameraY, next.cameraY),
    particleDensity:   lerp(current.particleDensity, next.particleDensity),
    wireframeOpacity:  lerp(current.wireframeOpacity, next.wireframeOpacity),
    fogDensity:        lerp(current.fogDensity, next.fogDensity),
    nurbsTubeProgress: lerp(current.nurbsTubeProgress, next.nurbsTubeProgress),
  };
}

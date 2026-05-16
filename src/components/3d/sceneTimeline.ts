export interface TimelineState {
  cameraZ: number;
  cameraY: number;
  particleDensity: number;
  wireframeOpacity: number;
  fogDensity: number;
  nurbsTubeProgress: number;
  panelBonesOpacity: number;
  physicsSandboxOpacity: number;
}

/**
 * Extended timeline with zones for all integrated features:
 * Zone 1 (0.0–0.2):  Hero — particles, physics crosses, female character
 * Zone 2 (0.2–0.4):  About/Experience — NURBS tube draws, wireframes emerge, panels begin
 * Zone 3 (0.4–0.6):  Projects — tile portals, scroll-sync images, panels morph
 * Zone 4 (0.6–0.8):  Skills/Education — physics sandbox, panels continue
 * Zone 5 (0.8–1.0):  Contact — everything fades, deep fog
 */
export const sceneTimeline = [
  {
    scroll: 0,
    cameraZ: 0,
    cameraY: 0,
    particleDensity: 1.0,
    wireframeOpacity: 0.0,
    fogDensity: 0.02,
    nurbsTubeProgress: 0,
    panelBonesOpacity: 0,
    physicsSandboxOpacity: 0,
  },
  {
    scroll: 0.2,
    cameraZ: 10,
    cameraY: -0.3,
    particleDensity: 0.85,
    wireframeOpacity: 0.6,
    fogDensity: 0.03,
    nurbsTubeProgress: 0.4,
    panelBonesOpacity: 0.5,
    physicsSandboxOpacity: 0,
  },
  {
    scroll: 0.4,
    cameraZ: 18,
    cameraY: 0.2,
    particleDensity: 0.6,
    wireframeOpacity: 0.9,
    fogDensity: 0.04,
    nurbsTubeProgress: 0.8,
    panelBonesOpacity: 1.0,
    physicsSandboxOpacity: 0.3,
  },
  {
    scroll: 0.6,
    cameraZ: 26,
    cameraY: -0.2,
    particleDensity: 0.3,
    wireframeOpacity: 0.5,
    fogDensity: 0.05,
    nurbsTubeProgress: 1.0,
    panelBonesOpacity: 0.8,
    physicsSandboxOpacity: 1.0,
  },
  {
    scroll: 0.8,
    cameraZ: 34,
    cameraY: 0.3,
    particleDensity: 0.1,
    wireframeOpacity: 0.2,
    fogDensity: 0.06,
    nurbsTubeProgress: 1.0,
    panelBonesOpacity: 0.3,
    physicsSandboxOpacity: 0.5,
  },
  {
    scroll: 1.0,
    cameraZ: 42,
    cameraY: 0,
    particleDensity: 0.0,
    wireframeOpacity: 0.0,
    fogDensity: 0.08,
    nurbsTubeProgress: 1.0,
    panelBonesOpacity: 0.0,
    physicsSandboxOpacity: 0.0,
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
    cameraZ:              lerp(current.cameraZ, next.cameraZ),
    cameraY:              lerp(current.cameraY, next.cameraY),
    particleDensity:      lerp(current.particleDensity, next.particleDensity),
    wireframeOpacity:     lerp(current.wireframeOpacity, next.wireframeOpacity),
    fogDensity:           lerp(current.fogDensity, next.fogDensity),
    nurbsTubeProgress:    lerp(current.nurbsTubeProgress, next.nurbsTubeProgress),
    panelBonesOpacity:    lerp(current.panelBonesOpacity, next.panelBonesOpacity),
    physicsSandboxOpacity:lerp(current.physicsSandboxOpacity, next.physicsSandboxOpacity),
  };
}

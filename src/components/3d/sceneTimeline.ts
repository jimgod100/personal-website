export interface TimelineState {
  cameraZ: number;
  cameraY: number;
  particleDensity: number;
  wireframeOpacity: number;
  fogDensity: number;
}

export const sceneTimeline = [
  { scroll: 0,    cameraZ: 0,  cameraY: 0,    particleDensity: 1.0, wireframeOpacity: 0.0, fogDensity: 0.02 },
  { scroll: 0.35, cameraZ: 15, cameraY: -0.5, particleDensity: 0.8, wireframeOpacity: 0.8, fogDensity: 0.04 },
  { scroll: 0.75, cameraZ: 28, cameraY: 0.5,  particleDensity: 0.2, wireframeOpacity: 0.4, fogDensity: 0.06 },
  { scroll: 1.0,  cameraZ: 40, cameraY: 0,    particleDensity: 0.0, wireframeOpacity: 0.0, fogDensity: 0.08 },
];

<<<<<<< HEAD
=======
/** Smooth ease-in-out so zone transitions feel organic, not mechanical */
>>>>>>> 23b3f0e60ece85cc70904d249b700c0153cf803d
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

<<<<<<< HEAD
export function interpolateTimeline(progress: number) {
  // Clamp progress
=======
export function interpolateTimeline(progress: number): TimelineState {
>>>>>>> 23b3f0e60ece85cc70904d249b700c0153cf803d
  const p = Math.max(0, Math.min(1, progress));

  let idx = 0;
  for (let i = 0; i < sceneTimeline.length - 1; i++) {
    if (p >= sceneTimeline[i].scroll) idx = i;
  }

  const current = sceneTimeline[idx];
  const next = sceneTimeline[idx + 1] ?? current;

<<<<<<< HEAD
  // Local progress between the two keyframes
  let rawLocalP = 0;
  if (next.scroll > current.scroll) {
    rawLocalP = (p - current.scroll) / (next.scroll - current.scroll);
=======
  let localP = 0;
  if (next.scroll > current.scroll) {
    localP = easeInOut((p - current.scroll) / (next.scroll - current.scroll));
>>>>>>> 23b3f0e60ece85cc70904d249b700c0153cf803d
  }
  
  const localP = easeInOut(rawLocalP);

  return {
    cameraZ:          current.cameraZ          + (next.cameraZ          - current.cameraZ)          * localP,
    cameraY:          current.cameraY          + (next.cameraY          - current.cameraY)          * localP,
    particleDensity:  current.particleDensity  + (next.particleDensity  - current.particleDensity)  * localP,
    wireframeOpacity: current.wireframeOpacity + (next.wireframeOpacity - current.wireframeOpacity) * localP,
    fogDensity:       current.fogDensity       + (next.fogDensity       - current.fogDensity)       * localP,
  };
}

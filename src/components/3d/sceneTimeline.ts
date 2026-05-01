export const sceneTimeline = [
  { scroll: 0,    cameraZ: 0,  cameraY: 0,    particleDensity: 1.0, wireframeOpacity: 0.0, fogDensity: 0.02 },
  { scroll: 0.35, cameraZ: 15, cameraY: -0.5, particleDensity: 0.8, wireframeOpacity: 0.8, fogDensity: 0.04 },
  { scroll: 0.75, cameraZ: 28, cameraY: 0.5,  particleDensity: 0.2, wireframeOpacity: 0.4, fogDensity: 0.06 },
  { scroll: 1.0,  cameraZ: 40, cameraY: 0,    particleDensity: 0.0, wireframeOpacity: 0.0, fogDensity: 0.08 },
];

export function interpolateTimeline(progress: number) {
  // Clamp progress
  const p = Math.max(0, Math.min(1, progress));
  
  // Find keyframes
  let idx = 0;
  for (let i = 0; i < sceneTimeline.length - 1; i++) {
    if (p >= sceneTimeline[i].scroll) {
      idx = i;
    }
  }

  const current = sceneTimeline[idx];
  const next = sceneTimeline[idx + 1] || current;

  // Local progress between the two keyframes
  let localP = 0;
  if (next.scroll > current.scroll) {
    localP = (p - current.scroll) / (next.scroll - current.scroll);
  }

  return {
    cameraZ: current.cameraZ + (next.cameraZ - current.cameraZ) * localP,
    cameraY: current.cameraY + (next.cameraY - current.cameraY) * localP,
    particleDensity: current.particleDensity + (next.particleDensity - current.particleDensity) * localP,
    wireframeOpacity: current.wireframeOpacity + (next.wireframeOpacity - current.wireframeOpacity) * localP,
    fogDensity: current.fogDensity + (next.fogDensity - current.fogDensity) * localP,
  };
}

/**
 * Shared, non-React state for scroll-driven visuals. Writing to it never
 * re-renders React; the WebGL loop and effects read it every frame.
 */
function reducedMotion0() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const world = {
  tint: 0, // 0 = system blue, 1 = alert red — sections set this; particles follow
  shot: reducedMotion0() ? 'hero' : 'intro', // section shot name (set by cinema.ts; 'intro' keeps the haze hidden behind the loader)
  progress: 0, // 0..1 page scroll
  velocity: 0, // lenis velocity (px/frame-ish)
  security: 0, // target 0..1 red mode
  layer: -1, // highlighted stack layer
  intensity: 1, // overall scene brightness 0..1
  px: 0,
  py: 0,
};

type Fn = () => void;
const subs = new Set<Fn>();
export const onWorld = (fn: Fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};
export const emitWorld = () => subs.forEach((f) => f());

const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;
export const reducedMotion = mq('(prefers-reduced-motion: reduce)');
export const finePointer = mq('(hover: hover) and (pointer: fine)');
export const lowPower = (() => {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || mem <= 4 || window.innerWidth < 768;
})();
export const webgl = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
})();

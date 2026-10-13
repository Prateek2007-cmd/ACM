/**
 * Liquid geometry for the ACM monogram.
 *
 * Pure math only — no React, no DOM — so the letterforms and the morph can be verified
 * independently of the renderer. See LiquidMonogram.tsx for the rasteriser and shading.
 *
 * Each letter is a set of capsules (thick line segments). Every letter is padded to the same
 * slot count, and all three letters pass through one shared "ball" state. Because the ball is
 * identical for every letter, the morph is continuous by construction: A flows into the ball,
 * the ball flows into C, C flows back into the ball, and so on.
 *
 * Two things give the material its weight: the capsules are fat and merge through a smooth-min
 * (so corners round off and shapes fuse like mercury), and every capsule is pre-sagged — its
 * radius grows towards the bottom of the frame, as if the liquid were hanging under gravity.
 */

export type Capsule = { x1: number; y1: number; x2: number; y2: number; r: number };

/** Seconds per letter: flow out of the ball, hold, flow back in. Short enough that the loader
 *  can show all three letters without the visitor waiting. */
export const CYCLE = 1.6;
/** End of the "flow in" phase, as a fraction of a letter's window. */
export const FORM_END = 0.26;
/** End of the "held" phase — after this the letter dissolves back into the liquid. */
export const HOLD_END = 0.62;
/** Mid-hold: the moment a letter is fully formed and settled. */
export const FORMED_AT = 0.44;
/** Smooth-min radius: how readily capsules merge. Higher = gooier, rounder, more liquid. */
export const SMOOTH_K = 0.062;
/** How much thicker a capsule gets towards the bottom of the frame (gravity sag). */
const SAG = 0.07;
/** Stroke thickness of every letter. */
const W = 0.066;

const CENTER: Capsule = { x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5, r: 0 };

/** Hang the liquid: a capsule sitting lower in the frame is slightly fatter. */
const sag = (c: Capsule): Capsule => ({ ...c, r: c.r * (1 + SAG * ((c.y1 + c.y2) / 2 - 0.5)) });

/** A — two legs meeting at the apex, one crossbar sitting low, so the counter stays open. */
export const A: Capsule[] = [
  { x1: 0.23, y1: 0.78, x2: 0.5, y2: 0.18, r: W },
  { x1: 0.77, y1: 0.78, x2: 0.5, y2: 0.18, r: W },
  { x1: 0.33, y1: 0.66, x2: 0.67, y2: 0.66, r: W },
].map(sag);

/** C — an arc of short capsules, open to the right. */
export const C: Capsule[] = (() => {
  const out: Capsule[] = [];
  const R = 0.275;
  const steps = 7;
  const from = -48;
  const to = -312;
  const pts = Array.from({ length: steps + 1 }, (_, k) => {
    const a = ((from + ((to - from) * k) / steps) * Math.PI) / 180;
    return { x: 0.5 + Math.cos(a) * R, y: 0.5 + Math.sin(a) * R };
  });
  for (let k = 0; k < steps; k++) {
    out.push({ x1: pts[k].x, y1: pts[k].y, x2: pts[k + 1].x, y2: pts[k + 1].y, r: W });
  }
  return out.map(sag);
})();

/** M — two stems with the central V. */
export const M: Capsule[] = [
  { x1: 0.25, y1: 0.78, x2: 0.25, y2: 0.18, r: W },
  { x1: 0.25, y1: 0.18, x2: 0.5, y2: 0.56, r: W },
  { x1: 0.5, y1: 0.56, x2: 0.75, y2: 0.18, r: W },
  { x1: 0.75, y1: 0.18, x2: 0.75, y2: 0.78, r: W },
].map(sag);

/** Every letter is padded to the widest letter's slot count with invisible capsules at the centre. */
export const SLOTS = Math.max(A.length, C.length, M.length);

const pad = (caps: Capsule[]): Capsule[] => Array.from({ length: SLOTS }, (_, i) => caps[i] ?? CENTER);

export const LETTERS: Capsule[][] = [pad(A), pad(C), pad(M)];

/** The single liquid state every letter passes through — a hanging droplet. */
export const BALL: Capsule[] = Array.from({ length: SLOTS }, (_, i) => {
  const a = (i / SLOTS) * Math.PI * 2 + 0.45;
  const R = 0.078;
  const x = 0.5 + Math.cos(a) * R;
  const y = 0.5 + Math.sin(a) * R;
  return { x1: x, y1: y, x2: x, y2: y, r: 0.158 };
}).map(sag);

// Sinusoidal eases: their peak rate is ~1.57x the average, where a cubic peaks at 3x.
// Liquid has no snap, and the gentler ramp is why the morph reads as flow rather than a cut.
const easeOut = (t: number) => Math.sin((t * Math.PI) / 2);
const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function blend(a: Capsule, b: Capsule, t: number): Capsule {
  return {
    x1: mix(a.x1, b.x1, t),
    y1: mix(a.y1, b.y1, t),
    x2: mix(a.x2, b.x2, t),
    y2: mix(a.y2, b.y2, t),
    r: mix(a.r, b.r, t),
  };
}

/** Progress through the current letter's window: 0 = ball, 1 = fully formed, back to 0. */
export function morphWeight(u: number) {
  if (u < FORM_END) return easeOut(u / FORM_END); // the material flows out of the ball into the letter
  if (u < HOLD_END) return 1; // the letter holds
  return 1 - easeInOut((u - HOLD_END) / (1 - HOLD_END)); // the letter dissolves back into the ball
}

/** When the letter in slot `i` is fully formed. */
export const letterFormedAt = (i: number) => i * CYCLE + FORMED_AT * CYCLE;

/**
 * How long one full presentation takes: every letter formed in turn, A → C → M.
 * The loader runs its progress bar over exactly this window and then opens the site — so all
 * three letters are always seen, and the third is still held when the curtain lifts.
 */
export const SHOWCASE = (LETTERS.length - 1) * CYCLE + HOLD_END * CYCLE;

/**
 * Capsule set at a moment in the loop: letter → ball → next letter → ball → …
 * Writes into `out` (reused between frames so the render loop allocates nothing).
 */
export function stateAt(time: number, out: Capsule[]): void {
  const total = CYCLE * LETTERS.length;
  const tt = ((time % total) + total) % total;
  const index = Math.floor(tt / CYCLE);
  const u = (tt - index * CYCLE) / CYCLE;
  const letter = LETTERS[index];
  const w = morphWeight(u);
  // A slow swell while a letter holds — faded out over the last of the hold so it can never pop
  // as the dissolve starts. It is zero at u = 0, which is what keeps the shared-ball identity exact.
  const swell =
    u >= FORM_END && u < HOLD_END
      ? Math.sin((u - FORM_END) * 14 + time * 1.1) * 0.005 * Math.min(1, (HOLD_END - u) / 0.08)
      : 0;

  for (let i = 0; i < SLOTS; i++) {
    const c = blend(BALL[i], letter[i], w);
    if (swell && c.r > 0.01) c.r += swell * (i % 2 ? 1 : -1);
    out[i] = c;
  }
}

/** Polynomial smooth-min: capsules merge like one material rather than overlapping. */
export function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** Closest point on a capsule and the signed distance to its surface. */
export function nearestOnCapsule(c: Capsule, x: number, y: number, out: { d: number; ex: number; ey: number }) {
  const vx = c.x2 - c.x1;
  const vy = c.y2 - c.y1;
  const wx = x - c.x1;
  const wy = y - c.y1;
  const len2 = vx * vx + vy * vy;
  let t = len2 > 0 ? (wx * vx + wy * vy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = c.x1 + vx * t;
  const cy = c.y1 + vy * t;
  const ex = x - cx;
  const ey = y - cy;
  out.ex = ex;
  out.ey = ey;
  out.d = Math.sqrt(ex * ex + ey * ey) - c.r;
}

/** The union field: negative inside the material, positive outside. */
export function fieldAt(caps: Capsule[], x: number, y: number, k: number = SMOOTH_K): number {
  const o = { d: 0, ex: 0, ey: 0 };
  let d = Infinity;
  for (let i = 0; i < caps.length; i++) {
    const c = caps[i];
    if (c.r <= 0.0005) continue;
    nearestOnCapsule(c, x, y, o);
    d = d === Infinity ? o.d : smin(d, o.d, k);
  }
  return d;
}

export const isInside = (caps: Capsule[], x: number, y: number) => fieldAt(caps, x, y) < 0;

/** Largest amount the ripple below can shift the surface, in field units. */
export const RIPPLE_MAX = 0.016;

/**
 * Slow ripples travelling across the surface, so the material never sits still.
 * Bounded by RIPPLE_MAX — the shape tests use that to prove the letters survive the ripple.
 */
export function rippleAt(x: number, y: number, time: number) {
  return (
    0.006 * Math.sin(x * 7.5 + time * 1.6) +
    0.005 * Math.sin(y * 9 - time * 2.1) +
    0.003 * Math.sin(x * 3.1 - y * 2.4 + time * 0.9) +
    0.002 * Math.sin((x + y) * 5.2 + time * 2.6)
  );
}

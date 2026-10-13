/**
 * Shading for the ACM monogram.
 *
 * The material is clear water, and clear means transparent: the body carries no colour (light
 * through water has no hue of its own) and it is *see-through*, so whatever sits behind the mark
 * shows through it. What holds the letterform together is the light at the surface — a bright
 * meniscus along the silhouette, and a dark band of total internal reflection just inside it, which
 * is the pair of cues that makes a translucent shape read as glass rather than as a flat wash.
 *
 * So `waterShade` produces one value (written to red, green and blue identically) plus an alpha:
 * ~0.6 through the body, 1 at the meniscus. scripts/verify-water.ts asserts both, and that the
 * colourless equality holds everywhere.
 *
 * Pure math, no DOM, so the palette stays verifiable without a browser.
 */

export type Rgba = { r: number; g: number; b: number; a: number };

export type WaterSample = {
  /** Unit 2D normal of the surface: the direction from the nearest stroke centreline. */
  ux: number;
  uy: number;
  /** Signed field at the pixel (negative inside the material), with the ripple already added. */
  f: number;
  /** Pixel position on the 0..1 stage — drives the travelling sheen and the underside. */
  x: number;
  y: number;
  /** Seconds. */
  time: number;
};

/** How far inside the surface the bright meniscus reaches, in field units. */
export const GLASS_RIM = 0.016;
/** Alpha of the body itself. Well under 1: the mark is see-through. */
export const GLASS_BODY_ALPHA = 0.6;
/** How much brighter the meniscus is than the body it wraps. */
const MENISCUS_LIFT = 0.34;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Shading lights, all unit vectors. The surface normal is a unit 2D direction, so a light has to be
// unit too or the specular power never reaches its peak — and a highlight that never fires is what
// leaves a mark looking like flat paint instead of wet glass.
const LX = -0.596, LY = -0.803;         // key light, upper left
const HX = -0.6, HY = -0.8;             // its specular lobe, tight
const H2X = 0.5875, H2Y = -0.8093;      // the fill light's lobe, upper right and sharper still

/** Per-pixel shade. Writes into `out` so the render loop allocates nothing. */
export function waterShade(p: WaterSample, out: Rgba): void {
  const diff = Math.max(0, p.ux * LX + p.uy * LY);
  const spec = Math.pow(Math.max(0, p.ux * HX + p.uy * HY), 34);
  const spec2 = Math.pow(Math.max(0, p.ux * H2X + p.uy * H2Y), 90);
  const depth = clamp01(-p.f * 3.2); // 0 at the surface, a stroke's thickness in the middle
  const core = 1 - depth;
  const gloss = Math.pow(clamp01((0.44 - p.y) / 0.44), 2) * 0.30;
  // a broad band of light travelling through the body, so the water is never perfectly still
  const sheen = Math.pow(Math.max(0, Math.sin((p.x * 3.4 + p.y * 2.6) * 2.1 - p.time * 0.9)), 10);
  // the meniscus: 1 exactly at the silhouette, 0 once we are GLASS_RIM inside it
  const meniscus = Math.pow(clamp01((GLASS_RIM + p.f) / GLASS_RIM), 0.75);
  // the body itself: silver on the lit side, grey where it turns away, never a white fill
  const body = (0.20 + 0.36 * diff + 0.10 * core + 0.10 * sheen * core) * 255 + MENISCUS_LIFT * meniscus * 255;
  // the wet glints: pure white, and small — they are what makes it read as water, not paint
  const glint = spec * 215 + spec2 * 175 + gloss * 120;
  // the underside absorbs, so the body reads as volume rather than as a flat gradient
  const absorb = 1 - Math.pow(clamp01((p.y - 0.52) / 0.48), 2) * 0.34 * depth;
  const v = (body + glint) * absorb;

  // one value, three identical channels: colourless by construction
  out.r = out.g = out.b = v > 255 ? 255 : v;
  // see-through body, opaque rim and glints: the water, not a painting of water
  const a = GLASS_BODY_ALPHA + (1 - GLASS_BODY_ALPHA) * meniscus + spec * 0.5 + spec2 * 0.6;
  out.a = a > 1 ? 1 : a;
}

/** Saturation of a colour, 0 = perfectly colourless. Used by the palette and asset checks. */
export function chromaOf(c: { r: number; g: number; b: number }): number {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  return max <= 0 ? 0 : (max - min) / max;
}

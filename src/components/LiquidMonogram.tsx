import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/store';
import { SLOTS, SMOOTH_K, rippleAt, smin, stateAt, nearestOnCapsule, type Capsule } from '../lib/liquid';

/**
 * Liquid monogram — one fluid material that visibly reshapes itself into A, then C, then M.
 *
 * The letters and the morph live in ../lib/liquid (pure math). This component rasterises that
 * geometry: the capsules become a single signed-distance field, shaded from the field's own
 * outward normal, drawn into a small buffer the browser upscales. The low resolution is what
 * makes the edges read as liquid rather than as hard vector strokes — and it keeps the whole
 * thing comfortably inside a frame budget on mid-range phones.
 *
 * The material is sold three ways: a slow slosh rotates the whole body, light travels through
 * it (a broad key highlight plus caustic bands), and the underside absorbs light like depth.
 */

const cl01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// shading: a key light from the upper left, a second from the upper right, viewer straight on
const LX = -0.52, LY = -0.7, LZ = 0.49;
const HX = -0.3, HY = -0.4, HZ = 0.87; // halfway between the key light and the viewer
const H2X = 0.249, H2Y = -0.343, H2Z = 0.906; // halfway between the fill light and the viewer

export default function LiquidMonogram({ className = '', size = 208 }: { className?: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buf = size;
    canvas.width = buf;
    canvas.height = buf;
    const img = ctx.createImageData(buf, buf);
    const data = img.data;
    const caps: Capsule[] = Array.from({ length: SLOTS }, () => ({ x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5, r: 0 }));
    const probe = { d: 0, ex: 0, ey: 0 };
    const half = buf / 2;
    const inv = 1 / buf;
    const aa = 1.7 / buf; // anti-aliased edge width, in field units

    const draw = (time: number) => {
      stateAt(time, caps);

      // surface motion that belongs to the rendering, not the shape: the capsules keep drifting
      // slightly so the body is never perfectly rigid, on top of the ripple in the field itself
      const flowing = Math.sin(time * 1.7) * 0.004;
      for (let i = 0; i < SLOTS; i++) {
        const c = caps[i];
        if (c.r <= 0.01) continue;
        c.y1 += flowing * (i % 2 ? 1 : -1);
        c.y2 += flowing * (i % 3 === 0 ? 1 : -1);
      }

      // the whole body sloshes, breathes and drifts
      const slosh = Math.sin(time * 0.6) * 0.038;
      const cs = Math.cos(slosh), sn = Math.sin(slosh);
      const scale = 1 + Math.sin(time * 1.05) * 0.018;
      const bob = Math.sin(time * 0.85) * 0.006;

      for (let py = 0; py < buf; py++) {
        const oy = (py + 0.5 - half) * inv;
        const rowY = (oy * cs) / scale + 0.5 + bob;
        const rowX = (-oy * sn) / scale;
        for (let px = 0; px < buf; px++) {
          const ox = (px + 0.5 - half) * inv;
          const x = (ox * cs) / scale + rowX + 0.5;
          const y = (ox * sn) / scale + rowY;

          let field = Infinity;
          // the unsigned distance to the closest capsule centreline is what makes a stable
          // normal; the signed field distance collapses to zero on the centreline itself
          let normalDistance = Infinity;
          let nx = 0, ny = 0;
          for (let i = 0; i < SLOTS; i++) {
            const c = caps[i];
            if (c.r <= 0.0005) continue;
            nearestOnCapsule(c, x, y, probe);
            const toCentre = Math.sqrt(probe.ex * probe.ex + probe.ey * probe.ey);
            if (toCentre < normalDistance) {
              normalDistance = toCentre;
              nx = probe.ex;
              ny = probe.ey;
            }
            field = field === Infinity ? probe.d : smin(field, probe.d, SMOOTH_K);
          }

          const o = (py * buf + px) * 4;
          if (field === Infinity) {
            data[o + 3] = 0;
            continue;
          }

          const f = field + rippleAt(x, y, time);
          const alpha = 0.5 - f / aa;
          if (alpha <= 0.002) {
            data[o + 3] = 0;
            continue;
          }
          const a = alpha > 1 ? 1 : alpha;

          // outward normal from the closest capsule (cheap and stable for a union of capsules)
          const invN = normalDistance > 1e-6 ? 1 / normalDistance : 0;
          const ux = nx * invN, uy = ny * invN;
          const uz = Math.sqrt(Math.max(0, 1 - ux * ux - uy * uy));

          const diff = Math.max(0, ux * LX + uy * LY + uz * LZ);
          const spec = Math.pow(Math.max(0, ux * HX + uy * HY + uz * HZ), 34);
          const spec2 = Math.pow(Math.max(0, ux * H2X + uy * H2Y + uz * H2Z), 90);
          const fres = Math.pow(1 - uz, 2.4);
          const depth = cl01(-f * 3.2);
          const gloss = Math.pow(cl01((0.44 - y) / 0.44), 2) * 0.34;
          // light refracted through the body: bright bands that drift across it
          const caustic = Math.pow(Math.max(0, Math.sin((x * 3.4 + y * 2.6) * 2.1 - time * 0.9)), 10) * 0.35;
          // the underside absorbs light, blue stays longest — it reads as volume, not a gradient
          const inner = Math.pow(cl01((y - 0.52) / 0.48), 2) * 0.2 * depth;

          const core = 1 - depth;
          const lum = 0.66 + 0.6 * diff;
          const r = (12 + 40 * core + fres * 140 + spec * 240 + spec2 * 200 + gloss * 150 + caustic * 90) * lum * (1 - inner);
          const g = (52 + 96 * core + fres * 160 + spec * 245 + spec2 * 215 + gloss * 172 + caustic * 180) * lum * (1 - inner * 0.75);
          const b = (216 + 39 * core + fres * 180 + spec * 250 + spec2 * 230 + gloss * 195 + caustic * 255) * lum * (1 - inner * 0.4);

          data[o] = r > 255 ? 255 : r;
          data[o + 1] = g > 255 ? 255 : g;
          data[o + 2] = b > 255 ? 255 : b;
          data[o + 3] = a * 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    // reduced motion: one still frame of a fully formed letter, no animation loop
    if (reducedMotion) {
      draw(0.44 * 1.6);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      draw((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="ACM monogram — a liquid material morphing between the letters A, C and M"
    />
  );
}

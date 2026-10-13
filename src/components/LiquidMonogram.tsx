import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/store';
import { SLOTS, SMOOTH_K, rippleAt, smin, stateAt, nearestOnCapsule, type Capsule } from '../lib/liquid';
import { waterShade, type Rgba, type WaterSample } from '../lib/water';

/**
 * Liquid monogram — one fluid material that visibly reshapes itself into A, then C, then M.
 *
 * The letters and the morph live in ../lib/liquid (pure math); the shading lives in ../lib/water.
 * This component rasterises them: the capsules become a single signed-distance field and every pixel
 * is shaded from that field.
 *
 * The material is clear glass — colourless, and see-through — so the shade is one value written to
 * all three channels plus an alpha: the body stays translucent (whatever is behind the mark shows
 * through it) and only the bright edge along the silhouette and the glints go fully opaque, which is
 * what keeps the letterform legible.
 *
 * The low buffer resolution is deliberate: the browser upscales it, which is what makes the edges
 * read as liquid rather than as hard vector strokes, and it keeps the whole thing inside a frame
 * budget on mid-range phones.
 */

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
    // reused per pixel, so the shade never allocates inside the loop
    const sample: WaterSample = { ux: 0, uy: 0, f: 0, x: 0, y: 0, time: 0 };
    const shade: Rgba = { r: 0, g: 0, b: 0, a: 1 };
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
          // the distance to the closest capsule centreline is what makes a stable normal; the signed
          // field distance collapses to zero on the centreline itself
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
          const edge = 0.5 - f / aa; // the anti-aliased outer edge
          if (edge <= 0.002) {
            data[o + 3] = 0;
            continue;
          }

          // outward normal from the closest capsule (cheap and stable for a union of capsules)
          const invN = normalDistance > 1e-6 ? 1 / normalDistance : 0;
          sample.ux = nx * invN;
          sample.uy = ny * invN;
          sample.f = f;
          sample.x = x;
          sample.y = y;
          sample.time = time;
          waterShade(sample, shade);

          data[o] = shade.r;
          data[o + 1] = shade.g;
          data[o + 2] = shade.b;
          // the material's own alpha (translucent body, opaque meniscus) times the edge falloff
          data[o + 3] = (edge > 1 ? 1 : edge) * shade.a * 255;
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
      aria-label="ACM monogram — a colourless liquid material morphing between the letters A, C and M"
    />
  );
}

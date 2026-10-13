/**
 * Verifies the ACM mark's material without a browser.
 *
 *   bun run scripts/verify-water.ts
 *
 * The brief is now short: glass. Clear, colourless, see-through — and nothing else on it. Those are
 * claims about colour and opacity, so they can be settled exactly rather than by argument:
 *   1. the shaded material emits no colour at all: red, green and blue come out identical
 *   2. it is transparent: a faint film body, an opaque edge, and only the glints reach white
 *   3. the form is carried by the edge — bright band outside, refraction band just inside it
 *   4. both static assets (acm-logo.svg, favicon.svg) say the same thing on disk
 *   5. the renderer and the stylesheet actually use it
 */

import { readFileSync } from 'node:fs';
import { GLASS_BODY_ALPHA, chromaOf, waterShade, type Rgba, type WaterSample } from '../src/lib/water.ts';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${name}${detail ? `  — ${detail}` : ''}`);
};

// ---------------------------------------------------------------- colour helpers

type Rgb = { r: number; g: number; b: number };

const hexToRgb = (hex: string): Rgb => {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = Number.parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const isHex = (v: string) => /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v.trim());
const spread = (c: Rgb) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);

/** Hue in degrees. Returns 0 for any neutral grey, which is what makes the sweep test work. */
function hueOf(c: Rgb): number {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  const d = max - min;
  if (d === 0) return 0;
  const h = max === c.r ? ((c.g - c.b) / d) % 6 : max === c.g ? (c.b - c.r) / d + 2 : (c.r - c.g) / d + 4;
  return (((h * 60) % 360) + 360) % 360;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const TAU = Math.PI * 2;

const shadeAt = (f: number, ux: number, uy: number, x: number, y: number, time = 0): Rgba => {
  const sample: WaterSample = { ux, uy, f, x, y, time };
  const out: Rgba = { r: 0, g: 0, b: 0, a: 1 };
  waterShade(sample, out);
  return out;
};

// ---------------------------------------------------------------- 1. colourless

console.log('\n1. the material is colourless\n');

// A broad sweep of the whole parameter space: every direction, every depth, a grid of positions and
// three different moments. If any chromatic term survives anywhere, this finds it.
let worstSpread = 0;
let worstAt = '';
let samples = 0;
for (let i = 0; i < 72; i++) {
  const a = (i / 72) * TAU;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  for (const f of [0.004, 0, -0.003, -0.008, -0.016, -0.03, -0.05, -0.07]) {
    for (let gx = 1; gx <= 6; gx++) {
      for (let gy = 1; gy <= 6; gy++) {
        for (const time of [0, 0.37, 3.1]) {
          const px = shadeAt(f, ux, uy, gx / 7, gy / 7, time);
          const s = Math.max(Math.abs(px.r - px.g), Math.abs(px.g - px.b), Math.abs(px.r - px.b));
          samples++;
          if (s > worstSpread) {
            worstSpread = s;
            worstAt = `normal ${((a * 180) / Math.PI).toFixed(0)}°, f ${f}, time ${time}`;
          }
        }
      }
    }
  }
}
check('red, green and blue come out identical', worstSpread === 0,
  `worst channel difference ${worstSpread.toFixed(6)} over ${samples} samples${worstAt ? ` (${worstAt})` : ''}`);
check('so no pixel can register as a colour', chromaOf(shadeAt(-0.01, 0.7, -0.7, 0.5, 0.5)) === 0);

// ---------------------------------------------------------------- 2. see-through

console.log('\n2. and it is see-through\n');

const bodyAlpha = shadeAt(-0.03, 1, 0, 0.5, 0.3).a;
const edgeAlpha = shadeAt(-0.0005, 1, 0, 0.5, 0.3).a;
check('the body is translucent', bodyAlpha <= 0.7 && bodyAlpha >= 0.35, `body alpha ${bodyAlpha.toFixed(2)}`);
check('the edge is opaque', edgeAlpha >= 0.95, `edge alpha ${edgeAlpha.toFixed(2)}`);
check('the body alpha is the documented one', Math.abs(bodyAlpha - GLASS_BODY_ALPHA) < 0.02,
  `${bodyAlpha.toFixed(2)} vs GLASS_BODY_ALPHA ${GLASS_BODY_ALPHA}`);

// Over a black backdrop the mark has to stay visible without ever becoming a solid fill. Axis-aligned
// normals only: the corner directions sit inside the specular lobes, and a glint is not a body sample.
const visible = (f: number, ux: number, uy: number, y: number) => {
  const px = shadeAt(f, ux, uy, 0.4, y, 0.7);
  return px.r * px.a;
};
const bodyShown = [
  visible(-0.03, 1, 0, 0.3), visible(-0.03, -1, 0, 0.3),
  visible(-0.03, 0, 1, 0.3), visible(-0.03, 0, -1, 0.3),
];
const edgeShown = visible(-0.0005, 1, 0, 0.3);
check('the translucent body is still visible', bodyShown.every((v) => v >= 35 && v <= 150),
  bodyShown.map((v) => v.toFixed(0)).join(', '));
check('the edge reads clearly brighter than it', edgeShown > Math.max(...bodyShown) + 40,
  `${edgeShown.toFixed(0)} vs ${Math.max(...bodyShown).toFixed(0)}`);

// ---------------------------------------------------------------- 3. it still reads as glass

console.log('\n3. and the form is carried by the edge\n');

const darkSide = shadeAt(-0.03, 1, 0, 0.5, 0.3);
const litSide = shadeAt(-0.03, -1, 0, 0.5, 0.3);
const under = shadeAt(-0.05, 1, 0, 0.5, 0.98);
const top = shadeAt(-0.05, 1, 0, 0.5, 0.06);

check('the lit side is brighter than the shaded side', litSide.r > darkSide.r + 40,
  `${litSide.r.toFixed(0)} vs ${darkSide.r.toFixed(0)} of 255`);
check('the underside absorbs light', under.r < top.r, `${under.r.toFixed(0)} below vs ${top.r.toFixed(0)} above`);

// A fine sweep of surface directions: the glints have to reach white somewhere or the mark reads as
// flat paint, and the body has to stay short of white everywhere else or it reads as a fill.
const sweep: number[] = [];
for (let i = 0; i < 720; i++) {
  const a = (i / 720) * TAU;
  sweep.push(shadeAt(-0.05, Math.cos(a), Math.sin(a), 0.4, 0.25, 0.9).r);
}
const peak = Math.max(...sweep);
const bodyShare = sweep.filter((v) => v < 220).length / sweep.length;
const blown = sweep.filter((v) => v > 250).length / sweep.length;
check('the wet glints reach white', peak >= 240, `brightest direction ${peak.toFixed(0)}/255`);
check('but the body never fills with white', bodyShare >= 0.7 && blown < 0.2,
  `${(bodyShare * 100).toFixed(0)}% of directions stay below 220, ${(blown * 100).toFixed(1)}% reach 250`);
check('the body is more than a flat silhouette', median(sweep) > 40, `median direction ${median(sweep).toFixed(0)}/255`);

// the moving sheen has to actually move, or the glass reads as a static shape
let travel = 0;
for (const ux of [1, 0.4, -0.3]) {
  for (let t = 0; t < 6; t += 0.25) {
    const a = shadeAt(-0.02, ux, 0, 0.35, 0.4, t).r;
    const b = shadeAt(-0.02, ux, 0, 0.35, 0.4, t + 0.8).r;
    travel = Math.max(travel, Math.abs(a - b));
  }
}
check('the light moves across the glass', travel >= 8, `brightness moves ${travel.toFixed(1)}/255 over time`);

// ---------------------------------------------------------------- 4. the assets

console.log('\n4. the assets on disk\n');

type Stop = { offset: number; color: string; opacity: number };
type Grad = { id: string; stops: Stop[] };

const attrsOf = (s: string) => {
  const a: Record<string, string> = {};
  const re = /([\w:-]+)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) a[m[1]] = m[2];
  return a;
};

const gradientsOf = (src: string): Grad[] => {
  const out: Grad[] = [];
  const re = /<(?:linear|radial)Gradient\b([^>]*)>([\s\S]*?)<\/(?:linear|radial)Gradient>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const attrs = attrsOf(m[1]);
    const stops: Stop[] = [];
    const sre = /<stop\b([^>]*?)\/?>/g;
    let s: RegExpExecArray | null;
    while ((s = sre.exec(m[2]))) {
      const a = attrsOf(s[1]);
      stops.push({
        offset: a.offset === undefined ? 0 : Number(a.offset),
        color: a['stop-color'] ?? '#000000',
        opacity: a['stop-opacity'] === undefined ? 1 : Number(a['stop-opacity']),
      });
    }
    out.push({ id: attrs.id ?? '', stops });
  }
  return out;
};

/** Every tag opens and closes, or closes itself. Catches a broken asset that would render blank. */
const wellFormed = (src: string): string | null => {
  const stack: string[] = [];
  const re = /(<\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|[^>])*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const [, open, name, , selfClose] = m;
    if (selfClose === '/') continue;
    if (open === '</') {
      const top = stack.pop();
      if (top !== name) return `</${name}> closes ${top ?? 'nothing'}`;
    } else stack.push(name);
  }
  return stack.length ? `unclosed: ${stack.join(', ')}` : null;
};

const assets = [
  { file: 'public/acm-logo.svg', glass: 'acmGlass', edge: 'acmEdgeLight', refract: 'acmEdgeDark', edgeMask: 'acmEdge' },
  { file: 'public/favicon.svg', glass: 'fGlass', edge: 'fEdgeLight', refract: 'fEdgeDark', edgeMask: 'fEdge' },
];

for (const asset of assets) {
  console.log(`  — ${asset.file}`);
  const src = readFileSync(new URL(`../${asset.file}`, import.meta.url), 'utf8');
  const grads = gradientsOf(src);

  const broken = wellFormed(src);
  check(`${asset.file} is well-formed`, broken === null, broken ?? `${grads.length} gradients`);

  // 4a. not one stop may carry a hue — a pure grey has equal channels, so the test is exact
  const tinted: string[] = [];
  for (const g of grads) {
    for (const s of g.stops) {
      if (!isHex(s.color)) continue;
      if (spread(hexToRgb(s.color)) !== 0) tinted.push(`${g.id} ${s.color}`);
    }
  }
  check('every gradient stop is a pure grey', tinted.length === 0, tinted.join(', ') || `${grads.length} gradients neutral`);

  // 4b. …nor any stroke or fill, anywhere in the file
  const painted = src.match(/(?:stroke|fill)="#[0-9a-fA-F]{3,6}"/g) ?? [];
  const paintedBad = painted.filter((p) => spread(hexToRgb(p.replace(/^[^#]*#/, '#'))) !== 0);
  check('no stroke or fill carries a hue', paintedBad.length === 0,
    paintedBad.join(', ') || `${painted.length} painted colours, all neutral`);

  // 4c. the rainbow is gone: no gradient may sweep the spectrum, and nothing may be blended in
  let sweepHue = 0;
  for (const g of grads) {
    for (let i = 1; i < g.stops.length; i++) {
      const a = hueOf(hexToRgb(g.stops[i - 1].color));
      const b = hueOf(hexToRgb(g.stops[i].color));
      sweepHue = Math.max(sweepHue, Math.abs(((b - a + 540) % 360) - 180));
    }
  }
  check('the rainbow is gone', sweepHue < 60 && !src.includes('mix-blend-mode'),
    `largest hue step between stops ${sweepHue.toFixed(0)}°, no blend modes`);

  // 4d. glass: a faint film spanning the glyphs, with the bright edge painted over it and the
  //     refraction band inside it. That pairing is the whole material.
  type Painter = { stroke: string; width: number; opacity: number };
  const strokes: Painter[] = [];
  const useRe = /<use\b([^>]*)\/?>/g;
  let u: RegExpExecArray | null;
  while ((u = useRe.exec(src))) {
    const a = attrsOf(u[1]);
    strokes.push({
      stroke: a.stroke ?? '',
      width: Number(a['stroke-width'] ?? 0),
      opacity: a.opacity === undefined ? 1 : Number(a.opacity),
    });
  }
  const at = (id: string) => strokes.map((x, i) => [x, i] as const).filter(([x]) => x.stroke === `url(#${id})`);
  const grad = (id: string) => grads.find((g) => g.id === id);
  const film = grad(asset.glass);
  const edge = grad(asset.edge);
  const refract = grad(asset.refract);
  const filmPaint = at(asset.glass)[0];

  check('the body is a faint film, not a fill',
    !!film && film.stops.every((s) => s.opacity <= 0.4) && film.stops.some((s) => s.opacity >= 0.15),
    film ? `stop opacities ${film.stops.map((s) => s.opacity).join(', ')}` : 'missing');
  check('the film still spans the whole glyph', !!filmPaint && filmPaint[0].width >= 70,
    filmPaint ? `film width ${filmPaint[0].width}` : 'missing');
  check('the edge is bright enough to carry the letterform',
    !!edge && edge.stops.every((s) => s.opacity >= 0.3),
    edge ? `stop opacities ${edge.stops.map((s) => s.opacity).join(', ')}` : 'missing');
  check('a dark refraction band sits inside it',
    !!refract && refract.stops.every((s) => s.color.toLowerCase() === '#000000' && s.opacity >= 0.1),
    refract ? `stops ${refract.stops.map((s) => `${s.color}@${s.opacity}`).join(', ')}` : 'missing');
  check('the bands are painted as rings, not as fills',
    src.includes(`<mask id="${asset.edgeMask}"`) && src.includes(`mask="url(#${asset.edgeMask})"`),
    'the edge and the refraction band are ring masks');
  check('the bright edge rides over the film', !!edge && !!filmPaint && at(asset.edge)[0] &&
    at(asset.edge)[0][1] > filmPaint[1] && at(asset.edge)[0][0].width >= filmPaint[0].width,
    'a brighter ring on top of the film, reaching past it');
  check('the refraction band sits inside the film', !!at(asset.refract)[0] && !!filmPaint &&
    at(asset.refract)[0][1] > filmPaint[1] && at(asset.refract)[0][0].width < filmPaint[0].width,
    'the dark band is narrower than the film it sits in');

  // 4e. and it is still *just* glass: nothing else painted on top of it
  const extras = (src.match(/<(?:circle|ellipse)\b/g) ?? []).length;
  check('nothing but the glass is drawn', extras === 0, extras === 0 ? 'no bubbles, waves or sphere' : `${extras} extra shapes`);
}

// ---------------------------------------------------------------- 5. the wiring

console.log('\n5. the renderer and the stylesheet use it\n');

const component = readFileSync(new URL('../src/components/LiquidMonogram.tsx', import.meta.url), 'utf8');
check('the canvas is shaded by water.ts', component.includes("from '../lib/water'") && component.includes('waterShade(sample, shade)'));
check('the canvas multiplies in the material alpha', component.includes('* shade.a * 255'),
  'the translucent body reaches the canvas');
check('the component carries no colour of its own', !/rainbow|spectral|#[0-9a-fA-F]{6}/.test(component));

const palette = readFileSync(new URL('../src/lib/water.ts', import.meta.url), 'utf8');
check('the palette module has no spectrum left in it', !/rainbow|spectral/i.test(palette));

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const cssRule = (selector: string) => {
  const at2 = css.indexOf(`${selector} {`);
  return at2 === -1 ? '' : css.slice(at2, css.indexOf('}', at2));
};
// The mark must stay colourless: blue anywhere behind it tints it. A bright edge is wanted — that is
// what glass is — but it is bounded, so the accent can only ever be a highlight and never a fill.
const brightestWhite = (rule: string) => {
  const light = [...rule.matchAll(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g)]
    .filter((m) => Math.min(Number(m[1]), Number(m[2]), Number(m[3])) >= 180)
    .map((m) => Number(m[4]));
  return light.length ? Math.max(...light) : 0;
};
for (const sel of ['.nav-logo', '.hc-brand', '.share-logo', '.ig-liquid']) {
  const rule = cssRule(sel);
  const blue = /47,\s*123,\s*255|10,\s*61,\s*255|110,\s*168,\s*255|8ab8ff/i.test(rule);
  const white = brightestWhite(rule);
  check(`${sel} stays untinted, with only rim-bright accents`, rule.length > 0 && !blue && white <= 0.5,
    blue ? 'still blue' : white > 0.5 ? `white accent ${white} is a fill, not a rim` : `brightest accent ${white}`);
}

console.log(`\n${failures === 0 ? 'PASS — the mark is plain clear glass: colourless, see-through, nothing on it' : `FAIL — ${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);

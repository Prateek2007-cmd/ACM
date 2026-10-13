/**
 * Verifies the ACM liquid monogram geometry without a browser.
 *
 *   bun run scripts/verify-liquid.ts
 *
 * It answers the questions that matter for the intro animation:
 *   1. do the letter states actually read as an A, a C and an M (holes, mouth, notch)?
 *   2. do they survive the moving surface ripple the renderer adds on top?
 *   3. is the morph continuous, and does every letter pass through one compact liquid ball?
 *   4. does the per-pixel loop fit a 60 fps frame budget at the sizes actually mounted?
 */

import {
  BALL, CYCLE, LETTERS, RIPPLE_MAX, SLOTS, SMOOTH_K, fieldAt, nearestOnCapsule, smin, stateAt, type Capsule,
} from '../src/lib/liquid.ts';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${name}${detail ? `  — ${detail}` : ''}`);
};

const scratch: Capsule[] = Array.from({ length: SLOTS }, () => ({ x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5, r: 0 }));
const at = (time: number): Capsule[] => {
  stateAt(time, scratch);
  return scratch.map((c) => ({ ...c }));
};
/** The middle of a letter's hold window, where it is fully formed. */
const hold = (letterIndex: number) => at(letterIndex * CYCLE + 0.44 * CYCLE);

const field = (caps: Capsule[], x: number, y: number) => fieldAt(caps, x, y);
const inside = (caps: Capsule[], x: number, y: number) => field(caps, x, y) < 0;

console.log('\n1. letterforms\n');

// ---- A: two legs + a low crossbar, with an open counter above it
const A = hold(0);
check('A : inside the left leg', inside(A, 0.3335, 0.55), field(A, 0.3335, 0.55).toFixed(4));
check('A : inside the right leg', inside(A, 0.6665, 0.55), field(A, 0.6665, 0.55).toFixed(4));
check('A : inside the crossbar', inside(A, 0.5, 0.66), field(A, 0.5, 0.66).toFixed(4));
check('A : inside the apex', inside(A, 0.5, 0.2), field(A, 0.5, 0.2).toFixed(4));
check('A : counter (triangle hole) is open', !inside(A, 0.5, 0.45), field(A, 0.5, 0.45).toFixed(4));
check('A : not a filled triangle below the bar', !inside(A, 0.5, 0.95), field(A, 0.5, 0.95).toFixed(4));
check('A : empty above the apex', !inside(A, 0.5, 0.05), field(A, 0.5, 0.05).toFixed(4));

// ---- C: an arc with a mouth on the right
const C = hold(1);
check('C : inside at the left of the arc', inside(C, 0.2397, 0.5), field(C, 0.2397, 0.5).toFixed(4));
check('C : inside at the top of the arc', inside(C, 0.5, 0.2397), field(C, 0.5, 0.2397).toFixed(4));
check('C : inside at the bottom of the arc', inside(C, 0.5, 0.7603), field(C, 0.5, 0.7603).toFixed(4));
check('C : mouth on the right is open', !inside(C, 0.78, 0.5), field(C, 0.78, 0.5).toFixed(4));
check('C : inner counter is open', !inside(C, 0.35, 0.5), field(C, 0.35, 0.5).toFixed(4));

// ---- M: two stems with an open notch
const M = hold(2);
check('M : inside the left stem', inside(M, 0.25, 0.5), field(M, 0.25, 0.5).toFixed(4));
check('M : inside the right stem', inside(M, 0.75, 0.5), field(M, 0.75, 0.5).toFixed(4));
check('M : inside the central V', inside(M, 0.5, 0.56), field(M, 0.5, 0.56).toFixed(4));
check('M : notch between the stems is open', !inside(M, 0.5, 0.3), field(M, 0.5, 0.3).toFixed(4));
check('M : open below the V between the stems', !inside(M, 0.5, 0.75), field(M, 0.5, 0.75).toFixed(4));

// ---- the three letters must actually differ from each other
check('C and M differ (mouth probe)', inside(M, 0.78, 0.5) && !inside(C, 0.78, 0.5));
check('A and C differ (counter probe)', inside(A, 0.5, 0.66) && !inside(C, 0.5, 0.66));
check('M and A differ (notch probe)', !inside(M, 0.5, 0.3) && inside(A, 0.5, 0.3));

console.log(`\n2. the letters survive the surface ripple (± ${RIPPLE_MAX})\n`);

// The renderer adds rippleAt() on top of the field, so a shape only truly holds if it stays
// inside by more than the ripple's amplitude (and outside by more than it too).
const solidIn = (name: string, caps: Capsule[], x: number, y: number) => {
  const v = field(caps, x, y);
  check(`${name} holds through the ripple`, v < -RIPPLE_MAX, `field ${v.toFixed(4)}`);
};
const clearOut = (name: string, caps: Capsule[], x: number, y: number) => {
  const v = field(caps, x, y);
  check(`${name} stays clear through the ripple`, v > RIPPLE_MAX, `field ${v.toFixed(4)}`);
};
solidIn('A left leg', A, 0.3335, 0.55);
solidIn('A crossbar', A, 0.5, 0.66);
solidIn('A apex', A, 0.5, 0.2);
clearOut('A counter', A, 0.5, 0.45);
clearOut('A below the bar', A, 0.5, 0.95);
solidIn('C arc left', C, 0.2397, 0.5);
clearOut('C mouth', C, 0.78, 0.5);
clearOut('C inner counter', C, 0.35, 0.5);
solidIn('M left stem', M, 0.25, 0.5);
clearOut('M notch', M, 0.5, 0.3);
clearOut('M below the V', M, 0.5, 0.75);

console.log('\n3. the shared liquid state\n');

for (let i = 0; i < LETTERS.length; i++) {
  const s = at(i * CYCLE);
  const same = s.every((c, k) =>
    Math.abs(c.x1 - BALL[k].x1) < 1e-9 && Math.abs(c.y1 - BALL[k].y1) < 1e-9 &&
    Math.abs(c.x2 - BALL[k].x2) < 1e-9 && Math.abs(c.y2 - BALL[k].y2) < 1e-9 &&
    Math.abs(c.r - BALL[k].r) < 1e-9);
  check(`letter ${i + 1} starts from exactly the shared ball`, same);
}
const ball = at(0);
check('ball : solid at the centre', inside(ball, 0.5, 0.5), field(ball, 0.5, 0.5).toFixed(4));
check('ball : compact (nothing at 0.30 to the side)', !inside(ball, 0.8, 0.5) && !inside(ball, 0.2, 0.5));
check('ball : compact vertically', !inside(ball, 0.5, 0.18) && !inside(ball, 0.5, 0.82));

console.log('\n4. continuity of the morph\n');

let maxStep = 0;
let worstAt = 0;
const step = 0.005;
let prev = at(0);
for (let t = step; t <= CYCLE * LETTERS.length * 2; t += step) {
  const cur = at(t);
  for (let i = 0; i < SLOTS; i++) {
    const d = Math.max(
      Math.abs(cur[i].x1 - prev[i].x1), Math.abs(cur[i].y1 - prev[i].y1),
      Math.abs(cur[i].x2 - prev[i].x2), Math.abs(cur[i].y2 - prev[i].y2),
      Math.abs(cur[i].r - prev[i].r),
    );
    if (d > maxStep) { maxStep = d; worstAt = t; }
  }
  prev = cur;
}
check('no slot jumps between frames', maxStep < 0.02, `largest step ${maxStep.toFixed(5)} at t=${worstAt.toFixed(3)}s`);

for (let i = 0; i < LETTERS.length; i++) {
  const formed = at(i * CYCLE + 0.44 * CYCLE);
  const dropped = at(i * CYCLE + 0.999 * CYCLE);
  const deviation = formed.reduce((acc, c, k) => Math.max(acc, Math.abs(c.x1 - LETTERS[i][k].x1), Math.abs(c.r - LETTERS[i][k].r)), 0);
  const dissolved = dropped.every((c, k) => Math.abs(c.x1 - BALL[k].x1) < 0.02 && Math.abs(c.r - BALL[k].r) < 0.02);
  check(`letter ${i + 1} reaches its shape`, deviation < 0.02, `max deviation ${deviation.toFixed(4)}`);
  check(`letter ${i + 1} dissolves back into liquid`, dissolved);
}

console.log('\n5. render cost (the dominant per-pixel loop, in Node/V8)\n');

// The renderer's cost is one capsule test per slot per pixel, plus one extra sqrt for the
// shading normal. This measures that exact loop so the buffer size stays a measured choice.
const loopCost = (px: number) => {
  const caps = at(0.44 * CYCLE);
  const o = { d: 0, ex: 0, ey: 0 };
  let sink = 0;
  const frames = 12;
  const t = performance.now();
  for (let f = 0; f < frames; f++) {
    for (let py = 0; py < px; py++) {
      const y = py / px;
      for (let pxi = 0; pxi < px; pxi++) {
        const x = pxi / px;
        let fl = Infinity;
        for (let i = 0; i < SLOTS; i++) {
          const c = caps[i];
          if (c.r <= 0.0005) continue;
          nearestOnCapsule(c, x, y, o);
          sink += Math.sqrt(o.ex * o.ex + o.ey * o.ey);
          fl = fl === Infinity ? o.d : smin(fl, o.d, SMOOTH_K);
        }
        sink += fl;
      }
    }
  }
  return { ms: (performance.now() - t) / frames, sink };
};

// these are the sizes LiquidMonogram is actually mounted with (LoadingScreen)
const desktop = loopCost(208);
const phone = loopCost(160);
console.log(`  desktop 208² buffer  ${desktop.ms.toFixed(2)} ms/frame  (16.7 ms is a 60 fps budget)`);
console.log(`  phone   160² buffer  ${phone.ms.toFixed(2)} ms/frame`);
check('desktop buffer fits a 60 fps budget', desktop.ms < 10, `${desktop.ms.toFixed(2)} ms`);
check('phone buffer fits a 60 fps budget', phone.ms < 10, `${phone.ms.toFixed(2)} ms`);
if (desktop.sink === 0 || phone.sink === 0) check('loop actually evaluated', false);

console.log(`\n${failures === 0 ? 'PASS — all liquid monogram checks passed' : `FAIL — ${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);

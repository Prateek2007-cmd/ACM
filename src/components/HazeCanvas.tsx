import { useEffect, useRef } from 'react';
import { world, lowPower, reducedMotion } from '../lib/store';
import detailUrl from '../assets/haze/haze-detail.png';
import rampUrl from '../assets/haze/haze-ramp.png';

/**
 * Rising haze along the bottom of the screen (replaces the old Three.js particles).
 *
 * The look comes straight from smoke-red.png / smoke-blue.png, not from invented noise:
 *  - haze-detail.png  = the grain + soft cloud structure cut from the glowing area of smoke-red.png
 *                       (brightness divided out, made seamlessly tileable). 128 = neutral.
 *  - haze-ramp.png    = row 0: the exact red of smoke-red.png for every brightness level,
 *                       row 1: the exact blue smoke-blue.png uses for that same level.
 *  - the falloff (bright at the bottom edge, fading into black) follows the measured falloff
 *    of the haze in the same image, squeezed into the bottom third of the screen.
 * Motion: the structure drifts slowly upward with a soft, slowly changing warp. Two copies of
 * the tile, sampled at different angles/offsets, are blended with a non-repeating mask so the
 * tile never visibly repeats or loops.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D uDetail;
uniform sampler2D uRamp;
uniform vec2 uRes;        // drawing-buffer size
uniform float uDpr;       // buffer px per CSS px
uniform float uVh;        // viewport height in CSS px
uniform float uTime;
uniform float uRed;       // 0 = blue haze, 1 = red haze
uniform float uPeak;      // overall strength (brightness at the bottom edge)
uniform float uTexel;     // CSS px per texel of the haze tile

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float soft(vec2 p) { return vnoise(p) * 0.65 + vnoise(p * 2.03 + 17.1) * 0.35; }

float tile(vec2 cssPx) { return texture2D(uDetail, cssPx / (512.0 * uTexel)).r * 2.0; }

void main() {
  vec2 p = gl_FragCoord.xy / uDpr;          // CSS px, y = 0 at the bottom edge
  float t = uTime;
  float rise = t * 9.0;                      // px per second: a slow drift upward

  // soft distortion that changes slowly and rises with the haze (no strands, no curls)
  vec2 q = vec2(p.x, p.y - rise * 0.9);
  vec2 warp = vec2(soft(q / 260.0 + vec2(0.0, t * 0.035)), soft(q / 260.0 + vec2(5.2, 1.3 - t * 0.03))) - 0.5;
  warp *= 22.0;

  // two copies of the real haze tile, differently rotated/offset, both rising
  vec2 a = vec2(p.x, p.y - rise) + warp;
  const float cr = 0.9563, sr = 0.2924;       // ~17 degrees
  vec2 pb = vec2(cr * p.x - sr * p.y, sr * p.x + cr * p.y);
  vec2 b = vec2(pb.x + 137.0, pb.y - rise * 1.08 + 211.0) + warp * 0.8;
  float A = tile(a) - 1.0;
  float B = tile(b) - 1.0;
  float m = smoothstep(0.25, 0.75, soft(vec2(p.x, p.y - rise) / 330.0 + 3.7));
  float D = 1.0 + (A * m + B * (1.0 - m)) / sqrt(m * m + (1.0 - m) * (1.0 - m));

  // falloff measured from the haze in smoke-red.png: bright at the edge, fading into black
  float u = p.y / (0.40 * uVh);
  float env = 0.8 * exp(-pow(u / 0.46, 2.0)) + 0.2 * exp(-u / 0.5);
  env *= 1.0 - smoothstep(0.7, 1.0, u);

  // big soft pools of brighter haze that drift along with it, so the band is never flat
  float pool = soft(vec2(p.x / 520.0 + t * 0.006, (p.y - rise * 0.6) / 420.0));
  env *= 0.7 + 0.5 * pool;

  float s = clamp(uPeak * env * D, 0.0, 1.0);
  vec3 red = texture2D(uRamp, vec2(s * (255.0 / 256.0) + 0.5 / 256.0, 0.25)).rgb;
  vec3 blue = texture2D(uRamp, vec2(s * (255.0 / 256.0) + 0.5 / 256.0, 0.75)).rgb;
  vec3 col = mix(blue, red, uRed);
  float al = max(col.r, max(col.g, col.b));
  gl_FragColor = vec4(col, al);              // premultiplied: over black this is exactly col
}
`;

export default function HazeCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLSpanElement>(null);
  const hudDot = useRef<HTMLSpanElement>(null);
  const hudText = useRef<HTMLSpanElement>(null);
  const hudBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'haze-canvas';
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    const fail = () => { el.classList.add('haze-fallback'); };
    if (!gl) { fail(); return; }
    el.appendChild(canvas);

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
    } catch (e) {
      console.warn('[haze] falling back to still image', e);
      canvas.remove();
      fail();
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U('uRes'), uDpr = U('uDpr'), uVh = U('uVh'), uTime = U('uTime'), uRed = U('uRed'), uPeak = U('uPeak'), uTexel = U('uTexel');
    gl.uniform1i(U('uDetail'), 0);
    gl.uniform1i(U('uRamp'), 1);

    let ready = 0;
    const tex = (unit: number, url: string, repeat: boolean) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]));
      const img = new Image();
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE; // the 512 px tile is seamless, so it repeats cleanly
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        ready++;
        dirty = true;
      };
      img.src = url;
      return t;
    };
    const tDetail = tex(0, detailUrl, true);
    const tRamp = tex(1, rampUrl, false);

    let dpr = 1;
    let vh = window.innerHeight;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.25);
      vh = window.innerHeight;
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || Math.round(vh * 0.42);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      dirty = true;
    };
    let dirty = true;
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const s = { red: 0, fade: world.shot === 'intro' ? 0 : 1 };
    let last = performance.now();
    let elapsed = 7; // start mid-drift so the first frame already looks settled
    let lastDraw = 0;
    let raf = 0;
    let running = true;
    let lastHud = '';

    const draw = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uVh, vh);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uRed, s.red);
      gl.uniform1f(uPeak, (window.innerWidth < 768 ? 0.52 : 0.6) * s.fade);
      gl.uniform1f(uTexel, 0.9 * 384 / 512); // one pixel of smoke-red.png ≈ 0.9 CSS px, as when the still fills a laptop screen
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const k = 1 - Math.pow(0.02, dt); // ~1 s smooth colour cross-fade
      const targetRed = Math.max(world.security, world.tint);
      const prevRed = s.red, prevFade = s.fade;
      s.red += (targetRed - s.red) * k;
      s.fade += ((world.shot === 'intro' ? 0 : 1) - s.fade) * k;
      if (!reducedMotion) elapsed += dt;

      if (ready >= 2) {
        const changed = dirty || Math.abs(s.red - prevRed) > 0.002 || Math.abs(s.fade - prevFade) > 0.002;
        // drifting haze is slow: 30 fps is plenty and saves battery; reduced motion draws only on change
        if (reducedMotion ? changed : now - lastDraw > 32) {
          draw();
          lastDraw = now;
          dirty = false;
        }
      }

      const hudHide = world.progress > 0.96 ? '0' : '1';
      if (hudBox.current && hudBox.current.style.opacity !== hudHide) hudBox.current.style.opacity = hudHide;
      const hot = s.red > 0.5;
      const text = `${hot ? 'PERIMETER_DEFENSE_ENGAGED' : 'SYSTEM_GRID_NOMINAL'}|${Math.round(world.progress * 100)}`;
      if (text !== lastHud && hud.current && hudText.current && hudDot.current) {
        lastHud = text;
        const [label, pct] = text.split('|');
        hudText.current.textContent = label;
        hud.current.textContent = `DEPTH ${pct.padStart(3, '0')}%`;
        hudDot.current.style.background = hot ? '#ff2a2a' : '#2f7bff';
        hudDot.current.style.boxShadow = `0 0 10px ${hot ? '#ff2a2a' : '#2f7bff'}`;
      }
    };
    raf = requestAnimationFrame(frame);

    // pause completely while the tab is hidden
    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); canvas.remove(); fail(); };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteTexture(tDetail);
      gl.deleteTexture(tRamp);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      canvas.remove();
    };
  }, []);

  return (
    <>
      <div ref={host} className="haze-layer" aria-hidden="true" />
      <div ref={hudBox} className="vk-hud lg fixed bottom-6 right-6 z-30 pointer-events-none hidden md:flex items-center gap-4 text-[10px] font-mono tracking-widest text-[#A5A8AE]/80 px-4 py-2 rounded-full" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span ref={hudDot} className="w-1.5 h-1.5 rounded-full" style={{ background: '#2f7bff', boxShadow: '0 0 10px #2f7bff' }} />
          <span ref={hudText}>SYSTEM_GRID_NOMINAL</span>
        </span>
        <span className="text-white/20">|</span>
        <span ref={hud}>DEPTH 000%</span>
      </div>
    </>
  );
}

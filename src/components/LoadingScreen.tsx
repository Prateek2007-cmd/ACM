import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { reducedMotion, world } from '../lib/store';
import { SHOWCASE } from '../lib/liquid';
import { BRAND } from '../data/brand';
import LiquidGlassMark from './LiquidGlassMark';
import SmokeVideo from './SmokeVideo';

const PHASES = [...BRAND.pillars];
const TICKS = 72;
/** The progress bar runs over exactly one full A → C → M presentation, so all three letters are seen. */
const COUNT_MS = Math.round(SHOWCASE * 1000);
const MAX_WAIT_MS = 1600; // never hold the curtain longer than this while fonts settle
/** Circumference of the progress ring (r = 47 in the 0 0 100 100 viewBox). */
const ARC_LEN = 2 * Math.PI * 47;

/**
 * "Ignition" — the opening hook.
 * 1. bezel ticks sweep in  2. the glass ACM mark forms in the circular stage
 * 3. the ring fills 000→100 while the four pillars cycle and the A · C · M chips light in turn
 * 4. the mark flies toward the camera, a light seam splits the screen and the site opens.
 *
 * The mark is the chapter's own glass artwork — see LiquidGlassMark.
 */
export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [skip] = useState(() => reducedMotion);
  const [gone, setGone] = useState(skip);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const phase = useRef<HTMLSpanElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const arcGlow = useRef<SVGCircleElement>(null);
  const done = useRef(false);

  // lock scrolling for the whole hook; always start the story from the top
  useEffect(() => {
    if (skip) return;
    window.scrollTo(0, 0);
    document.documentElement.classList.add('is-loading');
    world.shot = 'intro';
    window.dispatchEvent(new Event('vk:modal-open'));
    const t = setTimeout(() => setReady(true), MAX_WAIT_MS);
    document.fonts?.ready.then(() => setReady(true)).catch(() => setReady(true));
    return () => clearTimeout(t);
  }, [skip]);

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      document.documentElement.classList.remove('is-loading');
      window.dispatchEvent(new Event('vk:modal-close'));
      onComplete();
    };
    if (skip) { finish(); return; }
    const r = root.current;
    if (!r || !ready) return;

    const ticks = r.querySelectorAll('.ig-tick');
    const chips = r.querySelectorAll('.ig-letters span');
    const len = ARC_LEN;
    const state = { p: 0 };
    let lastPhase = -1;
    let saidReady = false;

    const render = () => {
      if (pct.current) pct.current.textContent = String(Math.round(state.p * 100)).padStart(3, '0');
      if (arc.current) arc.current.style.strokeDashoffset = String(len * (1 - state.p));
      if (arcGlow.current) arcGlow.current.style.strokeDashoffset = String(len * (1 - state.p));
      const lit = Math.floor(state.p * TICKS);
      ticks.forEach((tk, i) => tk.classList.toggle('on', i < lit));
      // A · C · M light up in turn as the mark settles, then stay lit
      chips.forEach((chip, i) => chip.classList.toggle('on', state.p >= (i + 0.4) / chips.length));
      if (state.p >= 1 && !saidReady && phase.current) {
        saidReady = true;
        gsap.fromTo(phase.current, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out' });
        phase.current.textContent = 'Ready';
        return;
      }
      if (saidReady) return;
      const ph = Math.min(PHASES.length - 1, Math.floor(state.p * PHASES.length));
      if (ph !== lastPhase && phase.current) {
        lastPhase = ph;
        gsap.fromTo(phase.current, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out' });
        phase.current.textContent = PHASES[ph];
      }
    };

    const tl = gsap.timeline();
    tl.set(r.querySelectorAll('[data-in]'), { opacity: 0 })
      .to(r.querySelectorAll('.ig-corner'), { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.08 }, 0)
      .fromTo(ticks, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', stagger: { each: 0.008, from: 'start' } }, 0.1)
      .fromTo(r.querySelector('.ig-halo'), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.15)
      .fromTo(r.querySelector('.ig-smoke'), { opacity: 0 }, { opacity: 0.9, duration: 1.6, ease: 'power2.out' }, 0.2)
      .fromTo(r.querySelector('.ig-mono'), { opacity: 0, scale: 0.9, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out' }, 0.35)
      .to(r.querySelectorAll('.ig-readout, .ig-phase-wrap, .ig-letters'), { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.6)
      .to(state, { p: 1, duration: COUNT_MS / 1000, ease: 'power1.inOut', onUpdate: render }, 0.6)
      // completion: ring flares, monogram breathes, then flies through the camera
      .to(r.querySelector('.ig-ring'), { filter: 'drop-shadow(0 0 22px rgba(255,255,255,0.7))', duration: 0.35, ease: 'power2.out' })
      .to(r.querySelector('.ig-mono'), { scale: 1.04, duration: 0.35, ease: 'power2.out' }, '<')
      .to(r.querySelectorAll('.ig-corner, .ig-readout, .ig-phase-wrap, .ig-letters, .ig-bezel, .ig-ring, .ig-smoke, .ig-halo'), { opacity: 0, duration: 0.4, ease: 'power2.in' }, '+=0.15')
      .to(r.querySelector('.ig-mono'), { scale: 7, opacity: 0, duration: 0.9, ease: 'expo.in' }, '<')
      .to(r.querySelector('.loader-seam'), { scaleX: 1, duration: 0.45, ease: 'expo.inOut' }, '-=0.35')
      .add(finish)
      .to(r.querySelector('.loader-half.top'), { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=0.02')
      .to(r.querySelector('.loader-half.bottom'), { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
      .to(r.querySelector('.loader-seam'), { opacity: 0, duration: 0.5 }, '<0.35')
      .add(() => setGone(true));
    return () => { tl.kill(); render(); };
  }, [skip, ready, onComplete]);

  if (gone) return null;
  return (
    <div ref={root} className="loader" role="progressbar" aria-label={`Loading the ${BRAND.chapter}`} aria-valuemin={0} aria-valuemax={100}>
      <div className="loader-half top" />
      <div className="loader-half bottom" />
      <div className="loader-seam" />
      <div className="ig-halo" aria-hidden="true" />
      <SmokeVideo color="blue" eager className="ig-smoke" />

      <div className="ig-corner ig-tl" data-in>{BRAND.chapter}</div>
      <div className="ig-corner ig-tr" data-in>{BRAND.college}</div>
      <div className="ig-corner ig-bl" data-in>{BRAND.city}, IN · 17.39° N 78.49° E</div>
      <div className="ig-corner ig-br" data-in>Association for Computing Machinery</div>

      <div className="ig-stage">
        <svg className="ig-bezel" viewBox="0 0 100 100" aria-hidden="true">
          {Array.from({ length: TICKS }, (_, i) => {
            const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
            const major = i % 6 === 0;
            const r1 = major ? 44.2 : 45.2, r2 = 47.6;
            return <line key={i} className={`ig-tick ${major ? 'major' : ''}`} x1={50 + Math.cos(a) * r1} y1={50 + Math.sin(a) * r1} x2={50 + Math.cos(a) * r2} y2={50 + Math.sin(a) * r2} />;
          })}
        </svg>
        <svg className="ig-ring" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="ig-grad" x1="0" y1="0" x2="1" y2="1">
              {/* neutral greys only: the ring frames clear glass, so it must not tint it */}
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#d2d5d9" />
              <stop offset="1" stopColor="#8f9499" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="47" className="ig-track" />
          <circle cx="50" cy="50" r="47" className="ig-sweep" />
          <circle ref={arcGlow} cx="50" cy="50" r="47" className="ig-arc ig-arc-glow" style={{ strokeDasharray: ARC_LEN, strokeDashoffset: ARC_LEN }} />
          <circle ref={arc} cx="50" cy="50" r="47" className="ig-arc" style={{ strokeDasharray: ARC_LEN, strokeDashoffset: ARC_LEN }} />
        </svg>
        <div className="ig-mono-pos">
          <div className="ig-mono" data-in>
            <div className="ig-liquid ig-liquid--mark">
              <LiquidGlassMark />
            </div>
          </div>
        </div>
        <div className="ig-readout" data-in>
          <span ref={pct}>000</span><sup>%</sup>
        </div>
        <div className="ig-letters" data-in aria-hidden="true">
          {['A', 'C', 'M'].map((c) => <span key={c}>{c}</span>)}
        </div>
      </div>

      <div className="ig-phase-wrap" data-in>
        <span className="ig-phase-label">Initialising</span>
        <span className="ig-phase-mask"><span ref={phase} className="ig-phase serif-shine">{PHASES[0]}</span></span>
      </div>
    </div>
  );
}

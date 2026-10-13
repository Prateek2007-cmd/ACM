import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { world, reducedMotion } from '../lib/store';
import { BRAND } from '../data/brand';

const WORDS = [...BRAND.pillars];

/**
 * Giant outlined wordmark band. Drifts on its own, speeds up and reverses
 * with scroll velocity — the classic award-site interlude between chapters.
 */
export default function VelocityMarquee({ reverse = false }: { reverse?: boolean }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || reducedMotion) return;
    let x = 0;
    let half = el.scrollWidth / 2;
    const onResize = () => { half = el.scrollWidth / 2; };
    window.addEventListener('resize', onResize);
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    let dir = reverse ? -1 : 1;
    const tick = (_t: number, dt: number) => {
      if (!visible) return;
      const v = world.velocity;
      if (Math.abs(v) > 0.5) dir = (v > 0 ? 1 : -1) * (reverse ? -1 : 1);
      const speed = 40 + Math.min(Math.abs(v), 80) * 18; // px / s
      x -= dir * speed * (dt / 1000);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      el.style.transform = `translate3d(${x}px,0,0) skewX(${gsap.utils.clamp(-12, 12, -v * 0.4)}deg)`;
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); io.disconnect(); window.removeEventListener('resize', onResize); };
  }, [reverse]);

  const row = [...WORDS, ...WORDS];
  return (
    <div className="vmarquee" aria-hidden="true">
      <div ref={track} className="vmarquee-track">
        {[...row, ...row].map((w, i) => (
          <span key={i} className={i % 2 ? 'solid' : 'outline'}>{w}<i>✦</i></span>
        ))}
      </div>
    </div>
  );
}

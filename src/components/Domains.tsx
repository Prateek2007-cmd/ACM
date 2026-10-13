import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from '../lib/store';
import { DOMAINS } from '../data/content';
import { lazy, Suspense } from 'react';

const ShaderGradient = lazy(() => import('./fx/ShaderGradient'));

gsap.registerPlugin(ScrollTrigger);

/** Sapphire chapter break: huge numbering, domain rows that sweep in and light up on hover. */
export default function Domains() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('.svc-kicker', { y: 20, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: 0.3, scrollTrigger: { trigger: '.svc-title', start: 'top 85%', once: true } });
      gsap.from('.svc-title .cw-s', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: '.svc-title', start: 'top 85%', once: true } });
      gsap.utils.toArray<HTMLElement>('.svc-row').forEach((row, i) => {
        gsap.from(row, { y: 60, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: i * 0.04, scrollTrigger: { trigger: row, start: 'top 90%', once: true } });
        const num = row.querySelector('.svc-num');
        if (num) gsap.fromTo(num, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      ScrollTrigger.create({ trigger: root.current, start: 'top 60%', end: 'bottom 40%', toggleClass: { targets: document.body, className: 'hud-dim' } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="domains" ref={root} className="services" aria-label="What the chapter does">
      <Suspense fallback={null}>
        <ShaderGradient className="svc-gradient" colors={['#02040b', '#0a2a80', '#3d8bff']} speed={0.16} strength={1.3} density={0.55} grain={0.05} rotation={[-0.6, 0, -0.45]} />
      </Suspense>
      <p className="svc-eyebrow">02 / What we do</p>
      <h2 className="svc-title" data-no-reveal>
        {'What we do'.split(' ').map((w) => <span key={w} className="cw-mask"><span className="cw-s">{w}</span></span>)}
      </h2>
      <p className="svc-kicker">Six things the chapter runs, <span className="font-serif-italic shine-text">all year.</span></p>
      <div className="svc-list">
        {DOMAINS.map((d, i) => (
          <div className="svc-row" key={d.name} data-cursor="magnetic-off">
            <span className="svc-num">{String(i + 1).padStart(2, '0')}</span>
            <div className="svc-body">
              <h3>{d.name}</h3>
              <p>{d.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

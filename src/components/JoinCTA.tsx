import { lazy, Suspense, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { BRAND, EXTERNAL } from '../data/brand';
import { JOIN } from '../data/content';
import { asset } from '../data/media';
import { reducedMotion } from '../lib/store';

const ShaderGradient = lazy(() => import('./fx/ShaderGradient'));

/** Closing call to action — the reference's chapter-card language, with the liquid glow kept and the portrait removed. */
export default function JoinCTA({ onContact }: { onContact: () => void }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('.jc-rise', { y: 40, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 70%', once: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="join" className="join" aria-label={`Join the ${BRAND.chapter}`}>
      <div className="partner-box join-box">
        <Suspense fallback={<div className="gradient-fallback" aria-hidden="true" />}>
          <ShaderGradient className="cta-gradient" colors={['#06080d', '#0a2a80', '#2f7bff']} speed={0.14} strength={1.2} density={0.5} grain={0.05} rotation={[-0.5, 0, -0.35]} />
        </Suspense>

        <p className="cc-eyebrow jc-rise">{JOIN.eyebrow}</p>
        <h2 className="partner-title jc-rise" data-no-reveal>
          {JOIN.title} <span className="h-accent text-[#6EA8FF]">{JOIN.accent}</span>
        </h2>
        <p className="cc-sub jc-rise" style={{ marginLeft: 'auto', marginRight: 'auto' }}>{JOIN.sub}</p>

        <div className="jc-rise share-logo" aria-hidden="true">
          <img className="acm-logo" src={asset(BRAND.logo)} alt="" loading="lazy" decoding="async" />
        </div>

        <div className="jc-rise" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
          <button type="button" onClick={onContact} className="glow-pill" data-cursor="magnetic">
            <span className="glow-avatar">ACM</span>
            <span>Get in touch with the chapter</span>
            <span aria-hidden="true">→</span>
          </button>
          <a href={EXTERNAL.vce} target="_blank" rel="noopener noreferrer" className="ghost-pill" data-cursor="magnetic">
            College website
          </a>
        </div>

        <p className="join-note jc-rise" style={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>{JOIN.note}</p>
      </div>
    </section>
  );
}

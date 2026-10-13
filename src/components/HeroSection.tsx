import { lazy, Suspense, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RotatingRole from './RotatingRole';
import FxBoundary from './fx/FxBoundary';
import { BRAND } from '../data/brand';
import { asset } from '../data/media';
import { reducedMotion } from '../lib/store';

const ShaderGradient = lazy(() => import('./fx/ShaderGradient'));

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  onExplore: () => void;
}

const DOT = ['b', 'r', 'b', 'w'];

/**
 * Cinematic hero — the reference's composition (full-bleed media, copy low-left, rising
 * headline) with the portrait replaced by a liquid blue shader field, which suits the
 * chapter's electric-blue identity and avoids using anyone's photograph.
 */
export default function HeroSection({ onExplore }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const ctx = gsap.context(() => {
      const media = hero.querySelector('.hc-media');
      if (reducedMotion) { gsap.set('.hc-fade', { autoAlpha: 1 }); return; }

      gsap.set(media, { scale: 1.12, filter: 'blur(16px)' });
      gsap.set('.hc-line > span', { yPercent: 115 });
      gsap.set('.hc-fade', { autoAlpha: 0, y: 24 });

      const intro = gsap.timeline({ paused: true })
        .to(media, { scale: 1, filter: 'blur(0px)', duration: 2.2, ease: 'expo.out' }, 0)
        .to('.hc-line > span', { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.09 }, 0.35)
        .to('.hc-fade', { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.8)
        .set(media, { clearProps: 'filter' });
      const play = () => intro.play();
      if ((window as unknown as { __vkLoaded?: boolean }).__vkLoaded) play();
      else window.addEventListener('vk:loaded', play, { once: true });

      // scroll-out: the field drifts and darkens, the copy lifts away
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } })
        .to('.hc-media', { yPercent: 10, scale: 1.06, ease: 'none' }, 0)
        .to('.hc-dim', { opacity: 0.75, ease: 'none' }, 0)
        .to('.hc-content', { yPercent: -18, opacity: 0, ease: 'power1.in' }, 0);
    }, hero);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} id="hero" data-depth="true" className="hero-cine" aria-label={`${BRAND.chapter}, ${BRAND.college}`}>
      <div className="hc-media hero-liquid" aria-hidden="true">
        <FxBoundary fallback={<div className="hc-liquid-fallback" />}>
          <Suspense fallback={<div className="hc-liquid-fallback" />}>
            <ShaderGradient
              className="hc-gradient"
              colors={['#01030a', '#12348f', '#5aa8ff']}
              speed={0.16}
              strength={1.25}
              density={0.5}
              grain={0.05}
              rotation={[-0.5, 0, -0.4]}
            />
          </Suspense>
        </FxBoundary>
      </div>
      <div className="hc-shade" aria-hidden="true" />
      <div className="hc-dim" aria-hidden="true" />

      <div className="hc-content">
        <div className="hc-brand hc-fade">
          <img className="acm-logo" src={asset(BRAND.logo)} alt={BRAND.logoAlt} fetchPriority="high" decoding="async" />
        </div>
        <p className="hc-eyebrow hc-fade">{BRAND.chapter} · {BRAND.college} · {BRAND.city}</p>
        <h1 className="hc-name hc-name--lede" aria-label={BRAND.headline}>
          <span className="hc-line"><span>Empowering the</span></span>
          <span className="hc-line"><span>Next Generation of</span></span>
          <span className="hc-line"><span className="hero-gradient">Computing Innovators</span></span>
        </h1>
        <div className="hc-role hc-fade"><RotatingRole /></div>
        <p className="hc-sub hc-fade">
          Workshops, hackathons, tech talks and study circles across the CSE and IT departments — so a computing
          degree ends with things you have actually built, explained and defended.
        </p>
        <div className="hc-actions hc-fade">
          <button type="button" onClick={onExplore} data-cursor="magnetic" className="hc-btn hc-btn-solid">
            Explore the chapter <span aria-hidden="true">↓</span>
          </button>
          <a href="#join" data-cursor="magnetic" className="hc-btn lg">Join us</a>
        </div>
        <ul className="hc-pillars hc-fade" aria-label="What the chapter does">
          {BRAND.pillars.map((p, i) => (
            <li key={p}><i className={DOT[i % DOT.length]} />{p}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

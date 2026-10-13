import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { world, webgl, reducedMotion } from './lib/store';
import { initShots, initReveals, initVelocitySkew, initTilt } from './lib/cinema';
import ScrollProgressBar from './components/ScrollProgressBar';
import MagneticCursor from './components/MagneticCursor';
import LoadingScreen from './components/LoadingScreen';
import Navigation from './components/Navigation';
import ChapterRail from './components/ChapterRail';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import Manifesto from './components/Manifesto';
import Domains from './components/Domains';
import Events from './components/Events';
import ImpactSection from './components/ImpactSection';
import FacultySection from './components/FacultySection';
import TeamSection from './components/TeamSection';
import TileRows from './components/TileRows';
import VelocityMarquee from './components/VelocityMarquee';
import JoinCTA from './components/JoinCTA';
import ContactSection from './components/ContactSection';
import FooterMarquee from './components/FooterMarquee';
import LocalTime from './components/LocalTime';
import LiquidGlassFilter from './components/fx/LiquidGlassFilter';
import { BRAND, CHAPTERS, EXTERNAL } from './data/brand';

const HazeCanvas = lazy(() => import('./components/HazeCanvas'));

gsap.registerPlugin(ScrollTrigger);

const SECTIONS = CHAPTERS.map(([id]) => id);

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const activeRef = useRef('hero');
  const lenisRef = useRef<Lenis | null>(null);
  const onLoaded = useCallback(() => {
    (window as unknown as { __vkLoaded?: boolean }).__vkLoaded = true;
    if (window.scrollY < 50) world.shot = 'hero';
    ScrollTrigger.refresh();
    window.dispatchEvent(new Event('vk:loaded'));
  }, []);

  // Smooth scroll → ScrollTrigger + shared world state. No React state per frame.
  useEffect(() => {
    const lenis = new Lenis({ anchors: { offset: -70 }, duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: !reducedMotion });
    lenisRef.current = lenis;
    if (document.documentElement.classList.contains('is-loading')) lenis.stop();
    lenis.on('scroll', (l: Lenis) => {
      ScrollTrigger.update();
      world.progress = l.progress;
      world.velocity = l.velocity;
    });
    const onScrollTo = (e: Event) => lenis.scrollTo((e as CustomEvent<number>).detail, { duration: 1.1 });
    window.addEventListener('vk:scrollto', onScrollTo);
    const stop = () => lenis.stop();
    const start = () => lenis.start();
    window.addEventListener('vk:modal-open', stop);
    window.addEventListener('vk:modal-close', start);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.removeEventListener('vk:modal-open', stop);
      window.removeEventListener('vk:modal-close', start);
      window.removeEventListener('vk:scrollto', onScrollTo);
    };
  }, []);

  // Active nav item: IntersectionObserver, state only changes when the section changes
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting && activeRef.current !== e.target.id) {
          activeRef.current = e.target.id;
          setActiveSection(e.target.id);
        }
      }),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  // Cinematic systems (created after all sections have set up their own pins)
  useEffect(() => {
    const ctx = gsap.context(() => {
      initShots();
      initReveals();
    });
    const stopSkew = initVelocitySkew();
    const stopTilt = initTilt();
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    const t = setTimeout(refresh, 800);
    return () => { ctx.revert(); stopSkew(); stopTilt(); clearTimeout(t); };
  }, []);

  const handleNavigate = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (target && lenisRef.current) lenisRef.current.scrollTo(target, { offset: -70, duration: 1.4 });
    else target?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen text-[#F5F5F2] selection:bg-[#2F7BFF] selection:text-white">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="film-grain-overlay" aria-hidden="true" />
      <div className="cinema-vignette" aria-hidden="true" />
      <LiquidGlassFilter />
      <MagneticCursor />
      {webgl ? (
        <Suspense fallback={<div className="haze-layer haze-fallback" aria-hidden="true" />}><HazeCanvas /></Suspense>
      ) : (
        <div className="haze-layer haze-fallback" aria-hidden="true" />
      )}
      <ScrollProgressBar />
      <LoadingScreen onComplete={onLoaded} />
      <Navigation activeSection={activeSection} onNavigate={handleNavigate} />
      <ChapterRail active={activeSection} onNavigate={handleNavigate} />

      <main id="main" className="relative z-10">
        <HeroSection onExplore={() => handleNavigate('about')} />
        <AboutSection />
        <VelocityMarquee />
        <Domains />
        <Manifesto />
        <Events />
        <ImpactSection />
        <FacultySection />
        <TeamSection />
        <TileRows />
        <VelocityMarquee reverse />
        <JoinCTA onContact={() => handleNavigate('contact')} />
        <ContactSection />
        <div className="site-footer">
          <FooterMarquee />
          <footer className="site-foot">
            <span className="available"><i /> {BRAND.chapter} · {BRAND.college}</span>
            <span>© {new Date().getFullYear()} {BRAND.chapter}, {BRAND.college} · <LocalTime /></span>
            <span style={{ display: 'flex', gap: 24 }}>
              <a href={EXTERNAL.acm} target="_blank" rel="noopener noreferrer">ACM</a>
              <a href={EXTERNAL.acmIndia} target="_blank" rel="noopener noreferrer">ACM India</a>
              <a href={EXTERNAL.vce} target="_blank" rel="noopener noreferrer">VCE</a>
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

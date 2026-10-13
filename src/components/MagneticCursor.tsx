import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { finePointer, reducedMotion } from '../lib/store';

const MAGNETIC = '[data-cursor="magnetic"], button, a[href], [role="button"]';

/**
 * Dot + lagging ring. The native cursor stays until the custom one has rendered
 * and received a mousemove, so the page is never left without a pointer.
 */
export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current, ring = ringRef.current, label = labelRef.current;
    if (!dot || !ring || !label) return;
    const body = document.body;
    let shown = false;
    let magnet: HTMLElement | null = null;
    let mx: gsap.QuickToFunc | null = null;
    let my: gsap.QuickToFunc | null = null;

    try {
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
      const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
      const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
      const rx = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3' });
      const ry = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3' });
      const ringTo = (v: gsap.TweenVars) => gsap.to(ring, { duration: 0.35, ease: 'power3.out', overwrite: 'auto', ...v });

      const release = () => {
        if (!magnet) return;
        gsap.killTweensOf(magnet, 'x,y');
        gsap.to(magnet, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        magnet = null; mx = my = null;
      };
      const idle = () => {
        release();
        ringTo({ width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0)', borderColor: 'rgba(255,255,255,0.6)' });
        gsap.to(dot, { scale: 1, opacity: 1, duration: 0.2 });
        gsap.to(label, { opacity: 0, duration: 0.15 });
      };

      const onMove = (e: MouseEvent) => {
        if (!shown) {
          shown = true;
          body.classList.add('has-custom-cursor');
          gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
          gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
        }
        dx(e.clientX); dy(e.clientY);
        if (magnet && mx && my) {
          const r = magnet.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          mx(gsap.utils.clamp(-14, 14, (e.clientX - cx) * 0.35));
          my(gsap.utils.clamp(-14, 14, (e.clientY - cy) * 0.35));
          rx(cx + (e.clientX - cx) * 0.2); ry(cy + (e.clientY - cy) * 0.2);
        } else { rx(e.clientX); ry(e.clientY); }
      };

      const onOver = (e: MouseEvent) => {
        const t = e.target as HTMLElement;
        if (t.closest('[data-cursor="view"]')) {
          release();
          ringTo({ width: 92, height: 92, borderRadius: 999, backgroundColor: 'rgba(245,245,242,1)', borderColor: 'rgba(245,245,242,0)' });
          gsap.to(dot, { opacity: 0, duration: 0.15 });
          gsap.to(label, { opacity: 1, duration: 0.2, delay: 0.05 });
          return;
        }
        const m = t.closest<HTMLElement>(MAGNETIC);
        if (m) {
          const r = m.getBoundingClientRect();
          // large blocks (cards) get a highlight ring, small controls get the magnetic pull
          if (r.width > 360 || r.height > 160) {
            release();
            ringTo({ width: 64, height: 64, borderRadius: 999, backgroundColor: 'rgba(47,123,255,0.18)', borderColor: 'rgba(110,168,255,0.8)' });
            gsap.to(dot, { scale: 0.6, duration: 0.2 });
            return;
          }
          if (m !== magnet) {
            release();
            magnet = m;
            mx = gsap.quickTo(m, 'x', { duration: 0.35, ease: 'power3' });
            my = gsap.quickTo(m, 'y', { duration: 0.35, ease: 'power3' });
          }
          const radius = parseFloat(getComputedStyle(m).borderTopLeftRadius) || 10;
          ringTo({ width: r.width + 16, height: r.height + 16, borderRadius: radius + 8, backgroundColor: 'rgba(255,255,255,0)', borderColor: 'rgba(255,255,255,0.45)' });
          gsap.to(dot, { scale: 0.5, duration: 0.2 });
          gsap.to(label, { opacity: 0, duration: 0.1 });
          return;
        }
        if (t.closest('p, li, h1, h2, h3')) {
          release();
          ringTo({ width: 3, height: 30, borderRadius: 2, backgroundColor: 'rgba(245,245,242,1)', borderColor: 'rgba(0,0,0,0)' });
          gsap.to(dot, { opacity: 0, duration: 0.15 });
          return;
        }
        idle();
      };

      const down = () => gsap.to(ring, { scale: 0.82, duration: 0.15 });
      const up = () => gsap.to(ring, { scale: 1, duration: 0.35, ease: 'power3.out' });
      const leave = () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
      const enter = () => shown && gsap.to([dot, ring], { opacity: 1, duration: 0.2 });

      window.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseover', onOver);
      window.addEventListener('mousedown', down);
      window.addEventListener('mouseup', up);
      document.documentElement.addEventListener('mouseleave', leave);
      document.documentElement.addEventListener('mouseenter', enter);
      return () => {
        release();
        body.classList.remove('has-custom-cursor');
        window.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseover', onOver);
        window.removeEventListener('mousedown', down);
        window.removeEventListener('mouseup', up);
        document.documentElement.removeEventListener('mouseleave', leave);
        document.documentElement.removeEventListener('mouseenter', enter);
      };
    } catch {
      body.classList.remove('has-custom-cursor');
    }
  }, [enabled]);

  if (!enabled) return null;
  return createPortal(
    <>
      <div ref={ringRef} className="vk-cursor-ring" aria-hidden="true"><span ref={labelRef}>VIEW</span></div>
      <div ref={dotRef} className="vk-cursor-dot" aria-hidden="true" />
    </>,
    document.body,
  );
}

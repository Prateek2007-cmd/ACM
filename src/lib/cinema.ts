import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { world, reducedMotion } from './store';

gsap.registerPlugin(ScrollTrigger);

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_#$%&';

/** Decrypt-style text reveal: characters scramble, then resolve left to right. */
export function scramble(el: HTMLElement, duration = 0.9) {
  const final = el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = final;
  const o = { p: 0 };
  return gsap.to(o, {
    p: 1,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      const n = Math.floor(o.p * final.length);
      let out = final.slice(0, n);
      for (let i = n; i < final.length; i++) out += final[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
    },
    onComplete: () => { el.textContent = final; },
  });
}

/** Split an element's text into masked words (keeps nested elements). */
export function splitWords(el: HTMLElement) {
  if (el.dataset.split) return Array.from(el.querySelectorAll<HTMLElement>('.cw > span'));
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((c) => {
      if (c.nodeType === 3) {
        const t = c.textContent ?? '';
        if (!t.trim()) return;
        const frag = document.createDocumentFragment();
        t.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
          const o = document.createElement('span');
          o.className = 'cw';
          const i = document.createElement('span');
          i.textContent = part;
          o.appendChild(i);
          frag.appendChild(o);
        });
        c.parentNode?.replaceChild(frag, c);
      } else if (c.nodeType === 1 && (c as HTMLElement).tagName !== 'BR') walk(c);
    });
  };
  walk(el);
  el.dataset.split = '1';
  return Array.from(el.querySelectorAll<HTMLElement>('.cw > span'));
}

/** Camera shots + red mode driven by which section is on screen. */
export function initShots() {
  const map: [string, string][] = [
    ['hero', 'hero'], ['about', 'hook'], ['domains', 'layers'], ['manifesto', 'manifesto'],
    ['events', 'work'], ['impact', 'impact'], ['faculty', 'about'], ['team', 'about'], ['gallery', 'ecosystem'],
    ['join', 'contact'], ['contact', 'contact'],
  ];
  map.forEach(([id, shot]) => {
    const el = document.getElementById(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (s) => {
        if (!s.isActive) return;
        if (!(window as unknown as { __vkLoaded?: boolean }).__vkLoaded && id === 'hero') return; // intro keeps the wide shot until the curtain opens
        world.shot = shot;
      },
    });
  });
}

/** Headline word-rise, decrypting labels, and card rise-ins across the page. */
export function initReveals() {
  if (reducedMotion) return;
  // section headings (skip the pinned story sections, which animate themselves)
  gsap.utils.toArray<HTMLElement>('main section h2').forEach((h) => {
    if (h.closest('#hero') || h.dataset.noReveal !== undefined) return;
    const words = splitWords(h);
    gsap.from(words, {
      yPercent: 120,
      rotate: 6,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.04,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true },
    });
  });
  // mono eyebrow labels decrypt as they enter
  gsap.utils.toArray<HTMLElement>('main .eyebrow-label').forEach((el) => {
    if (el.closest('#hero')) return;
    const text = el.textContent ?? '';
    el.dataset.text = text;
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => scramble(el) });
  });
  // cards: rise with a slight 3D tilt, batched for performance
  ScrollTrigger.batch('main [data-card]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(els, { y: 60, rotateX: -12, autoAlpha: 0, transformPerspective: 900 }, { y: 0, rotateX: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', stagger: 0.07, clearProps: 'transform' }),
  });
}

/** Photos in [data-open] open up from a smaller frame and settle as they enter. */
export function initPhotoOpen() {
  if (reducedMotion) return;
  gsap.utils.toArray<HTMLElement>('[data-open]').forEach((el) => {
    gsap.to(el, { clipPath: 'inset(0% 0% 0% 0% round 20px)', ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 45%', scrub: 0.6 } });
    const img = el.querySelector('img');
    if (img) gsap.fromTo(img, { scale: 1.12, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/** Scroll-velocity skew: on-screen content leans slightly with fast scrolling, springs back.
 *  Only elements currently in view are touched, and only when the value changes. */
export function initVelocitySkew() {
  if (reducedMotion || window.innerWidth < 1024) return () => {};
  const visible = new Set<HTMLElement>();
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const el = e.target as HTMLElement;
    if (e.isIntersecting) visible.add(el);
    else { visible.delete(el); el.style.transform = ''; }
  }));
  document.querySelectorAll<HTMLElement>('main .section-content').forEach((el) => io.observe(el));
  let cur = 0;
  let applied = 0;
  const tick = () => {
    const target = gsap.utils.clamp(-0.8, 0.8, world.velocity * 0.025);
    cur += (target - cur) * 0.12;
    if (Math.abs(cur) < 0.005) cur = 0;
    if (Math.abs(cur - applied) < 0.01) return;
    applied = cur;
    const t = cur === 0 ? '' : `skewY(${cur.toFixed(2)}deg)`;
    visible.forEach((el) => { el.style.transform = t; });
  };
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); io.disconnect(); };
}

/** 3D tilt + moving glare on any [data-tilt] element (fine pointers only). */
export function initTilt() {
  if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const onMove = (e: PointerEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-tilt]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    gsap.to(card, { rotateY: (x - 0.5) * 5, rotateX: (0.5 - y) * 4, transformPerspective: 1000, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    card.style.setProperty('--gx', `${x * 100}%`);
    card.style.setProperty('--gy', `${y * 100}%`);
  };
  const onLeave = (e: PointerEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-tilt]');
    if (card && !card.contains(e.relatedTarget as Node)) gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerout', onLeave);
  return () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerout', onLeave);
  };
}

import { useEffect, useRef } from 'react';
import Visual, { type VisualKind } from './Visual';
import { reducedMotion } from '../lib/store';

const ROW1: [VisualKind, string, 'blue' | 'red' | 'amber'][] = [
  ['terminal', 'PROGRAMMING', 'blue'], ['grid', 'AI & MACHINE LEARNING', 'blue'], ['globe', 'OPEN SOURCE', 'blue'],
  ['shield', 'CYBER SECURITY', 'red'], ['flow', 'CLOUD & DEVOPS', 'blue'], ['bars', 'DATA & ANALYTICS', 'amber'], ['radar', 'RESEARCH', 'blue'],
];
const ROW2: [VisualKind, string, 'blue' | 'red' | 'amber'][] = [
  ['gauges', 'HACKATHONS', 'amber'], ['grid', 'WEB ENGINEERING', 'blue'], ['terminal', 'LINUX & TOOLING', 'blue'], ['flow', 'AUTOMATION', 'blue'],
  ['globe', 'COMMUNITY', 'blue'], ['bars', 'COMPETITIVE CODING', 'amber'], ['shield', 'SECURE CODING', 'red'],
];

/** Two rows of field tiles that slide in opposite directions as you scroll. */
export default function TileRows() {
  const root = useRef<HTMLElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = root.current;
      if (!el || !r1.current || !r2.current) return;
      const top = el.getBoundingClientRect().top;
      const offset = (window.innerHeight - top) * 0.3;
      r1.current.style.transform = `translate3d(${offset - 400}px,0,0)`;
      r2.current.style.transform = `translate3d(${-(offset - 400)}px,0,0)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const row = (items: typeof ROW1) => [...items, ...items, ...items].map(([k, label, acc], i) => (
    <div className="tile" key={i}><Visual kind={k} accent={acc} label={label} /></div>
  ));

  return (
    <section id="gallery" ref={root} className="tiles" aria-label="Fields of computing the chapter works in">
      <span className="sr-only">Fields of computing the chapter works in</span>
      <div ref={r1} className="tile-row">{row(ROW1)}</div>
      <div ref={r2} className="tile-row">{row(ROW2)}</div>
    </section>
  );
}

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from '../lib/store';
import { FACULTY } from '../data/content';

gsap.registerPlugin(ScrollTrigger);

/** The chapter's advisory network, drawn as an interface. */
const NODES: { x: number; y: number; label: string; sub: string; key: string }[] = [
  { x: 300, y: 330, label: 'CHAPTER CORE', sub: 'student office bearers', key: 'core' },
  { x: 600, y: 190, label: 'ACM', sub: 'the society', key: 'acm' },
  { x: 600, y: 470, label: 'DEPARTMENT', sub: 'CSE · IT', key: 'dept' },
  { x: 900, y: 330, label: 'FACULTY ADVISOR', sub: 'this section', key: 'advisor' },
  { x: 180, y: 560, label: 'CSE', sub: '', key: 'cse' },
  { x: 430, y: 648, label: 'IT', sub: '', key: 'it' },
  { x: 962, y: 560, label: 'EVENTS', sub: '', key: 'events' },
  { x: 762, y: 648, label: 'MEMBERS', sub: '', key: 'members' },
];

const LINKS: [number, number, boolean][] = [
  [0, 1, false], [0, 2, false], [0, 3, false], [2, 3, false], [2, 4, true],
  [2, 5, true], [0, 6, true], [0, 7, true], [6, 7, true], [1, 3, true],
];

/**
 * The blue interface behind the faculty section. Rendered twice: a dim base layer, and a lit
 * layer that the scan line wipes in — so scrolling literally switches the advisory layer on.
 */
function FacultyInterface({ lit = false }: { lit?: boolean }) {
  return (
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="facGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#6EA8FF" strokeOpacity="0.10" />
        </pattern>
        <radialGradient id="facPool" cx="62%" cy="42%" r="58%">
          <stop offset="0" stopColor="#2F7BFF" stopOpacity="0.4" />
          <stop offset="0.55" stopColor="#0A3DFF" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="facPanel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B1B45" stopOpacity="0.5" />
          <stop offset="1" stopColor="#03060F" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="#01030A" />
      <rect width="1200" height="800" fill="url(#facGrid)" />
      <rect width="1200" height="800" fill="url(#facPool)" />

      {/* the instrument frame */}
      <rect x="80" y="70" width="1040" height="660" rx="28" fill="url(#facPanel)" stroke="#6EA8FF" strokeOpacity={lit ? 0.36 : 0.18} />
      <line x1="80" y1="126" x2="1120" y2="126" stroke="#6EA8FF" strokeOpacity={lit ? 0.3 : 0.16} />
      {[[80, 70], [1120, 70], [80, 730], [1120, 730]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`} stroke="#8AB8FF" strokeOpacity={lit ? 0.85 : 0.4} strokeWidth="2" fill="none">
          <path d={`M${x === 80 ? 22 : -22} 0 H0 V${y === 70 ? 22 : -22}`} />
        </g>
      ))}
      <text x="104" y="106" fill="#8AB8FF" fillOpacity={lit ? 0.95 : 0.6} fontSize="13" fontFamily="Geist Mono, monospace" letterSpacing="3">
        CHAPTER NETWORK / ADVISORY LAYER
      </text>
      <text x="1096" y="106" textAnchor="end" fill="#8AB8FF" fillOpacity={lit ? 0.95 : 0.55} fontSize="13" fontFamily="Geist Mono, monospace" letterSpacing="3">
        VCE · HYDERABAD
      </text>

      {/* links */}
      {LINKS.map(([a, b, dashed], i) => (
        <line
          key={i}
          x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
          stroke="#6EA8FF" strokeOpacity={lit ? 0.55 : 0.22} strokeWidth={lit ? 1.6 : 1.2}
          strokeDasharray={dashed ? '7 9' : undefined}
        />
      ))}

      {/* nodes */}
      {NODES.map((n) => {
        const isAdvisor = n.key === 'advisor';
        return (
          <g key={n.key} transform={`translate(${n.x} ${n.y})`}>
            {isAdvisor && lit && (
              <>
                <circle r="30" fill="none" stroke="#7FE3FF" strokeOpacity="0.5" className="fac-pulse" />
                <circle r="52" fill="none" stroke="#7FE3FF" strokeOpacity="0.3" className="fac-pulse fac-pulse-slow" />
              </>
            )}
            <circle r="18" fill="none" stroke="#8AB8FF" strokeOpacity={isAdvisor ? (lit ? 0.95 : 0.45) : 0.4} strokeWidth={isAdvisor ? 2 : 1.4} />
            <circle r="7" fill={isAdvisor ? '#7FE3FF' : '#2F7BFF'} fillOpacity={lit ? 1 : 0.6} />
            <text y="-30" textAnchor="middle" fill="#EAF4FF" fillOpacity={lit ? 0.98 : 0.66} fontSize="14" fontFamily="Geist Mono, monospace" letterSpacing="2.4">
              {n.label}
            </text>
            {n.sub && (
              <text y="44" textAnchor="middle" fill="#8AB8FF" fillOpacity={lit ? 0.8 : 0.45} fontSize="11" fontFamily="Geist Mono, monospace" letterSpacing="1.6">
                {n.sub}
              </text>
            )}
          </g>
        );
      })}

      {/* scale ticks along the bottom of the frame */}
      {Array.from({ length: 26 }, (_, i) => (
        <line key={i} x1={104 + i * 40} y1="706" x2={104 + i * 40} y2={i % 5 === 0 ? 690 : 698} stroke="#6EA8FF" strokeOpacity={lit ? 0.5 : 0.22} />
      ))}
    </svg>
  );
}

/**
 * Faculty — the advisory layer of the chapter, presented in the reference's wipe language:
 * a pinned blue interface with a scan line that travels right to left as you scroll, lighting
 * the surface behind it and revealing the faculty side of the chapter.
 */
export default function FacultySection() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reducedMotion) { el.classList.add('lit'); return; }

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onUpdate: (st) => el.classList.toggle('lit', st.progress > 0.45),
        },
      })
        .to('.fac-lit', { clipPath: 'inset(0 0 0 0%)', ease: 'none' }, 0)
        .to('.fac-line', { left: '0%', ease: 'none' }, 0)
        .to('.fac-line', { opacity: 0, duration: 0.1 }, 0.9);

      gsap.from('.fac-rise', {
        y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 55%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="faculty" ref={root} className="faculty" aria-label="Faculty">
      <div className="fac-frame">
        <div className="fac-layer fac-base"><FacultyInterface /></div>
        <div className="fac-layer fac-lit"><FacultyInterface lit /></div>
        <span className="fac-line" aria-hidden="true" />
      </div>

      <div className="fac-copy">
        <p className="cc-eyebrow fac-rise">06 / {FACULTY.eyebrow}</p>
        <h2 data-no-reveal className="fac-rise">
          {FACULTY.title} <span className="fac-accent">{FACULTY.accent}</span>
        </h2>
        <p className="fac-note fac-rise">{FACULTY.lead}</p>
      </div>

      <div className="fac-panel">
        <div className="fac-readout fac-rise">
          <span>{FACULTY.readout.label}</span>
          <strong>{FACULTY.readout.value}</strong>
          <span>{FACULTY.readout.status}</span>
        </div>
        {FACULTY.people.map((p) => (
          <article className="fac-card fac-rise" key={p.role}>
            <span className="team-role">{p.role}</span>
            <p className="team-name">{p.name}</p>
            <p className="team-detail">{p.detail}</p>
          </article>
        ))}
      </div>

      <p className="fac-foot">{FACULTY.note}</p>
    </section>
  );
}

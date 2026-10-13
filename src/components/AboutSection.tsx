import { useState } from 'react';
import { ABOUT } from '../data/content';
import { BRAND } from '../data/brand';

/** About the chapter: copy on the left, the six operating habits as stack plates on the right. */
export default function AboutSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="about" className="about" aria-label={`About the ${BRAND.chapter}`}>
      <div className="section-content max-w-7xl mx-auto px-6 lg:px-12">
        <div className="about-grid">
          <div className="about-copy">
            <p className="eyebrow-label text-[#6EA8FF]">01 / {ABOUT.eyebrow}</p>
            <h2 className="acm-h2 mt-5" data-no-reveal>{ABOUT.title}</h2>
            <p className="about-lede mt-6">{ABOUT.lede}</p>
            {ABOUT.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            <div className="flex flex-wrap gap-2 pt-8">
              {BRAND.pillars.map((p) => (
                <span key={p} className="px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-[0.18em] uppercase bg-white/5 border border-white/10 text-white/90">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="about-right" onMouseLeave={() => setActive(-1)}>
            {ABOUT.layers.map((l, i) => (
              <button
                key={l.name}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                data-cursor="magnetic-off"
                className={`layer-plate ${active === i ? 'is-active' : ''}`}
                aria-label={`${l.name} — ${l.role}`}
              >
                <span className="lp-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="lp-name">{l.name}</span>
                <span className="lp-role">{l.role}</span>
                <span className="lp-dot" />
                <span className="lp-detail">{l.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

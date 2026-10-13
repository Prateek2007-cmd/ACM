import { IMPACT } from '../data/content';
import { BRAND } from '../data/brand';

/** The chapter band: only facts that can be checked — no invented member counts or metrics. */
export default function ImpactSection() {
  return (
    <section id="impact" className="stats" aria-label={`${BRAND.chapter} at a glance`}>
      <div className="section-content max-w-7xl mx-auto px-6 lg:px-12">
        <div className="acm-head">
          <p className="eyebrow-label text-[#6EA8FF]">04 / The chapter</p>
          <h2 className="acm-h2 max-w-3xl">Facts you can check, not numbers we made up.</h2>
        </div>
        <div className="stats-grid">
          {IMPACT.map((s) => (
            <article className="stat" key={s.label} data-card>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
              <p className="stat-note">{s.note}</p>
            </article>
          ))}
        </div>
        <p className="team-note">
          <strong>Why this band is short:</strong> the chapter’s member counts, event history and outcomes are not
          published anywhere we can verify, so they are not stated here. Details will be added as they are confirmed.
        </p>
      </div>
    </section>
  );
}

import { TEAM } from '../data/content';

/** Office bearers: roles are shown, names are not guessed. */
export default function TeamSection() {
  return (
    <section id="team" className="team" aria-label="Chapter team">
      <div className="section-content max-w-7xl mx-auto px-6 lg:px-12">
        <div className="acm-head">
          <p className="eyebrow-label text-[#6EA8FF]">05 / People</p>
          <h2 className="acm-h2 max-w-3xl">The student team.</h2>
        </div>

        <div className="team-grid" style={{ marginTop: 'clamp(32px, 5vh, 52px)' }}>
          {TEAM.core.map((m) => (
            <article className="team-card" key={m.role} data-card>
              <span className="team-role">{m.role}</span>
              <p className="team-name">{m.status}</p>
              <p className="team-status">Role open for the current term</p>
            </article>
          ))}
        </div>

        <p className="team-note">{TEAM.note}</p>
      </div>
    </section>
  );
}

import { CHAPTERS } from '../data/brand';

/** Right-edge chapter rail: shows where you are in the story; hover for names, click to jump. */
export default function ChapterRail({ active, onNavigate }: { active: string; onNavigate: (id: string) => void }) {
  const idx = Math.max(0, CHAPTERS.findIndex(([id]) => id === active));
  return (
    <nav className="chapter-rail" aria-label="Chapters">
      <span className="cr-count">{String(idx + 1).padStart(2, '0')}</span>
      {CHAPTERS.map(([id, label], i) => (
        <button key={id} type="button" onClick={() => onNavigate(id)} className={`cr-item ${i === idx ? 'on' : ''} ${i < idx ? 'past' : ''}`} aria-current={i === idx ? 'step' : undefined}>
          <span className="cr-label">{label}</span>
          <span className="cr-tick" />
        </button>
      ))}
      <span className="cr-count dim">{String(CHAPTERS.length).padStart(2, '0')}</span>
    </nav>
  );
}

import { useMemo, useState } from 'react';
import RegistrationDialog from './RegistrationDialog';
import {
  EVENTS,
  EVENT_NOTE,
  REGISTRATION,
  VENUE_TBA,
  registrationLabel,
  sortEvents,
  whenLabel,
  type EventEntry,
  type Track,
} from '../data/events';

const TRACKS: Track[] = ['Learn', 'Build', 'Share', 'Compete'];
const FILTERS: (Track | 'All')[] = ['All', ...TRACKS];

/** What the state chip says. `interest` is the honest word when there is no date yet. */
const STATE_LABEL: Record<EventEntry['registration']['state'], string> = {
  open: 'Registrations open',
  interest: 'Date to be announced · register interest',
  closed: 'Registration closed',
};

/**
 * The chapter's calendar, with the register action on every row.
 *
 * The rows come straight from `src/data/events.ts`, so publishing a date is a one-line edit there —
 * until then a row shows "Date to be announced" rather than a date the chapter has not confirmed.
 */
export default function EventCalendar() {
  const [track, setTrack] = useState<Track | 'All'>('All');
  const [registering, setRegistering] = useState<EventEntry | null>(null);

  const list = useMemo(() => sortEvents(EVENTS).filter((e) => track === 'All' || e.track === track), [track]);
  const mode = REGISTRATION.endpoint ? 'endpoint' : REGISTRATION.formId ? 'form' : 'email';

  return (
    <div className="ec" id="calendar">
      <div className="ec-head">
        <p className="eyebrow-label text-[#6EA8FF]">This term’s calendar</p>
        <h3 className="ec-title">Events, and how to get on the list.</h3>
        <p className="ec-note">{EVENT_NOTE}</p>
      </div>

      <div className="ec-filters" role="group" aria-label="Filter the calendar by track">
        {FILTERS.map((t) => (
          <button
            key={t}
            type="button"
            className={`ec-chip${t === track ? ' is-on' : ''}`}
            aria-pressed={t === track}
            onClick={() => setTrack(t)}
            data-cursor="magnetic"
          >
            {t}
            {t !== 'All' ? <i aria-hidden="true">{EVENTS.filter((e) => e.track === t).length}</i> : null}
          </button>
        ))}
      </div>

      <ol className="ec-list">
        {list.map((e) => {
          const closed = e.registration.state === 'closed';
          return (
            <li className={`ec-row ec-${e.track.toLowerCase()}`} key={e.id} data-card>
              <div className="ec-date" aria-hidden={e.date === null}>
                {e.date ? (
                  <>
                    <span className="ec-day">{e.date.split('-')[2]}</span>
                    <span className="ec-month">{monthOf(e.date)}</span>
                  </>
                ) : (
                  <span className="ec-tba">TBA</span>
                )}
              </div>

              <div className="ec-body">
                <span className="ec-series">{e.series} · {e.track} track</span>
                <h4 className="ec-name">{e.title}</h4>
                <p className="ec-blurb">{e.blurb}</p>
                <p className="ec-outcome"><strong>You leave with:</strong> {e.outcome}</p>
                <ul className="ec-meta">
                  <li>{whenLabel(e)}</li>
                  <li>{e.venue ?? VENUE_TBA}</li>
                  <li>{e.mode}</li>
                  {e.seats ? <li>{e.seats}</li> : null}
                </ul>
              </div>

              <div className="ec-action">
                <span className={`ec-state ec-state-${e.registration.state}`}>{STATE_LABEL[e.registration.state]}</span>
                {e.registration.url && e.registration.state !== 'closed' ? (
                  <a className="ec-cta" href={e.registration.url} target="_blank" rel="noopener noreferrer" data-cursor="magnetic">
                    {registrationLabel(e)}
                  </a>
                ) : (
                  <button type="button" className="ec-cta" onClick={() => setRegistering(e)} disabled={closed} data-cursor="magnetic">
                    {registrationLabel(e)}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="ec-foot">
        {mode === 'form'
          ? 'Registrations are collected through the chapter’s own form — it opens right here.'
          : mode === 'endpoint'
            ? 'Registrations go to the chapter’s registration inbox.'
            : <>Registrations currently reach the chapter by email at <strong>{REGISTRATION.email}</strong>. When the chapter connects its own form, this page takes registrations directly.</>}
      </p>

      <RegistrationDialog event={registering} onClose={() => setRegistering(null)} />
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthOf = (iso: string) => MONTHS[Number(iso.split('-')[1]) - 1] ?? '';

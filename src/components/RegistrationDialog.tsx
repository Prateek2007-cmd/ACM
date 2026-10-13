import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, Loader2, Mail, Send, X } from 'lucide-react';
import { REGISTRATION, registrationChannel, whenLabel, type EventEntry } from '../data/events';
import {
  DEPARTMENTS,
  EMPTY_DRAFT,
  YEARS,
  hasErrors,
  registrationMailto,
  registrationPayload,
  sendRegistration,
  validateRegistration,
  type FieldError,
  type RegistrationDraft,
} from '../lib/registration';

/** The accent class per track, kept next to the component that uses it. */
const TRACK_CLASS: Record<EventEntry['track'], string> = { Learn: 'blue', Build: 'amber', Share: 'blue', Compete: 'red' };

/**
 * Register for one event.
 *
 * There is no server behind this site, so the dialog is honest about where a registration goes:
 * an embedded hosted form when one is configured, the chapter's own endpoint when one is set, and
 * otherwise the chapter's mailbox with the form contents written into the email. All three paths
 * are real; none of them pretends to store anything.
 */
export default function RegistrationDialog({ event, onClose }: { event: EventEntry | null; onClose: () => void }) {
  const [draft, setDraft] = useState<RegistrationDraft>(EMPTY_DRAFT);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'editing' | 'sending' | 'sent' | 'failed'>('editing');
  const [failure, setFailure] = useState('');
  const [mailto, setMailto] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();
  const channel = useMemo(() => registrationChannel(), []);
  const embed = REGISTRATION.embedUrl(REGISTRATION.formId);
  const errors: FieldError = useMemo(() => validateRegistration(draft), [draft]);

  const set = <K extends keyof RegistrationDraft>(key: K, value: RegistrationDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const open = event !== null;

  // lock the page behind the dialog and give focus to it; hand both back on close
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    document.documentElement.classList.add('is-dialog');
    window.dispatchEvent(new Event('vk:modal-open'));
    const t = window.setTimeout(() => {
      dialog.current?.querySelector<HTMLElement>('input, select, textarea, button, a[href]')?.focus();
    }, 20);
    return () => {
      window.clearTimeout(t);
      document.documentElement.classList.remove('is-dialog');
      window.dispatchEvent(new Event('vk:modal-close'));
      const back = opener.current as HTMLElement | null;
      back?.focus?.();
    };
  }, [open]);

  // esc closes; tab stays inside the dialog
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const nodes = dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, iframe');
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!event) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors(errors)) {
      dialog.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    const stamp = new Date().toISOString();
    if (channel === 'endpoint' && REGISTRATION.endpoint) {
      setStatus('sending');
      try {
        await sendRegistration(REGISTRATION.endpoint, registrationPayload(event, draft, stamp));
        setStatus('sent');
      } catch (err) {
        setFailure((err as Error).message);
        setStatus('failed');
      }
      return;
    }
    // nothing to post to: hand the registration to the chapter's mailbox, already written
    const href = registrationMailto(REGISTRATION.email ?? '', event, draft, stamp);
    setMailto(href);
    setStatus('sent');
    window.location.href = href;
  };

  // a field's message is withheld until the first submit, so the form does not scold you as you type
  const error = (key: keyof RegistrationDraft) => (touched || status === 'failed' ? errors[key] : undefined);

  return (
    <div className="reg-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="reg-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog}>
        <button type="button" className="reg-x" onClick={onClose} aria-label="Close">
          <X size={18} aria-hidden="true" />
        </button>

        <header className="reg-head">
          <span className={`reg-track reg-track-${TRACK_CLASS[event.track]}`}>{event.track} track</span>
          <h3 id={titleId}>{event.title}</h3>
          <p className="reg-when">{whenLabel(event)} · {event.venue ?? 'Venue to be announced'} · {event.mode}</p>
        </header>

        {status === 'sent' && channel !== 'form' ? (
          <div className="reg-done">
            <span className="reg-done-icon" aria-hidden="true"><Check size={20} /></span>
            <p className="reg-done-title">
              {channel === 'endpoint' ? 'Registration received.' : 'Your registration is ready to send.'}
            </p>
            <p className="reg-done-text">
              {channel === 'endpoint'
                ? `The chapter has your details for ${event.title} and will confirm by email.`
                : `Your mail app should have opened with the details filled in for ${event.title}. If it did not, use the button below — the message is already written.`}
            </p>
            {mailto ? (
              <a className="reg-btn reg-btn-solid" href={mailto} data-cursor="magnetic">
                <Mail size={16} aria-hidden="true" /> Open the email again
              </a>
            ) : null}
            <button type="button" className="reg-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            {channel === 'email' && (
              <p className="reg-channel-note">
                <Send size={14} aria-hidden="true" />
                The chapter’s online form is not connected yet, so this sends your registration to{' '}
                <strong>{REGISTRATION.email}</strong> from your own mail app — nothing is stored on this site.
              </p>
            )}
            {channel === 'endpoint' && (
              <p className="reg-channel-note">
                <Send size={14} aria-hidden="true" /> Your details go straight to the chapter’s registration inbox.
              </p>
            )}

            {channel === 'form' && embed ? (
              <div className="reg-embed">
                <iframe src={embed} title={`Registration form for ${event.title}`} loading="lazy" style={{ border: 0 }} width="100%" height="520" />
                <a className="reg-btn" href={embed} target="_blank" rel="noopener noreferrer" data-cursor="magnetic">
                  Open the form in a new tab <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            ) : channel !== 'form' ? (
              <form className="reg-form" onSubmit={submit} noValidate>
                <div className="reg-grid">
                  <Field label="Full name" required error={error('name')}>
                    <input value={draft.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="As it should appear on the register" aria-invalid={!!error('name')} />
                  </Field>
                  <Field label="Email" required error={error('email')}>
                    <input value={draft.email} onChange={(e) => set('email', e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!error('email')} />
                  </Field>
                  <Field label="Phone" error={error('phone')}>
                    <input value={draft.phone} onChange={(e) => set('phone', e.target.value)} type="tel" autoComplete="tel" placeholder="Optional" aria-invalid={!!error('phone')} />
                  </Field>
                  <Field label="College ID" error={error('collegeId')}>
                    <input value={draft.collegeId} onChange={(e) => set('collegeId', e.target.value)} placeholder="Optional" aria-invalid={!!error('collegeId')} />
                  </Field>
                  <Field label="Department" required error={error('department')}>
                    <select value={draft.department} onChange={(e) => set('department', e.target.value)} aria-invalid={!!error('department')}>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Year" required error={error('year')}>
                    <select value={draft.year} onChange={(e) => set('year', e.target.value)} aria-invalid={!!error('year')}>
                      <option value="">Choose…</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                  <Field label="Team name" error={error('team')}>
                    <input value={draft.team} onChange={(e) => set('team', e.target.value)} placeholder="Optional, for team events" aria-invalid={!!error('team')} />
                  </Field>
                </div>
                <Field label="Anything the organisers should know" error={error('notes')}>
                  <textarea value={draft.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Optional — accessibility, questions, dietary needs…" aria-invalid={!!error('notes')} />
                </Field>
                <label className="reg-consent">
                  <input type="checkbox" checked={draft.consent} onChange={(e) => set('consent', e.target.checked)} aria-invalid={!!error('consent')} />
                  <span>The chapter may contact me about this event and the ones that follow it.</span>
                </label>
                {error('consent') ? <p className="reg-error" role="alert">{errors.consent}</p> : null}
                {status === 'failed' ? (
                  <p className="reg-error" role="alert">{failure || 'That did not go through.'} Please try again, or email {REGISTRATION.email}.</p>
                ) : null}

                <div className="reg-actions">
                  <button type="submit" className="reg-btn reg-btn-solid" disabled={status === 'sending'} data-cursor="magnetic">
                    {status === 'sending' ? <Loader2 size={16} className="reg-spin" aria-hidden="true" /> : null}
                    {status === 'sending' ? 'Sending…' : channel === 'email' ? 'Send my registration' : 'Register for this event'}
                  </button>
                  <button type="button" className="reg-btn" onClick={onClose}>Cancel</button>
                </div>
              </form>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="reg-field">
      <span className="reg-label">{label}{required ? <i aria-hidden="true">*</i> : null}</span>
      {children}
      {error ? <span className="reg-error">{error}</span> : null}
    </label>
  );
}

/**
 * Registration logic for chapter events — pure and DOM-free, so it can be checked without a browser.
 *
 * The dialog is only the shell: the field rules, the payload that travels to the organisers and the
 * prefilled fallback email all live here. `scripts/verify-events.ts` exercises them.
 */

import type { EventEntry } from '../data/events';

export type RegistrationDraft = {
  name: string;
  email: string;
  phone: string;
  collegeId: string;
  department: string;
  year: string;
  team: string;
  notes: string;
  consent: boolean;
};

export const EMPTY_DRAFT: RegistrationDraft = {
  name: '',
  email: '',
  phone: '',
  collegeId: '',
  department: 'Computer Science and Engineering',
  year: '',
  team: '',
  notes: '',
  consent: false,
};

/** The choices the form offers. Departments mirror the two the chapter is open to. */
export const DEPARTMENTS = ['Computer Science and Engineering', 'Information Technology', 'Other'];
export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'Other'];

export type FieldError = Partial<Record<keyof RegistrationDraft, string>>;

// Deliberately permissive: a college form should not reject a valid address over a pattern. It needs
// one @, something before it, and a dot in the domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digits = (v: string) => v.replace(/\D/g, '');

/** Field-by-field errors. An empty object means the draft is submittable. */
export function validateRegistration(d: RegistrationDraft): FieldError {
  const errors: FieldError = {};
  const name = d.name.trim();
  if (name.length < 2) errors.name = 'Tell us the name to put on the register.';
  else if (!/[A-Za-z\u00C0-\u024F]/.test(name)) errors.name = 'A name needs at least one letter.';

  const email = d.email.trim();
  if (!email) errors.email = 'We need an address to send the confirmation to.';
  else if (!EMAIL_RE.test(email)) errors.email = 'That address does not look complete.';

  const phone = d.phone.trim();
  if (phone && (digits(phone).length < 7 || digits(phone).length > 15)) errors.phone = 'That number looks short or long.';

  if (!DEPARTMENTS.includes(d.department)) errors.department = 'Choose a department from the list.';
  if (!YEARS.includes(d.year)) errors.year = 'Choose the year you are in.';
  if (d.notes.trim().length > 500) errors.notes = 'Keep it under 500 characters.';
  if (!d.consent) errors.consent = 'Please confirm the chapter may contact you about this event.';
  return errors;
}

export const hasErrors = (e: FieldError) => Object.keys(e).length > 0;

/**
 * The record that goes to the organisers. Flat strings only, so it can be posted as JSON to any
 * endpoint or dropped into an email body unchanged.
 */
export function registrationPayload(event: EventEntry, d: RegistrationDraft, submittedAt: string): Record<string, string> {
  return {
    kind: 'event-registration',
    eventId: event.id,
    event: event.title,
    track: event.track,
    series: event.series,
    when: event.date ?? event.window ?? 'to be announced',
    name: d.name.trim(),
    email: d.email.trim(),
    phone: d.phone.trim(),
    collegeId: d.collegeId.trim(),
    department: d.department,
    year: d.year,
    team: d.team.trim(),
    notes: d.notes.trim(),
    consent: 'yes',
    submittedAt,
  };
}

/** `2026-10-13T09:12:00.000Z` → `13 Oct 2026, 09:12 UTC`, for the email body. */
export function stampLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/**
 * The fallback path: the same registration, handed to the chapter's mailbox. This is what keeps
 * "register" working before any form endpoint exists — the student's own mail client sends it.
 */
export function registrationMailto(email: string, event: EventEntry, d: RegistrationDraft, submittedAt: string): string {
  const p = registrationPayload(event, d, submittedAt);
  const body = [
    `Registration — ${p.event}`,
    '',
    `Event:      ${p.event} (${p.series}, ${p.track} track)`,
    `When:       ${p.when}`,
    '',
    `Name:       ${p.name}`,
    `Email:      ${p.email}`,
    p.phone ? `Phone:      ${p.phone}` : null,
    p.collegeId ? `College ID: ${p.collegeId}` : null,
    `Department: ${p.department}`,
    `Year:       ${p.year}`,
    p.team ? `Team:       ${p.team}` : null,
    p.notes ? `\nNotes:\n${p.notes}` : null,
    '',
    `Submitted from the chapter site on ${stampLabel(submittedAt)}.`,
  ].filter((line) => line !== null).join('\n');

  return `mailto:${email}?subject=${encodeURIComponent(`Registration — ${event.title}`)}&body=${encodeURIComponent(body)}`;
}

/** Post a registration to a JSON endpoint. Throws with the status on a non-2xx, so the UI can say so. */
export async function sendRegistration(endpoint: string, payload: Record<string, string>): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Registration endpoint returned ${res.status}`);
}

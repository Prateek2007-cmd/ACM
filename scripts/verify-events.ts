/**
 * Verifies the events calendar and the registration path without a browser.
 *
 *   bun run scripts/verify-events.ts
 *
 * Two kinds of claim are checked here:
 *   1. the calendar is honest — every entry belongs to a track the page actually publishes, and an
 *      entry with no confirmed date says so instead of showing one;
 *   2. a registration really can reach the chapter — the field rules accept and reject the right
 *      drafts, and with no form/endpoint configured the fallback email is fully written out.
 *
 * Plus the faculty portrait slots: every person has one, a photo path that is set must exist on
 * disk, and the two department heads are the ones the college publishes.
 */

import { existsSync, readFileSync } from 'node:fs';
import {
  CONFIRMED_COUNT,
  DATE_TBA,
  EVENTS,
  REGISTRATION,
  formatEventDate,
  registrationChannel,
  registrationLabel,
  sortEvents,
  whenLabel,
} from '../src/data/events';
import { DOMAINS, FACULTY, PROGRAMMES } from '../src/data/content';
import {
  DEPARTMENTS,
  EMPTY_DRAFT,
  YEARS,
  hasErrors,
  registrationMailto,
  registrationPayload,
  validateRegistration,
  type RegistrationDraft,
} from '../src/lib/registration';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${name}${detail ? `  — ${detail}` : ''}`);
};

const at = (file: string) => new URL(`../${file}`, import.meta.url);
const read = (file: string) => readFileSync(at(file), 'utf8');

const STAMP = '2026-10-13T09:12:00.000Z';
const GOOD: RegistrationDraft = {
  ...EMPTY_DRAFT,
  name: 'A Student',
  email: 'student@vce.ac.in',
  phone: '+91 98765 43210',
  collegeId: '1602-21-733-001',
  department: DEPARTMENTS[0],
  year: YEARS[1],
  team: 'Null Pointer Exception',
  notes: 'Can only attend after 4pm.',
  consent: true,
};

// ---------------------------------------------------------------- 1. the calendar

console.log('\n1. the calendar is honest and complete\n');

const ids = new Set(EVENTS.map((e) => e.id));
check('every event has a unique id', ids.size === EVENTS.length, `${EVENTS.length} events`);
check('every event names a title, a blurb and an outcome', EVENTS.every((e) => e.title && e.blurb && e.outcome));

// An event may belong to a programme track or to one of the six domains the page publishes — but it
// may not name something the page never mentions.
const published = new Set([...PROGRAMMES.map((p) => p.title), ...DOMAINS.map((d) => d.name)]);
const strays = EVENTS.filter((e) => !published.has(e.series));
check('every event belongs to something the page actually publishes', strays.length === 0,
  strays.length ? strays.map((e) => `${e.id} → "${e.series}"`).join(', ') : `${published.size} published tracks/domains to choose from`);

const tracks = new Set(['Learn', 'Build', 'Share', 'Compete']);
check('every event sits in one of the four tracks', EVENTS.every((e) => tracks.has(e.track)));

// A date that has not been confirmed must never be shown as one.
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const badDates = EVENTS.filter((e) => e.date !== null && !ISO.test(e.date));
check('confirmed dates are ISO, and nothing else is dated', badDates.length === 0,
  badDates.length ? badDates.map((e) => `${e.id} ${e.date}`).join(', ') : `${CONFIRMED_COUNT} dated, ${EVENTS.length - CONFIRMED_COUNT} awaiting a date`);

const undated = EVENTS.filter((e) => e.date === null);
check('an entry with no date says "to be announced"', undated.every((e) => whenLabel(e).includes('to be announced') || e.window !== null),
  undated.length ? undated.map((e) => `${e.id} → "${whenLabel(e)}"`).join(', ') : 'every entry is dated');
check('a dated entry shows its date', EVENTS.filter((e) => e.date).every((e) => whenLabel(e).includes(formatEventDate(e.date as string))));
check('the pending-date wording is the one the UI exports', whenLabel({ ...EVENTS[0], date: null, window: null }) === DATE_TBA);

// Registered as a dated event, it must sort ahead of the undated ones — and the earliest date first.
// Tested on a synthetic list so the check holds whether or not the chapter has published a date yet.
const [sole] = EVENTS;
const probe = sortEvents([{ ...sole, id: 'undated', date: null }, { ...sole, id: 'late', date: '2026-11-20' }, { ...sole, id: 'early', date: '2026-11-02' }]);
check('the calendar sorts confirmed dates first, soonest at the top',
  probe.map((e) => e.id).join(' ') === 'early late undated',
  probe.map((e) => `${e.id}${e.date ? ` (${e.date})` : ''}`).join(' → '));
const sortedAll = sortEvents(EVENTS);
check('sorting does not drop or duplicate an entry',
  sortedAll.length === EVENTS.length && new Set(sortedAll.map((e) => e.id)).size === EVENTS.length,
  `${sortedAll.length} rows`);

// the register action must never promise more than it does
const labels = new Set(EVENTS.map(registrationLabel));
check('the action label matches the registration state',
  EVENTS.every((e) =>
    e.registration.state === 'closed' ? registrationLabel(e) === 'Registration closed'
      : e.registration.state === 'open' ? registrationLabel(e) === 'Register'
        : registrationLabel(e) === 'Register interest'),
  [...labels].join(' / '));
check('a closed event is not offered as open', EVENTS.every((e) => e.registration.state !== 'closed' || e.registration.url === null || e.registration.url.startsWith('https://')));

// ---------------------------------------------------------------- 2. the registration path

console.log('\n2. a registration can actually reach the chapter\n');

const empty = validateRegistration(EMPTY_DRAFT);
check('an empty form is refused', hasErrors(empty) && !!empty.name && !!empty.email && !!empty.year && !!empty.consent,
  Object.keys(empty).join(', '));
check('a filled form is accepted', !hasErrors(validateRegistration(GOOD)), Object.keys(validateRegistration(GOOD)).join(', ') || 'no errors');

const bad = [
  { ...GOOD, email: 'student@vce' },
  { ...GOOD, email: 'student.vce.ac.in' },
  { ...GOOD, name: '7' },
  { ...GOOD, name: 'A' },
  { ...GOOD, phone: '12345' },
  { ...GOOD, department: 'Astrology' },
  { ...GOOD, year: '5th year' },
  { ...GOOD, notes: 'x'.repeat(501) },
  { ...GOOD, consent: false },
];
const wronglyAccepted = bad.filter((d) => !hasErrors(validateRegistration(d)));
check('bad input is refused field by field', wronglyAccepted.length === 0,
  wronglyAccepted.length ? `${wronglyAccepted.length} accepted` : `${bad.length} rejected drafts`);

const shorts = ['student+acm@vce.ac.in', 'a.b@sub.domain.edu', 'someone@college.ac.in'];
check('ordinary college addresses pass', shorts.every((email) => !validateRegistration({ ...GOOD, email }).email), shorts.join(', '));
check('an optional phone may be left blank', !validateRegistration({ ...GOOD, phone: '' }).phone);

const payload = registrationPayload(EVENTS[2], GOOD, STAMP);
check('the payload is flat strings, ready for any endpoint',
  Object.values(payload).every((v) => typeof v === 'string'),
  `${Object.keys(payload).length} fields`);
check('the payload identifies the event, not just the person',
  payload.eventId === EVENTS[2].id && payload.event === EVENTS[2].title && payload.track === EVENTS[2].track);
check('the payload carries what the organisers need',
  ['name', 'email', 'department', 'year', 'consent', 'submittedAt'].every((k) => payload[k] && payload[k].length > 0));
const EXPECTED = ['kind', 'eventId', 'event', 'track', 'series', 'when', 'name', 'email', 'phone', 'collegeId', 'department', 'year', 'team', 'notes', 'consent', 'submittedAt'];
const dropped = EXPECTED.filter((k) => !(k in payload));
const extra = Object.keys(payload).filter((k) => !EXPECTED.includes(k));
check('no field of the form is silently dropped', dropped.length === 0 && extra.length === 0,
  dropped.length ? `missing ${dropped.join(', ')}` : extra.length ? `unexpected ${extra.join(', ')}` : `${EXPECTED.length} fields accounted for`);

// the fallback: the chapter's mailbox, with the whole registration already written
const mail = registrationMailto(REGISTRATION.email as string, EVENTS[2], GOOD, STAMP);
check('the fallback is a real mailto to the chapter', mail.startsWith(`mailto:${REGISTRATION.email}?subject=`), mail.slice(0, 46));
check('the fallback subject names the event', decodeURIComponent(mail).includes(`Registration — ${EVENTS[2].title}`));
const body = decodeURIComponent(mail.split('&body=')[1] ?? '');
check('the fallback body carries every answer',
  ['A Student', 'student@vce.ac.in', '98765', '1602-21-733-001', GOOD.department, GOOD.year, 'Null Pointer Exception', 'after 4pm']
    .every((v) => body.includes(v)),
  body.split('\n').length + ' lines');
check('the fallback leaves no raw newline in the URL', !/[\r\n]/.test(mail));

check('the channel is the one the dialog advertises',
  registrationChannel() === (REGISTRATION.formId ? 'form' : REGISTRATION.endpoint ? 'endpoint' : 'email'),
  registrationChannel());
check('with nothing configured there is still an address to register to',
  registrationChannel() !== 'email' || (!!REGISTRATION.email && REGISTRATION.email.includes('@')),
  `${REGISTRATION.email}`);
check('a configured form id produces an embed url and nothing else does',
  REGISTRATION.embedUrl('abc123') === 'https://tally.so/embed/abc123?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1' &&
  REGISTRATION.embedUrl(null) === null);

// ---------------------------------------------------------------- 3. the section wiring

console.log('\n3. the section is wired to it\n');

const events = read('src/components/Events.tsx');
const calendar = read('src/components/EventCalendar.tsx');
const dialog = read('src/components/RegistrationDialog.tsx');
const css = read('src/index.css');

check('the events section mounts the calendar', events.includes("import EventCalendar from './EventCalendar'") && events.includes('<EventCalendar />'));
check('the calendar renders one row per event', calendar.includes('EVENTS') && calendar.includes('ec-row'));
check('the calendar opens the registration dialog', calendar.includes('<RegistrationDialog') && calendar.includes('setRegistering'));
check('the dialog is wired to the field rules', dialog.includes('validateRegistration') && dialog.includes('hasErrors'));
check('the dialog serves all three channels', dialog.includes("channel === 'form'") && dialog.includes("channel === 'endpoint'") && dialog.includes("channel === 'email'"));
check('the dialog posts to the endpoint when one exists', dialog.includes('sendRegistration(REGISTRATION.endpoint'));
check('the dialog falls back to the mailbox', dialog.includes('registrationMailto(REGISTRATION.email'));
check('the dialog can be closed by keyboard', dialog.includes("e.key === 'Escape'") && dialog.includes('aria-modal'));
check('every field is labelled and every error is announced',
  dialog.includes('aria-invalid') && dialog.includes('role="alert"') && (dialog.match(/<Field /g) ?? []).length >= 7);
for (const cls of ['.ec-row', '.ec-cta', '.reg-dialog', '.reg-form', '.reg-btn-solid', '.ec-date']) {
  check(`the stylesheet defines ${cls}`, css.includes(`${cls} {`));
}

// ---------------------------------------------------------------- 4. faculty portraits

console.log('\n4. every faculty member has a portrait slot\n');

const people = [...FACULTY.people, ...FACULTY.departments];
check('each person has a photo slot', people.every((p) => 'photo' in p), `${people.length} people`);
check('each person has a role and a name', people.every((p) => p.role.length > 1 && p.name.length > 1));

const missing = people.filter((p) => p.photo && !existsSync(at(`public/${p.photo}`)));
check('a photo path that is set points at a file that exists', missing.length === 0,
  missing.length ? missing.map((p) => p.photo).join(', ') : `${people.filter((p) => p.photo).length} photos, ${people.filter((p) => !p.photo).length} placeholders`);

check('the advisor and coordinator are roles without invented names',
  FACULTY.people.every((p) => /^to be/i.test(p.name)),
  FACULTY.people.map((p) => `${p.role}: ${p.name}`).join(' · '));

const heads = FACULTY.departments;
check('the department heads are the two the college publishes',
  heads.length === 2 &&
  heads.some((h) => h.name.includes('Nagaratna') && h.department === 'Computer Science and Engineering') &&
  heads.some((h) => h.name.includes('Ram Mohan Rao') && h.department === 'Information Technology'),
  heads.map((h) => h.name).join(' · '));
check('their profile links point at the college', heads.every((h) => (h.profile ?? '').startsWith('https://vce.ac.in/')));
check('they are labelled as departments, not as chapter office bearers',
  heads.every((h) => h.role === 'Head of Department') && FACULTY.groups.departments.includes('Departments'),
  FACULTY.groups.departments);

const section = read('src/components/FacultySection.tsx');
check('the section renders a portrait slot per person', section.includes('fac-portrait') && section.includes('FACULTY.people') && section.includes('FACULTY.departments'));
check('a missing photo falls back to initials rather than a stand-in face',
  section.includes('fac-initials') && section.includes('initialsOf') && !/unsplash|placeholder\.com|pravatar|randomuser/i.test(section));
check('the section says where a photo goes', FACULTY.photoNote.includes('public/media/faculty/'));

console.log(`\n${failures === 0 ? 'PASS — the calendar, its registrations and the faculty slots all hold up' : `FAIL — ${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);

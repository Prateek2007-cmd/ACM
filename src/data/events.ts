/**
 * The chapter's calendar, and how a registration gets back to the organisers.
 *
 * House rule, same as the rest of this site: nothing here is invented. Every entry below is an
 * instance of a track the chapter already publishes in `PROGRAMMES` (see content.ts) — the dates,
 * venues and seat counts are the chapter's to confirm, so they are `null` until they are, and the
 * UI says "Date to be announced" rather than showing a date nobody confirmed.
 *
 *   ── To publish a dated event, fill in `date` (and `venue`/`seats`) on an entry below. ──
 *
 * That is the whole edit: the calendar, the "next up" line and the registration dialog all read
 * from this array, so a confirmed date appears everywhere at once.
 */

import { BRAND, CONTACT } from './brand';

/** The four words the chapter already organises its activity around. */
export type Track = 'Learn' | 'Build' | 'Share' | 'Compete';

/** Accent per track — same palette the programme cards use. */
export const TRACK_ACCENT: Record<Track, 'blue' | 'amber' | 'red'> = {
  Learn: 'blue',
  Build: 'amber',
  Share: 'blue',
  Compete: 'red',
};

/** Where a registration for an event stands. */
export type RegistrationState =
  /** The chapter is taking registrations. */
  | 'open'
  /** The date is not fixed yet, so the chapter is collecting interest and will follow up. */
  | 'interest'
  /** The event is full or past its deadline. */
  | 'closed';

export type EventEntry = {
  id: string;
  title: string;
  track: Track;
  /** Which published programme track this instance belongs to. */
  series: string;
  blurb: string;
  /** What a participant leaves with — the reason to show up. */
  outcome: string;
  /** ISO `YYYY-MM-DD` once the chapter confirms it. `null` = not confirmed yet. */
  date: string | null;
  /** Shown while `date` is null, e.g. 'Second week of November'. `null` = nothing published. */
  window: string | null;
  time: string | null;
  /** `null` = the chapter announces it with the date. */
  venue: string | null;
  mode: 'On campus' | 'Online' | 'Hybrid';
  /** e.g. '40 seats'. `null` = not published. */
  seats: string | null;
  registration: {
    state: RegistrationState;
    /** A registration form for this specific event, when the chapter has one. */
    url: string | null;
  };
};

/**
 * This term's calendar. Every entry is a planned instance of a track the chapter runs; the ones
 * without a date are waiting on the chapter, and say so.
 */
export const EVENTS: EventEntry[] = [
  {
    id: 'orientation',
    title: 'Chapter orientation & member sign-up',
    track: 'Learn',
    series: 'Hands-on workshops',
    blurb:
      'What the chapter is, what the year looks like, and how to get on the inside of it: the four tracks, the study circles, and who to ask for what.',
    outcome: 'A chapter membership, a study-circle slot and the calendar for the term.',
    date: null,
    window: null,
    time: null,
    venue: null,
    mode: 'On campus',
    seats: null,
    registration: { state: 'interest', url: null },
  },
  {
    id: 'web-workshop',
    title: 'Building and shipping your first web app',
    track: 'Learn',
    series: 'Hands-on workshops',
    blurb:
      'A lab, not a lecture: version control, a UI, a little API, and a deployment. Everyone leaves with something that has a URL.',
    outcome: 'A deployed app of your own, and the tooling to keep building on it.',
    date: null,
    window: null,
    time: null,
    venue: null,
    mode: 'On campus',
    seats: null,
    registration: { state: 'interest', url: null },
  },
  {
    id: 'build-sprint',
    title: 'Build sprint: one weekend, one working prototype',
    track: 'Build',
    series: 'Hackathons & build sprints',
    blurb:
      'The flagship event. A brief at the start, teams of three to four, mentors on the floor, and a demo in front of everybody at the end.',
    outcome: 'A working prototype, a team, and a demo you can talk through.',
    date: null,
    window: null,
    time: null,
    venue: null,
    mode: 'On campus',
    seats: null,
    registration: { state: 'interest', url: null },
  },
  {
    id: 'industry-talk',
    title: 'Tech talk: from campus project to production',
    track: 'Share',
    series: 'Tech talks & industry sessions',
    blurb:
      'Engineers and alumni walk through the work as it actually is — the tooling, the reviews, the parts that break — followed by an open floor.',
    outcome: 'A realistic picture of the roles, and answers to your own questions.',
    date: null,
    window: null,
    time: null,
    venue: null,
    mode: 'Hybrid',
    seats: null,
    registration: { state: 'interest', url: null },
  },
  {
    id: 'contest-night',
    title: 'Contest night: timed problem solving',
    track: 'Compete',
    series: 'Contests & competitive programming',
    blurb:
      'A ranked set of problems against the clock, then a walkthrough of the approaches that worked and the ones that did not.',
    outcome: 'Sharper algorithmic fluency, and a team practice habit for inter-college contests.',
    date: null,
    window: null,
    time: null,
    venue: null,
    mode: 'On campus',
    seats: null,
    registration: { state: 'interest', url: null },
  },
  {
    id: 'study-circle',
    title: 'Data structures study circle',
    track: 'Learn',
    series: 'Career and peer learning',
    blurb:
      'A recurring circle that works through data structures and algorithms at a pace that survives a semester — one topic, whiteboard first, then code.',
    outcome: 'A study group that keeps going after the first enthusiasm wears off.',
    date: null,
    window: null,
    time: null,
    venue: null,
    mode: 'On campus',
    seats: null,
    registration: { state: 'interest', url: null },
  },
];

/** The one-line explanation shown above the calendar. */
export const EVENT_NOTE =
  'The chapter’s own calendar. Dates and venues are announced by the chapter, so an entry without one says so instead of showing a date we cannot confirm — register and the details come to you when they are fixed.';

/** Copy for the pending-date slot, kept in one place so the UI and the checks agree. */
export const DATE_TBA = 'Date to be announced';
export const VENUE_TBA = 'Venue to be announced';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format an ISO date without a Date object, so it renders identically on the server and the client. */
export function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** The date line a card shows: the confirmed date, the window, or "Date to be announced". */
export function whenLabel(e: EventEntry): string {
  if (e.date) return `${formatEventDate(e.date)}${e.time ? ` · ${e.time}` : ''}`;
  return e.window ?? DATE_TBA;
}

/** Day / month fragments for the calendar's date block; both null when nothing is confirmed. */
export function dateParts(e: EventEntry): { day: string | null; month: string | null } {
  if (!e.date) return { day: null, month: null };
  const [, m, d] = e.date.split('-');
  return { day: d ?? null, month: m ? MONTHS[Number(m) - 1] ?? null : null };
}

/** The label on the action button, which is honest about what the click does. */
export function registrationLabel(e: EventEntry): string {
  if (e.registration.state === 'closed') return 'Registration closed';
  if (e.registration.state === 'open') return 'Register';
  return 'Register interest';
}

/** Confirmed dates first (soonest at the top), then everything still being planned. */
export function sortEvents(list: EventEntry[] = EVENTS): EventEntry[] {
  return [...list].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

/** How many entries carry a confirmed date — reported by the section, and checked by the scripts. */
export const CONFIRMED_COUNT = EVENTS.filter((e) => e.date !== null).length;

/**
 * Where a registration goes.
 *
 * A static site cannot receive a post on its own, so the dialog has three real paths, in order:
 *   1. `formId`   — an embedded hosted form (Tally). Nothing to store, nothing to leak. Set
 *                   VITE_TALLY_FORM_ID and in-page registrations start landing in the chapter's
 *                   form inbox.
 *   2. `endpoint` — any URL that accepts a JSON post (the chapter's own function, or the same
 *                   form provider's API). Set VITE_REGISTRATION_ENDPOINT.
 *   3. `email`    — with neither configured the dialog hands the registration to the chapter's
 *                   mailbox, prefilled, so a student can still register today.
 *
 * The env values are read through a guard because this module is also imported by the check
 * scripts, which run outside Vite.
 */
const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {});

export const REGISTRATION = {
  formId: env.VITE_TALLY_FORM_ID ?? null,
  endpoint: env.VITE_REGISTRATION_ENDPOINT ?? null,
  email: CONTACT.email,
  /** Tally's embed URL for a form id, or null when no form is configured. */
  embedUrl(id: string | null): string | null {
    return id ? `https://tally.so/embed/${id}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1` : null;
  },
} as const;

/** Which of the three paths the dialog will use — the one honest source of truth for the UI. */
export type RegistrationChannel = 'form' | 'endpoint' | 'email';

export function registrationChannel(): RegistrationChannel {
  if (REGISTRATION.formId) return 'form';
  if (REGISTRATION.endpoint) return 'endpoint';
  return 'email';
}

/** Where the "ask the chapter" links point, and the label the UI shows for it. */
export const CHAPTER = {
  chapter: BRAND.chapter,
  college: BRAND.college,
} as const;

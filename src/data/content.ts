import { BRAND } from './brand';

/**
 * All chapter copy. Only verified facts are stated as facts; anything unconfirmed is
 * explicitly marked as coming soon rather than invented.
 */

export const ABOUT = {
  eyebrow: 'Who we are',
  title: 'A student chapter of the world’s largest computing society.',
  lede: 'The ACM Student Chapter at Vasavi College of Engineering brings students together to learn computing by doing it — writing code, presenting work, debating ideas and shipping things that run.',
  body: [
    'The chapter is part of the Association for Computing Machinery, the society that has advanced computing as a science and a profession since 1947 and describes itself as the world’s largest educational and scientific computing society.',
    'We operate as a peer-run community inside Vasavi College of Engineering, Hyderabad. Members come from the Computer Science and Information Technology departments and from any batch curious enough to build something.',
    'Our calendar is built around workshops, hackathons, technical talks, contests, reading groups and open-source contribution — the parts of a computing education that a syllabus cannot fit.',
  ],
  /** The chapter's operating layers, mirroring the reference site's stack motif. */
  layers: [
    { name: 'Learn', role: 'Foundations', detail: 'Structured peer study circles on programming, data structures, systems and mathematics.' },
    { name: 'Build', role: 'Practice', detail: 'Team projects, open-source contribution and hands-on labs that end in working software.' },
    { name: 'Share', role: 'Community', detail: 'Tech talks, paper presentations and demos where members explain their own work.' },
    { name: 'Compete', role: 'Benchmarks', detail: 'Hackathons and competitive programming contests, in teams and under time pressure.' },
    { name: 'Explore', role: 'Frontier', detail: 'AI, cyber security, cloud and emerging areas, studied together rather than alone.' },
    { name: 'Connect', role: 'Industry', detail: 'Sessions with engineers, researchers and alumni on what the work actually looks like.' },
  ],
};

export const MANIFESTO_TEXT = `${BRAND.chapter} at ${BRAND.college} exists for one reason: a computing degree should end with things you have built, explained and defended — not only exams you have passed. So we run workshops, hackathons and study circles where the work is real, the code is reviewed, and every member gets a turn at the front of the room.`;

export const DOMAINS = [
  {
    name: 'Technical workshops',
    text: 'Hands-on, lab-style sessions on programming, web engineering, data, cloud and AI — taught by members for members, with code that runs by the end of the hour.',
  },
  {
    name: 'Hackathons and build sprints',
    text: 'Time-boxed team sprints where the goal is a working prototype: framing the problem, splitting the work, integrating, demoing and taking the critique.',
  },
  {
    name: 'Tech talks and industry sessions',
    text: 'Talks and panels with working engineers, researchers and alumni on the areas of computing that move fastest and the roles that follow them.',
  },
  {
    name: 'Projects and open source',
    text: 'Chapter projects and open-source contribution with version control, review, testing and documentation treated as part of the work rather than an afterthought.',
  },
  {
    name: 'Research and paper reading',
    text: 'Reading groups and paper presentations that get students comfortable with the literature, plus guidance for writing a first technical paper.',
  },
  {
    name: 'Career and peer learning',
    text: 'Mock interviews, résumé and portfolio reviews, mentoring chains across batches, and study circles across the Computer Science and IT departments.',
  },
];

/** Programme tracks — categories of activity, not claims about specific dated events. */
export const PROGRAMMES = [
  {
    title: 'Hands-on workshops',
    kind: 'Learn — recurring track',
    line: 'Focused sessions that start at the fundamentals and end with something running on the participant’s machine. Format: short theory, long lab, open questions.',
    stack: ['Programming', 'Web', 'Cloud', 'AI / ML', 'Cyber security'],
    visuals: ['terminal', 'grid', 'bars'] as const,
    accent: 'blue' as const,
  },
  {
    title: 'Hackathons & build sprints',
    kind: 'Build — flagship track',
    line: 'Team-based sprints with a brief, a clock and a demo. Judged on whether the thing works, how well the problem was framed and how clearly it is explained.',
    stack: ['Teams', 'Prototyping', 'Mentoring', 'Demo day'],
    visuals: ['gauges', 'flow', 'globe'] as const,
    accent: 'amber' as const,
  },
  {
    title: 'Tech talks & industry sessions',
    kind: 'Share — open track',
    line: 'Engineers, researchers and alumni talk about the work, the tooling and the trade-offs they handle daily — followed by an open floor for student questions.',
    stack: ['Distinguished speakers', 'Alumni', 'Research', 'Career paths'],
    visuals: ['grid', 'globe', 'terminal'] as const,
    accent: 'blue' as const,
  },
  {
    title: 'Contests & competitive programming',
    kind: 'Compete — ranked track',
    line: 'Timed contests and problem-solving ladders that build algorithmic fluency, plus team practice for inter-college competitions.',
    stack: ['Algorithms', 'Data structures', 'Team contests'],
    visuals: ['bars', 'radar', 'gauges'] as const,
    accent: 'red' as const,
  },
];

/** Verified chapter facts — no invented metrics. */
export const IMPACT = [
  { value: '1947', label: 'ACM founded', note: 'The Association for Computing Machinery has advanced computing as a science and a profession since 1947.' },
  { value: 'World’s largest', label: 'Computing society', note: 'ACM describes itself as the world’s largest educational and scientific computing society.' },
  { value: 'CSE · IT', label: 'Departments', note: 'Open to computing students across the Computer Science and Information Technology departments.' },
  { value: 'Hyderabad', label: 'Chapter location', note: 'Vasavi College of Engineering, 9-5-81, Ibrahimbagh, Hyderabad – 500 031, Telangana.' },
];

/**
 * Faculty.
 *
 * Who sits where, and what is allowed to be claimed:
 *   · the chapter's own advisor and coordinator are not publicly attributed anywhere verifiable, so
 *     the roles are shown and the names stay placeholders — never guessed;
 *   · the two heads of department below are published on the college's own faculty pages, and they
 *     are listed as exactly that — heads of the departments the chapter sits alongside, not as
 *     chapter office bearers.
 *
 * Portraits: every person has a `photo` slot. Drop a square image under `public/media/faculty/` and
 * set `photo` to its path (relative to /public) — it appears immediately. With no photo the card
 * shows the initials on a neutral plate, so a missing picture never looks like a broken one.
 */
export type FacultyPerson = {
  role: string;
  name: string;
  detail: string;
  /** Path relative to /public, or null for the initials placeholder. */
  photo: string | null;
  /** Set for the department leadership below; the chapter's own people have no profile link. */
  department?: string;
  profile?: string | null;
};

export const FACULTY = {
  eyebrow: 'Faculty',
  title: 'Guided by the department,',
  accent: 'mentored by faculty.',
  lead: 'An ACM student chapter works with faculty from its own institution. At Vasavi College of Engineering the chapter sits alongside the Department of Computer Science and Engineering and the Department of Information Technology.',
  note: 'The faculty advisor is the bridge between the students and the department: approving the calendar, opening lab and auditorium access, and keeping the chapter aligned with what ACM expects of a student chapter.',
  people: [
    { role: 'Faculty Advisor', name: 'To be announced', detail: 'Signs off on the chapter’s activities and represents it to the department and to ACM.', photo: null },
    { role: 'Faculty Coordinator', name: 'To be announced', detail: 'Coordinates lab access, scheduling and the academic side of workshops and contests.', photo: null },
  ] as FacultyPerson[],
  /**
   * Heads of the two departments the chapter sits alongside. Names and designations as published
   * on vce.ac.in faculty pages (and the HOD profile pages linked here) — nothing inferred.
   */
  departments: [
    {
      role: 'Head of Department',
      name: 'Dr. Nagaratna P. Hegde',
      department: 'Computer Science and Engineering',
      detail: 'Professor & Head, Department of CSE.',
      photo: null,
      profile: 'https://vce.ac.in/departments/cse/cse-dept-hod-profile.php',
    },
    {
      role: 'Head of Department',
      name: 'Dr. K. Ram Mohan Rao',
      department: 'Information Technology',
      detail: 'Professor & Head, Department of IT.',
      photo: null,
      profile: 'https://vce.ac.in/departments/it/it-dept-hod-profile.php',
    },
  ] as FacultyPerson[],
  groups: {
    chapter: 'Chapter faculty',
    departments: 'Departments the chapter sits alongside',
  },
  photoNote:
    'Portrait slots are in place: add a square photo under public/media/faculty/ and set `photo` on the person in src/data/content.ts. Until a photo exists the card shows their initials — a placeholder, never a stand-in face.',
  sourceNote:
    'Advisor and coordinator: the chapter has not published them, so the roles are shown unnamed. Department heads: names, designations and profile links come from the college’s own pages on vce.ac.in.',
  readout: { label: 'Faculty advisor', value: 'To be announced', status: 'Confirmation pending' },
};

/** Student office bearers are not published yet — shown as roles, never guessed names. */
export const TEAM = {
  core: [
    { role: 'Chairperson', status: 'To be announced' },
    { role: 'Vice Chairperson', status: 'To be announced' },
    { role: 'Secretary', status: 'To be announced' },
    { role: 'Treasurer', status: 'To be announced' },
    { role: 'Technical Lead', status: 'To be announced' },
    { role: 'Events Lead', status: 'To be announced' },
    { role: 'Design & Media Lead', status: 'To be announced' },
    { role: 'Outreach & PR Lead', status: 'To be announced' },
  ],
  note: 'Student office bearers will be listed here as soon as the chapter confirms them. We have not published placeholder names on purpose — and the faculty side of the chapter has its own section above.',
};

export const PILLARS_TEXT =
  'Four things we ask of every member: learn something properly, build something that works, explain it to the room, and compete until the work is sharp.';

export const JOIN = {
  eyebrow: 'Join the chapter',
  title: 'Bring your curiosity. We will bring the brief.',
  accent: 'and the room to build it in.',
  sub: 'Membership is open to students of Vasavi College of Engineering. Tell us what you want to learn or build, and we will point you at the next session, sprint or study circle.',
  note: 'The chapter mailbox and social handles are not published yet, so this is informational for now — reach out through the college when the chapter channels go live.',
};

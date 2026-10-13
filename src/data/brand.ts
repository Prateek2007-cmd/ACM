/**
 * Chapter identity, navigation, chapters and outbound links.
 * Everything here is verified: the chapter exists (listed by ACM), the college address and
 * website come from vce.ac.in, and the ACM links are ACM's own.
 */

export const BRAND = {
  /** Uppercase wordmark used in the navigation and footer. */
  wordmark: 'ACM',
  /** The single place to swap the logo. Drop your file in /public and change this path. */
  logo: 'acm-logo.svg',
  logoAlt: 'ACM — Association for Computing Machinery',
  chapter: 'ACM Student Chapter',
  college: 'Vasavi College of Engineering',
  city: 'Hyderabad',
  region: 'Telangana, India',
  address: '9-5-81, Ibrahimbagh, Hyderabad – 500 031, Telangana, India',
  headline: 'Empowering the Next Generation of Computing Innovators',
  /** The four words the loader cycles through, and the hero's pillar row. */
  pillars: ['Learn', 'Build', 'Share', 'Compete'],
};

export const NAV_ITEMS: { label: string; id: string }[] = [
  { label: 'About', id: 'about' },
  { label: 'Domains', id: 'domains' },
  { label: 'Events', id: 'events' },
  { label: 'Impact', id: 'impact' },
  { label: 'Faculty', id: 'faculty' },
  { label: 'Team', id: 'team' },
  { label: 'Contact', id: 'contact' },
];

/** Right-edge chapter rail. Order must match the order of sections in App.tsx. */
export const CHAPTERS: [string, string][] = [
  ['hero', 'Intro'],
  ['about', 'About'],
  ['domains', 'What we do'],
  ['manifesto', 'Statement'],
  ['events', 'Programmes'],
  ['impact', 'Chapter'],
  ['faculty', 'Faculty'],
  ['team', 'Team'],
  ['gallery', 'Fields'],
  ['join', 'Join'],
  ['contact', 'Contact'],
];

/** Official, verified destinations (no invented handles). */
export const EXTERNAL = {
  acm: 'https://www.acm.org/',
  acmAbout: 'https://www.acm.org/about-acm',
  acmIndia: 'https://india.acm.org/',
  vce: 'https://vce.ac.in/',
  vceActivities: 'https://vce.ac.in/campus-life/extra-curricular-activities.php',
};

/**
 * Details that are NOT published anywhere verifiable. They are shown as "Coming soon"
 * instead of being invented. Replace the values here once the chapter confirms them.
 */
export const PENDING = {
  email: null as string | null,
  facultyAdvisor: null as string | null,
  instagram: null as string | null,
  linkedin: null as string | null,
};

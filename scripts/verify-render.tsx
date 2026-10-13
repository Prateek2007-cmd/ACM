/**
 * Renders the whole app tree once (React server render) and asserts the chapter content,
 * the section wiring and the logo actually make it into the markup.
 *
 *   bun run scripts/verify-render.tsx
 *
 * This catches broken imports, bad data wiring and JSX errors without a browser. Effects do not
 * run on the server, so it does not exercise animation or scroll behaviour.
 */

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${name}${detail ? `  — ${detail}` : ''}`);
};

// Minimal browser surface for the modules that read it at import time (store.ts).
const noop = () => {};
const mql = { matches: false, media: '', addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop, dispatchEvent: noop, onchange: null };
const g = globalThis as unknown as Record<string, unknown>;
g.window = {
  innerWidth: 1440, innerHeight: 900, scrollY: 0,
  matchMedia: () => mql,
  addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, scrollTo: noop,
  localStorage: { getItem: () => null, setItem: noop },
};
g.document = {
  documentElement: { classList: { contains: () => false, add: noop, remove: noop, toggle: noop } },
  body: { classList: { add: noop, remove: noop } },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: noop, removeEventListener: noop, dispatchEvent: noop,
  createElement: () => ({ style: {}, classList: { add: noop }, getContext: () => null, setAttribute: noop, appendChild: noop, remove: noop }),
  fonts: { ready: Promise.resolve() },
};

const { renderToStaticMarkup } = await import('react-dom/server');
const { default: App } = await import('../src/App.tsx');

let html = '';
try {
  html = renderToStaticMarkup(<App />);
} catch (err) {
  check('app renders without throwing', false, (err as Error).message);
  console.log(`\nFAIL — render threw\n`);
  process.exit(1);
}

console.log('\n1. the tree renders\n');
check('app renders without throwing', html.length > 5000, `${html.length} chars of markup`);

console.log('\n2. required copy is present\n');
const copy = [
  'Empowering the',
  'Next Generation of',
  'Computing Innovators',
  'ACM Student Chapter',
  'Vasavi College of Engineering',
  'Hyderabad',
  'Learn',
  'Build',
  'Share',
  'Compete',
];
for (const phrase of copy) check(`copy: “${phrase}”`, html.includes(phrase));

console.log('\n3. branding and the liquid intro\n');
check('the ACM logo asset is used', html.includes('acm-logo.svg'));
check('the logo is labelled on the nav mark', html.includes('Association for Computing Machinery'));
check('the liquid monogram stage is mounted', html.includes('ig-liquid'));
check('the monogram has an accessible label', html.includes('morphing between the letters A, C and M'));
check('the loader keeps its bezel ticks', (html.match(/ig-tick/g) ?? []).length > 60, `${(html.match(/ig-tick/g) ?? []).length} ticks`);
check('no photograph is used anywhere', !/<img[^>]+(photos\/|\.webp")/.test(html.replace(/smoke-blue\.webp/g, '')));

console.log('\n4. every chapter section is wired\n');
for (const id of ['hero', 'about', 'domains', 'manifesto', 'events', 'impact', 'faculty', 'team', 'gallery', 'join', 'contact']) {
  check(`section #${id}`, html.includes(`id="${id}"`));
}

console.log('\n4b. the hero cannot collide with the navigation\n');
// Each headline line is its own block element, so the hero is exactly three lines as long as
// no line wraps — which is what the CSS measure is sized for. A fourth line is what pushed the
// lockup up under the fixed nav before.
const heroHtml = html.slice(html.indexOf('id="hero"'), html.indexOf('id="about"'));
const lines = heroHtml.match(/class="hc-line"/g) ?? [];
check('the hero headline is exactly three block lines', lines.length === 3, `${lines.length} lines`);
for (const phrase of ['Empowering the', 'Next Generation of', 'Computing Innovators']) {
  check(`headline line: “${phrase}”`, heroHtml.includes(phrase));
}
check('the lockup carries the brand mark', heroHtml.includes('hc-brand') && heroHtml.includes('acm-logo.svg'));

console.log('\n4c. the faculty section and the loader track\n');
for (const phrase of ['Guided by the department', 'mentored by faculty', 'Faculty Advisor', 'Faculty Coordinator', 'CHAPTER NETWORK']) {
  check(`faculty copy: “${phrase}”`, html.includes(phrase));
}
check('faculty has the dim base layer', html.includes('fac-base'));
check('faculty has the lit layer the scan wipes in', html.includes('fac-lit'));
check('faculty has the scan line', html.includes('fac-line'));
check('the loader shows an A · C · M track', html.includes('ig-letters') && ['A', 'C', 'M'].every((c) => new RegExp(`<span>${c}</span>`).test(html)));

console.log('\n5. nothing from the original portfolio survives\n');
const leaked = ['Vijaya', 'risewithvj', 'CIEL', 'Bengaluru', 'trendit', 'portfolioData'];
for (const token of leaked) check(`no “${token}”`, !html.includes(token));

console.log(`\n${failures === 0 ? 'PASS — all render checks passed' : `FAIL — ${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);

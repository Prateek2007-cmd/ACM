import { useEffect, useState } from 'react';

const WORDS = ['student-run', 'peer-taught', 'hands-on', 'open to all'];

/** "A {word} chapter…" — the word swaps every 2s with a soft rise. */
export default function RotatingRole() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="role-line">
      A <span key={i} className="role-word font-serif-italic">{WORDS[i]}</span> chapter for people who would rather build it.
    </span>
  );
}

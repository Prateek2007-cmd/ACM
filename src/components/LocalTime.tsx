import { useEffect, useState } from 'react';

/** Live Hyderabad time — a small human detail in the footer. */
export default function LocalTime() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return <span>Hyderabad · {t.toUpperCase()} IST</span>;
}

/**
 * Code-drawn "screens" for projects — no stock imagery, no third-party assets.
 * `live` enables the looping CSS animations (use only where few are on screen).
 */
export type VisualKind = 'radar' | 'flow' | 'gauges' | 'grid' | 'terminal' | 'bars' | 'globe' | 'shield';

const C = { blue: '#2f7bff', hi: '#8ab8ff', red: '#ff2a1f', amber: '#f5b83d', ink: '#05070c' };

export default function Visual({ kind, accent = 'blue', live = false, label }: { kind: VisualKind; accent?: 'blue' | 'red' | 'amber'; live?: boolean; label?: string }) {
  const a = C[accent];
  const cls = `viz ${live ? 'viz-live' : ''}`;
  return (
    <div className={cls} aria-hidden="true">
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`vg-${kind}-${accent}`} cx="50%" cy="50%" r="65%">
            <stop offset="0" stopColor={a} stopOpacity="0.28" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <pattern id="vgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity="0.05" />
          </pattern>
        </defs>
        <rect width="400" height="260" fill={C.ink} />
        <rect width="400" height="260" fill="url(#vgrid)" />
        <rect width="400" height="260" fill={`url(#vg-${kind}-${accent})`} />
        {kind === 'radar' && (
          <g transform="translate(200 130)">
            {[40, 75, 110].map((r) => <circle key={r} r={r} fill="none" stroke={a} strokeOpacity="0.35" />)}
            <line x1="-120" y1="0" x2="120" y2="0" stroke={a} strokeOpacity="0.2" />
            <line x1="0" y1="-120" x2="0" y2="120" stroke={a} strokeOpacity="0.2" />
            <g className="viz-spin"><path d="M0 0 L110 0 A110 110 0 0 0 78 -78 Z" fill={a} fillOpacity="0.22" /></g>
            {[[60, -30], [-80, 40], [30, 70], [-40, -85], [95, 55]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" fill={C.red} className="viz-blink" style={{ animationDelay: `${i * 0.4}s` }} />
            ))}
            <circle r="6" fill={C.hi} />
          </g>
        )}
        {kind === 'flow' && (
          <g>
            {[40, 85, 130, 175, 220].map((y, i) => (
              <g key={y}>
                <rect x="18" y={y - 12} width="80" height="24" rx="12" fill="#0b1224" stroke={a} strokeOpacity="0.5" />
                <path d={`M98 ${y} C 170 ${y}, 170 130, 230 130`} fill="none" stroke={a} strokeOpacity="0.45" className="viz-dash" style={{ animationDelay: `${i * 0.2}s` }} />
              </g>
            ))}
            <rect x="230" y="104" width="70" height="52" rx="12" fill={a} fillOpacity="0.18" stroke={a} />
            {[70, 130, 190].map((y) => (
              <g key={y}>
                <path d={`M300 130 C 330 130, 330 ${y}, 350 ${y}`} fill="none" stroke={a} strokeOpacity="0.45" className="viz-dash" />
                <circle cx="362" cy={y} r="10" fill="#0b1224" stroke={a} />
              </g>
            ))}
          </g>
        )}
        {kind === 'gauges' && (
          <g>
            {[[100, 130, 0.72], [210, 130, 0.45], [310, 130, 0.9]].map(([x, y, v], i) => {
              const r = i === 1 ? 62 : 44;
              const len = Math.PI * r;
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <path d={`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0`} fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="10" strokeLinecap="round" />
                  <path d={`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0`} fill="none" stroke={i === 2 ? C.amber : a} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${len * (v as number)} ${len}`} className="viz-grow" />
                  <text y="22" textAnchor="middle" fill="#fff" fillOpacity="0.8" fontSize="14" fontFamily="Geist Mono, monospace">{Math.round((v as number) * 100)}%</text>
                </g>
              );
            })}
          </g>
        )}
        {kind === 'grid' && (
          <g>
            {Array.from({ length: 8 }, (_, i) => {
              const x = 20 + (i % 4) * 92, y = 28 + Math.floor(i / 4) * 110;
              return (
                <g key={i} className="viz-rise" style={{ animationDelay: `${i * 0.12}s` }}>
                  <rect x={x} y={y} width="80" height="96" rx="10" fill="#0b1224" stroke="#fff" strokeOpacity="0.1" />
                  <rect x={x + 10} y={y + 12} width="60" height="34" rx="6" fill={a} fillOpacity={0.15 + (i % 3) * 0.1} />
                  <rect x={x + 10} y={y + 56} width="50" height="5" rx="2" fill="#fff" fillOpacity="0.5" />
                  <rect x={x + 10} y={y + 68} width="36" height="5" rx="2" fill="#fff" fillOpacity="0.25" />
                  {[0, 1, 2, 3, 4].map((s) => <circle key={s} cx={x + 14 + s * 9} cy={y + 84} r="3" fill={s < 4 ? C.amber : '#333'} />)}
                </g>
              );
            })}
          </g>
        )}
        {kind === 'terminal' && (
          <g fontFamily="Geist Mono, monospace" fontSize="12">
            <rect x="20" y="20" width="360" height="220" rx="12" fill="#070a12" stroke="#fff" strokeOpacity="0.1" />
            {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => <circle key={c} cx={40 + i * 16} cy="38" r="5" fill={c} />)}
            {[
              ['$ docker compose up -d', '#fff'],
              ['✓ postgres   healthy', a],
              ['✓ poller     running', a],
              ['✓ alerts     armed', a],
              ['→ incidents clustered', C.hi],
              ['→ weekly digest queued', C.hi],
            ].map(([t, c], i) => (
              <text key={i} x="36" y={70 + i * 26} fill={c} fillOpacity="0.9" className="viz-type" style={{ animationDelay: `${i * 0.35}s` }}>{t}</text>
            ))}
            <rect x="36" y="222" width="8" height="12" fill={a} className="viz-blink" />
          </g>
        )}
        {kind === 'bars' && (
          <g>
            {Array.from({ length: 16 }, (_, i) => {
              const h = 30 + ((i * 53) % 150);
              return <rect key={i} x={24 + i * 23} y={230 - h} width="14" height={h} rx="3" fill={a} fillOpacity={0.25 + (h / 180) * 0.6} className="viz-bar" style={{ animationDelay: `${i * 0.06}s` }} />;
            })}
            <path d="M24 150 C 90 120, 140 170, 200 110 S 320 60, 380 80" fill="none" stroke={C.hi} strokeWidth="2" />
          </g>
        )}
        {kind === 'globe' && (
          <g transform="translate(200 130)">
            <circle r="95" fill="none" stroke={a} strokeOpacity="0.5" />
            {[20, 45, 70].map((rx) => <ellipse key={rx} rx={rx} ry="95" fill="none" stroke={a} strokeOpacity="0.25" />)}
            {[-60, -20, 20, 60].map((y) => <line key={y} x1={-Math.sqrt(95 * 95 - y * y)} y1={y} x2={Math.sqrt(95 * 95 - y * y)} y2={y} stroke={a} strokeOpacity="0.25" />)}
            {[[-40, -50], [55, -20], [10, 60], [-70, 20], [70, 45], [-10, -80], [30, 10], [-50, 70], [80, -60]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" fill={C.hi} className="viz-blink" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </g>
        )}
        {kind === 'shield' && (
          <g transform="translate(200 130)">
            <path d="M0 -95 L78 -62 L70 30 Q 50 80 0 100 Q -50 80 -70 30 L -78 -62 Z" fill={a} fillOpacity="0.1" stroke={a} strokeWidth="2" />
            <path d="M-28 5 L -6 27 L 34 -20" fill="none" stroke={C.hi} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            {[130, 150, 170].map((r, i) => <circle key={r} r={r} fill="none" stroke={a} strokeOpacity={0.2 - i * 0.05} className="viz-pulse" style={{ animationDelay: `${i * 0.5}s` }} />)}
          </g>
        )}
        {label && (
          <text x="20" y="246" fill="#fff" fillOpacity="0.55" fontSize="11" fontFamily="Geist Mono, monospace" letterSpacing="1.5">{label}</text>
        )}
      </svg>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/store';

/**
 * The chapter's glass mark — the ACM letterforms sculpted inside a flowing ring of glass, with
 * refraction lines, trapped bubbles and a few moving glints.
 *
 * This is the design the chapter supplied, ported as-is: every gradient stop, path, bubble and
 * spark is the supplied artwork, with the ids namespaced (`lgm-`) so nothing collides with the
 * site's other SVG defs. The pointer tilt is the supplied behaviour, wired to the project's
 * reduced-motion flag instead of its own media listener.
 *
 * It runs in the loader (see LoadingScreen), where it forms the moment the site opens.
 */
export default function LiquidGlassMark({ className = '' }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const svg = el.querySelector<SVGSVGElement>('svg');

    // reduced motion: freeze the SMIL animations and drop the tilt entirely
    if (reducedMotion) {
      svg?.pauseAnimations();
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      return;
    }
    svg?.unpauseAnimations();

    // the tilt follows a fine pointer only — on a touch screen there is no hover to follow
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.setProperty('--rx', `${-y * 12}deg`);
      el.style.setProperty('--ry', `${x * 12}deg`);
    };
    const reset = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', reset);
    };
  }, []);

  return (
    <div className={`lgm ${className}`.trim()} ref={root}>
      <svg viewBox="0 0 440 440" role="img" aria-labelledby="lgm-title lgm-description">
        <title id="lgm-title">ACM liquid-glass logo</title>
        <desc id="lgm-description">
          Sculpted glass ACM lettering inside a luminous, flowing circular glass frame.
        </desc>

        <defs>
          {/* Alternating bright and dark bands simulate glass reflections. */}
          <linearGradient id="lgm-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#070e17" />
            <stop offset=".12" stopColor="#83baff" />
            <stop offset=".19" stopColor="#f3faff" />
            <stop offset=".24" stopColor="#263b53" />
            <stop offset=".34" stopColor="#060b12" />
            <stop offset=".44" stopColor="#9daec1" />
            <stop offset=".48" stopColor="#ffffff" />
            <stop offset=".53" stopColor="#304d72" />
            <stop offset=".65" stopColor="#07101a" />
            <stop offset=".76" stopColor="#83caff" />
            <stop offset=".81" stopColor="#ffffff" />
            <stop offset=".87" stopColor="#263b53" />
            <stop offset="1" stopColor="#dceeff" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              values="0 .5 .5;360 .5 .5"
              dur="16s"
              repeatCount="indefinite"
            />
          </linearGradient>

          <linearGradient id="lgm-edge" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#319dff" />
            <stop offset=".24" stopColor="#e9f5ff" />
            <stop offset=".45" stopColor="#ffffff" stopOpacity=".1" />
            <stop offset=".65" stopColor="#fff0d9" />
            <stop offset=".84" stopColor="#76b6ff" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>

          <linearGradient id="lgm-shine" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffffff" stopOpacity=".05" />
            <stop offset=".35" stopColor="#ffffff" stopOpacity=".85" />
            <stop offset=".5" stopColor="#ffffff" stopOpacity="0" />
            <stop offset=".72" stopColor="#b9e0ff" stopOpacity=".95" />
            <stop offset="1" stopColor="#ffffff" stopOpacity=".1" />
          </linearGradient>

          <radialGradient id="lgm-interior">
            <stop stopColor="#020407" stopOpacity=".1" />
            <stop offset=".78" stopColor="#06101a" stopOpacity=".12" />
            <stop offset="1" stopColor="#1c3653" stopOpacity=".4" />
          </radialGradient>

          <filter id="lgm-liquid" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency=".012 .018" numOctaves="2" seed="8" result="noise">
              <animate attributeName="baseFrequency" values=".012 .018;.016 .012;.012 .018" dur="12s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id="lgm-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          {/* Original, hand-drawn letter centerlines. */}
          <g id="lgm-letters" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* A */}
            <path
              d="
                M 83 260
                L 120 163
                Q 124 153 129 164
                L 164 260
                M 99 225
                Q 125 217 151 225"
            />
            {/* C */}
            <path
              d="
                M 244 176
                C 224 149 179 157 177 206
                C 174 252 216 276 245 250"
            />
            {/* M */}
            <path
              d="
                M 276 261
                L 276 166
                Q 276 157 282 167
                L 313 216
                L 345 167
                Q 351 157 351 167
                L 351 261"
            />
          </g>

          {/* Slightly organic outer glass silhouette. */}
          <path
            id="lgm-rim-path"
            d="
              M 220 43
              C 264 37 302 59 332 87
              C 366 119 394 165 389 212
              C 397 258 376 302 342 335
              C 309 370 264 395 218 389
              C 175 397 126 374 94 343
              C 60 311 42 266 48 220
              C 39 174 61 129 91 96
              C 122 62 170 39 220 43 Z"
          />

          <g id="lgm-flow-lines" fill="none">
            <path
              d="
                M 61 192
                C 76 116 109 87 148 92
                C 183 96 180 65 222 62
                C 265 57 278 94 316 93
                C 351 93 374 150 374 191"
            />
            <path
              d="
                M 63 248
                C 83 284 108 265 129 295
                C 154 331 191 305 214 335
                C 246 370 278 329 304 329
                C 341 330 367 287 372 248"
            />
            <path
              d="
                M 92 321
                C 134 333 125 359 177 367
                C 226 379 242 344 276 350
                C 310 354 338 317 351 295"
            />
            <path
              d="
                M 90 140
                C 108 127 126 135 138 115
                C 151 94 175 109 192 94
                C 215 72 243 105 269 88"
            />
          </g>
        </defs>

        {/* Dark transparent-looking center. */}
        <circle cx="220" cy="220" r="173" fill="url(#lgm-interior)" />

        {/* Glass rim: depth, reflective body, bevel, hairline highlight. */}
        <g className="lgm-rim" fill="none" filter="url(#lgm-liquid)">
          <use href="#lgm-rim-path" stroke="#06111e" strokeWidth="23" />
          <use href="#lgm-rim-path" stroke="url(#lgm-glass)" strokeWidth="17" />
          <use href="#lgm-rim-path" stroke="url(#lgm-edge)" strokeWidth="8" opacity=".64" />
          <use href="#lgm-rim-path" stroke="#02060c" strokeWidth="4" opacity=".75" />
          <use href="#lgm-rim-path" stroke="url(#lgm-shine)" strokeWidth="1.5" />

          <use href="#lgm-flow-lines" stroke="url(#lgm-glass)" strokeWidth="6" />
          <use href="#lgm-flow-lines" stroke="url(#lgm-shine)" strokeWidth="1.3" />
        </g>

        {/* Finer moving refractions inside the rim. */}
        <g className="lgm-inner-flow" fill="none" opacity=".65">
          <path
            d="
              M 71 216
              C 71 131 139 67 220 69
              S 371 132 369 218
              S 302 371 218 370"
            stroke="url(#lgm-edge)"
            strokeWidth="1.2"
          />
          <path
            d="
              M 80 229
              C 98 269 110 261 126 286
              S 177 319 213 318
              S 268 345 306 307
              S 349 278 360 221"
            stroke="url(#lgm-shine)"
            strokeWidth="2"
          />
        </g>

        {/* Sculpted glass ACM lettering. */}
        <g filter="url(#lgm-liquid)">
          <use href="#lgm-letters" stroke="#000" strokeWidth="29" opacity=".8" transform="translate(0 4)" />
          <use href="#lgm-letters" stroke="#142539" strokeWidth="25" />
          <use href="#lgm-letters" stroke="url(#lgm-glass)" strokeWidth="22" />
          <use href="#lgm-letters" stroke="url(#lgm-edge)" strokeWidth="15" opacity=".7" />
          <use href="#lgm-letters" stroke="#06101b" strokeWidth="9" opacity=".84" />
          <use href="#lgm-letters" stroke="url(#lgm-glass)" strokeWidth="5" />
          <use href="#lgm-letters" stroke="url(#lgm-shine)" strokeWidth="1.5" transform="translate(-2 -3)" />
        </g>

        {/* Small trapped glass bubbles. */}
        <g fill="#b9dfff" fillOpacity=".06" stroke="url(#lgm-edge)" strokeWidth="1.2">
          <circle cx="149" cy="134" r="4" />
          <circle cx="163" cy="119" r="2" />
          <circle cx="274" cy="127" r="4" />
          <circle cx="304" cy="141" r="2.5" />
          <circle cx="255" cy="287" r="5" />
          <circle cx="233" cy="309" r="3.5" />
          <circle cx="151" cy="315" r="5" />
          <circle cx="193" cy="324" r="2" />
          <circle cx="326" cy="282" r="3" />
          <circle cx="76" cy="203" r="3" />
          <circle cx="366" cy="201" r="4" />
        </g>

        {/* Bright animated glints. */}
        <g fill="#e9f6ff">
          <g className="lgm-spark">
            <ellipse cx="304" cy="73" rx="13" ry="3" transform="rotate(30 304 73)" filter="url(#lgm-glow)" />
            <path d="M304 63 Q306 71 314 73 Q306 75 304 83 Q302 75 294 73 Q302 71 304 63" />
          </g>
          <g className="lgm-spark">
            <ellipse cx="102" cy="302" rx="16" ry="4" transform="rotate(30 102 302)" filter="url(#lgm-glow)" />
            <circle cx="102" cy="302" r="2.5" />
          </g>
          <g className="lgm-spark">
            <ellipse cx="249" cy="381" rx="15" ry="2" filter="url(#lgm-glow)" />
            <circle cx="249" cy="381" r="1.8" />
          </g>
        </g>
      </svg>
    </div>
  );
}

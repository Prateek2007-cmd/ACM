import { useEffect, useRef } from 'react';
import { SMOKE, asset } from '../data/media';
import { reducedMotion } from '../lib/store';

interface Props {
  /** Only the blue haze is used on the chapter site (the loader backdrop). */
  color: 'blue';
  className?: string;
  /** play immediately (loader) instead of waiting to scroll into view */
  eager?: boolean;
}

/**
 * Muted, looping smoke video. Loads only when near the screen, plays only while visible,
 * pauses when off-screen or when the tab is hidden. Reduced-motion visitors get the still image
 * (which is also the poster, so nothing jumps while the video starts).
 */
export default function SmokeVideo({ color, className = '', eager = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const m = SMOKE[color];

  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion) return;
    v.muted = true;
    let visible = eager;
    let loaded = false;
    const sync = () => {
      if (visible && !document.hidden) {
        if (!loaded) { loaded = true; v.preload = 'auto'; } // play() starts the download itself
        v.play().catch(() => { /* autoplay refused: the poster stays */ });
      } else if (!v.paused) v.pause();
    };
    const onPlaying = () => v.classList.add('is-playing');
    v.addEventListener('playing', onPlaying);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { rootMargin: '10% 0px' });
    io.observe(v);
    document.addEventListener('visibilitychange', sync);
    if (eager) sync();
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync); v.removeEventListener('playing', onPlaying); v.pause(); };
  }, [eager]);

  if (reducedMotion) {
    return <span className={`smoke-media ${className}`} aria-hidden="true"><img src={asset(m.still)} alt="" decoding="async" /></span>;
  }
  // the still sits underneath; the video fades in over it once it is actually playing
  return (
    <span className={`smoke-media ${className}`} aria-hidden="true">
      <img src={asset(m.still)} alt="" decoding="async" />
      <video ref={ref} className="smoke-video" poster={asset(m.still)} muted loop playsInline preload="none" disablePictureInPicture tabIndex={-1}>
        <source src={asset(m.webm)} type="video/webm" />
        <source src={asset(m.mp4)} type="video/mp4" />
      </video>
    </span>
  );
}

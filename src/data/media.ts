/**
 * Media used by the ACM chapter site. Files live in /public; paths are relative to /public.
 * Only abstract, non-personal assets are used — no portrait photography.
 */

/** Looping blue haze behind the loader. `still` is the poster and the reduced-motion image. */
export const SMOKE = {
  blue: { webm: 'media/smoke-blue.webm', mp4: 'media/smoke-blue.mp4', still: 'media/smoke-blue.webp' },
};

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

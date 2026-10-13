import { useEffect, useState } from 'react';

/**
 * Liquid-glass refraction — inspired by dashersw/liquid-glass-js.
 * Generates a displacement map (red = x offset, green = y offset) that bends
 * the backdrop strongly near the edges and not at all in the centre, like a
 * thick glass lens. Chromium can apply SVG filters to `backdrop-filter`, so
 * those browsers get true refraction; others keep the frosted-glass fallback.
 */
function makeMap(size = 256, edge = 0.22) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1), v = y / (size - 1);
      // distance to nearest edge (0 at edge, 0.5 at centre)
      const dx = Math.min(u, 1 - u), dy = Math.min(v, 1 - v);
      const fx = dx < edge ? Math.pow(1 - dx / edge, 2) * (u < 0.5 ? 1 : -1) : 0;
      const fy = dy < edge ? Math.pow(1 - dy / edge, 2) * (v < 0.5 ? 1 : -1) : 0;
      const i = (y * size + x) * 4;
      img.data[i] = 128 + fx * 127;
      img.data[i + 1] = 128 + fy * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

export default function LiquidGlassFilter() {
  const [map, setMap] = useState('');
  useEffect(() => {
    setMap(makeMap());
    const ua = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData;
    const chromium = !!ua?.brands?.some((b) => /Chromium|Google Chrome|Microsoft Edge|Brave|Opera/i.test(b.brand));
    if (chromium && !window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
      document.documentElement.classList.add('lg-refract');
    }
  }, []);
  if (!map) return null;
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="liquid-glass" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB" primitiveUnits="objectBoundingBox">
          <feImage href={map} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.002" result="soft" />
          <feDisplacementMap in="soft" in2="map" scale="0.06" xChannelSelector="R" yChannelSelector="G" result="bent" />
          <feColorMatrix in="bent" type="saturate" values="1.5" />
        </filter>
      </defs>
    </svg>
  );
}

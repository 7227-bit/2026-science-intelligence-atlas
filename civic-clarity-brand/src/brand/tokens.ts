import raw from './tokens.json';
import geometry from './generated/logoGeometry.json';

export const tokens = raw;
export const color = raw.color;
export type BrandColor = keyof typeof raw.color;
export const logoGeometry = geometry;

export const BRAND_NAME = 'CIVIC CLARITY';
export const DESCRIPTOR = raw.wordmark.descriptor;

/** Font families registered by loadBrandFonts(). OFL 1.1 — see public/fonts. */
export const fonts = {
  display: "'Cinzel', 'Trajan Pro', Georgia, serif",
  support: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
};

/** Safe-area definitions used by all compositions (fractions of frame). */
export const safeAreas = {
  none: null,
  /** SMPTE ST 2046-1 style: action-safe 93%, title-safe 90% */
  broadcast: {action: 0.93, title: 0.9},
  /** Conservative social/mobile crop: 80% centre */
  social: {action: 0.9, title: 0.8},
} as const;
export type SafeAreaMode = keyof typeof safeAreas;

export const mix = (a: string, b: string, t: number): string => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
};

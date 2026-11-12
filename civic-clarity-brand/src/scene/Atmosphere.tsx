import React from 'react';
import {color} from '../brand/tokens';

/** Thin gold halo arc above the dome, drawn on symmetrically from its apex. */
export const HaloArc: React.FC<{
  progress: number; // 0..1 draw-on
  intensity: number; // 0..1
  cx?: number;
  cy?: number;
  r?: number;
  spanDeg?: number;
  accent?: string;
  idPrefix?: string;
}> = ({progress, intensity, cx = 960, cy = 600, r = 470, spanDeg = 66, accent = color.gold, idPrefix = 'halo'}) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  const arc = (from: number, to: number) => {
    const p = (deg: number) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    };
    return `M${p(from)}A${r} ${r} 0 0 ${to > from ? 1 : 0} ${p(to)}`;
  };
  const span = spanDeg * Math.max(0, Math.min(1, progress));
  const flare = (deg: number, s: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return {x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), s};
  };
  const flares = progress > 0.6 ? [flare(-spanDeg * 0.72, 1), flare(spanDeg * 0.72, 1)] : [];
  const fo = Math.max(0, (progress - 0.6) / 0.4);
  return (
    <g id="layer-halo" opacity={intensity}>
      <defs>
        <filter colorInterpolationFilters="sRGB" id={id('glow')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <radialGradient id={id('flare')}>
          <stop offset="0" stopColor="#fff6e2" stopOpacity="1" />
          <stop offset="0.2" stopColor={color.goldLight} stopOpacity="0.6" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('streak')} x1="0" x2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff1d6" stopOpacity="0.9" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[arc(0, -span), arc(0, span)].map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={accent} strokeWidth={7} opacity={0.55} filter={`url(#${id('glow')})`} />
          <path d={d} fill="none" stroke="#ffe2b0" strokeWidth={1.6} strokeLinecap="round" />
        </g>
      ))}
      {flares.map((f, i) => (
        <g key={i} opacity={fo} style={{mixBlendMode: 'screen'}}>
          <circle cx={f.x} cy={f.y} r={22} fill={`url(#${id('flare')})`} />
          <rect x={f.x - 60} y={f.y - 0.6} width={120} height={1.2} fill={`url(#${id('streak')})`} opacity={0.6} />
        </g>
      ))}
    </g>
  );
};

/** Very soft volumetric rays from the backlight. Low opacity by design. */
export const LightRays: React.FC<{intensity: number; rotation: number; cx?: number; cy?: number; idPrefix?: string}> = ({
  intensity,
  rotation,
  cx = 960,
  cy = 470,
  idPrefix = 'rays',
}) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  const rays = [-62, -41, -24, -9, 7, 21, 38, 57];
  return (
    <g id="layer-rays" opacity={intensity} style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={id('fall')} cx={cx} cy={cy} r={900} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color.goldLight} stopOpacity="0.55" />
          <stop offset="0.5" stopColor={color.copper} stopOpacity="0.12" />
          <stop offset="1" stopColor={color.copper} stopOpacity="0" />
        </radialGradient>
        <filter colorInterpolationFilters="sRGB" id={id('blur')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <g filter={`url(#${id('blur')})`} transform={`rotate(${rotation} ${cx} ${cy})`}>
        {rays.map((deg, i) => {
          const w = 2.2 + (i % 3);
          const a1 = ((deg - 90 - w) * Math.PI) / 180;
          const a2 = ((deg - 90 + w) * Math.PI) / 180;
          const R = 1100;
          return (
            <path
              key={i}
              d={`M${cx} ${cy}L${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}L${cx + R * Math.cos(a2)} ${cy + R * Math.sin(a2)}Z`}
              fill={`url(#${id('fall')})`}
              opacity={0.5 + 0.5 * ((i * 37) % 5) / 5}
            />
          );
        })}
      </g>
    </g>
  );
};

/** Film grain (seeded per frame => deterministic) + vignette. Grain also dithers dark gradients against banding. */
export const GrainVignette: React.FC<{frame: number; grain?: number; vignette?: number; idPrefix?: string}> = ({
  frame,
  grain = 0.07,
  vignette = 0.75,
  idPrefix = 'gv',
}) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  return (
    <g id="layer-grain-vignette" pointerEvents="none">
      <defs>
        <radialGradient id={id('vig')} cx="0.5" cy="0.48" r="0.75">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="1" />
        </radialGradient>
        <filter colorInterpolationFilters="sRGB" id={id('grain')} x="0" y="0" width="1920" height="1080" filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={(frame % 97) + 1} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  1.2 0 0 0 -0.35" />
        </filter>
      </defs>
      <rect width="1920" height="1080" fill={`url(#${id('vig')})`} opacity={vignette} />
      {grain > 0 && <rect width="1920" height="1080" filter={`url(#${id('grain')})`} opacity={grain} style={{mixBlendMode: 'overlay'}} />}
    </g>
  );
};

/** Overlay guides for broadcast / social safe areas (proof renders only). */
export const SafeAreaGuides: React.FC<{mode: 'none' | 'broadcast' | 'social'; w?: number; h?: number}> = ({mode, w = 1920, h = 1080}) => {
  if (mode === 'none') return null;
  const [action, title] = mode === 'broadcast' ? [0.93, 0.9] : [0.9, 0.8];
  const box = (f: number, stroke: string, label: string) => (
    <g>
      <rect x={(w * (1 - f)) / 2} y={(h * (1 - f)) / 2} width={w * f} height={h * f} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="12 8" />
      <text x={(w * (1 - f)) / 2 + 10} y={(h * (1 - f)) / 2 + 26} fill={stroke} fontSize={18} fontFamily="Montserrat, Arial">
        {label}
      </text>
    </g>
  );
  return (
    <g id="safe-area-guides">
      {box(action, '#36e0ff', `ACTION SAFE ${Math.round(action * 100)}%`)}
      {box(title, '#ff4fa3', `TITLE SAFE ${Math.round(title * 100)}%`)}
    </g>
  );
};

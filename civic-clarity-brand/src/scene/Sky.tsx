import React from 'react';
import {color} from '../brand/tokens';

/**
 * Atmospheric sky: gradient base, warm backlight bloom and two procedural
 * cloud layers (SVG feTurbulence, fixed seeds => deterministic). All values are
 * in the 1920x1080 design space; the SVG is rendered at output resolution.
 *
 * Every parameter is a prop so the ident can animate each layer independently.
 */
export type SkyProps = {
  /** 0..1 overall exposure of the sky */
  exposure: number;
  /** 0..1 strength of the warm backlight behind the dome */
  glow: number;
  /** horizontal drift of the far / near cloud layers, design px */
  driftFar: number;
  driftNear: number;
  /** vertical parallax offset, design px */
  parallaxY: number;
  glowX?: number;
  glowY?: number;
  accent?: string;
  idPrefix?: string;
};

export const Sky: React.FC<SkyProps> = ({
  exposure,
  glow,
  driftFar,
  driftNear,
  parallaxY,
  glowX = 960,
  glowY = 470,
  accent = color.gold,
  idPrefix = 'sky',
}) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  return (
    <g id="layer-sky">
      <defs>
        <linearGradient id={id('base')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03080f" />
          <stop offset="0.45" stopColor={color.midnight} />
          <stop offset="0.8" stopColor="#0a1a2e" />
          <stop offset="1" stopColor="#050b14" />
        </linearGradient>
        <radialGradient id={id('glow')} cx={glowX} cy={glowY} r="760" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe6b0" stopOpacity="1" />
          <stop offset="0.14" stopColor="#ffb457" stopOpacity="0.92" />
          <stop offset="0.3" stopColor="#e3842f" stopOpacity="0.58" />
          <stop offset="0.52" stopColor={color.copper} stopOpacity="0.22" />
          <stop offset="0.75" stopColor={color.civicBlue} stopOpacity="0.1" />
          <stop offset="1" stopColor={color.midnight} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('cloudMaskWarm')} cx={glowX} cy={glowY} r="900" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
        </radialGradient>
        <linearGradient id={id('cloudVert')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.85" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id('maskWarm')} maskUnits="userSpaceOnUse" x="-400" y="-200" width="2720" height="1480">
          <rect x="-400" y="-200" width="2720" height="1480" fill={`url(#${id('cloudMaskWarm')})`} />
        </mask>
        <mask id={id('maskVert')} maskUnits="userSpaceOnUse" x="-400" y="-200" width="2720" height="1480">
          <rect x="-400" y="-200" width="2720" height="1480" fill={`url(#${id('cloudVert')})`} />
        </mask>
        {/* Far clouds: cool, broad */}
        <filter colorInterpolationFilters="sRGB" id={id('cloudsFar')} x="-400" y="-200" width="2720" height="1100" filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.0042" numOctaves="5" seed="11" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0.10  0 0 0 0 0.20  0 0 0 0 0.32  0 0 0 2.6 -1.25"
          />
        </filter>
        {/* Near clouds: warm-rimmed, more detail */}
        <filter colorInterpolationFilters="sRGB" id={id('cloudsNear')} x="-400" y="-200" width="2720" height="1100" filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.0026 0.0068" numOctaves="6" seed="29" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 1.0  0 0 0 0 0.66  0 0 0 0 0.32  0 0 0 3.6 -1.75"
            result="warm"
          />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0.03  0 0 0 0 0.07  0 0 0 0 0.12  0 0 0 2.4 -1.35"
            result="dark"
          />
          <feOffset in="warm" dx="0" dy="-5" result="warmUp" />
          <feMerge>
            <feMergeNode in="warmUp" />
            <feMergeNode in="dark" />
          </feMerge>
        </filter>
      </defs>
      <rect x="-200" y="-200" width="2320" height="1480" fill={`url(#${id('base')})`} opacity={0.35 + 0.65 * exposure} />
      {/* Horizon backlight: the 'sun' sits behind the building line, lighting the sky from below the dome. */}
      <defs>
        <radialGradient id={id('horizon')} cx={glowX} cy={glowY + 190} r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${glowX} ${glowY + 190}) scale(820 230) translate(${-glowX} ${-glowY - 190})`}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity="1" />
          <stop offset="0.18" stopColor="#ffcf86" stopOpacity="0.9" />
          <stop offset="0.45" stopColor={accent} stopOpacity="0.45" />
          <stop offset="1" stopColor={color.copper} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="-200" y={glowY - 120 + parallaxY * 0.6} width="2320" height="600" fill={`url(#${id('horizon')})`} opacity={glow * 0.95} style={{mixBlendMode: 'screen'}} />
      <g transform={`translate(0 ${parallaxY * 0.25})`}>
        <g mask={`url(#${id('maskVert')})`} opacity={0.85 * exposure}>
          <rect x="-400" y="-200" width="2720" height="1100" filter={`url(#${id('cloudsFar')})`} transform={`translate(${driftFar} 0)`} />
        </g>
        <g mask={`url(#${id('maskWarm')})`} opacity={(0.25 + 0.75 * glow) * exposure}>
          <g mask={`url(#${id('maskVert')})`}>
            <rect x="-400" y="-200" width="2720" height="1100" filter={`url(#${id('cloudsNear')})`} transform={`translate(${driftNear} 0)`} />
          </g>
        </g>
        <rect x="-200" y="-200" width="2320" height="1480" fill={`url(#${id('glow')})`} opacity={glow} style={{mixBlendMode: 'screen'}} />
      </g>
    </g>
  );
};

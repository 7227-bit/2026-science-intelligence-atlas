import React, {useMemo} from 'react';
import {color, mix} from '../brand/tokens';

/**
 * Original, stylised vector Capitol-dome architecture, constructed procedurally
 * (not traced from any photograph). It is 2.5D: the colonnades and dome ribs are
 * projected from cylinder/ellipsoid parameters so they shade and foreshorten
 * plausibly, but there is no true 3D mesh. Each architectural tier is its own
 * <g id="..."> so it can be lit and moved independently.
 *
 * Coordinates: design space 1920x1080, centred on cx, `base` = ground line.
 */
export type CapitolProps = {
  cx?: number;
  base?: number;
  scale?: number;
  /** 0..1 warm key light on the architecture */
  keyLight: number;
  /** 0..1 rim light from the backlight */
  rimLight: number;
  /** 0..1 silhouette visibility (pre-light) */
  presence: number;
  /** per-tier vertical parallax, design px (applied progressively up the tiers) */
  lift?: number;
  idPrefix?: string;
};

const SHADOW = '#0b1524';
const MID = '#7a6650';
const LIT = '#f6e6c6';

/** Lambert-ish brightness of a vertical facet at angle theta on a cylinder, key light from front-left. */
const facet = (theta: number, key: number) => {
  const k = Math.max(0, Math.cos(theta + 0.55));
  return 0.12 + 0.88 * k * key;
};
const shade = (b: number) => (b < 0.5 ? mix(SHADOW, MID, b * 2) : mix(MID, LIT, (b - 0.5) * 2));

type Col = {x: number; w: number; theta: number};
const colonnade = (n: number, R: number, minW: number, maxW: number): Col[] => {
  const out: Col[] = [];
  for (let i = 0; i < n; i++) {
    const theta = -Math.PI / 2 + ((i + 0.5) / n) * Math.PI; // visible half only
    const c = Math.cos(theta);
    out.push({x: R * Math.sin(theta), w: minW + (maxW - minW) * c, theta});
  }
  return out;
};

export const Capitol: React.FC<CapitolProps> = ({
  cx = 960,
  base = 700,
  scale = 1,
  keyLight,
  rimLight,
  presence,
  lift = 0,
  idPrefix = 'cap',
}) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  const peri = useMemo(() => colonnade(24, 184, 1.2, 8), []);
  const attic = useMemo(() => colonnade(16, 152, 1.2, 7), []);
  const tholos = useMemo(() => colonnade(8, 24, 0.8, 3.2), []);
  const ribs = useMemo(() => Array.from({length: 13}, (_, i) => -Math.PI / 2 + ((i + 1) / 14) * Math.PI), []);

  // Tier heights relative to base (upwards negative y).
  const Y = {
    wingTop: -78,
    centreTop: -112,
    pediment: -150,
    podium: -168,
    periBot: -182,
    periTop: -282,
    entab: -298,
    atticTop: -350,
    domeBase: -356,
    domeTop: -566,
    tholosTop: -616,
    capTop: -634,
    finial: -676,
  };
  const L = (tier: number) => -lift * tier; // upper tiers lift slightly more => parallax depth cue

  // Dome profile: slightly prolate half-ellipse.
  const DR = 150;
  const DH = Y.domeBase - Y.domeTop;
  const domeX = (u: number) => DR * Math.sqrt(Math.max(0, 1 - u * u)); // u in 0..1 from base to top

  const ribPath = (phi: number) => {
    const pts: string[] = [];
    for (let s = 0; s <= 24; s++) {
      const u = s / 24;
      const x = domeX(u) * Math.sin(phi);
      const y = Y.domeBase - u * DH;
      pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join('');
  };
  const domeOutline = (() => {
    const pts: string[] = [`M${-DR} ${Y.domeBase}`];
    for (let s = 0; s <= 48; s++) {
      const a = Math.PI - (s / 48) * Math.PI;
      pts.push(`L${(DR * Math.cos(a)).toFixed(2)} ${(Y.domeBase - DH * Math.sin(a)).toFixed(2)}`);
    }
    return pts.join('') + 'Z';
  })();

  const rim = color.goldLight;
  const k = keyLight;

  return (
    <g id="layer-architecture" opacity={presence} transform={`translate(${cx} ${base}) scale(${scale})`}>
      <defs>
        <radialGradient id={id('domeFill')} cx="0.3" cy="0.12" r="0.95">
          <stop offset="0" stopColor={mix(SHADOW, '#fffaf0', 0.15 + 0.85 * k)} />
          <stop offset="0.4" stopColor={mix(SHADOW, '#efe0c4', 0.1 + 0.85 * k)} />
          <stop offset="0.78" stopColor={mix('#0a1220', '#8a7559', 0.75 * k)} />
          <stop offset="1" stopColor={mix('#070d18', '#2c2a2e', 0.6 * k)} />
        </radialGradient>
        <linearGradient id={id('facade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(SHADOW, '#a28a68', 0.6 * k)} />
          <stop offset="0.5" stopColor={mix('#070d17', '#3a3026', 0.6 * k)} />
          <stop offset="1" stopColor="#04080e" />
        </linearGradient>
        <linearGradient id={id('wingFade')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.22" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.78" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id('wingMask')} maskUnits="userSpaceOnUse" x="-980" y="-200" width="1960" height="300">
          <rect x="-980" y="-200" width="1960" height="300" fill={`url(#${id('wingFade')})`} />
        </mask>
        <filter colorInterpolationFilters="sRGB" id={id('rimBlur')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Main building: wings + central block + pediment */}
      <g id="tier-building" mask={`url(#${id('wingMask')})`}>
        <rect x={-940} y={Y.wingTop} width={1880} height={-Y.wingTop + 30} fill={`url(#${id('facade')})`} />
        <rect x={-940} y={Y.wingTop - 6} width={1880} height={6} fill={mix(SHADOW, '#e6d3ae', 0.8 * k)} />
        {Array.from({length: 94}, (_, i) => {
          const x = -930 + i * 20;
          if (Math.abs(x) < 236) return null;
          const b = 0.15 + 0.45 * k * (1 - Math.abs(x) / 940);
          return <rect key={i} x={x} y={Y.wingTop + 8} width={4} height={-Y.wingTop - 10} fill={shade(b)} opacity={0.4} />;
        })}
        <rect x={-236} y={Y.centreTop} width={472} height={-Y.centreTop + 30} fill={`url(#${id('facade')})`} />
        <path d={`M-150 ${Y.centreTop}L0 ${Y.pediment}L150 ${Y.centreTop}Z`} fill={mix(SHADOW, '#d8c39d', 0.85 * k)} />
        <path d={`M-128 ${Y.centreTop - 3}L0 ${Y.pediment + 9}L128 ${Y.centreTop - 3}Z`} fill={mix('#08101c', '#6c5d48', 0.7 * k)} />

      </g>

      {/* Podium */}
      <g id="tier-podium" transform={`translate(0 ${L(0.3)})`}>
        <rect x={-214} y={Y.periBot} width={428} height={20} fill={mix('#08101b', '#a08a68', 0.75 * k)} />
        <rect x={-226} y={Y.periBot + 20} width={452} height={6} fill={mix('#08101b', '#c9b18a', 0.7 * k)} />
        <rect x={-232} y={Y.periBot + 26} width={464} height={56} fill={mix('#060c16', '#4a3e30', 0.6 * k)} />
        <rect x={-218} y={Y.periBot - 4} width={436} height={6} fill={mix(SHADOW, '#e8d6b2', 0.8 * k)} />
      </g>

      {/* Peristyle: wall cylinder + projected columns */}
      <g id="tier-peristyle" transform={`translate(0 ${L(0.5)})`}>
        <rect x={-170} y={Y.periTop} width={340} height={Y.periBot - Y.periTop} fill={mix('#070d17', '#4a3a2a', 0.75 * k)} />
        {peri.map((c, i) => (
          <g key={i}>
            <rect x={c.x * 0.89 - 4} y={Y.periTop + 28} width={8 * Math.cos(c.theta)} height={36} fill={mix('#0a0f18', '#f7c77d', 0.55 * k * Math.cos(c.theta))} opacity={0.8} />
            <rect x={c.x - c.w / 2} y={Y.periTop} width={c.w} height={Y.periBot - Y.periTop} fill={shade(facet(c.theta, k))} />
          </g>
        ))}
        <rect x={-196} y={Y.entab} width={392} height={Y.periTop - Y.entab} fill={mix(SHADOW, '#e9d7b3', 0.85 * k)} />
        <rect x={-192} y={Y.entab - 9} width={384} height={9} fill={mix(SHADOW, '#bfa983', 0.7 * k)} />
      </g>

      {/* Attic drum with pilasters and windows */}
      <g id="tier-attic" transform={`translate(0 ${L(0.7)})`}>
        <rect x={-156} y={Y.atticTop} width={312} height={Y.entab - 9 - Y.atticTop} fill={mix(SHADOW, '#bca784', 0.75 * k)} />
        {attic.map((c, i) => (
          <g key={i}>
            <rect x={c.x - c.w / 2} y={Y.atticTop + 4} width={c.w} height={Y.entab - 13 - Y.atticTop - 4} fill={shade(facet(c.theta, k) * 1.05)} />
            {i < attic.length - 1 && (
              <rect
                x={(c.x + attic[i + 1].x) / 2 - 3 * Math.cos(c.theta)}
                y={Y.atticTop + 18}
                width={6 * Math.cos(c.theta) + 0.5}
                height={20}
                fill={mix('#04080f', '#ffcf86', 0.6 * k * Math.cos(c.theta))}
              />
            )}
          </g>
        ))}
        <rect x={-162} y={Y.domeBase} width={324} height={Y.atticTop - Y.domeBase} fill={mix(SHADOW, '#efdfc0', 0.85 * k)} />
      </g>

      {/* Dome */}
      <g id="tier-dome" transform={`translate(0 ${L(1)})`}>
        <path d={domeOutline} fill={`url(#${id('domeFill')})`} />
        {ribs.map((phi, i) => (
          <path key={i} d={ribPath(phi)} fill="none" stroke={mix('#0b1220', '#5d4c37', 0.6 * k)} strokeWidth={2.2 * (0.35 + 0.65 * Math.cos(phi))} opacity={0.85} />
        ))}
        {/* two rings of lucarne windows */}
        {[0.22, 0.48].map((u, r) =>
          ribs.slice(0, -1).map((phi, i) => {
            const mid = (phi + ribs[i + 1]) / 2;
            const x = domeX(u) * Math.sin(mid);
            const w = (r === 0 ? 7 : 5) * Math.cos(mid);
            return <rect key={`${r}-${i}`} x={x - w / 2} y={Y.domeBase - u * DH - 10} width={w} height={r === 0 ? 14 : 10} fill={mix('#05090f', '#3c3026', 0.6 * k)} />;
          }),
        )}
        {/* rim light on dome edge */}
        <path d={domeOutline} fill="none" stroke={rim} strokeWidth={3} opacity={0.75 * rimLight} filter={`url(#${id('rimBlur')})`} />
        <path d={domeOutline} fill="none" stroke="#fff2d6" strokeWidth={0.9} opacity={0.6 * rimLight} />
      </g>

      {/* Lantern (tholos), cap and finial */}
      <g id="tier-lantern" transform={`translate(0 ${L(1.2)})`}>
        <rect x={-34} y={Y.domeTop - 6} width={68} height={10} fill={mix(SHADOW, '#e9d6b0', 0.85 * k)} />
        <rect x={-26} y={Y.tholosTop} width={52} height={Y.domeTop - 6 - Y.tholosTop} fill={mix('#04080f', '#2c251d', 0.5 * k)} />
        {tholos.map((c, i) => (
          <rect key={i} x={c.x - c.w / 2} y={Y.tholosTop} width={c.w} height={Y.domeTop - 6 - Y.tholosTop} fill={shade(facet(c.theta, k))} />
        ))}
        <rect x={-30} y={Y.tholosTop - 5} width={60} height={6} fill={mix(SHADOW, '#efdcb6', 0.85 * k)} />
        <path d={`M-26 ${Y.tholosTop - 5}A26 ${Y.tholosTop - Y.capTop + 2} 0 0 1 26 ${Y.tholosTop - 5}Z`} fill={`url(#${id('domeFill')})`} />
        {/* Abstract finial — deliberately not a figurative statue */}
        <path d={`M-5 ${Y.capTop + 2}L-3 ${Y.finial + 18}L0 ${Y.finial}L3 ${Y.finial + 18}L5 ${Y.capTop + 2}Z`} fill={mix(SHADOW, '#d7c19a', 0.7 * k)} />
        <path d={`M-26 ${Y.tholosTop - 5}A26 ${Y.tholosTop - Y.capTop + 2} 0 0 1 26 ${Y.tholosTop - 5}`} fill="none" stroke={rim} strokeWidth={1.4} opacity={0.7 * rimLight} />
      </g>
    </g>
  );
};

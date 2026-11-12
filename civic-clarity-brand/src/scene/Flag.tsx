import React, {useMemo} from 'react';
import {color} from '../brand/tokens';

/**
 * Procedural U.S. flag (13 stripes, 50-star canton, 10:19 proportion) animated
 * as a 2.5D cloth: the artwork is sliced into vertical strips, each displaced by
 * a travelling wave and shaded by the wave's slope. It is NOT a cloth
 * simulation or true 3D geometry. Kept dark and partially vignetted — subtle
 * context, never a seal or emblem.
 */
export type FlagProps = {
  /** seconds — drives the wave phase */
  time: number;
  /** 0..1 */
  opacity: number;
  /** wave amplitude, flag-height fraction */
  amplitude?: number;
  x?: number;
  y?: number;
  width?: number;
  rotate?: number;
  strips?: number;
  idPrefix?: string;
};

const starD = (cx: number, cy: number, R: number) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? R * 0.382 : R;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    p.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${p.join('L')}Z`;
};

export const Flag: React.FC<FlagProps> = ({
  time,
  opacity,
  amplitude = 0.035,
  x = -120,
  y = -60,
  width = 1050,
  rotate = -4,
  strips = 72,
  idPrefix = 'flag',
}) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  const W = width;
  const H = (W * 10) / 19;
  const stripeH = H / 13;
  const cantonW = W * 0.4;
  const cantonH = stripeH * 7;

  const stars = useMemo(() => {
    const out: string[] = [];
    const R = stripeH * 0.616 * 0.5 * 0.8;
    for (let row = 0; row < 9; row++) {
      const n = row % 2 === 0 ? 6 : 5;
      for (let c = 0; c < n; c++) {
        const sx = (cantonW / 12) * (row % 2 === 0 ? 1 + c * 2 : 2 + c * 2);
        const sy = (cantonH / 10) * (row + 1);
        out.push(starD(sx, sy, R));
      }
    }
    return out.join('');
  }, [cantonW, cantonH, stripeH]);

  const sw = W / strips;
  const wave = (u: number) => {
    // travelling wave, amplitude grows away from the hoist
    const a = amplitude * H * (0.25 + 0.75 * u);
    return a * Math.sin(u * 7.5 - time * 3.1) + a * 0.45 * Math.sin(u * 13.0 - time * 4.7 + 1.3);
  };

  return (
    <g id="layer-flag" opacity={opacity} transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <defs>
        <g id={id('art')}>
          {Array.from({length: 13}, (_, i) => (
            <rect key={i} x={0} y={i * stripeH} width={W} height={stripeH + 0.5} fill={i % 2 === 0 ? color.flagRed : color.flagWhite} />
          ))}
          <rect x={0} y={0} width={cantonW} height={cantonH} fill={color.flagBlue} />
          <path d={stars} fill={color.flagWhite} />
        </g>
        {Array.from({length: strips}, (_, i) => (
          <clipPath key={i} id={id(`c${i}`)}>
            <rect x={i * sw - 0.6} y={-H} width={sw + 1.2} height={H * 3} />
          </clipPath>
        ))}
        <linearGradient id={id('fadeX')} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.85" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id('mask')} maskUnits="userSpaceOnUse" x={-50} y={-H} width={W + 100} height={H * 3}>
          <rect x={-50} y={-H} width={W + 100} height={H * 3} fill={`url(#${id('fadeX')})`} />
        </mask>
      </defs>
      <g mask={`url(#${id('mask')})`}>
        {Array.from({length: strips}, (_, i) => {
          const u = (i + 0.5) / strips;
          const dy = wave(u);
          const slope = (wave(u + 0.01) - wave(u - 0.01)) / (0.02 * W);
          const light = Math.max(-1, Math.min(1, slope * 9));
          return (
            <g key={i} clipPath={`url(#${id(`c${i}`)})`}>
              <use href={`#${id('art')}`} transform={`translate(0 ${dy.toFixed(2)})`} />
              <rect
                x={i * sw - 0.6}
                y={dy - 2}
                width={sw + 1.2}
                height={H + 4}
                fill={light > 0 ? '#fff4e0' : '#000'}
                opacity={Math.abs(light) * (light > 0 ? 0.28 : 0.55)}
              />
            </g>
          );
        })}
        {/* overall darkening so the flag stays a quiet background element */}
        <rect x={-50} y={-H} width={W + 100} height={H * 3} fill={color.midnight} opacity={0.38} />
      </g>
    </g>
  );
};

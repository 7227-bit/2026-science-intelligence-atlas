import React from 'react';
import {color, logoGeometry, tokens} from '../brand/tokens';

const G = logoGeometry;

export type MarkProps = {
  cx: number;
  cy: number;
  /** ring diameter, design px */
  size: number;
  variant?: 'star' | 'dome';
  material?: 'metallic' | 'flat' | 'mono';
  ring?: boolean;
  ringWidth?: number;
  accent?: string;
  monoColor?: string;
  idPrefix?: string;
};

/**
 * Compact mark: classical capital C (Cinzel outline) with a star in its counter.
 * Mirrors scripts/build-logos.mjs markGroup() so stills and SVG masters agree.
 */
export const Mark: React.FC<MarkProps> = ({
  cx,
  cy,
  size,
  variant = 'star',
  material = 'metallic',
  ring = true,
  ringWidth = 16,
  accent = color.gold,
  monoColor = color.ivory,
  idPrefix = 'mark',
}) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  const k = size / 1000;
  const g = G.markC;
  const gw = g.bbox.x2 - g.bbox.x1;
  const gh = g.bbox.y2 - g.bbox.y1;
  const gx = -gw / 2 - g.bbox.x1 + 12;
  const gy = gh / 2 - g.bbox.y2;
  const face = material === 'metallic' ? `url(#${id('metal')})` : material === 'flat' ? color.ivory : monoColor;
  const acc = material === 'mono' ? monoColor : material === 'metallic' ? color.goldLight : accent;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${k})`}>
      <defs>
        <linearGradient id={id('metal')} gradientUnits="userSpaceOnUse" x1="0" y1={g.bbox.y1} x2="0" y2={g.bbox.y2}>
          {tokens.metallic.stops.map(([o, c]) => (
            <stop key={String(o)} offset={Number(o)} stopColor={String(c)} />
          ))}
        </linearGradient>
      </defs>
      {ring && <circle r={470} fill="none" stroke={material === 'mono' ? monoColor : accent} strokeWidth={ringWidth} />}
      <path d={g.d} transform={`translate(${gx} ${gy})`} fill={face} stroke={material === 'metallic' ? tokens.metallic.edge : 'none'} strokeWidth={2} strokeOpacity={0.6} />
      {variant === 'star' ? (
        <path d={G.starUnit100} transform="translate(56 6) scale(1.12)" fill={acc} />
      ) : (
        <path d={G.domeUnit} transform="translate(52 128) scale(2)" fill={acc} />
      )}
    </g>
  );
};

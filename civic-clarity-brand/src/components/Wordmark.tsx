import React from 'react';
import {BRAND_NAME, color, fonts, logoGeometry, tokens} from '../brand/tokens';

const G = logoGeometry;
const word = G.wordmark;
const desc = G.descriptor;

export type WordmarkMaterial = 'metallic' | 'flat' | 'mono';

export type WordmarkProps = {
  /** centre x and top y of the wordmark (design px) */
  cx: number;
  top: number;
  /** visible width of the wordmark (design px) */
  width: number;
  material?: WordmarkMaterial;
  /** 0..1 — per-glyph materialisation, staggered from centre outwards */
  reveal?: number;
  /** -0.3..1.3 — position of the specular sheen across the word */
  sheen?: number;
  /** 0..1 back-glow strength */
  glow?: number;
  /** 0..1 dimensional extrusion depth */
  depth?: number;
  rule?: number;
  descriptor?: number;
  star?: number;
  /** 0..1 star gleam flash */
  gleam?: number;
  showDescriptor?: boolean;
  title?: string;
  descriptorText?: string;
  accent?: string;
  monoColor?: string;
  idPrefix?: string;
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

/** Taper rule (lens) path, mirrors scripts/build-logos.mjs */
const taper = (x1: number, x2: number, y: number, t: number) => {
  const m = (x1 + x2) / 2;
  return `M${x1} ${y}Q${m} ${y - t} ${x2} ${y}Q${m} ${y + t} ${x1} ${y}Z`;
};

export const Wordmark: React.FC<WordmarkProps> = ({
  cx,
  top,
  width,
  material = 'metallic',
  reveal = 1,
  sheen = -1,
  glow = 0,
  depth = 1,
  rule = 1,
  descriptor = 1,
  star = 1,
  gleam = 0,
  showDescriptor = true,
  title = BRAND_NAME,
  descriptorText = tokens.wordmark.descriptor,
  accent = color.gold,
  monoColor = color.ivory,
  idPrefix = 'wm',
}) => {
  const id = (s: string) => `${idPrefix}-${s}`;
  const s = width / word.width;
  const x0 = cx - width / 2 - word.bbox.x1 * s;
  const baseline = top - word.bbox.y1 * s;
  const capH = G.capHeight * s;
  const usesOutlines = title.trim().toUpperCase() === BRAND_NAME;

  const n = word.glyphs.length;
  const centre = (word.bbox.x1 + word.bbox.x2) / 2;
  const maxDist = Math.max(...word.glyphs.map((g) => Math.abs((g.bbox.x1 + g.bbox.x2) / 2 - centre)));
  const glyphT = (i: number) => {
    const g = word.glyphs[i];
    const d = Math.abs((g.bbox.x1 + g.bbox.x2) / 2 - centre) / maxDist; // 0 centre .. 1 edge
    return easeOut((reveal - d * 0.45) / 0.55);
  };

  const faceFill = material === 'metallic' ? `url(#${id('metal')})` : material === 'flat' ? color.ivory : monoColor;
  const ruleY = baseline + capH * 0.36;
  const descSize = desc.size * s;
  const descBase = ruleY + capH * 0.42 + desc.capHeight * s;
  const descMid = descBase - (desc.capHeight * s) / 2;
  const descW = desc.width * s;
  const gap = descSize * 1.1;
  const starR = desc.capHeight * s * 1.05;
  const starY = descBase + capH * 0.34 + starR;
  const ruleFill = material === 'mono' ? monoColor : accent;

  const glyphs = (fill: string, extra: React.SVGProps<SVGPathElement> = {}, dy = 0, perGlyphOpacity = true) =>
    word.glyphs.map((g, i) => {
      const t = glyphT(i);
      if (t <= 0) return null;
      return (
        <path
          key={i}
          d={g.d}
          fill={fill}
          opacity={perGlyphOpacity ? t : 1}
          transform={`translate(0 ${dy + (1 - t) * 10})`}
          {...extra}
        />
      );
    });

  return (
    <g id={`${idPrefix}-wordmark`} aria-label={`${title} — ${descriptorText}`}>
      <defs>
        <linearGradient id={id('metal')} gradientUnits="userSpaceOnUse" x1="0" y1={word.bbox.y1} x2="0" y2={0}>
          {tokens.metallic.stops.map(([o, c]) => (
            <stop key={String(o)} offset={Number(o)} stopColor={String(c)} />
          ))}
        </linearGradient>
        <linearGradient id={id('extrude')} gradientUnits="userSpaceOnUse" x1="0" y1={word.bbox.y1} x2="0" y2={0}>
          <stop offset="0" stopColor="#6d5536" />
          <stop offset="1" stopColor="#2a1d10" />
        </linearGradient>
        <linearGradient id={id('sheen')} gradientUnits="userSpaceOnUse" x1={word.bbox.x1} y1="0" x2={word.bbox.x2} y2="0">
          <stop offset={clamp(sheen - 0.12)} stopColor="#fff" stopOpacity="0" />
          <stop offset={clamp(sheen)} stopColor="#fffaf0" stopOpacity="0.95" />
          <stop offset={clamp(sheen + 0.12)} stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter colorInterpolationFilters="sRGB" id={id('glow')} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={14 / s} />
        </filter>
        <radialGradient id={id('gleam')}>
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.25" stopColor={color.goldLight} stopOpacity="0.7" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('rule')} x1="0" x2="1">
          <stop offset="0" stopColor={ruleFill} stopOpacity="0.1" />
          <stop offset="0.5" stopColor={material === 'mono' ? monoColor : color.goldLight} />
          <stop offset="1" stopColor={ruleFill} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {usesOutlines ? (
        <g transform={`translate(${x0} ${baseline}) scale(${s})`}>
          {glow > 0 && material !== 'mono' && (
            <g opacity={glow * 0.55} filter={`url(#${id('glow')})`} style={{mixBlendMode: 'screen'}}>
              {glyphs(accent)}
            </g>
          )}
          {material === 'metallic' &&
            depth > 0 &&
            [5, 4, 3, 2, 1].map((k) => (
              <g key={k} opacity={depth}>
                {glyphs(`url(#${id('extrude')})`, {}, k * 1.4)}
              </g>
            ))}
          <g>{glyphs(faceFill, material === 'metallic' ? {stroke: tokens.metallic.edge, strokeWidth: 1.1, strokeOpacity: 0.5} : {})}</g>
          {material === 'metallic' && sheen > -0.5 && sheen < 1.5 && (
            <g style={{mixBlendMode: 'screen'}}>{glyphs(`url(#${id('sheen')})`)}</g>
          )}
        </g>
      ) : (
        <text
          x={cx}
          y={baseline}
          textAnchor="middle"
          fontFamily={fonts.display}
          fontWeight={700}
          fontSize={Math.min(G.base * s, width / Math.max(1, title.length * 0.8))}
          textLength={title.length * 0.8 * Math.min(G.base * s, width / Math.max(1, title.length * 0.8)) > width ? width : undefined}
          lengthAdjust="spacingAndGlyphs"
          letterSpacing={G.base * s * tokens.wordmark.trackingEm}
          fill={faceFill}
          opacity={clamp(reveal * 1.4)}
        >
          {title.toUpperCase()}
        </text>
      )}

      {showDescriptor && (
        <g>
          <g transform={`translate(${cx} 0) scale(${easeOut(rule)} 1) translate(${-cx} 0)`} opacity={clamp(rule * 3)}>
            <path d={taper(cx - width / 2, cx + width / 2, ruleY, 2.4 * s)} fill={`url(#${id('rule')})`} />
          </g>
          <g opacity={easeOut(descriptor)} transform={`translate(${cx} 0) scale(${1 + 0.06 * (1 - easeOut(descriptor))} 1) translate(${-cx} 0)`}>
            <g transform={`translate(${cx - descW / 2 - desc.bbox.x1 * s} ${descBase}) scale(${s})`} fill={material === 'mono' ? monoColor : color.steel}>
              {descriptorText === desc.text ? (
                desc.glyphs.map((g, i) => <path key={i} d={g.d} />)
              ) : (
                <text x={desc.width / 2} y={0} textAnchor="middle" fontFamily={fonts.support} fontWeight={500} fontSize={desc.size} letterSpacing={desc.size * 0.42}>
                  {descriptorText.toUpperCase()}
                </text>
              )}
            </g>
            <path d={taper(cx - width * 0.44, cx - descW / 2 - gap, descMid, 1.4 * s)} fill={ruleFill} />
            <path d={taper(cx + descW / 2 + gap, cx + width * 0.44, descMid, 1.4 * s)} fill={ruleFill} />
          </g>
          {star > 0 && (
            <g transform={`translate(${cx} ${starY}) scale(${starR * easeOut(star)})`}>
              <path d={G.starUnit100} transform="scale(0.01)" fill={material === 'mono' ? monoColor : color.goldLight} />
            </g>
          )}
          {gleam > 0 && material !== 'mono' && (
            <g opacity={gleam} style={{mixBlendMode: 'screen'}} transform={`translate(${cx} ${starY})`}>
              <circle r={starR * 5} fill={`url(#${id('gleam')})`} />
              <rect x={-starR * 14} y={-0.7} width={starR * 28} height={1.4} fill={`url(#${id('rule')})`} />
              
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/** Layout helper: vertical extent of a full lockup for a given width. */
export const wordmarkMetrics = (width: number) => {
  const s = width / word.width;
  const capH = G.capHeight * s;
  const h0 = (word.bbox.y2 - word.bbox.y1) * s;
  const baselineFromTop = -word.bbox.y1 * s;
  const ruleY = baselineFromTop + capH * 0.36;
  const descBase = ruleY + capH * 0.42 + desc.capHeight * s;
  const starR = desc.capHeight * s * 1.05;
  const starBottom = descBase + capH * 0.34 + 2 * starR;
  return {scale: s, capHeight: capH, wordHeight: h0, baselineFromTop, totalHeight: starBottom};
};

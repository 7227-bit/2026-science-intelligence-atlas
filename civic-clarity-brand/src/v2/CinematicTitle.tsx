import React from 'react';
import {color, fonts, logoGeometry} from '../brand/tokens';
import type from '../brand/generated/cinematicType.json';
import {BAND_OFFSET_Y, K, VIEW} from './plateLayout';

/**
 * v2 title, set at the exact positions measured in the owner's reference.
 * Geometry: scripts/build-cinematic-type.mjs (Cinzel Bold / Montserrat outlines, reference-band units).
 * Material: stronger metallic ramp + specular bevel (SVG lighting filter) + warm rim glow,
 * dark contact shadow and a short extrusion. All vector.
 */
const T = type;
const R = T.ref;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export type CinematicTitleProps = {
  reveal: number; // 0..1 centre-out materialisation
  sheen: number; // -0.3..1.3
  glow: number; // warm rim glow
  line: number; // glow line under the title (0..1 width)
  lineIntensity: number;
  burst: number; // centre light burst
  descriptor: number;
  rules: number;
  star: number;
  gleam: number;
  accent: string;
  title?: string;
  descriptorText?: string;
};

const METAL: Array<[number, string]> = [
  [0.0, '#FFFFFF'],
  [0.22, '#F6EEDF'],
  [0.46, '#D9CDB8'],
  [0.56, '#8C7B63'],
  [0.64, '#6E5F4C'],
  [0.76, '#CDB792'],
  [0.9, '#F3E3C2'],
  [1.0, '#FFF6E4'],
];

export const CinematicTitle: React.FC<CinematicTitleProps> = (p) => {
  const glyphs = T.words.flatMap((w) => w.glyphs);
  const centre = (R.civic[0] + R.clarity[1]) / 2;
  const maxD = Math.max(...glyphs.map((g) => Math.abs(g.cx - centre)));
  const gt = (cx: number) => easeOut((p.reveal - (Math.abs(cx - centre) / maxD) * 0.45) / 0.55);
  const top = R.baseline - R.initialH;
  const custom = p.title && p.title.trim().toUpperCase() !== 'CIVIC CLARITY';

  // band units -> design px (screen-space title, aligned to the plate at camera scale 1)
  const tf = `scale(${K}) translate(${-VIEW.x} ${BAND_OFFSET_Y - VIEW.y})`;

  const glyphLayer = (fill: string, extra: React.SVGProps<SVGPathElement> = {}, dy = 0, op = 1) =>
    glyphs.map((g, i) => {
      const t = gt(g.cx);
      if (t <= 0) return null;
      return <path key={i} d={g.d} fill={fill} opacity={t * op} transform={`translate(0 ${dy + (1 - t) * 5})`} {...extra} />;
    });

  const starR = R.star.r;
  return (
    <g id="v2-title" transform={tf}>
      <defs>
        <linearGradient id="v2-metal" gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={R.baseline + 2}>
          {METAL.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id="v2-extrude" gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={R.baseline}>
          <stop offset="0" stopColor="#5c4630" />
          <stop offset="1" stopColor="#1d140b" />
        </linearGradient>
        <linearGradient id="v2-sheen" gradientUnits="userSpaceOnUse" x1={R.civic[0]} y1="0" x2={R.clarity[1]} y2="0">
          <stop offset={clamp(p.sheen - 0.1)} stopColor="#fff" stopOpacity="0" />
          <stop offset={clamp(p.sheen)} stopColor="#fffaf0" stopOpacity="0.9" />
          <stop offset={clamp(p.sheen + 0.1)} stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* rim glow strongest near the central light source */}
        <radialGradient id="v2-rimfall" gradientUnits="userSpaceOnUse" cx={768} cy={R.baseline} r={620}>
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.2" />
        </radialGradient>
        <mask id="v2-rimmask" maskUnits="userSpaceOnUse" x={0} y={0} width={1536} height={446}>
          <rect x={0} y={0} width={1536} height={446} fill="url(#v2-rimfall)" />
        </mask>
        <filter colorInterpolationFilters="sRGB" id="v2-bevel" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="b" />
          <feSpecularLighting in="b" surfaceScale="3.2" specularConstant="0.95" specularExponent="22" lightingColor="#fff3dc" result="spec">
            <feDistantLight azimuth="235" elevation="38" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" />
        </filter>
        <filter colorInterpolationFilters="sRGB" id="v2-shadow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter colorInterpolationFilters="sRGB" id="v2-glow" x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter colorInterpolationFilters="sRGB" id="v2-soft" x="-50%" y="-500%" width="200%" height="1100%">
          <feGaussianBlur stdDeviation="2.2 1.2" />
        </filter>
        <radialGradient id="v2-burst">
          <stop offset="0" stopColor="#fffbe8" stopOpacity="1" />
          <stop offset="0.18" stopColor="#ffd38a" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#e88a35" stopOpacity="0.3" />
          <stop offset="1" stopColor="#c56a2a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="v2-line" x1="0" x2="1">
          <stop offset="0" stopColor={p.accent} stopOpacity="0" />
          <stop offset="0.2" stopColor="#e6a35a" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff4dc" stopOpacity="1" />
          <stop offset="0.8" stopColor="#e6a35a" stopOpacity="0.55" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="v2-rule" x1="0" x2="1">
          <stop offset="0" stopColor={p.accent} stopOpacity="0" />
          <stop offset="0.5" stopColor={color.goldLight} stopOpacity="1" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="v2-gleam">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.3" stopColor={color.goldLight} stopOpacity="0.6" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* light burst + glow line beneath the title (the reference's central light) */}
      <g style={{mixBlendMode: 'screen'}} opacity={p.lineIntensity}>
        <ellipse cx={768} cy={R.glowLineY - 3} rx={150 * (0.4 + 0.6 * p.burst)} ry={34 * (0.4 + 0.6 * p.burst)} fill="url(#v2-burst)" opacity={p.burst} />
        <ellipse cx={768} cy={R.glowLineY - 2} rx={48 * p.burst} ry={9 * p.burst} fill="#fff6df" opacity={0.85 * p.burst} filter="url(#v2-soft)" />
        <rect x={768 - 420 * p.line} y={R.glowLineY - 5} width={840 * p.line} height={10} fill="url(#v2-line)" filter="url(#v2-soft)" opacity={0.8} />
        <rect x={768 - 390 * p.line} y={R.glowLineY - 2} width={780 * p.line} height={4} fill="url(#v2-line)" filter="url(#v2-soft)" />
        <rect x={768 - 370 * p.line} y={R.glowLineY - 0.7} width={740 * p.line} height={1.4} fill="url(#v2-line)" />
      </g>

      {!custom ? (
        <>
          {/* contact shadow for separation from the facade */}
          <g opacity={0.75} filter="url(#v2-shadow)">{glyphLayer('#000', {}, 3.5)}</g>
          {/* short extrusion (depth) */}
          {[3.2, 2.4, 1.6, 0.8].map((d) => (
            <g key={d}>{glyphLayer('url(#v2-extrude)', {stroke: 'url(#v2-extrude)', strokeWidth: 1.4, strokeLinejoin: 'round'}, d)}</g>
          ))}
          {/* warm rim glow */}
          <g mask="url(#v2-rimmask)" style={{mixBlendMode: 'screen'}} opacity={p.glow}>
            <g filter="url(#v2-glow)">{glyphLayer(p.accent, {stroke: p.accent, strokeWidth: 3})}</g>
          </g>
          {/* metallic face, slightly emboldened with a same-fill stroke, then specular bevel */}
          <g filter="url(#v2-bevel)">
            {glyphLayer('url(#v2-metal)', {stroke: 'url(#v2-metal)', strokeWidth: 1.5, strokeLinejoin: 'round'})}
          </g>
          {p.sheen > -0.2 && p.sheen < 1.2 && <g style={{mixBlendMode: 'screen'}}>{glyphLayer('url(#v2-sheen)', {stroke: 'url(#v2-sheen)', strokeWidth: 1.5})}</g>}
        </>
      ) : (
        <text
          x={centre}
          y={R.baseline}
          textAnchor="middle"
          fontFamily={fonts.display}
          fontWeight={700}
          fontSize={Math.min(T.smallCapSize, (R.clarity[1] - R.civic[0]) / Math.max(1, p.title!.length * 0.8))}
          fill="url(#v2-metal)"
          opacity={clamp(p.reveal * 1.4)}
          filter="url(#v2-bevel)"
        >
          {p.title!.toUpperCase()}
        </text>
      )}

      {/* descriptor with flanking rules */}
      <g opacity={easeOut(p.descriptor)} transform={`translate(768 0) scale(${1 + 0.05 * (1 - easeOut(p.descriptor))} 1) translate(-768 0)`}>
        {!p.descriptorText || p.descriptorText === T.descriptor.text ? (
          <g fill="#ECE7DE">{T.descriptor.glyphs.map((g, i) => <path key={i} d={g.d} />)}</g>
        ) : (
          <text x={768} y={R.descriptor.baseline} textAnchor="middle" fontFamily={fonts.support} fontWeight={500} fontSize={T.descriptor.size} letterSpacing={T.descriptor.tracking} fill="#ECE7DE">
            {p.descriptorText.toUpperCase()}
          </text>
        )}
        <rect x={R.flankLeft[0]} y={R.flankRuleY - 0.8} width={R.flankLeft[1] - R.flankLeft[0]} height={1.6} fill="url(#v2-rule)" />
        <rect x={R.flankRight[0]} y={R.flankRuleY - 0.8} width={R.flankRight[1] - R.flankRight[0]} height={1.6} fill="url(#v2-rule)" />
      </g>
      {/* lower rule split by the star */}
      <g opacity={clamp(p.rules * 2)}>
        <g transform={`translate(${R.lowerLeft[1]} 0) scale(${easeOut(p.rules)} 1) translate(${-R.lowerLeft[1]} 0)`}>
          <rect x={R.lowerLeft[0]} y={R.lowerRuleY - 0.9} width={R.lowerLeft[1] - R.lowerLeft[0]} height={1.8} fill="url(#v2-rule)" />
        </g>
        <g transform={`translate(${R.lowerRight[0]} 0) scale(${easeOut(p.rules)} 1) translate(${-R.lowerRight[0]} 0)`}>
          <rect x={R.lowerRight[0]} y={R.lowerRuleY - 0.9} width={R.lowerRight[1] - R.lowerRight[0]} height={1.8} fill="url(#v2-rule)" />
        </g>
      </g>
      {p.star > 0 && (
        <g transform={`translate(${R.star.cx} ${R.star.cy}) scale(${(starR * easeOut(p.star)) / 100})`}>
          <path d={logoGeometry.starUnit100} fill="#F4D9A6" stroke="#8a6232" strokeWidth={3} filter="url(#v2-bevel)" />
        </g>
      )}
      {p.gleam > 0 && (
        <g opacity={p.gleam} style={{mixBlendMode: 'screen'}} transform={`translate(${R.star.cx} ${R.star.cy})`}>
          <circle r={starR * 3.2} fill="url(#v2-gleam)" />
          <rect x={-starR * 9} y={-0.6} width={starR * 18} height={1.2} fill="url(#v2-rule)" />
        </g>
      )}
    </g>
  );
};

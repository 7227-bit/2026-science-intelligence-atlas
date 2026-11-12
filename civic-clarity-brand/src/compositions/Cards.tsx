import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, fonts} from '../brand/tokens';
import {loadBrandFonts} from '../brand/fonts';
import {Sky} from '../scene/Sky';
import {GrainVignette, SafeAreaGuides} from '../scene/Atmosphere';
import {Wordmark} from '../components/Wordmark';
import {Mark} from '../components/Mark';

loadBrandFonts();

type SafeMode = 'none' | 'broadcast' | 'social';
const ease = Easing.bezier(0.16, 0.6, 0.3, 1);
const useT = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  return {frame, fps, t: frame / fps, dur: durationInFrames / fps};
};
const io = (t: number, dur: number, inS = 0.6, outS = 0.5) =>
  Math.min(
    interpolate(t, [0, inS], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}),
    interpolate(t, [dur - outS, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );

const Stage: React.FC<{children: React.ReactNode; safeArea?: SafeMode; transparent?: boolean}> = ({children, safeArea = 'none', transparent}) => (
  <AbsoluteFill style={{backgroundColor: transparent ? 'transparent' : '#000'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      {children}
      <SafeAreaGuides mode={safeArea} />
    </svg>
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ */
/* Film title card                                                     */
/* ------------------------------------------------------------------ */
export type TitleCardProps = {
  filmTitle: string;
  subtitle: string;
  presenter: string;
  accentColor: string;
  safeArea: SafeMode;
};
export const titleCardDefaults: TitleCardProps = {
  filmTitle: 'FILM TITLE PLACEHOLDER',
  subtitle: 'Subtitle or framing question — replace per film',
  presenter: 'A CIVIC CLARITY INVESTIGATION',
  accentColor: color.gold,
  safeArea: 'none',
};

export const CivicClarityTitleCard: React.FC<TitleCardProps> = (p) => {
  const {frame, t, dur} = useT();
  const a = io(t, dur, 0.9, 0.7);
  const rule = interpolate(t, [0.3, 1.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const sub = interpolate(t, [0.8, 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return (
    <Stage safeArea={p.safeArea}>
      <g opacity={a}>
        <Sky exposure={0.55} glow={0.35} driftFar={-t * 5} driftNear={-t * 9} parallaxY={0} glowY={760} accent={p.accentColor} idPrefix="tc-sky" />
        <rect width="1920" height="1080" fill={color.midnight} opacity={0.45} />
        <text x={960} y={392} textAnchor="middle" fontFamily={fonts.support} fontWeight={600} fontSize={22} letterSpacing={9} fill={p.accentColor}>
          {p.presenter.toUpperCase()}
        </text>
        <text
          x={960}
          y={540}
          textAnchor="middle"
          fontFamily={fonts.display}
          fontWeight={700}
          fontSize={p.filmTitle.length > 22 ? 84 : 112}
          letterSpacing={4}
          fill={color.ivory}
          transform={`translate(0 ${(1 - a) * 12})`}
        >
          {p.filmTitle.toUpperCase()}
        </text>
        <rect x={960 - 340 * rule} y={590} width={680 * rule} height={2} fill={p.accentColor} />
        <text x={960} y={660} textAnchor="middle" fontFamily={fonts.support} fontWeight={400} fontSize={34} fill={color.steel} opacity={sub}>
          {p.subtitle}
        </text>
        <GrainVignette frame={frame} idPrefix="tc-gv" />
      </g>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Lower third                                                         */
/* ------------------------------------------------------------------ */
export type LowerThirdProps = {
  name: string;
  role: string;
  /** e.g. 'Archival footage', 'Interview recorded 2026' — leave empty if not needed */
  context: string;
  accentColor: string;
  variant: 'full' | 'lowBandwidth';
  safeArea: SafeMode;
};
export const lowerThirdDefaults: LowerThirdProps = {
  name: 'Speaker Name',
  role: 'Title, Organisation',
  context: '',
  accentColor: color.gold,
  variant: 'full',
  safeArea: 'none',
};

/** Transparent overlay. Sits inside the 90% title-safe area, left-aligned. */
export const CivicClarityLowerThird: React.FC<LowerThirdProps> = (p) => {
  const {t, dur} = useT();
  const a = io(t, dur, 0.45, 0.4);
  const bar = interpolate(t, [0, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const x = 96 + 12; // title-safe left (5%) + margin
  const y = 828;
  const w = 880;
  const low = p.variant === 'lowBandwidth';
  return (
    <Stage safeArea={p.safeArea} transparent>
      <g opacity={a}>
        {!low && (
          <>
            <defs>
              <linearGradient id="lt-bg" x1="0" x2="1">
                <stop offset="0" stopColor={color.midnight} stopOpacity="0.9" />
                <stop offset="0.75" stopColor={color.midnight} stopOpacity="0.75" />
                <stop offset="1" stopColor={color.midnight} stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x={x - 24} y={y - 70} width={w * bar} height={p.context ? 150 : 124} fill="url(#lt-bg)" />
          </>
        )}
        {low && <rect x={x - 24} y={y - 70} width={w * 0.82} height={p.context ? 150 : 124} fill="#000" opacity={0.78} />}
        <rect x={x - 24} y={y - 70} width={5} height={(p.context ? 150 : 124) * bar} fill={low ? color.white : p.accentColor} />
        <text x={x} y={y} fontFamily={fonts.support} fontWeight={600} fontSize={46} fill={low ? color.white : color.ivory}>
          {p.name}
        </text>
        <text x={x} y={y + 40} fontFamily={fonts.support} fontWeight={500} fontSize={26} letterSpacing={1} fill={low ? '#e6e6e6' : color.steel}>
          {p.role}
        </text>
        {p.context && (
          <text x={x} y={y + 70} fontFamily={fonts.support} fontWeight={600} fontSize={18} letterSpacing={4} fill={low ? '#e6e6e6' : p.accentColor}>
            {p.context.toUpperCase()}
          </text>
        )}
      </g>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Evidence / source citation card                                     */
/* ------------------------------------------------------------------ */
export type EvidenceKind = 'primary' | 'secondary' | 'analysis' | 'reconstruction';
export type EvidenceCardProps = {
  /** Short claim or quotation exactly as sourced. Never paraphrase a quote. */
  excerpt: string;
  sourceTitle: string;
  publisher: string;
  date: string;
  locator: string;
  kind: EvidenceKind;
  accentColor: string;
  variant: 'full' | 'lowBandwidth';
  safeArea: SafeMode;
};
export const evidenceCardDefaults: EvidenceCardProps = {
  excerpt: 'Excerpt placeholder — paste the exact sourced wording here.',
  sourceTitle: 'Source document title',
  publisher: 'Publishing organisation',
  date: 'YYYY-MM-DD',
  locator: 'Section / page / URL',
  kind: 'primary',
  accentColor: color.gold,
  variant: 'full',
  safeArea: 'none',
};
const KIND_LABEL: Record<EvidenceKind, string> = {
  primary: 'PRIMARY SOURCE',
  secondary: 'SECONDARY ANALYSIS',
  analysis: 'CIVIC CLARITY ANALYSIS',
  reconstruction: 'ILLUSTRATIVE RECONSTRUCTION',
};

/** Clean editorial card — deliberately NOT styled as a document, stamp or seal. */
export const CivicClarityEvidenceCard: React.FC<EvidenceCardProps> = (p) => {
  const {frame, t, dur} = useT();
  const a = io(t, dur, 0.5, 0.45);
  const low = p.variant === 'lowBandwidth';
  const words = p.excerpt.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 46) {
      lines.push(line.trim());
      line = w;
    } else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  const kindColor = p.kind === 'reconstruction' || p.kind === 'analysis' ? color.steel : p.accentColor;
  return (
    <Stage safeArea={p.safeArea}>
      {low ? <rect width="1920" height="1080" fill="#0b0f16" /> : <Sky exposure={0.4} glow={0.12} driftFar={-t * 3} driftNear={-t * 5} parallaxY={0} glowY={900} idPrefix="ev-sky" />}
      {!low && <rect width="1920" height="1080" fill={color.midnight} opacity={0.6} />}
      <g opacity={a} transform={`translate(0 ${(1 - a) * 10})`}>
        <rect x={240} y={250} width={1440} height={560} rx={6} fill={low ? '#121a26' : color.navy} opacity={low ? 1 : 0.92} stroke={low ? '#3a4658' : color.civicBlue} strokeWidth={2} />
        <rect x={240} y={250} width={8} height={560} fill={kindColor} />
        <text x={300} y={322} fontFamily={fonts.support} fontWeight={700} fontSize={22} letterSpacing={6} fill={kindColor}>
          {KIND_LABEL[p.kind]}
        </text>
        {lines.slice(0, 4).map((l, i) => (
          <text key={i} x={300} y={418 + i * 66} fontFamily={fonts.support} fontWeight={500} fontSize={50} fill={color.ivory}>
            {i === 0 && p.kind !== 'analysis' ? '“' : ''}
            {l}
            {i === Math.min(lines.length, 4) - 1 && p.kind !== 'analysis' ? '”' : ''}
          </text>
        ))}
        <rect x={300} y={700} width={1320} height={1.5} fill={color.civicBlue} />
        <text x={300} y={748} fontFamily={fonts.support} fontWeight={600} fontSize={28} fill={color.steel}>
          {p.sourceTitle}
        </text>
        <text x={300} y={786} fontFamily={fonts.support} fontWeight={400} fontSize={24} fill={color.steel} opacity={0.9}>
          {`${p.publisher} · ${p.date} · ${p.locator}`}
        </text>
      </g>
      {!low && <GrainVignette frame={frame} grain={0.04} idPrefix="ev-gv" />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* End card                                                            */
/* ------------------------------------------------------------------ */
export type EndCardProps = {
  callToAction: string;
  accentColor: string;
  /** Leave the two 16:9 end-screen slots clear for YouTube elements */
  showEndScreenSlots: boolean;
  safeArea: SafeMode;
};
export const endCardDefaults: EndCardProps = {
  callToAction: 'Investigate like a journalist. Explain like an educator. Present like a filmmaker.',
  accentColor: color.gold,
  showEndScreenSlots: false,
  safeArea: 'none',
};
export const CivicClarityEndCard: React.FC<EndCardProps> = (p) => {
  const {frame, t, dur} = useT();
  const a = io(t, dur, 0.8, 0.8);
  return (
    <Stage safeArea={p.safeArea}>
      <g opacity={a}>
        <Sky exposure={0.8} glow={0.55} driftFar={-t * 4} driftNear={-t * 8} parallaxY={0} glowY={560} accent={p.accentColor} idPrefix="ec-sky" />
        <rect width="1920" height="1080" fill={color.midnight} opacity={0.35} />
        <Mark cx={960} cy={250} size={190} material="metallic" accent={p.accentColor} idPrefix="ec-mark" />
        <Wordmark cx={960} top={390} width={900} material="metallic" glow={0.35} sheen={-1} accent={p.accentColor} idPrefix="ec-wm" />
        <text x={960} y={720} textAnchor="middle" fontFamily={fonts.support} fontWeight={500} fontSize={30} fill={color.steel}>
          {p.callToAction}
        </text>
        {p.showEndScreenSlots && (
          <g opacity={0.6}>
            <rect x={150} y={770} width={600} height={240} fill="none" stroke={color.steel} strokeDasharray="10 8" />
            <rect x={1170} y={770} width={600} height={240} fill="none" stroke={color.steel} strokeDasharray="10 8" />
            <text x={450} y={895} textAnchor="middle" fontFamily={fonts.support} fontSize={20} fill={color.steel}>
              END-SCREEN ELEMENT
            </text>
            <text x={1470} y={895} textAnchor="middle" fontFamily={fonts.support} fontSize={20} fill={color.steel}>
              END-SCREEN ELEMENT
            </text>
          </g>
        )}
        <GrainVignette frame={frame} idPrefix="ec-gv" />
      </g>
    </Stage>
  );
};

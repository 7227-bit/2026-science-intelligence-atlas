import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {color, fonts} from '../brand/tokens';
import {loadBrandFonts} from '../brand/fonts';
import {Sky} from '../scene/Sky';
import {Capitol} from '../scene/Capitol';
import {Flag} from '../scene/Flag';
import {GrainVignette, HaloArc} from '../scene/Atmosphere';
import {Wordmark} from '../components/Wordmark';
import {Mark} from '../components/Mark';

loadBrandFonts();

/* ------------------------------------------------------------------ */
/* YouTube avatar — 1024 x 1024, designed for circular crop            */
/* ------------------------------------------------------------------ */
export type AvatarProps = {variant: 'star' | 'dome'; showCropGuide: boolean; accentColor: string};
export const avatarDefaults: AvatarProps = {variant: 'star', showCropGuide: false, accentColor: color.gold};

export const CivicClarityAvatar: React.FC<AvatarProps> = ({variant, showCropGuide, accentColor}) => (
  <AbsoluteFill style={{backgroundColor: color.midnight}}>
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <defs>
        <radialGradient id="av-bg" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stopColor="#13304f" />
          <stop offset="0.6" stopColor={color.navy} />
          <stop offset="1" stopColor={color.midnight} />
        </radialGradient>
        <radialGradient id="av-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={accentColor} stopOpacity="0.28" />
          <stop offset="1" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#av-bg)" />
      <circle cx="560" cy="512" r="300" fill="url(#av-glow)" />
      {/* Ring at 84% of the crop diameter, stroke weighted to survive 48 px display */}
      <Mark cx={512} cy={512} size={860} variant={variant} material="metallic" ringWidth={30} accent={accentColor} idPrefix="av" />
      {showCropGuide && <circle cx="512" cy="512" r="512" fill="none" stroke="#ff4fa3" strokeWidth="4" strokeDasharray="14 10" />}
    </svg>
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ */
/* YouTube banner — 2560 x 1440                                        */
/* ------------------------------------------------------------------ */
export type BannerProps = {showSafeGuides: boolean; accentColor: string};
export const bannerDefaults: BannerProps = {showSafeGuides: false, accentColor: color.gold};

/**
 * YouTube channel-art regions (YouTube Help, "Manage your channel's branding"):
 *  - TV: full 2560x1440
 *  - Desktop max: 2560x423 centred band
 *  - Min safe area for text & logos on all devices: 1546x423 centred
 */
const SAFE = {w: 1546, h: 423};
export const CivicClarityBanner: React.FC<BannerProps> = ({showSafeGuides, accentColor}) => {
  const sx = (2560 - SAFE.w) / 2;
  const sy = (1440 - SAFE.h) / 2;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <svg viewBox="0 0 2560 1440" width="100%" height="100%">
        <g transform={`scale(${1440 / 1080})`}>
          <Sky exposure={1} glow={0.8} driftFar={0} driftNear={0} parallaxY={0} glowX={1440} glowY={560} accent={accentColor} idPrefix="bn-sky" />
          <Flag time={0.6} opacity={0.75} x={-160} y={250} width={900} idPrefix="bn-flag" />
        </g>
        {/* Decorative Capitol, right of the safe area: visible on desktop/TV, may crop on mobile by design */}
        <g transform="translate(1290 0)">
          <HaloArc progress={1} intensity={0.8} cx={830} cy={890} r={330} accent={accentColor} idPrefix="bn-halo" />
          <Capitol cx={830} base={1020} scale={0.62} keyLight={0.9} rimLight={1} presence={1} idPrefix="bn-cap" />
        </g>
        <defs>
          <linearGradient id="bn-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#03070d" stopOpacity="0" />
            <stop offset="1" stopColor="#020407" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="bn-left" x1="0" x2="1">
            <stop offset="0.25" stopColor={color.midnight} stopOpacity="0.0" />
            <stop offset="0.5" stopColor={color.midnight} stopOpacity="0.55" />
            <stop offset="0.72" stopColor={color.midnight} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <rect x="0" y="960" width="2560" height="480" fill="url(#bn-ground)" />
        <rect x="0" y={sy} width="2560" height={SAFE.h} fill="url(#bn-left)" />
        {/* Critical content: wordmark lockup entirely inside 1546x423 */}
        <Wordmark cx={1280} top={sy + 70} width={1180} material="metallic" glow={0.45} sheen={-1} accent={accentColor} idPrefix="bn-wm" />
        <svg x={0} y={0} width={2560} height={1440} viewBox="0 0 1920 1080" preserveAspectRatio="none">
          <GrainVignette frame={12} grain={0.05} vignette={0.55} idPrefix="bn-gv" />
        </svg>
        {showSafeGuides && (
          <g fontFamily="Montserrat, Arial" fontSize={26}>
            <rect x={0} y={sy} width={2560} height={SAFE.h} fill="none" stroke="#36e0ff" strokeWidth={4} strokeDasharray="18 10" />
            <text x={20} y={sy - 14} fill="#36e0ff">DESKTOP MAX 2560 × 423</text>
            <rect x={sx} y={sy} width={SAFE.w} height={SAFE.h} fill="none" stroke="#ff4fa3" strokeWidth={5} />
            <text x={sx + 16} y={sy + SAFE.h + 38} fill="#ff4fa3">SAFE AREA ALL DEVICES 1546 × 423</text>
            <rect x={2} y={2} width={2556} height={1436} fill="none" stroke="#ffd34f" strokeWidth={4} strokeDasharray="6 10" />
            <text x={20} y={44} fill="#ffd34f">TV 2560 × 1440</text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Thumbnail templates — 1280 x 720                                    */
/* ------------------------------------------------------------------ */
export type ThumbnailProps = {
  template: 'institution' | 'evidence';
  /** 2–5 words. Upper-cased. */
  headline: string;
  /** word(s) in the headline to set in the accent colour */
  highlight: string;
  kicker: string;
  /** Optional film-specific image in /public (verified, cleared imagery only). Empty => vector key art. */
  imageSrc: string;
  accentColor: string;
  showSafeGuides: boolean;
};
export const thumbnailDefaults: ThumbnailProps = {
  template: 'institution',
  headline: 'WHO WRITES THE RULES?',
  highlight: 'RULES',
  kicker: 'PLACEHOLDER TOPIC',
  imageSrc: '',
  accentColor: color.gold,
  showSafeGuides: false,
};

const Headline: React.FC<{text: string; highlight: string; x: number; y: number; size: number; maxChars: number; anchor?: 'start' | 'middle'; accent: string}> = ({
  text,
  highlight,
  x,
  y,
  size,
  maxChars,
  anchor = 'start',
  accent,
}) => {
  const words = text.toUpperCase().split(/\s+/);
  const hi = new Set(highlight.toUpperCase().split(/\s+/).filter(Boolean));
  const lines: string[][] = [[]];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ([...cur, w].join(' ').length > maxChars && cur.length) lines.push([w]);
    else cur.push(w);
  }
  return (
    <g>
      {lines.map((ln, i) => (
        <text
          key={i}
          x={x}
          y={y + i * size * 1.02}
          textAnchor={anchor}
          fontFamily={fonts.support}
          fontWeight={700}
          fontSize={size}
          letterSpacing={-1}
          stroke="#02050a"
          strokeWidth={size * 0.09}
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {ln.map((w, j) => (
            <tspan key={j} fill={hi.has(w.replace(/[^A-Z0-9]/g, '')) ? accent : color.ivory}>
              {w}
              {j < ln.length - 1 ? ' ' : ''}
            </tspan>
          ))}
        </text>
      ))}
    </g>
  );
};

export const CivicClarityThumbnail: React.FC<ThumbnailProps> = (p) => {
  const accent = p.accentColor;
  const image = p.imageSrc ? (
    <Img src={staticFile(p.imageSrc)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
  ) : null;
  if (p.template === 'institution') {
    return (
      <AbsoluteFill style={{backgroundColor: '#000'}}>
        {image}
        <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          {!image && (
            <g transform={`scale(${720 / 1080})`}>
              <Sky exposure={1} glow={0.95} driftFar={0} driftNear={0} parallaxY={0} glowX={1350} glowY={600} accent={accent} idPrefix="th-sky" />
              <HaloArc progress={1} intensity={0.85} cx={1350} cy={720} r={430} accent={accent} idPrefix="th-halo" />
              <Capitol cx={1350} base={880} scale={1.05} keyLight={1} rimLight={1} presence={1} idPrefix="th-cap" />
            </g>
          )}
          <defs>
            <linearGradient id="th-l" x1="0" x2="1">
              <stop offset="0" stopColor="#02050a" stopOpacity="0.92" />
              <stop offset="0.55" stopColor="#02050a" stopOpacity="0.55" />
              <stop offset="0.75" stopColor="#02050a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="1280" height="720" fill="url(#th-l)" />
          <text x={64} y={120} fontFamily={fonts.support} fontWeight={700} fontSize={26} letterSpacing={6} fill={accent}>
            {p.kicker.toUpperCase()}
          </text>
          <Headline text={p.headline} highlight={p.highlight} x={60} y={232} size={104} maxChars={11} accent={accent} />
          {/* Studio tag — kept small and out of YouTube's bottom-right timestamp zone */}
          <g transform="translate(64 610)">
            <Mark cx={34} cy={34} size={68} material="metallic" ringWidth={30} accent={accent} idPrefix="th-mark" />
            <text x={84} y={46} fontFamily={fonts.display} fontWeight={700} fontSize={30} letterSpacing={2} fill={color.ivory}>
              CIVIC CLARITY
            </text>
          </g>
          <svg x={0} y={0} width={1280} height={720} viewBox="0 0 1920 1080">
            <GrainVignette frame={3} grain={0.05} vignette={0.45} idPrefix="th-gv" />
          </svg>
          {p.showSafeGuides && <ThumbGuides />}
        </svg>
      </AbsoluteFill>
    );
  }
  // evidence template
  return (
    <AbsoluteFill style={{backgroundColor: color.midnight}}>
      <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="th-frame">
            <rect x={0} y={0} width={660} height={720} />
          </clipPath>
        </defs>
        <g clipPath="url(#th-frame)">
          {image ? null : (
            <g transform={`translate(-300 -30) scale(${760 / 1080})`}>
              <Sky exposure={1} glow={0.9} driftFar={-200} driftNear={-80} parallaxY={0} glowX={960} glowY={420} accent={accent} idPrefix="te-sky" />
              <Flag time={1.3} opacity={0.85} x={80} y={-40} width={1150} rotate={-3} idPrefix="te-flag" />
              <Capitol cx={960} base={760} scale={1.15} keyLight={1} rimLight={1} presence={1} idPrefix="te-cap" />
            </g>
          )}
        </g>
        {image && (
          <foreignObject x={0} y={0} width={660} height={720}>
            <Img src={staticFile(p.imageSrc)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </foreignObject>
        )}
        <rect x={660} y={0} width={620} height={720} fill={color.navy} />
        <rect x={656} y={0} width={8} height={720} fill={accent} />
        <text x={712} y={110} fontFamily={fonts.support} fontWeight={700} fontSize={24} letterSpacing={6} fill={accent}>
          {p.kicker.toUpperCase()}
        </text>
        <Headline text={p.headline} highlight={p.highlight} x={708} y={210} size={76} maxChars={9} accent={accent} />
        <g transform="translate(712 600)">
          <Mark cx={30} cy={30} size={60} material="flat" ringWidth={30} accent={accent} idPrefix="te-mark" />
          <text x={76} y={41} fontFamily={fonts.display} fontWeight={700} fontSize={26} letterSpacing={2} fill={color.ivory}>
            CIVIC CLARITY
          </text>
        </g>
        <svg x={0} y={0} width={1280} height={720} viewBox="0 0 1920 1080">
          <GrainVignette frame={5} grain={0.05} vignette={0.3} idPrefix="te-gv" />
        </svg>
        {p.showSafeGuides && <ThumbGuides />}
      </svg>
    </AbsoluteFill>
  );
};

/** Bottom-right duration badge zone + 5% margin guide. */
const ThumbGuides: React.FC = () => (
  <g fontFamily="Montserrat, Arial" fontSize={16}>
    <rect x={64} y={36} width={1152} height={648} fill="none" stroke="#ff4fa3" strokeWidth={2} strokeDasharray="10 6" />
    <rect x={1100} y={640} width={170} height={70} fill="#ff4fa3" opacity={0.25} />
    <text x={1104} y={632} fill="#ff4fa3">TIMESTAMP ZONE</text>
  </g>
);

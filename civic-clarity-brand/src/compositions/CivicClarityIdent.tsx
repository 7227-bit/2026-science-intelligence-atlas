import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, getStaticFiles, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {color} from '../brand/tokens';
import {loadBrandFonts} from '../brand/fonts';
import {Sky} from '../scene/Sky';
import {Capitol} from '../scene/Capitol';
import {Flag} from '../scene/Flag';
import {GrainVignette, HaloArc, LightRays, SafeAreaGuides} from '../scene/Atmosphere';
import {Wordmark} from '../components/Wordmark';

loadBrandFonts();

export type IdentLayout = 'cinematic' | 'wordmarkOnly';
export type IdentTransition = 'hold' | 'fadeToBlack';

export type CivicClarityIdentProps = {
  /** Visible title. 'CIVIC CLARITY' uses the outlined master; anything else falls back to live Cinzel text. */
  title: string;
  descriptor: string;
  accentColor: string;
  /** Ident length in seconds (3.5–6). The 4.5 s master timeline is scaled; the audio resolve stays synced. */
  durationInSeconds: number;
  muted: boolean;
  layout: IdentLayout;
  safeArea: 'none' | 'broadcast' | 'social';
  transition: IdentTransition;
  showFlag: boolean;
  /** Transparent background, title layers only (alpha overlay deliverable). */
  alphaOverlay: boolean;
  /** Relative path inside /public. Missing or empty => silent. */
  audioSrc: string;
};

export const identDefaults: CivicClarityIdentProps = {
  title: 'CIVIC CLARITY',
  descriptor: 'INVESTIGATIVE DOCUMENTARIES',
  accentColor: color.gold,
  durationInSeconds: 4.5,
  muted: false,
  layout: 'cinematic',
  safeArea: 'none',
  transition: 'hold',
  showFlag: true,
  alphaOverlay: false,
  audioSrc: 'audio/civic-clarity-sonic-ident.wav',
};

/** Master timeline (seconds on the 4.5 s reference). See BRAND_SPEC.md §Motion. */
export const TIMELINE = {
  atmosphere: [0, 0.7],
  reveal: [0.7, 1.7],
  title: [1.7, 3.2],
  resolve: 3.2,
  tail: [4.0, 4.5],
} as const;
export const MASTER_DURATION = 4.5;

/** Fallback: if the cue has not been synthesised yet (npm run audio), render silently instead of failing. */
const audioAvailable = (src: string) => {
  if (!src) return false;
  try {
    return getStaticFiles().some((f) => f.name === src);
  } catch {
    return true;
  }
};

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const easeOutSoft = Easing.bezier(0.16, 0.6, 0.3, 1);

export const CivicClarityIdent: React.FC<CivicClarityIdentProps> = (props) => {
  const p = {...identDefaults, ...props};
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const secs = frame / fps;
  const k = MASTER_DURATION / (durationInFrames / fps); // map real time -> master timeline
  const t = secs * k;

  const f = (input: number[], output: number[], easing = ease) =>
    interpolate(t, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

  // Camera
  const camScale = f([0, 4.5], [1.13, 1.0], easeOutSoft);
  const camY = f([0, 2.4], [26, 0], easeOutSoft);
  // Environment
  const exposure = f([0, 0.7, 1.7], [0.3, 0.5, 1]);
  const glow = f([0, 0.7, 1.7, 3.2, 3.45, 4.5], [0.03, 0.14, 0.82, 0.86, 1.0, 0.92]);
  const presence = f([0, 0.7], [0.4, 1]);
  const keyLight = f([0.55, 2.1], [0.0, 0.92]) + f([3.2, 3.45], [0, 0.08]);
  const rimLight = f([0.6, 1.7, 3.2, 3.4, 4.5], [0, 1, 0.9, 1.1, 0.95]);
  const archLift = f([0.2, 2.2], [70, 0], easeOutSoft);
  const tierLift = f([0.2, 2.2], [14, 0], easeOutSoft);
  const flagOpacity = f([0.45, 1.6], [0, 0.78]);
  const haloProgress = f([0.95, 2.25], [0, 1], easeOutSoft);
  const haloIntensity = f([0.95, 1.2, 3.2, 3.38, 4.0], [0, 0.85, 0.85, 1.15, 0.95]);
  const rays = f([0.8, 1.8, 3.2, 3.4, 4.5], [0, 0.3, 0.3, 0.42, 0.34]);
  // Title
  const reveal = f([1.7, 2.95], [0, 1], Easing.linear);
  const sheen = f([2.2, 3.3], [-0.25, 1.25], Easing.inOut(Easing.cubic));
  const titleGlow = f([1.75, 2.5, 3.1, 3.3, 4.5], [0, 0.65, 0.4, 0.85, 0.45]);
  const rule = f([1.85, 2.7], [0, 1], easeOutSoft);
  const descriptor = f([2.45, 3.15], [0, 1], easeOutSoft);
  const star = f([3.1, 3.32], [0, 1], easeOutSoft);
  const gleam = f([3.14, 3.24, 3.85], [0, 1, 0], Easing.out(Easing.quad));
  const streakW = f([1.72, 2.15, 2.9], [0.05, 1, 1.15], easeOutSoft);
  const streakO = f([1.72, 1.95, 2.9, 3.2, 3.3, 3.9], [0, 0.85, 0.22, 0.22, 0.6, 0.18]);
  const fade = p.transition === 'fadeToBlack' ? f([4.05, 4.5], [1, 0]) : 1;

  // Audio: keep the cue's resolve hit (3.2 s into the file) aligned with the scaled visual resolve.
  const resolveReal = TIMELINE.resolve / k;
  const audioOffsetFrames = Math.round((resolveReal - TIMELINE.resolve) * fps);

  const W = 1240;
  const cx = 960;
  const titleTop = p.layout === 'cinematic' ? 586 : 430;
  const accent = p.accentColor;
  const cinematic = p.layout === 'cinematic';

  const titleLayer = (
    <>
      {/* anamorphic light streak behind the title — not a lens-flare preset */}
      <g opacity={streakO} style={{mixBlendMode: 'screen'}}>
        <defs>
          <linearGradient id="streak" x1="0" x2="1">
            <stop offset="0" stopColor={accent} stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff0d2" stopOpacity="1" />
            <stop offset="1" stopColor={accent} stopOpacity="0" />
          </linearGradient>
          <filter colorInterpolationFilters="sRGB" id="streakBlur" x="-10%" y="-400%" width="120%" height="900%">
            <feGaussianBlur stdDeviation="2.5 5" />
          </filter>
        </defs>
        <rect
          x={cx - (W * 0.75 * streakW) / 2}
          y={titleTop + 160}
          width={W * 0.75 * streakW}
          height={5}
          fill="url(#streak)"
          filter="url(#streakBlur)"
        />
        <rect x={cx - (W * 0.6 * streakW) / 2} y={titleTop + 161.6} width={W * 0.6 * streakW} height={1.6} fill="url(#streak)" />
      </g>
      <Wordmark
        cx={cx}
        top={titleTop}
        width={W}
        material="metallic"
        reveal={reveal}
        sheen={sheen}
        glow={titleGlow}
        depth={1}
        rule={rule}
        descriptor={descriptor}
        star={star}
        gleam={gleam}
        title={p.title}
        descriptorText={p.descriptor}
        accent={accent}
        idPrefix="ident-wm"
      />
    </>
  );

  return (
    <AbsoluteFill style={{backgroundColor: p.alphaOverlay ? 'transparent' : '#000'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        {!p.alphaOverlay && (
          <g opacity={fade}>
            <g transform={`translate(960 540) scale(${camScale}) translate(-960 ${-540 + camY})`}>
              <Sky exposure={exposure} glow={glow} driftFar={-t * 6} driftNear={-t * 14} parallaxY={archLift * 0.4} accent={accent} />
              <LightRays intensity={rays} rotation={t * 1.1} />
              {p.showFlag && <Flag time={t} opacity={flagOpacity} x={-150 - t * 4} y={-80 + archLift * 0.15} />}
              <HaloArc progress={haloProgress} intensity={haloIntensity} accent={accent} cy={600 + archLift * 0.6} />
              {cinematic && (
                <g transform={`translate(0 ${archLift})`}>
                  <Capitol keyLight={keyLight} rimLight={rimLight} presence={presence} lift={tierLift} base={712} />
                </g>
              )}
              {/* foreground falloff so the title and descriptor sit on clean dark ground */}
              <defs>
                <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#03070d" stopOpacity="0" />
                  <stop offset="0.3" stopColor="#03070d" stopOpacity="0.88" />
                  <stop offset="1" stopColor="#020407" stopOpacity="1" />
                </linearGradient>
              </defs>
              <rect x={-200} y={575} width={2320} height={680} fill="url(#ground)" />
            </g>
            {titleLayer}
            <GrainVignette frame={frame} grain={0.06} vignette={0.7} />
          </g>
        )}
        {p.alphaOverlay && titleLayer}
        <SafeAreaGuides mode={p.safeArea} />
      </svg>
      {!p.muted && !p.alphaOverlay && audioAvailable(p.audioSrc) && (
        <Sequence from={Math.max(0, audioOffsetFrames)} layout="none">
          <Audio src={staticFile(p.audioSrc)} trimBefore={Math.max(0, -audioOffsetFrames)} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, getStaticFiles, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {color} from '../brand/tokens';
import {loadBrandFonts} from '../brand/fonts';
import {GrainVignette, SafeAreaGuides} from '../scene/Atmosphere';
import {PlateGL} from '../v2/PlateGL';
import {CinematicTitle} from '../v2/CinematicTitle';
import {ARC, Camera, FLARES, GLOW_POS, worldToDesign} from '../v2/plateLayout';
import {MASTER_DURATION, TIMELINE, identDefaults, type CivicClarityIdentProps} from './CivicClarityIdent';

loadBrandFonts();

/**
 * v2 ident (Revision Round 2): composited from the owner-selected reference artwork.
 * Same props, same 4.5 s master timeline and the same original audio cue as v1 (v1 is unchanged).
 */
export const identV2Defaults: CivicClarityIdentProps = {...identDefaults};

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

/** World-space halo arc (measured from the reference) with draw-on and flares. */
const Arc: React.FC<{cam: Camera; off: [number, number]; progress: number; intensity: number}> = ({cam, off, progress, intensity}) => {
  const {cx, cy, r} = ARC;
  // reference arc spans roughly +-57 degrees from the apex before it meets the roofline
  const span = 57 * Math.max(0, Math.min(1, progress));
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  };
  const arc = (to: number) => `M${pt(0)}A${r} ${r} 0 0 ${to > 0 ? 1 : 0} ${pt(to)}`;
  const fo = Math.max(0, (progress - 0.55) / 0.45);
  return (
    <g transform={worldToDesign(cam, off)} opacity={intensity} style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter colorInterpolationFilters="sRGB" id="v2-arcglow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter colorInterpolationFilters="sRGB" id="v2-arcglow2" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <radialGradient id="v2-flare">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="1" />
          <stop offset="0.15" stopColor="#ffd790" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#e9893a" stopOpacity="0.25" />
          <stop offset="1" stopColor="#c56a2a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[arc(-span), arc(span)].map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#e98a3c" strokeWidth={13} opacity={0.32} filter="url(#v2-arcglow)" />
          <path d={d} fill="none" stroke="#ffc779" strokeWidth={3.2} opacity={0.65} filter="url(#v2-arcglow2)" />
          <path d={d} fill="none" stroke="#fff3dc" strokeWidth={1.05} strokeLinecap="round" />
        </g>
      ))}
      {FLARES.map(([x, y], i) => (
        <g key={i} opacity={fo}>
          <circle cx={x} cy={y} r={30} fill="url(#v2-flare)" />
          <ellipse cx={x} cy={y} rx={22} ry={0.8} fill="#fff1d6" opacity={0.4} />
        </g>
      ))}
    </g>
  );
};

export const CivicClarityIdentV2: React.FC<CivicClarityIdentProps> = (props) => {
  const p = {...identV2Defaults, ...props};
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const k = MASTER_DURATION / (durationInFrames / fps);
  const t = (frame / fps) * k;
  const f = (input: number[], output: number[], easing = ease) =>
    interpolate(t, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

  // Camera: slow pull-back reveal that settles into the reference composition by ~3.6 s
  const cam: Camera = {
    scale: f([0, 3.6], [1.14, 1.0], easeOutSoft),
    focus: [960, 400],
    off: [0, f([0, 3.2], [-14, 0], easeOutSoft)],
  };
  // 2.5D parallax: Capitol rises slightly faster than the sky
  const capOff: [number, number] = [0, f([0, 2.6], [7, 0], easeOutSoft)];
  const skyOff: [number, number] = [f([0, 4.5], [5, -2], Easing.linear), f([0, 2.6], [2, 0], easeOutSoft)];

  const exposure = f([0, 0.7, 1.7, 3.2, 3.45, 4.5], [0.16, 0.34, 1.0, 1.0, 1.07, 1.04]);
  const saturation = f([0, 0.7, 1.7], [0.35, 0.55, 1.0]);
  const cool = f([0, 0.7, 1.6], [1, 0.8, 0]);
  const glow = f([0.6, 1.7, 3.2, 3.45, 4.5], [0, 0.55, 0.55, 1.0, 0.75]);
  const key = f([0.7, 2.0, 3.2, 3.45], [0, 0.35, 0.35, 0.6]);
  const rim = f([0.8, 1.8, 3.2, 3.4, 4.5], [0, 0.6, 0.6, 1.0, 0.8]);
  const sweep = f([2.6, 3.7], [560, 980], Easing.inOut(Easing.cubic));

  const arcProgress = f([0.95, 2.25], [0, 1], easeOutSoft);
  const arcIntensity = f([0.95, 1.2, 3.2, 3.38, 4.0], [0, 0.9, 0.9, 1.1, 0.95]);

  const reveal = f([1.7, 2.95], [0, 1], Easing.linear);
  const sheen = f([2.25, 3.3], [-0.25, 1.25], Easing.inOut(Easing.cubic));
  const titleGlow = f([1.75, 2.5, 3.1, 3.3, 4.5], [0, 0.75, 0.5, 0.95, 0.6]);
  const line = f([1.72, 2.4], [0.05, 1], easeOutSoft);
  const lineIntensity = f([1.72, 1.95, 2.9, 3.2, 3.32, 4.5], [0, 1, 0.75, 0.75, 1, 0.85]);
  const burst = f([1.72, 2.0, 2.9, 3.2, 3.32, 4.5], [0, 1, 0.6, 0.6, 0.95, 0.7]);
  const descriptor = f([2.45, 3.15], [0, 1], easeOutSoft);
  const rules = f([2.6, 3.2], [0, 1], easeOutSoft);
  const star = f([3.1, 3.32], [0, 1], easeOutSoft);
  const gleam = f([3.14, 3.24, 3.85], [0, 1, 0], Easing.out(Easing.quad));
  const fade = p.transition === 'fadeToBlack' ? f([4.05, 4.5], [1, 0]) : 1;

  const resolveReal = TIMELINE.resolve / k;
  const audioOffsetFrames = Math.round((resolveReal - TIMELINE.resolve) * fps);
  const accent = p.accentColor || color.gold;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fade}}>
        <PlateGL
          width={width}
          height={height}
          u={{
            camera: cam,
            skyOff,
            capOff,
            time: t,
            exposure,
            saturation,
            cool,
            flagAmp: p.showFlag ? 2.4 : 0,
            cloudAmp: 1.1,
            key,
            rim,
            sweep,
            glow,
            glowPos: GLOW_POS,
            lift: 0,
          }}
        />
        <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          <Arc cam={cam} off={skyOff} progress={arcProgress} intensity={arcIntensity} />
          <CinematicTitle
            reveal={reveal}
            sheen={sheen}
            glow={titleGlow}
            line={line}
            lineIntensity={lineIntensity}
            burst={burst}
            descriptor={descriptor}
            rules={rules}
            star={star}
            gleam={gleam}
            accent={accent}
            title={p.title}
            descriptorText={p.descriptor}
          />
          <GrainVignette frame={frame} grain={0.05} vignette={0.45} idPrefix="v2-gv" />
          <SafeAreaGuides mode={p.safeArea} />
        </svg>
      </AbsoluteFill>
      {!p.muted && audioAvailable(p.audioSrc) && (
        <Sequence from={Math.max(0, audioOffsetFrames)} layout="none">
          <Audio src={staticFile(p.audioSrc)} trimBefore={Math.max(0, -audioOffsetFrames)} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

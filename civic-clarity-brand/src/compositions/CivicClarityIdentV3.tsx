import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, getStaticFiles, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {GrainVignette, SafeAreaGuides} from '../scene/Atmosphere';
import {PlateGLV3, V3} from '../v3/PlateGLV3';
import {MASTER_DURATION, TIMELINE, identDefaults, type CivicClarityIdentProps} from './CivicClarityIdent';
import layout from '../v3/layout.json';

/**
 * V3 ident — Visual Fidelity Correction. The hero frame (4.0–4.5 s) is the owner's reference
 * composition at full width with its own lettering, light, rules, star and arc (ESRGAN x4),
 * extended to 16:9 with sky above (34%) and ground below (15%). Same props, timeline and
 * original audio as V1/V2 (both unchanged). Note: V3's title is the reference artwork's own
 * lettering, so `title`/`descriptor`/`accentColor` overrides are not applied (use V2 for custom titles).
 */
export const identV3Defaults: CivicClarityIdentProps = {...identDefaults};

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

export const CivicClarityIdentV3: React.FC<CivicClarityIdentProps & {plateDir?: string}> = ({plateDir, ...props}) => {
  const p = {...identV3Defaults, ...props};
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const k = MASTER_DURATION / (durationInFrames / fps);
  const t = (frame / fps) * k;
  const f = (input: number[], output: number[], easing = ease) =>
    interpolate(t, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

  // letters reveal centre-out (by distance of each letter from the title centre)
  const centres: number[] = layout.letter_centres_x;
  const mid = 768;
  const maxD = Math.max(...centres.map((c) => Math.abs(c - mid)));
  const reveal = f([1.7, 2.95], [0, 1], Easing.linear);
  const letters = centres.map((c) => {
    const d = Math.abs(c - mid) / maxD;
    const x = Math.max(0, Math.min(1, (reveal - d * 0.45) / 0.55));
    return 1 - Math.pow(1 - x, 3);
  });

  const fade = p.transition === 'fadeToBlack' ? f([4.05, 4.5], [1, 0]) : 1;
  const resolveReal = TIMELINE.resolve / k;
  const audioOffsetFrames = Math.round((resolveReal - TIMELINE.resolve) * fps);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fade}}>
        <PlateGLV3
          plateDir={plateDir}
          width={width}
          height={height}
          u={{
            // camera: slow pull-back from the dome that lands exactly on the reference framing at 3.6 s
            camScale: f([0, 3.6], [1.16, 1.0], easeOutSoft),
            camFocus: [0.5, 0.56],
            camOff: [0, f([0, 3.2], [-10, 0], easeOutSoft)],
            skyOff: [f([0, 3.6], [6, 0], easeOutSoft), f([0, 2.6], [2, 0], easeOutSoft)],
            capOff: [0, f([0, 2.6], [7, 0], easeOutSoft)],
            time: t,
            exposure: f([0, 0.7, 1.7], [0.16, 0.34, 1.0]),
            saturation: f([0, 0.7, 1.7], [0.35, 0.55, 1.0]),
            cool: f([0, 0.7, 1.6], [1, 0.8, 0]),
            flagAmp: p.showFlag ? f([0, 3.4, 4.0], [2.4, 2.4, 1.2]) : 0,
            cloudAmp: f([0, 3.4, 4.0], [1.1, 1.1, 0]),
            letters,
            facade: f([1.7, 3.0], [0, 1]),
            line: f([1.72, 2.4], [0.05, 1], easeOutSoft),
            lineI: f([1.72, 1.95], [0, 1]),
            desc: f([2.45, 3.15], [0, 1], easeOutSoft),
            rules: f([2.6, 3.2], [0, 1], easeOutSoft),
            star: f([3.1, 3.32], [0, 1], easeOutSoft),
            arc: f([0.95, 2.25], [0, 1], easeOutSoft),
            settle: f([3.55, 4.0], [0, 1]),
            sweepX: f([2.6, 3.7], [560, 980], Easing.inOut(Easing.cubic)),
            sweepI: f([2.6, 2.8, 3.5, 3.75], [0, 1, 1, 0]),
            sheenX: f([2.25, 3.3], [150, 1390], Easing.inOut(Easing.cubic)),
            sheenI: f([2.25, 2.4, 3.15, 3.3], [0, 1, 1, 0]),
            gleam: f([3.14, 3.24, 3.85], [0, 1, 0], Easing.out(Easing.quad)),
            glow: f([0.6, 1.7, 3.2, 3.45, 3.95], [0, 0.45, 0.45, 0.8, 0]),
            lowerLight: f([0, 1.65, 2.7], [0.5, 0.5, 1.0]),
          }}
        />
        <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          <GrainVignette frame={frame} grain={0.025} vignette={0} idPrefix="v3-gv" />
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

export const V3_LAYOUT = {...V3, ...layout};

import React from 'react';
import {Composition, Still} from 'remotion';
import {CivicClarityIdent, identDefaults, type CivicClarityIdentProps} from './compositions/CivicClarityIdent';
import {
  CivicClarityEndCard,
  CivicClarityEvidenceCard,
  CivicClarityLowerThird,
  CivicClarityTitleCard,
  endCardDefaults,
  evidenceCardDefaults,
  lowerThirdDefaults,
  titleCardDefaults,
} from './compositions/Cards';
import {CivicClarityIdentV2, identV2Defaults} from './compositions/CivicClarityIdentV2';
import {CivicClarityIdentV3, identV3Defaults} from './compositions/CivicClarityIdentV3';
import {CivicClarityIdentV4, identV4Defaults} from './compositions/CivicClarityIdentV4';
import {CivicClarityAvatar, CivicClarityBanner, CivicClarityThumbnail, avatarDefaults, bannerDefaults, thumbnailDefaults} from './compositions/Channel';

export const FPS = 24;
const UHD = {width: 3840, height: 2160, fps: FPS};
const identMeta = ({props}: {props: CivicClarityIdentProps}) => ({
  durationInFrames: Math.round(Math.min(6, Math.max(3.5, props.durationInSeconds)) * FPS),
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main deliverable: 3840x2160, 24 fps, 4.5 s */}
      <Composition
        id="CivicClarityIdent"
        component={CivicClarityIdent}
        {...UHD}
        durationInFrames={Math.round(identDefaults.durationInSeconds * FPS)}
        defaultProps={identDefaults}
        calculateMetadata={identMeta}
      />
      {/* Revision Round 2 candidate: composited from the owner-selected reference artwork (v1 above is unchanged) */}
      <Composition
        id="CivicClarityIdentV2"
        component={CivicClarityIdentV2}
        {...UHD}
        durationInFrames={Math.round(identV2Defaults.durationInSeconds * FPS)}
        defaultProps={identV2Defaults}
        calculateMetadata={identMeta}
      />
      {/* Visual Fidelity Correction candidate: converges to the owner's reference composition (V1, V2 unchanged) */}
      <Composition
        id="CivicClarityIdentV3"
        component={CivicClarityIdentV3}
        {...UHD}
        durationInFrames={Math.round(identV3Defaults.durationInSeconds * FPS)}
        defaultProps={identV3Defaults}
        calculateMetadata={identMeta}
      />
      {/* Targeted final revisions: new subtitle + no mirrored/repeated imagery (V3 kept as backup) */}
      <Composition
        id="CivicClarityIdentV4"
        component={CivicClarityIdentV4}
        {...UHD}
        durationInFrames={Math.round(identV4Defaults.durationInSeconds * FPS)}
        defaultProps={identV4Defaults}
        calculateMetadata={identMeta}
      />
      {/* Title-only layers on transparent background (render with ProRes 4444 or VP9 alpha) */}
      <Composition
        id="CivicClarityIdentAlpha"
        component={CivicClarityIdent}
        {...UHD}
        durationInFrames={Math.round(identDefaults.durationInSeconds * FPS)}
        defaultProps={{...identDefaults, alphaOverlay: true, muted: true}}
        calculateMetadata={identMeta}
      />
      <Composition id="CivicClarityTitleCard" component={CivicClarityTitleCard} {...UHD} durationInFrames={5 * FPS} defaultProps={titleCardDefaults} />
      <Composition id="CivicClarityLowerThird" component={CivicClarityLowerThird} {...UHD} durationInFrames={6 * FPS} defaultProps={lowerThirdDefaults} />
      <Composition id="CivicClarityEvidenceCard" component={CivicClarityEvidenceCard} {...UHD} durationInFrames={7 * FPS} defaultProps={evidenceCardDefaults} />
      <Composition id="CivicClarityEndCard" component={CivicClarityEndCard} {...UHD} durationInFrames={10 * FPS} defaultProps={endCardDefaults} />
      <Still id="CivicClarityThumbnail" component={CivicClarityThumbnail} width={1280} height={720} defaultProps={thumbnailDefaults} />
      <Still
        id="CivicClarityThumbnailEvidence"
        component={CivicClarityThumbnail}
        width={1280}
        height={720}
        defaultProps={{...thumbnailDefaults, template: 'evidence' as const, headline: 'FOLLOW THE PAPER TRAIL', highlight: 'PAPER TRAIL', kicker: 'PLACEHOLDER TOPIC'}}
      />
      <Still id="CivicClarityAvatar" component={CivicClarityAvatar} width={1024} height={1024} defaultProps={avatarDefaults} />
      <Still id="CivicClarityBanner" component={CivicClarityBanner} width={2560} height={1440} defaultProps={bannerDefaults} />
    </>
  );
};

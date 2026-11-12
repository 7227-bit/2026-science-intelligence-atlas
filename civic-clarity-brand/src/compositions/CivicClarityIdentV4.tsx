import React from 'react';
import {CivicClarityIdentV3} from './CivicClarityIdentV3';
import {identDefaults, type CivicClarityIdentProps} from './CivicClarityIdent';

/**
 * V4 ident — Targeted Final Revisions on the approved V3 direction.
 * Identical animation, timeline and audio to V3; only the plates differ (public/plates/v4):
 *  - subtitle INVESTIGATING LEGISLATION (same Montserrat style, tracking, rules, star, placement)
 *  - no mirrored/repeated content: generated sky/ground extensions, one flag that recedes into shadow,
 *    periodic facade modulation removed. V3 is kept unchanged as the backup.
 */
export const identV4Defaults: CivicClarityIdentProps = {...identDefaults, descriptor: 'INVESTIGATING LEGISLATION'};
export const CivicClarityIdentV4: React.FC<CivicClarityIdentProps> = (props) => <CivicClarityIdentV3 {...props} plateDir="plates/v4" />;

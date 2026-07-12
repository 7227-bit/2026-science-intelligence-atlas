# Dossier Validation Report

## Status

The ten dossiers now use the canonical top-level structure and contain their dossier-specific related technologies and ecosystem players. They do not yet conform fully because research-dependent dates, statuses, rationale, classifications, source records, validation criteria, and review history remain unresolved.

This migration preserves the wording already present in the repository. It does not evaluate scientific truth, add sources, infer missing facts, or suppress validation failures.

## How to reproduce

From the repository root, run:

```sh
node scripts/validate-data.mjs
```

The command exits with status `1` while validation errors remain.

## Before and after

| Check | Before normalization | After normalization |
| --- | ---: | ---: |
| Dossiers checked | 10 | 10 |
| Dossiers passing | 0 | 0 |
| Validation errors | 50 | 198 |
| Migration warnings | 20 | 0 |
| Duplicate IDs | 0 | 0 |
| Dossiers without canonical sources | 10 | 10 |
| Dossiers without evidence classifications | 10 | 10 |
| Dossiers using unresolved legacy signal labels | 8 | 8 |
| Dossiers using an uncontrolled category | 2 | 0 |
| Dossiers with related technologies stored in `app.js` | 10 | 0 |
| Dossiers with ecosystem players stored in `app.js` | 10 | 0 |

The higher error count is expected and represents increased precision, not lost information. Before normalization, most canonical fields were absent and collapsed into one required-fields error per dossier. After normalization, 160 errors identify unresolved subfields on individual bottleneck, opportunity, unlock-step, and milestone objects. The remaining 38 errors cover required unresolved top-level fields, sources, evidence classifications, and legacy signal labels.

All ten canonical `impactScore` values remain numeric and within the 0–10 range.

## Completed structural migration

- Renamed the `Biotech` category to controlled `Biotechnology` for `BT-001` and `BT-002`.
- Converted six existing full dates to ISO `eventDate` values and preserved every original label in `displayDate`.
- Mapped only `Confirmed` and `Demonstrated` directly to controlled `signalStatus` values.
- Preserved the other eight status labels verbatim in `legacySignalLabel` with `signalStatus: null`.
- Renamed existing score, horizon, summary, significance, and takeaway fields without changing their values.
- Converted bottleneck strings into ranked objects.
- Converted opportunity strings into opportunity-layer objects.
- Converted chain strings into ordered unlock steps.
- Converted watch strings into milestone objects.
- Moved related technologies and ecosystem-player names from `app.js` into their matching dossiers.
- Represented unknown ecosystem roles and relevance as `Not established`.
- Added empty `sources`, `evidenceClassification`, and `revisionHistory` arrays without inventing entries.

## Unresolved fields shared by every dossier

Every dossier still requires editorial research or review for:

- `impactRationale`;
- `commercialHorizonAssumptions`;
- each bottleneck's `constraintType` and `rationale`;
- each opportunity layer's `description` and evidence `classification`;
- each ecosystem player's `role` and `relevance`, currently `Not established`;
- each unlock step's `dependency` and `completionCriteria`;
- each milestone's `validationCriteria` and, when supportable, `targetDate`;
- `sources`;
- `evidenceClassification`;
- `lastReviewed`; and
- `revisionHistory`.

## Dossier-specific unresolved fields

The shared fields above apply to every row. This table lists additional record-specific gaps.

| Dossier | `eventDate` | `signalStatus` |
| --- | --- | --- |
| `SP-001` | `2026-04-01` | `Confirmed` |
| `SP-002` | `2026-03-24` | `Demonstrated` |
| `SP-003` | `2026-03-25` | Unresolved; legacy label `Evidence-based` |
| `QT-001` | `2026-03-18` | Unresolved; legacy label `Established` |
| `QT-002` | Unresolved; display label `2026` | Unresolved; legacy label `Active transition` |
| `EN-001` | Unresolved; display label `2026 outlook` | Unresolved; legacy label `Pilot / scale-up` |
| `BT-001` | `2026-03-20` | Unresolved; legacy label `Preclinical` |
| `BT-002` | Unresolved; display label `2026` | Unresolved; legacy label `Controlled study` |
| `EN-002` | Unresolved; display label `2026 theme` | Unresolved; legacy label `Early commercial` |
| `MS-001` | `2026-03-17` | Unresolved; legacy label `Discovered` |

No date or controlled status was inferred from a partial date, contextual label, commercial-stage phrase, or discovery-stage phrase.

## Current validator totals

| Error code | Count |
| --- | ---: |
| `INVALID_STRUCTURE` | 160 |
| `REQUIRED_FIELDS` | 10 |
| `MISSING_SOURCES` | 10 |
| `MISSING_EVIDENCE_CLASSIFICATION` | 10 |
| `UNCONTROLLED_SIGNAL_STATUS` | 8 |

## Interpretation

This is a structural migration baseline. Future evidence-backed PRs should resolve these failures in small dossier batches. Validation rules should not be weakened merely to produce a passing result.

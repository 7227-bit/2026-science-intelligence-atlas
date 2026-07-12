# Dossier Validation Report

## Status

The Atlas now contains twelve dossiers. The ten legacy dossiers use the canonical top-level structure but do not yet conform fully because research-dependent dates, statuses, rationale, classifications, source records, validation criteria, and review history remain unresolved. The two Content Pack 01 dossiers, `SP-004` and `SP-005`, conform to the canonical schema and pass validation.

This migration preserves the wording already present in the repository. It does not evaluate scientific truth, add sources, infer missing facts, or suppress validation failures.

## How to reproduce

From the repository root, run:

```sh
node scripts/validate-data.mjs
```

The command exits with status `1` while validation errors remain in the ten legacy dossiers. `SP-004` and `SP-005` each report `PASS`.

## Before and after

| Check | Before normalization | After normalization | After Content Pack 01 |
| --- | ---: | ---: | ---: |
| Dossiers checked | 10 | 10 | 12 |
| Dossiers passing | 0 | 0 | 2 |
| Validation errors | 50 | 198 | 198 |
| Migration warnings | 20 | 0 | 0 |
| Duplicate IDs | 0 | 0 | 0 |
| Dossiers without canonical sources | 10 | 10 | 10 |
| Dossiers without evidence classifications | 10 | 10 | 10 |
| Dossiers using unresolved legacy signal labels | 8 | 8 | 8 |
| Dossiers using an uncontrolled category | 2 | 0 | 0 |
| Dossiers with related technologies stored in `app.js` | 10 | 0 | 0 |
| Dossiers with ecosystem players stored in `app.js` | 10 | 0 | 0 |

The higher error count is expected and represents increased precision, not lost information. Before normalization, most canonical fields were absent and collapsed into one required-fields error per dossier. After normalization, 160 errors identify unresolved subfields on individual bottleneck, opportunity, unlock-step, and milestone objects. The remaining 38 errors cover required unresolved top-level fields, sources, evidence classifications, and legacy signal labels.

All twelve canonical `impactScore` values are numeric and within the 0–10 range.

## Content Pack 01 import results

| Dossier | Validation result | Unresolved fields |
| --- | --- | --- |
| `SP-004` — GJ 887 d | Pass | None |
| `SP-005` — Gaia-GIC-1 | Pass | None |

Both imported records already matched `docs/DOSSIER_SCHEMA.md`; no schema-compatibility transformations were required. Their supplied wording, dates, scores, sources, source IDs, evidence-classification source references, limitations, milestones, uncertainty, and existing UI compatibility fields were preserved without additions or rewrites. All three imported source URLs use HTTPS.

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

## Unresolved fields shared by every legacy dossier

Each of the ten legacy dossiers still requires editorial research or review for:

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
| `SP-004` | `2026-02-09` | `Confirmed` |
| `SP-005` | `2026-03-11` | `Preliminary` |

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

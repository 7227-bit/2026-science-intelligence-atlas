# Dossier Validation Report

## Status

The current ten dossiers do not conform to the canonical schema in `docs/DOSSIER_SCHEMA.md`. This is expected: the records predate the schema, and this change intentionally does not normalize or rewrite them.

This report records structural and editorial-integrity gaps only. It does not evaluate whether the existing scientific claims are true, and it does not add or infer sources.

## How to reproduce

From the repository root, run:

```sh
node scripts/validate-data.mjs
```

The command exits with status `1` while validation errors remain.

## Current summary

| Check | Current result |
| --- | ---: |
| Dossiers checked | 10 |
| Dossiers passing | 0 |
| Validation errors | 50 |
| Migration warnings | 20 |
| Duplicate IDs | 0 |
| Dossiers without canonical sources | 10 |
| Dossiers without evidence classifications | 10 |
| Dossiers using uncontrolled signal statuses | 8 |
| Dossiers using an uncontrolled category | 2 |
| Dossiers with legacy string-array bottlenecks | 10 |
| Dossiers with related technologies stored in `app.js` | 10 |
| Dossiers with ecosystem players stored in `app.js` | 10 |

All ten legacy scores are numeric and within the 0–10 range. That does not satisfy the schema because `impactScore` and `impactRationale` are not yet stored canonically.

## Shared failures across all dossiers

Every current record is missing these canonical fields or structures:

- `eventDate` in ISO format;
- `displayDate` as a separate field;
- `signalStatus`;
- `impactScore` and `impactRationale`;
- `commercialHorizon` and `commercialHorizonAssumptions`;
- `summary`;
- `whyItMatters`;
- structured `bottlenecks`;
- structured `opportunityLayers`;
- `relatedTechnologies` inside the record;
- `ecosystemPlayers` with roles inside the record;
- structured `unlockSequence` steps;
- structured `milestones` with validation criteria;
- `strategicTakeaway`;
- `sources`;
- `evidenceClassification`;
- `lastReviewed`; and
- `revisionHistory`.

Several legacy equivalents exist—for example `date`, `signal`, `score`, `horizon`, `what`, `why`, `opportunities`, `watch`, `chain`, and `takeaway`. Their presence is reported as migration context, not accepted as canonical compliance.

## Dossier-specific findings

| Dossier | Category | Signal-status result | External enhancement data |
| --- | --- | --- | --- |
| `SP-001` | Space | `Confirmed` is controlled | Related technologies and ecosystem players |
| `SP-002` | Space | `Demonstrated` is controlled | Related technologies and ecosystem players |
| `SP-003` | Space | `Evidence-based` is uncontrolled | Related technologies and ecosystem players |
| `QT-001` | Quantum | `Established` is uncontrolled | Related technologies and ecosystem players |
| `QT-002` | Quantum | `Active transition` is uncontrolled | Related technologies and ecosystem players |
| `EN-001` | Energy | `Pilot / scale-up` is uncontrolled | Related technologies and ecosystem players |
| `BT-001` | `Biotech` is uncontrolled | `Preclinical` is uncontrolled | Related technologies and ecosystem players |
| `BT-002` | `Biotech` is uncontrolled | `Controlled study` is uncontrolled | Related technologies and ecosystem players |
| `EN-002` | Energy | `Early commercial` is uncontrolled | Related technologies and ecosystem players |
| `MS-001` | Materials | `Discovered` is uncontrolled | Related technologies and ecosystem players |

## Date findings

No dossier currently has the canonical `eventDate` field, so none can pass ISO event-date validation. The legacy `date` field combines display text and sorting data. Two legacy values—`2026 outlook` and `2026 theme`—are contextual labels rather than event dates.

This report does not choose or infer replacement dates. Date normalization belongs in a later, evidence-backed migration.

## Interpretation

The failure is a baseline, not a regression. The new validator makes the distance between the legacy model and the approved canonical contract explicit. Future migrations should resolve failures with verified information in small, reviewable batches rather than suppressing checks or inventing missing values.

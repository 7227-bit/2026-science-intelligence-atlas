# Canonical Intelligence Dossier Schema

## Purpose

This document defines the canonical data contract for every intelligence dossier in the 2026 Science & Technology Intelligence Atlas. It converts the editorial requirements in `CONTENT_STANDARD.md` into a structure that can be validated consistently.

The current records in `data.js` predate this contract. They are not normalized by this change. Run `node scripts/validate-data.mjs` to measure their migration gaps.

## General rules

- Every field in the canonical record is required, even when its value is not yet established.
- Unknown information must be represented honestly according to the field guidance below. It must never be invented.
- Dates identified as ISO dates must use the exact `YYYY-MM-DD` calendar-date format.
- Empty strings are not valid values.
- Lists must contain structured values of the documented type. A required list may be empty only when the schema explicitly permits it.
- Factual statements must be supported by entries in `sources` and connected to an `Evidence` classification.
- Inference, forecast, and scenario content must be labeled explicitly in `evidenceClassification`.

## Controlled values

### Categories

`category` must be exactly one of:

- `Space`
- `Quantum`
- `Energy`
- `Biotechnology`
- `Materials`
- `AI and Robotics`
- `Climate`
- `Advanced Manufacturing`

### Signal statuses

`signalStatus` must be exactly one of:

- `Confirmed`
- `Demonstrated`
- `Preliminary`
- `Projected`
- `Disputed`

Signal status describes evidence maturity. It does not express impact, commercial quality, or investment merit.

### Evidence classifications

Each classification entry must use exactly one of:

- `Evidence`
- `Inference`
- `Forecast`
- `Scenario`

## Top-level fields

| Field | Type | Requirements |
| --- | --- | --- |
| `id` | string | Stable, unique, human-readable identifier. Use an uppercase category prefix, a hyphen, and at least three digits. |
| `title` | string | Concise, specific dossier title without promotional language. |
| `eventDate` | string | Date of the underlying event or publication in ISO `YYYY-MM-DD` format. Do not substitute the date the record was added. |
| `displayDate` | string | Human-readable rendering of `eventDate`. It must not replace the sortable ISO date. |
| `category` | string | One controlled category value. |
| `signalStatus` | string | One controlled signal-status value. |
| `impactScore` | number | Number from 0 through 10 inclusive. |
| `impactRationale` | string | Concise explanation of the score using magnitude, cross-field reach, enabling effects, evidence strength, and plausible duration. |
| `commercialHorizon` | string | Evidence-based time range or the explicit phrase `Not established`. |
| `commercialHorizonAssumptions` | string[] | Assumptions and dependencies underlying the horizon. Use an empty list only when the horizon is `Not established`. |
| `summary` | string | Factual account of what happened. |
| `whyItMatters` | string[] | Scientific, strategic, and relevant second-order significance. |
| `bottlenecks` | Bottleneck[] | Ranked constraints. Must contain at least one entry. |
| `opportunityLayers` | OpportunityLayer[] | Enabling capabilities, infrastructure, services, products, or markets. May be empty when no supportable layer is established. |
| `relatedTechnologies` | string[] | Explicit cross-field dependencies and adjacent technologies. May be empty, but the field must live inside the dossier. |
| `ecosystemPlayers` | EcosystemPlayer[] | Material, sourceable organizations and their roles. May be empty, but the field must live inside the dossier. |
| `unlockSequence` | UnlockStep[] | Ordered causal dependencies from the current state toward scaled impact. Must contain at least one entry. |
| `milestones` | Milestone[] | Observable events that could validate, weaken, or change the outlook. Must contain at least one entry. |
| `strategicTakeaway` | string | Durable synthesis centered on the governing constraint or dependency. |
| `sources` | Source[] | Traceable support for material factual claims. Must contain at least one real source before publication. |
| `evidenceClassification` | EvidenceClassification[] | Section-level or claim-level separation of evidence, inference, forecasts, and scenarios. Must contain at least one entry. |
| `lastReviewed` | string | Most recent editorial review date in ISO `YYYY-MM-DD` format. |
| `revisionHistory` | Revision[] | Append-only summary of material record changes. Must contain at least one entry. |

## Nested structures

### Bottleneck

| Field | Type | Requirements |
| --- | --- | --- |
| `rank` | integer | One-based rank unique within the dossier. |
| `name` | string | Specific constraint name. |
| `constraintType` | string | Scientific, engineering, manufacturing, supply chain, economic, regulatory, infrastructure, workforce, adoption, or another clearly defined type. |
| `rationale` | string | Why the constraint holds this rank and how it limits progress. |

### OpportunityLayer

| Field | Type | Requirements |
| --- | --- | --- |
| `name` | string | Enabling layer, not an unsupported beneficiary claim. |
| `description` | string | Connection to the dossier pathway. |
| `classification` | string | `Evidence`, `Inference`, `Forecast`, or `Scenario`. |

### EcosystemPlayer

| Field | Type | Requirements |
| --- | --- | --- |
| `name` | string | Organization name. |
| `role` | string | Material role, such as researcher, manufacturer, operator, funder, regulator, customer, standards body, or infrastructure provider. |
| `relevance` | string | Sourceable explanation of why the organization belongs in this dossier. |

Inclusion is not an endorsement and must not imply unsupported leadership.

### UnlockStep

| Field | Type | Requirements |
| --- | --- | --- |
| `order` | integer | One-based sequence position, unique within the dossier. |
| `step` | string | Capability or condition that must be unlocked. |
| `dependency` | string | What must be true before this step can occur. Use `None` only for a genuinely independent first step. |
| `completionCriteria` | string | Observable condition indicating that the step has been achieved. |

### Milestone

| Field | Type | Requirements |
| --- | --- | --- |
| `milestone` | string | Observable future event. |
| `validationCriteria` | string | Evidence that would validate, weaken, or change the outlook. |
| `targetDate` | string or null | ISO `YYYY-MM-DD` only when supported by a source; otherwise `null`. |

### Source

| Field | Type | Requirements |
| --- | --- | --- |
| `id` | string | Unique source identifier within the dossier. |
| `title` | string | Exact source title. |
| `publisher` | string | Publishing institution or organization. |
| `url` | string | Direct stable `https` URL. Search-result URLs are not valid. |
| `publicationDate` | string or null | ISO `YYYY-MM-DD` when known; otherwise `null`. |
| `accessedDate` | string | ISO `YYYY-MM-DD`. |
| `sourceType` | string | Primary, secondary, preprint, dataset, regulatory, filing, technical documentation, or another explicit type. |
| `supports` | string[] | Dossier sections or claim identifiers supported by the source. |

### EvidenceClassification

| Field | Type | Requirements |
| --- | --- | --- |
| `section` | string | Dossier section or stable claim identifier. |
| `classification` | string | Controlled evidence classification. |
| `statement` | string | The classified statement or concise description of the classified material. |
| `sourceIds` | string[] | Supporting source IDs. Required for `Evidence`; may be empty for non-evidence classifications. |
| `basis` | string | Reasoning, assumptions, or limitations relevant to the classification. |

### Revision

| Field | Type | Requirements |
| --- | --- | --- |
| `date` | string | ISO `YYYY-MM-DD`. |
| `summary` | string | Concise description of the material change. |
| `reviewedBy` | string | Responsible editor or review process. |

## Validation behavior

The dependency-free validator checks the canonical contract while accepting the current `data.js` file as legacy input. It reports, but does not repair:

- missing required canonical fields;
- duplicate IDs;
- invalid ISO dates;
- uncontrolled categories or signal statuses;
- scores outside the 0–10 range;
- dossiers without sources or evidence classifications; and
- related technologies or ecosystem players maintained outside the canonical dossier record.

Validation exits with a nonzero status whenever errors exist. Warnings identify migration concerns that do not independently determine the exit status.

# AGENTS.md

## Project

This repository contains the **2026 Science & Technology Intelligence Atlas**, a living science intelligence platform. It is not a conventional science-news website. Its purpose is to connect developments across fields and explain their strategic, technical, and commercial significance.

Before changing the repository, read:

1. `PROJECT_CONTEXT.md`
2. `DESIGN_SYSTEM.md`
3. `CONTENT_STANDARD.md`
4. `ROADMAP.md`

## Working rules

- Preserve existing functionality unless the task explicitly requires a change.
- Do not remove content, features, or navigation without approval.
- Make changes on a dedicated branch; do not work directly on `main`.
- Show and review the diff before committing.
- Test the site after changes in proportion to their scope.
- Confirm desktop and mobile behavior for interface changes.
- Keep the site compatible with static GitHub Pages hosting.
- Avoid dependencies unless they create meaningful, durable value.
- Prefer accessible, semantic HTML and keyboard-friendly interactions.
- Preserve the approved visual identity described in `DESIGN_SYSTEM.md`.
- Keep the experience understandable to non-specialists without flattening important nuance.

## Evidence and editorial integrity

- Never invent scientific facts, dates, quotations, organizations, people, metrics, or sources.
- Clearly separate sourced evidence from analysis, inference, scenarios, and forecasts.
- Treat every scientific and commercial claim as requiring traceable support.
- Use primary sources where practical; identify secondary analysis as such.
- Preserve uncertainty, disagreement, and limitations when the evidence warrants them.
- Do not present an anticipated event as completed or a forecast as established fact.

## Implementation expectations

- Understand the current HTML, CSS, JavaScript, and data model before editing them.
- Keep navigation, search, dossiers, filters, dialogs, and keyboard controls working.
- Use progressive enhancement and avoid build tooling unless approved.
- Maintain readable focus states, sufficient contrast, useful labels, and logical tab order.
- Test at representative desktop and mobile widths, including overflow and dialog behavior.
- Keep data structures consistent with the dossier standard in `CONTENT_STANDARD.md`.
- Keep code and content changes narrowly scoped and explain material tradeoffs.

## Completion checklist

Before proposing or committing a website change:

- [ ] The requested behavior is implemented without unrelated changes.
- [ ] Existing functionality has been checked for regressions.
- [ ] Desktop behavior has been verified.
- [ ] Mobile behavior has been verified.
- [ ] Keyboard and accessibility behavior has been checked.
- [ ] Scientific claims and sources have been validated.
- [ ] Evidence and inference are visibly distinct.
- [ ] GitHub Pages compatibility is preserved.
- [ ] The diff has been reviewed and shown before commit.

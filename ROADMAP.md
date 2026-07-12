# Roadmap

## Roadmap intent

The Atlas should grow from a polished static intelligence experience into a living, personalized research platform without compromising evidence quality, accessibility, performance, or GitHub Pages compatibility before a platform transition is intentionally approved.

Sequencing is capability-based rather than date-based. Each phase should be considered complete only when its user outcomes and quality gates are met.

## Phase 1 — Intelligence foundation

### Scope

- Professional dashboard
- Discovery library
- Complete intelligence dossiers
- Mobile polish

### Outcomes

- Readers can orient to the most important current signals from one clear dashboard.
- Readers can search, filter, sort, and compare the discovery library.
- Every published record follows the complete dossier schema in `CONTENT_STANDARD.md`.
- Desktop and mobile provide a coherent, accessible experience.

### Quality gates

- Core navigation, search, filters, and dossiers work with keyboard input.
- Category, status, scoring, and source conventions are consistent.
- All published scientific claims are traceable to real sources.
- Representative desktop and mobile layouts have been tested.
- Static GitHub Pages deployment remains reliable.

## Phase 2 — Systems exploration

### Scope

- Interactive technology graph
- Bottleneck explorer
- Company and ecosystem database
- Opportunity map

### Outcomes

- Readers can explore dependencies and enabling relationships across categories.
- Bottlenecks can be compared by affected technologies, severity, type, and unlock potential.
- Organizations are connected to sourceable ecosystem roles rather than presented as undifferentiated lists.
- Opportunity views distinguish demonstrated demand from analytical inference and scenarios.

### Quality gates

- Relationship data has provenance and a documented schema.
- Graph and map views have accessible nonvisual or list-based alternatives.
- Ecosystem entries state why each organization is relevant and cite the basis.
- Dense visualizations remain usable on small screens or degrade to a clear alternative.

## Phase 3 — Analytical intelligence

### Scope

- Conversational Atlas analyst
- Cross-technology reasoning
- Saved watchlists
- Recurring intelligence summaries

### Outcomes

- Readers can ask questions across the Atlas and receive answers grounded in cited records.
- The system can explain cross-technology dependencies and competing interpretations.
- Readers can save technologies, bottlenecks, milestones, and organizations for monitoring.
- Recurring summaries show what changed, why it matters, and which prior theses need revision.

### Quality gates

- Conversational answers cite the underlying Atlas evidence.
- Generated analysis distinguishes retrieval, inference, forecast, and uncertainty.
- Users can inspect and correct watchlist scope.
- Summaries avoid repetition and identify material changes since the prior edition.
- Privacy, retention, and model limitations are made clear before personalized data is stored.

## Phase 4 — Research platform

### Scope

- User accounts
- Research collections
- Automated updates
- Annual Atlas export

### Outcomes

- Readers can maintain durable preferences, watchlists, and research workspaces.
- Collections can organize dossiers, sources, notes, and cross-field theses.
- Automated ingestion proposes updates while preserving human editorial control and provenance.
- The annual Atlas can be exported as a coherent, citable snapshot of the year's intelligence.

### Quality gates

- Authentication, authorization, privacy, backup, and account deletion are designed deliberately.
- Automated updates never publish unsupported claims without review.
- Record history preserves what changed, when, why, and from which source.
- Exports are accessible, source-complete, versioned, and reproducible.
- Any move beyond static hosting has an explicit architecture, migration, operating-cost, and security plan.

## Cross-phase requirements

These requirements apply throughout the roadmap:

- Preserve the visual identity in `DESIGN_SYSTEM.md`.
- Follow the editorial and dossier rules in `CONTENT_STANDARD.md`.
- Keep evidence distinct from inference and forecasts.
- Design for non-specialists while retaining scientific credibility.
- Maintain accessible HTML, keyboard operation, and responsive behavior.
- Add dependencies and infrastructure only when their sustained value exceeds their complexity.
- Define success measures before major features are built.
- Prefer incremental, testable releases over large unverified rewrites.

## Near-term prioritization

Until Phase 1 quality gates are satisfied, prioritize completeness and consistency over adding new surface area. In particular:

1. Bring the dossier data model into alignment with the required schema.
2. Establish a source and evidence workflow that prevents unsupported content.
3. Complete the eight-category taxonomy and coordinated color system.
4. Verify core flows across desktop, mobile, keyboard, and GitHub Pages.
5. Use those foundations to prepare relationship data for Phase 2.

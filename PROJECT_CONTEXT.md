# Project Context

## Product definition

The **2026 Science & Technology Intelligence Atlas** is a living intelligence platform for understanding how scientific and technological change develops as a system.

The Atlas is not designed as a feed of disconnected headlines. Each intelligence record should help a reader understand:

- what happened;
- why it matters;
- the major bottlenecks;
- the commercialization pathway;
- the industries and enabling technologies involved;
- the unlock sequence;
- what to watch next; and
- how breakthroughs connect across fields.

The core product promise is to turn scientific events into structured, evidence-backed strategic intelligence that remains understandable to a non-specialist audience.

## Audience

The Atlas should serve readers who need orientation and synthesis rather than a conventional news stream, including:

- technology and corporate strategy teams;
- investors and market researchers;
- scientists, engineers, and technical operators working across disciplines;
- policymakers and public-sector analysts;
- founders and innovation teams; and
- informed readers seeking a systems-level view of emerging technology.

Specialist readers should find the structure credible. Non-specialists should be able to follow the logic without prior domain expertise.

## Intelligence model

The Atlas organizes information around four connected layers:

1. **Signals** — verified events, publications, demonstrations, approvals, deployments, or other evidence-bearing developments.
2. **Constraints** — scientific, engineering, economic, regulatory, infrastructure, supply-chain, and adoption bottlenecks.
3. **Pathways** — the dependencies and unlock sequence between a signal and scaled practical impact.
4. **Ecosystems** — the industries, enabling technologies, institutions, companies, and public actors positioned around the pathway.

The platform should make these connections explorable through dossiers, maps, timelines, bottleneck views, opportunity views, and future analytical tools.

## Technology taxonomy

The major categories are:

- Space
- Quantum
- Energy
- Biotechnology
- Materials
- AI and Robotics
- Climate
- Advanced Manufacturing

Categories provide orientation, not silos. Cross-category relationships are a defining feature of the Atlas and should be captured explicitly.

## Product principles

### Systems over headlines

Explain dependencies, bottlenecks, second-order effects, and adjacent fields—not only the event itself.

### Evidence before excitement

Separate demonstrated results from projections. Preserve uncertainty and make sources inspectable.

### Insight without opacity

Use precise language, but define specialist terms and explain causal chains in plain language.

### Structured comparability

Use a consistent dossier schema so readers can compare signals across categories and over time.

### Strategic usefulness

Every dossier should end with a clear interpretation of what changed, what remains constrained, and what evidence would alter the outlook.

### Living intelligence

Records should be designed to evolve as milestones occur, evidence changes, and new relationships emerge. Updates must preserve provenance and distinguish new evidence from prior interpretation.

## Current technical context

The current implementation is a dependency-free static site designed for GitHub Pages:

- `index.html` defines the application shell and views.
- `styles.css` contains the responsive visual system.
- `data.js` contains structured intelligence records.
- `app.js` renders the dashboard, discovery library, dossiers, technology map, bottlenecks, timeline, opportunity views, routing, and command search.

This architecture should remain simple and portable until additional complexity produces clear user value.

## Success criteria

The Atlas succeeds when a reader can quickly answer:

- What changed?
- How strong is the evidence?
- Why does this development matter beyond its own field?
- What prevents it from scaling or becoming commercially useful?
- Which industries, technologies, and organizations are connected to it?
- Which milestones would confirm or weaken the thesis?
- What should an informed reader monitor next?

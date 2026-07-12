# Design System

## Design intent

The Atlas should feel like a synthesis of:

- NASA mission control;
- Bloomberg intelligence;
- a strategy consulting report; and
- a modern technology command center.

The result should be rigorous, calm, high-signal, and operational. It should not feel like a science-fiction game interface, a generic news publication, or an overloaded financial terminal.

## Core visual principles

### Intelligence-center aesthetic

Use a dark navy environment with layered surfaces, restrained glow, crisp dividers, and selective signal colors. The interface should convey depth and live system awareness without decorative noise.

### Information density with legibility

Show meaningful context and comparisons, but maintain clear hierarchy, generous enough spacing, scannable sections, and concise labels. Density must never come at the expense of comprehension.

### Structured panels

Use clean cards and panels to group related evidence, scores, bottlenecks, relationships, and milestones. Avoid excessive nesting and ensure each panel has one clear purpose.

### Strong typography

Use bold display type for major findings, compact labels for intelligence metadata, and highly readable body text. Hierarchy should be apparent without relying on color alone.

### Responsive by design

Desktop layouts may use sidebars, multi-column grids, and sticky inspectors. Mobile layouts should collapse gracefully into a linear reading order with usable controls, no accidental horizontal overflow, and dialogs that fit the viewport.

## Foundation tokens

The existing interface establishes the approved foundation. New work should reuse CSS custom properties rather than introducing isolated colors.

| Role | Current token/value | Use |
| --- | --- | --- |
| Primary background | `--bg: #05101c` | Page and application background |
| Secondary background | `--bg2: #071827` | Layered background regions |
| Panel | `--panel: #0b1b2c` | Primary cards and panels |
| Raised panel | `--panel2: #10243a` | Interactive or emphasized surfaces |
| High panel | `--panel3: #132b45` | Selected and elevated states |
| Primary text | `--text: #f5f8fc` | Headings and essential content |
| Muted text | `--muted: #91a5bc` | Secondary labels and explanations |
| Divider | `--line: #263d55` | Borders and structural separation |
| Primary signal | `--blue: #66c0ff` | Links, focus, active states, Space |
| Positive/live | `--green: #54d59b` | Confirmed or live system states |
| Secondary accents | Purple, orange, pink | Category and analytical distinctions |

## Category colors

Category colors must be consistent across cards, charts, maps, filters, dossiers, and timelines. They are supporting signals and must always be paired with a text label, icon, or pattern.

Existing category assignments should be preserved unless a deliberate palette update is approved:

| Category | Current color |
| --- | --- |
| Space | `#62b8ff` |
| Quantum | `#a682ff` |
| Energy | `#f3a43b` |
| Biotechnology | `#4ed09a` |
| Materials | `#e26f86` |

Colors for AI and Robotics, Climate, and Advanced Manufacturing should be added as coordinated, accessible tokens when those categories enter the interface. Choose hues that remain distinguishable in proximity and test them against all relevant navy surfaces. Do not assign ad hoc colors record by record.

## Typography

- Use the existing system-first sans-serif stack for speed and GitHub Pages portability unless a font dependency is explicitly approved.
- Headlines may be large and tightly tracked, but body copy must retain comfortable line height.
- Use uppercase micro-labels sparingly for system state, metadata, and panel headings.
- Keep long-form dossier text at a readable measure; avoid full-width paragraphs on large screens.
- Use tabular numerals where score comparison benefits from alignment.

## Layout and components

### Application shell

- Preserve persistent desktop navigation and the compact mobile header pattern.
- Keep primary navigation predictable across views.
- Use sticky positioning only when it does not obscure content or trap keyboard users.

### Cards and panels

- Use a clear title, optional metadata, and one dominant content purpose.
- Prefer subtle borders and surface contrast over heavy shadows.
- Reserve glow for selected nodes, active signals, and live states.
- Make the entire interaction target clear; hover must not be the only affordance.

### Data displays

- Pair scores with labels and, where necessary, a short explanation of the scale.
- Never encode meaning only through color.
- Provide useful empty, loading, and no-result states.
- Keep charts and relationship maps legible at keyboard focus and at reduced viewport sizes.

### Status language

Signal status is editorial metadata, not decoration. Labels such as confirmed, demonstrated, preliminary, projected, or disputed must reflect the underlying evidence standard and use consistent visual treatment.

## Interaction and accessibility

- Use semantic landmarks, headings, buttons, links, lists, tables, and dialogs.
- Every interactive element must be reachable and operable by keyboard.
- Provide visible focus states with sufficient contrast.
- Ensure controls have accessible names and status changes are conveyed appropriately.
- Respect reduced-motion preferences for nonessential transitions.
- Use minimum practical touch targets of approximately 44 by 44 CSS pixels.
- Verify text and meaningful interface elements against WCAG contrast expectations.
- Preserve logical reading and focus order when layouts collapse on mobile.

## Responsive checkpoints

At minimum, review interface changes at:

- wide desktop, approximately 1440 px;
- compact desktop/tablet, approximately 1024 px;
- mobile, approximately 390 px; and
- narrow mobile, approximately 320 px when content risk warrants it.

Check navigation, grids, maps, dialogs, long titles, filters, tables, and overflow at each relevant size.

## Avoid

- ornamental gauges without analytical value;
- excessive neon, glow, gradients, or animation;
- low-contrast gray text on navy;
- dense walls of identical cards;
- unexplained scores or status colors;
- gratuitous icons or ambiguous symbols;
- mobile experiences that simply shrink the desktop layout; and
- visual changes that break the established mission-control identity.

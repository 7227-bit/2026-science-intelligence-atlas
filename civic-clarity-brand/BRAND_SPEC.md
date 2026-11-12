# Civic Clarity — Brand Specification (PROPOSED)

Every value in this document is a **proposal** awaiting the owner's decision (see OWNER_REVIEW.md). Items marked **[existing]** come from the prior prototype, Brand Master v1.0, or from the owner's concept board. Items marked **[new]** are introduced by this candidate. Nothing here is approved.

Editorial promise: *Investigate like a journalist; explain like an educator; present like a filmmaker.*
Independence: architectural and American motifs are visual context only. They never imply government affiliation, endorsement or an official seal.

## 1. Colour tokens (`src/brand/tokens.json`)

| Token | Hex | Role | Status |
|---|---|---|---|
| `midnight` | `#071421` | Primary background | [existing v1.0] |
| `navy` | `#0B1E35` | Panels, evidence cards | [existing board] |
| `civicBlue` | `#1E4F7A` | Secondary structure, light-mode descriptor | [existing] |
| `steel` | `#C9CDD2` | Descriptor, captions, source lines | [existing] |
| `copper` | `#C67A3F` | Light-mode accents, glow falloff | [existing board] |
| `gold` | `#D6A15E` | Primary accent: rules, ring, star | [existing v1.0] |
| `goldLight` | `#F0C98A` | Highlights, star on dark | [new] |
| `ivory` | `#F3E8D6` | Wordmark (flat), titles | [existing] |
| `paper` | `#F7F2E8` | Light-mode background | [new] |
| `ink` | `#0B1E35` | Light-mode wordmark | [new, = navy] |
| `flagRed / flagWhite / flagBlue` | `#7A1F26 / #C9C4BA / #13284A` | Muted flag palette, cinematic use only | [new] |

**Metallic ramp** (vertical, top → baseline): `#FFFDF6 0` · `#EFE7D8 .36` · `#C4BAAA .50` · `#8C8172 .60` · `#D8CBB4 .72` · `#F7EEDD 1`, edge `#5E5141`. The metallic treatment is optional. The **flat master is canonical**.

### Measured contrast (WCAG 2.x)

From `scripts/qa.mjs`:

| Pair | Ratio |
|---|---|
| ivory / midnight | 15.32:1 |
| steel / midnight | 11.62:1 |
| steel / navy | 10.51:1 |
| ivory / navy | 13.84:1 |
| gold / midnight | 8.06:1 |
| gold / navy | 7.29:1 |
| ink / paper | 15.04:1 |
| civicBlue / paper | 7.67:1 |
| copper / paper | 3.01:1 |

Copper on paper is **decorative only**. Never use it for text.

## 2. Typography

| Use | Typeface | Licence | Fallback |
|---|---|---|---|
| Wordmark, film titles | **Cinzel** 600/700 | SIL OFL 1.1 (bundled) | Georgia, serif |
| Descriptor, captions, lower thirds, evidence, thumbnails | **Montserrat** 400/500/600/700 | SIL OFL 1.1 (bundled) | Helvetica Neue, Arial |

- The concept board names **Trajan Pro**. That is an Adobe proprietary font. It is not licensed for this project, and it is not used or redistributed here. Cinzel is the closest classical Roman-capital OFL family.
- **Alternatives if the owner prefers a different voice:** Cormorant SC (OFL, lighter, more literary) or Marcellus SC (OFL, softer). A commercially licensed Trajan or Optima would need an Adobe Fonts or desktop licence, plus confirmation that logo use is permitted.
- **Wordmark construction:** small capitals with enlarged initials, mirroring the reference.
  - The initial C is **1.30×** the small-cap size (`initialScale`).
  - Tracking is **+0.02 em**. The word gap is **0.38 em**.
  - Kerning comes from the font's own tables.
  - Descriptor: **INVESTIGATIVE DOCUMENTARIES**, Montserrat Medium at 0.20× the small-cap size, tracked **+0.42 em**.

## 3. Logo system

| Asset | Use | Minimum size |
|---|---|---|
| Primary lockup (wordmark + rule + descriptor + star) | Title/end cards, banner, decks | **375 px wide** (descriptor cap height ≥ 6 px). Below that, use the wordmark-only lockup. |
| Wordmark only | Small horizontal placements, thumbnails | 125 px wide (small-cap height ≥ 10 px) |
| Horizontal lockup (mark │ wordmark) | Web headers, credits | 480 px wide |
| Stacked lockup | Square formats, social | 300 px wide |
| Compact mark (C + star in ring) | Avatar, favicon, watermark | **24 px** (ring may drop below 32 px). Verified at 48/96/128 px in a circular crop. |
| Secondary mark (C + simplified dome) | Optional, ≥ 128 px only | 128 px |

- **Clear space:** keep at least **1x** on every side, where x = small-cap height (140 units at the 200-unit master; that is the height of the "IVIC" letters). Exported artboards already include 1.5x.
- **Treatments:** dark-flat, dark-metallic, light-flat, transparent-ivory, transparent-metallic, mono-black, mono-white. Mono versions are single-colour and work for embossing, foil, watermarks and overlays.
- **The Capitol is never required in the permanent small-format logo.** The compact mark is letter + star. The dome variant is optional and only for larger uses.
- **Don'ts:**
  - Don't place the mark inside a circular seal with text around the rim.
  - Don't add eagles, shields, laurels plus text, or "official" wording.
  - Don't stretch, outline, or recolour outside the tokens.
  - Don't set the wordmark in a different typeface.
  - Don't add HUD rings, lens-aperture devices, neon or glitch effects.

## 4. Motion (ident)

| Time (s) | Beat | Layers animated |
|---|---|---|
| 0.0–0.7 | Near-black navy; faint silhouette; ambient cloud drift | sky exposure, presence, clouds |
| 0.7–1.7 | Camera push and crane parallax; gold backlight rises; flag fades in and waves; halo arc draws from the apex | camera scale/Y, per-tier lift, key/rim light, flag, halo, rays |
| 1.7–3.2 | Title forms from the centre outward; anamorphic streak; specular sheen sweep; rule draws; descriptor settles | wordmark reveal/sheen/glow/rule/descriptor |
| 3.2 | **Resolve**: star lands with a gleam; halo and rim pulse; audio hit | star, gleam, halo, rim, audio |
| 3.2–4.0 | Final hero frame | — |
| 4.0–4.5 | `hold` (default) or `fadeToBlack` | transition prop |

**Placement rule (proposed):** the ident is **optional**. When used, it follows the cold-open hook. It never precedes it. Omit it when pacing demands, for example short videos under 3 minutes, Shorts, or urgent explainers. Use `durationInSeconds: 3.5` for a tighter cut. The audio resolve stays synced.

## 5. Sonic signature

- **Original synthesised cue:** D-major add9 pad over a D sub, a soft bell shimmer, and a reversed-noise rise. The resolve at 3.2 s is a low pitched hit, a brass-like chord and a bell.
- **Levels:** −17.2 LUFS integrated, −3.0 dBTP, 48 kHz / 24-bit. Mix it so it sits ≤ 2 LU above surrounding programme.
- **Never** layer it with a commercial studio sting or library "trailer hit".

## 6. YouTube

| Asset | Spec |
|---|---|
| Avatar | 1024² PNG. The ring sits at 84% of the crop diameter. Stroke is weighted for 48 px. |
| Banner | 2560×1440. The wordmark lockup sits inside the **1546×423** all-device safe area (computed check in QA). The Capitol is decorative and may crop on mobile. |
| Thumbnails | 1280×720, < 2 MB. Two templates: **A, Institution** (key art + headline) and **B, Evidence** (image panel + headline column). Keep the headline to 2–5 words with one accent word. Keep clear of the timestamp zone, bottom-right. Rotate the key imagery per film. The vector Capitol is a fallback, not a default for every topic. |

## 7. Evidence graphics

- **Labels:** every evidence card carries a visible type label — PRIMARY SOURCE, SECONDARY ANALYSIS, CIVIC CLARITY ANALYSIS, or ILLUSTRATIVE RECONSTRUCTION.
- **Wording:** excerpts must be verbatim from the cited source. Analysis cards render without quotation marks.
- **Styling:** cards are deliberately not styled as paper documents. No fake stamps, redactions, letterheads or seals.
- **Low-bandwidth variants:** flat colour with no grain or blur, for small screens and heavy compression.

## 8. Approved vs proposed

| Item | Status |
|---|---|
| Institutional Cinematic direction (Capitol + flag + navy/gold) | **Owner-selected direction** (per brief) |
| Every logo, token, typeface, ident, cue and template in this package | **PROPOSED — awaiting owner decision** |
| Canonical Production Bible | **Unchanged.** Proposed changes are in PROPOSED_BIBLE_AMENDMENT.md. |

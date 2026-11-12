# Civic Clarity — Institutional Cinematic Brand Master & Motion Ident

> **Status: PRODUCTION CANDIDATE — NOT OWNER-APPROVED. Do not publish.**
> Nothing here has been uploaded to YouTube, written into the canonical Production Bible or Google Drive, or inserted into any film. The locked opening of the AI legislation documentary (0–79.8 s) was not touched. This package does not include that film.

This is a self-contained Remotion + React + TypeScript project. It builds:

- **Editable vector logo system.** It has 42 SVG masters and PNG exports. Every letter is a real outline, built from OFL fonts by a script.
- **4.5 s ident.** It runs at 3840 × 2160 and 24 fps, with original synthesised audio. It comes as a silent version, a transparent title overlay, and ProRes mezzanines.
- **YouTube set.** It has an avatar, a banner with a safe-area proof, and two thumbnail templates.
- **Reusable editorial components.** These are a title card, lower third, evidence/citation card and end card.

They all share one token file, `src/brand/tokens.json`.

## Targeted Final Revisions — Cinematic Ident V4 (candidate; V3 kept as backup)

V4 = V3 with two changes. The subtitle reads **INVESTIGATING LEGISLATION**, in the same style, tracking, rules and star. The 16:9 extensions are original generated sky and ground, with no mirrored or repeated imagery anywhere. Composition: `CivicClarityIdentV4` (plates in `public/plates/v4/`, built by `scripts/plate/export_v4.py`). Render: `npm run render:identv4`. Audit: `scripts/fidelity/mirror_check.py`. Review: `OWNER_REVIEW_V4.md`.

## Visual Fidelity Correction — Cinematic Ident V3 (candidate)

V3 replaces V2's interpretation with a match to the owner's reference. V1 and V2 are unchanged.
- The final frame is the reference composition at full width, with its own lettering, light, rules, star and arc (ESRGAN ×4, tone-corrected to the original).
- It is extended to 16:9 with sky above and ground below.
- Each element is revealed by the animation through masks derived from the reference.

The static final frame was measured against the reference **before** animating. See `FIDELITY_REPORT_V3.md`.

| | |
|---|---|
| Composition | `CivicClarityIdentV3` (`src/compositions/CivicClarityIdentV3.tsx`, `src/v3/PlateGLV3.tsx`) |
| Render | `npm run render:identv3` → `deliverables/ident/v3/` |
| Plates | `public/plates/v3/` (built by `scripts/plate/export_v3.py` from the ESRGAN outputs) |
| Fidelity measurement | `npm run fidelity` (`scripts/fidelity/measure.py`) → `deliverables/fidelity/measure_V3/` |
| Review | `OWNER_REVIEW_V3.md`, `FIDELITY_REPORT_V3.md` |

## Revision Round 2 — Cinematic Ident V2 (candidate)

After the owner's Round 2 direction, V2 was added **alongside** V1 (V1 is unchanged). V2 is built from the owner-selected reference artwork:
- The artwork is upscaled 4× with ESRGAN and rebuilt into independent layers: sky, Capitol matte, flag cloth warp, and arc and light.
- It is composited by a WebGL2 shader.
- On top sits a vector title fitted to the reference's exact letter positions.

| | |
|---|---|
| Composition | `CivicClarityIdentV2` (same props as `CivicClarityIdent`) |
| Render | `npm run render:identv2` → `deliverables/ident/v2/` (needs `--gl=swangle`, already in the script) |
| Plates | `public/plates/v2/` (committed); rebuild with `scripts/plate/build_plates.sh` (see `scripts/plate/README.md`) |
| Comparison | `deliverables/comparison/`: side-by-side and sequential MP4s, full-resolution V1/V2 final frames, reference/V1/V2 still |
| Review | `OWNER_REVIEW_V2.md`, `QA_REPORT_V2.md` |
| Title geometry | `npm run type:cinematic` → `src/brand/generated/cinematicType.json` |

## Quick start

```bash
npm ci                         # installs pinned deps from package-lock.json
npm run build                  # logos (SVG/PNG) + audio (WAV) + TypeScript check
npm run studio                 # interactive preview / prop editing (Remotion Studio)
npm run render                 # ident + silent + alpha + YouTube stills + component stills
npm run render:mezzanine       # ProRes 422 HQ + ProRes 4444 alpha → out/mezzanine (not committed: ~1 GB)
npm run qa                     # measured QA → deliverables/qa/qa-results.json (exit 1 on any failure)
```

### Environment requirements

| Requirement | Version used | Notes |
|---|---|---|
| Node.js | 22.x (≥ 20) | |
| FFmpeg / ffprobe | 6.x system build | QA and silent remux only. Remotion bundles its own encoder. |
| Chrome Headless Shell | Chromium 1243 build | Set `REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell` to render fully offline. If unset, Remotion downloads one on first render. |
| Python 3 + Pillow | optional | Only for `scripts/avatar-size-test.py` |

Rendering makes **no network requests**. Fonts and audio load from `public/`, and all imagery is generated procedurally. If the audio file is missing, the ident renders silently instead of failing. If a thumbnail `imageSrc` is empty, the template falls back to the vector key art.

Render times on a 4-vCPU container: about 2.5 min for the 4K H.264 ident, and about 25 s per 4K still.

## Asset map (deterministic output paths)

| Path | What |
|---|---|
| `deliverables/logo/svg/civic-clarity_{primary,wordmark,horizontal,stacked,mark,mark-dome}_{dark-flat,dark-metallic,light-flat,transparent-ivory,transparent-metallic,mono-black,mono-white}.svg` | Outlined vector masters (6 lockups × 7 treatments = 42) |
| `deliverables/logo/svg/civic-clarity_live-text_EDITING-SOURCE.svg` | Live-text version for designers (needs Cinzel/Montserrat installed). Outlined files are canonical. |
| `deliverables/logo/png/*_{3000w,1200w,1024w,256w}.png` | Rasterised from the SVGs by resvg. `transparent-*` and `mono-*` are RGBA. |
| `deliverables/ident/civic-clarity-ident_3840x2160_24p_4.5s.mp4` | **Main review render**: H.264 High, CRF 14, BT.709, AAC 320k stereo |
| `deliverables/ident/civic-clarity-ident_3840x2160_24p_4.5s_SILENT.mp4` | Same picture stream, no audio track |
| `deliverables/ident/civic-clarity-ident-title_ALPHA_3840x2160_24p.webm` | Title layers only, VP9 with alpha |
| `deliverables/ident/civic-clarity-sonic-ident_48k24b.wav` | Original cue, 48 kHz / 24-bit stereo |
| `out/mezzanine/*_ProRes422HQ.mov`, `*_ProRes4444.mov` | Mezzanine + alpha mezzanine (regenerate with `npm run render:mezzanine`) |
| `deliverables/youtube/` | Avatar 1024 (+ crop guide, dome variant), banner 2560×1440 (+ safe-area proof), thumbnails A/B (+ guide) |
| `deliverables/components/` | Title, lower-third (incl. low-bandwidth + alpha WebM), evidence (primary / reconstruction / low-bandwidth), end card (+ end-screen slots) |
| `deliverables/qa/` | Contact sheet, reference comparison, avatar small-size test, alpha proof, logo overviews, `qa-results.json` |
| `references/OWNER_SELECTED_REFERENCE.jpeg` | Owner reference. V1: comparison only. V2: source of the plates (owner-directed). |

## Source layout

```
src/brand/tokens.json            colours, metallic ramp, type, wordmark spacing (single source of truth)
src/brand/generated/logoGeometry.json   glyph outlines exported by build-logos (do not hand-edit)
src/scene/Sky.tsx                gradient + 2 procedural cloud layers + backlight bloom
src/scene/Capitol.tsx            procedural 2.5D architecture, one <g> per tier (building, podium, peristyle, attic, dome, lantern)
src/scene/Flag.tsx               procedural flag, 72-strip 2.5D wave
src/scene/Atmosphere.tsx         halo arc, light rays, grain/vignette, safe-area guides
src/components/Wordmark.tsx      animated outlined wordmark (reveal, sheen, glow, extrusion, rule, descriptor, star, gleam)
src/components/Mark.tsx          compact mark
src/compositions/CivicClarityIdent.tsx   ident + timeline
src/compositions/Cards.tsx       TitleCard, LowerThird, EvidenceCard, EndCard
src/compositions/Channel.tsx     Avatar, Banner, Thumbnail (2 templates)
scripts/build-logos.mjs          font → outline → SVG/PNG/JSON
scripts/synth-sonic-ident.mjs    original audio synthesis
scripts/render-all.sh            render pipeline
scripts/qa.mjs                   measured QA
scripts/avatar-size-test.py      48/96/128 px circular-crop proof
```

## Compositions and typed props

| Composition | Size | Key props |
|---|---|---|
| `CivicClarityIdent` | 3840×2160, 24 fps, 4.5 s | `title`, `descriptor`, `accentColor`, `durationInSeconds` (3.5–6), `muted`, `layout` (`cinematic` \| `wordmarkOnly`), `safeArea` (`none` \| `broadcast` \| `social`), `transition` (`hold` \| `fadeToBlack`), `showFlag`, `audioSrc` |
| `CivicClarityIdentAlpha` | same | same, with `alphaOverlay: true` |
| `CivicClarityTitleCard` | 4K, 5 s | `filmTitle`, `subtitle`, `presenter`, `accentColor`, `safeArea` |
| `CivicClarityLowerThird` | 4K, 6 s, transparent | `name`, `role`, `context`, `variant` (`full` \| `lowBandwidth`) |
| `CivicClarityEvidenceCard` | 4K, 7 s | `excerpt`, `sourceTitle`, `publisher`, `date`, `locator`, `kind` (`primary` \| `secondary` \| `analysis` \| `reconstruction`), `variant` |
| `CivicClarityEndCard` | 4K, 10 s | `callToAction`, `showEndScreenSlots` |
| `CivicClarityThumbnail` / `…Evidence` | 1280×720 still | `template`, `headline`, `highlight`, `kicker`, `imageSrc`, `accentColor`, `showSafeGuides` |
| `CivicClarityAvatar` | 1024² still | `variant` (`star` \| `dome`), `showCropGuide` |
| `CivicClarityBanner` | 2560×1440 still | `showSafeGuides` |

Example: render a per-film thumbnail from verified imagery placed in `public/films/`:

```bash
npx remotion still src/index.ts CivicClarityThumbnail out/my-film-thumb.png \
  --props='{"headline":"WHO AUDITS THE ALGORITHM?","highlight":"ALGORITHM","kicker":"AI LEGISLATION","imageSrc":"films/my-film/keyframe.jpg"}'
```

## Honesty notes

- **2.5D, not 3D.** The Capitol and flag are procedural vector layers with projected shading (cylindrical colonnades, ellipsoidal ribs, strip-displaced cloth). There is no 3D mesh, no Blender scene and no cloth simulation.
- **V1** does not use the owner reference image anywhere. **V2** is derived from it by explicit owner direction (Round 2). V2 is a 2.5D composite of that raster artwork, with synthesised fill where its lettering and arc were removed. It is not 3D and not photography of the real building.
- The wordmark typeface is **Cinzel (OFL)**, a licensed stand-in for the Trajan Pro named on the concept board. See BRAND_SPEC.md §Typography.

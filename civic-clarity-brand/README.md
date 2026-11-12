# Civic Clarity — Institutional Cinematic Brand Master & Motion Ident

> **Status: PRODUCTION CANDIDATE — NOT OWNER-APPROVED. Do not publish.**
> Nothing here has been uploaded to YouTube, written into the canonical Production Bible or Google Drive, or inserted into any film. The locked opening of the AI legislation documentary (0–79.8 s) was not touched. This package does not include that film.

This is a self-contained Remotion + React + TypeScript project. It builds:

- **Editable vector logo system.** It has 42 SVG masters and PNG exports. Every letter is a real outline, built from OFL fonts by a script.
- **4.5 s ident.** It runs at 3840 × 2160 and 24 fps, with original synthesised audio. It comes as a silent version, a transparent title overlay, and ProRes mezzanines.
- **YouTube set.** It has an avatar, a banner with a safe-area proof, and two thumbnail templates.
- **Reusable editorial components.** These are a title card, lower third, evidence/citation card and end card.

They all share one token file, `src/brand/tokens.json`.

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
| `references/OWNER_SELECTED_REFERENCE.jpeg` | Owner reference. Used for comparison only, never composited into deliverables. |

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
- The owner reference image is **not** traced, cut up or animated anywhere in this package.
- The wordmark typeface is **Cinzel (OFL)**, a licensed stand-in for the Trajan Pro named on the concept board. See BRAND_SPEC.md §Typography.

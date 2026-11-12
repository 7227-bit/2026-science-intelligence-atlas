# QA Report — Civic Clarity Brand Master Candidate

Date: 2026-11-12. Every figure below was **measured on rendered outputs** with `scripts/qa.mjs` (machine-readable: `deliverables/qa/qa-results.json`), ffprobe/ffmpeg, or visual inspection of the stills listed. The result is **32/32 automated checks passed**. Items that cannot be automated are listed under *Unresolved*.

## 1. Build and type checks

| Check | Result |
|---|---|
| `npm run logos` (42 outlined SVG masters + 84 PNGs + geometry JSON) | ✅ deterministic, re-run identical |
| `npm run audio` | ✅ 4.5 s, 48 kHz / 24-bit stereo |
| `npm run typecheck` (`tsc --noEmit`, strict) | ✅ 0 errors |
| `remotion compositions` | ✅ 10 compositions register. `durationInSeconds: 3.5` → 84 frames, verified. |
| Network at render time | None. Fonts, audio and procedural art are local, and Chrome Headless Shell is local via `REMOTION_BROWSER_EXECUTABLE`. |

## 2. Ident render metadata

All values measured with ffprobe.

| File | Measured |
|---|---|
| `civic-clarity-ident_3840x2160_24p_4.5s.mp4` | H.264 High, **3840×2160**, **24/1 fps**, **108 frames = 4.500 s**, yuv420p, BT.709 limited (tv) range; AAC-LC 48 kHz **stereo** 320 kb/s; 12.3 MB |
| `…_SILENT.mp4` | Same video stream (stream-copied), **no audio stream** |
| `civic-clarity-ident-title_ALPHA_3840x2160_24p.webm` | VP9 3840×2160 24 fps, **alpha_mode=1**. Decoded frame 90 is RGBA with alpha 0–255 and 87.6% fully transparent pixels. Proof: `qa/alpha_overlay_frame90_on_grey.png`. |
| ProRes 422 HQ / ProRes 4444 mezzanine | See §8 |

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness (EBU R128) | **−17.2 LUFS** |
| True peak (after AAC encode) | **−3.0 dBTP** |
| LRA | 2.4 LU |
| Momentary at resolve (3.3–3.6 s) | −15.4 → −12.3 LUFS, against about −17 LUFS before it, so the hit is decisive without being harsh |
| Waveform / spectrum | Inspected. The first draft had broadband hiss and a hard riser cut. **Fixed** with 18 dB/oct filtering and a 30 ms release. |
| Sync | The resolve hit at 3.200 s coincides with the star landing (frames 75–80) |

Not yet done: **a human listening test.** See *Unresolved*.

## 4. Picture checks

- **Contact sheet** (`qa/ident_contact_sheet.png`, every 9th frame): the sequence follows the brief. It goes from near-black silhouette (0–0.7 s), to dome reveal with backlight, flag and halo (0.7–1.7 s), to the title forming centre-out (1.7–3.2 s), to the resolve and hero (3.2–4.0 s), to the hold (4.0–4.5 s).
- **Flicker / jitter:**
  - Mean-luma series over all 108 frames: smooth monotonic rise (23.4 → 49.4).
  - Max frame-to-frame step 1.47/255; max second difference 0.50.
  - **0 luma reversals > 0.3.** Grain is seeded per frame by design, at 6% opacity overlay.
- **Banding:**
  - The first thumbnail and banner renders showed contour banding in the clouds.
  - Root cause: SVG filters ran in linearRGB at 8 bits.
  - **Fixed** by setting `color-interpolation-filters="sRGB"` on all filters and adding grain. Re-rendered and visually verified.
- **Edges / letters:** wordmark outlines come from font data. There is no raster text in any master and no stretched architecture. The only scaling is uniform (camera push 1.13 → 1.0).

## 5. Text accuracy

- **42/42 outlined SVG masters** were checked glyph-by-glyph via `data-char`. Every wordmark spells **CIVIC CLARITY** and every descriptor spells **INVESTIGATIVE DOCUMENTARIES**. No masters contain `<text>`.
- The live-text editing source spells CIVIC CLARITY.
- Rendered stills were read visually: ident, banner, thumbnails, end card, avatar. No misspellings and no placeholder text in brand elements. Component templates deliberately show labelled placeholders such as "Speaker Name" and "FILM TITLE PLACEHOLDER".
- **Prop-test bug found and fixed:** a non-default `title` (live-text fallback) overflowed the frame. Fit-to-width sizing was added and the fix verified in `qa/prop-test_custom-title-fallback.png`.

## 6. Small-size and YouTube checks

| Check | Result |
|---|---|
| Avatar circular crop at **48 / 96 / 128 px**, light and dark UI (`qa/avatar_small_size_test.png`) | C + star identifiable at 48 px. The ring reads as a thin gold edge. The dome variant's dome becomes a blob at 48 px, which is why it is secondary. |
| Banner lockup inside 1546×423 safe area (computed from layout constants) | ✅ lockup [690, 579, 1870, 869] inside safe area [507, 508.5, 2053, 931.5]. Visual proof: `youtube/…_SAFE-AREA-GUIDES.png`. |
| Banner file size | 3.4 MB < 6 MB |
| Thumbnails | 1280×720, 644–965 KB < 2 MB. Headline readable at 320×180 (`qa/thumbnails_at_320px.png`). Studio tag is clear of the timestamp zone. |
| Ident in broadcast/social safe areas | `qa/prop-test_*.png`: wordmark and descriptor sit inside 90% title-safe |

## 7. Accessibility and contrast

WCAG contrast is measured for all token text pairs; see BRAND_SPEC §1. Every text pair is ≥ 7.29:1. Copper on paper (3.01:1) is restricted to decorative rules. Evidence cards use ≥ 24 design px (48 px at 4K) source lines and a 46-character measure.

## 8. Mezzanine

`npm run render:mezzanine` → `out/mezzanine/`. Not committed, because of file size.
MEZZANINE_RESULT_PLACEHOLDER

## Unresolved / requires owner or human action

1. **Listening test** of the sonic cue on monitors and phone speakers. So far it has only been measured.
2. **Owner aesthetic decision.** The vector Capitol and sky are cleaner and less photographic than the reference. See OWNER_REVIEW.md.
3. **Rights:**
   - Trademark search for "Civic Clarity".
   - Remotion licence eligibility.
   - Ownership statement for AI-assisted work.
4. **Upload proof:** the banner and avatar have not been uploaded to YouTube. Final crop confirmation in YouTube's own preview remains with the owner, and no publishing was done.
5. **Dark UI edge:** the avatar's navy edge sits close to YouTube dark mode (#0F0F0F). The gold ring carries the edge. A slightly lighter field is an optional revision.

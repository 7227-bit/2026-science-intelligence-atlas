# QA Report — Revision Round 2 (Cinematic Ident V2)

Date: 2026-11-12. Every value below is measured from the rendered files. `scripts/qa.mjs` now runs **43 checks** (32 from Round 1 plus 11 for V2), and **43/43 pass** (`deliverables/qa/qa-results.json`). The raw ffprobe output is saved as `deliverables/qa/v2/ffprobe_*.json`.

## 1. Master export metadata (evidence)

| File | Codec | Resolution | r_frame_rate / avg_frame_rate | Frames | Duration | Pixel / colour | Video bitrate | Audio |
|---|---|---|---|---|---|---|---|---|
| `ident/v2/civic-clarity-ident-V2_3840x2160_24p_4.5s.mp4` | H.264 High | **3840 × 2160** | **24/1 / 24/1** | **108** | **4.500000 s** | yuv420p, BT.709, tv range | 27.0 Mb/s | AAC-LC 48 kHz **stereo**, 317 kb/s |
| `ident/v2/…_SILENT.mp4` | H.264 High | 3840 × 2160 | 24/1 / 24/1 | 108 | 4.500000 s | same (stream copy) | 27.0 Mb/s | **none** |
| `ident/civic-clarity-ident_…_4.5s.mp4` (V1, unchanged) | H.264 High | 3840 × 2160 | 24/1 / 24/1 | 108 | 4.500000 s | yuv420p, BT.709, tv | 21.5 Mb/s | AAC 48 kHz stereo |
| `comparison/ident_V1-vs-V2_side-by-side_3840x1080_24p.mp4` | H.264 High | 3840 × 1080 (2 × 1920×1080) | 24/1 | 108 | 4.500 s | yuv420p, BT.709 | 8.0 Mb/s | AAC stereo (V2 audio) |
| `comparison/ident_V1-then-V2_sequential_1920x1080_24p.mp4` | H.264 | 1920 × 1080 | 24/1 | 216 | 9.0 s | yuv420p | — | AAC stereo |

Full-resolution lossless final frames (PNG, 3840 × 2160, rendered directly from the compositions, not extracted from H.264): `comparison/final-frame_V1_…_f096_t4.00s.png` and `final-frame_V2_…_f096_t4.00s.png`, plus three V2 beat frames.

## 2. Audio

- V2 reuses the original cue unchanged. **Decoded PCM from V2 is byte-identical to V1** (automated check).
- Integrated loudness is −17.2 LUFS and true peak −3.0 dBTP, the same as Round 1. The resolve stays at 3.200 s.
- No change was justified, so none was made.

## 3. Picture

- **Flicker / jitter.** Mean-luma series over 108 frames: 20.0 → 52.3 (max 54.6). The largest frame-to-frame step is 1.78/255 and the largest second difference 0.87. There are **0 luma reversals > 0.3**.
- **WebGL determinism.** Every frame is drawn with a per-frame `delayRender` and `gl.finish()`. The luma series above shows no blank, black or late-loaded frames.
- **Text accuracy.**
  - Title outlines spell **CIVIC CLARITY** and the descriptor spells **INVESTIGATIVE DOCUMENTARIES**. Both are checked glyph by glyph from the generated geometry.
  - The title span is registered to the reference at **201.0–1332.0** reference px (target 201–1332).
  - Outline overlay on the reference: `qa/v2/type_overlay_on_reference.png`.
- **Safe area.** At the final frame the title spans design x 124–1792, inside the 90% title-safe area (96–1824).
- **Contact sheet** (`qa/v2/ident-V2_contact_sheet.png`). The motion follows the brief: near-black silhouette (0–0.7 s), then the reveal with backlight, flag motion and arc draw-on (0.7–1.7 s), then the title forming centre-out with the glow line and burst (1.7–3.2 s), then the resolve with star gleam and light sweep (3.2–4.0 s), then the hold.
- **Defects found and fixed this round:**
  1. **Cut-out outline around the dome.** The rim light drew a pale edge around the dome. Rim strength was reduced and gated by luminance.
  2. **"Ghost C" over the flag.** The original lettering's dark backdrop remained over the flag. The stripes are now continued along the measured stripe orientation and faded into shadow.
  3. **Flag-stripe parallax slip.** The lower-left flag stripes sat on the Capitol layer. The matte is now restricted to the building, with feathered ends.
  4. **Hairlines inside glyphs.** Fine dark lines appeared inside A, R and C because Cinzel's contours overlap. The edge stroke was removed in V2; V1 is untouched.
  5. **Hard-edged facade slab.** The rebuilt facade read as a slab. It now uses wide horizontal feathering into the flag and clouds, plus backlight spill.
  6. **Mirrored lantern in the sky extension.** The top extension now comes from the dome-free sky plate.
  7. **Vertical light streaks in the facade.** Fixed with anisotropic smoothing.
- **Upscaler comparison.** On a 192 px tile, ESRGAN-thick against Lanczos removed the JPEG blocking and sharpened the architecture. Medium was faster but softer. Thick was used.

## 4. Build and render

| Step | Result |
|---|---|
| `tsc` (strict) | ✅ 0 errors |
| V2 render | WebGL2 via ANGLE/SwiftShader (`--gl=swangle`); about 6 min 20 s for 108 frames at 4K on 4 vCPU |
| Plate pipeline (`scripts/plate/build_plates.sh`) | About 20 min, mostly ESRGAN. Its outputs are committed, so renders need no pipeline run and no network. |
| V1 compositions and logo masters | Unchanged. The Round 1 checks still pass. |
| V2 mezzanine (`npm run render:mezzaninev2`) | ✅ ProRes 422 HQ, 3840×2160, yuv422p10le, 24 fps, 108 frames, 4.500 s, PCM audio, 371 MB, in `out/mezzanine/` (not committed: size) |

## Unresolved

1. **Rights to the reference artwork.** V2's imagery derives from it, and its creator, generator and terms are undocumented. This blocks publication, not review.
2. **Listening test.** Still outstanding from Round 1; the cue is unchanged.
3. **Dark lower quarter.** The 16:9 hold area below the title is darker and emptier than the banner-shaped reference. This is a framing choice for the owner.
4. **Synthesised areas.** The facade and the continued flag stripes are visible before the title lands, and have less texture than the reference.

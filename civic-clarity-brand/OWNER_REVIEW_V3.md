# Owner Review — V3 (Visual Fidelity Correction)

**Status:** candidate awaiting your decision. Nothing is published. V1 and V2 are unchanged. The documentary, its locked opening and the canonical Production Bible are untouched.

## What changed from V2, and why

You asked for a match, not an interpretation. V2 departed from your design in four measurable ways:
- It **cropped** the reference by 7.6% on each side, which inflated the title to 89% of the frame width.
- It **added 25.5% near-black** below the composition.
- It **re-rendered** the lettering as a brighter, champagne vector material.
- It **re-lit** the plate, making the dome +16 luma brighter.

V3 removes all four:
- **The final frame is your composition.** The full reference width is shown at uniform scale, so every proportion between Capitol, flag, clouds, arc, lettering, descriptor, rules and star is exactly yours.
- **The wordmark is the reference's own lettering.** It is the original dark-metallic material, with warm highlights, bevels and orange rim. It is upscaled 4× and corrected so local tone matches the original. It is not a substitute material.
- **The light and contrast are the reference's.** The deep navy shadows, cloud texture, localized warm backlight, glow line, rules and star glow all come from it. Animation light (dome sweep, title sheen, star gleam) is transient and returns to zero before the hold.
- **The 16:9 reframe is not distorted.** The extra height (unavoidable for a 3.44:1 design) goes mostly above, as your sky continuing upward (34%), with dark ground continuing below (15%).

## Review in this order

1. **Static first.** `deliverables/fidelity/frame_comparison_reference_V3_V2_stacked.jpg` shows the reference at identical scale and position, then V3, then V2. Then the measured overlays in `deliverables/fidelity/measure_V3/` and the numbers in `FIDELITY_REPORT_V3.md`.
2. **Then motion:**
   - `deliverables/ident/v3/civic-clarity-ident-V3_3840x2160_24p_4.5s.mp4`, with sound.
   - `deliverables/comparison/reference-then-V3_1920x1080_24p.mp4`: the reference held for 2 s, then V3.
   - `deliverables/comparison/ident_V2-vs-V3_side-by-side_3840x1080_24p.mp4`.
3. **Full-resolution final frames:** `deliverables/comparison/final-frame_V3_…png` against `final-frame_V2_…png`.

## Motion (unchanged 4.5 s timeline and audio)

| Time | Beat |
|---|---|
| 0–0.7 s | Near-black; the dome and flag emerge as silhouettes; the base of the building is held in deep shadow. |
| 0.7–1.7 s | Slow pull-back with 2.5D parallax. The backlight rises, the flag moves, and your gold arc draws on from its apex. |
| 1.7–3.2 s | The glow line ignites and lights the base of the building. The original lettering forms letter by letter from the centre outward, under a passing sheen. The descriptor settles, and the rules extend from the star. |
| 3.2 s | Resolve: the star lands with a gleam and a warm light sweeps across the dome, both synced to the audio hit. |
| 4.0–4.5 s | Hold on the reference composition. |

## Measured results

From `FIDELITY_REPORT_V3.md`:

| Measure | Reference | V3 |
|---|---|---|
| Wordmark bbox | 173–1332 × 205–346 | **identical** |
| Title width (% of frame) | 75.5% | **75.5%** (V2: 89.0%) |
| Descriptor, star, arc, dome | — | within 0–1 px |
| Wordmark material L\* mean / p10 / p90 | 76.1 / 43.9 / 98.0 | 75.9 / 44.3 / 97.3 |
| Band SSIM | — | 0.961 (V2: 0.561) |
| Space below the composition | — | 14.8% of frame (V2: 25.5%) |

## Trade-offs you should know

- **Not editable vector type.** V3's title is the artwork's own lettering, as you asked: match it, don't redesign it. A per-film custom title therefore cannot be typed into V3 (use V2's vector title component for that). The editable vector logo system is unchanged and remains the master for every other use.
- **The 4K detail is AI-upscaled from the 1536-px artwork** (ESRGAN). It reads as sharp at 4K, but fine texture is model-generated.
- **The extensions are synthesised** from the reference's own sky and ground, so they are softer than the band itself.
- **Rights.** V3 is your reference artwork, animated. Publication still requires confirming that you hold the rights to it (creator, generator and terms are undocumented).

## Decision

| Item | ☐ Approve | ☐ Request revisions (describe) | ☐ Reject |
|---|---|---|---|
| V3 static final frame (fidelity to the reference) | | | |
| V3 framing: 34% sky above / 15% ground below | | | |
| V3 motion | | | |
| V3 as the studio ident candidate (replacing V1/V2) | | | |
| Rights to the reference artwork confirmed | | | |

Until you mark a decision, V1, V2 and V3 all remain candidates. No branding is approved.

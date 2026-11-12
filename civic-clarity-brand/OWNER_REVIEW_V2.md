# Owner Review — Revision Round 2 (Cinematic Ident V2)

**Status:** candidate awaiting your decision. Nothing is published. The documentary and its locked 0–79.8 s opening are untouched. The canonical Production Bible is unchanged. V1 is preserved unchanged for comparison.

## What changed, and why

You clarified that **the original reference image is the visual target**, and that the method matters less than the result. V2 is therefore built **from your reference artwork itself**, rebuilt into animatable layers. It is not a redesign and not an unrelated photograph.

| Request | What V2 does |
|---|---|
| Photographic realism, grandeur, depth, dramatic light | The Capitol, sky, flag and backlight are your reference artwork, upscaled 4× with ESRGAN and split into independent layers: sky, Capitol (matte), flag (cloth warp), arc and light. |
| Keep the vector branding intact | The logo-system masters are untouched. V2's title is vector outlines of the same OFL typefaces, so it is crisp at 4K and spelled from font data. The reference's baked raster lettering is removed and replaced. |
| Strengthen the metallic wordmark slightly | The ramp is higher-contrast and warmer. A specular bevel (real lighting filter), a short extrusion, a contact shadow and a warm rim glow are added, and the strokes are slightly emboldened to match the reference's weight. |
| Tighten CIVIC–CLARITY spacing | The gap is set to the reference: a visible gap of **0.135× the small-cap height**, against 0.725× in V1 (about 5.4× tighter). The initials are **1.48×** the small capitals (V1: 1.30×), measured from the reference. |
| More monumental final reveal | Exposure lift, backlight swell and rim pulse at the resolve, a slow warm light sweep across the dome (2.6–3.7 s), the central light burst and glow line under the title, and the star gleam. |
| No excessive particles, flares or trailer effects | No particles. Only the two arc flares already in your reference, kept small, plus restrained grain. |
| Preserve audio timing | **Byte-identical audio** to V1 (decoded PCM compared). The resolve stays at 3.2 s. |

## Review files

**Playable:**
- `deliverables/ident/v2/civic-clarity-ident-V2_3840x2160_24p_4.5s.mp4`: the V2 master, with sound.
- `deliverables/ident/v2/…_SILENT.mp4`: the V2 master without audio.
- `deliverables/comparison/ident_V1-vs-V2_side-by-side_3840x1080_24p.mp4`: V1 left, V2 right, played simultaneously.
- `deliverables/comparison/ident_V1-then-V2_sequential_1920x1080_24p.mp4`: V1, then V2, with sound.
- V1 itself is unchanged: `deliverables/ident/civic-clarity-ident_3840x2160_24p_4.5s.mp4`.

**Stills (full resolution, lossless PNG):**
- `final-frame_V1_…_f096_t4.00s.png` and `final-frame_V2_…_f096_t4.00s.png` (3840×2160 each).
- `final-frames_V1-left_V2-right_7680x2160.png`.
- V2 beats: `…f008_t0.33s_silhouette`, `…f030_t1.25s_reveal`, `…f060_t2.50s_title-forming`.
- `reference_vs_V1_vs_V2.png`: the reference band above both final frames.
- `deliverables/qa/v2/ident-V2_contact_sheet.png`: every 9th frame.

## Differences that remain vs. the reference (honest list)

1. **Framing.** The reference is a wide banner (about 3.4:1). A 16:9 frame needs more height, so V2 adds sky above the dome and a ground shadow below the star. That lower quarter is darker and emptier than anything in the reference. It's a deliberate hold area, but you may prefer a tighter crop with the title nearer the bottom.
2. **Reconstructed areas.** The areas behind the removed lettering and arc are synthesised: the shadowed facade below the roofline, the continued flag stripes behind the first C, and the drum-base columns behind CLARITY's C. The final title covers most of them. They are visible during the first ~2 s as a dark terrace under the roofline, and the facade has less texture than the reference.
3. **Typeface.** Cinzel (OFL) stands in for the Trajan-style lettering in the artwork. Word positions and spans are fitted to the reference within 1 px, but individual letterforms differ in detail: serif shapes, stroke contrast, and the reference's heavier weight, which V2 approximates with a slight embolden. See the outline overlay, `deliverables/qa/v2/type_overlay_on_reference.png`.
4. **2.5D only.** There is real layer parallax and a cloth warp on the flag, but no 3D model. Camera moves must stay small (≤ 14% zoom), or the reconstructed edges would show.
5. **Upscaling.** ESRGAN detail is model-generated. It reads well at 4K, but the Capitol's fine ornament is plausible, not architecturally exact.

## Items that need your decision

1. **Rights to the reference artwork.** V2's imagery is derived directly from `OWNER_SELECTED_REFERENCE.jpeg`. Its creator or generator and its terms are not documented in the handoff. Please confirm you hold the rights to use it in a published studio ident. *(Blocking for publication; not for review.)*
2. **Title spacing and weight in the permanent logo system.** V2 applies the tighter spacing and 1.48× initials **only to the cinematic title**. Should the logo-system masters adopt them too? See `BRAND_SPEC.md` §2 and the proposed update below.
3. **Framing.** Keep the 16:9 layout with the ground-shadow hold area, or crop tighter.
4. **Which ident becomes the candidate for Bible inclusion.** V1, V2, or neither.

**Proposed logo-system update (not applied):** set the wordmark `initialScale` 1.30 → 1.48 and reduce `wordGapEm` until the visible gap is 0.135× the small-cap height, matching the reference. This would regenerate all 42 SVG masters. It is held until you approve.

## Decision

| Item | ☐ Approve | ☐ Request revisions (describe) | ☐ Reject |
|---|---|---|---|
| V2 ident (picture) | | | |
| V2 ident (audio — unchanged cue) | | | |
| Use V2 as the studio ident candidate (instead of V1) | | | |
| Apply V2 title spacing/weight to the logo-system masters | | | |
| Rights to reference artwork confirmed | | | |

Until you mark a decision, **both V1 and V2 remain candidates**. No branding is approved.

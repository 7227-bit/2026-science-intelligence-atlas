# Owner Review — V4 (Targeted Final Revisions)

**Status:** candidate awaiting your decision. **V3 is preserved unchanged as the backup** (`CivicClarityIdentV3`, `public/plates/v3/`, `deliverables/ident/v3/`; the V3 still re-renders pixel-identically). Nothing is published; the documentary and the canonical Production Bible are untouched.

V4 changes only two things relative to V3. The Capitol, title, gold arc, palette, animation timeline and audio are unchanged: the audio is byte-identical, and the wordmark bounding box and title pixels still match the reference (title SSIM 0.952).

## 1. Subtitle → INVESTIGATING LEGISLATION

- **Same style.** Same Montserrat Medium as measured from the original, at the same size (25.7 ref-px), tracking (+13.3) and word gap, centred on the same axis and baseline.
- **Same rendering as the original lettering.** The original subtitle was removed from the artwork. Its rendering (ivory fill, edge softness, soft drop shadow) was then calibrated by re-synthesising the *original* words over the cleaned background and fitting to the reference pixels: error 15.8 vs 65.0 with no letters. The new words use exactly those parameters.
- **Rules adjusted.** The new wording is 86 ref-px narrower, so the flanking rules were extended inward to keep the original text-to-rule spacing (33 / 30 px). The star, lower rules and glow line are untouched.
- Comparison: `deliverables/v4/before-after_subtitle.png`.

## 2. Mirrored and repeated imagery removed throughout the frame

**Where V3 mirrored or copied content:**
- **Sky above:** the reference's sky and the upper flag were reflected upward. This produced a second, mirrored flag canton and stripes, plus a horizontally shifted copy of clouds above the dome.
- **Ground below:** the flag stripes and warm clouds were reflected downward.
- **Pre-title facade:** a periodic pilaster pattern.
- **Flag cloth motion:** this ran on the mirrored flag mask in the sky above.

**What V4 does instead:**
- **Generated sky and ground.** Both extensions are original. They are generated procedurally: seeded, domain-warped cloud fields coloured from the reference's own measured sky palette, lit from below by the horizon light, and deepening to navy at the top edge. No pixel is copied, reflected or tiled from anywhere.
- **Seamless joins.** The edges between the artwork and the extensions blend with an irregular (non-straight) length: the band's edge colour runs smoothly into the generated content. There are no inpainting blobs, no streaks and no straight seam line. The spire's sky is interpolated, so the spire is never extended.
- **One flag.** The flag recedes into shadow at its top and bottom edges, and its cloth motion is confined to that one flag.
- **Facade.** The periodic facade modulation is removed from the pre-title plates.

## Measured QA (whole animation, not just the final frame)

`scripts/fidelity/mirror_check.py` samples about 260 textured patches per frame. It searches each across the whole frame and its vertical, horizontal and 180° flips, ignoring the title/descriptor where letters legitimately repeat. Run on frames 0, 9, 18 … 99 and 107:

| | V3 (before) | V4 (after) |
|---|---|---|
| Copied/reflected patches involving the extensions, all sampled frames | **154** | **4** |
| Final hold (frame 107) | 18 | **0** |
| Untouched reference band alone (natural repetition baseline) | — | 0 |

The 4 residual V4 matches are mid-animation (frames 27–45) at the gold arc apex and the spire tip. They are the artwork's own locally symmetric geometry (one patch matches its own mirror 2 px away), not duplicated imagery.

**Other measurements:**
- **Master export:** 3840×2160, exactly 24/1 fps, 108 frames, 4.500 s, BT.709 (`deliverables/qa/v4/ffprobe_ident-V4.json`).
- **Audio:** byte-identical to the original cue.
- **Flicker:** no luma reversals.

## Review files

**Playable:**
- `deliverables/ident/v4/civic-clarity-ident-V4_3840x2160_24p_4.5s.mp4` (and `_SILENT`)
- `deliverables/v4/before-after_V3-vs-V4_side-by-side_3840x1080_24p.mp4`

**Before/after stills:**
- `deliverables/v4/before-after_final-frame_V3_V4.jpg`
- `before-after_top-extension.jpg`
- `before-after_bottom-extension.jpg`
- `before-after_subtitle.png`
- Full-resolution `V3_BEFORE_…png` / `V4_final-frame_…png`

**QA:**
- `deliverables/qa/v4/ident-V4_contact_sheet.png` (opening → hold)
- `mirror-audit_final-frame_V3-left_V4-right.png` (red = copy/reflection involving an extension; green = natural in-artwork similarity)
- `mirror-audit_V3.json`, `mirror-audit_V4.json`

## Honest notes

- **The sky above is new, generated content.** It is softer and less detailed than the painted clouds in your artwork, which reads as atmospheric depth. If you want richer cloud forms up there, it's a parameter change, still without mirroring.
- **The pre-title facade** (visible ~1–2 s before the title forms) is still a reconstructed dark terrace. It is non-repeating now, but it remains synthesised.
- **Rights.** Publication still requires confirming your rights to the reference artwork.

## Decision

| Item | ☐ Approve | ☐ Request revisions | ☐ Reject |
|---|---|---|---|
| Subtitle INVESTIGATING LEGISLATION | | | |
| Mirror/repetition removal (sky, ground, flag) | | | |
| V4 as the studio ident (V3 kept as backup) | | | |

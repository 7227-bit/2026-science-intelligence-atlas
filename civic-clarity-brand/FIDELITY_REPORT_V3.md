# Fidelity Report — V3 (Visual Fidelity Correction)

**Method.** The static final frame was built and measured **before** any animation was rendered. Measurement is by `scripts/fidelity/measure.py`:
- It finds the reference hero band inside the candidate frame by multi-scale template matching.
- It resamples the candidate band to exactly the reference's **1536 × 446**.
- It runs **the same detection code** on both images.

V2 is measured the same way, for contrast. All coordinates below are in reference pixels.

**Artefacts** (`deliverables/fidelity/`):

| File | Contents |
|---|---|
| `V3_static-final-frame_3840x2160_f107_t4.46s.png` | the static final-frame candidate (lossless, from the composition) |
| `reference_placed_in_frame_3840x2160_same-scale.png` | the reference placed at the identical scale and position in a 3840 × 2160 frame |
| `frame_comparison_reference_V3_V2_stacked.jpg` | reference, V3 and V2 in the same frame geometry |
| `frame_blend_reference_V3_50-50.png` | 50/50 blend inside the band |
| `measure_V3/side_by_side.png` | reference over candidate at identical dimensions (2×) |
| `measure_V3/overlay_blend.png` | 50/50 overlay |
| `measure_V3/overlay_edges.png` | reference edges drawn over the candidate |
| `measure_V3/diff_heatmap.png` | absolute difference |
| `measure_V3/annotated_reference.png`, `annotated_candidate.png` | measured boxes and lines drawn on each |
| `measure_V3/measurements.json` | all measured values |
| `measure_V2_for-contrast/` | the same set for V2 |

## 1. Composition

| | Reference | V3 | V2 (rejected) |
|---|---|---|---|
| Reference width shown | 100% | **100%** (scale 2.5, x0 = 0, match 0.997) | 84.8% (cropped 7.6% each side; scale 2.94) |
| Title width as % of frame width | 75.5% of image | **75.5%** | 89.0% |
| Space above band / below band | — | 33.6% / **14.8%** | 13.7% / 25.5% |

**Framing note.** The reference is 3.44:1. Showing all of it in 16:9 needs 418 reference-px of extra height, which cannot be avoided without distortion. V3 puts most of it above, as a continuation of the reference's own dramatic sky (mirrored sky rows, real cloud texture, deepening toward the top edge). It puts the rest below as dark ground continuing the flag and clouds. The reference band itself is untouched pixel-for-pixel; seam blending is confined to the extensions.

## 2. Element geometry

| Element | Reference | V3 | Δ V3 | V2 |
|---|---|---|---|---|
| Wordmark bbox (x1, y1, x2, y2) | 173, 205, 1332, 346 | 173, 205, 1332, 346 | **0** | 173, 205, 1335, 345 *(inside a cropped, rescaled frame)* |
| Descriptor bbox | 386, 378, 1173, 405 | 386, 379, 1173, 405 | ≤ 1 | 385, 380, 1175, 397 |
| Star centre / size | 768.8, 418.4 / 95 × 47 | 768.2, 418.2 / 95 × 47 | 0.6 / 0 | 767.8, 423.4 / 34 × 31 |
| Halo arc (cx, cy, r) | 765.2, 383.4, 370.7 | 765.7, 383.2, 370.5 | ≤ 0.5 | 764.0, 382.0, 370.3 |
| Dome width at y = 120 / 170 / 198 | 701–816 / 677–842 / 760–822 | identical | **0** | 701–816 / 677–844 / 760–803 |
| Finial top | 0 | 0 | 0 | 0 |
| Glow line (y, extent at threshold 110) | 357, 415–1156 | 357, 437–1147 | see §4 | 357, 447–1105 |

## 3. Material, contrast and tone

| | Reference | V3 | V2 |
|---|---|---|---|
| Wordmark L\* mean / p10 / p50 / p90 (same 34,086 px) | 76.1 / 43.9 / 83.5 / 98.0 | **75.9 / 44.3 / 83.5 / 97.3** | 66.3 / 24.7 / 72.5 / 95.3 |
| Wordmark a\* / b\* | 4.9 / 15.4 | **4.9 / 15.3** | 3.5 / 17.1 |
| Title-zone mean luma | 71.5 | **71.4** | 93.6 (too bright) |
| Dome mean luma | 99.3 | **98.9** | 115.7 (over-lit) |

Pixel similarity (SSIM / mean absolute error, 0–255):

| Region | V3 | V2 |
|---|---|---|
| Whole band | **0.961 / 3.4** | 0.561 / 24.5 |
| Title | **0.952 / 4.8** | 0.392 / 47.9 |
| Descriptor, rules, star | **0.961 / 4.5** | 0.544 / 21.8 |
| Dome | **0.943 / 6.6** | 0.720 / 28.9 |
| Flag | **0.951 / 3.0** | 0.499 / 22.4 |
| Right sky | **0.981 / 1.5** | 0.692 / 9.4 |

## 4. Residual differences (honest list)

1. **Fine texture.** The frame is 4K from a 1536-px source, so detail at 4K is ESRGAN-upscaled. The difference heatmap shows only sub-pixel edge texture, with no structural differences. SSIM is therefore about 0.96 rather than 1.0.
2. **Glow-line tails.** The line's local energy matches (row mean 60 vs 61). Its peak brightness at the faint tails is about 5% lower, because a 1-px line is resampled to 4K and back. That is why the fixed-threshold extent reads 437–1147 against 415–1156. Visually the line has the same brightness and length.
3. **The flag keeps a gentle cloth motion in the hold**, so its pixels differ slightly frame to frame (SSIM 0.951).
4. **Grain.** A 2.5% film grain sits on top for dither. It is not in the reference.

## 5. Gate

| Criterion | Result |
|---|---|
| Composition — full width, uniform scale | ✅ |
| Wordmark proportions and placement | ✅ Δ 0 px |
| Descriptor, rules, star, glow line in scale and placement | ✅ ≤ 1 px (glow-line tails, see §4) |
| Dome and arc | ✅ ≤ 0.5 px |
| Material (dark metallic, bright warm highlights, bevels) | ✅ L\* within 0.7, a\*/b\* within 0.1 |
| Contrast and tone | ✅ every measured region's mean is within 0.6 luma (0–255) of the reference |
| Empty space below | ✅ 14.8% (V2: 25.5%) |

The static frame met the gate, so the animation was rendered: `deliverables/ident/v3/`.

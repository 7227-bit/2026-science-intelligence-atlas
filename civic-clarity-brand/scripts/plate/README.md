# v2 plate pipeline (Revision Round 2)

This pipeline builds the photographic layers for `CivicClarityIdentV2` from the **owner-selected reference artwork**, `references/OWNER_SELECTED_REFERENCE.jpeg`. The owner asked for this (Round 2 clarification: "the original reference image is the visual target"). It uses no stock photography and no third-party imagery.

Renders don't need the pipeline. Its outputs are committed in `public/plates/v2/`. Re-run it only to change the plates:

```bash
python3 -m venv .venv && .venv/bin/pip install -r scripts/plate/requirements.txt
npm --prefix scripts/plate ci            # ESRGAN tools (tfjs + wasm, ~150 MB, offline weights)
PYTHON=.venv/bin/python scripts/plate/build_plates.sh out/plate-work   # ~20 min on 4 vCPU
```

## Steps

All coordinates are in reference-band units: a 1536 × 446 crop of the reference at (0, 0).

| Step | Script | What it does |
|---|---|---|
| 1 | `crop_band.py` | Crops the hero band from the reference. |
| 2 | `masks.py` | Masks the baked raster lettering (bright, low-saturation pixels in the title zone; everything bright in the descriptor/star zone), dilated. |
| 3 | `arcfit.py` | Fits a circle to the halo arc: ridge detection along the expected path, then least-squares refit. Result: centre (765.4, 382.1), r = 369.5, mean residual ≈ 1 px. |
| 4 | `flares.py` | Finds the two flare positions on the arc. |
| 5 | `arc_best.py` | Removes the arc, its glow and the flares with OpenCV `xphoto` FSR_BEST inpainting. The lantern is protected. |
| 6 | `cleanplate.py` | Removes the lettering. It also:<br>• extends the drum-base columns hidden behind CLARITY's initial C vertically;<br>• continues the flag stripes through the first C's dark backdrop, along the stripe orientation measured with a structure tensor;<br>• rebuilds the zone below the roofline as a shadowed facade, with anisotropic smoothing, a pilaster rhythm, one cornice course and grain. |
| 7 | `matte.py` | Builds the Capitol matte. The dome uses GrabCut, then a symmetry prior (the clean right half mirrored about the lantern axis) and a hand-placed finial. The building comes from a roofline trace, with feathered ends. |
| 8 | `export_plates.py` | Neutralises residual chroma fringes in the arc band. Builds the dome-free sky plate, the soft flag weight, and the 16:9 canvas extension (110 units of sky above, mirrored from the dome-free plate and darkened; 200 units of ground shadow below). |
| 9 | `upscale.mjs` | ESRGAN ×4 (UpscalerJS `esrgan-thick`, MIT weights bundled in the npm package) on the TF.js WASM backend, tiled with overlap. |
| 10 | `finalize_plates.py` | Writes 5120-wide JPEG q95 4:4:4 plates and Lanczos-resampled 8-bit mattes to `public/plates/v2/`. |

## Honesty notes

- **2.5D only.** The motion uses layer offsets (sky vs. Capitol), an analytic cloth warp on the flag, a slow cloud warp, a camera move, and grading and light passes in a WebGL2 shader (`src/v2/PlateGL.tsx`). There is no 3D model.
- **Reconstructed areas are synthesised, not recovered.** That covers everything under the removed lettering and arc, the facade below the roofline, the continued flag stripes and the 16:9 extensions. The final title covers most of them.
- **ESRGAN detail is model-generated.** The upscale sharpens and invents fine texture consistent with the source. It is concept artwork, not documentary evidence, and must never be presented as a photograph of the real building.
- **Rights.** The plates inherit the reference's rights status: owner-asserted and unverified. See `ASSET_PROVENANCE.csv`.

## V3 (Visual Fidelity Correction)

`export_v3.py` builds the V3 plates. Its inputs:
- an ESRGAN ×4 of the **untouched** reference band (`node scripts/plate/upscale.mjs v3/ref_band.png v3/ref_band_x4.png thick 128`);
- the V2 ×4 clean and sky plates.

Steps:
1. Every plate gets a low-frequency tone correction toward its source, which restores thin glows the upscaler dims. The thin-light regions get a finer correction.
2. The canvas is 1536 × 864 reference-px: 290 above, 446 band, 128 below.
3. The top extension is mirrored sky rows, with real cloud texture borrowed horizontally over the removed dome area. The borrowed texture fades out near the seam, and the sky softens and deepens toward the top edge.
4. The bottom extension comes from the lettering-free plate, so the title is never mirrored.
5. Seams only touch the extensions. The reference rows are restored exactly.
6. The reveal masks (letters with IDs, glow line, descriptor, rules, star, arc, facade) are derived from the reference itself. The facade mask excludes a wide zone around every element, so nothing appears early.

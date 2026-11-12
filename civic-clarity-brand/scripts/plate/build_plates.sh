#!/usr/bin/env bash
# Rebuild the v2 ident plates from references/OWNER_SELECTED_REFERENCE.jpeg.
# Usage: scripts/plate/build_plates.sh <work_dir>
# Needs: python3 with opencv-contrib-python-headless 4.10, numpy, scipy, pillow (see requirements.txt)
#        node + the tools in scripts/plate/package.json (npm --prefix scripts/plate ci) for ESRGAN upscaling.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"
WORK="${1:?work dir}"; PY="${PYTHON:-python3}"
mkdir -p "$WORK/v2/out"; cd "$WORK"
"$PY" -I "$HERE/crop_band.py" "$ROOT/references/OWNER_SELECTED_REFERENCE.jpeg"
"$PY" -I "$HERE/masks.py"          # lettering mask
"$PY" -I "$HERE/arcfit.py"         # halo arc circle fit (ridge detection + least squares)
"$PY" -I "$HERE/flares.py"         # flare positions on the arc
"$PY" -I "$HERE/arc_best.py"       # arc removal, FSR_BEST (slow, ~1.5 min)
"$PY" -I "$HERE/cleanplate.py"     # lettering removal, column extension, shadowed facade rebuild
"$PY" -I "$HERE/matte.py"          # Capitol matte (GrabCut + symmetry + roofline)
"$PY" -I "$HERE/export_plates.py"  # chroma clean-up, sky plate, flag mask, 16:9 extension
node "$HERE/upscale.mjs" v2/out/plate_clean.png v2/out/plate_clean_x4.png thick 128 &
node "$HERE/upscale.mjs" v2/out/plate_sky.png v2/out/plate_sky_x4.png thick 128 &
wait
"$PY" -I "$HERE/finalize_plates.py" "$WORK/v2/out"
echo "plates written to public/plates/v2"

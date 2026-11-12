"""Detect mirrored or repeated (copied) image content anywhere in a frame.

Usage: python3 -I scripts/fidelity/mirror_check.py <frame.png> [<frame2.png> ...] [--json out.json] [--viz out.png]

Two tests, both on a 960x540 downsample:
 1. Seam-mirror score: normalised correlation between the 40 px just above (below) each band seam and the
    vertically flipped 40 px just inside the band. Mirror-padding scores ~0.9+; natural content ~0.
 2. Copy detection: ~300 textured 24x24 patches sampled over the WHOLE frame are searched against the frame
    and its vertical, horizontal and 180-degree flips (excluding the patch's own neighbourhood).
    A best NCC >= 0.90 means that patch exists elsewhere as a copy or a reflection.
Seams default to the V3/V4 canvas: band from 725 to 1840 px on a 2160-px frame.
"""
import sys, json, argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('frames', nargs='+'); ap.add_argument('--json'); ap.add_argument('--viz')
ap.add_argument('--seam-top', type=float, default=725 / 2160); ap.add_argument('--seam-bottom', type=float, default=1840 / 2160)
ap.add_argument('--band-only', action='store_true', help='frame IS the 1536x446 reference band (calibration)')
ap.add_argument('--thr', type=float, default=0.92)
a = ap.parse_args()

def ncc(x, y):
    x = x - x.mean(); y = y - y.mean()
    d = np.sqrt((x * x).sum() * (y * y).sum()) + 1e-6
    return float((x * y).sum() / d)

results = []
for path in a.frames:
    im = cv2.imread(path)
    sm = cv2.resize(im, (960, 540), interpolation=cv2.INTER_AREA)
    if a.band_only:
        sm = cv2.resize(im, (960, 279), interpolation=cv2.INTER_AREA)
    g0 = cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY).astype(np.float32)
    g = g0 - cv2.GaussianBlur(g0, (0, 0), 3)  # high-pass: smooth gradients cannot produce matches
    H, W = g.shape
    # exclude the title/descriptor zone (letters legitimately repeat): band rows 200..446 x 170..1380
    if a.band_only:
        by0, bh = 0, H
    else:
        by0, bh = a.seam_top * H, (a.seam_bottom - a.seam_top) * H
    ex = (int(by0 + 200 / 446 * bh), int(by0 + bh) + 2, int(170 / 1536 * W), int(1380 / 1536 * W))
    st, sb = int(round(a.seam_top * H)), int(round(a.seam_bottom * H))
    K = 40
    seam = {}
    if a.band_only: st, sb = -999, 99999
    # stretch-aware mirror test on lightly smoothed luminance: compare the extension next to the seam with the
    # vertically flipped band content, allowing the extension to be stretched by 1.0..1.4
    gl = cv2.GaussianBlur(g0, (0, 0), 1.0)
    def mirror_score(ext, band):
        best = -1.0
        for sc in np.linspace(1.0, 1.4, 9):
            hb = int(round(K / sc))
            if hb < 8 or hb > band.shape[0]: continue
            bb = cv2.resize(band[:hb], (W, K), interpolation=cv2.INTER_LINEAR)
            best = max(best, ncc(ext, bb))
        return round(best, 3)
    if st - K >= 0: seam['top'] = mirror_score(gl[st - K:st], gl[st:st + K][::-1][::-1][::-1] if False else gl[st:st + K + 20])
    if sb + K <= H: seam['bottom'] = mirror_score(gl[sb:sb + K][::-1], gl[sb - K - 20:sb][::-1])
    # copy detection
    rng = np.random.default_rng(5)
    P = 24
    flips = {'none': g, 'vflip': g[::-1].copy(), 'hflip': g[:, ::-1].copy(), 'rot180': g[::-1, ::-1].copy()}
    # windows with (almost) no texture give numerically meaningless NCC (~1.0); they can never be candidates
    def win_std(img):
        m = cv2.boxFilter(img, -1, (P, P), normalize=True, anchor=(0, 0), borderType=cv2.BORDER_CONSTANT)
        m2 = cv2.boxFilter(img * img, -1, (P, P), normalize=True, anchor=(0, 0), borderType=cv2.BORDER_CONSTANT)
        sd = np.sqrt(np.maximum(m2 - m * m, 0))
        return sd[:img.shape[0] - P + 1, :img.shape[1] - P + 1]
    flip_sd = {k: win_std(v) for k, v in flips.items()}
    hits = []
    tested = 0
    for _ in range(3000):
        if tested >= 300: break
        y = int(rng.integers(0, H - P)); x = int(rng.integers(0, W - P))
        if ex[0] - P < y < ex[1] and ex[2] - P < x < ex[3]: continue
        patch = g[y:y + P, x:x + P]
        if patch.std() < 4: continue  # skip textureless areas: nothing to copy-detect
        tested += 1
        best = (0.0, None)
        for name, img in flips.items():
            r = cv2.matchTemplate(img, patch, cv2.TM_CCOEFF_NORMED)
            r[flip_sd[name] < max(2.0, 0.5 * float(patch.std()))] = -1
            # exclude the patch's own location (and its immediate neighbourhood) in the un-flipped image
            if name == 'none':
                r[max(0, y - 30):y + 30, max(0, x - 30):x + 30] = -1
            else:
                fy = (H - P - y) if name in ('vflip', 'rot180') else y
                fx = (W - P - x) if name in ('hflip', 'rot180') else x
                r[max(0, fy - 30):fy + 30, max(0, fx - 30):fx + 30] = -1
            _, mv, _, ml = cv2.minMaxLoc(r)
            if mv > best[0]: best = (mv, (name, ml))
        if best[0] >= a.thr:
            name, (mx, my) = best[1]
            oy = (H - P - my) if name in ('vflip', 'rot180') else my  # match position in original coordinates
            region = lambda yy: 'band' if (a.band_only or st <= yy + P / 2 <= sb) else 'extension'
            hits.append({'patch_xy_960': [x, y], 'ncc': round(best[0], 3), 'match': name, 'at': [int(mx), int(my)],
                         'patch_region': region(y), 'match_region': region(oy)})
    ext_hits = [h for h in hits if 'extension' in (h['patch_region'], h['match_region'])]
    results.append({'frame': path, 'seam_mirror_ncc': seam, 'patches_tested': tested, 'copy_hits': len(hits),
                    'extension_copy_hits': len(ext_hits), 'band_internal_hits_natural': len(hits) - len(ext_hits),
                    'copy_hit_rate': round(len(hits) / max(1, tested), 3), 'hits': hits[:25]})
    if a.viz:
        v = sm.copy()
        for h in hits:
            x, y = h['patch_xy_960']
            cv2.rectangle(v, (x, y), (x + P, y + P), (0, 0, 255) if 'extension' in (h['patch_region'], h['match_region']) else (0, 200, 0), 2)
        cv2.line(v, (0, st), (W, st), (0, 255, 255), 1); cv2.line(v, (0, sb), (W, sb), (0, 255, 255), 1)
        out = a.viz if len(a.frames) == 1 else a.viz.replace('.png', f'_{len(results)}.png')
        cv2.imwrite(out, v)
    print(f"{path}: seam mirror NCC {seam} | copy hits involving extensions {len(ext_hits)}/{tested} | natural in-band {len(hits) - len(ext_hits)}")
if a.json: json.dump(results, open(a.json, 'w'), indent=1)

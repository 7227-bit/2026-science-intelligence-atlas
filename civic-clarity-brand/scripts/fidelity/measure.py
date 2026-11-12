"""Fidelity measurement: candidate final frame vs. the owner-selected reference, at identical dimensions.

Usage:
  python3 -I scripts/fidelity/measure.py <reference.jpeg> <candidate_frame.png> <out_dir> [--band-x0 X --band-y0 Y --band-scale S]

The candidate frame is a full 16:9 render. The reference hero band (1536x446 @ 0,0 of the
reference image) is located in the candidate either from the given placement or, if omitted,
by multi-scale template matching on the Capitol dome. The candidate band is then resampled to
exactly 1536x446 and both images are measured with the SAME detection code.

Outputs: measurements.json, side_by_side.png, overlay_blend.png, overlay_edges.png, diff_heatmap.png,
         annotated_reference.png, annotated_candidate.png
"""
import sys, os, json, argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('reference'); ap.add_argument('candidate'); ap.add_argument('out')
ap.add_argument('--band-x0', type=float); ap.add_argument('--band-y0', type=float); ap.add_argument('--band-scale', type=float)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
BW, BH = 1536, 446

ref = cv2.imread(a.reference)[:BH, :BW]
full = cv2.imread(a.candidate)
FH, FW = full.shape[:2]

# ---- locate the band in the candidate frame
def locate():
    tmpl = ref[0:240, 640:900]
    best = (-1, None)
    for s in np.linspace(2.0, 3.2, 61):
        sm = cv2.resize(full, (round(FW / s), round(FH / s)), interpolation=cv2.INTER_AREA)
        if sm.shape[0] < tmpl.shape[0] or sm.shape[1] < tmpl.shape[1]: continue
        r = cv2.matchTemplate(sm, tmpl, cv2.TM_CCOEFF_NORMED)
        _, mv, _, ml = cv2.minMaxLoc(r)
        if mv > best[0]: best = (mv, (s, (ml[0] - 640) * s, (ml[1] - 0) * s))
    return best
if a.band_scale:
    S, X0, Y0, score = a.band_scale, a.band_x0, a.band_y0, None
else:
    score, (S, X0, Y0) = locate()
M = np.float32([[S, 0, X0], [0, S, Y0]])
cand = cv2.warpAffine(full, M, (BW, BH), flags=cv2.WARP_INVERSE_MAP | cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT)

def measure(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); V = hsv[..., 2].astype(int); Sat = hsv[..., 1].astype(int)
    out = {}
    # wordmark: bright, low-saturation components in the title zone
    t = ((V > 120) & (Sat < 115)).astype(np.uint8) * 255
    t[:205] = 0; t[352:] = 0; t[:, :170] = 0; t[:, 1380:] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(t, 8)
    comps = [st[i] for i in range(1, n) if st[i][4] > 250 and st[i][3] > 40]
    if comps:
        x1 = min(c[0] for c in comps); y1 = min(c[1] for c in comps)
        x2 = max(c[0] + c[2] for c in comps); y2 = max(c[1] + c[3] for c in comps)
        out['wordmark_bbox'] = [int(x1), int(y1), int(x2), int(y2)]
        out['wordmark_letters'] = sorted([[int(c[0]), int(c[1]), int(c[0] + c[2]), int(c[1] + c[3])] for c in comps])
        letter = np.zeros_like(t)
        for i in range(1, n):
            if st[i][4] > 250 and st[i][3] > 40: letter[lab == i] = 1
        core = cv2.erode(letter, np.ones((3, 3), np.uint8))
        lab_ = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(float)
        px = lab_[core > 0]
        out['letter_material'] = {
            'L_mean': round(float(px[:, 0].mean() * 100 / 255), 1), 'L_p10': round(float(np.percentile(px[:, 0], 10) * 100 / 255), 1),
            'L_p90': round(float(np.percentile(px[:, 0], 90) * 100 / 255), 1),
            'a_mean': round(float(px[:, 1].mean() - 128), 1), 'b_mean': round(float(px[:, 2].mean() - 128), 1),
        }
    # descriptor
    d = ((V > 110) & (Sat < 100)).astype(np.uint8) * 255; d[:368] = 0; d[406:] = 0; d[:, :370] = 0; d[:, 1190:] = 0
    ys, xs = np.where(d > 0)
    if len(xs): out['descriptor_bbox'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    # star: brightest blob centre-bottom
    s = V.copy(); s[:398] = 0; s[:, :720] = 0; s[:, 816:] = 0
    m = (s > 170).astype(np.uint8)
    ys, xs = np.where(m)
    if len(xs): out['star'] = {'cx': round(float(xs.mean()), 1), 'cy': round(float(ys.mean()), 1), 'w': int(xs.max() - xs.min()), 'h': int(ys.max() - ys.min())}
    # glow line: brightest row in 345..372 across the centre span, and its horizontal extent
    rows = V[345:372, 420:1120].mean(1); gy = 345 + int(np.argmax(rows))
    row = cv2.GaussianBlur(V[gy].astype(np.float32).reshape(1, -1), (0, 0), 3).ravel()
    on = np.where(row > 110)[0]
    out['glow_line'] = {'y': gy, 'x1': int(on.min()) if len(on) else None, 'x2': int(on.max()) if len(on) else None}
    # halo arc: ridge detection near the known path, least-squares circle
    ridge = V.astype(float) - cv2.GaussianBlur(V.astype(float), (0, 0), 4)
    pts = []; cx, cy, r = 767.0, 388.0, 371.0
    for x in list(range(420, 700, 6)) + list(range(840, 1120, 6)):
        ye = cy - np.sqrt(max(1.0, r * r - (x - cx) ** 2)); lo, hi = int(max(2, ye - 30)), int(min(240, ye + 30))
        if hi <= lo: continue
        col = ridge[lo:hi, x]; yy = lo + int(np.argmax(col))
        if col.max() > 20: pts.append((x, yy))
    if len(pts) > 10:
        p = np.array(pts, float)
        for _ in range(3):
            A = np.c_[2 * p, np.ones(len(p))]; b = (p ** 2).sum(1); so = np.linalg.lstsq(A, b, rcond=None)[0]
            cx, cy = so[0], so[1]; r = np.sqrt(so[2] + cx * cx + cy * cy)
            res = np.abs(np.hypot(p[:, 0] - cx, p[:, 1] - cy) - r); p = p[res < max(2.5, np.percentile(res, 80))]
        out['arc'] = {'cx': round(float(cx), 1), 'cy': round(float(cy), 1), 'r': round(float(r), 1), 'points': int(len(p))}
    # dome: horizontal extent of strong vertical edges at three heights + lantern/finial top
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(float)
    gx = np.abs(cv2.Sobel(g, cv2.CV_64F, 1, 0, ksize=3))
    dome = {}
    for yy in (120, 170, 198):
        row = cv2.GaussianBlur(gx[yy - 2:yy + 3].mean(0).reshape(1, -1), (0, 0), 1.5).ravel()
        L = 560 + int(np.argmax(row[560:768])); R = 768 + int(np.argmax(row[768:980]))
        dome[f'width_at_y{yy}'] = [L, R]
    col = g[:80, 760:777].mean(1); bg = g[:80, 700:720].mean(1)
    diff = np.abs(col - bg); top = np.where(diff > 12)[0]
    dome['finial_top_y'] = int(top[0]) if len(top) else None
    out['dome'] = dome
    return out

mr, mc = measure(ref), measure(cand)

# letter material compared on the SAME pixels: the reference's own letter mask (incl. dark bevels), slightly eroded
hsvr = cv2.cvtColor(ref, cv2.COLOR_BGR2HSV)
lm = ((hsvr[..., 2] > 70) & (hsvr[..., 1] < 140)).astype(np.uint8)
lm[:205] = 0; lm[350:] = 0; lm[:, :190] = 0; lm[:, 1345:] = 0
n, lab, st, _ = cv2.connectedComponentsWithStats(lm, 8)
keep = np.zeros_like(lm)
for i in range(1, n):
    if st[i][4] > 300 and st[i][3] > 40: keep[lab == i] = 1
keep = cv2.erode(keep, np.ones((3, 3), np.uint8))
def material(img):
    L = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(float)[keep > 0]
    return {'L_mean': round(float(L[:, 0].mean() * 100 / 255), 1), 'L_p10': round(float(np.percentile(L[:, 0], 10) * 100 / 255), 1),
            'L_p50': round(float(np.percentile(L[:, 0], 50) * 100 / 255), 1), 'L_p90': round(float(np.percentile(L[:, 0], 90) * 100 / 255), 1),
            'a_mean': round(float(L[:, 1].mean() - 128), 1), 'b_mean': round(float(L[:, 2].mean() - 128), 1), 'pixels': int(len(L))}
mr['letter_material'] = material(ref); mc['letter_material'] = material(cand)

def ssim(x, y):
    x = cv2.cvtColor(x, cv2.COLOR_BGR2GRAY).astype(np.float64); y = cv2.cvtColor(y, cv2.COLOR_BGR2GRAY).astype(np.float64)
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    mx, my = cv2.GaussianBlur(x, (11, 11), 1.5), cv2.GaussianBlur(y, (11, 11), 1.5)
    sx = cv2.GaussianBlur(x * x, (11, 11), 1.5) - mx * mx; sy = cv2.GaussianBlur(y * y, (11, 11), 1.5) - my * my
    sxy = cv2.GaussianBlur(x * y, (11, 11), 1.5) - mx * my
    return float((((2 * mx * my + C1) * (2 * sxy + C2)) / ((mx * mx + my * my + C1) * (sx + sy + C2))).mean())
regions = {'whole_band': (0, 0, BW, BH), 'title': (190, 205, 1345, 352), 'descriptor_rules_star': (230, 370, 1310, 446),
           'dome': (640, 0, 900, 245), 'flag': (0, 0, 420, 446), 'sky_right': (1000, 0, BW, 240)}
px = {}
for k, (x1, y1, x2, y2) in regions.items():
    r_, c_ = ref[y1:y2, x1:x2], cand[y1:y2, x1:x2]
    px[k] = {'mae': round(float(np.abs(r_.astype(int) - c_.astype(int)).mean()), 2), 'ssim': round(ssim(r_, c_), 3),
             'mean_luma_ref': round(float(cv2.cvtColor(r_, cv2.COLOR_BGR2GRAY).mean()), 1), 'mean_luma_cand': round(float(cv2.cvtColor(c_, cv2.COLOR_BGR2GRAY).mean()), 1)}

def delta(a_, b_):
    if isinstance(a_, dict): return {k: delta(a_[k], b_.get(k)) for k in a_ if k in b_}
    if isinstance(a_, list) and a_ and isinstance(a_[0], (int, float)) and isinstance(b_, list): return [round(float(y - x), 1) for x, y in zip(a_, b_)]
    if isinstance(a_, (int, float)) and isinstance(b_, (int, float)): return round(float(b_ - a_), 1)
    return None
res = {'frame': [FW, FH], 'band_placement_in_frame': {'scale': round(S, 4), 'x0': round(X0, 1), 'y0': round(Y0, 1), 'match_score': None if score is None else round(score, 3),
        'band_rect_px': [round(X0), round(Y0), round(X0 + BW * S), round(Y0 + BH * S)],
        'band_width_pct_of_frame': round(BW * S / FW * 100, 1), 'band_height_pct_of_frame': round(BH * S / FH * 100, 1),
        'below_band_pct_of_frame': round((FH - (Y0 + BH * S)) / FH * 100, 1), 'above_band_pct_of_frame': round(Y0 / FH * 100, 1)},
       'reference': mr, 'candidate': mc, 'delta_candidate_minus_reference': delta(mr, mc), 'pixel_similarity': px}
if 'wordmark_bbox' in mc:
    wb = mc['wordmark_bbox']; res['title_width_pct_of_frame'] = round((wb[2] - wb[0]) * S / FW * 100, 1)
    res['title_width_pct_of_reference_image'] = round((mr['wordmark_bbox'][2] - mr['wordmark_bbox'][0]) / BW * 100, 1)
json.dump(res, open(os.path.join(a.out, 'measurements.json'), 'w'), indent=1)

# ---- visuals at identical dimensions (2x for legibility)
Z = 2
R2 = cv2.resize(ref, (BW * Z, BH * Z), interpolation=cv2.INTER_CUBIC); C2 = cv2.resize(cand, (BW * Z, BH * Z), interpolation=cv2.INTER_CUBIC)
def label(im, txt):
    im = im.copy(); cv2.rectangle(im, (0, 0), (im.shape[1], 46), (0, 0, 0), -1)
    cv2.putText(im, txt, (16, 33), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA); return im
cv2.imwrite(os.path.join(a.out, 'side_by_side.png'), np.vstack([label(R2, 'REFERENCE (owner-selected), hero band 1536x446 @ 2x'), label(C2, 'CANDIDATE final frame, band region resampled to identical 1536x446 @ 2x')]))
cv2.imwrite(os.path.join(a.out, 'overlay_blend.png'), label(cv2.addWeighted(R2, 0.5, C2, 0.5, 0), '50/50 BLEND reference + candidate (ghosting = misregistration)'))
e = cv2.Canny(cv2.cvtColor(R2, cv2.COLOR_BGR2GRAY), 60, 150)
ov = (C2 * 0.75).astype(np.uint8); ov[e > 0] = (255, 255, 0)
cv2.imwrite(os.path.join(a.out, 'overlay_edges.png'), label(ov, 'CANDIDATE with REFERENCE edges (cyan)'))
dif = np.abs(R2.astype(int) - C2.astype(int)).max(2).astype(np.float32)
hm = cv2.applyColorMap(np.clip(dif * 3, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
cv2.imwrite(os.path.join(a.out, 'diff_heatmap.png'), label(hm, 'ABS DIFFERENCE x3 (black = identical)'))
def annotate(img, m, color):
    im = cv2.resize(img, (BW * Z, BH * Z), interpolation=cv2.INTER_CUBIC)
    if 'wordmark_bbox' in m:
        x1, y1, x2, y2 = [v * Z for v in m['wordmark_bbox']]; cv2.rectangle(im, (x1, y1), (x2, y2), color, 2)
    if 'descriptor_bbox' in m:
        x1, y1, x2, y2 = [v * Z for v in m['descriptor_bbox']]; cv2.rectangle(im, (x1, y1), (x2, y2), color, 2)
    if 'star' in m: cv2.circle(im, (int(m['star']['cx'] * Z), int(m['star']['cy'] * Z)), 14 * Z, color, 2)
    if 'arc' in m: cv2.circle(im, (int(m['arc']['cx'] * Z), int(m['arc']['cy'] * Z)), int(m['arc']['r'] * Z), color, 1)
    for k, v in m['dome'].items():
        if k.startswith('width'):
            L, R = v; y = int(k.split('y')[-1]) * Z; cv2.line(im, (L * Z, y), (R * Z, y), color, 2)
    gl = m['glow_line']
    if gl['x1'] is not None: cv2.line(im, (gl['x1'] * Z, gl['y'] * Z), (gl['x2'] * Z, gl['y'] * Z), color, 1)
    return im
cv2.imwrite(os.path.join(a.out, 'annotated_reference.png'), annotate(ref, mr, (0, 255, 0)))
cv2.imwrite(os.path.join(a.out, 'annotated_candidate.png'), annotate(cand, mc, (0, 200, 255)))
print(json.dumps({k: res[k] for k in ('band_placement_in_frame', 'pixel_similarity')}, indent=1))
print('delta', json.dumps(res['delta_candidate_minus_reference']))

"""Replace the subtitle in the hi-res reference band while preserving its rendering style.

replace_subtitle(ref4, mask_old, mask_new, layout) -> (new_ref4, report)

1. The original letters (plus their drop shadow and halo) are removed by Telea inpainting.
2. A rendering model  out = bg*(1 - k*Shadow) * (1 - E) + colour*E + g*Glow  is CALIBRATED by
   re-synthesising the ORIGINAL wording over the cleaned background and grid-searching the
   parameters that minimise the error against the reference's own subtitle pixels.
3. The new wording is rendered with exactly those parameters.
4. The flank rules are stretched inward so the text-to-rule spacing stays as in the reference.
"""
import cv2
import numpy as np
import itertools

X4 = 4
ROW0, ROW1 = 366 * X4, 408 * X4  # descriptor working rows (band 366..408)


def _shift(m, dx, dy):
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    return cv2.warpAffine(m, M, (m.shape[1], m.shape[0]), flags=cv2.INTER_LINEAR, borderValue=0)


def _render(bg, M, col, p):
    se, k, ss, dx, dy, g, sg = p
    E = cv2.GaussianBlur(M, (0, 0), se) if se > 0 else M
    S = cv2.GaussianBlur(_shift(M, dx, dy), (0, 0), ss)
    out = bg * (1 - k * np.clip(S, 0, 1))[..., None]
    out = out * (1 - E[..., None]) + col[None, None, :] * E[..., None]
    if g > 0:
        out = out + g * cv2.GaussianBlur(M, (0, 0), sg)[..., None] * col[None, None, :]
    return np.clip(out, 0, 255)


def replace_subtitle(ref4, mask_old, mask_new, lay, report_cb=print):
    ref = ref4.astype(np.float32)
    Mo = mask_old.astype(np.float32) / 255.0
    Mn = mask_new.astype(np.float32) / 255.0
    sl = slice(ROW0, ROW1)
    roi = ref[sl].copy()
    mo, mn = Mo[sl], Mn[sl]
    # --- 0. register each ORIGINAL glyph to the reference letters (per-letter template match, +-14 px)
    L = cv2.cvtColor(np.clip(roi, 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    n, lab, st, _ = cv2.connectedComponentsWithStats((mo > 0.02).astype(np.uint8), 8)
    reg = np.zeros_like(mo)
    shifts = []
    R = 14
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 30: continue
        g = np.where(lab[y:y + h, x:x + w] == i, mo[y:y + h, x:x + w], 0)
        y0, y1 = max(0, y - R), min(L.shape[0], y + h + R); x0, x1 = max(0, x - R), min(L.shape[1], x + w + R)
        res = cv2.matchTemplate(L[y0:y1, x0:x1], g.astype(np.float32), cv2.TM_CCOEFF_NORMED)
        _, _, _, ml = cv2.minMaxLoc(res)
        nx, ny = x0 + ml[0], y0 + ml[1]
        reg[ny:ny + h, nx:nx + w] = np.maximum(reg[ny:ny + h, nx:nx + w], g)
        shifts.append((nx - x, ny - y))
    mo = reg
    # detected reference letter pixels (ivory, low saturation) - the removal must cover what is really there
    hsv = cv2.cvtColor(np.clip(roi, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
    det = ((hsv[..., 2] > 85) & (hsv[..., 1] < 110)).astype(np.uint8)
    det[:, :int(376 * X4)] = 0; det[:, int(1186 * X4):] = 0
    det[:(372 * X4 - ROW0)] = 0; det[(404 * X4 - ROW0):] = 0
    # --- 1. remove original letters + shadow + halo
    rm = np.maximum((mo > 0.04).astype(np.uint8), det)
    rm = cv2.dilate(rm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (27, 27)))  # include the letters' dark shadow halo
    rm = np.maximum(rm, cv2.dilate((_shift(mo, 6, 8) > 0.04).astype(np.uint8), np.ones((9, 9), np.uint8)))
    bg = cv2.inpaint(np.clip(roi, 0, 255).astype(np.uint8), rm * 255, 15, cv2.INPAINT_TELEA).astype(np.float32)
    # smooth the filled area slightly so no inpaint structure remains (background there is a soft dark gradient)
    rmf = cv2.GaussianBlur(rm.astype(np.float32), (0, 0), 6)[..., None]
    bg = bg * (1 - rmf) + cv2.GaussianBlur(bg, (0, 0), 7) * rmf
    # --- 2. calibrate on the ORIGINAL wording
    core = cv2.erode((mo > 0.95).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    col = np.median(roi[core], axis=0)
    evalm = cv2.dilate((mo > 0.02).astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
    grid = itertools.product([0.6, 1.0, 1.4, 2.0], [0.0, 0.25, 0.45, 0.65], [3.0, 6.0], [3.0, 6.0], [4.0, 8.0], [0.0, 0.08, 0.16], [8.0])
    best = (1e9, None)
    for p in grid:
        syn = _render(bg, mo, col, p)
        e = float(np.abs(syn - roi)[evalm].mean())
        if e < best[0]:
            best = (e, p)
    err_cal, p = best
    base_err = float(np.abs(bg - roi)[evalm].mean())  # error if letters were simply missing
    syn_old = _render(bg, mo, col, p)
    # --- 3. render the new wording with the calibrated model
    new_roi = _render(bg, mn, col, p)
    # --- 4. stretch the flank rules inward (rules live in band rows ~383..396)
    r0, r1 = 379 * X4 - ROW0, 400 * X4 - ROW0
    def stretch(img, sx0, sx1, dx0, dx1):
        strip = img[r0:r1, int(sx0 * X4):int(sx1 * X4)]
        st = cv2.resize(strip, (int(dx1 * X4) - int(dx0 * X4), r1 - r0), interpolation=cv2.INTER_CUBIC)
        w = np.ones(st.shape[:2], np.float32)
        fv = 6
        w[:fv] = np.linspace(0, 1, fv)[:, None]; w[-fv:] = np.linspace(1, 0, fv)[:, None]
        tgt = img[r0:r1, int(dx0 * X4):int(dx1 * X4)]
        img[r0:r1, int(dx0 * X4):int(dx1 * X4)] = tgt * (1 - w[..., None]) + st * w[..., None]
    gapL = lay['old']['x1'] - 353  # reference gap text-to-left-rule
    gapR = 1204 - lay['old']['x2']  # reference gap right-rule-to-text
    newL_end = lay['new']['x1'] - gapL
    newR_start = lay['new']['x2'] + gapR
    stretch(new_roi, 236, 366, 236, newL_end + 13)
    stretch(new_roi, 1192, 1316, newR_start - 12, 1316)
    out = ref.copy()
    out[sl] = new_roi
    rep = {
        'glyph_registration_shifts_px': {'n': len(shifts), 'max_abs': int(max(max(abs(a), abs(b)) for a, b in shifts)) if shifts else 0},
        'calibration_params': dict(zip(['edge_sigma', 'shadow_k', 'shadow_sigma', 'shadow_dx', 'shadow_dy', 'glow_g', 'glow_sigma'], [float(v) for v in p])),
        'letter_colour_bgr': [round(float(c), 1) for c in col],
        'calibration_mae_original_wording': round(err_cal, 2),
        'mae_if_letters_absent': round(base_err, 2),
        'rules': {'left': [248, round(newL_end, 1)], 'right': [round(newR_start, 1), 1304], 'gap_left': gapL, 'gap_right': gapR},
    }
    report_cb(rep)
    return np.clip(out, 0, 255), rep, syn_old, roi

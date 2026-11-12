"""Original (non-mirrored, non-repeated) 16:9 extensions for the V4 ident.

Nothing here copies, reflects or tiles image content. The sky above and the ground below are generated
procedurally (seeded, domain-warped fractal noise with anisotropic, horizontally streaked cloud forms),
coloured from palette statistics measured on the reference sky, lit from below by the reference's own
horizon light, and joined to the reference band with a gradient-domain colour correction so the seam is
continuous. The single flag fades into atmosphere at the band's top and bottom edges instead of being
continued as a copy.
"""
import cv2
import numpy as np

X4 = 4


def _value_noise(h, w, cell_y, cell_x, rng):
    gh, gw = int(np.ceil(h / cell_y)) + 3, int(np.ceil(w / cell_x)) + 3
    grid = rng.random((gh, gw)).astype(np.float32)
    big = cv2.resize(grid, (gw * cell_x, gh * cell_y), interpolation=cv2.INTER_CUBIC)
    oy, ox = int(rng.integers(0, cell_y)), int(rng.integers(0, cell_x))
    return big[oy:oy + h, ox:ox + w]


def _fbm(h, w, base_cell, aniso, octaves, rng, gain=0.5):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    cell = float(base_cell)
    for _ in range(octaves):
        cy = max(2, int(cell)); cx = max(2, int(cell * aniso))
        out += amp * _value_noise(h, w, cy, cx, rng)
        tot += amp; amp *= gain; cell /= 2.0
    return out / tot


def _warp(img, dx, dy):
    h, w = img.shape
    xs, ys = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, xs + dx, ys + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def cloud_field(h, w, seed, base_cell=150, aniso=2.6, warp=70.0):
    """Domain-warped fBm (two-level warp). Values ~0..1. Seeded, so deterministic; no tiling or reuse."""
    rng = np.random.default_rng(seed)
    q1 = _fbm(h, w, base_cell * 1.4, aniso, 4, rng) - 0.5
    q2 = _fbm(h, w, base_cell * 1.4, aniso, 4, rng) - 0.5
    r1 = _warp(_fbm(h, w, base_cell, aniso, 5, rng), q1 * warp * aniso, q2 * warp) - 0.5
    r2 = _warp(_fbm(h, w, base_cell, aniso, 5, rng), q2 * warp * aniso, q1 * warp) - 0.5
    d = _warp(_fbm(h, w, base_cell, aniso, 7, rng, gain=0.52), r1 * warp * 1.6 * aniso, r2 * warp * 1.6)
    d = (d - np.percentile(d, 2)) / (np.percentile(d, 98) - np.percentile(d, 2) + 1e-6)
    return np.clip(d, 0, 1)


def palette(band):
    """Sky palette measured on the reference band (band resolution BGR)."""
    H, W = band.shape[:2]
    sky = band[0:225].reshape(-1, 3).astype(np.float32)
    yy, xx = np.mgrid[0:225, 0:W]
    keep = ((xx > 600) & ~((xx > 630) & (xx < 910))).ravel()  # exclude flag and dome
    s = sky[keep]
    L = s.mean(1)
    warmth = s[:, 2] - s[:, 0]
    dark = np.percentile(s[L < np.percentile(L, 20)], 50, axis=0)
    mid = np.percentile(s[(L > np.percentile(L, 40)) & (L < np.percentile(L, 60))], 50, axis=0)
    cool = np.percentile(s[(warmth < 0) & (L > np.percentile(L, 80))], 50, axis=0) if np.any((warmth < 0) & (L > np.percentile(L, 80))) else mid * 1.4
    warm = np.percentile(s[warmth > 40], 85, axis=0) if np.any(warmth > 40) else np.array([90, 150, 230], np.float32)
    return {'dark': dark, 'mid': mid, 'cool': cool, 'warm': warm}


def _local_stats(band, rows, exclude, nbins_x=8, nq=101, nl=24):
    """Per horizontal bin: luminance quantile function and a luminance->colour LUT measured on the reference."""
    H, W = band.shape[:2]
    reg = band[rows].astype(np.float32)
    ex = exclude[rows]
    L = reg.mean(2)
    edges = np.linspace(0, W, nbins_x + 1)
    Q, LUT, centres = [], [], []
    for k in range(nbins_x):
        x0, x1 = int(edges[k]), int(edges[k + 1])
        m = ~ex[:, x0:x1]
        Ls = L[:, x0:x1][m]; Cs = reg[:, x0:x1][m]
        if len(Ls) < 500:
            Q.append(None); LUT.append(None); centres.append((x0 + x1) / 2); continue
        Q.append(np.percentile(Ls, np.linspace(0, 100, nq)))
        lb = np.linspace(Ls.min(), Ls.max() + 1e-3, nl + 1)
        idx = np.clip(np.digitize(Ls, lb) - 1, 0, nl - 1)
        lut = np.zeros((nl, 3), np.float32)
        for i in range(nl):
            sel = Cs[idx == i]
            lut[i] = sel.mean(0) if len(sel) else np.nan
        # fill empty LUT rows by interpolation along L
        for c in range(3):
            v = lut[:, c]; ok = ~np.isnan(v)
            lut[:, c] = np.interp(np.arange(nl), np.where(ok)[0], v[ok])
        LUT.append((lb, lut)); centres.append((x0 + x1) / 2)
    # borrow nearest valid bin for empty ones (e.g. bins fully covered by the flag)
    valid = [i for i, q in enumerate(Q) if q is not None]
    for i in range(nbins_x):
        if Q[i] is None:
            j = min(valid, key=lambda v: abs(v - i)); Q[i] = Q[j]; LUT[i] = LUT[j]
    return Q, LUT, np.array(centres)


def _transfer(P, Q, LUT, centres, W_band):
    """Map field P (any range) to reference luminance per x (quantile transfer), then colour via the LUT."""
    h, w = P.shape
    r = np.empty(P.size, np.float32)
    order = np.argsort(P.ravel(), kind='stable')
    r[order] = np.linspace(0, 1, P.size, dtype=np.float32)
    r = r.reshape(h, w)
    xs = np.linspace(0, W_band, w)
    out = np.zeros((h, w, 3), np.float32)
    wsum = np.zeros((h, w, 1), np.float32)
    bw = (centres[1] - centres[0]) if len(centres) > 1 else W_band
    for k in range(len(centres)):
        wk = np.clip(1 - np.abs(xs - centres[k]) / bw, 0, 1)[None, :, None]  # linear blend between bins
        if wk.max() == 0: continue
        Lk = np.interp(r, np.linspace(0, 1, len(Q[k])), Q[k])
        lb, lut = LUT[k]
        li = np.clip((Lk - lb[0]) / (lb[-1] - lb[0]) * (len(lut) - 1), 0, len(lut) - 1)
        i0 = np.floor(li).astype(int); i1 = np.minimum(i0 + 1, len(lut) - 1); fr = (li - i0)[..., None]
        ck = lut[i0] * (1 - fr) + lut[i1] * fr
        out += ck * wk; wsum += wk
    return out / np.maximum(wsum, 1e-6)


def _seam_correct(gen, edge_band_row, edge_gen_row, toward_seam, lam_px, sig_px, flag_w, flag_lam, flag_sig):
    """Gradient-domain style correction: add the (low-passed) colour difference at the seam, decaying away from it."""
    h, w = gen.shape[:2]
    diff = edge_band_row - edge_gen_row  # (w,3)
    d_norm = cv2.GaussianBlur(diff.reshape(1, w, 3), (0, 0), sigmaX=sig_px).reshape(w, 3)
    d_flag = cv2.GaussianBlur(diff.reshape(1, w, 3), (0, 0), sigmaX=flag_sig).reshape(w, 3)
    dist = np.arange(h, dtype=np.float32)
    dist = dist[::-1] if toward_seam == 'bottom' else dist  # distance from the seam in rows
    dec_n = np.exp(-dist / lam_px)[:, None, None]
    dec_f = np.exp(-dist / flag_lam)[:, None, None]
    fw = flag_w[None, :, None]
    corr = (d_norm[None] * dec_n) * (1 - fw) + (d_flag[None] * dec_f) * fw
    return gen + corr


def build_extensions(band_ref_lo, band4, T, B, W, seed=20261112):
    """band_ref_lo: reference band at band resolution (BGR float); band4: hi-res band (x4) used for the seam rows.
    Returns (top4, bottom4, flag_edge_weights_top, flag_edge_weights_bottom) at hi-res."""
    H = band_ref_lo.shape[0]
    pal = palette(band_ref_lo)
    WW = W * X4
    # ---------------- sky above (T band rows -> T*4 hi-res rows), generated at x2 then upsampled
    th, tw = T * 2, W * 2
    D1 = cloud_field(th, tw, seed, base_cell=300, aniso=2.0, warp=90)      # large billowing masses
    D2 = cloud_field(th, tw, seed + 7, base_cell=90, aniso=1.7, warp=35)   # secondary forms
    D = 0.75 * D1 + 0.25 * D2
    D = np.clip((D - 0.22) / 0.62, 0, 1); D = D * D * (3 - 2 * D)          # soft (no hard threshold)
    Ds = cv2.GaussianBlur(D, (0, 0), 3)
    gy, gx = np.gradient(Ds)
    y = np.linspace(0, 1, th)[:, None]  # 0 at top edge, 1 at seam
    xs2 = np.linspace(0, W, tw)[None, :]
    # light source: the horizon glow behind the dome, below the seam
    lx, ly = (768 - xs2) * 2, (th + 260 - np.arange(th)[:, None] * 1.0)
    ln = np.sqrt(lx ** 2 + ly ** 2) + 1e-6
    facing = np.clip(-(gx * lx + gy * ly) / ln * 40.0, -1, 1)               # surfaces turned toward the light
    near = np.exp(-(((xs2 - 768) / 620.0) ** 2)) * (0.35 + 0.65 * y ** 1.4)  # light falls off with distance
    rim = np.clip(facing, 0, 1) * D * (1 - D) * 4                             # silver/gold lining on cloud edges
    Hb, Wb = band_ref_lo.shape[:2]
    # right side of the reference sky is warm-lit; measure that horizontally from the band's upper rows
    top_rows = band_ref_lo[0:60].astype(np.float32)
    warmth = cv2.GaussianBlur(np.clip((top_rows[..., 2] - top_rows[..., 0]).mean(0) / 50.0, 0, 1).reshape(1, -1), (0, 0), 90).ravel()
    warmth = np.interp(np.linspace(0, Wb, tw), np.arange(Wb), warmth)[None, :]
    lightw = np.clip(0.55 * near + 0.6 * warmth * y, 0, 1)
    col = pal['dark'][None, None] * (1 - D[..., None]) + pal['mid'][None, None] * D[..., None]
    col = col + (pal['cool'] - pal['mid'])[None, None] * (D * np.clip(facing, 0, 1) * 0.35 * (1 - lightw))[..., None]
    col = col + (pal['warm'] - pal['mid'])[None, None] * ((rim * 0.85 + D * 0.25 * np.clip(facing + 0.3, 0, 1)) * lightw)[..., None]
    # global tonal match to the reference sky (single mapping: no per-region columns)
    sky = band_ref_lo[0:200].reshape(-1, 3).astype(np.float32)
    yy0, xx0 = np.mgrid[0:200, 0:Wb]
    ok = ((xx0 > 600) & ~((xx0 > 630) & (xx0 < 910))).ravel()
    Lr = np.sort(sky[ok].mean(1))
    Lg = col.mean(2)
    rank = np.empty(Lg.size, np.float32); rank[np.argsort(Lg.ravel(), kind='stable')] = np.linspace(0, 1, Lg.size)
    Lt = np.interp(rank, np.linspace(0, 1, len(Lr)), Lr).reshape(Lg.shape)
    col = col * (Lt / np.maximum(Lg, 1e-3))[..., None] * 0.92 + col * 0.08
    col = cv2.GaussianBlur(col, (0, 0), 0.8)
    # the atmosphere deepens away from the horizon toward the top edge (established look)
    col = col * (0.42 + 0.58 * y ** 0.75)[..., None]
    # soften generated structure over the last rows before the seam so the band's clouds hand over smoothly
    soft = cv2.GaussianBlur(col, (0, 0), 7)
    sw = np.clip((y - 0.86) / 0.14, 0, 1)[..., None] ** 1.5
    col = col * (1 - sw) + soft * sw
    top = cv2.resize(col, (WW, T * X4), interpolation=cv2.INTER_CUBIC)
    # flag zone weight (top-left): the single flag fades into the atmosphere instead of continuing
    xs = np.arange(WW, dtype=np.float32) / X4
    flag_top = np.clip((640 - xs) / 140.0, 0, 1)
    edge_band = band4[0:6].mean(0)
    edge_gen = top[-6:].mean(0)
    top = _seam_correct(top, edge_band, edge_gen, 'bottom', lam_px=110 * X4 / 2, sig_px=10 * X4,
                        flag_w=flag_top, flag_lam=22 * X4, flag_sig=60 * X4)
    # ---------------- ground below (B band rows)
    bh, bw = B * 2, W * 2
    g = cloud_field(bh, bw, seed + 101, base_cell=110, aniso=3.4, warp=50)
    yb = np.linspace(0, 1, bh)[:, None]  # 0 at seam, 1 at bottom edge
    bot_rows = band_ref_lo[Hb - 24:Hb].astype(np.float32).mean(0)
    base = cv2.GaussianBlur(bot_rows.reshape(1, -1, 3), (0, 0), 40).reshape(-1, 3)
    base = cv2.resize(base.reshape(1, -1, 3), (bw, 1)).reshape(-1, 3)[None]
    haze = 0.8 + 0.45 * (g[..., None] - 0.5)  # low-contrast ground haze, original (generated) structure
    xb = np.linspace(0, W, bw)[None, :]
    spill = np.exp(-((xb - 768) / 330.0) ** 2) * np.exp(-yb / 0.35)
    colb = base * haze + (pal['warm'][None, None] * 0.07) * spill[..., None]
    colb = colb * (1.0 - 0.70 * yb ** 0.9)[..., None]
    bot = cv2.resize(colb, (WW, B * X4), interpolation=cv2.INTER_CUBIC)
    flag_bot = np.clip((560 - xs) / 140.0, 0, 1)
    edge_band_b = band4[-6:].mean(0)
    edge_gen_b = bot[0:6].mean(0)
    bot = _seam_correct(bot, edge_band_b, edge_gen_b, 'top', lam_px=60 * X4 / 2, sig_px=10 * X4,
                        flag_w=flag_bot, flag_lam=18 * X4, flag_sig=60 * X4)
    # fine, non-repeating grain so the generated areas share the plate's micro-texture
    rng = np.random.default_rng(seed + 999)
    top = top + rng.normal(0, 1.6, top.shape).astype(np.float32)
    bot = bot + rng.normal(0, 1.4, bot.shape).astype(np.float32)
    return np.clip(top, 0, 255), np.clip(bot, 0, 255), flag_top, flag_bot


def flag_edge_fade(band4, flag_top_w, flag_bot_w, rows=22):
    """Inside the band, fade the flag's cut top/bottom edges into atmosphere (no half-stars at a hard edge)."""
    out = band4.astype(np.float32).copy()
    R = rows * X4
    ft = np.linspace(0.35, 1.0, R)[:, None] ** 0.8  # darker at the band edge
    out[:R] = out[:R] * (1 - flag_top_w[None, :, None] * (1 - ft[..., None]))
    fb = np.linspace(1.0, 0.35, R)[:, None] ** 0.8
    out[-R:] = out[-R:] * (1 - flag_bot_w[None, :, None] * (1 - fb[..., None]))
    return out


def deperiodize_facade(img4, T_rows_band=None):
    """Remove the periodic pilaster modulation from the rebuilt facade (band rows 252..446, x 330..1440):
    wide horizontal smoothing, then non-repeating fine grain."""
    out = img4.astype(np.float32).copy()
    y0, y1, x0, x1 = 252 * X4, 446 * X4, 330 * X4, 1440 * X4
    reg = out[y0:y1, x0:x1]
    sm = cv2.GaussianBlur(reg, (0, 0), sigmaX=60, sigmaY=4)
    w = np.ones(reg.shape[:2], np.float32)
    w = cv2.GaussianBlur(np.pad(w, ((0, 0), (0, 0))), (0, 0), 1)
    wx = np.clip(np.minimum(np.arange(x1 - x0), (x1 - x0) - np.arange(x1 - x0)) / 200.0, 0, 1)[None, :, None]
    rng = np.random.default_rng(77)
    out[y0:y1, x0:x1] = reg * (1 - wx) + (sm + rng.normal(0, 1.2, sm.shape)) * wx
    return out


def build_lowres_canvas(band_lo, src_for_seam, T, B, seed=20261112, fsr_mode='best'):
    """Band-resolution 16:9 canvas: generated sky above + original band + generated ground below, joined by
    FSR reconstruction across irregular transition strips (structure continued from BOTH sides; nothing copied).
    band_lo: band (BGR float) placed in the canvas. src_for_seam: band used as known context for the FSR
    (dome-free near the finial so the spire is not extrapolated upward)."""
    H, W = band_lo.shape[:2]
    pal = palette(band_lo)
    rng = np.random.default_rng(seed)

    # ---------- sky above
    D = cloud_field(T, W, seed, base_cell=170, aniso=2.2, warp=45)
    D2 = cloud_field(T, W, seed + 3, base_cell=60, aniso=1.8, warp=18)
    D = np.clip((0.8 * D + 0.2 * D2 - 0.2) / 0.65, 0, 1); D = D * D * (3 - 2 * D)
    D = cv2.GaussianBlur(D, (0, 0), 2.0)
    y = np.linspace(0, 1, T)[:, None]
    gy = np.gradient(cv2.GaussianBlur(D, (0, 0), 3), axis=0)
    lit = np.clip(-gy * 25, 0, 1)
    xs = np.linspace(0, W, W)[None, :]
    top_rows = band_lo[0:60]
    warmth = cv2.GaussianBlur(np.clip((top_rows[..., 2] - top_rows[..., 0]).mean(0) / 50.0, 0, 1).reshape(1, -1), (0, 0), 90).ravel()[None, :]
    near = np.exp(-(((xs - 768) / 650.0) ** 2))
    lightw = np.clip(0.5 * near + 0.7 * warmth, 0, 1) * y ** 1.3
    top = pal['dark'][None, None] * (1 - D[..., None]) + (pal['mid'] * 1.75)[None, None] * D[..., None]
    top = top + (pal['cool'] - pal['mid'])[None, None] * (D * 0.18 * (1 - lightw))[..., None]
    top = top + (pal['warm'] - pal['mid'])[None, None] * (lit * D * 0.85 * lightw)[..., None]
    top = top * (0.48 + 0.52 * y ** 0.8)[..., None]
    # tone continuity with the band's top edge (decaying correction of the low-passed colour difference)
    diff = cv2.GaussianBlur((src_for_seam[0:8].mean(0) - top[-8:].mean(0)).reshape(1, W, 3), (0, 0), 30).reshape(1, W, 3)
    top = top + diff * np.exp(-(np.arange(T)[::-1] / 70.0))[:, None, None]

    # ---------- ground below
    g = cloud_field(B, W, seed + 101, base_cell=120, aniso=3.0, warp=30)
    base = cv2.GaussianBlur(src_for_seam[H - 16:H].mean(0).reshape(1, -1, 3), (0, 0), 40).reshape(1, W, 3)
    yb = np.linspace(0, 1, B)[:, None]
    xb = np.arange(W)[None, :]
    spill = np.exp(-((xb - 768) / 330.0) ** 2) * np.exp(-yb / 0.35)
    bot = base * (0.82 + 0.4 * (g[..., None] - 0.5)) + (pal['warm'][None, None] * 0.06) * spill[..., None]
    bot = bot * (1 - 0.72 * yb ** 0.9)[..., None]

    canvas = np.concatenate([top, src_for_seam.astype(np.float32), bot], 0)
    gen_hp = np.concatenate([top - cv2.GaussianBlur(top, (0, 0), 4), np.zeros_like(band_lo, dtype=np.float32), bot - cv2.GaussianBlur(bot, (0, 0), 4)], 0)

    # ---------- transitions: per-column smooth continuation of the band's edge colour into the generated
    # content (no copying, no inpainting blobs); blend length varies irregularly along x so there is no straight line
    IN = 12
    out = canvas.copy()
    unknown = np.zeros(canvas.shape[:2], np.uint8)
    edge_top = cv2.GaussianBlur(src_for_seam[0:3].mean(0).reshape(1, W, 3), (0, 0), 5).reshape(W, 3)
    edge_bot = cv2.GaussianBlur(src_for_seam[H - 3:H].mean(0).reshape(1, W, 3), (0, 0), 22).reshape(W, 3)
    # across the spire (x 740..796) the edge colour is interpolated from the open sky either side (no spire
    # continuation, no chroma from the dome-removed plate)
    raw_top = darken_flag_edges(band_lo, 1)[0:3].mean(0)
    l, r = raw_top[736:740].mean(0), raw_top[796:800].mean(0)
    k = np.linspace(0, 1, 56)[:, None]
    raw_top[740:796] = l * (1 - k) + r * k
    # strong horizontal smoothing: only broad tone carries upward, never column structure (no vertical streaks)
    edge_top = cv2.GaussianBlur(raw_top.reshape(1, W, 3), (0, 0), 22).reshape(W, 3)
    Lt = 70 + 40 * (cloud_field(1, W, seed + 55, base_cell=90, aniso=1, warp=0)[0])  # 70..110 rows
    Lb = 40 + 25 * (cloud_field(1, W, seed + 56, base_cell=90, aniso=1, warp=0)[0])
    for x in range(W):
        n = int(Lt[x]); d = np.arange(1, n + 1, dtype=np.float32)  # distance above the seam
        wgt = np.exp(-(d / (n * 0.42)) ** 1.6)[:, None]             # 1 at the seam -> 0
        rows = slice(T - n, T)
        gen = top[T - n:T, x]
        out[rows, x] = (edge_top[x][None] * wgt[::-1] + gen * (1 - wgt[::-1]))
        unknown[rows, x] = 255
        n = int(Lb[x]); d = np.arange(1, n + 1, dtype=np.float32)
        wgt = np.exp(-(d / (n * 0.42)) ** 1.6)[:, None]
        rows = slice(T + H, T + H + n)
        gen = bot[0:n, x]
        out[rows, x] = edge_bot[x][None] * wgt + gen * (1 - wgt)
        unknown[rows, x] = 255
    # generated fine structure fades in with distance from the band
    rowsi = np.arange(canvas.shape[0])[:, None].astype(np.float32)
    dist = np.where(rowsi < T, (T - rowsi) / Lt[None, :], np.where(rowsi >= T + H, (rowsi - (T + H) + 1) / Lb[None, :], 0))
    tw = np.clip(dist, 0, 1)[..., None] * (unknown > 0)[..., None]
    out = out - gen_hp * (unknown > 0)[..., None] + gen_hp * tw
    return np.clip(out, 0, 255), unknown, IN


def darken_flag_edges(img, scale=1, rows_top=56, rows_bot=40):
    """The flag recedes into shadow toward the band's top/bottom cut edges (so the single flag ends naturally,
    with no hard crop line and nothing to continue into the extensions). img at `scale` x band resolution."""
    out = img.astype(np.float32).copy()
    h, w = out.shape[:2]
    xs = np.arange(w, dtype=np.float32) / scale
    wt = np.clip((700 - xs) / 160.0, 0, 1) ** 1.2      # flag zone at the top (flag reaches ~x 600)
    wb = np.clip((620 - xs) / 160.0, 0, 1) ** 1.2      # flag zone at the bottom
    Rt, Rb = rows_top * scale, rows_bot * scale
    ft = (np.linspace(0, 1, Rt) ** 1.6)[:, None] * 0.88 + 0.12
    fb = (np.linspace(1, 0, Rb) ** 1.6)[:, None] * 0.85 + 0.15
    out[:Rt] *= (1 - wt[None, :] * (1 - ft))[..., None]
    out[h - Rb:] *= (1 - wb[None, :] * (1 - fb))[..., None]
    return out

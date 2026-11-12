"""V4 plates (Targeted Final Revisions):
  1. subtitle 'INVESTIGATING LEGISLATION' (same typography style, tracking, rules, star, placement)
  2. NO mirrored or repeated content anywhere: generated (seeded procedural) sky/ground extensions joined
     to the band by FSR reconstruction; flag mask confined to the single original flag; periodic facade
     modulation removed from the pre-title plates.
Inputs: work dir with v2/, v3/ (see export_v3.py) and v4/subtitle_{old,new}_mask.png + subtitle_layout.json
Run:    python3 -I scripts/plate/export_v4.py <repo_root>   (cwd = work dir)
"""
import cv2, numpy as np, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from subtitle_v4 import replace_subtitle
import extend_v4 as E

root = sys.argv[1]
os.makedirs(os.path.join(root, 'public/plates/v4'), exist_ok=True)
OUT = lambda n: os.path.join(root, 'public/plates/v4', n)
W, H, T, B, X4, V2T = 1536, 446, 290, 128, 4, 110
HC = T + H + B

band_lo = cv2.imread('v2/band.png')[:H].astype(np.float32)
clean_b = cv2.imread('v2/out/plate_clean.png').astype(np.float32)[V2T:V2T + H]
sky_b = cv2.imread('v2/out/plate_sky.png').astype(np.float32)[V2T:V2T + H]
cap_b = cv2.imread('v2/out/matte_capitol.png', 0).astype(np.float32)[V2T:V2T + H]
flag_b = cv2.imread('v2/out/mask_flag.png', 0).astype(np.float32)[V2T:V2T + H]

def match_lowfreq(hi, lo_src, sigma=6.0):
    hi = hi.astype(np.float32)
    lo_up = cv2.resize(lo_src.astype(np.float32), (hi.shape[1], hi.shape[0]), interpolation=cv2.INTER_CUBIC)
    return np.clip(hi + cv2.GaussianBlur(lo_up, (0, 0), sigma) - cv2.GaussianBlur(hi, (0, 0), sigma), 0, 255)

# ---------- hi-res bands
ref4 = cv2.imread('v3/ref_band_x4.png')[:H * X4]
_cx, _cy, _r = np.load('v2/arc.npy')
_yy, _xx = np.mgrid[0:H, 0:W]
thin = np.zeros((H, W), np.float32); thin[343:430, 230:1320] = 1
thin[(np.abs(np.hypot(_xx - _cx, _yy - _cy) - _r) < 12) & (_yy < 265)] = 1
thin = cv2.resize(cv2.GaussianBlur(thin, (0, 0), 3), (W * X4, H * X4), interpolation=cv2.INTER_LINEAR)[..., None]
ref4 = match_lowfreq(ref4, band_lo) * (1 - thin) + match_lowfreq(ref4, band_lo, sigma=2.5) * thin
lay = json.load(open('v4/subtitle_layout.json'))
ref4, sub_report, _, _ = replace_subtitle(ref4, cv2.imread('v4/subtitle_old_mask.png', 0), cv2.imread('v4/subtitle_new_mask.png', 0), lay, report_cb=lambda r: None)
clean4 = match_lowfreq(cv2.imread('v2/out/plate_clean_x4.png')[V2T * X4:(V2T + H) * X4], clean_b)
sky4 = match_lowfreq(cv2.imread('v2/out/plate_sky_x4.png')[V2T * X4:(V2T + H) * X4], sky_b)
def deperiodize(img4):
    out = img4.astype(np.float32).copy()
    y0, y1, x0, x1 = 252 * X4, H * X4, 445 * X4, 1440 * X4
    reg = out[y0:y1, x0:x1]
    sm = cv2.GaussianBlur(reg, (0, 0), sigmaX=70, sigmaY=4)
    n = x1 - x0
    wx = np.clip(np.minimum(np.arange(n), n - np.arange(n)) / 200.0, 0, 1)[None, :, None]
    wy = np.clip((np.arange(y1 - y0) - 8) / 24.0, 0, 1)[:, None, None]  # leave the roofline itself untouched
    rng = np.random.default_rng(77)
    out[y0:y1, x0:x1] = reg * (1 - wx * wy) + (sm + rng.normal(0, 1.2, sm.shape)) * wx * wy
    return out
clean4 = deperiodize(clean4); sky4 = deperiodize(sky4)

# ---------- one low-res canvas (shared by every plate so transitions never change between layers)
seam_src = E.darken_flag_edges(band_lo, 1)
seam_src[:14, 752:786] = sky_b[:14, 752:786]  # dome-free context above the spire: FSR must not extend it upward
canvas_lo, unknown, IN = E.build_lowres_canvas(band_lo, seam_src, T, B)
cv2.imwrite('v4/canvas_lo.png', canvas_lo.astype(np.uint8))
up = lambda im: cv2.resize(im, (im.shape[1] * X4, im.shape[0] * X4), interpolation=cv2.INTER_LANCZOS4)
canvas4 = up(canvas_lo.astype(np.float32))
rng = np.random.default_rng(4040)
grain = rng.normal(0, 1.5, canvas4.shape).astype(np.float32)

def assemble(band4):
    im = canvas4.copy() + grain
    b = E.darken_flag_edges(band4, X4)
    # band interior exactly the hi-res band; outer IN rows cross-fade from the reconstructed strip into it
    im[(T + IN) * X4:(T + H - IN) * X4] = b[IN * X4:(H - IN) * X4]
    im[T * X4:(T + H) * X4] = b
    # the upscaler leaves a 1-2 px border artefact on the band's outermost rows: cross-fade the outer 4 band-px
    # from the colour continuation into the band (the spire columns keep the band exactly)
    n = 4 * X4
    w = ((np.arange(n) + 1) / (n + 1)).astype(np.float32)[:, None, None]
    keep = np.zeros((1, im.shape[1], 1), np.float32); keep[:, 748 * X4:788 * X4] = 1
    t0 = T * X4
    im[t0:t0 + n] = b[0:n] * np.maximum(w, keep) + canvas4[t0 - 1][None] * (1 - np.maximum(w, keep))
    b0 = (T + H) * X4
    im[b0 - n:b0] = b[-n:] * w[::-1] + canvas4[b0][None] * (1 - w[::-1])
    return np.clip(im, 0, 255)

FW = 5120; FH = round(HC * FW / W)
def save_rgb(name, im):
    im = cv2.resize(im.astype(np.float32), (FW, FH), interpolation=cv2.INTER_AREA)
    cv2.imwrite(OUT(name), np.clip(im, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
save_rgb('plate_clean.jpg', assemble(clean4))
save_rgb('plate_sky.jpg', assemble(sky4))
save_rgb('plate_ref.jpg', assemble(ref4))

def canvas_mask(m_band, top=None, bot=None):
    top = np.zeros((T, W), np.float32) if top is None else top
    bot = np.repeat(m_band[-1:], B, 0) if bot is None else bot
    return np.concatenate([top, m_band, bot], 0)
def save_mask(name, m):
    m = cv2.resize(m.astype(np.float32), (FW, FH), interpolation=cv2.INTER_LINEAR)
    cv2.imwrite(OUT(name), np.clip(m, 0, 255).astype(np.uint8))
save_mask('matte_capitol.png', canvas_mask(cap_b))
# single flag: cloth motion only where the original flag is, fading out before the band edges (no flag in extensions)
fy = np.ones(H, np.float32); fy[:24] = np.linspace(0, 1, 24); fy[-24:] = np.linspace(1, 0, 24)
save_mask('mask_flag.png', canvas_mask(flag_b * fy[:, None], bot=np.zeros((B, W), np.float32)))

# ---------- reveal masks (as V3; descriptor/rules adapted to the new subtitle)
hsv = cv2.cvtColor(band_lo.astype(np.uint8), cv2.COLOR_BGR2HSV); V = hsv[..., 2].astype(int); S = hsv[..., 1].astype(int)
yy, xx = np.mgrid[0:H, 0:W]
soft = lambda m, s: cv2.GaussianBlur(m.astype(np.float32), (0, 0), s)
raw = ((V > 135) & (S < 110)).astype(np.uint8) * 255
raw[:212] = 0; raw[350:] = 0; raw[:, :180] = 0; raw[:, 1390:] = 0
n, lab, st, cen = cv2.connectedComponentsWithStats(raw, 8)
order = sorted([i for i in range(1, n) if st[i][4] > 300 and st[i][3] > 40], key=lambda i: st[i][0])
letters = np.zeros((H, W), np.uint8)
for i in order: letters[lab == i] = 255
letters = cv2.dilate(letters, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
ids = np.zeros((H, W), np.uint8)
for k, i in enumerate(order): ids[lab == i] = k + 1
for _ in range(10): ids = np.where(ids == 0, cv2.dilate(ids, np.ones((3, 3), np.uint8)), ids)
letter_centres = [float(cen[i][0]) for i in order]
mL = soft(letters > 0, 2.0)
mG = np.zeros((H, W), np.float32); mG[343:372, 380:1180] = 1; mG = soft(mG, 2)
mD = np.zeros((H, W), np.float32); mD[372:404, 376:1186] = 1; mD = soft(mD, 2)
rl, rr = sub_report['rules']['left'], sub_report['rules']['right']
mR = np.zeros((H, W), np.float32)
mR[383:396, 236:int(rl[1]) + 16] = 1; mR[383:396, int(rr[0]) - 15:1316] = 1; mR[410:425, 400:1180] = 1
mR[:, 735:802] = 0; mR = soft(mR, 1.5)
mS = np.zeros((H, W), np.float32); cv2.circle(mS, (768, 423), 34, 1, -1); mS = soft(mS, 3)
cx, cy, r = np.load('v2/arc.npy')
rho = np.hypot(xx - cx, yy - cy)
mA = ((np.abs(rho - r) < 24) & (yy < 265)).astype(np.float32)
for x, y in np.load('v2/flares.npy'): cv2.circle(mA, (int(x), int(y)), 38, 1, -1)
mA[0:46, 750:788] = 0; mA = soft(mA, 3)
mZ = np.zeros((H, W), np.float32); mZ[200:H, 170:1380] = 1; mZ = soft(mZ, 8)
elems = np.maximum.reduce([mL, mG, mD, mR, mS])
elems = cv2.dilate((elems > 0.05).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))).astype(np.float32)
mZ = mZ * (1 - soft(elems, 3))
def save_pack(name, p):
    full = np.concatenate([np.zeros((T, W, 3), np.float32), p, np.zeros((B, W, 3), np.float32)], 0)
    full = cv2.resize(full, (FW, FH), interpolation=cv2.INTER_LINEAR)
    cv2.imwrite(OUT(name), np.clip(full[..., ::-1] * 255, 0, 255).astype(np.uint8))
save_pack('reveal_a.png', np.dstack([mL, mG, mD]))
save_pack('reveal_b.png', np.dstack([mS, mA, mZ]))
save_mask('reveal_rules.png', canvas_mask(mR * 255, bot=np.zeros((B, W), np.float32)))
idc = np.concatenate([np.zeros((T, W), np.uint8), ids, np.zeros((B, W), np.uint8)], 0)
cv2.imwrite(OUT('letter_ids.png'), (cv2.resize(idc, (FW, FH), interpolation=cv2.INTER_NEAREST).astype(np.uint16) * 16).clip(0, 255).astype(np.uint8))
json.dump({'subtitle': 'INVESTIGATING LEGISLATION', 'subtitle_report': sub_report, 'letter_centres_x': letter_centres,
           'extensions': 'procedural (seeded fBm/domain warp, palette from reference) + FSR transition; no mirroring or copying'},
          open('v4/report.json', 'w'), indent=1, default=float)
print('V4 plates written', FW, 'x', FH, json.dumps(sub_report['rules']))

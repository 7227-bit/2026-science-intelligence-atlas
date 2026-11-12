"""V3 plates: full-width reference band (no side crop) in a 16:9 canvas.

Canvas (band units): 1536 x 864 = 290 sky above + 446 reference band + 128 ground below.
Hi-res layers are assembled at x4 (6144 x 3456) from ESRGAN outputs, then written at 5120 x 2880.

Inputs (work dir):
  v3/ref_band_x4.png        ESRGAN x4 of the untouched reference band (lettering, arc, rules, star included)
  v2/out/plate_clean_x4.png ESRGAN x4 of the V2 clean canvas (band rows at 440..2224)
  v2/out/plate_sky_x4.png   ESRGAN x4 of the V2 sky canvas
  v2/out/plate_clean.png, plate_sky.png, matte_capitol.png, mask_flag.png  (band-res V2 canvases, band rows 110..556)
  v2/band.png, v2/mask_text.png, v2/arc.npy, v2/flares.npy
Outputs: public/plates/v3/*.{jpg,png}, v3/layout.json
"""
import cv2, numpy as np, json, os, sys
root = sys.argv[1]  # repo root
os.makedirs(os.path.join(root, 'public/plates/v3'), exist_ok=True)
OUT = lambda n: os.path.join(root, 'public/plates/v3', n)
W, H = 1536, 446
T, B = 290, 128
HC = T + H + B  # 864
X4 = 4
V2T = 110

# ---------- band-resolution sources
clean_b = cv2.imread('v2/out/plate_clean.png').astype(np.float32)[V2T:V2T + H]
sky_b = cv2.imread('v2/out/plate_sky.png').astype(np.float32)[V2T:V2T + H]
cap_b = cv2.imread('v2/out/matte_capitol.png', 0).astype(np.float32)[V2T:V2T + H]
flag_b = cv2.imread('v2/out/mask_flag.png', 0).astype(np.float32)[V2T:V2T + H]

# ---------- extensions (band res), then Lanczos x4 (soft content)
def top_ext(src):
    # mirror SKY rows only (above the roofline), stretched to the extension height
    SK = 236
    t = src[1:SK + 1][::-1].copy()
    t = cv2.resize(t, (W, T), interpolation=cv2.INTER_CUBIC)
    # the dome-removal area has no real cloud texture: fill it with mirrored reference clouds taken from
    # beside the dome (horizontal offset), feathered in — real texture, no smear, no vertical seams
    x0, x1, OFF, F = 560, 980, 400, 70
    donor = np.roll(t, -OFF, axis=1)
    w = np.zeros((T, W), np.float32); w[:, x0:x1] = 1
    w = cv2.GaussianBlur(w, (0, 0), F / 2)
    # no donor texture right above the seam: there the plain mirror continues the band's own clouds
    w *= np.clip((np.arange(T)[::-1] - 30) / 80.0, 0, 1)[:, None]
    w = w[..., None]
    t = t * (1 - w) + donor * w
    # continuous depth falloff: softer and darker toward the top edge
    levels = [t] + [cv2.GaussianBlur(t, (0, 0), sg) for sg in (2.5, 5, 9)]
    pos = np.linspace(1, 0, T)[:, None, None] * 3  # 0 at seam (sharp) .. 3 at top (softest)
    out = np.zeros_like(t)
    for i, L in enumerate(levels):
        out += L * np.clip(1 - np.abs(pos - i), 0, 1)
    t = out
    lab = cv2.cvtColor(np.clip(t, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    lab[..., 1:] = 128 + (lab[..., 1:] - 128) * 0.9
    t = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
    g = (np.linspace(0, 1, T) ** 0.9 * 0.68 + 0.32)[:, None, None]  # deepens toward the top edge
    return t * g
def bot_ext(src):
    b = src[H - B - 1:H - 1][::-1].copy()
    b = cv2.GaussianBlur(b, (0, 0), 3)
    g = (np.linspace(1, 0, B) ** 1.2 * 0.75 + 0.25)[:, None, None]
    return b * g
ext_top = top_ext(sky_b)          # same top for every plate (never mirrors the dome)
ext_bot = bot_ext(clean_b)        # from the lettering-free plate (no mirrored "reflection" of the title)
up = lambda im: cv2.resize(im, (im.shape[1] * X4, im.shape[0] * X4), interpolation=cv2.INTER_LANCZOS4)
ext_top4, ext_bot4 = up(ext_top), up(ext_bot)

def assemble(band4):
    im = np.concatenate([ext_top4, band4.astype(np.float32), ext_bot4], 0)
    for yc in (T * X4, (T + H) * X4):  # seam blends
        sl = slice(yc - 48, yc + 48)
        im[sl] = cv2.GaussianBlur(im[yc - 96:yc + 96], (0, 0), sigmaX=0.1, sigmaY=18)[48:144]
    # seams may only touch the EXTENSIONS: restore every reference row exactly
    im[T * X4:(T + H) * X4] = band4.astype(np.float32)
    return np.clip(im, 0, 255)

clean4 = cv2.imread('v2/out/plate_clean_x4.png')[V2T * X4:(V2T + H) * X4]
sky4 = cv2.imread('v2/out/plate_sky_x4.png')[V2T * X4:(V2T + H) * X4]
ref4 = cv2.imread('v3/ref_band_x4.png')[:H * X4]

def match_lowfreq(hi, lo_src, sigma=6.0):
    # keep ESRGAN's fine detail but make local brightness/colour equal the source (restores thin glows the
    # upscaler dims, e.g. the glow line and rules)
    hi = hi.astype(np.float32)
    lo_up = cv2.resize(lo_src.astype(np.float32), (hi.shape[1], hi.shape[0]), interpolation=cv2.INTER_CUBIC)
    return np.clip(hi + cv2.GaussianBlur(lo_up, (0, 0), sigma) - cv2.GaussianBlur(hi, (0, 0), sigma), 0, 255)
# thin-light regions (glow line, rules, star, arc, descriptor) get a finer correction: restores their peak brightness
_cx, _cy, _r = np.load('v2/arc.npy')
_yy, _xx = np.mgrid[0:H, 0:W]
thin = np.zeros((H, W), np.float32)
thin[343:430, 230:1320] = 1
thin[(np.abs(np.hypot(_xx - _cx, _yy - _cy) - _r) < 12) & (_yy < 265)] = 1
thin = cv2.resize(cv2.GaussianBlur(thin, (0, 0), 3), (W * X4, H * X4), interpolation=cv2.INTER_LINEAR)[..., None]
_src = cv2.imread('v2/band.png')[:H]
ref4 = match_lowfreq(ref4, _src) * (1 - thin) + match_lowfreq(ref4, _src, sigma=2.5) * thin
clean4 = match_lowfreq(clean4, clean_b)
sky4 = match_lowfreq(sky4, sky_b)
assert clean4.shape == sky4.shape == ref4.shape, (clean4.shape, sky4.shape, ref4.shape)
FW = 5120; FH = round(HC * X4 * FW / (W * X4))
def save_rgb(name, im):
    im = cv2.resize(im.astype(np.float32), (FW, FH), interpolation=cv2.INTER_AREA)
    cv2.imwrite(OUT(name), np.clip(im, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
save_rgb('plate_clean.jpg', assemble(clean4))
save_rgb('plate_sky.jpg', assemble(sky4))
save_rgb('plate_ref.jpg', assemble(ref4))

# ---------- masks (band res -> canvas -> 5120 wide)
def canvas_mask(m_band, top=None, bot=None):
    top = np.zeros((T, W), np.float32) if top is None else top
    bot = np.repeat(m_band[-1:], B, 0) if bot is None else bot
    return np.concatenate([top, m_band, bot], 0)
def save_mask(name, m):
    m = cv2.resize(m.astype(np.float32), (FW, FH), interpolation=cv2.INTER_LINEAR)
    cv2.imwrite(OUT(name), np.clip(m, 0, 255).astype(np.uint8))
save_mask('matte_capitol.png', canvas_mask(cap_b))
save_mask('mask_flag.png', canvas_mask(flag_b, top=flag_b[1:T + 1][::-1], bot=flag_b[H - B - 1:H - 1][::-1]))

# ---------- reveal masks from the REFERENCE itself (band res, soft), packed into two RGBA images
ref_b = cv2.imread('v2/band.png')[:H]
hsv = cv2.cvtColor(ref_b, cv2.COLOR_BGR2HSV); V = hsv[..., 2].astype(int); S = hsv[..., 1].astype(int)
yy, xx = np.mgrid[0:H, 0:W]
soft = lambda m, s: cv2.GaussianBlur(m.astype(np.float32), (0, 0), s)
# letters: reference text mask (already dilated 11px) restricted to title rows; per-letter ids by connected components
raw = ((V > 135) & (S < 110)).astype(np.uint8) * 255
raw[:212] = 0; raw[350:] = 0; raw[:, :180] = 0; raw[:, 1390:] = 0
n, lab, st, cen = cv2.connectedComponentsWithStats(raw, 8)
order = sorted([i for i in range(1, n) if st[i][4] > 300 and st[i][3] > 40], key=lambda i: st[i][0])
letters = np.zeros((H, W), np.uint8)
for i in order: letters[lab == i] = 255
letters = cv2.dilate(letters, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))  # include bevel edge, shadow and glow halo
ids = np.zeros((H, W), np.uint8)
for k, i in enumerate(order): ids[lab == i] = k + 1
# grow ids to cover soft edges (nearest-label dilation)
for _ in range(10): ids = np.where(ids == 0, cv2.dilate(ids, np.ones((3, 3), np.uint8)), ids)
letter_centres = [float(cen[i][0]) for i in order]
mL = soft(letters > 0, 2.0)
# glow line + burst (the hot light under the title)
mG = np.zeros((H, W), np.float32); mG[343:372, 380:1180] = 1; mG = soft(mG, 2)  # stops above the descriptor (379+)
# descriptor letters
mD = np.zeros((H, W), np.float32); mD[372:404, 376:1186] = 1; mD = soft(mD, 2)
# rules (flank + lower), split by the star
mR = np.zeros((H, W), np.float32); mR[383:396, 236:366] = 1; mR[383:396, 1192:1316] = 1; mR[410:425, 400:1180] = 1
mR[:, 735:802] = 0; mR = soft(mR, 1.5)
# star
mS = np.zeros((H, W), np.float32); cv2.circle(mS, (768, 423), 34, 1, -1); mS = soft(mS, 3)
# arc band (+ flares)
cx, cy, r = np.load('v2/arc.npy')
rho = np.hypot(xx - cx, yy - cy)
mA = ((np.abs(rho - r) < 24) & (yy < 265)).astype(np.float32)
for x, y in np.load('v2/flares.npy'): cv2.circle(mA, (int(x), int(y)), 38, 1, -1)
mA[0:46, 750:788] = 0
mA = soft(mA, 3)
# facade zone (everything else the reference changes in the title area)
mZ = np.zeros((H, W), np.float32); mZ[200:H, 170:1380] = 1; mZ = soft(mZ, 8)
# the facade settle must never reveal any part of an element early: exclude a wide zone around all of them
elems = np.maximum.reduce([mL, mG, mD, mR, mS])
elems = cv2.dilate((elems > 0.05).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))).astype(np.float32)
mZ = mZ * (1 - soft(elems, 3))
packA = np.dstack([mL, mG, mD])  # R letters, G glow line, B descriptor  (no alpha channel: avoids premultiply loss)
packB = np.dstack([mS, mA, mZ])  # R star, G arc, B facade
def save_pack(name, p):
    full = np.concatenate([np.zeros((T, W, 3), np.float32), p, np.zeros((B, W, 3), np.float32)], 0)
    full = cv2.resize(full, (FW, FH), interpolation=cv2.INTER_LINEAR)
    cv2.imwrite(OUT(name), np.clip(full[..., ::-1] * 255, 0, 255).astype(np.uint8))  # RGB order in the PNG
save_pack('reveal_a.png', packA)
save_pack('reveal_b.png', packB)
save_mask('reveal_rules.png', canvas_mask(mR * 255, bot=np.zeros((B, W), np.float32)))
idc = np.concatenate([np.zeros((T, W), np.uint8), ids, np.zeros((B, W), np.uint8)], 0)
idc = cv2.resize(idc, (FW, FH), interpolation=cv2.INTER_NEAREST)
cv2.imwrite(OUT('letter_ids.png'), (idc.astype(np.uint16) * 16).clip(0, 255).astype(np.uint8))

layout = {'canvas_band_units': [W, HC], 'band_offset_y': T, 'ext_top': T, 'ext_bottom': B,
          'arc': {'cx': float(cx), 'cy': float(cy + T), 'r': float(r)},
          'letters': len(order), 'letter_centres_x': letter_centres,
          'star': [768, 423 + T], 'line_y': 357 + T, 'descriptor_cx': 780}
json.dump(layout, open('v3/layout.json', 'w'), indent=1)
print('V3 plates written', FW, 'x', FH, '| letters', len(order), [round(c) for c in letter_centres])

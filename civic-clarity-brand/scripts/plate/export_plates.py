"""Build v2 plate layers at reference resolution (band units), ready for ESRGAN.
Outputs (v2/out/): plate_clean.png, plate_sky.png, matte_capitol.png, mask_flag.png, layout.json"""
import cv2, numpy as np, json, os
os.makedirs('v2/out', exist_ok=True)
clean = cv2.imread('v2/clean_plate_1536.png').astype(np.float32)
H, W = clean.shape[:2]
cx, cy, r = np.load('v2/arc.npy')
yy, xx = np.mgrid[0:H, 0:W]
rho = np.hypot(xx - cx, yy - cy)
# 1. neutralise residual chroma fringes in the arc band (keep luminance, take chroma from wide surroundings)
lab = cv2.cvtColor(clean.astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
band = (np.abs(rho - r) < 30) & (yy < 262)
wband = cv2.GaussianBlur(band.astype(np.float32), (0, 0), 6)
for c in (1, 2):
    ch = lab[..., c]
    outside = np.where(band, np.nan, ch)
    # blurred chroma from outside the band (normalised convolution)
    m = (~band).astype(np.float32)
    num = cv2.GaussianBlur(np.nan_to_num(outside) * m, (0, 0), 14)
    den = cv2.GaussianBlur(m, (0, 0), 14) + 1e-4
    lab[..., c] = ch * (1 - wband) + (num / den) * wband
clean = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
# top-edge marks next to the finial
top = np.zeros((H, W), np.uint8); top[0:22, 690:850] = 255; top[0:44, 760:776] = 0
lm = (clean.mean(2) < 0) .astype(np.uint8)  # placeholder (no-op)
c8 = clean.astype(np.uint8)
c8 = np.where((top > 0)[..., None], cv2.GaussianBlur(c8, (0, 0), 3), c8)
clean = c8.astype(np.float32)
# 2. capitol matte (feathered) and sky plate (capitol + 8px ring inpainted)
cap = cv2.imread('v2/matte_capitol.png', 0)
capd = cv2.dilate(cap, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
sky = np.zeros_like(c8)
P = 24
ip = cv2.copyMakeBorder(clean.astype(np.uint8), P, P, P, P, cv2.BORDER_REFLECT)
mp = cv2.copyMakeBorder(capd, P, P, P, P, cv2.BORDER_REFLECT)
tmp = np.zeros_like(ip); cv2.xphoto.inpaint(ip, 255 - mp, tmp, cv2.xphoto.INPAINT_FSR_FAST)
sky = tmp[P:-P, P:-P].astype(np.float32)
# below the roofline the "sky" plate is the facade itself (keeps parallax gaps dark, never shows sky under the building)
below = np.zeros((H, W), np.float32); below[252:] = 1
sky = sky * (1 - below[..., None]) + clean * below[..., None]
capf = cv2.GaussianBlur(cap.astype(np.float32), (0, 0), 0.8)
# 3. flag weight (soft): flag fills the upper-left and fades into cloud
fw = np.clip((600 - xx - 0.25 * (yy - 120)) / 300.0, 0, 1)
fw = (fw ** 1.3) * (1 - np.clip((cap > 0).astype(np.float32), 0, 1))
# 4. vertical extension to the 16:9 canvas
T, B = 110, 200
def extend(img, dark_top=0.22, dark_bot=0.03, sig=3.0):
    img = img.astype(np.float32).copy()
    img[H - 6:] = img[H - 7]  # drop the reference panel's antialiased border rows
    topx = img[1:T + 1][::-1]
    botx = img[H - B - 1:H - 1][::-1]
    topx = cv2.GaussianBlur(topx, (0, 0), sig)
    botx = cv2.GaussianBlur(botx, (0, 0), sig * 1.5)
    gt = np.linspace(dark_top, 0.92, T)[:, None, None] if img.ndim == 3 else np.linspace(dark_top, 0.92, T)[:, None]
    gb = (np.linspace(1, 0, B) ** 2.2 * (1.0 - dark_bot) + dark_bot)[:, None, None]
    return np.concatenate([topx * gt, img, botx * gb], 0)
def extend_mask(m):
    return np.concatenate([m[1:T + 1][::-1], m, m[H - B - 1:H - 1][::-1]], 0)
rng = np.random.default_rng(3)
pc = extend(clean); ps = extend(sky)
# top extension must never mirror the dome: take it from the dome-free sky plate for both
pc[:T] = ps[:T]
# soften the band/extension seams
for arr in (pc, ps):
    for yc in (T, T + H):
        arr[yc - 8:yc + 8] = cv2.GaussianBlur(arr[yc - 14:yc + 14], (0, 0), sigmaX=0.1, sigmaY=4)[6:22]
pc += rng.normal(0, 1.4, pc.shape); ps += rng.normal(0, 1.4, ps.shape)
cv2.imwrite('v2/out/plate_clean.png', np.clip(pc, 0, 255).astype(np.uint8))
cv2.imwrite('v2/out/plate_sky.png', np.clip(ps, 0, 255).astype(np.uint8))
capx = np.concatenate([np.zeros((T, W), np.float32), capf, np.repeat(capf[-1:], B, 0)], 0)
cv2.imwrite('v2/out/matte_capitol.png', np.clip(capx, 0, 255).astype(np.uint8))
fwx = extend_mask(fw)
cv2.imwrite('v2/out/mask_flag.png', np.clip(fwx * 255, 0, 255).astype(np.uint8))
layout = {
    'source': 'references/OWNER_SELECTED_REFERENCE.jpeg, crop 1536x446 at (0,0)',
    'canvas_band_units': [W, H + T + B], 'band_offset_y': T,
    'arc': {'cx': float(cx), 'cy': float(cy + T), 'r': float(r)},
    'flares': [[float(x), float(y + T)] for x, y in np.load('v2/flares.npy')],
    'title_ref': {'x1': 201, 'x2': 1332, 'baseline': 341 + T, 'smallcap_h': 89, 'initial_h': 132,
                  'civic': [201, 654], 'clarity': [666, 1332]},
    'descriptor_ref': {'y_top': 380 + T, 'y_bottom': 398 + T, 'x1': 380, 'x2': 1180},
    'star_ref': {'cx': 768, 'cy': 425 + T},
    'frame_visible_band_x': [117, 1419], 'frame_top_canvas_y': 10,
}
json.dump(layout, open('v2/out/layout.json', 'w'), indent=1)
print('canvas', pc.shape)

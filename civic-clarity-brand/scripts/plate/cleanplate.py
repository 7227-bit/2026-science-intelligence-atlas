import cv2, numpy as np
im = cv2.imread('v2/band.png')[:446].copy()
H, W = im.shape[:2]
cx, cy, r = np.load('v2/arc.npy'); fl = np.load('v2/flares.npy')
yy, xx = np.mgrid[0:H, 0:W]
rho = np.hypot(xx - cx, yy - cy)
def fsr(img, mask, P=24):
    # reflect-pad so the reconstruction has context at the frame edges (avoids edge colour artefacts)
    ip = cv2.copyMakeBorder(img, P, P, P, P, cv2.BORDER_REFLECT)
    mp = cv2.copyMakeBorder(mask, P, P, P, P, cv2.BORDER_REFLECT)
    out = np.zeros_like(ip); cv2.xphoto.inpaint(ip, 255 - mp, out, cv2.xphoto.INPAINT_FSR_FAST)
    return out[P:-P, P:-P]
# A. arc + its glow + flares
arcm = ((np.abs(rho - r) < 21) & (yy < 255)).astype(np.uint8) * 255
for x, y in fl: cv2.circle(arcm, (int(x), int(y)), 34, 255, -1)
lantern = np.zeros((H, W), np.uint8); cv2.rectangle(lantern, (752, 0), (786, 44), 255, -1)
arcm[lantern > 0] = 0
import os
a = cv2.imread('v2/arc_best.png') if os.path.exists('v2/arc_best.png') else fsr(im, arcm)
# thin arc line crossing the lantern: small Telea fill of just the line pixels
thin = ((np.abs(rho - r) < 5.5) & (lantern > 0)).astype(np.uint8) * 255
a = cv2.inpaint(a, thin, 3, cv2.INPAINT_TELEA)
# columns hidden behind CLARITY's initial C: extend each column straight down from just above the letter
Cm = cv2.dilate(cv2.imread('v2/mask_text.png', 0), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
colfix = a.copy()
for x in range(668, 872):
    ys = np.where(Cm[200:249, x] > 0)[0]
    if len(ys) == 0: continue
    yt = 200 + ys[0]
    src = a[max(0, yt - 3), x].astype(np.float32)
    for y in range(yt, 249):
        f = 1 - 0.55 * (y - yt) / max(1, 249 - yt)  # falls into shadow at the base
        colfix[y, x] = np.clip(src * f, 0, 255)
colfix[200:249, 668:872] = cv2.GaussianBlur(colfix[200:249, 668:872], (3, 1), 0)
a = colfix
# B. letter-mask reconstruction where the letters overlap structure we must keep (flag C, drum-base C)
text = cv2.imread('v2/mask_text.png', 0)
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
textw = cv2.dilate(text, k)
lm = textw.copy()
lm[:249, 340:640] = text[:249, 340:640]; lm[:249, 900:1350] = text[:249, 900:1350]  # keep roofline intact
lm[:249, 660:880] = 0  # handled by column extension
b = fsr(a, lm)
# initial C over the flag: continue the flag stripes through the letter's dark backdrop.
# Stripe orientation from the structure tensor of the intact flag just left of the letter.
Rm = np.zeros((H, W), np.uint8)
cv2.ellipse(Rm, (268, 288), (96, 96), 0, 0, 360, 255, -1)
Rm[:, 350:] = 0; Rm[:186] = 0
Rm[250:446, 345:440] = 255  # let the stripes dissolve into shadow before the facade begins
G = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
gx = cv2.Sobel(G, cv2.CV_32F, 1, 0, ksize=5); gy = cv2.Sobel(G, cv2.CV_32F, 0, 1, ksize=5)
ry, rx = slice(200, 360), slice(60, 175)
Jxx = (gx[ry, rx] ** 2).sum(); Jyy = (gy[ry, rx] ** 2).sum(); Jxy = (gx[ry, rx] * gy[ry, rx]).sum()
theta = 0.5 * np.arctan2(2 * Jxy, Jxx - Jyy) + np.pi / 2  # stripe (edge-tangent) direction
d = np.array([np.cos(theta), np.sin(theta)]); d = d if d[0] > 0 else -d
print('stripe direction', d.round(3))
ys, xs = np.where(Rm > 0)
src = b.copy()
rng_s = np.random.default_rng(11)
outb = b.astype(np.float32).copy()
for y, x in zip(ys, xs):
    # walk back along the stripe until we leave the hole
    for t in range(1, 500):
        sx, sy = x - d[0] * t, y - d[1] * t
        if sx < 0 or sy < 0: break
        if Rm[int(sy), int(sx)] == 0:
            # sample a little further along the stripe with jitter -> varied cloth texture, not streaks
            j = rng_s.uniform(0, 14)
            jx, jy = sx - d[0] * j, sy - d[1] * j
            if jx < 2 or jy < 2 or Rm[int(jy), int(jx)] > 0: jx, jy = sx, sy
            v = cv2.getRectSubPix(src, (1, 1), (float(jx), float(jy)))[0, 0].astype(np.float32)
            fade = np.exp(-max(0, x - 200) / 85.0)  # flag recedes into shadow toward the facade
            outb[y, x] = v * (0.22 + 0.78 * fade)
            break
fm = cv2.GaussianBlur(Rm.astype(np.float32), (0, 0), 4) / 255
fm *= np.clip((445 - xx) / 75.0, 0, 1)  # horizontal feather into the facade shadow
fm = fm[..., None]
outb = cv2.GaussianBlur(outb, (0, 0), 0.9)
b = (b.astype(np.float32) * (1 - fm) + outb * fm).astype(np.uint8)
# C. facade zone below the roofline
Z = np.zeros((H, W), np.uint8)
cv2.rectangle(Z, (200, 249), (1440, H - 1), 255, -1)
zi = fsr(b, Z)
# anisotropic smoothing (wide horizontally) kills the vertical streaks left by bright letter edges
base = cv2.GaussianBlur(zi.astype(np.float32), (0, 0), sigmaX=34, sigmaY=10)
bl = base.mean(2, keepdims=True)
base = bl + (base - bl) * 0.55  # desaturate toward neutral shadow
g = np.clip((yy - 249) / 197.0, 0, 1)[..., None]
fill = base * (0.9 - 0.62 * g)
# pilaster rhythm + one cornice course, very low contrast
pil = (0.5 + 0.5 * np.cos(2 * np.pi * (xx - cx) / 37.0)) ** 6
fill *= (1 + (0.10 * pil * (1 - g[..., 0]) - 0.04)[..., None])
fill += (np.exp(-((yy - 252) ** 2) / 3.0) * 14 * (np.abs(xx - cx) < 560))[..., None] * np.array([0.75, 0.85, 1.0])
rng = np.random.default_rng(7)
fill += rng.normal(0, 2.0, fill.shape)
wx = np.clip((xx - 330) / 170.0, 0, 1) * np.clip((1440 - xx) / 220.0, 0, 1)
wx = 0.5 - 0.5 * np.cos(np.pi * wx)
wy = np.clip((yy - 247) / 3.0, 0, 1)
zf = (wx * wy)[..., None]
out = np.clip(b.astype(np.float32) * (1 - zf) + fill * zf, 0, 255).astype(np.uint8)
cv2.imwrite('v2/clean_plate_1536.png', out)
cv2.imwrite('v2/mask_zone.png', Z)

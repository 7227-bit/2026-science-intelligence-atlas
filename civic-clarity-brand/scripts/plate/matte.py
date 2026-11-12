import cv2, numpy as np, sys
src = sys.argv[1] if len(sys.argv) > 1 else 'v2/clean_plate_1536.png'
im = cv2.imread(src)
H, W = im.shape[:2]
# --- dome via GrabCut
mask = np.full((H, W), cv2.GC_BGD, np.uint8)
cv2.rectangle(mask, (640, 0), (900, 252), cv2.GC_PR_BGD, -1)
# probable foreground: dome body ellipse + drum + lantern
cv2.ellipse(mask, (768, 125), (95, 45), 0, 180, 360, cv2.GC_PR_FGD, -1)
cv2.rectangle(mask, (668, 125), (868, 240), cv2.GC_PR_FGD, -1)
cv2.rectangle(mask, (755, 20), (781, 90), cv2.GC_PR_FGD, -1)
# certain foreground cores
cv2.ellipse(mask, (768, 128), (70, 30), 0, 180, 360, cv2.GC_FGD, -1)
cv2.rectangle(mask, (690, 135), (846, 238), cv2.GC_FGD, -1)
cv2.rectangle(mask, (762, 40), (774, 80), cv2.GC_FGD, -1)
bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(im, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
dome = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
# keep largest component
n, lab, st, _ = cv2.connectedComponentsWithStats(dome)
dome = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8) * 255
dome = cv2.morphologyEx(dome, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
# symmetry prior: the right half segments cleanly against dark cloud; mirror it about the lantern axis
AX = 768
right = dome[:, AX:].copy()
sym = np.zeros_like(dome)
sym[:, AX:] = right
wl = min(AX, right.shape[1])
sym[:, AX - wl:AX] = right[:, :wl][:, ::-1]
dome = sym
# finial (thin spire above the lantern) — not segmented reliably at this size
cv2.fillConvexPoly(dome, np.array([[763, 30], [766, 4], [768, 0], [770, 4], [773, 30]]), 255)
# --- building roofline: per column, first row (scanning down from 205) where luminance drops below a sky-relative threshold
L = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(float)
Ls = cv2.GaussianBlur(L, (0, 0), 1.0)
roof = np.full(W, 249, int)
for x in range(W):
    col = Ls[200:252, x]
    sky = col[:6].mean()
    d = np.where(col < sky * 0.55)[0]
    if len(d): roof[x] = 200 + d[0]
roof = cv2.medianBlur(roof.astype(np.uint8).reshape(1, -1), 5).ravel().astype(int)
bld = np.zeros((H, W), np.uint8)
xs = np.arange(W)
for x in xs:
    if 290 <= x <= 1260: bld[roof[x]:, x] = 255  # building only; flag and clouds stay on the sky layer
# feather the building's left/right ends so vertical parallax never shows a step
ramp = np.clip(np.minimum(xs - 290, 1260 - xs) / 60.0, 0, 1)
bld = (bld.astype(np.float32) * ramp[None, :]).astype(np.uint8)
cap = cv2.max(dome, bld)
cv2.imwrite('v2/matte_capitol.png', cap)
vis = im.copy(); edge = cv2.Canny(cap, 50, 150); vis[edge > 0] = (0, 255, 0)
cv2.imwrite('v2/matte_vis.png', vis[0:270, 560:980])
print('roofline sample', roof[300:1260:80])

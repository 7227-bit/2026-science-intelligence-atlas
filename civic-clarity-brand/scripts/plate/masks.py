import cv2, numpy as np
im = cv2.imread('v2/band.png')[:446]
H, W = im.shape[:2]
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
V, S = hsv[..., 2].astype(int), hsv[..., 1].astype(int)
# ---- text mask: bright & low-sat in title zone; anything bright in descriptor/star zone
text = np.zeros((H, W), np.uint8)
z1 = slice(214, 350)
t1 = ((V > 135) & (S < 110))
text[z1][t1[z1]] = 255
z2 = slice(346, 446)
text[z2][(V[z2] > 70)] = 255
# keep only within title horizontal extent
text[:, :180] = 0; text[:, 1390:] = 0
# remove the building/dome region above letters: anything above y<246 only if connected to letters? keep big C rows (225+) only near C columns -> use components
n, lab, st, cen = cv2.connectedComponentsWithStats(text, 8)
keep = np.zeros_like(text)
for i in range(1, n):
    x, y, w, h, a = st[i]
    if a < 25: continue
    if y + h < 250 and y < 240: continue  # rooftop highlights entirely above the letters
    keep[lab == i] = 255
text = keep
# print letter components in title rows
n, lab, st, cen = cv2.connectedComponentsWithStats(text[:350], 8)
boxes = sorted([tuple(st[i]) for i in range(1, n) if st[i][4] > 300], key=lambda b: b[0])
for b in boxes: print('comp', b)
textd = cv2.dilate(text, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
cv2.imwrite('v2/mask_text.png', textd)
# ---- arc: sample bright thin pixels to fit circle
cand = []
for y in range(5, 240):
    for x in list(range(150, 560)) + list(range(980, 1390)):
        if V[y, x] > 175 and S[y, x] > 60:
            cand.append((x, y))
cand = np.array(cand, float)
# iterative least-squares refit seeded from visual estimate
cx, cy, r = 767.0, 388.0, 371.0
for it in range(6):
    tol = [14, 9, 6, 4, 3, 2.5][it]
    d = np.abs(np.hypot(cand[:, 0] - cx, cand[:, 1] - cy) - r)
    p = cand[d < tol]
    A = np.c_[2 * p, np.ones(len(p))]; b = (p ** 2).sum(1)
    sol = np.linalg.lstsq(A, b, rcond=None)[0]
    cx, cy = sol[0], sol[1]; r = np.sqrt(sol[2] + cx * cx + cy * cy)
best = (len(p), (cx, cy, r))
print('arc fit', best)
cx, cy, r = best[1]
yy, xx = np.mgrid[0:H, 0:W]
dist = np.abs(np.hypot(xx - cx, yy - cy) - r)
arc = ((dist < 4.5) & (yy < cy)).astype(np.uint8) * 255
cv2.imwrite('v2/mask_arc.png', arc)
np.save('v2/arc.npy', np.array([cx, cy, r]))
vis = im.copy(); vis[textd > 0] = (0, 0, 255); vis[arc > 0] = (255, 0, 0)
cv2.imwrite('v2/mask_vis.png', vis)

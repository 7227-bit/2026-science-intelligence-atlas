import cv2, numpy as np
im = cv2.imread('v2/band.png')[:446]
V = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)[..., 2].astype(float)
ridge = V - cv2.GaussianBlur(V, (0, 0), 4)
pts = []
cx, cy, r = 767.0, 388.0, 371.0
for x in list(range(420, 700, 6)) + list(range(840, 1120, 6)):
    if abs(x - cx) >= r: continue
    ye = cy - np.sqrt(r * r - (x - cx) ** 2)
    lo, hi = int(max(2, ye - 30)), int(min(240, ye + 30))
    if hi <= lo: continue
    col = ridge[lo:hi, x]
    y = lo + int(np.argmax(col))
    if col.max() > 25: pts.append((x, y, col.max()))
pts = np.array(pts)
for _ in range(3):
    A = np.c_[2 * pts[:, :2], np.ones(len(pts))]; b = (pts[:, :2] ** 2).sum(1)
    s = np.linalg.lstsq(A, b, rcond=None)[0]
    cx, cy = s[0], s[1]; r = np.sqrt(s[2] + cx * cx + cy * cy)
    res = np.abs(np.hypot(pts[:, 0] - cx, pts[:, 1] - cy) - r)
    pts = pts[res < max(2.5, np.percentile(res, 80))]
print('fit', round(cx, 1), round(cy, 1), round(r, 1), 'n', len(pts), 'resid', round(float(res.mean()), 2))
print('x-range', pts[:, 0].min(), pts[:, 0].max(), 'lowest y', pts[:, 1].max())
np.save('v2/arc.npy', np.array([cx, cy, r]))
yy, xx = np.mgrid[0:446, 0:1536]
d = np.abs(np.hypot(xx - cx, yy - cy) - r)
arc = ((d < 5) & (yy < 300)).astype(np.uint8) * 255
cv2.imwrite('v2/mask_arc.png', arc)
vis = im.copy(); vis[(d < 1.0) & (yy < 300)] = (255, 0, 0)
cv2.imwrite('v2/arc_vis.png', vis[0:300, 320:1220])

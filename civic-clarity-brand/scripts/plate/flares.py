"""Locate the two flares on the reference halo arc (brightest blurred points along the fitted arc)."""
import cv2, numpy as np
im = cv2.imread('v2/band.png')[:446]
cx, cy, r = np.load('v2/arc.npy')
V = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)[..., 2].astype(float)
Vb = cv2.GaussianBlur(V, (0, 0), 3)
fl = []
for side in (-1, 1):
    best = (0, None)
    for a in np.linspace(0.15, 0.9, 200):
        x = cx + side * r * np.sin(a); y = cy - r * np.cos(a)
        v = Vb[int(y), int(x)]
        if v > best[0]: best = (v, (x, y))
    fl.append(best[1])
print('flares', [(round(x), round(y)) for x, y in fl])
np.save('v2/flares.npy', np.array(fl))

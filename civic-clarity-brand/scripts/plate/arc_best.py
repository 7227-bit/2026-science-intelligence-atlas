import cv2, numpy as np, time
im = cv2.imread('v2/band.png')[:446].copy()
H, W = im.shape[:2]
cx, cy, r = np.load('v2/arc.npy'); fl = np.load('v2/flares.npy')
yy, xx = np.mgrid[0:H, 0:W]
rho = np.hypot(xx - cx, yy - cy)
arcm = ((np.abs(rho - r) < 21) & (yy < 255)).astype(np.uint8) * 255
for x, y in fl: cv2.circle(arcm, (int(x), int(y)), 34, 255, -1)
arcm[0:44, 752:786] = 0
# process only the bounding ROI of the arc to save time
y0, y1, x0, x1 = 0, 270, 370, 1170
P = 24
ip = cv2.copyMakeBorder(im[y0:y1, x0:x1], P, P, P, P, cv2.BORDER_REFLECT)
mp = cv2.copyMakeBorder(arcm[y0:y1, x0:x1], P, P, P, P, cv2.BORDER_REFLECT)
out = np.zeros_like(ip)
t = time.time()
cv2.xphoto.inpaint(ip, 255 - mp, out, cv2.xphoto.INPAINT_FSR_BEST)
print('best', round(time.time() - t, 1))
res = im.copy(); res[y0:y1, x0:x1] = out[P:-P, P:-P]
cv2.imwrite('v2/arc_best.png', res)

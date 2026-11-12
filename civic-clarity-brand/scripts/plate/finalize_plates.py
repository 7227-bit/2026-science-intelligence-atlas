"""Finalise v2 plates for the renderer: ESRGAN x4 outputs (if present) -> 5120-wide JPEG q95 (4:4:4);
mattes -> 5120-wide 8-bit PNG via Lanczos. Run: python3 -I scripts/plate/finalize_plates.py <work_dir>"""
import sys, os
from PIL import Image
work = sys.argv[1]
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out = os.path.join(root, 'public', 'plates', 'v2')
os.makedirs(out, exist_ok=True)
W = 5120
for name in ('plate_clean', 'plate_sky'):
    x4 = os.path.join(work, f'{name}_x4.png')
    src = x4 if os.path.exists(x4) else os.path.join(work, f'{name}.png')
    im = Image.open(src).convert('RGB')
    im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, f'{name}.jpg'), quality=95, subsampling=0, optimize=True)
    print(name, 'from', os.path.basename(src), im.size)
for name in ('matte_capitol', 'mask_flag'):
    m = Image.open(os.path.join(work, f'{name}.png')).convert('L')
    m = m.resize((W, round(m.height * W / m.width)), Image.LANCZOS)
    m.save(os.path.join(out, f'{name}.png'), optimize=True)
    print(name, m.size)

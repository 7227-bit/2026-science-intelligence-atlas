"""Small-size legibility test: circular crop at 48/96/128 px on light and dark YouTube UI backgrounds.
Run: python3 -I scripts/avatar-size-test.py"""
from PIL import Image, ImageDraw, ImageFont
import os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
y = os.path.join(root, 'deliverables', 'youtube')
srcs = [('star (primary)', 'civic-clarity_avatar_1024.png'), ('dome (secondary)', 'civic-clarity_avatar-dome_1024.png')]
sizes = [48, 96, 128]
bgs = [('#FFFFFF', '#0F0F0F'), ('#0F0F0F', '#F1F1F1')]  # YouTube light / dark UI
W, H = 60 + sum(s + 30 for s in sizes) * 2 + 40, 70 + len(srcs) * 170
sheet = Image.new('RGB', (W, H), '#2a2a2a')
d = ImageDraw.Draw(sheet)
font = ImageFont.load_default()
for r, (label, f) in enumerate(srcs):
    im = Image.open(os.path.join(y, f)).convert('RGB')
    x = 20
    d.text((20, 40 + r * 170), label, fill='#ddd', font=font)
    for bg, fg in bgs:
        panel_w = sum(s + 30 for s in sizes) + 10
        d.rectangle([x, 60 + r * 170, x + panel_w, 60 + r * 170 + 150], fill=bg)
        px = x + 10
        for s in sizes:
            small = im.resize((s, s), Image.LANCZOS)
            mask = Image.new('L', (s * 4, s * 4), 0)
            ImageDraw.Draw(mask).ellipse([0, 0, s * 4 - 1, s * 4 - 1], fill=255)
            mask = mask.resize((s, s), Image.LANCZOS)
            sheet.paste(small, (px, 70 + r * 170), mask)
            d.text((px, 70 + r * 170 + s + 4), f'{s}px', fill=fg, font=font)
            px += s + 30
        x += panel_w + 20
d.text((20, 10), 'CIVIC CLARITY avatar — circular crop at YouTube display sizes (light UI | dark UI), Lanczos downsample', fill='#fff', font=font)
out = os.path.join(root, 'deliverables', 'qa', 'avatar_small_size_test.png')
sheet = sheet.resize((W * 2, H * 2), Image.NEAREST)  # 2x nearest so reviewers see true pixels
sheet.save(out)
print('wrote', os.path.relpath(out, root))

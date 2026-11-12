#!/usr/bin/env node
/**
 * Subtitle glyph masks at plate resolution (reference band x4 = 6144 x 1784).
 *  - old: "INVESTIGATIVE DOCUMENTARIES" exactly as fitted to the reference (cinematicType.json)
 *  - new: "INVESTIGATING LEGISLATION" with the SAME Montserrat Medium size, tracking and word gap,
 *         centred on the same axis as the original subtitle.
 * Usage: node scripts/plate/subtitle_masks.mjs <out_dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import opentype from 'opentype.js';
import {Resvg} from '@resvg/resvg-js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = process.argv[2];
fs.mkdirSync(out, {recursive: true});
const ct = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/brand/generated/cinematicType.json'), 'utf8'));
const f = opentype.loadSync(path.join(ROOT, 'public/fonts/Montserrat_500Medium.ttf'));
const D = ct.ref.descriptor;
const size = ct.descriptor.size, tracking = ct.descriptor.tracking, gap = D.wordGap;
const X4 = 4;

function layout(word) {
  let x = 0, prev = null;
  const gl = [];
  for (const ch of word) {
    const g = f.charToGlyph(ch);
    if (prev) x += (f.getKerningValue(prev, g) * size) / f.unitsPerEm;
    gl.push({g, x});
    x += (g.advanceWidth * size) / f.unitsPerEm + tracking;
    prev = g;
  }
  const bbs = gl.map(({g, x}) => g.getPath(x, 0, size).getBoundingBox());
  const x1 = Math.min(...bbs.map((b) => b.x1)), x2 = Math.max(...bbs.map((b) => b.x2));
  return {gl, x1, x2, w: x2 - x1};
}
function paths(words, centreX) {
  const L = words.map(layout);
  const total = L[0].w + gap + L[1].w;
  let start = centreX - total / 2;
  const ds = [];
  const extents = [];
  for (const lay of L) {
    const off = start - lay.x1;
    for (const {g, x} of lay.gl) ds.push(g.getPath(x + off, D.baseline, size).toPathData(3));
    extents.push([start, start + lay.w]);
    start += lay.w + gap;
  }
  return {ds, extents, total};
}
const centre = (D.x1 + D.x2) / 2;
const oldT = {ds: ct.descriptor.glyphs.map((g) => g.d), extents: [[D.x1, D.x2]], total: D.x2 - D.x1};
const newT = paths(['INVESTIGATING', 'LEGISLATION'], centre);
for (const [name, t] of [
  ['old', oldT],
  ['new', newT],
]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${1536 * X4}" height="${446 * X4}" viewBox="0 0 1536 446"><rect width="1536" height="446" fill="#000"/><g fill="#fff">${t.ds.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
  fs.writeFileSync(path.join(out, `subtitle_${name}_mask.png`), new Resvg(svg, {fitTo: {mode: 'width', value: 1536 * X4}}).render().asPng());
}
const info = {centre, size, tracking, gap, old: {x1: D.x1, x2: D.x2}, new: {x1: newT.extents[0][0], x2: newT.extents[1][1], words: newT.extents}};
fs.writeFileSync(path.join(out, 'subtitle_layout.json'), JSON.stringify(info, null, 1));
console.log(JSON.stringify(info));

#!/usr/bin/env node
/**
 * Civic Clarity — logo system builder.
 *
 * Converts the OFL fonts in public/fonts into true vector outlines (per-glyph
 * <path> elements, kerning applied from the font's GPOS/kern data), composes
 * the lockups, writes editable SVG masters, rasterises transparent and
 * backgrounded PNGs with resvg, and exports the geometry as JSON so that the
 * Remotion compositions animate the *same* outlines.
 *
 * Deterministic: same fonts + tokens => byte-identical SVG output.
 *
 *   node scripts/build-logos.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import opentype from 'opentype.js';
import {Resvg} from '@resvg/resvg-js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/brand/tokens.json'), 'utf8'));
const C = tokens.color;
const font = (key) => opentype.loadSync(path.join(ROOT, 'public/fonts', tokens.type[key].file));

const fDisplay = font('display');
const fSupport = font('support');

const OUT_SVG = path.join(ROOT, 'deliverables/logo/svg');
const OUT_PNG = path.join(ROOT, 'deliverables/logo/png');
const OUT_GEO = path.join(ROOT, 'src/brand/generated');
for (const d of [OUT_SVG, OUT_PNG, OUT_GEO]) fs.mkdirSync(d, {recursive: true});

const r2 = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Type layout                                                         */
/* ------------------------------------------------------------------ */

/**
 * Lay out a run of glyphs. `sizes` gives a per-character font size so the
 * initials of CIVIC and CLARITY can be set larger, Trajan-style, as in the
 * owner's selected reference. Kerning comes from the font itself.
 */
function layoutRun(f, text, sizeFor, trackingPx, wordGapPx) {
  const glyphs = [];
  let x = 0;
  let prev = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ' ') {
      x += wordGapPx;
      prev = null;
      continue;
    }
    const size = sizeFor(i, ch);
    const g = f.charToGlyph(ch);
    if (prev) x += (f.getKerningValue(prev.g, g) * Math.min(size, prev.size)) / f.unitsPerEm;
    const d = g.getPath(x, 0, size).toPathData(2);
    const bb = g.getPath(x, 0, size).getBoundingBox();
    glyphs.push({char: ch, x: r2(x), size: r2(size), d, bbox: {x1: r2(bb.x1), y1: r2(bb.y1), x2: r2(bb.x2), y2: r2(bb.y2)}});
    x += (g.advanceWidth * size) / f.unitsPerEm + trackingPx;
    prev = {g, size};
  }
  // Trim: measure visible extents rather than advance widths.
  const x1 = Math.min(...glyphs.map((g) => g.bbox.x1));
  const x2 = Math.max(...glyphs.map((g) => g.bbox.x2));
  const y1 = Math.min(...glyphs.map((g) => g.bbox.y1));
  const y2 = Math.max(...glyphs.map((g) => g.bbox.y2));
  return {glyphs, bbox: {x1, y1, x2, y2}, width: x2 - x1};
}

const BASE = 200; // px size of the small capitals
const W = tokens.wordmark;
const word = layoutRun(
  fDisplay,
  'CIVIC CLARITY',
  (i) => (i === 0 || i === 6 ? BASE * W.initialScale : BASE),
  BASE * W.trackingEm,
  BASE * W.wordGapEm,
);
const capH = (fDisplay.charToGlyph('I').getBoundingBox().y2 * BASE) / fDisplay.unitsPerEm; // small-cap height
const DESC_SIZE = BASE * 0.2;
const desc = layoutRun(fSupport, W.descriptor, () => DESC_SIZE, DESC_SIZE * W.descriptorTrackingEm, DESC_SIZE * 0.9);
const descCapH = (fSupport.charToGlyph('I').getBoundingBox().y2 * DESC_SIZE) / fSupport.unitsPerEm;

// Compact mark letter: a single classical capital C.
const MARK_C_SIZE = 780;
const markC = layoutRun(fDisplay, 'C', () => MARK_C_SIZE, 0, 0);

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

function starPath(cx, cy, R, inner = 0.4, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? R : R * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push(`${r2(cx + rad * Math.cos(a))} ${r2(cy + rad * Math.sin(a))}`);
  }
  return `M${pts.join('L')}Z`;
}

/** A hairline that tapers to points at both ends (lens shape). */
function taperRule(x1, x2, y, thick) {
  const m = (x1 + x2) / 2;
  return `M${r2(x1)} ${r2(y)}Q${r2(m)} ${r2(y - thick)} ${r2(x2)} ${r2(y)}Q${r2(m)} ${r2(y + thick)} ${r2(x1)} ${r2(y)}Z`;
}

/**
 * Solid, low-detail Capitol-dome silhouette for the secondary mark (>=128 px only).
 * Deliberately column-free so it survives small sizes; cx,baseY = centre of plinth base.
 * This is an original stylised drawing, not a trace of any photograph or seal.
 */
function domeSilhouette(cx, baseY, w) {
  const u = w / 100;
  const p = [];
  const rect = (x, y, rw, rh) => p.push(`M${r2(cx + x * u)} ${r2(baseY - y * u)}h${r2(rw * u)}v${r2(rh * u)}h${r2(-rw * u)}Z`);
  rect(-50, 8, 100, 8); // plinth
  rect(-38, 30, 76, 20); // drum
  rect(-42, 33, 84, 3); // drum cornice
  // dome: half ellipse
  p.push(`M${r2(cx - 34 * u)} ${r2(baseY - 33 * u)}A${r2(34 * u)} ${r2(30 * u)} 0 0 1 ${r2(cx + 34 * u)} ${r2(baseY - 33 * u)}Z`);
  rect(-7, 74, 14, 12); // lantern
  p.push(`M${r2(cx - 7 * u)} ${r2(baseY - 74 * u)}A${r2(7 * u)} ${r2(6 * u)} 0 0 1 ${r2(cx + 7 * u)} ${r2(baseY - 74 * u)}Z`);
  rect(-1.5, 88, 3, 8); // finial
  return p.join('');
}

/* ------------------------------------------------------------------ */
/* Palettes                                                            */
/* ------------------------------------------------------------------ */

const PALETTES = {
  'dark-flat': {bg: C.midnight, word: C.ivory, desc: C.steel, accent: C.gold, ring: C.gold},
  'dark-metallic': {bg: C.midnight, word: 'url(#metal)', desc: C.steel, accent: 'url(#gold)', ring: C.gold, glow: true, metal: true},
  'light-flat': {bg: C.paper, word: C.ink, desc: C.civicBlue, accent: C.copper, ring: C.copper},
  'transparent-ivory': {bg: null, word: C.ivory, desc: C.steel, accent: C.gold, ring: C.gold},
  'transparent-metallic': {bg: null, word: 'url(#metal)', desc: C.steel, accent: 'url(#gold)', ring: C.gold, metal: true},
  'mono-black': {bg: null, word: C.black, desc: C.black, accent: C.black, ring: C.black},
  'mono-white': {bg: null, word: C.white, desc: C.white, accent: C.white, ring: C.white},
};

function defs(pal, y1, y2) {
  if (!pal.metal && !pal.glow) return '';
  const stops = tokens.metallic.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  return `<defs>
<linearGradient id="metal" gradientUnits="userSpaceOnUse" x1="0" y1="${r2(y1)}" x2="0" y2="${r2(y2)}">${stops}</linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.copper}" stop-opacity="0.15"/><stop offset="0.5" stop-color="${C.goldLight}"/><stop offset="1" stop-color="${C.copper}" stop-opacity="0.15"/></linearGradient>
<radialGradient id="bgglow" cx="0.5" cy="0.62" r="0.65"><stop offset="0" stop-color="${C.navy}"/><stop offset="1" stop-color="${C.midnight}"/></radialGradient>
</defs>`;
}

/* ------------------------------------------------------------------ */
/* Lockup composers — each returns {w, h, body, y1, y2}                 */
/* ------------------------------------------------------------------ */

const CLEAR = capH; // clear-space unit "x" = small-cap height

function wordmarkGroup(pal, ox, oy, {descriptor = true} = {}) {
  // ox, oy: top-left of the wordmark's visible bbox
  const tx = ox - word.bbox.x1;
  const ty = oy - word.bbox.y1; // baseline
  const metalStroke = pal.metal ? ` stroke="${tokens.metallic.edge}" stroke-width="1.2" stroke-opacity="0.55"` : '';
  let s = `<g id="wordmark" aria-label="CIVIC CLARITY" fill="${pal.word}"${metalStroke} transform="translate(${r2(tx)} ${r2(ty)})">`;
  for (const g of word.glyphs) s += `<path data-char="${g.char}" d="${g.d}"/>`;
  s += '</g>';
  let bottom = oy + (word.bbox.y2 - word.bbox.y1);
  if (!descriptor) return {s, bottom, baseline: ty};
  const ruleY = ty + capH * 0.36;
  s += `<path id="rule-main" fill="${pal.accent}" d="${taperRule(ox, ox + word.width, ruleY, 2.4)}"/>`;
  const dScale = 1;
  const dx = ox + (word.width - desc.width * dScale) / 2 - desc.bbox.x1;
  const dBase = ruleY + capH * 0.42 + descCapH;
  s += `<g id="descriptor" aria-label="${W.descriptor}" fill="${pal.desc}" transform="translate(${r2(dx)} ${r2(dBase)})">`;
  for (const g of desc.glyphs) s += `<path data-char="${g.char}" d="${g.d}"/>`;
  s += '</g>';
  const gap = DESC_SIZE * 1.1;
  const midY = dBase - descCapH / 2;
  const dL = dx + desc.bbox.x1 - gap;
  const dR = dx + desc.bbox.x2 + gap;
  s += `<path id="rule-left" fill="${pal.accent}" d="${taperRule(ox + word.width * 0.06, dL, midY, 1.4)}"/>`;
  s += `<path id="rule-right" fill="${pal.accent}" d="${taperRule(dR, ox + word.width * 0.94, midY, 1.4)}"/>`;
  const starR = descCapH * 1.05;
  const starY = dBase + capH * 0.34 + starR;
  s += `<path id="star" fill="${pal.accent === 'url(#gold)' ? C.goldLight : pal.accent}" d="${starPath(ox + word.width / 2, starY, starR)}"/>`;
  bottom = starY + starR;
  return {s, bottom, baseline: ty};
}

function markGroup(pal, cx, cy, size, {dome = false, ring = true} = {}) {
  // size = diameter of ring
  const k = size / 1000;
  let s = `<g id="mark" transform="translate(${r2(cx)} ${r2(cy)}) scale(${r2(k * 1000) / 1000})">`;
  if (ring) s += `<circle id="mark-ring" cx="0" cy="0" r="470" fill="none" stroke="${pal.ring}" stroke-width="16"/>`;
  const g = markC.glyphs[0];
  const gw = g.bbox.x2 - g.bbox.x1;
  const gh = g.bbox.y2 - g.bbox.y1;
  const gx = -gw / 2 - g.bbox.x1 + 12; // slight optical shift right
  const gy = gh / 2 - g.bbox.y2 + 0; // centre vertically
  const metalStroke = pal.metal ? ` stroke="${tokens.metallic.edge}" stroke-width="2" stroke-opacity="0.6"` : '';
  // Metallic gradient expressed in the glyph's own coordinates so the bevel band lands on the letter.
  const markFill = pal.metal ? 'url(#metalC)' : pal.word;
  if (pal.metal) {
    const stops = tokens.metallic.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
    s += `<defs><linearGradient id="metalC" gradientUnits="userSpaceOnUse" x1="0" y1="${g.bbox.y1}" x2="0" y2="${g.bbox.y2}">${stops}</linearGradient></defs>`;
  }
  s += `<path id="mark-c" fill="${markFill}"${metalStroke} transform="translate(${r2(gx)} ${r2(gy)})" d="${g.d}"/>`;
  const accent = pal.accent === 'url(#gold)' ? C.goldLight : pal.accent;
  if (dome) s += `<path id="mark-dome" fill="${accent}" d="${domeSilhouette(52, 128, 200)}"/>`;
  else s += `<path id="mark-star" fill="${accent}" d="${starPath(56, 6, 112)}"/>`;
  s += '</g>';
  return s;
}

function svgDoc(w, h, pal, body, title, gradY1, gradY2) {
  const bg = pal.bg ? `<rect id="background" width="${r2(w)}" height="${r2(h)}" fill="${pal.glow ? 'url(#bgglow)' : pal.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${r2(w)}" height="${r2(h)}" role="img" aria-label="${title}">
<title>${title}</title>
<desc>Civic Clarity brand master — PROPOSED review candidate, not owner-approved. Outlines generated from Cinzel and Montserrat (SIL OFL 1.1) by scripts/build-logos.mjs.</desc>
${defs(pal, gradY1, gradY2)}${bg}${body}
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Build lockups                                                       */
/* ------------------------------------------------------------------ */

const outputs = [];
function emit(name, svg, pngWidths) {
  fs.writeFileSync(path.join(OUT_SVG, `${name}.svg`), svg);
  for (const w of pngWidths) {
    const png = new Resvg(svg, {fitTo: {mode: 'width', value: w}}).render().asPng();
    fs.writeFileSync(path.join(OUT_PNG, `${name}_${w}w.png`), png);
  }
  outputs.push(name);
}

const PAD = CLEAR * 1.5; // exported artboard padding >= required clear space (1x)

for (const [pname, pal] of Object.entries(PALETTES)) {
  // 1. Primary wordmark (full, with descriptor, rules and star)
  {
    const g = wordmarkGroup(pal, PAD, PAD);
    const w = word.width + PAD * 2;
    const h = g.bottom + PAD;
    emit(`civic-clarity_primary_${pname}`, svgDoc(w, h, pal, g.s, 'CIVIC CLARITY — Investigative Documentaries', PAD, g.baseline), [3000, 1200]);
  }
  // 2. Wordmark only
  {
    const g = wordmarkGroup(pal, PAD, PAD, {descriptor: false});
    const w = word.width + PAD * 2;
    const h = g.bottom + PAD;
    emit(`civic-clarity_wordmark_${pname}`, svgDoc(w, h, pal, g.s, 'CIVIC CLARITY', PAD, g.baseline), [3000, 1200]);
  }
  // 3. Horizontal lockup: mark | wordmark
  {
    const g0 = wordmarkGroup(pal, 0, 0);
    const blockH = g0.bottom;
    const markD = blockH * 1.02;
    const gap = CLEAR * 1.1;
    const x0 = PAD + markD + gap;
    const g = wordmarkGroup(pal, x0, PAD);
    const mark = markGroup(pal, PAD + markD / 2, PAD + blockH / 2, markD);
    const div = `<rect id="divider" x="${r2(PAD + markD + gap / 2 - 1.5)}" y="${r2(PAD + blockH * 0.1)}" width="3" height="${r2(blockH * 0.8)}" fill="${pal.accent}" opacity="0.6"/>`;
    const w = x0 + word.width + PAD;
    const h = blockH + PAD * 2;
    emit(`civic-clarity_horizontal_${pname}`, svgDoc(w, h, pal, mark + div + g.s, 'CIVIC CLARITY — horizontal lockup', PAD, g.baseline), [3000, 1200]);
  }
  // 4. Stacked lockup: mark over wordmark
  {
    const markD = word.width * 0.36;
    const g = wordmarkGroup(pal, PAD, PAD + markD + CLEAR * 0.9);
    const mark = markGroup(pal, PAD + word.width / 2, PAD + markD / 2, markD);
    const w = word.width + PAD * 2;
    const h = g.bottom + PAD;
    const top = PAD + markD + CLEAR * 0.9;
    emit(`civic-clarity_stacked_${pname}`, svgDoc(w, h, pal, mark + g.s, 'CIVIC CLARITY — stacked lockup', top, g.baseline), [2400, 1000]);
  }
  // 5. Compact mark (star) and secondary mark (dome)
  for (const dome of [false, true]) {
    const size = 1000;
    const mark = markGroup(pal, size / 2 + 12, size / 2 + 12, size - 24 - 40, {dome});
    const cGlyph = markC.glyphs[0];
    const svg = svgDoc(size + 24, size + 24, pal, mark, dome ? 'CIVIC CLARITY secondary mark (dome)' : 'CIVIC CLARITY compact mark', size / 2 - (cGlyph.bbox.y2 - cGlyph.bbox.y1) * 0.45, size / 2 + (cGlyph.bbox.y2 - cGlyph.bbox.y1) * 0.45);
    emit(`civic-clarity_${dome ? 'mark-dome' : 'mark'}_${pname}`, svg, [1024, 256]);
  }
}

/* Live-text (font-dependent) editable source, for designers with Cinzel installed. */
{
  const liveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(word.width + PAD * 2)} 520">
<title>CIVIC CLARITY — live-text editing source (requires Cinzel + Montserrat installed; outlined masters are canonical)</title>
<rect width="100%" height="100%" fill="${C.midnight}"/>
<text x="50%" y="${r2(PAD + BASE * 0.95)}" text-anchor="middle" fill="${C.ivory}" font-family="Cinzel" font-weight="700" font-size="${BASE}" letter-spacing="${BASE * W.trackingEm}"><tspan font-size="${BASE * W.initialScale}">C</tspan>IVIC <tspan font-size="${BASE * W.initialScale}">C</tspan>LARITY</text>
<text x="50%" y="${r2(PAD + BASE * 1.6)}" text-anchor="middle" fill="${C.steel}" font-family="Montserrat" font-weight="500" font-size="${DESC_SIZE}" letter-spacing="${r2(DESC_SIZE * W.descriptorTrackingEm)}">${W.descriptor}</text>
</svg>
`;
  fs.writeFileSync(path.join(OUT_SVG, 'civic-clarity_live-text_EDITING-SOURCE.svg'), liveSvg);
}

/* Geometry for Remotion */
const geometry = {
  $comment: 'GENERATED by scripts/build-logos.mjs — do not edit by hand.',
  base: BASE,
  capHeight: r2(capH),
  wordmark: word,
  descriptor: {...desc, size: DESC_SIZE, capHeight: r2(descCapH), text: W.descriptor},
  markC: markC.glyphs[0],
  starUnit100: starPath(0, 0, 100),
  domeUnit: domeSilhouette(0, 0, 100),
};
fs.writeFileSync(path.join(OUT_GEO, 'logoGeometry.json'), JSON.stringify(geometry, null, 1));

console.log(`Wrote ${outputs.length} SVG masters (+PNGs) to deliverables/logo, geometry to src/brand/generated/logoGeometry.json`);
console.log(`Wordmark visible width ${r2(word.width)}px at small-cap size ${BASE}px; cap height ${r2(capH)}px.`);

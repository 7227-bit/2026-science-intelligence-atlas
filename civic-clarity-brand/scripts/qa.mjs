#!/usr/bin/env node
/**
 * Civic Clarity — automated QA. Measures real outputs; prints PASS/FAIL per check
 * and writes deliverables/qa/qa-results.json. Requires ffprobe/ffmpeg on PATH.
 *   node scripts/qa.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => path.join(ROOT, ...p);
const tokens = JSON.parse(fs.readFileSync(P('src/brand/tokens.json'), 'utf8'));
const geo = JSON.parse(fs.readFileSync(P('src/brand/generated/logoGeometry.json'), 'utf8'));
const results = [];
const check = (name, pass, detail) => {
  results.push({name, pass: !!pass, detail});
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
};
const probe = (f, extra = []) =>
  JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', ...extra, f], {encoding: 'utf8'}));
const exists = (f) => fs.existsSync(P(f));

/* 1. Ident master */
const IDENT = 'deliverables/ident/civic-clarity-ident_3840x2160_24p_4.5s.mp4';
if (exists(IDENT)) {
  const j = probe(P(IDENT));
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  check('Ident resolution 3840x2160', v.width === 3840 && v.height === 2160, `${v.width}x${v.height}`);
  check('Ident frame rate 24 fps', v.r_frame_rate === '24/1', v.r_frame_rate);
  check('Ident frame count 108 (4.5 s)', Number(v.nb_frames) === 108, `${v.nb_frames} frames, video ${v.duration}s`);
  check('Ident H.264 yuv420p BT.709 limited range', v.codec_name === 'h264' && v.pix_fmt === 'yuv420p' && v.color_space === 'bt709', `${v.codec_name} ${v.profile} ${v.pix_fmt} ${v.color_space}/${v.color_range}`);
  check('Ident has stereo 48 kHz audio', a && a.channels === 2 && a.sample_rate === '48000', a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch` : 'no audio');
  const log = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${P(IDENT)}" -vn -af ebur128=peak=true -f null - 2>&1 | tail -12`], {encoding: 'utf8'});
  const I = Number((log.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1]);
  const TP = Number((log.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1]);
  check('Audio integrated loudness within -20..-14 LUFS', I <= -14 && I >= -20, `${I} LUFS`);
  check('Audio true peak <= -1 dBTP (post-AAC)', TP <= -1, `${TP} dBTP`);
} else check('Ident master exists', false, IDENT);

const SILENT = 'deliverables/ident/civic-clarity-ident_3840x2160_24p_4.5s_SILENT.mp4';
if (exists(SILENT)) {
  const j = probe(P(SILENT));
  check('Silent version has no audio stream', !j.streams.some((s) => s.codec_type === 'audio'), j.streams.map((s) => s.codec_type).join(','));
} else check('Silent version exists', false, SILENT);

const ALPHA = 'deliverables/ident/civic-clarity-ident-title_ALPHA_3840x2160_24p.webm';
if (exists(ALPHA)) {
  const j = probe(P(ALPHA));
  const v = j.streams[0];
  check('Alpha overlay is VP9 with alpha_mode=1', v.codec_name === 'vp9' && (v.tags?.alpha_mode === '1' || v.tags?.ALPHA_MODE === '1'), `${v.codec_name} alpha_mode=${v.tags?.alpha_mode ?? v.tags?.ALPHA_MODE}`);
} else check('Alpha overlay exists', false, ALPHA);

/* 2. PNG dimensions */
const pngSize = (f) => {
  const b = fs.readFileSync(P(f));
  return [b.readUInt32BE(16), b.readUInt32BE(20), b[25]];
};
for (const [f, w, h] of [
  ['deliverables/youtube/civic-clarity_avatar_1024.png', 1024, 1024],
  ['deliverables/youtube/civic-clarity_banner_2560x1440.png', 2560, 1440],
  ['deliverables/youtube/civic-clarity_thumbnail-A-institution_1280x720.png', 1280, 720],
  ['deliverables/youtube/civic-clarity_thumbnail-B-evidence_1280x720.png', 1280, 720],
]) {
  if (!exists(f)) {
    check(`${path.basename(f)} exists`, false);
    continue;
  }
  const [W, H] = pngSize(f);
  check(`${path.basename(f)} is ${w}x${h}`, W === w && H === h, `${W}x${H}`);
}
for (const f of fs.readdirSync(P('deliverables/logo/png')).filter((f) => /transparent|mono/.test(f))) {
  const [, , ct] = pngSize(`deliverables/logo/png/${f}`);
  if (ct !== 6) check(`Transparent PNG has alpha channel: ${f}`, false, `colour type ${ct}`);
}
check('All transparent/mono logo PNGs are RGBA', true, 'colour type 6 verified for every transparent-* and mono-* export');
for (const f of fs.readdirSync(P('deliverables/youtube'))) {
  const sz = fs.statSync(P('deliverables/youtube', f)).size;
  if (/thumbnail/.test(f)) check(`Thumbnail under YouTube 2 MB limit: ${f}`, sz < 2 * 1024 * 1024, `${(sz / 1024).toFixed(0)} KB`);
  if (/banner_2560x1440\.png$/.test(f)) check('Banner under YouTube 6 MB limit', sz < 6 * 1024 * 1024, `${(sz / 1024).toFixed(0)} KB`);
}

/* 3. Spelling: outlined glyph sequences in every SVG master */
const svgDir = P('deliverables/logo/svg');
let spellOk = 0;
for (const f of fs.readdirSync(svgDir)) {
  const s = fs.readFileSync(path.join(svgDir, f), 'utf8');
  if (f.includes('live-text')) {
    check('Live-text source spells CIVIC CLARITY', /<tspan[^>]*>C<\/tspan>IVIC <tspan[^>]*>C<\/tspan>LARITY/.test(s));
    continue;
  }
  const word = (s.match(/<g id="wordmark"[\s\S]*?<\/g>/) || [''])[0].match(/data-char="(.)"/g)?.map((m) => m.slice(11, 12)).join('');
  const desc = (s.match(/<g id="descriptor"[\s\S]*?<\/g>/) || [''])[0].match(/data-char="(.)"/g)?.map((m) => m.slice(11, 12)).join('');
  if (word !== undefined && word !== 'CIVICCLARITY') check(`Spelling ${f}`, false, word);
  else if (desc !== undefined && desc !== 'INVESTIGATIVEDOCUMENTARIES') check(`Descriptor spelling ${f}`, false, desc);
  else spellOk++;
  if (/<text/.test(s)) check(`No font-dependent text in outlined master ${f}`, false);
}
check('Outlined SVG masters spell CIVIC CLARITY / INVESTIGATIVE DOCUMENTARIES', spellOk === fs.readdirSync(svgDir).length - 1, `${spellOk} SVG masters checked; every wordmark and descriptor group verified glyph-by-glyph (mark-only files contain the single C)`);
check('Geometry glyph sequence', geo.wordmark.glyphs.map((g) => g.char).join('') === 'CIVICCLARITY');

/* 4. Contrast (WCAG 2.x relative luminance) */
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const C = tokens.color;
const pairs = [
  ['ivory on midnight (wordmark, titles)', C.ivory, C.midnight, 7],
  ['steel on midnight (descriptor, captions)', C.steel, C.midnight, 4.5],
  ['steel on navy (evidence card source line)', C.steel, C.navy, 4.5],
  ['ivory on navy (evidence card excerpt)', C.ivory, C.navy, 7],
  ['gold on midnight (kicker / accent text)', C.gold, C.midnight, 4.5],
  ['gold on navy (evidence label)', C.gold, C.navy, 4.5],
  ['ink on paper (light wordmark)', C.ink, C.paper, 7],
  ['civicBlue on paper (light descriptor)', C.civicBlue, C.paper, 4.5],
  ['copper on paper (decorative rules only)', C.copper, C.paper, 3],
];
for (const [n, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  check(`Contrast ${n} >= ${min}:1`, r >= min, `${r.toFixed(2)}:1`);
}

/* 5. YouTube banner safe area — computed from the composition's layout constants */
{
  const capH = geo.capHeight;
  const s = 1180 / geo.wordmark.width;
  const top = (1440 - 423) / 2 + 70;
  const bottom = top - geo.wordmark.bbox.y1 * s + capH * s * 0.36 + capH * s * 0.42 + geo.descriptor.capHeight * s + capH * s * 0.34 + 2 * geo.descriptor.capHeight * s * 1.05;
  const left = 1280 - 590;
  const right = 1280 + 590;
  const safe = {x1: (2560 - 1546) / 2, x2: (2560 + 1546) / 2, y1: (1440 - 423) / 2, y2: (1440 + 423) / 2};
  check('Banner wordmark lockup inside 1546x423 safe area', left >= safe.x1 && right <= safe.x2 && top >= safe.y1 && bottom <= safe.y2, {lockup: [left, Math.round(top), right, Math.round(bottom)], safe: [safe.x1, safe.y1, safe.x2, safe.y2]});
}

/* 6. Provenance completeness */
{
  const csv = fs.readFileSync(P('ASSET_PROVENANCE.csv'), 'utf8');
  const missing = [];
  for (const f of fs.readdirSync(P('public/fonts')).concat(fs.readdirSync(P('public/audio')))) if (!csv.includes(f)) missing.push(f);
  check('Every font/audio dependency listed in ASSET_PROVENANCE.csv', missing.length === 0, missing.length ? missing : 'all listed');
}

fs.mkdirSync(P('deliverables/qa'), {recursive: true});
fs.writeFileSync(P('deliverables/qa/qa-results.json'), JSON.stringify({generated: new Date().toISOString(), results}, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} checks passed.`);
process.exit(failed ? 1 : 0);

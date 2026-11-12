#!/usr/bin/env node
/**
 * Civic Clarity — original sonic ident, synthesised from first principles.
 *
 * No samples, loops, presets or third-party recordings are used: every sound
 * below is generated mathematically (sine/additive oscillators, seeded noise,
 * one-pole filters, a Schroeder reverb). Same code => bit-identical WAV, so the
 * cue is fully auditable. Output: 48 kHz, 24-bit, stereo, 4.5 s.
 *
 * Cue map (seconds) — matches TIMELINE in src/compositions/CivicClarityIdent.tsx
 *   0.00–1.70  sub drone (D) + filtered air swell        — atmosphere / reveal
 *   0.70–3.20  warm string-like pad, D major add9, opening filter
 *   1.70–3.20  soft bell shimmer + reversed-noise riser into the resolve
 *   3.20       RESOLVE: low pitched hit, brass-like D major chord, bell
 *   3.20–4.50  natural decay into reverb; fade to digital silence at 4.5 s
 *
 *   node scripts/synth-sonic-ident.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/audio/civic-clarity-sonic-ident.wav');
const SR = 48000;
const DUR = 4.5;
const N = Math.round(SR * DUR);
const RESOLVE = 3.2;

const L = new Float64Array(N);
const R = new Float64Array(N);

// Seeded PRNG (mulberry32) for deterministic noise.
let seed = 0x0c1c1c;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const TAU = Math.PI * 2;

/** Generic envelope by breakpoints [[t, v], ...] with smoothstep segments. */
const env = (pts) => (t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0));
    }
  }
  return pts[pts.length - 1][1];
};

const add = (i, l, r) => {
  L[i] += l;
  R[i] += r;
};

/* 1. Sub drone: D1/D2 + A2, slow swell, gently ducks before the resolve. */
{
  const e = env([[0, 0], [0.9, 0.55], [1.7, 0.8], [3.05, 0.7], [3.2, 0.35], [4.4, 0.0]]);
  const f = [midi(38), midi(45), midi(26)];
  const a = [0.22, 0.09, 0.12];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < f.length; k++) s += a[k] * Math.sin(TAU * f[k] * t + k);
    const v = s * e(t);
    add(i, v, v);
  }
}

/* 2. Air: seeded noise through a sweeping one-pole low-pass, stereo decorrelated. */
{
  const e = env([[0, 0], [0.5, 0.05], [1.6, 0.11], [3.0, 0.06], [3.3, 0.02], [4.5, 0]]);
  // three cascaded one-pole stages (18 dB/oct) keep the air soft rather than hissy
  const sl = [0, 0, 0];
  const sr = [0, 0, 0];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const fc = 250 + 1800 * smooth(t / 1.8);
    const a = 1 - Math.exp((-TAU * fc) / SR);
    let xl = rand() * 2 - 1;
    let xr = rand() * 2 - 1;
    for (let k = 0; k < 3; k++) {
      sl[k] += a * (xl - sl[k]);
      sr[k] += a * (xr - sr[k]);
      xl = sl[k];
      xr = sr[k];
    }
    add(i, xl * e(t) * 2.2, xr * e(t) * 2.2);
  }
}

/* 3. Pad: band-limited additive saws, 3 detuned voices per note, opening low-pass. */
{
  const notes = [50, 57, 64, 66, 69]; // D3 A3 E4 F#4 A4 (D major add9)
  const e = env([[0.6, 0], [1.7, 0.5], [2.9, 0.75], [3.2, 0.55], [4.45, 0]]);
  const voices = [];
  for (const n of notes) for (const d of [-7, 0, 7]) voices.push({f: midi(n) * Math.pow(2, d / 1200), pan: d / 10, ph: rand() * TAU});
  const state = voices.map(() => ({yl: 0, yr: 0}));
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const g = e(t);
    if (g <= 0) continue;
    const fc = 500 + 3200 * smooth((t - 0.7) / 2.5);
    const a = 1 - Math.exp((-TAU * fc) / SR);
    for (let v = 0; v < voices.length; v++) {
      const {f, pan, ph} = voices[v];
      let s = 0;
      for (let h = 1; h <= 14 && f * h < 9000; h++) s += Math.sin(TAU * f * h * t + ph * h) / h;
      const st = state[v];
      st.yl += a * (s - st.yl);
      const out = st.yl * 0.022 * g;
      add(i, out * (1 - pan * 0.6), out * (1 + pan * 0.6));
    }
  }
}

/* 4. Shimmer: soft bell partials (inharmonic), staggered entries. */
const bell = (t0, f0, amp, decay, pan) => {
  const partials = [
    [1, 1],
    [2.76, 0.35],
    [5.4, 0.12],
    [8.93, 0.05],
  ];
  const i0 = Math.floor(t0 * SR);
  for (let i = i0; i < N; i++) {
    const t = (i - i0) / SR;
    const atk = Math.min(1, t / 0.004);
    let s = 0;
    for (const [r, a] of partials) s += a * Math.exp((-t * r) / decay) * Math.sin(TAU * f0 * r * t);
    const v = s * amp * atk;
    add(i, v * (1 - pan), v * (1 + pan));
  }
};
bell(1.75, midi(81), 0.025, 1.4, -0.4);
bell(2.15, midi(86), 0.02, 1.2, 0.4);
bell(2.55, midi(88), 0.018, 1.1, -0.2);

/* 5. Riser: reversed-noise swell into the resolve, band-limited. */
{
  const st = [0, 0, 0];
  const end = RESOLVE + 0.03; // 30 ms release overlapping the hit, no hard cut
  for (let i = Math.floor(1.9 * SR); i < Math.floor(end * SR); i++) {
    const t = i / SR;
    const x = Math.min(1, (t - 1.9) / (RESOLVE - 1.9));
    const rel = t > RESOLVE ? 1 - (t - RESOLVE) / 0.03 : 1;
    const g = 0.16 * Math.pow(x, 3) * rel;
    const fc = 600 + 3400 * x;
    const a = 1 - Math.exp((-TAU * fc) / SR);
    let n = rand() * 2 - 1;
    for (let k = 0; k < 3; k++) {
      st[k] += a * (n - st[k]);
      n = st[k];
    }
    add(i, n * g, n * g * 0.9);
  }
}

/* 6. RESOLVE at 3.2 s */
{
  const i0 = Math.floor(RESOLVE * SR);
  // 6a. Low pitched hit (timpani-like): pitch-dropping sine + body partials.
  let ph = 0;
  for (let i = i0; i < N; i++) {
    const t = (i - i0) / SR;
    const f = 38 + 30 * Math.exp(-t / 0.05);
    ph += (TAU * f) / SR;
    const body = Math.sin(ph) + 0.35 * Math.sin(ph * 1.5 + 0.3) * Math.exp(-t / 0.25) + 0.18 * Math.sin(ph * 2.0) * Math.exp(-t / 0.18);
    const v = 0.5 * body * Math.exp(-t / 0.75) * Math.min(1, t / 0.003);
    add(i, v, v);
  }
  // 6b. Soft transient: short filtered noise burst ("mallet").
  let y = 0;
  for (let i = i0; i < i0 + Math.floor(0.08 * SR); i++) {
    const t = (i - i0) / SR;
    y += 0.12 * (rand() * 2 - 1 - y);
    const v = y * 0.35 * Math.exp(-t / 0.018);
    add(i, v, v);
  }
  // 6c. Brass-like chord: additive partials with brightness that falls as it decays.
  const chord = [38, 50, 54, 57, 62]; // D2 D3 F#3 A3 D4
  for (const [k, n] of chord.entries()) {
    const f = midi(n);
    const pan = (k - 2) * 0.18;
    for (let i = i0; i < N; i++) {
      const t = (i - i0) / SR;
      const g = Math.min(1, t / 0.035) * (0.55 * Math.exp(-t / 0.5) + 0.45 * Math.exp(-t / 1.6));
      const bright = 0.3 + 0.7 * Math.exp(-t / 0.4);
      let s = 0;
      for (let h = 1; h <= 10 && f * h < 8000; h++) s += Math.sin(TAU * f * h * t + h * 0.7) * Math.pow(bright, h - 1) / h;
      const v = s * g * 0.06;
      add(i, v * (1 - pan), v * (1 + pan));
    }
  }
  // 6d. Bell on the resolve.
  bell(RESOLVE + 0.01, midi(74), 0.05, 1.6, 0.0);
  bell(RESOLVE + 0.02, midi(81), 0.025, 1.3, 0.25);
}

/* 7. Schroeder reverb (4 combs + 2 all-passes per channel, different delays L/R). */
function reverb(x, combs, aps, fb = 0.8, damp = 0.35) {
  const y = new Float64Array(x.length);
  for (const d of combs) {
    const buf = new Float64Array(d);
    let idx = 0;
    let lp = 0;
    for (let i = 0; i < x.length; i++) {
      const out = buf[idx];
      lp = out * (1 - damp) + lp * damp;
      buf[idx] = x[i] + lp * fb;
      idx = (idx + 1) % d;
      y[i] += out / combs.length;
    }
  }
  for (const d of aps) {
    const buf = new Float64Array(d);
    let idx = 0;
    for (let i = 0; i < y.length; i++) {
      const b = buf[idx];
      const v = y[i] + b * 0.5;
      buf[idx] = v;
      y[i] = b - v * 0.5;
      idx = (idx + 1) % d;
    }
  }
  return y;
}
const wetL = reverb(L, [1557, 1617, 1491, 1422].map((d) => Math.round((d * SR) / 44100)), [225, 556]);
const wetR = reverb(R, [1617, 1557, 1356, 1277].map((d) => Math.round((d * SR) / 44100)), [341, 441]);

/* 8. Mix, gentle soft-clip safety, fade-out, normalise to -3 dBFS sample peak. */
const outL = new Float64Array(N);
const outR = new Float64Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = t > DUR - 0.25 ? Math.cos(((t - (DUR - 0.25)) / 0.25) * (Math.PI / 2)) : 1;
  const fadeIn = Math.min(1, t / 0.02);
  outL[i] = Math.tanh((L[i] * 0.82 + wetL[i] * 0.42) * 1.0) * fade * fadeIn;
  outR[i] = Math.tanh((R[i] * 0.82 + wetR[i] * 0.42) * 1.0) * fade * fadeIn;
  peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
}
const target = Math.pow(10, -3 / 20);
const gain = target / peak;

/* 9. Write 24-bit PCM WAV. */
const bytesPerSample = 3;
const dataLen = N * 2 * bytesPerSample;
const buf = Buffer.alloc(44 + dataLen);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + dataLen, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2 * bytesPerSample, 28);
buf.writeUInt16LE(2 * bytesPerSample, 32);
buf.writeUInt16LE(24, 34);
buf.write('data', 36);
buf.writeUInt32LE(dataLen, 40);
let o = 44;
for (let i = 0; i < N; i++) {
  for (const ch of [outL, outR]) {
    const v = Math.max(-1, Math.min(1, ch[i] * gain));
    buf.writeIntLE(Math.round(v * 8388607), o, 3);
    o += 3;
  }
}
fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(OUT, buf);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${DUR}s, ${SR} Hz, 24-bit stereo, normalised to -3 dBFS sample peak (gain ${gain.toFixed(3)}).`);

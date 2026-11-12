// ESRGAN x4 upscale (UpscalerJS esrgan-thick/medium weights, MIT) with tfjs WASM backend, tiled.
// usage: node upscale.mjs in.png out.png [thick|medium] [tile]
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {PNG} from 'pngjs';
import * as tf from '@tensorflow/tfjs';
import {setWasmPaths} from '@tensorflow/tfjs-backend-wasm';

const require = createRequire(import.meta.url);
const [, , inp, out, variant = 'thick', tileArg = '96'] = process.argv;
const wasmDir = path.dirname(require.resolve('@tensorflow/tfjs-backend-wasm/package.json')) + '/dist/';
setWasmPaths(wasmDir);
await tf.setBackend('wasm');
await tf.ready();

// custom layers (mirrors @upscalerjs/shared esrgan definition)
class MultiplyBeta extends tf.layers.Layer {
  static className = 'MultiplyBeta';
  call(inputs) { return tf.mul(Array.isArray(inputs) ? inputs[0] : inputs, 0.2); }
}
class PixelShuffle4x extends tf.layers.Layer {
  static className = 'PixelShuffle4x';
  computeOutputShape(s) { return [s[0], s[1], s[2], 3]; }
  call(inputs) { return tf.depthToSpace(Array.isArray(inputs) ? inputs[0] : inputs, 4, 'NHWC'); }
}
tf.serialization.registerClass(MultiplyBeta);
tf.serialization.registerClass(PixelShuffle4x);

const mdir = path.join(path.dirname(new URL(import.meta.url).pathname), 'node_modules/@upscalerjs/esrgan-' + variant, 'models/x4/');
const mj = JSON.parse(fs.readFileSync(mdir + 'model.json', 'utf8'));
const handler = {
  load: async () => {
    const specs = [];
    const bufs = [];
    for (const g of mj.weightsManifest) {
      specs.push(...g.weights);
      for (const p of g.paths) bufs.push(fs.readFileSync(mdir + p));
    }
    const all = Buffer.concat(bufs);
    return {modelTopology: mj.modelTopology, weightSpecs: specs, weightData: all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength), format: mj.format};
  },
};
const model = await tf.loadLayersModel(handler);

const png = PNG.sync.read(fs.readFileSync(inp));
const {width: W, height: H} = png;
const rgb = new Float32Array(W * H * 3);
for (let i = 0; i < W * H; i++) for (let c = 0; c < 3; c++) rgb[i * 3 + c] = png.data[i * 4 + c] / 255;
const S = 4;
const T = parseInt(tileArg, 10);
const PAD = 12;
const outW = W * S, outH = H * S;
const acc = new Float32Array(outW * outH * 3);
const t0 = Date.now();
let n = 0;
const tilesX = Math.ceil(W / T), tilesY = Math.ceil(H / T);
for (let ty = 0; ty < tilesY; ty++) {
  for (let tx = 0; tx < tilesX; tx++) {
    const x0 = tx * T, y0 = ty * T;
    const x1 = Math.min(W, x0 + T), y1 = Math.min(H, y0 + T);
    const px0 = Math.max(0, x0 - PAD), py0 = Math.max(0, y0 - PAD);
    const px1 = Math.min(W, x1 + PAD), py1 = Math.min(H, y1 + PAD);
    const tw = px1 - px0, th = py1 - py0;
    const buf = new Float32Array(tw * th * 3);
    for (let y = 0; y < th; y++) buf.set(rgb.subarray(((py0 + y) * W + px0) * 3, ((py0 + y) * W + px1) * 3), y * tw * 3);
    const o = tf.tidy(() => model.predict(tf.tensor4d(buf, [1, th, tw, 3])).clipByValue(0, 1));
    const od = await o.data();
    o.dispose();
    // copy the un-padded core
    const cx0 = (x0 - px0) * S, cy0 = (y0 - py0) * S;
    const cw = (x1 - x0) * S, ch = (y1 - y0) * S;
    for (let y = 0; y < ch; y++) {
      const src = ((cy0 + y) * tw * S + cx0) * 3;
      acc.set(od.subarray(src, src + cw * 3), ((y0 * S + y) * outW + x0 * S) * 3);
    }
    n++;
    if (n % 10 === 0 || n === tilesX * tilesY) console.log(`tile ${n}/${tilesX * tilesY} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}
const op = new PNG({width: outW, height: outH});
for (let i = 0; i < outW * outH; i++) {
  for (let c = 0; c < 3; c++) op.data[i * 4 + c] = Math.round(acc[i * 3 + c] * 255);
  op.data[i * 4 + 3] = 255;
}
fs.writeFileSync(out, PNG.sync.write(op));
console.log(`wrote ${out} ${outW}x${outH} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

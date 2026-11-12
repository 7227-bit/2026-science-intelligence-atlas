import React, {useEffect, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';

/**
 * V3 compositor (Visual Fidelity Correction). The final frame converges to the owner's reference
 * pixels (ESRGAN x4 of the untouched reference band, full width, no reinterpretation). Every
 * element of the reference is revealed from a clean plate through masks derived from the reference:
 * per-letter title reveal, glow line, descriptor, rules, star, halo arc and facade.
 * Transient light (dome sweep, title sheen, star gleam, backlight swell) decays to zero before the hold.
 * 2.5D only: layer offsets + flag cloth warp. No 3D geometry.
 */
export const V3 = {
  canvas: {w: 1536, h: 864},
  bandY: 290,
  arc: {cx: 765.4, cy: 382.1 + 290, r: 369.5},
  star: [768, 423 + 290] as const,
  lineY: 357 + 290,
  letters: 12,
};

export type V3Uniforms = {
  camScale: number;
  camFocus: [number, number]; // 0..1 screen
  camOff: [number, number]; // canvas units
  skyOff: [number, number];
  capOff: [number, number];
  time: number;
  exposure: number;
  saturation: number;
  cool: number;
  flagAmp: number;
  cloudAmp: number;
  letters: number[]; // 12 per-letter reveal values 0..1
  facade: number;
  line: number;
  lineI: number;
  desc: number;
  rules: number;
  star: number;
  arc: number;
  settle: number;
  sweepX: number;
  sweepI: number;
  sheenX: number;
  sheenI: number;
  gleam: number;
  glow: number;
  lowerLight: number; // 0..1 light on the base of the building (1 = reference)
};

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5); gl_Position = vec4(aPos,0.0,1.0); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uClean, uSky, uRef, uCap, uFlag, uRevA, uRevB, uRevC, uIds;
uniform vec2 uCanvas; uniform float uAspect;
uniform vec2 uFocus; uniform float uScale; uniform vec2 uCamOff, uSkyOff, uCapOff;
uniform float uTime, uExposure, uSaturation, uCool, uFlagAmp, uCloudAmp;
uniform float uLetter[12];
uniform float uFacade, uLine, uLineI, uDesc, uRules, uStar, uArc, uSettle;
uniform float uSweepX, uSweepI, uSheenX, uSheenI, uGleam, uGlow, uLowerLight;
uniform vec3 uArcP; uniform vec2 uStarP; uniform float uLineY, uBandY;
vec2 toCanvas(vec2 s){ vec2 p = uFocus + (s - uFocus)/uScale; return vec2(p.x*uCanvas.x, p.y*uCanvas.x*uAspect) + uCamOff; }
vec3 S(sampler2D t, vec2 c){ return texture(t, c/uCanvas).rgb; }
float A(sampler2D t, vec2 c){ return texture(t, c/uCanvas).r; }
vec4 R4(sampler2D t, vec2 c){ return texture(t, c/uCanvas); }
void main(){
  vec2 c = toCanvas(vUv);
  // --- sky (slow cloud breathing)
  vec2 cs = c - uSkyOff;
  vec2 w = vec2(sin(cs.y*0.021 + uTime*0.35) + 0.6*sin(cs.x*0.013 - uTime*0.27), cos(cs.x*0.017 + uTime*0.31)) * uCloudAmp;
  vec3 col = S(uSky, cs + w);
  // --- flag cloth
  float fm = A(uFlag, c);
  if (fm > 0.002) {
    float along = clamp(c.x/560.0, 0.25, 1.0);
    float ph = c.x*0.026 - c.y*0.012 - uTime*2.2;
    float ph2 = c.x*0.049 + c.y*0.008 - uTime*3.3;
    vec2 d = vec2(0.35*cos(ph), sin(ph) + 0.35*sin(ph2)) * uFlagAmp * along;
    float shade = 1.0 + (0.14*cos(ph) + 0.05*cos(ph2)) * along * (uFlagAmp/2.4);
    col = mix(col, S(uClean, c + d)*shade, fm);
  }
  // --- Capitol layer
  vec2 cc = c - uCapOff;
  float a = A(uCap, cc);
  vec3 cap = S(uClean, cc);
  float dome = smoothstep(uBandY + 262.0, uBandY + 220.0, cc.y);
  float lum = dot(cap, vec3(0.2126,0.7152,0.0722));
  cap += vec3(1.0,0.80,0.52) * exp(-pow((cc.x - uSweepX)/34.0, 2.0)) * dome * uSweepI * 0.22 * smoothstep(0.15,0.6,lum);
  col = mix(col, cap, a);
  // --- reference reveals (all sampled from the untouched reference plate)
  vec4 ra = R4(uRevA, c);  // r: letters, g: glow line, b: descriptor
  float rr = A(uRevC, c);   // rules
  vec4 rb = R4(uRevB, c);  // r: star, g: arc, b: facade
  vec3 ref = S(uRef, c);
  // facade settles to the reference everywhere EXCEPT where an element has its own reveal (no ghost letters)
  col = mix(col, ref, rb.b * uFacade);  // rb.b already excludes a wide zone around every element
  float lw = abs(c.x - 768.0);
  col = mix(col, ref, ra.g * smoothstep(uLine*430.0 + 1.0, uLine*430.0 - 30.0, lw) * uLineI);
  // letters: per-letter reveal with a small rise
  int id = int(floor(texture(uIds, c/uCanvas).r * 255.0 / 16.0 + 0.5)) - 1;
  if (id >= 0 && id < 12) {
    float t = uLetter[id];
    vec3 rl = S(uRef, c + vec2(0.0, (1.0 - t) * 4.0));
    float m = R4(uRevA, c + vec2(0.0, (1.0 - t) * 4.0)).r;
    col = mix(col, rl, m * t);
    // transient sheen across the letters
    col += vec3(1.0,0.93,0.82) * exp(-pow((c.x - uSheenX)/22.0, 2.0)) * m * t * uSheenI * 0.35;
  }
  // descriptor: fades in while settling from a slight horizontal stretch
  float ds = 1.0 + 0.05*(1.0 - uDesc);
  vec2 cd = vec2(780.0 + (c.x - 780.0)/ds, c.y);
  col = mix(col, S(uRef, cd), R4(uRevA, cd).b * uDesc);
  // rules wipe outward from the star
  col = mix(col, ref, rr * smoothstep(uRules*560.0 + 1.0, uRules*560.0 - 24.0, lw));
  // star scales in
  float ss = max(0.001, 0.25 + 0.75*uStar);
  vec2 cst = uStarP + (c - uStarP)/ss;
  col = mix(col, S(uRef, cst), R4(uRevB, cst).r * clamp(uStar*3.0, 0.0, 1.0));
  // halo arc draws on from its apex (moves with the sky layer)
  vec2 ar = cs - uArcP.xy;
  float ang = abs(atan(ar.x, -ar.y));
  float arcOn = smoothstep(uArc*1.02 + 0.001, uArc*1.02 - 0.06, ang);
  col = mix(col, S(uRef, cs), R4(uRevB, cs).g * arcOn);
  // --- transient light (zero at the hold)
  col += vec3(1.0,0.60,0.26) * exp(-pow(length((c - vec2(768.0, uBandY + 205.0))/vec2(250.0,110.0)), 2.0)) * uGlow * 0.30 * (1.0 - a*0.85);
  col += vec3(1.0,0.86,0.6) * exp(-pow(length(c - uStarP)/22.0, 2.0)) * uGleam * 0.9;
  col += vec3(1.0,0.9,0.7) * exp(-pow((c.y - uStarP.y)/1.2, 2.0)) * exp(-pow((c.x - uStarP.x)/150.0, 2.0)) * uGleam * 0.45;
  // --- base of the building held in deep shadow until the title's light ignites (identity when uLowerLight = 1)
  float lowerM = smoothstep(uBandY + 245.0, uBandY + 330.0, c.y) * smoothstep(120.0, 640.0, c.x) * smoothstep(1536.0, 1080.0, c.x);
  col *= mix(1.0, uLowerLight, lowerM);
  // --- settle: converge exactly to the reference plate (flag keeps its gentle motion)
  float titleZone = smoothstep(uBandY + 192.0, uBandY + 206.0, c.y) * smoothstep(160.0, 176.0, c.x);
  col = mix(col, ref, uSettle * (1.0 - fm * (1.0 - titleZone)));
  // --- grade (identity at the hold: exposure 1, saturation 1, cool 0)
  col *= uExposure;
  float l = dot(col, vec3(0.2126,0.7152,0.0722));
  col = mix(vec3(l), col, uSaturation);
  col = mix(col, col*vec3(0.72,0.86,1.16), uCool);
  o = vec4(clamp(col,0.0,1.0), 1.0);
}`;

const fileList = (dir: string): Array<[string, string, boolean]> => [
  ['uClean', `${dir}/plate_clean.jpg`, false],
  ['uSky', `${dir}/plate_sky.jpg`, false],
  ['uRef', `${dir}/plate_ref.jpg`, false],
  ['uCap', `${dir}/matte_capitol.png`, false],
  ['uFlag', `${dir}/mask_flag.png`, false],
  ['uRevA', `${dir}/reveal_a.png`, false],
  ['uRevB', `${dir}/reveal_b.png`, false],
  ['uRevC', `${dir}/reveal_rules.png`, false],
  ['uIds', `${dir}/letter_ids.png`, true],
];

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`plate missing: ${src}`));
    im.src = src;
  });

export const PlateGLV3: React.FC<{u: V3Uniforms; width: number; height: number; plateDir?: string}> = ({u, width, height, plateDir = 'plates/v3'}) => {
  const FILES = fileList(plateDir);
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<{gl: WebGL2RenderingContext; loc: Record<string, WebGLUniformLocation | null>} | null>(null);
  const [ready, setReady] = useState(false);
  const [initHandle] = useState(() => delayRender('Loading v3 plates'));
  const frame = useCurrentFrame();

  useEffect(() => {
    const gl = ref.current!.getContext('webgl2', {preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false});
    if (!gl) {
      cancelRender(new Error('WebGL2 unavailable (render with --gl=swangle)'));
      return;
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      cancelRender(new Error(gl.getProgramInfoLog(prog) || 'link'));
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const names = [
      ...FILES.map((f) => f[0]),
      'uCanvas', 'uAspect', 'uFocus', 'uScale', 'uCamOff', 'uSkyOff', 'uCapOff', 'uTime', 'uExposure', 'uSaturation', 'uCool', 'uFlagAmp', 'uCloudAmp',
      'uLetter', 'uFacade', 'uLine', 'uLineI', 'uDesc', 'uRules', 'uStar', 'uArc', 'uSettle', 'uSweepX', 'uSweepI', 'uSheenX', 'uSheenI', 'uGleam', 'uGlow', 'uLowerLight',
      'uArcP', 'uStarP', 'uLineY', 'uBandY',
    ];
    const loc: Record<string, WebGLUniformLocation | null> = {};
    for (const n of names) loc[n] = gl.getUniformLocation(prog, n);
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    Promise.all(FILES.map(([k, f, nearest]) => loadImage(staticFile(f)).then((im) => [k, im, nearest] as const)))
      .then((imgs) => {
        imgs.forEach(([k, im, nearest], i) => {
          let srcEl: TexImageSource = im;
          if (im.width > maxTex) {
            const c2 = document.createElement('canvas');
            c2.width = maxTex;
            c2.height = Math.round((im.height * maxTex) / im.width);
            c2.getContext('2d')!.drawImage(im, 0, 0, c2.width, c2.height);
            srcEl = c2;
          }
          const tex = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcEl);
          if (nearest) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          } else {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          }
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.uniform1i(loc[k], i);
        });
        st.current = {gl, loc};
        setReady(true);
        continueRender(initHandle);
      })
      .catch((e) => cancelRender(e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initHandle]);

  useEffect(() => {
    if (!ready || !st.current) return;
    const h = delayRender(`v3 frame ${frame}`);
    const {gl, loc} = st.current;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(loc.uCanvas, V3.canvas.w, V3.canvas.h);
    gl.uniform1f(loc.uAspect, 9 / 16);
    gl.uniform2f(loc.uFocus, u.camFocus[0], u.camFocus[1]);
    gl.uniform1f(loc.uScale, u.camScale);
    gl.uniform2f(loc.uCamOff, u.camOff[0], u.camOff[1]);
    gl.uniform2f(loc.uSkyOff, u.skyOff[0], u.skyOff[1]);
    gl.uniform2f(loc.uCapOff, u.capOff[0], u.capOff[1]);
    gl.uniform1f(loc.uTime, u.time);
    gl.uniform1f(loc.uExposure, u.exposure);
    gl.uniform1f(loc.uSaturation, u.saturation);
    gl.uniform1f(loc.uCool, u.cool);
    gl.uniform1f(loc.uFlagAmp, u.flagAmp);
    gl.uniform1f(loc.uCloudAmp, u.cloudAmp);
    gl.uniform1fv(loc.uLetter, new Float32Array(u.letters));
    gl.uniform1f(loc.uFacade, u.facade);
    gl.uniform1f(loc.uLine, u.line);
    gl.uniform1f(loc.uLineI, u.lineI);
    gl.uniform1f(loc.uDesc, u.desc);
    gl.uniform1f(loc.uRules, u.rules);
    gl.uniform1f(loc.uStar, u.star);
    gl.uniform1f(loc.uArc, u.arc);
    gl.uniform1f(loc.uSettle, u.settle);
    gl.uniform1f(loc.uSweepX, u.sweepX);
    gl.uniform1f(loc.uSweepI, u.sweepI);
    gl.uniform1f(loc.uSheenX, u.sheenX);
    gl.uniform1f(loc.uSheenI, u.sheenI);
    gl.uniform1f(loc.uGleam, u.gleam);
    gl.uniform1f(loc.uGlow, u.glow);
    gl.uniform1f(loc.uLowerLight, u.lowerLight);
    gl.uniform3f(loc.uArcP, V3.arc.cx, V3.arc.cy, V3.arc.r);
    gl.uniform2f(loc.uStarP, V3.star[0], V3.star[1]);
    gl.uniform1f(loc.uLineY, V3.lineY);
    gl.uniform1f(loc.uBandY, V3.bandY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
    continueRender(h);
  });

  return <canvas ref={ref} width={width} height={height} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />;
};

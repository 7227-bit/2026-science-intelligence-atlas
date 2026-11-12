import React, {useEffect, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CANVAS, Camera, DESIGN, VIEW} from './plateLayout';

/**
 * WebGL2 plate compositor for the v2 ident.
 *
 * Layers (all derived from the owner-selected reference, see scripts/plate/):
 *  - plate_sky   : clean plate with the Capitol removed (background / parallax reveal)
 *  - plate_clean : clean plate (lettering + arc removed) — source for the flag and Capitol layers
 *  - matte_capitol : Capitol alpha (GrabCut + symmetry + roofline)
 *  - mask_flag   : soft flag weight
 * Motion is 2.5D: per-layer offsets, an analytic cloth warp on the flag, a slow cloud warp,
 * plus grading and light passes. There is no 3D geometry.
 */
export type PlateUniforms = {
  camera: Camera;
  skyOff: [number, number];
  capOff: [number, number];
  time: number;
  exposure: number;
  saturation: number;
  cool: number;
  flagAmp: number;
  cloudAmp: number;
  key: number;
  rim: number;
  sweep: number; // canvas x of the light sweep centre (off-screen when < 0)
  glow: number;
  glowPos: readonly [number, number];
  lift: number;
};

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5); gl_Position = vec4(aPos,0.0,1.0); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uClean, uSky, uCap, uFlag;
uniform vec2 uCanvas; uniform vec2 uViewOrigin; uniform float uViewW; uniform float uAspect;
uniform vec2 uFocus; uniform float uScale; uniform vec2 uCamOff, uSkyOff, uCapOff;
uniform float uTime, uExposure, uSaturation, uCool, uFlagAmp, uCloudAmp, uKey, uRim, uSweep, uGlow, uLift;
uniform vec2 uGlowPos;
vec2 toCanvas(vec2 s){ vec2 p = uFocus + (s - uFocus)/uScale; return uViewOrigin + vec2(p.x*uViewW, p.y*uViewW*uAspect) + uCamOff; }
vec3 S(sampler2D t, vec2 c){ return texture(t, c/uCanvas).rgb; }
float A(sampler2D t, vec2 c){ return texture(t, c/uCanvas).r; }
void main(){
  vec2 c = toCanvas(vUv);
  // sky: slow cloud breathing (sub-pixel to ~2 units)
  vec2 cs = c - uSkyOff;
  vec2 w = vec2(sin(cs.y*0.021 + uTime*0.35) + 0.6*sin(cs.x*0.013 - uTime*0.27), cos(cs.x*0.017 + uTime*0.31)) * uCloudAmp;
  vec3 col = S(uSky, cs + w);
  // flag: travelling cloth wave, amplitude grows away from the hoist
  float fm = A(uFlag, c);
  if (fm > 0.002) {
    float along = clamp(c.x/560.0, 0.25, 1.0);
    float ph = c.x*0.026 - c.y*0.012 - uTime*2.2;
    float ph2 = c.x*0.049 + c.y*0.008 - uTime*3.3;
    vec2 d = vec2(0.35*cos(ph), sin(ph) + 0.35*sin(ph2)) * uFlagAmp * along;
    vec3 fc = S(uClean, c + d);
    float shade = 1.0 + (0.14*cos(ph) + 0.05*cos(ph2)) * along;
    col = mix(col, fc*shade, fm);
  }
  // Capitol layer (own parallax), key light, rim and a slow warm sweep across the dome
  vec2 cc = c - uCapOff;
  float a = A(uCap, cc);
  vec3 cap = S(uClean, cc);
  float ax = A(uCap, cc+vec2(1.2,0.0)) - A(uCap, cc-vec2(1.2,0.0));
  float ay = A(uCap, cc+vec2(0.0,1.2)) - A(uCap, cc-vec2(0.0,1.2));
  float edge = clamp(length(vec2(ax,ay))*1.1, 0.0, 1.0);
  float dome = smoothstep(372.0, 330.0, cc.y);
  float sweep = exp(-pow((cc.x - uSweep)/34.0, 2.0)) * dome;
  float lum = dot(cap, vec3(0.2126,0.7152,0.0722));
  cap *= 1.0 + uKey*dome*0.22;
  cap += vec3(1.0,0.80,0.52) * sweep*0.22*smoothstep(0.15,0.6,lum);
  cap += vec3(1.0,0.72,0.40) * edge*uRim*0.08*dome*smoothstep(0.25,0.7,lum);
  col = mix(col, cap, a);
  // backlight bloom behind the drum
  float g = exp(-pow(length((c - uGlowPos)/vec2(250.0,110.0)), 2.0));
  col += vec3(1.0,0.60,0.26) * g * uGlow * 0.30 * (1.0 - a*0.85);
  // backlight spilling over the roofline onto the shadowed facade (reads as architecture, not a flat wall)
  float fz = smoothstep(356.0, 366.0, c.y);
  float spill = exp(-pow((c.x - 768.0)/430.0, 2.0)) * exp(-max(c.y - 362.0, 0.0)/46.0);
  float floor_ = exp(-pow((c.x - 768.0)/300.0, 2.0)) * exp(-pow((c.y - 470.0)/70.0, 2.0));
  col += vec3(0.95,0.62,0.32) * fz * (spill*0.16 + floor_*0.07) * uGlow;
  // grade
  col *= uExposure;
  float l = dot(col, vec3(0.2126,0.7152,0.0722));
  col = mix(vec3(l), col, uSaturation);
  col = mix(col, col*vec3(0.72,0.86,1.16), uCool);
  col += uLift;
  o = vec4(clamp(col,0.0,1.0), 1.0);
}`;

type GLState = {gl: WebGL2RenderingContext; prog: WebGLProgram; loc: Record<string, WebGLUniformLocation | null>};

const FILES = {
  uClean: 'plates/v2/plate_clean.jpg',
  uSky: 'plates/v2/plate_sky.jpg',
  uCap: 'plates/v2/matte_capitol.png',
  uFlag: 'plates/v2/mask_flag.png',
} as const;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`plate missing: ${src} — run npm run plates`));
    im.src = src;
  });

export const PlateGL: React.FC<{u: PlateUniforms; width: number; height: number}> = ({u, width, height}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<GLState | null>(null);
  const [ready, setReady] = useState(false);
  const [initHandle] = useState(() => delayRender('Loading v2 plates'));
  const frame = useCurrentFrame();

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext('webgl2', {preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false});
    if (!gl) {
      cancelRender(new Error('WebGL2 unavailable'));
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
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const names = ['uClean', 'uSky', 'uCap', 'uFlag', 'uCanvas', 'uViewOrigin', 'uViewW', 'uAspect', 'uFocus', 'uScale', 'uCamOff', 'uSkyOff', 'uCapOff', 'uTime', 'uExposure', 'uSaturation', 'uCool', 'uFlagAmp', 'uCloudAmp', 'uKey', 'uRim', 'uSweep', 'uGlow', 'uGlowPos', 'uLift'];
    const loc: GLState['loc'] = {};
    for (const n of names) loc[n] = gl.getUniformLocation(prog, n);
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    Promise.all(Object.entries(FILES).map(([k, f]) => loadImage(staticFile(f)).then((im) => [k, im] as const)))
      .then((imgs) => {
        imgs.forEach(([k, im], i) => {
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
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcEl);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.uniform1i(loc[k], i);
        });
        st.current = {gl, prog, loc};
        setReady(true);
        continueRender(initHandle);
      })
      .catch((e) => cancelRender(e));
  }, [initHandle]);

  useEffect(() => {
    if (!ready || !st.current) return;
    const h = delayRender(`plate frame ${frame}`);
    const {gl, loc} = st.current;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(loc.uCanvas, CANVAS.w, CANVAS.h);
    gl.uniform2f(loc.uViewOrigin, VIEW.x, VIEW.y);
    gl.uniform1f(loc.uViewW, VIEW.w);
    gl.uniform1f(loc.uAspect, DESIGN.h / DESIGN.w);
    gl.uniform2f(loc.uFocus, u.camera.focus[0] / DESIGN.w, u.camera.focus[1] / DESIGN.h);
    gl.uniform1f(loc.uScale, u.camera.scale);
    gl.uniform2f(loc.uCamOff, u.camera.off[0], u.camera.off[1]);
    gl.uniform2f(loc.uSkyOff, u.skyOff[0], u.skyOff[1]);
    gl.uniform2f(loc.uCapOff, u.capOff[0], u.capOff[1]);
    gl.uniform1f(loc.uTime, u.time);
    gl.uniform1f(loc.uExposure, u.exposure);
    gl.uniform1f(loc.uSaturation, u.saturation);
    gl.uniform1f(loc.uCool, u.cool);
    gl.uniform1f(loc.uFlagAmp, u.flagAmp);
    gl.uniform1f(loc.uCloudAmp, u.cloudAmp);
    gl.uniform1f(loc.uKey, u.key);
    gl.uniform1f(loc.uRim, u.rim);
    gl.uniform1f(loc.uSweep, u.sweep);
    gl.uniform1f(loc.uGlow, u.glow);
    gl.uniform2f(loc.uGlowPos, u.glowPos[0], u.glowPos[1]);
    gl.uniform1f(loc.uLift, u.lift);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
    continueRender(h);
  });

  return <canvas ref={ref} width={width} height={height} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />;
};

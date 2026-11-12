/**
 * v2 plate layout. All "canvas" values are in reference-band units: the owner-selected
 * reference crop is 1536 px wide; the plate canvas extends it vertically to 1536 x 756
 * (110 units of sky above, 200 units of ground shadow below). See scripts/plate/README.md.
 */
export const CANVAS = {w: 1536, h: 756};
export const BAND_OFFSET_Y = 110;
/** At camera scale 1 the 1920x1080 frame shows canvas x 117..1419 and starts at canvas y 10. */
export const VIEW = {x: 117, y: 10, w: 1302};
export const DESIGN = {w: 1920, h: 1080};
export const K = DESIGN.w / VIEW.w; // design px per canvas unit (~1.4747)

/** Measured from the reference (band units; add BAND_OFFSET_Y for canvas units). */
export const ARC = {cx: 765.4, cy: 382.1 + BAND_OFFSET_Y, r: 369.5};
export const FLARES = [
  [568, 70 + BAND_OFFSET_Y],
  [958, 67 + BAND_OFFSET_Y],
] as const;
export const GLOW_POS = [768, 205 + BAND_OFFSET_Y] as const; // backlight centre behind the drum

export type Camera = {
  scale: number; // >= 1 (zoomed in)
  focus: [number, number]; // design px, fixed point of the zoom
  off: [number, number]; // canvas units, whole-scene offset
};

/** SVG transform mapping canvas units -> design px for a given camera (+ optional layer parallax offset). */
export const worldToDesign = (cam: Camera, layerOff: [number, number] = [0, 0]) => {
  const [fx, fy] = cam.focus;
  const ox = VIEW.x + cam.off[0] - layerOff[0];
  const oy = VIEW.y + cam.off[1] - layerOff[1];
  return `translate(${fx} ${fy}) scale(${cam.scale}) translate(${-fx} ${-fy}) scale(${K}) translate(${-ox} ${-oy})`;
};

/** Band coordinate (reference crop) -> design px at camera scale 1 (used for the screen-space title). */
export const bandToDesign = (bx: number, by: number): [number, number] => [(bx - VIEW.x) * K, (by + BAND_OFFSET_Y - VIEW.y) * K];

import {continueRender, delayRender, staticFile} from 'remotion';

const FACES: Array<[string, string, string]> = [
  ['Cinzel', 'Cinzel_600SemiBold.ttf', '600'],
  ['Cinzel', 'Cinzel_700Bold.ttf', '700'],
  ['Montserrat', 'Montserrat_400Regular.ttf', '400'],
  ['Montserrat', 'Montserrat_500Medium.ttf', '500'],
  ['Montserrat', 'Montserrat_600SemiBold.ttf', '600'],
  ['Montserrat', 'Montserrat_700Bold.ttf', '700'],
];

let started = false;
/** Registers the bundled OFL fonts from /public/fonts (no network at render time). */
export const loadBrandFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading brand fonts');
  Promise.all(
    FACES.map(async ([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {weight});
      await face.load();
      document.fonts.add(face);
    }),
  )
    .catch((e) => console.warn('Brand font load failed; falling back to system serif/sans', e))
    .finally(() => continueRender(handle));
};

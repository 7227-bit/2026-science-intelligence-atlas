import {Config} from '@remotion/cli/config';

// Deterministic, offline rendering. See README.md "Rendering".
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
// Use a locally installed Chrome Headless Shell when provided (no network fetch at render time).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
Config.setChromiumOpenGlRenderer('swiftshader');

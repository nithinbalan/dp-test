/**
 * Colour maths for the token generator.
 *
 * Everything is authored in OKLCH because it is perceptually uniform: holding
 * lightness and chroma while changing hue keeps the *apparent* weight of a colour
 * constant. That is what makes "swap the brand hue" a one-number change instead of
 * a redesign — in HSL the same swap silently changes how dark the colour looks.
 *
 * sRGB conversion exists so we can compute WCAG contrast and fail the build when a
 * palette change breaks legibility.
 */

/** Lightness curve for a ramp. Tuned so 500 is the "solid" mid-tone. */
const STEPS = {
  0: 1.0,
  50: 0.971,
  100: 0.94,
  200: 0.888,
  300: 0.82,
  400: 0.74,
  500: 0.648,
  600: 0.57,
  700: 0.49,
  800: 0.4,
  900: 0.3,
  950: 0.213,
  1000: 0.13,
};

/**
 * Chroma taper. Very light and very dark colours cannot hold high chroma without
 * going out of sRGB gamut and turning muddy, so chroma peaks in the middle.
 */
const CHROMA_SCALE = {
  0: 0,
  50: 0.14,
  100: 0.28,
  200: 0.48,
  300: 0.68,
  400: 0.86,
  500: 1,
  600: 1,
  700: 0.94,
  800: 0.78,
  900: 0.58,
  950: 0.42,
  1000: 0.3,
};

export const RAMP_STEPS = Object.keys(STEPS)
  .map(Number)
  .sort((a, b) => a - b);

/**
 * Reduce chroma until the colour fits inside sRGB.
 *
 * Some hues simply cannot hold high chroma at a given lightness — blue runs out of
 * gamut earlier than yellow. Without this, the browser silently clips and the rendered
 * colour is not the one the token claims, which makes contrast checking a lie. Fitting
 * here means an author can pick any hue and any chroma and always get a renderable ramp.
 */
function fitToGamut(color) {
  if (!isOutOfGamut(color)) return color;
  let lo = 0;
  let hi = color.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (isOutOfGamut({ ...color, c: mid })) hi = mid;
    else lo = mid;
  }
  // FLOOR, not round: rounding to 4dp can push the value back past the boundary
  // we just searched for, which would silently reintroduce clipping.
  return { ...color, c: Math.floor(lo * 10000) / 10000, clamped: true };
}

/**
 * Build a full ramp from a single seed: `{ hue, chroma }`.
 * This is the reason a palette is one line in theme.json rather than eleven.
 */
export function buildRamp({ hue, chroma }) {
  const ramp = {};
  for (const step of RAMP_STEPS) {
    const l = STEPS[step];
    const c = Number((chroma * CHROMA_SCALE[step]).toFixed(4));
    ramp[step] = fitToGamut({ l: Number(l.toFixed(4)), c, h: hue });
  }
  return ramp;
}

/** CSS representation. */
export const toCss = ({ l, c, h }) => (c === 0 ? `oklch(${l} 0 0)` : `oklch(${l} ${c} ${h})`);

// --- hex -> OKLCH -------------------------------------------------------------
const srgbToLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/**
 * Exact hex -> OKLCH, for pinning a semantic role to a literal brand colour
 * (see `literal` handling in build-tokens.mjs) instead of a ramp step. Used
 * sparingly — most roles should stay ramp-derived so a hue rebrand still
 * reaches them.
 */
export function fromHex(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = srgbToLinear(((n >> 16) & 255) / 255);
  const g = srgbToLinear(((n >> 8) & 255) / 255);
  const b = srgbToLinear((n & 255) / 255);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: Number(L.toFixed(4)), c: Number(C.toFixed(4)), h: Number(H.toFixed(1)) };
}

// --- OKLCH -> linear sRGB ----------------------------------------------------
function oklchToLinearRgb({ l: L, c: C, h: H }) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  };
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** True when a colour falls outside sRGB and will be clipped by the browser. */
export function isOutOfGamut(color) {
  const { r, g, b } = oklchToLinearRgb(color);
  const eps = 0.001;
  return r < -eps || r > 1 + eps || g < -eps || g > 1 + eps || b < -eps || b > 1 + eps;
}

/** WCAG relative luminance. Input is already linear-light, so no de-gamma needed. */
export function luminance(color) {
  const { r, g, b } = oklchToLinearRgb(color);
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b);
}

/** WCAG 2.1 contrast ratio, 1..21. */
export function contrastRatio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Hex, for tooling that cannot read oklch (Storybook panels, design handoff). */
export function toHex(color) {
  const { r, g, b } = oklchToLinearRgb(color);
  const enc = (v) => {
    const c = clamp01(v);
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(clamp01(s) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${enc(r)}${enc(g)}${enc(b)}`;
}

// OKLCH <-> sRGB conversion, gamut mapping and WCAG contrast.
// Matrices from Björn Ottosson's OKLab reference implementation.

const GAMUT_EPSILON = 0.0004;

function oklchToLinear([l, c, h]) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const encode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decode = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function inGamut(oklch) {
  return oklchToLinear(oklch).every((v) => v >= -GAMUT_EPSILON && v <= 1 + GAMUT_EPSILON);
}

/** Largest chroma that stays inside sRGB for a given lightness and hue. */
export function maxChroma(l, h) {
  let low = 0;
  let high = 0.4;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (inGamut([l, mid, h])) low = mid;
    else high = mid;
  }
  return low;
}

export function oklchToHex(oklch) {
  return (
    '#' +
    oklchToLinear(oklch)
      .map((v) => Math.round(clamp01(encode(clamp01(v))) * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

function hexToLinear(hex) {
  return [1, 3, 5].map((i) => decode(parseInt(hex.slice(i, i + 2), 16) / 255));
}

export function hexToOklch(hex) {
  const [r, g, b] = hexToLinear(hex);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const hue = (Math.atan2(bb, a) * 180) / Math.PI;
  return [l, Math.hypot(a, bb), (hue + 360) % 360];
}

function luminance(hex) {
  const [r, g, b] = hexToLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two hex colors. */
export function contrast(hexA, hexB) {
  const [light, dark] = [luminance(hexA), luminance(hexB)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const round = (value, digits) => Number(value.toFixed(digits));

/** A color record with a rounded OKLCH triple and its sRGB hex. */
export function color(l, c, h) {
  const oklch = [round(l, 4), round(c, 4), round(((h % 360) + 360) % 360, 2)];
  return { oklch, hex: oklchToHex(oklch) };
}

export function withAlpha(record, alpha) {
  return { ...record, alpha };
}

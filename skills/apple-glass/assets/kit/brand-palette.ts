// apple-glass kit: copied verbatim from sparkmentis/lib/brand-palette.ts on 2026-10-06. The live file wins; re-copy it when it changes.
/**
 * The school's accent (tenant `primaryColor`) turned into the theme tokens
 * the design system reads (globals.css: --primary, --primary-text, --accent,
 * the moss-* scale...). Server-safe: the root layout puts the result on
 * <html> as inline custom properties, so the first paint is already in the
 * school's colour and nothing flashes.
 *
 * Any colour a school picks must still read: fills are darkened until white
 * text on them holds 4.5:1, text tones are darkened (light mode) or lifted
 * (dark mode) until they hold 4.5:1 or better on the page, so a pale yellow
 * brand still gets legible buttons and links.
 */

/** A calm teal — SparkMentis's own accent, used when a school sets none. */
export const DEFAULT_BRAND = "#13697a";

type RGB = [number, number, number];

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
/** The dark theme's card and page surfaces (globals.css .dark). */
const DARK_CARD: RGB = [24, 24, 27];
const DARK_PAGE: RGB = [9, 9, 11];

export function parseHex(input: string | null | undefined): RGB | null {
  if (!input) return null;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
}

export function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** `amount` of `to` mixed into `from` (0 = from, 1 = to), in sRGB. */
export function mix(from: RGB, to: RGB, amount: number): RGB {
  return from.map((v, i) => v + (to[i] - v) * amount) as RGB;
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Steps `color` toward `toward` until it holds `ratio` against `against`. */
function untilContrast(color: RGB, toward: RGB, against: RGB, ratio: number): RGB {
  let c = color;
  for (let step = 0; step < 40 && contrast(c, against) < ratio; step++) {
    c = mix(c, toward, 0.06);
  }
  return c;
}

export interface BrandPalette {
  /** Custom properties for <html style>, read by globals.css. */
  vars: Record<string, string>;
  /** The browser-chrome colour in light mode (`theme-color`). */
  themeColor: string;
}

const SCALE: Array<[step: number, toward: RGB, amount: number]> = [
  [50, WHITE, 0.94],
  [100, WHITE, 0.86],
  [200, WHITE, 0.72],
  [300, WHITE, 0.54],
  [400, WHITE, 0.34],
  [500, WHITE, 0.16],
  [600, WHITE, 0],
  [700, BLACK, 0.2],
  [800, BLACK, 0.4],
  [900, BLACK, 0.58],
  [950, BLACK, 0.76],
];

export function brandPalette(primaryColor: string | null | undefined): BrandPalette {
  const brand = parseHex(primaryColor) ?? (parseHex(DEFAULT_BRAND) as RGB);

  // Light: a fill white text reads on (it doubles as text on the page).
  const fill = untilContrast(brand, BLACK, WHITE, 4.5);
  const accent = mix(brand, WHITE, 0.92);
  const accentFg = untilContrast(mix(brand, BLACK, 0.55), BLACK, accent, 7);

  // Dark: a deeper fill (white on it >= 4.5:1, like SparkMentor's moss-700),
  // a lifted tone for text and icons on the dark card, and a dim tint for
  // hover surfaces that keeps white text readable.
  const fillDark = untilContrast(mix(brand, BLACK, 0.18), BLACK, WHITE, 4.5);
  const textDark = untilContrast(brand, WHITE, DARK_CARD, 6);
  const accentDark = untilContrast(mix(brand, DARK_PAGE, 0.62), BLACK, WHITE, 7);

  const vars: Record<string, string> = {
    "--brand": toHex(brand),
    "--brand-primary": toHex(fill),
    "--brand-primary-text": toHex(fill),
    "--brand-accent": toHex(accent),
    "--brand-accent-fg": toHex(accentFg),
    "--brand-hero-from": toHex(mix(fill, BLACK, 0.12)),
    "--brand-hero-to": toHex(mix(fill, BLACK, 0.34)),
    "--brand-primary-dark": toHex(fillDark),
    "--brand-primary-text-dark": toHex(textDark),
    "--brand-accent-dark": toHex(accentDark),
    "--brand-hero-from-dark": toHex(mix(fillDark, BLACK, 0.25)),
    "--brand-hero-to-dark": toHex(mix(fillDark, BLACK, 0.45)),
  };
  for (const [step, toward, amount] of SCALE) {
    vars[`--brand-${step}`] = toHex(mix(brand, toward, amount));
  }
  return { vars, themeColor: toHex(fill) };
}

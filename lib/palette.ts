/**
 * One palette, two consumers: CSS custom properties in globals.css and
 * three.js materials. Keep them in sync by hand — there is no build step
 * that reads CSS variables inside a WebGL context.
 */
export const P = {
  void: "#05070a",
  ink: "#0a0e13",
  slate: "#111820",
  paper: "#e9e5d6",
  muted: "#8b9189",
  faint: "#59605a",

  /** Primary. Structure, signal, "this is the path". */
  teal: "#5eb8ae",
  tealDeep: "#1d423f",
  /** Secondary. Cost, heat, "this is where you pay". */
  amber: "#d4a95e",
  amberDeep: "#3d3117",
  /** Tertiary. Latent space, anything learned rather than written. */
  violet: "#8b7bd8",
  violetDeep: "#241f45",
  /** Alarm. Loss, error, refusal. Use rarely. */
  rose: "#d8697a",
  roseDeep: "#3a1a22",
} as const;

export type PaletteKey = keyof typeof P;

/** Accent triad used by most diagrams, in reading order. */
export const ACCENTS = [P.teal, P.amber, P.violet] as const;

/** Mix two hex colours in sRGB. Cheap, good enough for UI chrome. */
export function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round((((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t));
  const g = Math.round((((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t));
  const bl = Math.round(((pa & 255) * (1 - t) + (pb & 255) * t));
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

/**
 * One palette, two consumers: CSS custom properties in globals.css and
 * three.js materials. Keep them in sync by hand — there is no build step
 * that reads CSS variables inside a WebGL context.
 *
 * Light by design. This is teaching material: it has to survive a
 * projector in a bright room and a printed handout, so every accent is
 * dark enough to pass contrast against paper, and the diagrams are drawn
 * like technical illustration rather than neon.
 */
export const P = {
  /** Page background. Warm, not clinical white. */
  paper: "#FBFAF6",
  /** Cards and canvases that need to sit above the page. */
  surface: "#FFFFFF",
  /** Insets: code blocks, table zebra, diagram backdrops. */
  sunken: "#F2F0E9",

  /** Body and headings. */
  ink: "#14171B",
  /** Secondary prose. */
  inkSoft: "#3B424A",
  muted: "#626B75",
  faint: "#8B939C",

  /** Primary. Structure, signal, "this is the path". */
  teal: "#0E7C74",
  tealDeep: "#0A5C56",
  tealWash: "#E2F0EE",
  /** Secondary. Cost, heat, "this is where you pay". */
  amber: "#A96411",
  amberDeep: "#7C480B",
  amberWash: "#F8ECDB",
  /** Tertiary. Latent space, anything learned rather than written. */
  violet: "#5A45C8",
  violetDeep: "#412F99",
  violetWash: "#EBE8FA",
  /** Alarm. Loss, error, refusal. Use rarely. */
  rose: "#B22F45",
  roseDeep: "#851F31",
  roseWash: "#FAE6EA",

  /** Hairlines, drawn in 3D as well as in CSS. */
  line: "#D8D5CC",
  lineStrong: "#B9B5A9",
} as const;

export type PaletteKey = keyof typeof P;

/** Accent triad used by most diagrams, in reading order. */
export const ACCENTS = [P.teal, P.amber, P.violet] as const;

/** Accent + its wash, for figures that need a fill behind a label. */
export const WASH: Record<string, string> = {
  [P.teal]: P.tealWash,
  [P.amber]: P.amberWash,
  [P.violet]: P.violetWash,
  [P.rose]: P.roseWash,
};

/** Mix two hex colours in sRGB. Cheap, good enough for UI chrome. */
export function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

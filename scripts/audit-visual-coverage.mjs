/**
 * Finds the parts of the course a reader has to get through with nothing
 * to look at.
 *
 * For every `##` section in every lesson it counts the words and checks
 * whether a figure sits inside it. A section with three hundred words and
 * no diagram is where the course goes quiet, and those are exactly the
 * places worth drawing next.
 *
 *   node scripts/audit-visual-coverage.mjs [--locale es] [--top 25]
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "content/modules";
const args = process.argv.slice(2);
const LOCALE = args.includes("--locale") ? args[args.indexOf("--locale") + 1] : "es";
const TOP = args.includes("--top") ? Number(args[args.indexOf("--top") + 1]) : 25;

/** Words that are prose, not markup. */
function words(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`|>-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1).length;
}

const dirs = (await readdir(ROOT, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const dry = [];
let totalSections = 0;
let withFigure = 0;
let totalWords = 0;
let dryWords = 0;

for (const slug of dirs) {
  let src;
  try {
    src = await readFile(join(ROOT, slug, `${LOCALE}.mdx`), "utf8");
  } catch {
    continue;
  }

  const lines = src.split("\n");
  const heads = [];
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) return;
    const m = line.match(/^##\s+(.*\S)\s*$/);
    if (m) heads.push({ i, title: m[1] });
  });

  heads.forEach((h, k) => {
    const end = k + 1 < heads.length ? heads[k + 1].i : lines.length;
    const body = lines.slice(h.i + 1, end).join("\n");
    const w = words(body);
    const hasFig = /<VisualSlot|<FigureImage/.test(body);
    totalSections++;
    totalWords += w;
    if (hasFig) withFigure++;
    else {
      dryWords += w;
      dry.push({ slug, title: h.title, words: w });
    }
  });
}

dry.sort((a, b) => b.words - a.words);

console.log(`locale ${LOCALE}`);
console.log(
  `${withFigure}/${totalSections} sections carry a figure ` +
    `(${Math.round((withFigure / totalSections) * 100)}%) · ` +
    `${dryWords} of ${totalWords} words are in sections with none\n`,
);
console.log("longest stretches with nothing to look at:");
for (const d of dry.slice(0, TOP)) {
  console.log(`  ${String(d.words).padStart(4)}w  ${d.slug.padEnd(26)} ${d.title}`);
}

// Which modules are worst overall, so a fix can be aimed at a whole lesson.
const byModule = new Map();
for (const d of dry) byModule.set(d.slug, (byModule.get(d.slug) ?? 0) + d.words);
const worst = [...byModule.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log("\nmodules with the most unillustrated prose:");
for (const [slug, w] of worst) console.log(`  ${String(w).padStart(5)}w  ${slug}`);

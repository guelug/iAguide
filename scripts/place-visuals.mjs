/**
 * Places every registered diagram into the lessons.
 *
 * Modules ship Visual.tsx, Visual2.tsx and sometimes Visual3.tsx, and all
 * of them are registered in content/modules/index.ts — but the MDX only
 * ever rendered the primary one, so the extra scenes were dead weight no
 * reader ever saw. This walks each lesson, finds the `##` sections that
 * do not already carry a figure, and spreads the module's remaining
 * visuals across them so every part of a lesson has something to look at.
 *
 * Idempotent: a slot that is already placed is left exactly where the
 * author put it.
 *
 *   node scripts/place-visuals.mjs [--dry]
 */
import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "content/modules";
const DRY = process.argv.includes("--dry");
const exists = (p) => access(p).then(() => true).catch(() => false);

const dirs = (await readdir(ROOT, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let placed = 0;
let touched = 0;
const report = [];

for (const slug of dirs) {
  // Which scenes does this module actually ship?
  const keys = [];
  if (await exists(join(ROOT, slug, "Visual.tsx"))) keys.push(null); // primary
  for (const n of [2, 3, 4, 5, 6, 7, 8]) {
    if (await exists(join(ROOT, slug, `Visual${n}.tsx`))) keys.push(`${slug}:${n}`);
  }
  if (keys.length === 0) continue;

  for (const locale of ["en", "es"]) {
    const file = join(ROOT, slug, `${locale}.mdx`);
    if (!(await exists(file))) continue;
    const src = await readFile(file, "utf8");
    const lines = src.split("\n");

    // Sections, and whether each already contains a figure.
    const heads = [];
    let fenced = false;
    lines.forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (fenced) return;
      if (/^##\s+\S/.test(line)) heads.push({ line: i, hasSlot: false });
    });
    if (heads.length === 0) continue;

    const already = new Set();
    lines.forEach((line, i) => {
      const m = line.match(/<VisualSlot([^>]*)\/>/);
      if (!m) return;
      const id = m[1].match(/id="([^"]+)"/);
      already.add(id ? id[1] : "primary");
      for (let h = heads.length - 1; h >= 0; h--) {
        if (heads[h].line < i) {
          heads[h].hasSlot = true;
          break;
        }
      }
    });

    const missing = keys.filter((k) => !already.has(k ?? "primary"));
    if (missing.length === 0) continue;

    // Spread the missing scenes over the sections that have none, in
    // order, biased away from the very first section when the primary
    // figure already opens the lesson.
    const free = heads.map((h, i) => ({ ...h, i })).filter((h) => !h.hasSlot);

    // One figure per free section, spread evenly. When a module ships
    // more scenes than the lesson has spare sections, the leftovers go to
    // the end rather than being dropped — a registered scene that no page
    // renders is the bug this script exists to fix.
    const taken = new Set();
    const inserts = [];
    missing.forEach((key, n) => {
      const ideal = Math.min(
        free.length - 1,
        Math.floor((n * free.length) / missing.length),
      );
      let idx = -1;
      for (let step = 0; step < free.length; step++) {
        const fwd = ideal + step;
        const back = ideal - step;
        if (fwd < free.length && !taken.has(fwd)) {
          idx = fwd;
          break;
        }
        if (back >= 0 && !taken.has(back)) {
          idx = back;
          break;
        }
      }
      if (idx === -1) {
        inserts.push({ line: lines.length - 1, key });
        return;
      }
      taken.add(idx);
      inserts.push({ line: free[idx].line, key });
    });

    inserts.sort((a, b) => b.line - a.line); // bottom-up so indices stay valid

    for (const ins of inserts) {
      const tag =
        ins.key === null ? "<VisualSlot />" : `<VisualSlot id="${ins.key}" />`;
      // Drop it just under the heading, with blank lines around it.
      lines.splice(ins.line + 1, 0, "", tag);
      placed++;
    }

    if (!DRY) await writeFile(file, lines.join("\n"));
    touched++;
    report.push(`${slug}/${locale}: +${inserts.length}`);
  }
}

console.log(report.slice(0, 12).join("\n"));
console.log(`\n${placed} slots placed across ${touched} lesson files${DRY ? " (dry run)" : ""}`);

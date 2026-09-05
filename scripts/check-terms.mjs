/**
 * Every <Term id="..."> must resolve to a glossary entry.
 *
 * Term renders a link to /glossary#<id>. When the id does not exist the
 * link still looks clickable — dotted underline and all — and takes the
 * reader to the glossary with no matching anchor, so the page just sits
 * there. Nothing errors, nothing logs, and the lesson quietly promises
 * a definition it does not have.
 *
 * Also reports glossary entries no lesson links to, which is not a
 * failure but is usually a sign a term was renamed on one side only.
 *
 *   node scripts/check-terms.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "content/modules";
const GLOSSARY = "content/glossary.ts";

const glossary = await readFile(GLOSSARY, "utf8");
const defined = new Set([...glossary.matchAll(/\{\s*id:\s*"([^"]+)"/g)].map((m) => m[1]));

/** id -> the lessons that link to it */
const used = new Map();

const dirs = (await readdir(ROOT, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const slug of dirs) {
  for (const lang of ["es.mdx", "en.mdx"]) {
    let text;
    try {
      text = await readFile(join(ROOT, slug, lang), "utf8");
    } catch {
      continue;
    }
    for (const m of text.matchAll(/<Term\s+id="([^"]+)"/g)) {
      const where = `${slug}/${lang}`;
      const at = used.get(m[1]) ?? new Set();
      at.add(where);
      used.set(m[1], at);
    }
  }
}

const missing = [...used.keys()].filter((id) => !defined.has(id)).sort();
const orphan = [...defined].filter((id) => !used.has(id)).sort();

console.log(`${defined.size} glossary entries · ${used.size} distinct terms linked`);

if (orphan.length) {
  console.log(`\n${orphan.length} defined but never linked (not a failure):`);
  console.log("  " + orphan.join(", "));
}

if (missing.length) {
  console.error(`\n${missing.length} terms link to a definition that does not exist:`);
  for (const id of missing) {
    console.error(`  ${id} — ${[...used.get(id)].join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nevery linked term resolves");
}

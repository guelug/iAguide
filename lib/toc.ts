import GithubSlugger from "github-slugger";
import type { TocItem } from "@/components/lesson/Toc";

/** Strip the markdown that never survives into a heading's text content. */
function clean(raw: string) {
  return raw
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

const HEADING = /^(#{2,3})\s+(.*\S)\s*$/;
const FENCE = /^\s*(```|~~~)/;

/**
 * Reads the same headings rehype-slug will see, and slugs them the same
 * way, so the sidebar anchors land. Fenced code is skipped: a comment
 * that starts with ## is not a section.
 */
export function extractToc(source: string): TocItem[] {
  const slugger = new GithubSlugger();
  const out: TocItem[] = [];
  let fenced = false;

  for (const line of source.split("\n")) {
    if (FENCE.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const m = line.match(HEADING);
    if (!m) continue;
    const text = clean(m[2]);
    if (!text) continue;
    out.push({
      id: slugger.slug(text),
      text,
      depth: m[1].length as 2 | 3,
    });
  }
  return out;
}

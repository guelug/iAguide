import { extractToc } from "./toc";

export type CatalogFigure = { id: string; title: string; anchor: string };
export type CatalogModule = {
  slug: string; title: string; summary: string; track: string; trackTitle: string;
  color: string; order: number; figures: CatalogFigure[];
};

const STUDY_TITLES: Record<string, string> = {
  "tokenization": "Banco tipográfico · fusiones y tokens",
  "image-models": "Banco óptico de difusión",
  "memory-hardware": "GPU desmontable y presupuesto de memoria",
  "training": "Descenso por gradiente",
  "attention:4": "Caché KV · prefill y decode",
};

/** Catalog only diagrams actually placed in the Spanish lesson, in reading order. */
export function catalogFigures(source: string, slug: string, registered: Set<string>): CatalogFigure[] {
  const clean = source.replace(/^\s*(```|~~~)[\s\S]*?^\s*\1[^\n]*$/gm, "");
  const toc = extractToc(clean);
  const result: CatalogFigure[] = [];
  let heading = -1;
  const events = /^(#{2,3})\s+.+$|<VisualSlot\b[^>]*\/>/gm;
  for (const match of clean.matchAll(events)) {
    if (match[1]) { heading++; continue; }
    const id = match[0].match(/\bid=["']([^"']+)["']/)?.[1] ?? slug;
    if (!registered.has(id) || result.some(item => item.id === id)) continue;
    const caption = match[0].match(/\bcaption=["']([^"']+)["']/)?.[1];
    result.push({ id, title: STUDY_TITLES[id] ?? (caption && caption.length < 100 && !caption.startsWith("Tres vistas") ? caption : toc[heading]?.text ?? "Vista general"), anchor: toc[heading]?.id ?? "" });
  }
  if (registered.has(slug) && !result.some(item => item.id === slug)) result.unshift({ id: slug, title: "Vista general", anchor: "" });
  return result;
}

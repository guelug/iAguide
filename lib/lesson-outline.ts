import { extractToc } from "@/lib/toc";

export type LessonSection = { id: string; title: string; figures: number };

/** Uses the same slugger as the lesson's table of contents. */
export function lessonOutline(source: string): LessonSection[] {
  const headings = extractToc(source).filter((item) => item.depth === 2);
  const bodies = source.replace(/^\s*(```|~~~)[\s\S]*?^\s*\1[^\n]*$/gm, "").split(/^##\s+.+$/m).slice(1);
  return headings.map((heading, index) => ({
    id: heading.id,
    title: heading.text,
    figures: (bodies[index]?.match(/<(?:VisualSlot|FigureImage|ConceptLab)\b/g) ?? []).length,
  }));
}

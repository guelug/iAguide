import { Callout } from "@/components/mdx/Callout";
import { Compare, Side } from "@/components/mdx/Compare";
import { Formula } from "@/components/mdx/Formula";
import { FigureImage } from "@/components/mdx/FigureImage";
import { FormulaVideo } from "@/components/mdx/FormulaVideo";
import { Myth } from "@/components/mdx/Myth";
import { Path, Easy, Hard } from "@/components/mdx/Path";
import { Quiz } from "@/components/mdx/Quiz";
import { Step, Steps } from "@/components/mdx/Steps";
import { Term } from "@/components/mdx/Term";
import { TryThis } from "@/components/mdx/TryThis";
import { VisualSlot } from "@/components/mdx/VisualSlot";

export const mdxComponents = {
  Callout,
  Compare,
  Side,
  FigureImage,
  Formula,
  FormulaVideo,
  Myth,
  Path,
  Easy,
  Hard,
  Quiz,
  Steps,
  Step,
  Term,
  TryThis,
  VisualSlot,
};

/** A module folder is its slug. Adding a module means dropping a folder. */
export function lessonPath(slug: string, locale: string) {
  return `${process.cwd()}/content/modules/${slug}/${locale}.mdx`;
}

export function quizPath(slug: string, locale: string) {
  return `${process.cwd()}/content/modules/${slug}/quiz.${locale}.mdx`;
}

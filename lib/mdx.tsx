import { Callout } from "@/components/mdx/Callout";
import { Myth } from "@/components/mdx/Myth";
import { Term } from "@/components/mdx/Term";
import { TryThis } from "@/components/mdx/TryThis";
import { VisualSlot } from "@/components/mdx/VisualSlot";

export const mdxComponents = {
  Callout,
  TryThis,
  Myth,
  Term,
  VisualSlot,
};

export function lessonPath(folder: string, locale: string) {
  return `${process.cwd()}/content/modules/${folder}/${locale}.mdx`;
}

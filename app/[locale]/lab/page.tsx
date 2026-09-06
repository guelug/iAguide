import fs from "node:fs/promises";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MODULES, VISUALS, VISUALS_EXTRA } from "@/content/modules";
import { TRACK_BY_ID } from "@/content/tracks";
import { lessonPath } from "@/lib/mdx";
import { catalogFigures, type CatalogModule } from "@/lib/visual-catalog";
import { VisualLaboratory } from "@/components/lab/VisualLaboratory";

export const metadata = { title: "Laboratorio visual", description: "Explora las piezas, procesos y diagramas interactivos de iAguide en español." };
export default async function LabPage({ params, searchParams }: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{scene?: string}>;
}) {
  const { locale } = await params;
  if (locale !== "es") redirect("/es/lab");
  setRequestLocale("es");
  const { scene } = await searchParams;
  const registered = new Set([...Object.keys(VISUALS), ...Object.keys(VISUALS_EXTRA)]);
  const catalog: CatalogModule[] = await Promise.all(MODULES.map(async m => ({
    slug: m.slug, title: m.title.es, summary: m.summary.es, order: m.order,
    track: m.track, trackTitle: TRACK_BY_ID[m.track].name.es, color: TRACK_BY_ID[m.track].color,
    figures: catalogFigures(await fs.readFile(lessonPath(m.slug, "es"), "utf8"), m.slug, registered),
  })));
  return <VisualLaboratory catalog={catalog.filter(m => m.figures.length)} initialScene={scene} />;
}

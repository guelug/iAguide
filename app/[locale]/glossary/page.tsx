import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GlossaryList, type GlossaryEntry } from "@/components/glossary/GlossaryList";
import { GLOSSARY } from "@/content/glossary";
import { getModule } from "@/content/modules";
import { TRACK_BY_ID } from "@/content/tracks";
import { P } from "@/lib/palette";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("glossary");
  return { title: t("title"), description: t("lede") };
}

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("glossary");
  const loc = locale as Locale;

  const entries: GlossaryEntry[] = GLOSSARY.map((g) => {
    const mod = getModule(g.module);
    return {
      id: g.id,
      term: g.term[loc],
      def: g.def[loc],
      moduleSlug: mod?.slug ?? g.module,
      moduleTitle: mod?.title[loc] ?? g.module,
      color: mod ? TRACK_BY_ID[mod.track].color : P.teal,
    };
  }).sort((a, b) => a.term.localeCompare(b.term, loc));

  return (
    <div className="shell py-12 md:py-16">
      <p className="kicker">iAguide</p>
      <h1 className="display-sm mt-4 text-ink">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("lede")}</p>
      <GlossaryList
        entries={entries}
        strings={{
          search: t("search"),
          from: t("from"),
          empty: t("empty"),
          count: t("count"),
        }}
      />
    </div>
  );
}

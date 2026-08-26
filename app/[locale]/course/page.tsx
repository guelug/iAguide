import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseExplorer, type CourseCard } from "@/components/course/CourseExplorer";
import { MODULES, TOTAL_MINUTES, getModule } from "@/content/modules";
import { TRACKS, TRACK_BY_ID, type TrackId } from "@/content/tracks";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("course");
  return { title: t("title"), description: t("lede") };
}

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ track?: string }>;
}) {
  const { locale } = await params;
  const { track } = await searchParams;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("course");
  const loc = locale as Locale;

  const cards: CourseCard[] = MODULES.map((m) => ({
    slug: m.slug,
    order: m.order,
    title: m.title[loc],
    summary: m.summary[loc],
    track: m.track,
    color: TRACK_BY_ID[m.track].color,
    status: m.status,
    prereqs: m.prereqs,
    prereqTitles: m.prereqs.map((id) => getModule(id)?.title[loc] ?? id),
    durationLabel: t("min", { n: m.durationMin }),
    tags: m.tags,
  }));

  const valid = TRACKS.some((x) => x.id === track) ? (track as TrackId) : null;

  return (
    <div className="shell py-12 md:py-16">
      <p className="kicker">iAguide</p>
      <h1 className="display-sm mt-4 text-ink">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("lede")}</p>
      <p className="mt-3 font-mono text-[0.6rem] tracking-[0.16em] uppercase text-faint">
        {t("modules", { n: MODULES.length })} · {t("totalTime", { n: TOTAL_MINUTES })}
      </p>

      <CourseExplorer
        cards={cards}
        initialTrack={valid}
        tracks={TRACKS.map((tr) => ({
          id: tr.id,
          label: tr.name[loc],
          numeral: tr.numeral,
          color: tr.color,
        }))}
        strings={{
          all: t("all"),
          hint: t("hint"),
          wip: t("wip"),
          prereq: t("prereq"),
          empty: t("empty"),
        }}
      />
    </div>
  );
}

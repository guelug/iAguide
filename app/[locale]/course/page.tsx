import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CourseConstellation } from "@/components/visuals/CourseConstellation";
import { MODULES, getModule, localize } from "@/content/modules";
import type { Locale } from "@/i18n/routing";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("course");
  const loc = locale as Locale;
  const stars = MODULES.map((m) => ({
    slug: m.slug,
    order: m.order,
    title: m.title[loc],
    status: m.status,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <p className="font-mono text-[0.7rem] tracking-[0.22em] uppercase text-teal">
        iAguide
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-muted">{t("lede")}</p>
      <div className="mt-10">
        <CourseConstellation stars={stars} />
      </div>
      <ol className="mt-12 grid gap-3 md:grid-cols-2">
        {MODULES.map((m) => {
          const L = localize(m, loc);
          const wip = m.status === "wip";
          const inner = (
            <article
              className={`rounded-xl border border-line px-4 py-4 ${wip ? "opacity-60" : "hover:border-teal/60"}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[0.7rem] tracking-[0.18em] uppercase text-faint">
                  {String(m.order).padStart(2, "0")}
                </p>
                <p className="font-mono text-[0.7rem] uppercase text-faint">
                  {wip ? t("wip") : t("min", { n: m.durationMin })}
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl text-paper">{L.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{L.summary}</p>
              {m.prereqs.length > 0 ? (
                <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-wide text-faint">
                  {t("prereq")}:{" "}
                  {m.prereqs
                    .map((id) => getModule(id)?.title[loc] ?? id)
                    .join(" · ")}
                </p>
              ) : null}
            </article>
          );
          return (
            <li key={m.slug}>
              {wip ? inner : <Link href={`/m/${m.slug}`} className="block text-inherit no-underline">{inner}</Link>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

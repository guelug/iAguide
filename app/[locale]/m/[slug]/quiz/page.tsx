import fs from "node:fs/promises";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import remarkGfm from "remark-gfm";
import { MODULES, getModule, getNext, localize } from "@/content/modules";
import { TRACK_BY_ID } from "@/content/tracks";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { mdxComponents, quizPath } from "@/lib/mdx";

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const m of MODULES) {
      try {
        await fs.access(quizPath(m.slug, locale));
        params.push({ locale, slug: m.slug });
      } catch {
        /* no quiz for this locale */
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const mod = getModule(slug);
  if (!mod) return {};
  const loc = locale as Locale;
  const t = await getTranslations({ locale: loc, namespace: "lesson" });
  return {
    title: `${t("quizTitle")} · ${mod.title[loc]}`,
    description: t("quizLede"),
  };
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const mod = getModule(slug);
  if (!mod) notFound();

  const loc = locale as Locale;
  let source = "";
  try {
    source = await fs.readFile(quizPath(mod.slug, loc), "utf8");
  } catch {
    notFound();
  }

  const t = await getTranslations("lesson");
  const L = localize(mod, loc);
  const next = getNext(slug);
  const track = TRACK_BY_ID[mod.track];

  return (
    <div className="shell py-12 md:py-16">
      <header className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            className="font-mono text-[0.62rem] tracking-[0.2em] uppercase"
            style={{ color: track.color }}
          >
            {track.numeral} · {track.name[loc]}
          </span>
          <span className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-faint">
            {t("quizKicker")}
          </span>
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.2rem,5.5vw,3.6rem)] leading-[1.03] tracking-[-0.03em] text-ink">
          {t("quizTitle")}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">{L.title}</p>
        <p className="mt-3 max-w-2xl text-ink-soft">{t("quizLede")}</p>
        <p className="mt-6">
          <Link href={`/m/${mod.slug}`} className="font-mono text-[0.68rem] uppercase tracking-wider text-muted">
            ← {t("backToLesson")}
          </Link>
        </p>
      </header>

      <article className="prose-lesson mt-12 min-w-0 max-w-3xl">
        <MDXRemote
          source={source}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
            },
          }}
        />
      </article>

      <nav className="mt-20 grid max-w-3xl gap-4 border-t border-line pt-8 md:grid-cols-2">
        <Link
          href={`/m/${mod.slug}`}
          className="group rounded-xl border border-line px-5 py-4 no-underline transition-colors hover:border-teal/50"
        >
          <span className="block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-faint">
            ← {t("backToLesson")}
          </span>
          <span className="mt-1.5 block font-display text-xl text-ink">{L.title}</span>
        </Link>
        {next ? (
          <Link
            href={`/m/${next.slug}`}
            className="group rounded-xl border border-line px-5 py-4 text-right no-underline transition-colors hover:border-teal/50"
          >
            <span className="block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-faint">
              {t("next")} →
            </span>
            <span className="mt-1.5 block font-display text-xl text-ink">{next.title[loc]}</span>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

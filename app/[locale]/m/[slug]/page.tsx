import fs from "node:fs/promises";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { ReadingProgress } from "@/components/lesson/ReadingProgress";
import { Toc } from "@/components/lesson/Toc";
import { GLOSSARY } from "@/content/glossary";
import { MODULES, getModule, getNext, getPrev, localize } from "@/content/modules";
import { TRACK_BY_ID } from "@/content/tracks";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { lessonPath, mdxComponents } from "@/lib/mdx";
import { extractToc } from "@/lib/toc";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    MODULES.map((m) => ({ locale, slug: m.slug })),
  );
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
  return {
    title: mod.title[loc],
    description: mod.summary[loc],
  };
}

export default async function LessonPage({
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
    source = await fs.readFile(lessonPath(mod.slug, loc), "utf8");
  } catch {
    source = "";
  }

  const t = await getTranslations("lesson");
  const tc = await getTranslations("course");
  const L = localize(mod, loc);
  const prev = getPrev(slug);
  const next = getNext(slug);
  const track = TRACK_BY_ID[mod.track];
  const toc = extractToc(source);
  const terms = GLOSSARY.filter((g) => g.module === mod.slug);
  const empty = source.trim().length === 0;

  return (
    <>
      <ReadingProgress />
      <div className="shell py-12 md:py-16">
        {/* ------------------------------------------------------- header */}
        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span
              className="font-mono text-[0.62rem] tracking-[0.2em] uppercase"
              style={{ color: track.color }}
            >
              {track.numeral} · {track.name[loc]}
            </span>
            <span className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-faint">
              {String(mod.order).padStart(2, "0")} · {t("minutes", { n: mod.durationMin })}
            </span>
            {mod.status === "wip" ? (
              <span className="chip border-amber/40 text-amber">{tc("wip")}</span>
            ) : null}
          </div>
          <h1 className="mt-5 font-display text-[clamp(2.2rem,5.5vw,3.6rem)] leading-[1.03] tracking-[-0.03em] text-paper">
            {L.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-paper/70">{L.summary}</p>
          {mod.prereqs.length ? (
            <p className="mt-6 font-mono text-[0.62rem] tracking-[0.14em] uppercase text-faint">
              {t("prereqs")}:{" "}
              {mod.prereqs.map((id, i) => {
                const p = getModule(id);
                return (
                  <span key={id}>
                    {i > 0 ? " · " : ""}
                    {p ? (
                      <Link href={`/m/${p.slug}`} className="text-muted">
                        {p.title[loc]}
                      </Link>
                    ) : (
                      id
                    )}
                  </span>
                );
              })}
            </p>
          ) : null}
        </header>

        <div className="mt-14 gap-14 lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] xl:gap-20">
          {/* --------------------------------------------------- article */}
          <article className="prose-lesson min-w-0">
            {empty ? (
              <div className="rounded-2xl border border-amber/30 bg-amber-dim/30 px-5 py-5">
                <p className="font-mono text-[0.62rem] tracking-[0.18em] uppercase text-amber">
                  {t("wipTitle")}
                </p>
                <p className="mt-2 text-paper/80">{t("wipBody")}</p>
              </div>
            ) : (
              <MDXRemote
                source={source}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm, remarkMath],
                    rehypePlugins: [rehypeSlug, rehypeKatex],
                  },
                }}
              />
            )}
          </article>

          {/* ------------------------------------------------------- rail */}
          <aside className="mt-14 lg:mt-0">
            <div className="lg:sticky lg:top-8">
              <Toc items={toc} label={t("contents")} />
              {terms.length ? (
                <div className="mt-10">
                  <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-faint">
                    {t("keyTerms")}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {terms.map((term) => (
                      <li key={term.id}>
                        <Link
                          href={`/glossary#${term.id}`}
                          className="chip no-underline hover:border-teal/50 hover:text-paper"
                        >
                          {term.term[loc]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        {/* ---------------------------------------------------------- nav */}
        <nav className="mt-20 grid gap-4 border-t border-line pt-8 md:grid-cols-2">
          {prev ? (
            <Link
              href={`/m/${prev.slug}`}
              className="group rounded-xl border border-line px-5 py-4 no-underline transition-colors hover:border-teal/50"
            >
              <span className="block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-faint">
                ← {t("prev")}
              </span>
              <span className="mt-1.5 block font-display text-xl text-paper">
                {prev.title[loc]}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/m/${next.slug}`}
              className="group rounded-xl border border-line px-5 py-4 text-right no-underline transition-colors hover:border-teal/50 md:col-start-2"
            >
              <span className="block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-faint">
                {t("next")} →
              </span>
              <span className="mt-1.5 block font-display text-xl text-paper">
                {next.title[loc]}
              </span>
            </Link>
          ) : null}
        </nav>
      </div>
    </>
  );
}

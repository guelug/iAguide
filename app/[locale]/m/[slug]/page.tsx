import fs from "node:fs/promises";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Link } from "@/i18n/navigation";
import {
  MODULES,
  getModule,
  getNext,
  getPrev,
  localize,
} from "@/content/modules";
import { mdxComponents, lessonPath } from "@/lib/mdx";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    MODULES.map((m) => ({ locale, slug: m.slug })),
  );
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
  const file = lessonPath(mod.folder, loc);
  let source: string;
  try {
    source = await fs.readFile(file, "utf8");
  } catch {
    notFound();
  }

  const t = await getTranslations("lesson");
  const L = localize(mod, loc);
  const prev = getPrev(slug);
  const next = getNext(slug);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12">
      <p className="font-mono text-[0.7rem] tracking-[0.22em] uppercase text-teal">
        {String(mod.order).padStart(2, "0")} · {t("minutes", { n: mod.durationMin })}
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{L.title}</h1>
      <p className="mt-4 text-lg text-muted">{L.summary}</p>
      <div className="prose-lesson mt-10">
        <MDXRemote
          source={source}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm, remarkMath],
              rehypePlugins: [rehypeKatex],
            },
          }}
        />
      </div>
      <nav className="mt-16 flex items-stretch justify-between gap-4 border-t border-line pt-8">
        {prev ? (
          <Link href={`/m/${prev.slug}`} className="max-w-[45%] no-underline">
            <span className="block font-mono text-[0.65rem] uppercase tracking-widest text-faint">
              {t("prev")}
            </span>
            <span className="mt-1 block text-paper">{prev.title[loc]}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/m/${next.slug}`} className="max-w-[45%] text-right no-underline">
            <span className="block font-mono text-[0.65rem] uppercase tracking-widest text-faint">
              {t("next")}
            </span>
            <span className="mt-1 block text-paper">{next.title[loc]}</span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

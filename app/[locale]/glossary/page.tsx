import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GLOSSARY, localizeTerm } from "@/content/glossary";
import { getModule } from "@/content/modules";
import type { Locale } from "@/i18n/routing";

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("glossary");
  const loc = locale as Locale;
  const terms = [...GLOSSARY]
    .map((g) => localizeTerm(g, loc))
    .sort((a, b) => a.term.localeCompare(b.term, loc));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <h1 className="font-display text-4xl md:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-muted">{t("lede")}</p>
      <dl className="mt-10 space-y-8">
        {terms.map((term) => {
          const mod = getModule(term.module);
          return (
            <div key={term.id} id={term.id} className="scroll-mt-24">
              <dt className="font-display text-2xl text-paper">{term.term}</dt>
              <dd className="mt-2 text-paper/80">{term.def}</dd>
              {mod ? (
                <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-faint">
                  {t("from")}{" "}
                  <Link href={`/m/${mod.slug}`}>{mod.title[loc]}</Link>
                </p>
              ) : null}
            </div>
          );
        })}
      </dl>
    </div>
  );
}

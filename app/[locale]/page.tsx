import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SilkField } from "@/components/visuals/SilkField";
import { MODULES, localize } from "@/content/modules";
import type { Locale } from "@/i18n/routing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("home");
  const loc = locale as Locale;
  const outcomes = t.raw("outcomes") as string[];
  const first = MODULES[0];

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="relative min-h-[88vh] overflow-hidden">
        <SilkField className="absolute inset-0" />
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28">
          <p className="font-mono text-[0.7rem] tracking-[0.28em] uppercase text-teal">
            {t("kicker")}
          </p>
          <h1 className="mt-4 font-display text-6xl tracking-tight text-paper md:text-8xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/80 md:text-xl">
            {t("promise")}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/course"
              className="rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-void no-underline hover:bg-amber"
            >
              {t("cta")}
            </Link>
            {first ? (
              <Link
                href={`/m/${first.slug}`}
                className="rounded-full border border-line px-5 py-2.5 text-sm text-paper no-underline hover:border-teal"
              >
                {localize(first, loc).title}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <h2 className="font-mono text-[0.7rem] tracking-[0.22em] uppercase text-muted">
          {t("ctaSecondary")}
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {outcomes.map((item) => (
            <li
              key={item}
              className="border-l border-teal/50 pl-4 text-paper/85"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

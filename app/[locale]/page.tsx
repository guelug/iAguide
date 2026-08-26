import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayersSection } from "@/components/home/LayersSection";
import { Reveal } from "@/components/ui/Reveal";
import { HeroStack } from "@/components/visuals/HeroStack";
import { MODULES, READY, TOTAL_MINUTES, modulesByTrack } from "@/content/modules";
import { TRACKS } from "@/content/tracks";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const REPO = "https://github.com/guelug/iAguide";

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

  const stats = [
    { n: String(MODULES.length), label: t("stats.modules") },
    { n: String(TOTAL_MINUTES), label: t("stats.minutes") },
    { n: "2", label: t("stats.languages") },
    { n: "0", label: t("stats.accounts") },
  ];

  return (
    <div className="relative flex flex-1 flex-col">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative min-h-[92svh] overflow-x-clip overflow-y-visible">
        <HeroStack className="pointer-events-none absolute inset-0 max-w-full overflow-x-clip touch-pan-y" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--paper)_1%,transparent_38%),linear-gradient(to_right,var(--paper)_8%,color-mix(in_srgb,var(--paper)_72%,transparent)_38%,transparent_66%)]"
        />
        <div className="relative z-10 flex min-h-[92svh] flex-col justify-end">
          <div className="shell pb-14 pt-32">
            <p className="kicker">{t("kicker")}</p>
            <h1 className="display mt-5 text-ink rise">iAguide</h1>
            <p
              className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-soft md:text-xl rise"
              style={{ animationDelay: "120ms" }}
            >
              {t("promise", { count: MODULES.length })}
            </p>
            <div
              className="mt-10 flex flex-wrap items-center gap-3 rise"
              style={{ animationDelay: "220ms" }}
            >
              <Link
                href="/course"
                className="rounded-full bg-teal px-6 py-3 text-sm font-medium text-paper no-underline transition-colors hover:bg-teal-deep"
              >
                {t("cta")}
              </Link>
              <Link
                href={`/m/${first.slug}`}
                className="rounded-full border border-line-strong px-6 py-3 text-sm text-ink no-underline transition-colors hover:border-teal hover:text-teal"
              >
                {t("ctaAlt")}
              </Link>
            </div>
          </div>
          <div className="border-t border-line">
            <dl className="shell grid grid-cols-2 gap-y-6 py-7 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl text-ink md:text-4xl">{s.n}</dt>
                  <dd className="mt-1 font-mono text-[0.6rem] tracking-[0.16em] uppercase text-muted">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ outcomes */}
      <section className="shell py-20 md:py-28">
        <Reveal>
          <h2 className="display-sm max-w-2xl text-ink">{t("outcomesTitle")}</h2>
        </Reveal>
        <ul className="mt-10 grid gap-x-10 gap-y-5 md:grid-cols-2">
          {outcomes.map((item, i) => (
            <Reveal as="li" key={item} delay={i * 45}>
              <div className="flex gap-4 border-t border-line pt-4">
                <span className="font-mono text-[0.62rem] leading-6 tracking-[0.16em] text-teal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[1.02rem] leading-relaxed text-ink-soft">{item}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------- layers */}
      <section id="layers" className="shell border-t border-line py-20 md:py-28">
        <Reveal>
          <p className="kicker">{t("layersTitle")}</p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {t("layersLede")}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-12">
            <LayersSection />
          </div>
        </Reveal>
      </section>

      {/* --------------------------------------------------------- tracks */}
      <section className="shell border-t border-line py-20 md:py-28">
        <Reveal>
          <h2 className="display-sm text-ink">{t("tracksTitle")}</h2>
          <p className="mt-4 max-w-2xl text-ink-soft">{t("tracksLede")}</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {TRACKS.map((track, i) => {
            const mods = modulesByTrack(track.id);
            return (
              <Reveal key={track.id} delay={i * 70}>
                <Link
                  href={`/course?track=${track.id}`}
                  className="group block h-full rounded-2xl border border-line bg-surface p-6 no-underline transition-colors hover:border-teal/50"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      className="font-display text-3xl leading-none"
                      style={{ color: track.color }}
                    >
                      {track.numeral}
                    </span>
                    <span className="font-mono text-[0.6rem] tracking-[0.16em] uppercase text-faint">
                      {mods.length} · {mods.reduce((n, m) => n + m.durationMin, 0)} min
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl text-ink">
                    {track.name[loc]}
                  </h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                    {track.blurb[loc]}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5">
                    {mods.slice(0, 5).map((m) => (
                      <li
                        key={m.slug}
                        className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted"
                      >
                        {m.title[loc]}
                      </li>
                    ))}
                    {mods.length > 5 ? (
                      <li className="font-mono text-[0.58rem] text-faint">
                        +{mods.length - 5}
                      </li>
                    ) : null}
                  </ul>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------- closing */}
      <section className="shell border-t border-line py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal>
            <h2 className="display-sm text-ink">{t("startTitle")}</h2>
            <p className="mt-4 max-w-md text-ink-soft">{t("startLede")}</p>
            <Link
              href="/course"
              className="mt-7 inline-block rounded-full bg-teal px-6 py-3 text-sm font-medium text-paper no-underline transition-colors hover:bg-teal-deep"
            >
              {t("cta")}
            </Link>
            <p className="mt-4 font-mono text-[0.6rem] tracking-[0.14em] uppercase text-faint">
              {READY.length}/{MODULES.length} · {t("stats.modules")}
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display-sm text-ink">{t("openTitle")}</h2>
            <p className="mt-4 max-w-md text-ink-soft">{t("openLede")}</p>
            <a
              href={REPO}
              className="mt-7 inline-block rounded-full border border-line-strong px-6 py-3 text-sm text-ink no-underline transition-colors hover:border-teal hover:text-teal"
            >
              {t("openCta")}
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

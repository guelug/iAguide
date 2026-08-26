import { getTranslations } from "next-intl/server";
import { MODULES, READY } from "@/content/modules";
import { Link } from "@/i18n/navigation";

const REPO = "https://github.com/guelug/iAguide";

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  return (
    <footer className="relative z-10 mt-auto border-t border-line/80">
      <div className="shell grid gap-8 py-10 md:grid-cols-[1.3fr_1fr] md:gap-16">
        <div>
          <p className="font-display text-2xl text-paper">iAguide</p>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-faint">
            {t("stale")}
          </p>
          <p className="mt-4 font-mono text-[0.6rem] tracking-[0.14em] uppercase text-faint">
            {t("license")} · 2026 · {READY.length}/{MODULES.length}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm md:justify-end">
          <Link href="/course" className="text-muted no-underline hover:text-paper">
            {nav("course")}
          </Link>
          <Link href="/glossary" className="text-muted no-underline hover:text-paper">
            {nav("glossary")}
          </Link>
          <Link href="/about" className="text-muted no-underline hover:text-paper">
            {nav("about")}
          </Link>
          <a href={REPO} className="text-muted no-underline hover:text-paper">
            {t("repo")}
          </a>
        </nav>
      </div>
    </footer>
  );
}

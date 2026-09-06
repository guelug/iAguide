import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Header() {
  const t = await getTranslations("nav");
  const es = await getLocale() === "es";
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <a href="#content" className="skip-link">
        {t("skip")}
      </a>
      <div className="shell flex min-w-0 items-center justify-between gap-3 py-3.5 sm:gap-6">
        <Link
          href="/"
          className="group flex items-baseline gap-2 no-underline"
          aria-label="iAguide"
        >
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-teal transition-colors group-hover:bg-teal-deep"
          />
          <span className="font-display text-xl tracking-tight text-ink transition-colors group-hover:text-teal">
            iAguide
          </span>
        </Link>
        <nav className="flex min-w-0 shrink items-center gap-3 text-sm text-muted sm:gap-5 md:gap-7">
          <Link href="/course" className="text-muted no-underline transition-colors hover:text-ink">
            {t("course")}
          </Link>
          {es && <Link href="/lab" className="text-teal no-underline transition-colors hover:text-ink">Laboratorio</Link>}
          <Link
            href="/glossary"
            className="hidden text-muted no-underline transition-colors hover:text-ink sm:inline"
          >
            {t("glossary")}
          </Link>
          <Link href="/about" className={`${es ? "hidden sm:inline" : ""} text-muted no-underline transition-colors hover:text-ink`}>
            {t("about")}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}

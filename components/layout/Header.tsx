import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Header() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-void/70 backdrop-blur-md">
      <a href="#content" className="skip-link">
        {t("skip")}
      </a>
      <div className="shell flex items-center justify-between gap-6 py-3.5">
        <Link
          href="/"
          className="group flex items-baseline gap-2 no-underline"
          aria-label="iAguide"
        >
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-teal transition-colors group-hover:bg-amber"
          />
          <span className="font-display text-xl tracking-tight text-paper transition-colors group-hover:text-teal">
            iAguide
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted md:gap-7">
          <Link href="/course" className="text-muted no-underline transition-colors hover:text-paper">
            {t("course")}
          </Link>
          <Link
            href="/glossary"
            className="hidden text-muted no-underline transition-colors hover:text-paper sm:inline"
          >
            {t("glossary")}
          </Link>
          <Link href="/about" className="text-muted no-underline transition-colors hover:text-paper">
            {t("about")}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Header() {
  const t = await getTranslations("nav");
  return (
    <header className="relative z-20 border-b border-line/80">
      <a href="#content" className="skip-link">
        {t("skip")}
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-paper no-underline hover:text-teal">
          iAguide
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/course" className="text-muted no-underline hover:text-paper">
            {t("course")}
          </Link>
          <Link href="/glossary" className="text-muted no-underline hover:text-paper">
            {t("glossary")}
          </Link>
          <Link href="/about" className="text-muted no-underline hover:text-paper">
            {t("about")}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}

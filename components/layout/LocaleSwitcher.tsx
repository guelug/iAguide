"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("locale");

  const switchTo = (code: Locale) => {
    const qs = searchParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: code });
  };

  return (
    <div className="flex items-center gap-1 text-xs tracking-[0.18em] uppercase">
      <span className="sr-only">{t("switch")}</span>
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            className={
              active
                ? "px-2 py-1 text-amber"
                : "px-2 py-1 text-faint hover:text-ink"
            }
            aria-current={active ? "true" : undefined}
          >
            {code === "en" ? (
              <>
                <span className="sm:hidden">EN</span>
                <span className="hidden sm:inline">{t("en")}</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">ES</span>
                <span className="hidden sm:inline">{t("es")}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

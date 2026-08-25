"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("locale");

  return (
    <div className="flex items-center gap-1 text-xs tracking-[0.18em] uppercase">
      <span className="sr-only">{t("switch")}</span>
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => router.replace(pathname, { locale: code })}
            className={
              active
                ? "px-2 py-1 text-amber"
                : "px-2 py-1 text-faint hover:text-paper"
            }
            aria-current={active ? "true" : undefined}
          >
            {code === "en" ? t("en") : t("es")}
          </button>
        );
      })}
    </div>
  );
}

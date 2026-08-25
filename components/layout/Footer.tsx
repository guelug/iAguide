import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="relative z-10 mt-auto border-t border-line/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-faint md:flex-row md:items-center md:justify-between">
        <p>iAguide · {t("license")} · 2026</p>
        <p className="max-w-xl text-pretty">{t("stale")}</p>
      </div>
    </footer>
  );
}

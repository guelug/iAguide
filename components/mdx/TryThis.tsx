"use client";

import { useTranslations } from "next-intl";

export function TryThis({ children }: { children: React.ReactNode }) {
  const t = useTranslations("mdx");
  return (
    <aside className="my-6 rounded-lg border border-amber/40 bg-amber-wash px-4 py-3">
      <p className="mb-1 font-mono text-[0.7rem] tracking-[0.18em] uppercase text-amber">
        {t("tryThis")}
      </p>
      <div className="text-[0.98rem] leading-relaxed text-ink-soft">{children}</div>
    </aside>
  );
}

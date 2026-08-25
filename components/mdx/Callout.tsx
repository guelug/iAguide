"use client";

import { useTranslations } from "next-intl";

export function Callout({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("mdx");
  return (
    <aside className="my-6 rounded-lg border border-line bg-teal-dim/40 px-4 py-3">
      <p className="mb-1 font-mono text-[0.7rem] tracking-[0.18em] uppercase text-teal">
        {title ?? t("callout")}
      </p>
      <div className="text-[0.98rem] leading-relaxed text-paper/85">{children}</div>
    </aside>
  );
}

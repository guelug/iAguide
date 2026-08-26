"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

/** Section list with an active marker driven by scroll position. */
export function Toc({ items, label }: { items: TocItem[]; label: string }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const nodes = items
      .map((i) => document.getElementById(i.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (shown[0]) setActive(shown[0].target.id);
      },
      { rootMargin: "-12% 0px -70% 0px", threshold: 0 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label={label} className="text-sm">
      <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-faint">
        {label}
      </p>
      <ul className="mt-3 space-y-1.5 border-l border-line">
        {items.map((item) => {
          const on = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`-ml-px block border-l py-0.5 no-underline transition-colors ${
                  item.depth === 3 ? "pl-6 text-[0.78rem]" : "pl-3.5 text-[0.84rem]"
                } ${
                  on
                    ? "border-teal text-paper"
                    : "border-transparent text-muted hover:text-paper"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

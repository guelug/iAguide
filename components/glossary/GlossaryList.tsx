"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

export type GlossaryEntry = {
  id: string;
  term: string;
  def: string;
  moduleSlug: string;
  moduleTitle: string;
  color: string;
};

/** Instant filter over the whole glossary. No fuzzy matching on purpose. */
export function GlossaryList({
  entries,
  strings,
}: {
  entries: GlossaryEntry[];
  strings: { search: string; from: string; empty: string; count: string };
}) {
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter(
      (e) =>
        e.term.toLowerCase().includes(needle) ||
        e.def.toLowerCase().includes(needle) ||
        e.moduleTitle.toLowerCase().includes(needle),
    );
  }, [entries, q]);

  return (
    <div>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <label className="flex flex-1 items-center gap-3 border-b border-line pb-2 focus-within:border-teal">
          <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-faint">
            {strings.search}
          </span>
          <input
            type="search"
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            className="min-w-0 flex-1 bg-transparent py-1 text-ink outline-none placeholder:text-faint"
            placeholder="kv cache, lora, nf4…"
          />
        </label>
        <p className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-faint">
          {shown.length} {strings.count}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="mt-12 text-muted">{strings.empty}</p>
      ) : (
        <dl className="mt-12 grid gap-x-10 gap-y-9 md:grid-cols-2">
          {shown.map((e) => (
            <div key={e.id} id={e.id} className="scroll-mt-28 border-t border-line pt-4">
              <dt className="font-display text-2xl leading-tight text-ink">{e.term}</dt>
              <dd className="mt-2 text-[0.96rem] leading-relaxed text-ink-soft">{e.def}</dd>
              <p className="mt-2.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-faint">
                {strings.from}{" "}
                <Link href={`/m/${e.moduleSlug}`} style={{ color: e.color }}>
                  {e.moduleTitle}
                </Link>
              </p>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

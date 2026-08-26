"use client";

import { useMemo, useState } from "react";
import { CourseAtlas, type AtlasNode } from "@/components/visuals/CourseAtlas";
import { Link, useRouter } from "@/i18n/navigation";

export type CourseCard = AtlasNode & {
  summary: string;
  durationLabel: string;
  prereqTitles: string[];
  tags: string[];
};

export type TrackChip = { id: string; label: string; numeral: string; color: string };

export function CourseExplorer({
  cards,
  tracks,
  initialTrack,
  strings,
}: {
  cards: CourseCard[];
  tracks: TrackChip[];
  initialTrack: string | null;
  strings: {
    all: string;
    hint: string;
    wip: string;
    prereq: string;
    empty: string;
  };
}) {
  const [track, setTrack] = useState<string | null>(initialTrack);
  const [hover, setHover] = useState<string | null>(null);
  const router = useRouter();

  const nodes = useMemo<AtlasNode[]>(
    () =>
      cards.map(({ slug, order, title, track, color, status, prereqs }) => ({
        slug,
        order,
        title,
        track,
        color,
        status,
        prereqs,
      })),
    [cards],
  );

  const shown = track ? cards.filter((c) => c.track === track) : cards;
  const active = hover ? cards.find((c) => c.slug === hover) : null;

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTrack(null)}
          aria-pressed={track === null}
          className={`chip transition-colors ${
            track === null ? "border-paper/40 text-paper" : "hover:text-paper"
          }`}
        >
          {strings.all}
        </button>
        {tracks.map((tr) => {
          const on = track === tr.id;
          return (
            <button
              key={tr.id}
              type="button"
              onClick={() => setTrack(on ? null : tr.id)}
              aria-pressed={on}
              className="chip transition-colors"
              style={{
                borderColor: on ? tr.color : undefined,
                color: on ? tr.color : undefined,
              }}
            >
              <span style={{ color: tr.color }}>{tr.numeral}</span>
              {tr.label}
            </button>
          );
        })}
      </div>

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-line bg-void">
        <CourseAtlas
          nodes={nodes}
          activeTrack={track}
          onHover={setHover}
          onSelect={(slug) => router.push(`/m/${slug}`)}
          className="h-[440px] w-full md:h-[600px]"
        />

        <p className="pointer-events-none absolute right-4 top-4 font-mono text-[0.58rem] tracking-[0.14em] uppercase text-faint">
          {strings.hint}
        </p>

        <div
          className={`pointer-events-none absolute bottom-4 left-4 max-w-sm rounded-xl border border-line bg-ink/90 px-4 py-3 backdrop-blur transition-opacity duration-200 ${
            active ? "opacity-100" : "opacity-0"
          }`}
        >
          {active ? (
            <>
              <p
                className="font-mono text-[0.58rem] tracking-[0.16em] uppercase"
                style={{ color: active.color }}
              >
                {String(active.order).padStart(2, "0")} · {active.durationLabel}
              </p>
              <p className="mt-1.5 font-display text-xl text-paper">{active.title}</p>
              <p className="mt-1 text-[0.86rem] leading-relaxed text-paper/70">
                {active.summary}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-12 text-muted">{strings.empty}</p>
      ) : (
        <ol className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => {
            const wip = c.status === "wip";
            const inner = (
              <article
                className={`flex h-full flex-col rounded-xl border border-line bg-ink/40 px-5 py-5 transition-colors ${
                  wip ? "opacity-55" : "hover:border-teal/50"
                }`}
                style={{ borderTopColor: c.color, borderTopWidth: 2 }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className="font-mono text-[0.6rem] tracking-[0.18em] uppercase"
                    style={{ color: c.color }}
                  >
                    {String(c.order).padStart(2, "0")}
                  </p>
                  <p className="font-mono text-[0.6rem] uppercase text-faint">
                    {wip ? strings.wip : c.durationLabel}
                  </p>
                </div>
                <h3 className="mt-2.5 font-display text-2xl leading-tight text-paper">
                  {c.title}
                </h3>
                <p className="mt-2 flex-1 text-[0.9rem] leading-relaxed text-muted">
                  {c.summary}
                </p>
                {c.prereqTitles.length ? (
                  <p className="mt-4 font-mono text-[0.56rem] uppercase tracking-[0.12em] text-faint">
                    {strings.prereq}: {c.prereqTitles.join(" · ")}
                  </p>
                ) : null}
              </article>
            );
            return (
              <li key={c.slug}>
                {wip ? (
                  inner
                ) : (
                  <Link href={`/m/${c.slug}`} className="block h-full text-inherit no-underline">
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

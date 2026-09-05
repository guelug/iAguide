"use client";

import type { ReactNode } from "react";

/**
 * Shared chrome for every module diagram: a titled panel, the canvas, a
 * legend, and a controls strip. Every visual in the course looks like a
 * member of the same instrument family because of this file.
 */
export function Figure({
  label,
  hint,
  legend,
  controls,
  note,
  children,
  height = "h-[360px] md:h-[460px]",
  flush = false,
}: {
  label?: string;
  hint?: string;
  legend?: { color: string; label: string }[];
  controls?: ReactNode;
  /**
   * The sentence the figure is making. It belongs here rather than on a
   * Tag inside the canvas: a 3D-anchored label cannot wrap, so a long one
   * overflows the panel and collides with whatever else is near it.
   */
  note?: ReactNode;
  children: ReactNode;
  height?: string;
  flush?: boolean;
}) {
  return (
    <div className="not-prose overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      {label || hint ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line/70 px-4 py-3">
          {label ? (
            <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-teal">
              {label}
            </p>
          ) : (
            <span />
          )}
          {hint ? (
            <p className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-faint">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Hidden from assistive tech on purpose. The labels inside a scene
          are drei <Html> overlays, so they are real DOM text with no
          structure — a screen reader would read them as a loose stream of
          words between the heading and the note. Everything the figure
          means is already prose right here: the label above, the note
          below, and the legend. The controls live outside this element,
          so none of them are hidden with it. */}
      <div
        aria-hidden
        className={`relative w-full ${height} ${flush ? "" : "bg-paper"}`}
      >
        {children}
      </div>

      {/* A div, not a p: callers pass readouts and lists in here, and a
          paragraph may not contain them. */}
      {note ? (
        <div className="border-t border-line/70 px-4 py-3 text-[0.88rem] leading-relaxed text-ink-soft">
          {note}
        </div>
      ) : null}

      {legend?.length || controls ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 px-4 py-2.5">
          {legend?.length ? (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {legend.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.12em] uppercase text-muted"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : (
            <span />
          )}
          {controls ? <div className="flex flex-wrap items-center gap-2">{controls}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Segmented control used by most interactive figures. */
export function Switcher<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; tone?: string }[];
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-1 rounded-full border border-line p-0.5"
    >
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1 font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-colors ${
              on ? "text-paper" : "text-muted hover:text-ink"
            }`}
            style={on ? { background: opt.tone ?? "var(--teal)" } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Labelled range input, styled to match the Switcher. */
export function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  tone = "var(--teal)",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  tone?: string;
}) {
  return (
    <label className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.12em] uppercase text-muted">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-line accent-teal"
        style={{ accentColor: tone }}
      />
      <span className="tabular-nums" style={{ color: tone }}>
        {format ? format(value) : value}
      </span>
    </label>
  );
}

/** A numeric readout row for figures that compute something. */
export function Readout({
  items,
}: {
  items: { label: string; value: string; tone?: string }[];
}) {
  return (
    <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline gap-1.5">
          <dt className="font-mono text-[0.58rem] tracking-[0.12em] uppercase text-faint">
            {it.label}
          </dt>
          <dd
            className="font-mono text-[0.72rem] tabular-nums"
            style={{ color: it.tone ?? "var(--ink)" }}
          >
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

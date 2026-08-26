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
  children,
  height = "h-[320px] md:h-[420px]",
  flush = false,
}: {
  label?: string;
  hint?: string;
  legend?: { color: string; label: string }[];
  controls?: ReactNode;
  children: ReactNode;
  height?: string;
  flush?: boolean;
}) {
  return (
    <div className="not-prose overflow-hidden rounded-2xl border border-line bg-ink/70 backdrop-blur-sm">
      {label || hint ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line/70 px-4 py-2.5">
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

      <div className={`relative w-full ${height} ${flush ? "" : "bg-void"}`}>
        {children}
      </div>

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
                    style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
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
              on ? "text-void" : "text-muted hover:text-paper"
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
            style={{ color: it.tone ?? "var(--paper)" }}
          >
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

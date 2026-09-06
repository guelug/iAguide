"use client";

import { useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { LabContext } from "@/components/lab/LabContext";
import { useLocale } from "next-intl";
import { ViewerContext, type ViewerSettings } from "./ViewerContext";

/**
 * Shared chrome for every module diagram: a titled panel, the canvas, a
 * legend, and a controls strip. Every visual in the course looks like a
 * member of the same instrument family because of this file.
 */
const subscribeToFullscreenSupport = () => () => {};

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
  const es = useLocale() === "es";
  const lab = useContext(LabContext);
  const [azimuth, setAzimuth] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [labels, setLabels] = useState(true);
  const [paused, setPaused] = useState(false);
  const [detail, setDetail] = useState(lab);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<ViewerSettings["view"]>("original");
  const host = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const canExpand = useSyncExternalStore(subscribeToFullscreenSupport, () => Boolean(document.fullscreenEnabled), () => false);
  useEffect(() => {
    const changed = () => setExpanded(document.fullscreenElement === host.current);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  const fullscreen = async () => {
    if (document.fullscreenElement === host.current) await document.exitFullscreen();
    else await host.current?.requestFullscreen?.();
  };

  return (
    <div ref={host} className={`not-prose overflow-hidden [&:fullscreen]:overflow-y-auto border bg-surface shadow-[var(--shadow-card)] ${es ? "rounded-sm border-line-strong p-1" : "rounded-2xl border-line"}`}>
      {label || hint ? (
        <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3 border-b border-line px-5 py-5">
          {label ? (
            <div>
              {es && <p className="mb-2 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-muted">iAguide / Lámina de estudio</p>}
              <p className={es ? "max-w-xl font-display text-[1.35rem] leading-tight text-ink" : "font-mono text-[0.62rem] tracking-[0.2em] uppercase text-teal"}>{label}</p>
            </div>
          ) : (
            <span />
          )}
          {hint ? (
            <p className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-muted">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}

      {es && <div className="flex flex-wrap items-center gap-2 border-b border-line/70 bg-paper px-4 py-3 [&_button]:min-h-8" aria-label={es ? "Controles del visor 3D" : "3D viewer controls"}>
        <span className="mr-auto font-mono text-[0.6rem] tracking-widest text-muted">3D / {es ? "EXPLORAR" : "EXPLORE"}</span>
        <button type="button" className="chip" style={paused ? {background: "var(--teal-wash)", borderColor: "var(--teal)"} : undefined} onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? (es ? "Reanudar" : "Resume") : (es ? "Pausar" : "Pause")}</button>
        <label className="text-xs text-muted"><span className="sr-only">{es ? "Ángulo de cámara" : "Camera angle"}</span><select className="rounded border border-line bg-surface p-1.5 text-xs" value={view} onChange={e => setView(e.target.value as ViewerSettings["view"])}><option value="original">{es ? "Vista de autor" : "Authored view"}</option><option value="front">{es ? "Frontal" : "Front"}</option><option value="overhead">{es ? "Desde arriba" : "Overhead"}</option></select></label>
        <button type="button" className="chip" disabled={zoom <= 0.8} aria-label={es ? "Alejar" : "Zoom out"} onClick={() => setZoom(z => Math.max(0.8, z - 0.2))}>−</button>
        <button type="button" className="chip" onClick={() => {setZoom(1); setView("original"); setAzimuth(0); setElevation(0);}} aria-label={es ? "Restablecer cámara" : "Reset camera"}>{Math.round(zoom * 100)}%</button>
        <button type="button" className="chip" disabled={zoom >= 1.6} aria-label={es ? "Acercar" : "Zoom in"} onClick={() => setZoom(z => Math.min(1.6, z + 0.2))}>+</button>
        <button type="button" className="chip" aria-pressed={labels} onClick={() => setLabels(!labels)}>{labels ? "Ocultar etiquetas" : "Mostrar etiquetas"}</button>
        <button type="button" className="chip" style={detail ? {background: "var(--teal-wash)", borderColor: "var(--teal)"} : undefined} aria-pressed={detail} onClick={() => setDetail(!detail)}>{es ? "Alta definición" : "High definition"}</button>
        {canExpand && <button type="button" className="chip" onClick={() => void fullscreen().catch(() => {})}>{expanded ? (es ? "Cerrar" : "Close") : (es ? "Ampliar" : "Expand")} ↗</button>}
      </div>}
      {es && <details className="border-b border-line/70 bg-paper px-4 py-2">
        <summary className="cursor-pointer font-mono text-[0.6rem] uppercase tracking-widest text-muted">Orientación del modelo · giro y elevación</summary>
        <div className="grid gap-4 py-3 sm:grid-cols-2">
          <label className="text-xs text-muted">Giro horizontal <output className="float-right font-mono">{azimuth}°</output><input aria-label="Giro horizontal" type="range" min={-180} max={180} step={5} value={azimuth} onChange={e=>setAzimuth(Number(e.target.value))} className="mt-2 block w-full accent-teal" /></label>
          <label className="text-xs text-muted">Elevación <output className="float-right font-mono">{elevation}°</output><input aria-label="Elevación" type="range" min={-45} max={45} step={5} value={elevation} onChange={e=>setElevation(Number(e.target.value))} className="mt-2 block w-full accent-teal" /></label>
        </div>
      </details>}
      {/* Hidden from assistive tech on purpose. The labels inside a scene
          are drei <Html> overlays, so they are real DOM text with no
          structure — a screen reader would read them as a loose stream of
          words between the heading and the note. Everything the figure
          means is already prose right here: the label above, the note
          below, and the legend. The controls live outside this element,
          so none of them are hidden with it. */}
      <div
        aria-hidden
        className={`relative w-full ${expanded ? "h-[65vh]" : lab ? "h-[480px] md:h-[min(65vh,760px)] md:min-h-[540px]" : height} ${flush ? "" : "bg-paper"}`}
      >
        <ViewerContext.Provider value={{paused, labels, detail, zoom, view, azimuth, elevation, studio: es}}>{children}</ViewerContext.Provider>
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
      {options.map((opt, index) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % options.length;
              else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + options.length - 1) % options.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = options.length - 1;
              else return;
              event.preventDefault();
              onChange(options[next].value);
              (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
            }}
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

"use client";

import { useMemo, useState } from "react";
import { CourseAtlas, type AtlasNode } from "@/components/visuals/CourseAtlas";
import { VisualSlot } from "@/components/mdx/VisualSlot";
import { Link } from "@/i18n/navigation";
import type { LessonSection } from "@/lib/lesson-outline";

export type CourseCard = AtlasNode & {
  summary: string;
  durationLabel: string;
  prereqTitles: string[];
  tags: string[];
  sections: LessonSection[];
};
export type TrackChip = { id: string; label: string; numeral: string; color: string };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function CourseExplorer({ cards, tracks, initialTrack, strings, locale }: {
  cards: CourseCard[];
  tracks: TrackChip[];
  initialTrack: string | null;
  locale: string;
  strings: { all: string; hint: string; wip: string; prereq: string; empty: string };
}) {
  const es = locale === "es";
  const [track, setTrack] = useState<string | null>(initialTrack);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"map" | "space">("space");
  const [selected, setSelected] = useState(cards.find(c => !initialTrack || c.track === initialTrack)?.slug ?? "");
  const [hover, setHover] = useState<string | null>(null);
  const shown = useMemo(() => cards.filter(c => (!track || c.track === track) && normalize([c.title, c.summary, ...c.tags, ...c.sections.map(s => s.title)].join(" ")).includes(normalize(query.trim()))), [cards, track, query]);
  const active = shown.find(c => c.slug === selected) ?? shown[0];
  const prerequisites = active ? cards.filter(c => active.prereqs.includes(c.slug)) : [];
  const unlocks = active ? cards.filter(c => c.prereqs.includes(active.slug)) : [];
  const related = new Set([...prerequisites, ...unlocks].map(c => c.slug));
  const inspect = (slug: string) => {
    if (!shown.some(c => c.slug === slug)) {setQuery(""); setTrack(null);}
    setSelected(slug);
  };
  const selectTrack = (value: string | null) => { setTrack(value); setHover(null); };

  return (
    <div className="mt-9">
      <div className="grid gap-5 border-y border-line py-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <label htmlFor="course-search" className="block font-mono text-xs uppercase tracking-widest text-muted">{es ? "Encuentra una idea" : "Find an idea"}</label>
          <div className="mt-2 flex gap-2">
            <input id="course-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={es ? "Atención, memoria, herramientas…" : "Attention, memory, tools…"} className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-ink outline-offset-4 focus:border-teal" />
            {query && <button type="button" className="chip" onClick={() => setQuery("")}>{es ? "Limpiar" : "Clear"}</button>}
          </div>
        </div>
        <div className="flex gap-2" aria-label={es ? "Vista del curso" : "Course view"}>
          <button type="button" className="chip" aria-pressed={view === "map"} onClick={() => setView("map")} style={{background: view === "map" ? "var(--teal-wash)" : undefined}}>{es ? "Mapa de módulos" : "Module map"}</button>
          <button type="button" className="chip" aria-pressed={view === "space"} onClick={() => setView("space")} style={{background: view === "space" ? "var(--teal-wash)" : undefined}}>{es ? "Constelación 3D" : "3D constellation"}</button>
        </div>
      </div>
      <div className="my-5 flex flex-wrap gap-2">
        <button type="button" className="chip" aria-pressed={!track} onClick={() => selectTrack(null)}>{strings.all} · {cards.length}</button>
        {tracks.map(tr => <button type="button" key={tr.id} className="chip" aria-pressed={track === tr.id} onClick={() => selectTrack(track === tr.id ? null : tr.id)} style={{color: tr.color, borderColor: track === tr.id ? tr.color : undefined, background: track === tr.id ? "var(--surface)" : undefined}}>{tr.numeral} {tr.label} · {cards.filter(c => c.track === tr.id).length}</button>)}
      </div>
      <p role="status" className="mb-4 text-sm text-muted">{shown.length} {es ? (shown.length === 1 ? "módulo · explora sus secciones y conexiones" : "módulos · selecciona uno para explorar sus secciones y conexiones") : "modules · select one to explore its sections and connections"}</p>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0">
          {shown.length === 0 ? <p className="rounded-xl border border-line p-8">{es ? "No hay módulos que coincidan. Prueba otra búsqueda o cambia de pista." : strings.empty}</p> : view === "space" ? (
            <div className="relative overflow-hidden rounded-2xl border border-line bg-paper">
              <CourseAtlas selected={active?.slug} nodes={shown} activeTrack={track} onHover={setHover} onSelect={inspect} className="h-[450px] w-full md:h-[600px]" />
              <p className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-lg bg-surface/95 p-3 text-sm text-ink-soft">{hover ? cards.find(c => c.slug === hover)?.title : es ? "Gira para explorar. Pulsa un nodo para abrir su ficha." : "Rotate to explore. Select a node to open its details."}</p>
              <label className="block border-t border-line p-4 text-sm">{es ? "Seleccionar módulo" : "Select module"}<select value={active?.slug ?? ""} onChange={e => inspect(e.target.value)} className="mt-2 w-full rounded-lg border border-line bg-surface p-2"><option value="" disabled>{es ? "Elige un módulo" : "Choose a module"}</option>{shown.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select></label>
            </div>
          ) : (
            <div className="max-h-[760px] space-y-7 overflow-y-auto pr-1">
              {tracks.filter(tr => shown.some(c => c.track === tr.id)).map(tr => (
                <section key={tr.id} aria-label={tr.label}>
                  <div className="mb-3 flex items-center gap-3"><span className="font-display text-3xl" style={{color: tr.color}}>{tr.numeral}</span><h2 className="font-display text-xl">{tr.label}</h2><div className="h-px flex-1 bg-line" /></div>
                  <ol className="grid gap-2 sm:grid-cols-2">
                    {shown.filter(c => c.track === tr.id).map(c => {
                      const on = active?.slug === c.slug;
                      return <li key={c.slug}><button type="button" onClick={() => inspect(c.slug)} aria-pressed={on} className="group h-full w-full rounded-xl border bg-surface p-4 text-left transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal" style={{borderColor: on || related.has(c.slug) ? tr.color : "var(--line)", background: on ? "var(--teal-wash)" : undefined, boxShadow: on ? `inset 3px 0 ${tr.color}` : undefined}}>
                        <span className="flex justify-between gap-2 font-mono text-[0.65rem] text-muted"><span style={{color: tr.color}}>{String(c.order).padStart(2, "0")}</span><span>{c.status === "wip" ? strings.wip : c.durationLabel}</span></span>
                        <span className="mt-2 block font-display text-lg leading-snug text-ink">{c.title}</span>
                        <span className="mt-2 block text-xs text-muted">{c.sections.length} {es ? "secciones" : "sections"} · {c.sections.reduce((n, s) => n + s.figures, 0)} {es ? "figuras en secciones" : "section figures"}</span>
                        {related.has(c.slug) && <span className="mt-2 block text-xs" style={{color: tr.color}}>{active?.prereqs.includes(c.slug) ? (es ? "← Base del módulo seleccionado" : "← Foundation for selected module") : (es ? "→ Continúa desde el seleccionado" : "→ Builds on selected module")}</span>}
                      </button></li>;
                    })}
                  </ol>
                </section>
              ))}
            </div>
          )}
          {active?.status === "complete" && <details key={active.slug} className="mt-6 rounded-2xl border border-line bg-surface p-4">
            <summary className="cursor-pointer font-display text-xl text-ink">{es ? "Explorar diagrama 3D" : "Explore 3D diagram"} · {active.title}</summary>
            <Link href={`/lab?scene=${active.slug}`} className="mt-3 inline-block text-sm text-teal">Abrir en el laboratorio ↗</Link>
            <div className="mt-4"><VisualSlot id={active.slug} wide={false} /></div>
          </details>}
        </div>
        {active && <aside aria-label={es ? "Detalle del módulo" : "Module details"} className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface xl:sticky xl:top-6">
          <div className="border-b border-line p-5" style={{borderTop: `4px solid ${active.color}`}}>
            <p className="font-mono text-xs uppercase tracking-widest" style={{color: active.color}}>{es ? "En foco" : "In focus"} · {active.durationLabel}</p>
            <h2 className="mt-3 font-display text-2xl leading-tight">{active.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{active.summary}</p>
            {active.status === "complete" ? <Link href={`/m/${active.slug}`} className="mt-5 block rounded-lg bg-ink px-4 py-3 text-center text-sm text-white no-underline">{es ? "Abrir lección" : "Open lesson"} ↗</Link> : <p className="mt-4 text-amber">{strings.wip}</p>}
          </div>
          <div className="p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">{es ? "Ruta de aprendizaje" : "Learning path"}</p>
            {[[es ? "Antes" : "Before", prerequisites], [es ? "Después" : "After", unlocks]].map(([label, group]) => <div key={label as string} className="mt-4"><p className="mb-2 text-xs text-muted">{label as string}</p><div className="flex flex-wrap gap-2">{(group as CourseCard[]).length ? (group as CourseCard[]).map(c => <button key={c.slug} type="button" onClick={() => inspect(c.slug)} className="rounded-md border border-line px-2 py-1 text-left text-xs hover:border-teal">{c.title}</button>) : <span className="text-xs text-muted">{label === (es ? "Antes" : "Before") ? (es ? "Sin prerrequisitos" : "No prerequisites") : (es ? "Sin continuación directa" : "No direct continuation")}</span>}</div></div>)}
            <details open className="mt-6 border-t border-line pt-4" key={active.slug}>
              <summary className="cursor-pointer text-sm font-medium">{es ? "Dentro de esta lección" : "Inside this lesson"} · {active.sections.length}</summary>
              <ol className="mt-3 max-h-[26rem] space-y-1 overflow-y-auto">{active.sections.map((s, i) => <li key={s.id}><Link href={`/m/${active.slug}#${s.id}`} className="flex gap-3 rounded-md p-2 text-sm text-ink-soft no-underline hover:bg-sunken"><span className="pt-0.5 font-mono text-[0.6rem] text-muted">{String(i + 1).padStart(2,"0")}</span><span className="min-w-0">{s.title}{s.figures > 0 && <span className="mt-1 block text-xs text-teal">◈ {s.figures} {es ? (s.figures === 1 ? "figura" : "figuras") : "figures"}</span>}</span></Link></li>)}</ol>
            </details>
          </div>
        </aside>}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { VisualSlot } from "@/components/mdx/VisualSlot";
import { LabContext } from "./LabContext";
import type { CatalogModule } from "@/lib/visual-catalog";

const normalized = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const FEATURED = ["tokenization", "image-models", "memory-hardware", "attention"];

export function VisualLaboratory({catalog, initialScene}: {catalog: CatalogModule[]; initialScene?: string}) {
  const all = useMemo(() => catalog.flatMap(module => module.figures.map(figure => ({module, figure}))), [catalog]);
  const [selected, setSelected] = useState(all.some(x => x.figure.id === initialScene) ? initialScene! : "image-models");
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("");
  const [indexOpen, setIndexOpen] = useState(false);
  const active = all.find(x => x.figure.id === selected) ?? all[0];
  const position = all.indexOf(active);
  const matches = catalog.filter(m => (!track || track === m.track) && normalized(`${m.title} ${m.summary} ${m.figures.map(f => f.title).join(" ")}`).includes(normalized(query)));
  const tracks = [...new Map(catalog.map(m => [m.track, m.trackTitle])).entries()];
  function choose(id: string) {
    setSelected(id); setIndexOpen(false);
    // Replace only this route's scene parameter; native history preserves scroll.
    const url = new URL(window.location.href);
    url.searchParams.set("scene", id);
    window.history.replaceState(null, "", url);
  }
  return <div className="mx-auto w-full max-w-[1800px] px-4 py-7 md:px-8 lg:px-10">
    <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line-strong pb-6">
      <div><p className="kicker">iAguide / Colección de mecanismos</p><h1 className="mt-3 font-display text-4xl tracking-tight md:text-6xl">Laboratorio visual<span className="text-teal">.</span></h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Abre un diagrama, separa sus piezas y sigue el proceso. Cada control pertenece al mecanismo que estás estudiando.</p></div>
      <div className="flex gap-7 font-mono text-xs"><div><strong className="block font-display text-3xl text-ink">{all.length}</strong>diagramas</div><div><strong className="block font-display text-3xl text-ink">{catalog.length}</strong>módulos</div><Link href="/course" className="self-end text-teal">Mapa del curso ↗</Link></div>
    </div>
    <div className="my-5 flex flex-wrap items-center gap-2"><span className="mr-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted">En la mesa</span>{FEATURED.map(slug => {const m=catalog.find(m=>m.slug===slug);return m && <button key={slug} type="button" className="chip" aria-pressed={selected===slug} onClick={()=>choose(slug)} style={selected===slug?{background:"var(--teal-wash)",borderColor:"var(--teal)"}:undefined}>{m.title}</button>;})}</div>
    <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-sm border border-line-strong bg-surface lg:sticky lg:top-20" aria-label="Catálogo de diagramas">
        <button type="button" className="flex w-full justify-between border-b border-line p-4 text-left font-mono text-xs uppercase tracking-widest lg:pointer-events-none" aria-expanded={indexOpen} onClick={()=>setIndexOpen(!indexOpen)}>Índice de la colección <span className="lg:hidden">{indexOpen?"−":"+"}</span></button>
        <div className={`${indexOpen?"block":"hidden"} lg:block`}>
          <div className="space-y-3 p-4"><label className="block text-xs text-muted">Buscar un concepto<input value={query} onChange={e=>setQuery(e.target.value)} type="search" placeholder="Memoria, atención…" className="mt-2 w-full rounded border border-line bg-paper px-3 py-2 text-sm text-ink" /></label><label className="block text-xs text-muted">Pista<select value={track} onChange={e=>setTrack(e.target.value)} className="mt-2 w-full rounded border border-line bg-paper px-2 py-2 text-sm text-ink"><option value="">Todas las pistas</option>{tracks.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label><p role="status" className="text-xs text-muted">{matches.length} {matches.length===1?"módulo encontrado":"módulos encontrados"}</p></div>
          <div className="max-h-[55vh] overflow-y-auto border-t border-line p-2">{matches.length===0?<p className="p-3 text-sm text-muted">No hay coincidencias. Prueba otro término.</p>:matches.map(m=><details key={m.slug} open={active.module.slug===m.slug || Boolean(query)} className="border-b border-line/60 last:border-0"><summary className="cursor-pointer px-2 py-3 text-sm leading-snug text-ink"><span className="mr-2 font-mono text-[0.6rem]" style={{color:m.color}}>{String(m.order).padStart(2,"0")}</span>{m.title}<span className="ml-1 text-xs text-muted">· {m.figures.length}</span></summary><ol className="space-y-1 pb-2">{m.figures.map((f,i)=><li key={f.id}><button type="button" aria-current={selected===f.id?"true":undefined} onClick={()=>choose(f.id)} className={`w-full rounded px-3 py-2 text-left text-xs leading-relaxed ${selected===f.id?"bg-teal-wash text-teal":"text-muted hover:bg-sunken"}`}><span className="mr-2 font-mono text-[0.6rem]">{String(i+1).padStart(2,"0")}</span>{f.title}</button></li>)}</ol></details>)}</div>
        </div>
      </aside>
      <section className="min-w-0" aria-label="Mesa de estudio">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><span style={{color:active.module.color}}>{active.module.trackTitle}</span> / Lámina {String(position+1).padStart(3,"0")}</p><div className="flex gap-2"><button type="button" className="chip" disabled={position===0} onClick={()=>choose(all[position-1].figure.id)}>← Anterior</button><button type="button" className="chip" disabled={position===all.length-1} onClick={()=>choose(all[position+1].figure.id)}>Siguiente →</button></div></div>
        <LabContext.Provider value={true}><VisualSlot key={selected} id={active.figure.id} wide={false}/></LabContext.Provider>
        <div className="mt-5 grid gap-5 border-y border-line-strong py-5 md:grid-cols-[1fr_auto]"><div><p className="font-mono text-[0.6rem] uppercase tracking-widest text-teal">Cuaderno de estudio</p><h2 className="mt-2 font-display text-2xl">{active.figure.title}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{active.module.summary}</p></div><Link href={`/m/${active.module.slug}${active.figure.anchor?`#${active.figure.anchor}`:""}`} className="self-center rounded border border-line-strong bg-surface px-4 py-3 text-sm text-ink no-underline hover:border-teal">Leer la explicación ↗</Link></div>
        <p className="mt-4 text-xs leading-relaxed text-muted">Las maquetas representan conceptos. Las cifras de los ejemplos didácticos no son mediciones de tu equipo. Usa los selectores, el despiece y los parámetros disponibles en cada lámina para comparar estados.</p>
      </section>
    </div>
  </div>;
}

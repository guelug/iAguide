"use client";

import { LabContext } from "@/components/lab/LabContext";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Component, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { getExtraVisualLoader, getVisualLoader } from "@/content/modules";

class SceneBoundary extends Component<{children: ReactNode; fallback: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** A keyed boundary keeps a new diagram from displaying the previous scene. */
export function VisualSlot({ caption, id, wide = true }: { caption?: string; id?: string; wide?: boolean }) {
  const params = useParams<{ slug?: string }>();
  const sceneKey = id ?? params.slug;
  return <LazyVisual key={sceneKey} sceneKey={sceneKey} caption={caption} wide={wide} />;
}

function LazyVisual({ sceneKey, caption, wide }: {sceneKey?: string; caption?: string; wide: boolean}) {
  const es = useLocale() === "es";
  const inLab = useContext(LabContext);
  const host = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [Visual, setVisual] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const load = useMemo(() => sceneKey ? (sceneKey.includes(":") ? getExtraVisualLoader(sceneKey) : getVisualLoader(sceneKey)) : undefined, [sceneKey]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {setNear(true); observer.disconnect();}
    }, {rootMargin: "500px 0px"});
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!load || !near) return;
    let cancelled = false;
    load().then(mod => {if (!cancelled) setVisual(() => mod.default);}).catch(() => {if (!cancelled) setFailed(true);});
    return () => {cancelled = true;};
  }, [load, near, attempt]);

  return <figure ref={host} className={wide ? "bleed-wide" : undefined} data-scene={sceneKey}>
    {failed || !load ? <div role="status" className="not-prose rounded-2xl border border-line bg-paper p-6 text-sm text-muted">
      <p>{es ? "No se ha podido cargar este diagrama." : "This diagram could not be loaded."}</p>
      {load && <button type="button" className="chip mt-3" onClick={() => {setFailed(false); setAttempt(n => n + 1);}}>{es ? "Reintentar" : "Retry"}</button>}
    </div> : Visual ? <SceneBoundary key={attempt} fallback={<div role="status" className="rounded border border-line bg-paper p-6 text-sm text-muted"><p>{es ? "Este diagrama no se ha podido dibujar. Puedes seguir leyendo la explicación o volver a intentarlo." : "This diagram could not be rendered. You can continue reading or try again."}</p><button type="button" className="chip mt-3" onClick={()=>setAttempt(n=>n+1)}>{es?"Reintentar":"Retry"}</button></div>}><Visual /></SceneBoundary> : <div aria-hidden className="h-[440px] w-full rounded-2xl border border-line bg-sunken md:h-[560px]" />}
    {es && !inLab && load && <div className="not-prose mt-2 flex justify-end"><Link href={`/lab?scene=${encodeURIComponent(sceneKey!)}`} className="text-xs text-teal no-underline hover:underline">Explorar esta lámina en el laboratorio ↗</Link></div>}
    {caption && <figcaption className="mt-2.5 font-mono text-[0.68rem] leading-relaxed tracking-wide text-faint">{caption}</figcaption>}
  </figure>;
}

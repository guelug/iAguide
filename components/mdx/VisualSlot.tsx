"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { getExtraVisualLoader, getVisualLoader } from "@/content/modules";

/** A keyed boundary keeps a new diagram from displaying the previous scene. */
export function VisualSlot({ caption, id, wide = true }: { caption?: string; id?: string; wide?: boolean }) {
  const params = useParams<{ slug?: string }>();
  const sceneKey = id ?? params.slug;
  return <LazyVisual key={sceneKey} sceneKey={sceneKey} caption={caption} wide={wide} />;
}

function LazyVisual({ sceneKey, caption, wide }: {sceneKey?: string; caption?: string; wide: boolean}) {
  const es = useLocale() === "es";
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
    </div> : Visual ? <Visual /> : <div aria-hidden className="h-[440px] w-full rounded-2xl border border-line bg-sunken md:h-[560px]" />}
    {caption && <figcaption className="mt-2.5 font-mono text-[0.68rem] leading-relaxed tracking-wide text-faint">{caption}</figcaption>}
  </figure>;
}

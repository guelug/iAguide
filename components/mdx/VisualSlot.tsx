"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { getExtraVisualLoader, getVisualLoader } from "@/content/modules";

/**
 * Drops a module's diagram into the prose. Defaults to the visual
 * registered under the current slug; pass `id` to pull a specific scene:
 * another module's visual ("<slug>") or an extra scene ("<slug>:2").
 */
export function VisualSlot({
  caption,
  id,
  wide = true,
}: {
  caption?: string;
  id?: string;
  wide?: boolean;
}) {
  const params = useParams<{ slug?: string }>();
  const key = id ?? params.slug;
  const [Visual, setVisual] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!key) return;
    const load = key.includes(":")
      ? getExtraVisualLoader(key)
      : getVisualLoader(key);
    if (!load) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    load()
      .then((mod) => {
        if (!cancelled) setVisual(() => mod.default);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (failed) return null;

  return (
    <figure className={wide ? "bleed-wide" : undefined}>
      {Visual ? (
        <Visual />
      ) : (
        <div
          aria-hidden
          className="h-[360px] w-full animate-pulse rounded-2xl border border-line bg-sunken"
        />
      )}
      {caption ? (
        <figcaption className="mt-2.5 font-mono text-[0.68rem] leading-relaxed tracking-wide text-faint">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

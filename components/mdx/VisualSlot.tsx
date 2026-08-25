"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { getVisualLoader } from "@/content/modules";

export function VisualSlot({ caption }: { caption?: string }) {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug;
  const [Visual, setVisual] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = getVisualLoader(slug);
    if (!load) return;
    let cancelled = false;
    load().then((mod) => {
      if (!cancelled) setVisual(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!Visual) return null;

  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded-xl border border-line">
        <Visual />
      </div>
      {caption ? (
        <figcaption className="mt-2 font-mono text-xs tracking-wide text-faint">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

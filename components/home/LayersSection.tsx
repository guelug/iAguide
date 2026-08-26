"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LayerTriptych } from "@/components/visuals/LayerTriptych";
import { P } from "@/lib/palette";

const TONES = [P.amber, P.teal, P.violet];

export function LayersSection() {
  const t = useTranslations("home");
  const [active, setActive] = useState<number | null>(null);
  const layers = t.raw("layers") as { name: string; blurb: string }[];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
      <div className="order-2 lg:order-1">
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
          {layers.map((layer, i) => {
            const on = active === i;
            return (
              <li
                key={layer.name}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                className="group relative cursor-default bg-ink px-5 py-5 transition-colors duration-300 focus:outline-none"
                style={{
                  background: on
                    ? `linear-gradient(90deg, color-mix(in srgb, ${TONES[i]} 12%, var(--ink)), var(--ink))`
                    : undefined,
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-[2px] transition-opacity duration-300"
                  style={{ background: TONES[i], opacity: on ? 1 : 0.25 }}
                />
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-[0.62rem] tracking-[0.2em]"
                    style={{ color: TONES[i] }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-2xl text-paper">{layer.name}</h3>
                </div>
                <p className="mt-2 max-w-lg text-[0.97rem] leading-relaxed text-paper/75">
                  {layer.blurb}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="order-1 overflow-hidden rounded-2xl border border-line bg-void lg:order-2">
        <LayerTriptych active={active} className="h-[300px] w-full md:h-[420px]" />
      </div>
    </div>
  );
}

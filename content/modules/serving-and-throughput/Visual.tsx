"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "one" | "batch" | "spec";

export default function Visual() {
  const t = useCopy({
    en: {
      "batch_paged_kv": "batch · paged KV",
      "fast_for_you_is_not_cheap_for_everyone": "fast for you is not cheap for everyone"
    },
    es: {
      "batch_paged_kv": "batch · KV paginado",
      "fast_for_you_is_not_cheap_for_everyone": "rápido para ti no es barato para todos"
    },
  });
  const [mode, setMode] = useState<Mode>("one");
  return (
    <Figure
      label={t.batch_paged_kv}
      hint={t.fast_for_you_is_not_cheap_for_everyone}
      legend={[
          { color: P.teal, label: "prefill (paralelo)" },
          { color: P.amber, label: "decode (secuencial)" },
          { color: P.violet, label: "draft especulativo" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "one", label: "Un usuario", tone: P.teal },
            { value: "batch", label: "Batch continuo", tone: P.amber },
            { value: "spec", label: "Especulativo", tone: P.violet }
          ]}
          ariaLabel={t.fast_for_you_is_not_cheap_for_everyone}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 8.0], fov: 40 }}>

        {/* GPU slab */}
        <Slab position={[0, 0.1, 0]} size={[6.2, 1.8, 0.1]} color={P.teal} fill={0.10} />
        <Tag position={[0, 1.05, 0.2]} tone="teal">GPU</Tag>

        {mode === "one" ? (
          <>
            {/* One user: idle SMs around the single active request */}
            <Slab position={[0, -0.55, 0]} size={[1.4, 0.8, 0.1]} color={P.teal} fill={0.32} />
            <Tag position={[0, -1.15, 0.2]} tone="teal">idle SM</Tag>
          </>
        ) : null}

        {mode === "batch" ? (
          <>
            {/* 4 concurrent requests in continuous batching */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Slab
                key={i}
                position={[-2.4 + i * 1.6, -0.55, 0]}
                size={[1.2, 0.7, 0.1]}
                color={i % 2 === 0 ? P.amber : P.teal}
                fill={i === 1 ? 0.38 : 0.22}
              />
            ))}
            <Tag position={[0, -1.15, 0.2]} tone="amber">batch continuo · KV paginada</Tag>
            <Flow points={[[-3.0, -0.55, 0], [3.0, -0.55, 0]]} color={P.amber} count={6} />
          </>
        ) : null}

        {mode === "spec" ? (
          <>
            {/* Draft model — small */}
            <Slab position={[-1.4, -0.55, 0]} size={[1.0, 0.7, 0.1]} color={P.violet} fill={0.42} />
            <Tag position={[-1.4, -1.1, 0.2]} tone="violet">draft</Tag>
            {/* Target model — large */}
            <Slab position={[1.5, -0.55, 0]} size={[1.9, 0.9, 0.1]} color={P.amber} fill={0.30} />
            <Tag position={[1.5, -1.15, 0.2]} tone="amber">target</Tag>
            {/* Verification arrows */}
            <Flow points={[[-0.85, -0.55, 0], [0.55, -0.55, 0]]} color={P.violet} count={4} />
            <Flow points={[[0.55, -0.25, 0], [-0.85, -0.25, 0]]} color={P.teal} count={3} />
          </>
        ) : null}

      </Stage>
    </Figure>
  );
}

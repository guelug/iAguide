"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "fp16" | "q4" | "nf4";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("fp16");
  const t = useCopy({
    en: {
      label: "same W, fewer bits",
      hint: "step the figure",
      fp16: "FP16",
      q4: "Q4",
      nf4: "NF4 train",
    },
    es: {
      label: "la misma W, con menos bits",
      hint: "recorre la figura",
      fp16: "FP16",
      q4: "Q4",
      nf4: "NF4 (entreno)",
    },
  });

  // Bytes-per-weight as a visual height proxy (smaller = shorter slabs)
  const fpSize = mode === "fp16" ? [1.9, 1.7, 0.12] : [1.9, 0.7, 0.12];
  const q4Size = mode === "q4" ? [1.9, 1.7, 0.12] : [1.9, 0.5, 0.12];
  const nfSize = mode === "nf4" ? [1.9, 1.7, 0.12] : [1.9, 0.5, 0.12];

  return (
    <Figure
      label={t.label}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.fp16 },
        { color: P.amber, label: t.q4 },
        { color: P.violet, label: t.nf4 },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "fp16", label: t.fp16, tone: P.teal },
            { value: "q4", label: t.q4, tone: P.amber },
            { value: "nf4", label: t.nf4, tone: P.violet },
          ]}
          ariaLabel={t.hint}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 8.0], fov: 40 }}>

        {/* FP16 slab — 2 bytes/weight */}
        <Slab position={[-2.4, -0.05, 0]} size={fpSize as [number, number, number]} color={P.teal} fill={mode === "fp16" ? 0.34 : 0.14} />
        <Tag position={[-2.4, 1.05, 0.2]} tone="teal">{t.fp16} · 2 B</Tag>

        {/* Q4 slab — ~0.5 bytes/weight */}
        <Slab position={[0, -0.4, 0]} size={q4Size as [number, number, number]} color={P.amber} fill={mode === "q4" ? 0.34 : 0.14} />
        <Tag position={[0, 0.5, 0.2]} tone="amber">{t.q4} · ~0.5 B</Tag>

        {/* NF4 slab — 4 bits train */}
        <Slab position={[2.4, -0.4, 0]} size={nfSize as [number, number, number]} color={P.violet} fill={mode === "nf4" ? 0.34 : 0.14} />
        <Tag position={[2.4, 0.5, 0.2]} tone="violet">{t.nf4}</Tag>

        {/* Bandwidth arrow on decode — more arrows when Q4 (faster) */}
        {mode === "q4" ? (
          <>
            <Flow points={[[-3.5, -0.4, 0], [-1.0, -0.4, 0]]} color={P.amber} count={6} />
            <Tag position={[0, -1.0, 0.2]} tone="amber">decode: ~4× tokens/s vs FP16</Tag>
          </>
        ) : mode === "nf4" ? (
          <Tag position={[0, -1.0, 0.2]} tone="violet">uso: forward de entrenamiento (QLoRA)</Tag>
        ) : (
          <Tag position={[0, -1.0, 0.2]} tone="teal">bytes/peso — no toques si pasa tu eval</Tag>
        )}

      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Attention: QK^T heatmap, causal mask, multi-head split. */
type Mode = "qk" | "mask" | "heads";

const COPY = {
  en: {
    attention_is_a_soft_choice: "attention is a soft choice",
    qk_mask_heads: "QK^T · causal mask · multi-head",
    qk: "QK^T",
    mask: "causal mask",
    heads: "multi-head",
    each_row_a_distribution: "each row a distribution",
    future_blocked: "future blocked",
    parallel_views: "parallel views",
    head: "head",
  },
  es: {
    attention_is_a_soft_choice: "la atención es una elección suave",
    qk_mask_heads: "QK^T · máscara causal · multi-cabeza",
    qk: "QK^T",
    mask: "máscara causal",
    heads: "multi-cabeza",
    each_row_a_distribution: "cada fila es una distribución",
    future_blocked: "futuro bloqueado",
    parallel_views: "vistas en paralelo",
    head: "cabeza",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("qk");

  const N = 8;
  const heatmap = Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N), c = i % N;
    // soft heat concentrated on the diagonal for illustration
    const v = Math.max(0, 1 - Math.abs(r - c) * 0.25) * (c <= r ? 1 : 0.05);
    return {
      position: [-2.0 + c * 0.45, 1.0 - r * 0.45, 0] as [number, number, number],
      color: v > 0.7 ? P.teal : v > 0.4 ? P.violet : P.muted,
      scale: 0.22 + v * 0.35,
    };
  });

  return (
    <Figure
      label={t.attention_is_a_soft_choice}
      hint={t.qk_mask_heads}
      legend={[
        { color: P.teal, label: t.qk },
        { color: P.rose, label: t.mask },
        { color: P.violet, label: t.heads },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "qk", label: t.qk, tone: P.teal },
            { value: "mask", label: t.mask, tone: P.rose },
            { value: "heads", label: t.heads, tone: P.violet },
          ]}
          ariaLabel={t.attention_is_a_soft_choice}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "qk" && (
          <>
            <Lattice
              cells={heatmap.map((c) => ({ position: c.position, color: c.color }))}
              size={0.32}
              opacity={0.85}
              matte
            />
            <Tag position={[0, 1.8, 0.15]} tone="teal">Q · Kᵀ ≈ α</Tag>
            <Tag position={[0, -1.6, 0.15]} tone="muted" size="xs">{t.each_row_a_distribution}</Tag>
          </>
        )}

        {mode === "mask" && (
          <>
            <Lattice
              cells={heatmap.map((c) => {
                const r = Math.floor((c.position[0] + 2.0) / 0.45);
                const col = Math.floor((1.0 - c.position[1]) / 0.45);
                const blocked = r < col;
                return {
                  ...c,
                  color: blocked ? P.rose : c.color,
                  position: c.position,
                };
              })}
              size={0.32}
              opacity={0.85}
              matte
            />
            {/* the rose fence */}
            <Ribbon
              points={Array.from({ length: 8 }, (_, i) => [-2.0 + i * 0.45, 1.0 - i * 0.45 + 0.22, 0] as [number, number, number])}
              color={P.rose}
              radius={0.03}
              opacity={0.9}
            />
            <Tag position={[0, 1.8, 0.15]} tone="rose">{t.mask}</Tag>
            <Tag position={[1.5, -0.4, 0.15]} tone="rose" size="xs">{t.future_blocked}</Tag>
            <Tag position={[0, -1.6, 0.15]} tone="muted" size="xs">decoder only</Tag>
          </>
        )}

        {mode === "heads" && (
          <>
            {/* three parallel head stacks running the same 8 tokens */}
            {[0, 1, 2].map((h) => (
              <group key={h} position={[(h - 1) * 1.9, 0, 0]}>
                <Slab position={[0, 0.4, 0]} size={[1.5, 1.6, 0.12]} color={[P.teal, P.violet, P.amber][h]} fill={0.18} />
                <Tag position={[0, 1.5, 0.15]} tone={[P.teal, P.violet, P.amber][h] === P.teal ? "teal" : [P.teal, P.violet, P.amber][h] === P.violet ? "violet" : "amber"} size="xs">
                  {t.head} {h + 1}
                </Tag>
                <Lattice
                  cells={Array.from({ length: 4 }, (_, i) => ({
                    position: [-0.55 + i * 0.37, 0.55, 0.1] as [number, number, number],
                    color: [P.teal, P.violet, P.amber][h],
                  }))}
                  size={0.13}
                  opacity={0.9}
                  matte
                />
              </group>
            ))}
            {/* all converge */}
            <Ribbon
              points={[[-1.9, -0.4, 0], [-0.6, -0.9, 0], [0.6, -0.9, 0], [1.9, -0.4, 0]]}
              color={P.lineStrong}
              radius={0.02}
              opacity={0.5}
            />
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">{t.parallel_views}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

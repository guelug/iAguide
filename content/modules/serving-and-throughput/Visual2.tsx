"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* serving: batching timeline, KV paging, speculative decoding. */
type Mode = "batching" | "paging" | "spec";

const COPY = {
  en: {
    throughput_is_batching_paged_kv_drafts: "throughput is batching + paged KV + drafts",
    the_trinity_of_fast_inference: "the trinity of fast inference",
    batching: "continuous batching",
    paging: "paged attention",
    spec: "speculative",
    joins: "joins",
    leaves: "leaves",
    draft: "draft",
    verify: "verify",
    accepted: "accepted",
    rejected: "rejected",
    pages: "pages",
  },
  es: {
    throughput_is_batching_paged_kv_drafts: "el throughput es batching + KV paginada + borradores",
    the_trinity_of_fast_inference: "la trinidad de la inferencia rápida",
    batching: "batching continuo",
    paging: "atención paginada",
    spec: "especulativa",
    joins: "entra",
    leaves: "sale",
    draft: "borrador",
    verify: "verifica",
    accepted: "aceptado",
    rejected: "rechazado",
    pages: "páginas",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("batching");

  return (
    <Figure
      label={t.throughput_is_batching_paged_kv_drafts}
      hint={t.throughput_is_batching_paged_kv_drafts}
      legend={[
        { color: P.teal, label: t.batching },
        { color: P.violet, label: t.paging },
        { color: P.amber, label: t.spec },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "batching", label: t.batching, tone: P.teal },
            { value: "paging", label: t.paging, tone: P.violet },
            { value: "spec", label: t.spec, tone: P.amber },
          ]}
          ariaLabel={t.throughput_is_batching_paged_kv_drafts}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "batching" && (
          <>
            {/* requests joining / leaving */}
            <Wire points={[[-2.5, 0.9, 0], [2.5, 0.9, 0]]} color={P.lineStrong} opacity={0.5} />
            {[0, 1, 2, 3, 4].map((i) => (
              <group key={i}>
                <Wire
                  points={[[-2.2 + i * 0.4, 0.9, 0], [1.9 + i * 0.1, 0.9, 0]]}
                  color={i === 4 ? P.rose : P.teal}
                  width={5}
                  opacity={0.8}
                />
                {i < 4 && <Node3D position={[-2.2 + i * 0.4, 0.9, 0]} color={P.teal} radius={0.08} pulse={i * 0.3} />}
              </group>
            ))}
            <Tag position={[-2.5, 1.3, 0.15]} tone="teal" size="xs">{t.joins}</Tag>
            <Tag position={[2.5, 1.3, 0.15]} tone="rose" size="xs">{t.leaves}</Tag>
            {/* decode slab underneath */}
            <Slab position={[0, -0.5, 0]} size={[4.6, 0.95, 0.14]} color={P.violet} fill={0.18} />
            <Tag position={[0, -1.05, 0.15]} tone="violet">decode step</Tag>
            <Tag position={[0, -1.55, 0.15]} tone="muted" size="xs">gpu busy</Tag>
          </>
        )}

        {mode === "paging" && (
          <>
            <Lattice
              cells={Array.from({ length: 24 }, (_, i) => ({
                position: [-2.4 + (i % 8) * 0.62, 0.7 - Math.floor(i / 8) * 0.55, 0] as [number, number, number],
                color: i % 5 === 0 ? P.muted : i % 3 === 0 ? P.violet : P.teal,
              }))}
              size={0.26}
              opacity={0.9}
            />
            <Tag position={[0, 1.4, 0.15]} tone="violet">{t.paging}</Tag>
            <Tag position={[2.5, 0.2, 0.15]} tone="muted" size="xs">{t.pages}</Tag>
            {/* virtual to physical mapping */}
            <Slab position={[-2.6, -0.95, 0]} size={[1.4, 0.5, 0.1]} color={P.amber} fill={0.24} />
            <Tag position={[-2.6, -0.55, 0.15]} tone="amber" size="xs">seq</Tag>
            <Wire points={[[-2.0, -0.85, 0], [-1.8, 0.55, 0]]} color={P.lineStrong} dashed opacity={0.6} />
          </>
        )}

        {mode === "spec" && (
          <>
            {/* draft model small and fast */}
            <Slab position={[-1.9, 0.5, 0]} size={[1.5, 0.7, 0.12]} color={P.teal} fill={0.32} />
            <Tag position={[-1.9, 1.05, 0.15]} tone="teal" size="xs">{t.draft}</Tag>
            {/* big verifier */}
            <Slab position={[0.7, 0.5, 0]} size={[2.6, 1.2, 0.16]} color={P.violet} fill={0.18} />
            <Tag position={[0.7, 1.35, 0.15]} tone="violet">{t.verify}</Tag>
            {/* ribbon from draft → verify */}
            <Ribbon points={[[-1.1, 0.55, 0], [-0.4, 0.55, 0], [-0.4, 0.55, 0]]} color={P.teal} radius={0.04} opacity={0.85} />
            {/* accepted / rejected */}
            <Node3D position={[2.7, 0.9, 0]} color={P.teal} radius={0.14} pulse={0.2} />
            <Tag position={[2.7, 1.3, 0.15]} tone="teal" size="xs">{t.accepted}</Tag>
            <Node3D position={[2.7, 0.1, 0]} color={P.rose} radius={0.14} pulse={0.5} />
            <Tag position={[2.7, -0.4, 0.15]} tone="rose" size="xs">{t.rejected}</Tag>
            {/* the trick: one forward of verifier covers many draft steps */}
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">1 fwd = N tokens</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

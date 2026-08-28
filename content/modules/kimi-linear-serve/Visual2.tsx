"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Serving Kimi Linear: two engine phases, paged KV, continuous batching. */
type Mode = "phases" | "paged" | "batch";

const COPY = {
  en: {
    serving_the_hybrid: "serving the hybrid",
    prefill_decode_pages_and_a_busy_gpu: "prefill, decode, pages — and a busy GPU",
    phases: "two phases",
    paged: "paged kv",
    batching: "batching",
    prefill: "prefill",
    decode: "decode",
    pages: "pages",
    virtual: "virtual",
    physical: "physical",
    batch: "batch",
    joins: "joins",
    leaves: "leaves",
    idle: "idle",
    busy: "busy",
  },
  es: {
    serving_the_hybrid: "sirviendo el híbrido",
    prefill_decode_pages_and_a_busy_gpu: "prefill, decode, páginas — y una GPU ocupada",
    phases: "dos fases",
    paged: "kv paginada",
    batching: "batching",
    prefill: "prefill",
    decode: "decode",
    pages: "páginas",
    virtual: "virtual",
    physical: "física",
    batch: "lote",
    joins: "entra",
    leaves: "sale",
    idle: "ociosa",
    busy: "ocupada",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("phases");

  // physical KV pages, some assigned
  const pages = Array.from({ length: 24 }, (_, i) => ({
    position: [-2.4 + (i % 8) * 0.62, 0.3 - Math.floor(i / 8) * 0.5, 0] as [number, number, number],
    color: i % 5 === 0 ? P.muted : i % 3 === 0 ? P.violet : P.teal,
  }));

  return (
    <Figure
      label={t.serving_the_hybrid}
      hint={t.prefill_decode_pages_and_a_busy_gpu}
      legend={[
        { color: P.teal, label: t.prefill },
        { color: P.amber, label: t.decode },
        { color: P.violet, label: t.paged },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "phases", label: t.phases, tone: P.teal },
            { value: "paged", label: t.paged, tone: P.violet },
            { value: "batch", label: t.batching, tone: P.amber },
          ]}
          ariaLabel={t.serving_the_hybrid}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "phases" && (
          <>
            {/* prefill: all prompt tokens at once through the stack */}
            <Slab position={[-1.9, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.teal} fill={0.16} />
            <Tag position={[-1.9, 1.55, 0.15]} tone="teal">{t.prefill}</Tag>
            <Lattice
              cells={Array.from({ length: 16 }, (_, i) => ({
                position: [-2.65 + (i % 4) * 0.5, 1.0 - Math.floor(i / 4) * 0.33, 0.15] as [number, number, number],
                color: P.teal,
              }))}
              size={0.11}
              opacity={0.95}
              matte
            />
            <Tag position={[-1.9, -0.4, 0.15]} tone="muted" size="xs">throughput</Tag>
            {/* decode: one token per step */}
            <Slab position={[1.9, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.amber} fill={0.16} />
            <Tag position={[1.9, 1.55, 0.15]} tone="amber">{t.decode}</Tag>
            {[0, 1, 2, 3].map((i) => (
              <Node3D key={i} position={[1.25 + i * 0.45, 0.5, 0.15]} color={P.amber} radius={0.12} pulse={i * 0.3} />
            ))}
            <Tag position={[1.9, -0.4, 0.15]} tone="muted" size="xs">latency</Tag>
            {/* the KV handoff */}
            <Flow points={[[-0.7, 0.5, 0], [0.7, 0.5, 0]]} color={P.violet} count={3} />
            <Tag position={[0, 1.05, 0.15]} tone="violet" size="xs">kv</Tag>
          </>
        )}

        {mode === "paged" && (
          <>
            {/* virtual address space of one sequence */}
            <Slab position={[-2.3, 0.5, 0]} size={[1.6, 1.8, 0.12]} color={P.violet} fill={0.14} />
            <Tag position={[-2.3, 1.6, 0.15]} tone="violet" size="xs">{t.virtual}</Tag>
            {Array.from({ length: 5 }, (_, i) => (
              <Node3D key={i} position={[-2.3, 1.2 - i * 0.36, 0.15]} color={P.violet} radius={0.1} matte />
            ))}
            {/* arrows scatter to physical pages */}
            {[0, 1, 2, 3].map((i) => (
              <Wire
                key={i}
                points={[[-1.5, 1.05 - i * 0.36, 0], [-1.0 + (i % 2) * 0.6, 0.3 - Math.floor(i / 2) * 0.5, 0]]}
                color={P.lineStrong}
                opacity={0.5}
                dashed
              />
            ))}
            <Lattice cells={pages} size={0.24} opacity={0.9} />
            <Tag position={[0, -0.95, 0.15]} tone="muted" size="xs">{t.physical}</Tag>
            <Tag position={[2.2, 0.6, 0.15]} tone="violet" size="xs">{t.pages}</Tag>
          </>
        )}

        {mode === "batch" && (
          <>
            {/* request timelines: some join, some leave, gpu stays busy */}
            {[0, 1, 2, 3].map((row) => (
              <group key={row}>
                <Wire
                  points={[[-2.4, 1.3 - row * 0.55, 0], [2.4, 1.3 - row * 0.55, 0]]}
                  color={P.lineStrong}
                  opacity={0.3}
                />
                {/* each row: active segment */}
                <Wire
                  points={[[-1.5 + row * 0.35, 1.3 - row * 0.55, 0], [1.9 - row * 0.2, 1.3 - row * 0.55, 0]]}
                  color={row === 3 ? P.rose : P.teal}
                  width={5}
                  opacity={0.8}
                />
                <Node3D position={[-1.5 + row * 0.35, 1.3 - row * 0.55, 0]} color={P.teal} radius={0.08} pulse={0.2} />
                <Node3D position={[1.9 - row * 0.2, 1.3 - row * 0.55, 0]} color={row === 3 ? P.rose : P.amber} radius={0.08} />
              </group>
            ))}
            <Tag position={[-2.4, 1.7, 0.15]} tone="teal" size="xs">{t.batch}</Tag>
            <Tag position={[2.5, 0.3, 0.15]} tone="amber" size="xs">{t.busy}</Tag>
            {/* new request joining mid-flight */}
            <Flow points={[[-2.7, -0.6, 0], [-1.3, -0.3, 0]]} color={P.amber} count={2} size={0.05} />
            <Tag position={[-2.2, -0.95, 0.15]} tone="amber" size="xs">{t.joins}</Tag>
            {/* one leaving */}
            <Flow points={[[2.0, -0.5, 0], [2.6, -1.0, 0]]} color={P.rose} count={2} size={0.05} />
            <Tag position={[2.5, -1.35, 0.15]} tone="rose" size="xs">{t.leaves}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

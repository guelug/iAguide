"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "stuff" | "index" | "moe";

export default function Visual() {
  const t = useCopy({
    en: {
      "six_seats_at_the_context_table": "six seats at the context table",
      "skills_index": "skills index",
      "retrieved": "retrieved",
      "memory_snapshot": "memory snapshot",
      "stable_prefix": "stable prefix",
      "index_load": "Index+load"
    },
    es: {
      "six_seats_at_the_context_table": "seis sillas en la mesa del contexto",
      "skills_index": "índice de skills",
      "retrieved": "recuperado",
      "memory_snapshot": "instantánea de memoria",
      "stable_prefix": "prefijo estable",
      "index_load": "Índice+carga"
    },
  });

  const SEATS = [
    { id: "policy", label: "system policy", tone: P.teal },
    { id: "schemas", label: "tool schemas", tone: P.teal },
    { id: "skills", label: t.skills_index, tone: P.lineStrong },
    { id: "retrieved", label: t.retrieved, tone: P.amber },
    { id: "thread", label: "thread", tone: P.lineStrong },
    { id: "memory", label: t.memory_snapshot, tone: P.violet }
  ] as const;
  const [mode, setMode] = useState<Mode>("stuff");
  return (
    <Figure
      label={t.six_seats_at_the_context_table}
      hint="stable vs volatile vs ephemeral"
      legend={[
        { color: P.teal, label: t.stable_prefix },
        { color: P.amber, label: "volatile (retrieved)" },
        { color: P.violet, label: t.memory_snapshot }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "stuff", label: "Stuff", tone: P.amber },
            { value: "index", label: t.index_load, tone: P.teal },
            { value: "moe", label: "A3B note", tone: P.violet }
          ]}
          ariaLabel="context budget selector"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        <Slab position={[0, 1.05, 0]} size={[6.4, 0.32, 0.08]} color={P.teal} fill={0.22} />
        <Tag position={[0, 1.45, 0.05]} tone="teal" size="sm">stable prefix · cache hits here</Tag>

        <Wire points={[[-3.2, 1.05, 0], [3.2, 1.05, 0]]} color={P.line} opacity={0.5} />

        {SEATS.map((seat, i) => {
          const x = -2.95 + i * 1.18;
          const isVolatile = seat.id === "retrieved" || seat.id === "thread";
          const isHighlight = mode === "stuff" && seat.id === "retrieved"
            ? true
            : mode === "index" && seat.id === "skills"
            ? true
            : false;
          return (
            <group key={seat.id}>
              <Slab position={[x, 0.05, 0]} size={[1.05, 1.6, 0.1]} color={seat.tone} fill={isHighlight ? 0.5 : 0.18} />
              <Tag position={[x, 0.95, 0.05]} tone={seat.id === "skills" ? "teal" : seat.id === "memory" ? "violet" : "muted"} size="xs">
                {seat.label}
              </Tag>
              {isVolatile && (
                <Node3D position={[x, 0.05, 0.18]} color={seat.tone} radius={0.07} pulse={isHighlight ? 0.4 : 0} />
              )}
            </group>
          );
        })}

        <Slab position={[0, -1.35, 0]} size={[6.4, 0.32, 0.08]} color={P.lineStrong} fill={0.12} />
        <Tag position={[0, -1.7, 0.05]} tone="muted" size="sm">
          {mode === "stuff"
            ? "stuffed repo → 30k prefill · cache dies on every change"
            : mode === "index"
            ? "name in index, body in load_skill · 1k prefill, body paid on call"
            : "48B-A3B: 48B on disk · ~3B active/token · attention still scales with prefix"}
        </Tag>

        {mode === "stuff" && (
          <Flow points={[[-3.2, -1.35, 0], [3.2, -1.35, 0]]} color={P.amber} count={6} />
        )}
        {mode === "index" && (
          <Flow points={[[-1.77, -1.35, 0], [-0.59, -1.35, 0], [0.59, -1.35, 0], [1.77, -1.35, 0]]} color={P.teal} count={4} />
        )}
        {mode === "moe" && (
          <Node3D position={[2.4, 0.05, 0]} color={P.violet} radius={0.14} pulse={0.35} />
        )}
      </Stage>
    </Figure>
  );
}

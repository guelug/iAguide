"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* context-engineering: assembly, ranking candidates, budget meter. */
type Mode = "assembly" | "rank" | "budget";

const COPY = {
  en: {
    prompt_is_a_budgeted_artifact: "prompt is a budgeted artifact",
    assembly_rank_budget: "assembly · rank · budget",
    assembly: "assembly",
    rank: "rank",
    budget: "budget",
    system: "system",
    retrieved: "retrieved",
    history: "history",
    tools: "tools",
    candidates: "candidates",
    relevance: "relevance",
    full: "full",
  },
  es: {
    prompt_is_a_budgeted_artifact: "el prompt es un artefacto con presupuesto",
    assembly_rank_budget: "montaje · rank · presupuesto",
    assembly: "montaje",
    rank: "rank",
    budget: "presupuesto",
    system: "sistema",
    retrieved: "recuperado",
    history: "historial",
    tools: "tools",
    candidates: "candidatos",
    relevance: "relevancia",
    full: "lleno",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("assembly");

  return (
    <Figure
      label={t.prompt_is_a_budgeted_artifact}
      hint={t.assembly_rank_budget}
      legend={[
        { color: P.violet, label: t.system },
        { color: P.teal, label: t.retrieved },
        { color: P.amber, label: t.history },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "assembly", label: t.assembly, tone: P.violet },
            { value: "rank", label: t.rank, tone: P.teal },
            { value: "budget", label: t.budget, tone: P.amber },
          ]}
          ariaLabel={t.prompt_is_a_budgeted_artifact}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "assembly" && (
          <>
            {/* four sources converge on a final prompt slab */}
            {(
              [
                [t.system, P.violet, -2.4, 0.95],
                [t.retrieved, P.teal, -2.4, 0.25],
                [t.history, P.amber, -2.4, -0.45],
                [t.tools, P.rose, -2.4, -1.15],
              ] as const
            ).map(([lab, col, x, y]) => (
              <group key={lab}>
                <Slab position={[x, y, 0]} size={[1.6, 0.5, 0.12]} color={col} fill={0.24} />
                <Tag position={[x, y + 0.45, 0.15]} tone={col === P.violet ? "violet" : col === P.teal ? "teal" : col === P.amber ? "amber" : "rose"} size="xs">
                  {lab}
                </Tag>
                <Ribbon
                  points={[[x + 0.85, y, 0], [-0.6, 0, 0]]}
                  color={col}
                  radius={0.03}
                  opacity={0.7}
                />
              </group>
            ))}
            <Slab position={[0.6, 0, 0]} size={[1.6, 1.5, 0.15]} color={P.teal} fill={0.22} rim={0.7} />
            <Tag position={[0.6, 0.65, 0.15]} tone="teal" size="xs">prompt</Tag>
            <Ribbon points={[[1.4, 0, 0], [2.6, 0, 0]]} color={P.lineStrong} radius={0.04} opacity={0.9} />
            <Slab position={[2.6, 0, 0]} size={[0.7, 1.0, 0.12]} color={P.muted} fill={0.2} />
            <Tag position={[2.6, 1.05, 0.15]} tone="muted" size="xs">→ model</Tag>
          </>
        )}

        {mode === "rank" && (
          <>
            {/* 8 candidates sorted by relevance, top 3 highlighted */}
            {Array.from({ length: 8 }, (_, i) => {
              const rel = 0.95 - i * 0.11;
              return (
                <group key={i}>
                  <Slab
                    position={[-2.3 + i * 0.62, 0.4, 0]}
                    size={[0.55, 0.5, 0.1]}
                    color={i < 3 ? P.teal : P.muted}
                    fill={i < 3 ? 0.3 : 0.1}
                  />
                  <Tag position={[-2.3 + i * 0.62, 0.85, 0.15]} tone={i < 3 ? "teal" : "muted"} size="xs">
                    {Math.round(rel * 100)}
                  </Tag>
                </group>
              );
            })}
            <Wire points={[[-2.6, 0.1, 0], [2.8, 0.1, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[2.7, -0.3, 0.15]} tone="muted" size="xs">{t.relevance}</Tag>
            <Halo position={[-0.95, 0.4, 0]} radius={1.0} color={P.teal} opacity={0.45} spin={0.15} />
          </>
        )}

        {mode === "budget" && (
          <>
            {/* a context bar filling up, then saturating */}
            <Slab position={[0, 0.5, 0]} size={[3.8, 0.7, 0.14]} color={P.teal} fill={0.18} rim={0.7} />
            <Slab position={[-1.1, 0.5, 0.1]} size={[1.6, 0.7, 0.06]} color={P.amber} fill={0.5} />
            <Tag position={[0, 1.55, 0.15]} tone="amber" size="xs">64k / 200k</Tag>
            <Slab position={[0, -0.4, 0]} size={[3.8, 0.7, 0.14]} color={P.rose} fill={0.18} rim={0.7} />
            <Slab position={[-0.1, -0.4, 0.1]} size={[3.6, 0.7, 0.06]} color={P.rose} fill={0.55} />
            <Tag position={[0, 0.5, 0.15]} tone="rose" size="xs">{t.full}</Tag>
            <Ribbon points={[[1.0, -0.4, 0], [1.5, -1.0, 0]]} color={P.rose} radius={0.04} opacity={0.85} />
            <Tag position={[1.8, -1.3, 0.15]} tone="rose" size="xs">compact</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

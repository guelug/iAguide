"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "unit" | "loop" | "outcome";

export default function Visual() {
  const t = useCopy({
    en: {
      "three_layers_of_an_eval": "three layers of an eval",
      "unit_tests_don_t_pay_prefill_or_decode": "unit tests don't pay prefill or decode",
      "unit_no_model": "unit (no model)",
      "loop_stubbed_tools": "loop (stubbed tools)",
      "outcome_real_run": "outcome (real run)",
      "unit": "Unit",
      "loop": "Loop",
      "outcome": "Outcome"
    },
    es: {
      "three_layers_of_an_eval": "tres capas de una eval",
      "unit_tests_don_t_pay_prefill_or_decode": "los tests unitarios no pagan prefill ni decode",
      "unit_no_model": "unidad (sin modelo)",
      "loop_stubbed_tools": "bucle (tools stub)",
      "outcome_real_run": "resultado (run real)",
      "unit": "Unidad",
      "loop": "Bucle",
      "outcome": "Resultado"
    },
  });
  const [mode, setMode] = useState<Mode>("unit");
  return (
    <Figure
      label={t.three_layers_of_an_eval}
      hint={t.unit_tests_don_t_pay_prefill_or_decode}
      legend={[
        { color: P.teal, label: t.unit_no_model },
        { color: P.amber, label: t.loop_stubbed_tools },
        { color: P.violet, label: t.outcome_real_run }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "unit", label: t.unit, tone: P.teal },
            { value: "loop", label: t.loop, tone: P.amber },
            { value: "outcome", label: t.outcome, tone: P.violet }
          ]}
          ariaLabel="eval layer selector"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        <Wire points={[[-3.0, -0.5, 0], [3.0, -0.5, 0]]} color={P.line} opacity={0.5} />
        <Tag position={[-3.0, 0.0, 0.0]} tone="muted" size="xs">rows</Tag>
        <Tag position={[3.0, 0.0, 0.0]} tone="muted" size="xs">score</Tag>

        {(["unit", "loop", "outcome"] as const).map((layer, i) => {
          const x = -2.2 + i * 2.2;
          const tone = layer === "unit" ? P.teal : layer === "loop" ? P.amber : P.violet;
          const tagTone: "teal" | "amber" | "violet" =
            layer === "unit" ? "teal" : layer === "loop" ? "amber" : "violet";
          const label = layer === "unit" ? "allow / parse / stop" : layer === "loop" ? "row + stubs" : "real env";
          const isActive = layer === mode;
          return (
            <group key={layer}>
              <Slab position={[x, 0.7, 0]} size={[1.85, 1.3, 0.12]} color={tone} fill={isActive ? 0.55 : 0.18} />
              <Tag position={[x, 1.45, 0.05]} tone={tagTone}>{layer}</Tag>
              <Tag position={[x, 0.35, 0.05]} tone="muted" size="xs">{label}</Tag>
              {isActive && (
                <Node3D position={[x, 0.7, 0.25]} color={tone} radius={0.12} pulse={0.4} />
              )}
            </group>
          );
        })}

        <Flow points={[[-3.0, -0.5, 0], [-2.2, -0.5, 0], [0.0, -0.5, 0], [2.2, -0.5, 0], [3.0, -0.5, 0]]} color={mode === "unit" ? P.teal : mode === "loop" ? P.amber : P.violet} count={6} speed={0.35} />

        <Slab position={[0, -1.4, 0]} size={[5.4, 0.45, 0.08]} color={mode === "unit" ? P.teal : mode === "loop" ? P.amber : P.violet} fill={0.18} />
        <Tag position={[0, -1.4, 0.05]} tone="muted" size="xs">
          {mode === "unit" ? "sub-ms · no GPU · no API key · 3 fixtures" : mode === "loop" ? "seconds · tokens · 5–20 rows · stubs with errors" : "minutes · tokens · 20–466 rows · GAIA-shape"}
        </Tag>
      </Stage>
    </Figure>
  );
}

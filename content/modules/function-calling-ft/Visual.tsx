"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "prompt" | "ft" | "schema";

export default function Visual() {
  const t = useCopy({
    en: {
      "prompted_vs_learned_calls": "prompted vs learned calls",
      "special_tokens_for_tools": "special tokens for tools",
      "prompted": "prompted",
      "fix_schema": "fix schema",
      "prompted_2": "Prompted",
      "fix_schema_2": "Fix schema"
    },
    es: {
      "prompted_vs_learned_calls": "llamadas por prompt vs aprendidas",
      "special_tokens_for_tools": "tokens especiales para tools",
      "prompted": "por prompt",
      "fix_schema": "arregla el schema",
      "prompted_2": "Por prompt",
      "fix_schema_2": "Arregla el schema"
    },
  });
  const [mode, setMode] = useState<Mode>("prompt");
  return (
    <Figure
      label={t.prompted_vs_learned_calls}
      hint={t.special_tokens_for_tools}
      legend={[
          { color: P.amber, label: t.prompted },
          { color: P.teal, label: "fine-tuned" },
          { color: P.rose, label: t.fix_schema }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "prompt", label: t.prompted_2, tone: P.amber },
            { value: "ft", label: "Fine-tuned", tone: P.teal },
            { value: "schema", label: t.fix_schema_2, tone: P.rose }
          ]}
          ariaLabel={t.special_tokens_for_tools}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.25, 0]} size={[2.1, 1.8, 0.12]} color={P.amber} fill={mode === "prompt" ? 0.3 : 0.12} />
        <Tag position={[-2.2, 1.3, 0.2]} tone="amber">system list</Tag>
        <Slab position={[2.2, 0.25, 0]} size={[2.1, 1.8, 0.12]} color={mode === "schema" ? P.rose : P.teal} fill={0.28} />
        <Tag position={[2.2, 1.3, 0.2]} tone={mode === "schema" ? "rose" : "teal"}>{mode === "schema" ? "broken JSON" : "tool tokens"}</Tag>
        <Node3D position={[0, 0.25, 0]} color={P.violet} radius={0.2} pulse={mode === "ft" ? 0.35 : 0} />
        <Tag position={[0, -0.4, 0.2]} tone="violet">{mode === "ft" ? "SFT on pairs" : "model"}</Tag>
    
      </Stage>
    </Figure>
  );
}

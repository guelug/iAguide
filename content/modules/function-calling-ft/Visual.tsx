"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "prompt" | "ft" | "schema";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("prompt");
  return (
    <Figure
      label="prompted vs learned calls"
      hint="special tokens for tools"
      legend={[
          { color: P.amber, label: "prompted" },
          { color: P.teal, label: "fine-tuned" },
          { color: P.rose, label: "fix schema" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "prompt", label: "Prompted", tone: P.amber },
            { value: "ft", label: "Fine-tuned", tone: P.teal },
            { value: "schema", label: "Fix schema", tone: P.rose }
          ]}
          ariaLabel="special tokens for tools"
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

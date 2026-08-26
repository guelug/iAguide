"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "sft" | "dpo" | "grpo";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("sft");
  return (
    <Figure
      label="preference · group"
      hint="which completion is less bad"
      legend={[
          { color: P.teal, label: "sft" },
          { color: P.amber, label: "dpo" },
          { color: P.violet, label: "grpo" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "sft", label: "SFT", tone: P.teal },
            { value: "dpo", label: "DPO", tone: P.amber },
            { value: "grpo", label: "GRPO", tone: P.violet }
          ]}
          ariaLabel="which completion is less bad"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.3, 0]} size={[1.8, 1.6, 0.12]} color={P.teal} fill={0.2} />
        <Tag position={[-2.2, 1.25, 0.2]} tone="teal">chosen</Tag>
        <Slab position={[0, 0.3, 0]} size={[1.8, 1.6, 0.12]} color={P.amber} fill={mode !== "sft" ? 0.28 : 0.1} />
        <Tag position={[0, 1.25, 0.2]} tone="amber">rejected</Tag>
        <Slab position={[2.2, 0.3, 0]} size={[1.8, 1.6, 0.12]} color={P.violet} fill={mode === "grpo" ? 0.3 : 0.1} />
        <Tag position={[2.2, 1.25, 0.2]} tone="violet">{mode === "grpo" ? "group of N" : "policy"}</Tag>
        <Flow points={[[-1.25, 0.3, 0], [-0.95, 0.3, 0]]} color={P.amber} count={2} />
        <Flow points={[[0.95, 0.3, 0], [1.25, 0.3, 0]]} color={P.violet} count={2} />
    
      </Stage>
    </Figure>
  );
}

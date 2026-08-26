"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "base" | "lora" | "merge";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("base");
  return (
    <Figure
      label="LoRA delta"
      hint="a thin rectangle, not a new brain"
      legend={[
          { color: P.teal, label: "frozen w" },
          { color: P.amber, label: "ba" },
          { color: P.violet, label: "served" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "base", label: "Frozen W", tone: P.teal },
            { value: "lora", label: "BA", tone: P.amber },
            { value: "merge", label: "Served", tone: P.violet }
          ]}
          ariaLabel="a thin rectangle, not a new brain"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-1.8, 0.2, 0]} size={[2.2, 1.8, 0.12]} color={P.teal} fill={0.2} />
        <Tag position={[-1.8, 1.25, 0.2]} tone="teal">W frozen</Tag>
        <Slab position={[1.6, 0.55, 0]} size={[1.5, 0.7, 0.1]} color={P.amber} fill={mode !== "base" ? 0.35 : 0.1} />
        <Slab position={[1.6, -0.35, 0]} size={[1.5, 0.7, 0.1]} color={P.amber} fill={mode !== "base" ? 0.35 : 0.1} />
        <Tag position={[1.6, 1.15, 0.2]} tone="amber">B · A</Tag>
        {mode === "merge" ? <Tag position={[0, -1.35, 0.2]} tone="violet">W + (α/r) BA</Tag> : null}
        <Flow points={[[-0.65, 0.2, 0], [0.8, 0.2, 0]]} color={P.amber} count={3} paused={mode === "base"} />
    
      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "open" | "closed" | "moe";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("open");
  return (
    <Figure
      label="read the card"
      hint="step the figure"
      legend={[
          { color: P.teal, label: "open weights" },
          { color: P.amber, label: "api" },
          { color: P.violet, label: "moe" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "open", label: "Open weights", tone: P.teal },
            { value: "closed", label: "API", tone: P.amber },
            { value: "moe", label: "MoE", tone: P.violet }
          ]}
          ariaLabel="step the figure"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.teal} fill={mode === "open" ? 0.34 : 0.12} />
        <Tag position={[-2.2, 1.2, 0.2]} tone="teal">Open weights</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.amber} fill={mode === "closed" ? 0.34 : 0.12} />
        <Tag position={[0, 1.2, 0.2]} tone="amber">API</Tag>
        <Slab position={[2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.violet} fill={mode === "moe" ? 0.34 : 0.12} />
        <Tag position={[2.2, 1.2, 0.2]} tone="violet">MoE</Tag>
        <Flow points={[[-1.2, 0.2, 0], [-0.95, 0.2, 0]]} color={P.teal} count={2} />
        <Flow points={[[1.0, 0.2, 0], [1.25, 0.2, 0]]} color={P.amber} count={2} />
        
      </Stage>
    </Figure>
  );
}

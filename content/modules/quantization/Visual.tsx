"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "fp16" | "q4" | "nf4";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("fp16");
  return (
    <Figure
      label="same W, fewer bits"
      hint="step the figure"
      legend={[
          { color: P.teal, label: "fp16" },
          { color: P.amber, label: "q4" },
          { color: P.violet, label: "nf4 train" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "fp16", label: "FP16", tone: P.teal },
            { value: "q4", label: "Q4", tone: P.amber },
            { value: "nf4", label: "NF4 train", tone: P.violet }
          ]}
          ariaLabel="step the figure"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.teal} fill={mode === "fp16" ? 0.34 : 0.12} />
        <Tag position={[-2.2, 1.2, 0.2]} tone="teal">FP16</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.amber} fill={mode === "q4" ? 0.34 : 0.12} />
        <Tag position={[0, 1.2, 0.2]} tone="amber">Q4</Tag>
        <Slab position={[2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.violet} fill={mode === "nf4" ? 0.34 : 0.12} />
        <Tag position={[2.2, 1.2, 0.2]} tone="violet">NF4 train</Tag>
        <Flow points={[[-1.2, 0.2, 0], [-0.95, 0.2, 0]]} color={P.teal} count={2} />
        <Flow points={[[1.0, 0.2, 0], [1.25, 0.2, 0]]} color={P.amber} count={2} />
        
      </Stage>
    </Figure>
  );
}

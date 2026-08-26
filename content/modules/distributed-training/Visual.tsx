"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "data" | "tensor" | "pipe";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("data");
  return (
    <Figure
      label="split the work"
      hint="data · tensor · pipeline"
      legend={[
          { color: P.teal, label: "data parallel" },
          { color: P.amber, label: "tensor" },
          { color: P.violet, label: "pipeline" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "data", label: "Data parallel", tone: P.teal },
            { value: "tensor", label: "Tensor", tone: P.amber },
            { value: "pipe", label: "Pipeline", tone: P.violet }
          ]}
          ariaLabel="data · tensor · pipeline"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        {Array.from({ length: 4 }).map((_, i) => (
          <Slab key={i} position={[-2.1 + i * 1.4, mode === "pipe" ? 0.7 - (i % 2) * 1.1 : 0.15, 0]} size={mode === "tensor" ? [1.0, 1.4, 0.1] : [1.1, 1.1, 0.1]} color={i % 2 ? P.amber : P.teal} fill={0.24} />
        ))}
        {mode === "data" ? <Flow points={[[-2.6, -1.2, 0], [2.6, -1.2, 0]]} color={P.teal} count={4} /> : null}
        {mode === "tensor" ? <Tag position={[0, -1.35, 0.2]} tone="amber">one layer, split weights</Tag> : null}
        {mode === "pipe" ? <Tag position={[0, -1.35, 0.2]} tone="violet">microbatches down the stages</Tag> : null}
    
      </Stage>
    </Figure>
  );
}

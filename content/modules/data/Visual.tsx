"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "raw" | "clean" | "mix";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("raw");
  return (
    <Figure
      label="corpus hygiene"
      hint="dedup, filter, licence, mix"
      legend={[
          { color: P.rose, label: "raw dump" },
          { color: P.teal, label: "filtered" },
          { color: P.violet, label: "mix" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "raw", label: "Raw dump", tone: P.rose },
            { value: "clean", label: "Filtered", tone: P.teal },
            { value: "mix", label: "Mix", tone: P.violet }
          ]}
          ariaLabel="dedup, filter, licence, mix"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        {Array.from({ length: 12 }).map((_, i) => (
          <Node3D key={i} position={[-2.4 + (i % 4) * 0.55, 0.8 - Math.floor(i / 4) * 0.55, 0]} color={mode === "raw" ? P.rose : i % 3 === 0 && mode !== "mix" ? P.line : P.teal} radius={0.12} matte />
        ))}
        <Slab position={[2.0, 0.15, 0]} size={[2.2, 1.8, 0.12]} color={mode === "mix" ? P.violet : P.teal} fill={0.22} />
        <Tag position={[2.0, 1.2, 0.2]} tone={mode === "mix" ? "violet" : "teal"}>{mode === "raw" ? "contaminated" : "train mix"}</Tag>
        <Flow points={[[-0.5, 0.15, 0], [0.85, 0.15, 0]]} color={P.teal} count={3} paused={mode === "raw"} />
    
      </Stage>
    </Figure>
  );
}

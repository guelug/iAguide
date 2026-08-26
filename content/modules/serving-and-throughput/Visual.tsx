"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "one" | "batch" | "spec";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("one");
  return (
    <Figure
      label="batch · paged KV"
      hint="fast for you is not cheap for everyone"
      legend={[
          { color: P.teal, label: "one user" },
          { color: P.amber, label: "continuous batch" },
          { color: P.violet, label: "speculative" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "one", label: "One user", tone: P.teal },
            { value: "batch", label: "Continuous batch", tone: P.amber },
            { value: "spec", label: "Speculative", tone: P.violet }
          ]}
          ariaLabel="fast for you is not cheap for everyone"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        {Array.from({ length: mode === "one" ? 1 : 4 }).map((_, i) => (
          <Slab key={i} position={[-2.2 + i * 1.5, 0.35, 0]} size={[1.2, 1.5, 0.1]} color={i === 0 ? P.teal : P.amber} fill={0.24} />
        ))}
        <Tag position={[0, -1.15, 0.2]} tone={mode === "spec" ? "violet" : "amber"}>
          {mode === "spec" ? "draft + verify" : mode === "batch" ? "shared GPU, paged KV" : "idle SM"}
        </Tag>
        {mode !== "one" ? <Flow points={[[-2.2, -0.55, 0], [2.3, -0.55, 0]]} color={P.amber} count={5} /> : null}
    
      </Stage>
    </Figure>
  );
}

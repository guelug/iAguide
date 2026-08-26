"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "hit" | "bust" | "nested";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("hit");
  return (
    <Figure
      label="prefix cache · nested threads"
      hint="one character busts the prefix"
      legend={[
          { color: P.teal, label: "cache hit" },
          { color: P.rose, label: "bust" },
          { color: P.violet, label: "nested thread" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "hit", label: "Cache hit", tone: P.teal },
            { value: "bust", label: "Bust", tone: P.rose },
            { value: "nested", label: "Nested thread", tone: P.violet }
          ]}
          ariaLabel="one character busts the prefix"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-1.5, 0.7, 0]} size={[4.4, 0.55, 0.1]} color={mode === "bust" ? P.rose : P.teal} fill={0.28} />
        <Tag position={[-1.5, 1.2, 0.2]} tone={mode === "bust" ? "rose" : "teal"}>{mode === "bust" ? "prefix changed" : "stable prefix"}</Tag>
        <Slab position={[2.4, -0.5, 0]} size={[1.6, 1.4, 0.12]} color={P.violet} fill={mode === "nested" ? 0.3 : 0.12} />
        <Tag position={[2.4, 0.4, 0.2]} tone="violet">sub thread</Tag>
        <Slab position={[-1.5, -0.5, 0]} size={[4.4, 0.7, 0.1]} color={P.amber} fill={0.18} />
        <Tag position={[-1.5, -0.5, 0.2]} tone="amber">this turn</Tag>
        {mode === "nested" ? <Flow points={[[0.7, -0.5, 0], [1.55, -0.5, 0]]} color={P.violet} count={3} /> : null}
    
      </Stage>
    </Figure>
  );
}

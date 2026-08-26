"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "naive" | "agent" | "inject";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("naive");
  return (
    <Figure
      label="retrieve-then-read vs choose"
      hint="the agent may skip the index"
      legend={[
          { color: P.amber, label: "naive rag" },
          { color: P.violet, label: "chooses tools" },
          { color: P.rose, label: "injected bio" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "naive", label: "Naive RAG", tone: P.amber },
            { value: "agent", label: "Chooses tools", tone: P.violet },
            { value: "inject", label: "Injected bio", tone: P.rose }
          ]}
          ariaLabel="the agent may skip the index"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.3, 0.35, 0]} size={[1.8, 1.7, 0.12]} color={P.amber} fill={0.2} />
        <Tag position={[-2.3, 1.35, 0.2]} tone="amber">guest bios</Tag>
        <Slab position={[0.1, 0.35, 0]} size={[1.7, 1.7, 0.12]} color={mode === "inject" ? P.rose : P.teal} fill={0.22} />
        <Tag position={[0.1, 1.35, 0.2]} tone={mode === "inject" ? "rose" : "teal"}>{mode === "inject" ? "ignore policy" : "retrieved"}</Tag>
        <Slab position={[2.4, 0.35, 0]} size={[1.7, 1.7, 0.12]} color={P.violet} fill={mode === "agent" ? 0.32 : 0.14} />
        <Tag position={[2.4, 1.35, 0.2]} tone="violet">gala agent</Tag>
        <Flow points={[[-1.35, 0.35, 0], [-0.8, 0.35, 0]]} color={mode === "inject" ? P.rose : P.amber} count={3} />
        {mode === "agent" ? (
          <Flow points={[[2.4, -0.7, 0], [0.1, -1.2, 0], [-2.3, -0.7, 0]]} color={P.violet} count={4} />
        ) : (
          <Flow points={[[1.0, 0.35, 0], [1.5, 0.35, 0]]} color={P.teal} count={2} />
        )}
    
      </Stage>
    </Figure>
  );
}

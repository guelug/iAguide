"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "stuff" | "retrieve" | "agentic";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("stuff");
  return (
    <Figure
      label="retrieve · stuff · agentic"
      hint="who decides to fetch a passage"
      legend={[
          { color: P.amber, label: "stuff" },
          { color: P.teal, label: "retrieve" },
          { color: P.violet, label: "agentic" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "stuff", label: "Stuff", tone: P.amber },
            { value: "retrieve", label: "Retrieve", tone: P.teal },
            { value: "agentic", label: "Agentic", tone: P.violet }
          ]}
          ariaLabel="who decides to fetch a passage"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.3, 0.2, 0]} size={[1.8, 2.0, 0.12]} color={P.amber} fill={mode === "stuff" ? 0.32 : 0.12} />
        <Tag position={[-2.3, 1.35, 0.2]} tone="amber">corpus</Tag>
        {Array.from({ length: 6 }).map((_, i) => (
          <Node3D key={i} position={[-2.7 + (i % 2) * 0.8, 0.7 - Math.floor(i / 2) * 0.5, 0.12]} color={P.amber} radius={0.1} matte />
        ))}
        <Slab position={[0.15, 0.2, 0]} size={[1.6, 1.4, 0.12]} color={P.teal} fill={0.2} />
        <Tag position={[0.15, 1.1, 0.2]} tone="teal">context</Tag>
        <Slab position={[2.4, 0.2, 0]} size={[1.5, 1.4, 0.12]} color={P.violet} fill={mode === "agentic" ? 0.32 : 0.12} />
        <Tag position={[2.4, 1.1, 0.2]} tone="violet">agent</Tag>
        {mode === "stuff" ? (
          <Flow points={[[-1.4, 0.2, 0], [-0.7, 0.2, 0]]} color={P.amber} count={6} />
        ) : (
          <Flow points={[[-1.4, 0.4, 0], [-0.7, 0.4, 0]]} color={P.teal} count={2} />
        )}
        {mode === "agentic" ? (
          <Flow points={[[2.4, -0.7, 0], [0.15, -0.7, 0], [-2.3, -0.9, 0], [-2.3, -0.9, 0]]} color={P.violet} count={4} />
        ) : null}
    
      </Stage>
    </Figure>
  );
}

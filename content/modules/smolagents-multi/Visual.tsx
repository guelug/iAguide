"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "team" | "retrieve" | "vision";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("team");
  return (
    <Figure
      label="manager · worker · vision"
      hint="nested loops, narrower tools"
      legend={[
          { color: P.teal, label: "team" },
          { color: P.amber, label: "retrieve" },
          { color: P.rose, label: "vision loop" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "team", label: "Team", tone: P.teal },
            { value: "retrieve", label: "Retrieve", tone: P.amber },
            { value: "vision", label: "Vision loop", tone: P.rose }
          ]}
          ariaLabel="nested loops, narrower tools"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Node3D position={[0, 1.15, 0]} color={P.violet} radius={0.22} pulse={0.3} />
        <Tag position={[0, 1.65, 0.2]} tone="violet">manager</Tag>
        <Node3D position={[-2.2, -0.35, 0]} color={P.teal} radius={0.18} />
        <Node3D position={[0, -0.35, 0]} color={P.amber} radius={0.18} />
        <Node3D position={[2.2, -0.35, 0]} color={mode === "vision" ? P.rose : P.teal} radius={0.18} pulse={mode === "vision" ? 0.5 : 0} />
        <Tag position={[-2.2, -0.85, 0.2]} tone="teal">web</Tag>
        <Tag position={[0, -0.85, 0.2]} tone="amber">retriever</Tag>
        <Tag position={[2.2, -0.85, 0.2]} tone={mode === "vision" ? "rose" : "teal"}>{mode === "vision" ? "screenshot…" : "vision"}</Tag>
        <Flow points={[[0, 1.15, 0], [-2.2, -0.35, 0]]} color={P.teal} count={3} />
        <Flow points={[[0, 1.15, 0], [0, -0.35, 0]]} color={P.amber} count={3} />
        <Flow points={[[0, 1.15, 0], [2.2, -0.35, 0]]} color={mode === "vision" ? P.rose : P.violet} count={mode === "vision" ? 6 : 3} />
        {mode === "vision" ? <Wire points={[[2.2, -0.35, 0], [2.2, -1.45, 0], [2.2, -0.35, 0]]} color={P.rose} /> : null}
    
      </Stage>
    </Figure>
  );
}

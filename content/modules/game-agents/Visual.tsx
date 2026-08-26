"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "state" | "act" | "illegal";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("state");
  return (
    <Figure
      label="state · legal actions"
      hint="the engine is the rules; the LLM is not"
      legend={[
          { color: P.teal, label: "state" },
          { color: P.amber, label: "actions" },
          { color: P.rose, label: "forbidden move" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "state", label: "State", tone: P.teal },
            { value: "act", label: "Actions", tone: P.amber },
            { value: "illegal", label: "Forbidden move", tone: P.rose }
          ]}
          ariaLabel="the engine is the rules; the LLM is not"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.1, 0.3, 0]} size={[2.1, 1.8, 0.12]} color={P.teal} fill={0.24} />
        <Tag position={[-2.1, 1.35, 0.2]} tone="teal">HP / types / PP</Tag>
        <Slab position={[2.1, 0.3, 0]} size={[2.1, 1.8, 0.12]} color={mode === "illegal" ? P.rose : P.amber} fill={0.26} />
        <Tag position={[2.1, 1.35, 0.2]} tone={mode === "illegal" ? "rose" : "amber"}>{mode === "illegal" ? "move not in set" : "choose_move"}</Tag>
        <Node3D position={[0, 0.3, 0]} color={P.violet} radius={0.2} pulse={0.3} />
        <Tag position={[0, -0.35, 0.2]} tone="violet">LLM</Tag>
        <Flow points={[[-1.0, 0.3, 0], [-0.25, 0.3, 0]]} color={P.teal} count={2} />
        <Flow points={[[0.25, 0.3, 0], [1.0, 0.3, 0]]} color={mode === "illegal" ? P.rose : P.amber} count={2} />
    
      </Stage>
    </Figure>
  );
}

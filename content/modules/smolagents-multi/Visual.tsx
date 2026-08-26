"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "team" | "retrieve" | "vision";

export default function Visual() {
  const t = useCopy({
    en: {
      "manager_worker_vision": "manager · worker · vision",
      "nested_loops_narrower_tools": "nested loops, narrower tools",
      "team": "team",
      "retrieve": "retrieve",
      "vision_loop": "vision loop",
      "team_2": "Team",
      "retrieve_2": "Retrieve",
      "vision_loop_2": "Vision loop"
    },
    es: {
      "manager_worker_vision": "manager · worker · visión",
      "nested_loops_narrower_tools": "bucles anidados, tools más estrechas",
      "team": "equipo",
      "retrieve": "recupera",
      "vision_loop": "bucle de visión",
      "team_2": "Equipo",
      "retrieve_2": "Recupera",
      "vision_loop_2": "Bucle de visión"
    },
  });
  const [mode, setMode] = useState<Mode>("team");
  return (
    <Figure
      label={t.manager_worker_vision}
      hint={t.nested_loops_narrower_tools}
      legend={[
          { color: P.teal, label: t.team },
          { color: P.amber, label: t.retrieve },
          { color: P.rose, label: t.vision_loop }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "team", label: t.team_2, tone: P.teal },
            { value: "retrieve", label: t.retrieve_2, tone: P.amber },
            { value: "vision", label: t.vision_loop_2, tone: P.rose }
          ]}
          ariaLabel={t.nested_loops_narrower_tools}
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

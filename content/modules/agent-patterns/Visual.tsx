"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "react" | "code" | "graph";

export default function Visual() {
  const t = useCopy({
    en: {
      "one_cycle_three_encodings": "one cycle, three encodings"
    },
    es: {
      "one_cycle_three_encodings": "un ciclo, tres codificaciones"
    },
  });
  const [mode, setMode] = useState<Mode>("react");
  return (
    <Figure
      label={t.one_cycle_three_encodings}
      hint="ReAct is the idea; libraries are dialects"
      legend={[
          { color: P.teal, label: "react" },
          { color: P.amber, label: "smolagents" },
          { color: P.violet, label: "langgraph" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "react", label: "ReAct", tone: P.teal },
            { value: "code", label: "smolagents", tone: P.amber },
            { value: "graph", label: "LangGraph", tone: P.violet }
          ]}
          ariaLabel="ReAct is the idea; libraries are dialects"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Node3D position={[-2.2, 0.7, 0]} color={P.teal} radius={0.2} pulse={0.25} />
        <Node3D position={[0, 0.7, 0]} color={P.amber} radius={0.2} />
        <Node3D position={[2.2, 0.7, 0]} color={P.violet} radius={0.2} />
        <Tag position={[-2.2, 1.2, 0.2]} tone="teal">Thought</Tag>
        <Tag position={[0, 1.2, 0.2]} tone="amber">Action</Tag>
        <Tag position={[2.2, 1.2, 0.2]} tone="violet">Observe</Tag>
        <Flow points={[[-2.2, 0.7, 0], [0, 0.7, 0], [2.2, 0.7, 0], [2.2, -0.9, 0], [-2.2, -0.9, 0], [-2.2, 0.7, 0]]} color={mode === "graph" ? P.violet : mode === "code" ? P.amber : P.teal} count={5} />
        {mode === "code" ? <Tag position={[0, -1.4, 0.2]} tone="amber">python snippet</Tag> : null}
        {mode === "graph" ? (
          <>
            <Wire points={[[-1.1, -0.9, 0], [0, -0.2, 0], [1.1, -0.9, 0]]} color={P.violet} />
            <Tag position={[0, -1.4, 0.2]} tone="violet">branch / join</Tag>
          </>
        ) : null}
        {mode === "react" ? <Tag position={[0, -1.4, 0.2]} tone="teal">while not done</Tag> : null}
    
      </Stage>
    </Figure>
  );
}

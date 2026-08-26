"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "loop" | "graph" | "cycle";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("loop");
  return (
    <Figure
      label="graph vs loop"
      hint="nodes, edges, a reducer on state"
      legend={[
          { color: P.teal, label: "plain loop" },
          { color: P.violet, label: "graph" },
          { color: P.rose, label: "no exit" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "loop", label: "Plain loop", tone: P.teal },
            { value: "graph", label: "Graph", tone: P.violet },
            { value: "cycle", label: "No exit", tone: P.rose }
          ]}
          ariaLabel="nodes, edges, a reducer on state"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Node3D position={[-1.6, 0.9, 0]} color={P.teal} radius={0.16} />
        <Node3D position={[1.6, 0.9, 0]} color={P.amber} radius={0.16} />
        <Node3D position={[1.6, -0.8, 0]} color={P.violet} radius={0.16} />
        <Node3D position={[-1.6, -0.8, 0]} color={mode === "cycle" ? P.rose : P.teal} radius={0.16} pulse={mode === "cycle" ? 0.45 : 0} />
        <Tag position={[-1.6, 1.35, 0.2]} tone="teal">START</Tag>
        <Tag position={[1.6, 1.35, 0.2]} tone="amber">node</Tag>
        <Tag position={[1.6, -1.25, 0.2]} tone="violet">node</Tag>
        <Tag position={[-1.6, -1.25, 0.2]} tone={mode === "cycle" ? "rose" : "teal"}>{mode === "cycle" ? "no END" : "END"}</Tag>
        {mode === "loop" ? (
          <Flow points={[[-1.6, 0.9, 0], [1.6, 0.9, 0], [1.6, -0.8, 0], [-1.6, -0.8, 0]]} color={P.teal} count={4} />
        ) : (
          <>
            <Wire points={[[-1.6, 0.9, 0], [1.6, 0.9, 0]]} color={P.violet} />
            <Wire points={[[1.6, 0.9, 0], [1.6, -0.8, 0]]} color={P.violet} />
            <Wire points={[[1.6, -0.8, 0], [-1.6, -0.8, 0]]} color={mode === "cycle" ? P.rose : P.violet} />
            {mode === "cycle" ? <Flow points={[[-1.6, -0.8, 0], [-1.6, 0.9, 0], [1.6, 0.9, 0]]} color={P.rose} count={5} /> : <Wire points={[[-1.6, 0.9, 0], [-1.6, -0.8, 0]]} dashed />}
          </>
        )}
    
      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "loop" | "graph" | "cycle";

export default function Visual() {
  const t = useCopy({
    en: {
      "graph_vs_loop": "graph vs loop",
      "nodes_edges_a_reducer_on_state": "nodes, edges, a reducer on state",
      "plain_loop": "plain loop",
      "graph": "graph",
      "no_exit": "no exit",
      "plain_loop_2": "Plain loop",
      "graph_2": "Graph",
      "no_exit_2": "No exit"
    },
    es: {
      "graph_vs_loop": "grafo vs bucle",
      "nodes_edges_a_reducer_on_state": "nodos, aristas, un reducer sobre el estado",
      "plain_loop": "bucle plano",
      "graph": "grafo",
      "no_exit": "sin salida",
      "plain_loop_2": "Bucle plano",
      "graph_2": "Grafo",
      "no_exit_2": "Sin salida"
    },
  });
  const [mode, setMode] = useState<Mode>("loop");
  return (
    <Figure
      label={t.graph_vs_loop}
      hint={t.nodes_edges_a_reducer_on_state}
      legend={[
          { color: P.teal, label: t.plain_loop },
          { color: P.violet, label: t.graph },
          { color: P.rose, label: t.no_exit }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "loop", label: t.plain_loop_2, tone: P.teal },
            { value: "graph", label: t.graph_2, tone: P.violet },
            { value: "cycle", label: t.no_exit_2, tone: P.rose }
          ]}
          ariaLabel={t.nodes_edges_a_reducer_on_state}
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

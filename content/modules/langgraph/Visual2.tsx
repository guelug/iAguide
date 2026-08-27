"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* LangGraph: state + nodes + edges + checkpoint. The loop compiled. */
type Mode = "blocks" | "cond" | "check";

const COPY = {
  en: {
    when_the_loop_is_a_graph: "when the loop is a graph",
    state_nodes_edges_checkpoint: "state, nodes, edges, checkpoint",
    blocks: "blocks",
    conditional: "conditional",
    checkpoint: "checkpoint",
    state: "state",
    node: "node",
    edge: "edge",
    reducer: "reducer",
    branch: "branch",
    persist: "persist",
    resume: "resume",
    human_in_the_loop: "human in the loop",
  },
  es: {
    when_the_loop_is_a_graph: "cuando el bucle es un grafo",
    state_nodes_edges_checkpoint: "estado, nodos, aristas, checkpoint",
    blocks: "bloques",
    conditional: "condicional",
    checkpoint: "checkpoint",
    state: "estado",
    node: "nodo",
    edge: "arista",
    reducer: "reducer",
    branch: "rama",
    persist: "persiste",
    resume: "retoma",
    human_in_the_loop: "human-in-the-loop",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("blocks");

  return (
    <Figure
      label={t.when_the_loop_is_a_graph}
      hint={t.state_nodes_edges_checkpoint}
      legend={[
        { color: P.violet, label: t.state },
        { color: P.teal, label: t.node },
        { color: P.amber, label: t.checkpoint },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "blocks", label: t.blocks, tone: P.teal },
            { value: "cond", label: t.conditional, tone: P.violet },
            { value: "check", label: t.checkpoint, tone: P.amber },
          ]}
          ariaLabel={t.when_the_loop_is_a_graph}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "blocks" && (
          <>
            {/* central state */}
            <Slab position={[0, 0.1, 0]} size={[2.4, 1.4, 0.16]} color={P.violet} fill={0.16} />
            <Tag position={[0, 1.15, 0.15]} tone="violet">{t.state}</Tag>
            <Tag position={[0, 0.1, 0.15]} tone="violet" size="xs">{"{ messages, docs, … }"}</Tag>
            {/* nodes around it */}
            {[
              [-2.5, 0.9, P.teal, "parse"],
              [2.5, 0.9, P.teal, "draft"],
              [-2.5, -0.9, P.amber, "search"],
              [2.5, -0.9, P.amber, "send"],
            ].map(([x, y, col, lab], i) => (
              <group key={i}>
                <Node3D position={[x as number, y as number, 0]} color={col as string} radius={0.15} pulse={i * 0.3} />
                <Tag position={[x as number, (y as number) + (y as number > 0 ? 0.4 : -0.4), 0.15]} tone={col === P.teal ? "teal" : "amber"} size="xs">{lab as string}</Tag>
                <Wire points={[[(x as number) * 0.75, (y as number) * 0.75, 0], [(x as number) * 0.4, (y as number) * 0.4, 0]]} color={P.lineStrong} dashed opacity={0.5} />
              </group>
            ))}
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">{t.reducer}</Tag>
          </>
        )}

        {mode === "cond" && (
          <>
            <Node3D position={[-2.4, 0.6, 0]} color={P.teal} radius={0.18} pulse={0.2} />
            <Tag position={[-2.4, 1.1, 0.15]} tone="teal" size="xs">start</Tag>
            {/* decision diamond */}
            <Node3D position={[0, 0.2, 0]} color={P.amber} radius={0.16} faceted pulse={0.4} />
            <Tag position={[0, 0.75, 0.15]} tone="amber" size="xs">{t.branch}</Tag>
            {/* two conditional edges */}
            <Flow points={[[-2.2, 0.55, 0], [-0.3, 0.2, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[0.2, 0.35, 0], [1.7, 1.0, 0]]} color={P.teal} count={2} />
            <Flow points={[[0.2, 0.05, 0], [1.7, -0.7, 0]]} color={P.rose} count={2} />
            <Slab position={[2.4, 1.05, 0]} size={[1.4, 0.5, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[2.4, 1.5, 0.15]} tone="teal" size="xs">tool ok</Tag>
            <Slab position={[2.4, -0.75, 0]} size={[1.4, 0.5, 0.12]} color={P.rose} fill={0.22} />
            <Tag position={[2.4, -1.2, 0.15]} tone="rose" size="xs">escalate</Tag>
            <Tag position={[0, -1.0, 0.15]} tone="muted" size="xs">{t.edge} · if/else</Tag>
          </>
        )}

        {mode === "check" && (
          <>
            <Slab position={[-1.9, 0.45, 0]} size={[1.8, 1.3, 0.14]} color={P.teal} fill={0.16} />
            <Tag position={[-1.9, 1.45, 0.15]} tone="teal" size="xs">turn n</Tag>
            <Slab position={[1.9, 0.45, 0]} size={[1.8, 1.3, 0.14]} color={P.violet} fill={0.16} />
            <Tag position={[1.9, 1.45, 0.15]} tone="violet" size="xs">turn n+1</Tag>
            <Flow points={[[-1.0, 0.45, 0], [1.0, 0.45, 0]]} color={P.violet} count={3} size={0.05} />
            <Slab position={[0, -1.0, 0]} size={[4.4, 0.45, 0.12]} color={P.amber} fill={0.18} />
            <Tag position={[0, -1.55, 0.15]} tone="amber">{t.checkpoint}</Tag>
            <Wire points={[[-1.5, -0.75, 0], [-1.7, -0.25, 0]]} color={P.amber} dashed opacity={0.6} />
            <Wire points={[[1.5, -0.75, 0], [1.7, -0.25, 0]]} color={P.amber} dashed opacity={0.6} />
            <Tag position={[0, -0.35, 0.15]} tone="muted" size="xs">{t.persist} · {t.resume}</Tag>
            {/* human-in-the-loop gate */}
            <Halo position={[0, 0.45, 0]} radius={0.45} color={P.rose} opacity={0.5} spin={0.25} />
            <Tag position={[0, 1.05, 0.15]} tone="rose" size="xs">{t.human_in_the_loop}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

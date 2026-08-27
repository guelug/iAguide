"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* LlamaIndex: load → index → QueryEngine, then the engine as one tool in a
   ReAct loop, and workflows as an event graph. */
type Mode = "etl" | "engine" | "workflow";

const COPY = {
  en: {
    shaped_like_retrieval: "shaped like retrieval",
    five_stages_then_the_engine: "five stages, then an engine",
    etl: "load+index",
    engine: "query engine",
    workflow: "workflow",
    load: "load",
    chunk: "chunk",
    embed: "embed",
    store: "store",
    retrieve: "retrieve",
    query_engine: "query engine",
    as_a_tool: "as a tool",
    event_graph: "events, not an agent",
    step: "step",
  },
  es: {
    shaped_like_retrieval: "con forma de recuperación",
    five_stages_then_the_engine: "cinco etapas, luego el engine",
    etl: "carga+índice",
    engine: "query engine",
    workflow: "workflow",
    load: "carga",
    chunk: "trocea",
    embed: "embebe",
    store: "guarda",
    retrieve: "recupera",
    query_engine: "query engine",
    as_a_tool: "como tool",
    event_graph: "eventos, no un agente",
    step: "paso",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("etl");

  const chunkCells = Array.from({ length: 12 }, (_, i) => ({
    position: [-0.9 + (i % 6) * 0.36, -0.3 + Math.floor(i / 6) * 0.36, 0] as [number, number, number],
    color: P.violet,
  }));

  return (
    <Figure
      label={t.shaped_like_retrieval}
      hint={t.five_stages_then_the_engine}
      legend={[
        { color: P.teal, label: t.etl },
        { color: P.violet, label: t.engine },
        { color: P.amber, label: t.workflow },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "etl", label: t.etl, tone: P.teal },
            { value: "engine", label: t.engine, tone: P.violet },
            { value: "workflow", label: t.workflow, tone: P.amber },
          ]}
          ariaLabel={t.five_stages_then_the_engine}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "etl" && (
          <>
            <Slab position={[-2.4, 0.9, 0]} size={[1.4, 1.3, 0.12]} color={P.teal} fill={0.18} />
            <Tag position={[-2.4, 1.75, 0.15]} tone="teal">{t.load}</Tag>
            <Flow points={[[-1.7, 0.9, 0], [-1.0, 0.9, 0]]} color={P.teal} count={2} size={0.05} />
            <Lattice cells={chunkCells} size={0.17} opacity={0.9} />
            <Tag position={[0, 0.4, 0.15]} tone="violet" size="xs">{t.chunk}</Tag>
            <Flow points={[[1.0, -0.1, 0], [1.9, 0.4, 0]]} color={P.violet} count={3} size={0.05} />
            <Slab position={[2.5, 0.5, 0]} size={[1.1, 1.2, 0.14]} color={P.amber} fill={0.2} />
            <Tag position={[2.5, 1.35, 0.15]} tone="amber">{t.embed}</Tag>
            <Flow points={[[2.5, -0.15, 0], [2.5, -0.9, 0]]} color={P.amber} count={2} size={0.05} />
            <Slab position={[2.5, -1.35, 0]} size={[1.1, 0.5, 0.12]} color={P.teal} fill={0.26} />
            <Tag position={[2.5, -1.85, 0.15]} tone="teal">{t.store}</Tag>
            <Tag position={[-0.4, -1.4, 0.15]} tone="muted" size="xs">llamahub → vector store</Tag>
          </>
        )}

        {mode === "engine" && (
          <>
            {/* the ReAct loop on the left, QueryEngine as a tool on the right */}
            <Node3D position={[-2.0, 0.5, 0]} color={P.teal} radius={0.17} pulse={0.2} />
            <Node3D position={[-0.9, 0.5, 0]} color={P.amber} radius={0.17} />
            <Node3D position={[-2.0, -0.55, 0]} color={P.violet} radius={0.17} />
            <Tag position={[-2.0, 0.95, 0.15]} tone="teal" size="xs">think</Tag>
            <Tag position={[-0.9, 0.95, 0.15]} tone="amber" size="xs">act</Tag>
            <Tag position={[-2.0, -1.0, 0.15]} tone="violet" size="xs">observe</Tag>
            <Flow points={[[-1.8, 0.5, 0], [-1.1, 0.5, 0]]} color={P.teal} count={2} size={0.045} />
            <Flow points={[[-0.9, 0.3, 0], [-2.0, -0.35, 0]]} color={P.amber} count={2} size={0.045} />
            {/* the tool call to QueryEngine */}
            <Flow points={[[-0.65, 0.5, 0], [0.7, 0.5, 0]]} color={P.violet} count={3} />
            <Slab position={[1.6, 0.5, 0]} size={[1.6, 1.3, 0.14]} color={P.violet} fill={0.2} />
            <Tag position={[1.6, 1.4, 0.15]} tone="violet">{t.query_engine}</Tag>
            <Tag position={[1.6, -0.35, 0.15]} tone="violet" size="xs">{t.as_a_tool}</Tag>
            <Wire points={[[1.2, 0.2, 0], [1.0, 0.45, 0]]} color={P.violet} dashed opacity={0.5} />
          </>
        )}

        {mode === "workflow" && (
          <>
            {[
              [-2.3, 0.7, P.teal, "start"],
              [-0.7, 0.7, P.amber, "retrieve"],
              [0.9, 0.7, P.violet, "reason"],
              [2.4, 0.7, P.teal, "stop"],
            ].map(([x, y, col, lab], i) => (
              <group key={i}>
                <Node3D position={[x as number, y as number, 0]} color={col as string} radius={0.16} pulse={i * 0.3} />
                <Tag position={[x as number, (y as number) + 0.45, 0.15]} tone={col === P.teal ? "teal" : col === P.amber ? "amber" : "violet"} size="xs">{lab as string}</Tag>
              </group>
            ))}
            <Flow points={[[-2.1, 0.7, 0], [-0.9, 0.7, 0]]} color={P.teal} count={2} size={0.045} />
            <Flow points={[[-0.5, 0.7, 0], [0.7, 0.7, 0]]} color={P.amber} count={2} size={0.045} />
            <Flow points={[[1.1, 0.7, 0], [2.2, 0.7, 0]]} color={P.violet} count={2} size={0.045} />
            {/* event bus ribbon above */}
            <Wire points={[[-2.3, 1.6, 0], [2.4, 1.6, 0]]} color={P.lineStrong} dashed opacity={0.6} />
            <Tag position={[0, 2.0, 0.15]} tone="muted" size="xs">{t.event_graph}</Tag>
            {[-2.3, -0.7, 0.9, 2.4].map((x, i) => (
              <Wire key={i} points={[[x, 1.0, 0], [x, 1.55, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            ))}
            <Tag position={[0, -0.5, 0.15]} tone="muted">{t.step} · event · {t.step}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

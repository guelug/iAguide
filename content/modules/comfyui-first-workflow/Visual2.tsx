"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* ComfyUI: a node graph, a sampler with knobs, the JSON that IS the workflow. */
type Mode = "graph" | "sampler" | "json";

const COPY = {
  en: {
    the_workflow_is_the_json: "the workflow is the json",
    nodes_knobs_and_a_file_you_can_hand_over: "nodes, knobs, a file you can hand over",
    graph: "graph",
    sampler: "ksampler",
    json: "graph json",
    checkpoint: "checkpoint",
    clip: "clip",
    vae: "vae",
    save: "save",
    seed: "seed",
    steps: "steps",
    cfg: "cfg",
    prompt: "prompt",
    image: "image",
    file: "file",
  },
  es: {
    the_workflow_is_the_json: "el workflow es el json",
    nodes_knobs_and_a_file_you_can_hand_over: "nodos, knobs, un archivo que pasas a otro",
    graph: "grafo",
    sampler: "ksampler",
    json: "graph json",
    checkpoint: "checkpoint",
    clip: "clip",
    vae: "vae",
    save: "save",
    seed: "seed",
    steps: "steps",
    cfg: "cfg",
    prompt: "prompt",
    image: "imagen",
    file: "archivo",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("graph");

  return (
    <Figure
      label={t.the_workflow_is_the_json}
      hint={t.nodes_knobs_and_a_file_you_can_hand_over}
      legend={[
        { color: P.teal, label: t.prompt },
        { color: P.violet, label: t.sampler },
        { color: P.amber, label: t.image },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "graph", label: t.graph, tone: P.teal },
            { value: "sampler", label: t.sampler, tone: P.violet },
            { value: "json", label: t.json, tone: P.amber },
          ]}
          ariaLabel={t.the_workflow_is_the_json}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "graph" && (
          <>
            {(
              [
                [t.checkpoint, P.muted, -2.4, 0.9],
                [t.clip, P.teal, -2.4, -0.5],
                [t.sampler, P.violet, 0, 0.2],
                [t.vae, P.amber, 1.9, 0.5],
                [t.save, P.teal, 2.6, -0.7],
              ] as const
            ).map(([lab, col, x, y]) => (
              <group key={lab}>
                <Slab position={[x, y, 0]} size={[1.5, 0.75, 0.14]} color={col} fill={0.2} />
                <Tag position={[x, (y as number) + 0.55, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : col === P.amber ? "amber" : "muted"} size="xs">{lab}</Tag>
              </group>
            ))}
            <Flow points={[[-1.65, 0.9, 0], [-0.8, 0.35, 0]]} color={P.muted} count={2} size={0.045} />
            <Flow points={[[-1.65, -0.5, 0], [-0.8, 0.0, 0]]} color={P.teal} count={2} size={0.045} />
            <Flow points={[[0.8, 0.25, 0], [1.1, 0.45, 0]]} color={P.violet} count={2} size={0.05} />
            <Flow points={[[2.0, 0.1, 0], [2.2, -0.3, 0]]} color={P.amber} count={2} size={0.05} />
          </>
        )}

        {mode === "sampler" && (
          <>
            {/* the sampler as a big node with three knobs reading out */}
            <Slab position={[0, 0.3, 0]} size={[3.6, 2.0, 0.2]} color={P.violet} fill={0.18} />
            <Tag position={[0, 1.65, 0.15]} tone="violet">{t.sampler}</Tag>
            {[t.seed, t.steps, t.cfg].map((lab, i) => (
              <group key={lab}>
                <Node3D position={[-1.1 + i * 1.1, 0.3, 0.15]} color={P.amber} radius={0.18} pulse={i * 0.3} faceted />
                <Tag position={[-1.1 + i * 1.1, -0.05, 0.15]} tone="amber" size="xs">{lab}</Tag>
                <Tag position={[-1.1 + i * 1.1, 0.8, 0.15]} tone="muted" size="xs">
                  {i === 0 ? "42" : i === 1 ? "25" : "7.0"}
                </Tag>
              </group>
            ))}
            <Wire points={[[-1.8, 1.25, 0], [1.8, 1.25, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Tag position={[0, -1.0, 0.15]} tone="muted" size="xs">latent · noise schedule</Tag>
          </>
        )}

        {mode === "json" && (
          <>
            {/* same file on left driving the render on right */}
            <Slab position={[-1.9, 0.4, 0]} size={[2.2, 2.0, 0.12]} color={P.amber} fill={0.16} />
            <Tag position={[-1.9, 1.65, 0.15]} tone="amber">{t.file} · workflow.json</Tag>
            <Tag position={[-1.9, 0.4, 0.15]} tone="amber" size="xs">{"{ nodes: […], links: […] }"}</Tag>
            <Flow points={[[-0.7, 0.4, 0], [0.7, 0.4, 0]]} color={P.amber} count={3} />
            <Slab position={[1.9, 0.4, 0]} size={[2.2, 2.0, 0.14]} color={P.teal} fill={0.22} />
            <Tag position={[1.9, 1.65, 0.15]} tone="teal">{t.image}</Tag>
            {/* rendered image hint */}
            <Lattice
              cells={Array.from({ length: 16 }, (_, i) => ({
                position: [1.35 + (i % 4) * 0.35, 0.95 - Math.floor(i / 4) * 0.35, 0.15] as [number, number, number],
                color: i % 3 === 0 ? P.teal : i % 3 === 1 ? P.amber : P.violet,
              }))}
              size={0.18}
              opacity={0.85}
              matte
            />
            <Tag position={[1.9, -0.75, 0.15]} tone="muted" size="xs">{t.save}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

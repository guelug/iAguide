"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* distributed training: data parallel replicas, pipeline stages, tensor split. */
type Mode = "data" | "pipeline" | "tensor";

const COPY = {
  en: {
    one_model_four_gpus_three_splits: "one model, four GPUs, three splits",
    data_parallel_pipeline_tensor: "data parallel · pipeline · tensor parallel",
    data: "data parallel",
    pipeline: "pipeline",
    tensor: "tensor",
    replica: "replica",
    gradient: "gradient",
    stage: "stage",
    activations: "activations",
    shard: "shard",
    all_reduce: "all-reduce",
  },
  es: {
    one_model_four_gpus_three_splits: "un modelo, cuatro GPUs, tres repartos",
    data_parallel_pipeline_tensor: "datos · pipeline · tensor",
    data: "paralelo de datos",
    pipeline: "pipeline",
    tensor: "tensor",
    replica: "réplica",
    gradient: "gradiente",
    stage: "etapa",
    activations: "activaciones",
    shard: "fragmento",
    all_reduce: "all-reduce",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("data");

  return (
    <Figure
      label={t.one_model_four_gpus_three_splits}
      hint={t.data_parallel_pipeline_tensor}
      legend={[
        { color: P.teal, label: t.data },
        { color: P.violet, label: t.pipeline },
        { color: P.amber, label: t.tensor },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "data", label: t.data, tone: P.teal },
            { value: "pipeline", label: t.pipeline, tone: P.violet },
            { value: "tensor", label: t.tensor, tone: P.amber },
          ]}
          ariaLabel={t.one_model_four_gpus_three_splits}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "data" && (
          <>
            {/* four replicas, gradients converge into all-reduce */}
            {[0, 1, 2, 3].map((i) => (
              <group key={i}>
                <Slab position={[-2.2 + (i % 2) * 1.5, 0.85 - Math.floor(i / 2) * 1.4, 0]} size={[1.15, 0.75, 0.12]} color={P.teal} fill={0.2} />
                <Tag position={[-2.2 + (i % 2) * 1.5, 1.35 - Math.floor(i / 2) * 1.4, 0.15]} tone="teal" size="xs">GPU {i + 1}</Tag>
                <Tag position={[-2.2 + (i % 2) * 1.5, 0.85 - Math.floor(i / 2) * 1.4, 0.15]} tone="teal" size="xs">{t.replica}</Tag>
                <Ribbon points={[[-1.6 + (i % 2) * 1.5, 0.45 - Math.floor(i / 2) * 1.4, 0], [0.7, 0.0, 0]]} color={P.violet} radius={0.025} opacity={0.7} />
              </group>
            ))}
            <Halo position={[1.5, 0.0, 0]} radius={0.65} color={P.violet} opacity={0.55} spin={0.2} />
            <Node3D position={[1.5, 0.0, 0]} color={P.violet} radius={0.18} pulse={0.4} />
            <Tag position={[1.5, 0.75, 0.15]} tone="violet" size="xs">{t.all_reduce}</Tag>
            <Ribbon points={[[2.0, 0.0, 0], [2.7, 0.0, 0]]} color={P.violet} radius={0.035} opacity={0.8} />
            <Tag position={[2.4, -0.5, 0.15]} tone="muted" size="xs">{t.gradient}</Tag>
          </>
        )}

        {mode === "pipeline" && (
          <>
            {/* model split across stages, activations flow */}
            {[0, 1, 2, 3].map((i) => (
              <group key={i}>
                <Slab position={[-2.3 + i * 1.55, 0.5, 0]} size={[1.25, 1.2, 0.14]} color={P.violet} fill={0.16 + i * 0.04} />
                <Tag position={[-2.3 + i * 1.55, 1.3, 0.15]} tone="violet" size="xs">{t.stage} {i + 1}</Tag>
                <Node3D position={[-2.3 + i * 1.55, 0.5, 0.15]} color={P.violet} radius={0.12} pulse={i * 0.2} />
              </group>
            ))}
            {[0, 1, 2].map((i) => (
              <Flow points={[[-1.7 + i * 1.55, 0.5, 0], [-1.3 + i * 1.55, 0.5, 0]]} color={P.teal} count={2} size={0.05} key={i} />
            ))}
            <Ribbon points={[[-2.3, -0.4, 0], [-0.8, -0.9, 0], [0.8, -0.9, 0], [2.3, -0.4, 0]]} color={P.teal} radius={0.03} opacity={0.7} />
            <Tag position={[0, -1.35, 0.15]} tone="teal" size="xs">{t.activations} · 1F1B schedule</Tag>
          </>
        )}

        {mode === "tensor" && (
          <>
            {/* one weight matrix split column-wise across two GPUs */}
            <Slab position={[-1.5, 0.4, 0]} size={[1.8, 2.0, 0.14]} color={P.teal} fill={0.18} />
            <Tag position={[-1.5, 1.65, 0.15]} tone="teal" size="xs">W[:, :k]</Tag>
            <Slab position={[1.5, 0.4, 0]} size={[1.8, 2.0, 0.14]} color={P.amber} fill={0.18} />
            <Tag position={[1.5, 1.65, 0.15]} tone="amber" size="xs">W[:, k:]</Tag>
            <Lattice
              cells={Array.from({ length: 12 }, (_, i) => ({
                position: [-2.15 + (i % 3) * 0.55, 1.0 - Math.floor(i / 3) * 0.45, 0.16] as [number, number, number],
                color: P.teal,
              }))}
              size={0.17}
              opacity={0.9}
              matte
            />
            <Lattice
              cells={Array.from({ length: 12 }, (_, i) => ({
                position: [0.85 + (i % 3) * 0.55, 1.0 - Math.floor(i / 3) * 0.45, 0.16] as [number, number, number],
                color: P.amber,
              }))}
              size={0.17}
              opacity={0.9}
              matte
            />
            <Flow points={[[-0.5, 0.4, 0], [0.5, 0.4, 0]]} color={P.violet} count={3} />
            <Tag position={[0, -1.05, 0.15]} tone="violet" size="xs">all-gather / reduce-scatter</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

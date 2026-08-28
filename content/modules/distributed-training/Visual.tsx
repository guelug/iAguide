"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "data" | "tensor" | "pipe";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("data");

  // Four GPUs in a row.
  const gpuX = (i: number) => -3.0 + i * 2.0;

  // Build small lattices for "mini-batches" in data parallel mode.
  const batchCells = (i: number) =>
    Array.from({ length: 6 }, (_, j) => ({
      position: [
        gpuX(i) - 0.45 + (j % 3) * 0.45,
        -1.3 - Math.floor(j / 3) * 0.3,
        0,
      ] as [number, number, number],
      scale: 1,
      color: P.teal,
    }));

  // Tensor parallel: each GPU owns a vertical strip of one big matrix.
  const tensorRows = (i: number) =>
    Array.from({ length: 6 }, (_, j) => ({
      position: [
        gpuX(i),
        0.6 - j * 0.25,
        0,
      ] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
      color: i % 2 ? P.amber : P.teal,
    }));

  return (
    <Figure
      label="split the work"
      hint="data · tensor · pipeline"
      legend={[
        { color: P.teal, label: "data parallel" },
        { color: P.amber, label: "tensor parallel" },
        { color: P.violet, label: "pipeline parallel" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "data", label: "Data", tone: P.teal },
            { value: "tensor", label: "Tensor", tone: P.amber },
            { value: "pipe", label: "Pipeline", tone: P.violet },
          ]}
          ariaLabel="data, tensor, pipeline"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 10], fov: 38 }}>
        <Motes count={110} radius={7} color={P.faint} size={0.025} opacity={0.32} />

        {/* Always-on bus underneath. */}
        <Slab position={[0, -2.6, 0]} size={[9.5, 0.4, 0.1]} color={P.line} fill={0.1} />
        <Tag position={[0, -2.95, 0.2]} tone="muted">
          {mode === "data"
            ? "bus: NVLink / Infiniband (all-reduce grads)"
            : mode === "tensor"
              ? "bus: NVLink (all-reduce activations each layer)"
              : "bus: NVLink / IB (pass microbatches stage→stage)"}
        </Tag>

        {/* GPU containers — four slabs, each labelled GPU 0–3. */}
        {Array.from({ length: 4 }, (_, i) => (
          <group key={i}>
            <Slab
              position={[gpuX(i), 0.3, 0]}
              size={[1.6, 1.5, 0.1]}
              color={mode === "pipe" ? P.violet : mode === "tensor" ? P.amber : P.teal}
              fill={mode === "pipe" ? 0.16 : 0.18}
            />
            <Tag position={[gpuX(i), 1.2, 0.2]} tone="ink">
              GPU {i}
            </Tag>
          </group>
        ))}

        {/* DATA PARALLEL — mini-batches below, model full inside each slab, all-reduce ring. */}
        {mode === "data" && (
          <>
            {Array.from({ length: 4 }, (_, i) => (
              <Lattice key={`batch-${i}`} cells={batchCells(i)} size={0.13} matte />
            ))}
            <Tag position={[0, -1.9, 0.2]} tone="teal">mini-batch per GPU</Tag>
            {/* All-reduce ring */}
            <Wire
              points={[
                [gpuX(0) + 0.8, -2.2, 0],
                [gpuX(1) - 0.8, -2.2, 0],
                [gpuX(1) + 0.8, -2.2, 0],
                [gpuX(2) - 0.8, -2.2, 0],
                [gpuX(2) + 0.8, -2.2, 0],
                [gpuX(3) - 0.8, -2.2, 0],
              ]}
              color={P.teal}
              opacity={0.7}
              dashed
            />
            <Flow
              points={[
                [gpuX(0) + 0.5, -2.2, 0],
                [gpuX(3) - 0.5, -2.2, 0],
              ]}
              color={P.teal}
              count={3}
              speed={0.5}
            />
            <Tag position={[0, -1.6, 0.2]} tone="teal">all-reduce grads</Tag>
          </>
        )}

        {/* TENSOR PARALLEL — split one layer's matrix across GPUs; many all-reduce arrows. */}
        {mode === "tensor" && (
          <>
            {/* Big slab to represent "one layer" above the GPUs. */}
            <Slab position={[0, 2.1, 0]} size={[9.5, 0.6, 0.1]} color={P.amber} fill={0.22} />
            <Tag position={[0, 2.55, 0.2]} tone="amber">one layer, split matrix W</Tag>
            {/* Strips inside each GPU. */}
            {Array.from({ length: 4 }, (_, i) => (
              <Lattice key={`tensor-${i}`} cells={tensorRows(i)} size={0.12} matte />
            ))}
            {/* All-reduce arrows between GPUs. */}
            {Array.from({ length: 3 }, (_, i) => (
              <Flow
                key={`ar-${i}`}
                points={[
                  [gpuX(i) + 0.85, 0.3, 0],
                  [gpuX(i + 1) - 0.85, 0.3, 0],
                ]}
                color={P.amber}
                count={2}
                speed={0.6}
              />
            ))}
            {/* Pull from layer to GPU. */}
            <Flow
              points={[[0, 1.8, 0], [gpuX(1.5), 1.05, 0]]}
              color={P.amber}
              count={3}
            />
          </>
        )}

        {/* PIPELINE PARALLEL — stages with microbatches traveling along. */}
        {mode === "pipe" && (
          <>
            {/* Microbatches as small cubes traveling stage→stage. */}
            {Array.from({ length: 4 }, (_, i) => (
              <Node3D
                key={`mb-${i}`}
                position={[-2.5 + i * 1.0, -0.3, 0.4]}
                color={P.violet}
                radius={0.13}
                pulse={0.5 + i * 0.2}
              />
            ))}
            <Tag position={[-2.5 + 1.5, -0.85, 0.2]} tone="violet">microbatches in flight</Tag>
            {/* Connection between stages. */}
            {Array.from({ length: 3 }, (_, i) => (
              <Flow
                key={`pipe-${i}`}
                points={[
                  [gpuX(i) + 0.85, 0.3, 0],
                  [gpuX(i + 1) - 0.85, 0.3, 0],
                ]}
                color={P.violet}
                count={3}
                speed={0.4}
              />
            ))}
            {/* Pipeline bubble — empty stages at start/end. */}
            <Halo position={[gpuX(0), 0.3, 0]} radius={0.6} color={P.rose} opacity={0.35} />
            <Halo position={[gpuX(3), 0.3, 0]} radius={0.6} color={P.rose} opacity={0.35} />
            <Tag position={[gpuX(0), -0.95, 0.2]} tone="rose">bubble</Tag>
            <Tag position={[gpuX(3), -0.95, 0.2]} tone="rose">bubble</Tag>
          </>
        )}

        {/* Tiny NCCL marker — always present. */}
        <Node3D position={[4.6, 2.4, 0]} color={P.violet} radius={0.13} pulse={0.7} />
        <Tag position={[4.6, 2.85, 0.2]} tone="violet">NCCL</Tag>
      </Stage>
    </Figure>
  );
}

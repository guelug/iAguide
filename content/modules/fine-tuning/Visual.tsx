"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "base" | "lora" | "merge";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("base");

  // Frozen weight matrix — visualised as a 4x4 grid of cells.
  const W = Array.from({ length: 16 }, (_, i) => {
    const c = i % 4;
    const r = Math.floor(i / 4);
    return {
      position: [-1.85 + c * 0.32, 0.65 - r * 0.32, 0] as [number, number, number],
      scale: 1,
      color: P.teal,
    };
  });

  // LoRA matrices A and B — tall thin strips.
  const A = Array.from({ length: 4 }, (_, i) => ({
    position: [0.95, 0.65 - i * 0.32, 0] as [number, number, number],
    scale: 1,
    color: P.amber,
  }));
  const B = Array.from({ length: 4 }, (_, i) => ({
    position: [1.6, 0.65 - i * 0.32, 0] as [number, number, number],
    scale: 1,
    color: P.amber,
  }));

  return (
    <Figure
      label="LoRA delta"
      hint="a thin rectangle, not a new brain"
      legend={[
        { color: P.teal, label: "frozen W" },
        { color: P.amber, label: "BA" },
        { color: P.violet, label: "served W'" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "base", label: "Base W", tone: P.teal },
            { value: "lora", label: "LoRA", tone: P.amber },
            { value: "merge", label: "Merge", tone: P.violet },
          ]}
          ariaLabel="a thin rectangle, not a new brain"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 9], fov: 38 }}>
        <Motes count={100} radius={6.5} color={P.faint} size={0.025} opacity={0.32} />

        {/* Frozen W on the left — always there, never moves. */}
        <Lattice cells={W} size={0.27} matte />
        <Slab position={[-1.85, 0.0, -0.1]} size={[1.4, 1.4, 0.08]} color={P.line} fill={0.08} />
        <Tag position={[-1.85, 1.5, 0.2]} tone="teal">W · frozen</Tag>

        {/* LoRA strips — appear in lora + merge modes. */}
        {(mode === "lora" || mode === "merge") && (
          <>
            <Lattice cells={A} size={0.18} matte />
            <Lattice cells={B} size={0.18} matte />
            <Tag position={[1.25, 1.5, 0.2]} tone="amber">A · B (rank r)</Tag>
            {/* Multiplication arrow. */}
            <Flow points={[[1.1, 0.0, 0], [1.45, 0.0, 0]]} color={P.amber} count={2} />
            <Tag position={[1.27, -0.55, 0.2]} tone="muted">BA</Tag>
          </>
        )}

        {/* Merge mode — a violet slab showing W' served. */}
        {mode === "merge" && (
          <>
            <Slab position={[-1.85, 0.0, 0.1]} size={[1.4, 1.4, 0.08]} color={P.violet} fill={0.3} />
            <Halo position={[-1.85, 0.0, 0.18]} radius={0.85} color={P.violet} opacity={0.4} spin={0.4} />
            <Ribbon
              points={[
                [1.78, 0.0, 0],
                [2.5, 0.0, 0],
                [2.5, 0.5, 0],
                [-0.7, 0.5, 0],
                [-0.95, 0.0, 0],
              ]}
              color={P.violet}
              radius={0.04}
              opacity={0.7}
            />
            <Tag position={[-1.85, -1.55, 0.2]} tone="violet">W' = W + (α/r) BA</Tag>
            {/* "served" indicator. */}
            <Node3D position={[3.6, 0.0, 0]} color={P.violet} radius={0.22} pulse={0.5} />
            <Tag position={[3.6, 0.45, 0.2]} tone="violet">served</Tag>
            <Flow
              points={[
                [2.5, 0.0, 0],
                [3.3, 0.0, 0],
              ]}
              color={P.violet}
              count={3}
              speed={0.5}
            />
          </>
        )}

        {/* LoRA-only: highlight that gradients only touch A and B. */}
        {mode === "lora" && (
          <>
            <Halo position={[1.25, 0.0, 0.1]} radius={0.6} color={P.amber} opacity={0.5} spin={0.6} />
            <Slab position={[1.25, -1.5, 0]} size={[1.5, 0.5, 0.1]} color={P.amber} fill={0.16} />
            <Tag position={[1.25, -1.85, 0.2]} tone="amber">gradients only here</Tag>
            {/* W ghost outline to remind user nothing moves. */}
            <Wire
              points={[
                [-2.55, 0.65, 0],
                [-1.15, 0.65, 0],
                [-1.15, -0.65, 0],
                [-2.55, -0.65, 0],
                [-2.55, 0.65, 0],
              ]}
              color={P.lineStrong}
              opacity={0.6}
              dashed
            />
          </>
        )}

        {/* Footer. */}
        <Slab position={[0, -2.6, 0]} size={[9.0, 0.4, 0.1]} color={P.line} fill={0.08} />
        <Tag position={[0, -2.6, 0.2]} tone="muted">
          {mode === "base"
            ? "frozen base model · no adaptation yet"
            : mode === "lora"
              ? "LoRA learns ΔW = (α/r) BA; A and B only"
              : "merge_and_unload: W' is one dense matrix, served at full speed"}
        </Tag>
      </Stage>
    </Figure>
  );
}

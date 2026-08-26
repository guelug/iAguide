"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "raw" | "clean" | "mix";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("raw");

  // Deterministic positions so the scene is stable across renders.
  const rawCells = Array.from({ length: 64 }, (_, i) => {
    const t = i / 64;
    return {
      position: [
        -3.4 + (i % 8) * 0.55 + Math.sin(t * 12.9 + i) * 0.18,
        1.6 - Math.floor(i / 8) * 0.5 + Math.cos(t * 7.3 + i) * 0.14,
        Math.sin(i * 1.7) * 0.4,
      ] as [number, number, number],
      scale: 0.7 + Math.sin(i * 0.6) * 0.3,
      color: P.rose,
    };
  });

  const cleanCells = Array.from({ length: 28 }, (_, i) => ({
    position: [
      -3.0 + (i % 7) * 0.45,
      1.3 - Math.floor(i / 7) * 0.45,
      0,
    ] as [number, number, number],
    scale: 1,
    color: P.teal,
  }));

  const trainCells = Array.from({ length: 36 }, (_, i) => {
    const c = i % 6;
    const r = Math.floor(i / 6);
    return {
      position: [
        1.4 + c * 0.45 + Math.sin(i * 0.9) * 0.06,
        1.0 - r * 0.4 + Math.cos(i * 1.1) * 0.05,
        0,
      ] as [number, number, number],
      scale: 1,
      color: P.teal,
    };
  });

  const contamCells = Array.from({ length: 6 }, (_, i) => ({
    position: [
      3.3 + (i % 3) * 0.4,
      1.0 - Math.floor(i / 3) * 0.5,
      0.2 + i * 0.05,
    ] as [number, number, number],
    scale: 1.2,
    color: P.amber,
  }));

  return (
    <Figure
      label="corpus hygiene"
      hint="dedup · filter · licence · mix"
      legend={[
        { color: P.rose, label: "raw dump" },
        { color: P.teal, label: "filtered" },
        { color: P.violet, label: "train mix" },
        { color: P.amber, label: "contamination" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "raw", label: "Raw dump", tone: P.rose },
            { value: "clean", label: "Filtered", tone: P.teal },
            { value: "mix", label: "Mix", tone: P.violet },
          ]}
          ariaLabel="dedup, filter, licence, mix"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.5], fov: 38 }}>
        {/* Floor reference: a sunken slab to give the cloud of points a horizon. */}
        <Slab position={[0, -2.2, 0]} size={[10, 0.05, 3]} color={P.line} fill={0.08} />

        {/* Always-on background dust for depth. */}
        <Motes count={140} radius={6.5} color={P.faint} size={0.025} opacity={0.35} />

        {/* Raw dump — a dense cloud of small cubes on the left. */}
        {mode === "raw" && (
          <>
            <Lattice cells={rawCells} size={0.13} opacity={0.92} />
            <Tag position={[-2.0, 2.4, 0]} tone="rose">raw dump · 50k pages</Tag>
            <Node3D position={[2.6, 0.4, 0]} color={P.faint} radius={0.05} />
            <Tag position={[2.6, 0.9, 0]} tone="muted">eval?</Tag>
          </>
        )}

        {/* Filtered — fewer, larger points, evenly spaced. */}
        {mode === "clean" && (
          <>
            <Lattice cells={cleanCells} size={0.16} matte />
            <Lattice cells={trainCells} size={0.14} matte />
            <Slab position={[2.5, 0.0, 0]} size={[2.4, 1.8, 0.12]} color={P.teal} fill={0.18} />
            <Tag position={[2.5, 1.1, 0.2]} tone="teal">train mix</Tag>
            <Tag position={[-2.0, 2.4, 0]} tone="teal">dedup · filter</Tag>
            {/* Rows that got dropped — flying off into the void. */}
            <Flow points={[[-2.0, 1.0, 0], [-4.5, 2.4, 0]]} color={P.rose} count={3} />
            <Flow points={[[-1.5, 0.4, 0], [-4.0, 2.0, 0]]} color={P.rose} count={3} />
            <Flow points={[[-1.0, -0.2, 0], [-3.6, 1.6, 0]]} color={P.rose} count={3} />
            <Tag position={[-4.4, 2.7, 0]} tone="rose">dropped</Tag>
          </>
        )}

        {/* Mix — train pile with a small cluster of contamination highlighted. */}
        {mode === "mix" && (
          <>
            <Lattice cells={trainCells} size={0.14} matte />
            <Lattice cells={contamCells} size={0.18} opacity={0.95} />
            <Halo position={[3.3, 0.4, 0]} radius={0.6} thickness={0.015} color={P.amber} opacity={0.55} spin={0.4} />
            <Slab position={[2.5, 0.0, 0]} size={[2.4, 1.8, 0.12]} color={P.violet} fill={0.2} />
            <Tag position={[2.5, 1.1, 0.2]} tone="violet">train mix</Tag>
            <Tag position={[3.3, 1.2, 0.2]} tone="amber">eval leak?</Tag>
            <Ribbon
              points={[
                [0, 0, 0],
                [1.25, 0, 0],
                [2.5, 0, 0],
              ]}
              color={P.violet}
              radius={0.04}
              opacity={0.7}
            />
            <Node3D position={[-1.8, -0.6, 0]} color={P.teal} radius={0.18} pulse={0.4} />
            <Tag position={[-1.8, -1.1, 0.2]} tone="teal">dedup</Tag>
            <Node3D position={[-0.4, -0.6, 0]} color={P.teal} radius={0.18} pulse={0.4} />
            <Tag position={[-0.4, -1.1, 0.2]} tone="teal">filter</Tag>
            <Node3D position={[1.0, -0.6, 0]} color={P.amber} radius={0.18} pulse={0.4} />
            <Tag position={[1.0, -1.1, 0.2]} tone="amber">contam. check</Tag>
          </>
        )}

        {/* Licence strip on the floor — reminder that data has provenance. */}
        {mode !== "raw" && (
          <Slab position={[0, -2.05, 0.5]} size={[8.5, 0.18, 0.18]} color={P.violet} fill={0.16} />
        )}
        {mode !== "raw" && (
          <Tag position={[0, -1.95, 0.5]} tone="muted">licence: cc-by / open / synthetic</Tag>
        )}
      </Stage>
    </Figure>
  );
}

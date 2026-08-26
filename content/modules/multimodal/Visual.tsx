"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "text" | "vision" | "browser";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("text");

  // Patch grid for vision — 5x5 = 25 patches.
  const patchCells = Array.from({ length: 25 }, (_, i) => {
    const c = i % 5;
    const r = Math.floor(i / 5);
    return {
      position: [-2.0 + c * 0.18, 1.2 - r * 0.18, 0] as [number, number, number],
      scale: 1,
      color: P.amber,
    };
  });

  // Text token strip.
  const tokenCells = Array.from({ length: 10 }, (_, i) => ({
    position: [-2.0 + i * 0.22, 1.2, 0] as [number, number, number],
    scale: 1,
    color: P.teal,
  }));

  return (
    <Figure
      label="text · image · browser"
      hint="tokens are not only words"
      legend={[
        { color: P.teal, label: "text" },
        { color: P.amber, label: "image patches" },
        { color: P.violet, label: "screenshot" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "text", label: "Text", tone: P.teal },
            { value: "vision", label: "Vision", tone: P.amber },
            { value: "browser", label: "Browser", tone: P.violet },
          ]}
          ariaLabel="tokens are not only words"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 9.5], fov: 38 }}>
        <Motes count={110} radius={7} color={P.faint} size={0.025} opacity={0.32} />

        {/* The residual stream — central horizontal beam. */}
        <Slab position={[0, -0.2, 0]} size={[8.4, 0.45, 0.1]} color={P.ink} fill={0.16} />
        <Tag position={[0, -0.6, 0.2]} tone="ink">residual stream</Tag>

        {/* Text-only: token strip flowing into the stream. */}
        {mode === "text" && (
          <>
            <Lattice cells={tokenCells} size={0.16} matte />
            <Tag position={[-1.0, 1.7, 0.2]} tone="teal">tokens</Tag>
            <Flow
              points={[
                [-1.0, 1.0, 0],
                [-1.0, 0.0, 0],
                [1.0, 0.0, 0],
              ]}
              color={P.teal}
              count={3}
              speed={0.5}
            />
            {/* Next-token prediction head on the right. */}
            <Node3D position={[3.6, -0.2, 0]} color={P.teal} radius={0.22} pulse={0.4} />
            <Tag position={[3.6, 0.45, 0.2]} tone="teal">next-token head</Tag>
          </>
        )}

        {/* Vision: image split into patches, projected to embeddings, dropped into stream. */}
        {mode === "vision" && (
          <>
            {/* Frame around the patch grid. */}
            <Slab position={[-2.0, 1.2, 0]} size={[1.4, 1.4, 0.08]} color={P.line} fill={0.08} />
            <Lattice cells={patchCells} size={0.13} matte />
            <Tag position={[-2.0, 2.05, 0.2]} tone="amber">image · 14×14 patches</Tag>
            {/* ViT encoder block. */}
            <Slab position={[-0.4, 1.2, 0]} size={[0.7, 1.0, 0.1]} color={P.amber} fill={0.22} />
            <Tag position={[-0.4, 1.85, 0.2]} tone="amber">ViT</Tag>
            {/* Projector. */}
            <Slab position={[0.5, 1.2, 0]} size={[0.5, 1.0, 0.1]} color={P.violet} fill={0.22} />
            <Tag position={[0.5, 1.85, 0.2]} tone="violet">proj.</Tag>
            {/* Embedding dots heading to the stream. */}
            <Lattice
              cells={Array.from({ length: 8 }, (_, i) => ({
                position: [1.4 + i * 0.16, 1.2, 0],
                scale: 1,
                color: P.violet,
              }))}
              size={0.1}
              matte
            />
            <Flow
              points={[
                [1.0, 1.2, 0],
                [2.0, 0.7, 0],
                [2.0, 0.0, 0],
              ]}
              color={P.violet}
              count={3}
              speed={0.4}
            />
            <Tag position={[2.0, -0.95, 0.2]} tone="muted">tokens enter stream</Tag>
          </>
        )}

        {/* Browser: agent + capture loop. */}
        {mode === "browser" && (
          <>
            {/* Browser screenshot frame. */}
            <Slab position={[-2.5, 1.4, 0]} size={[2.4, 1.6, 0.1]} color={P.violet} fill={0.18} />
            <Slab position={[-2.5, 1.4, 0]} size={[2.4, 1.6, 0.08]} color={P.line} fill={0.0} />
            <Tag position={[-2.5, 2.35, 0.2]} tone="violet">screenshot</Tag>
            {/* Old screenshots piling up — representation of "context bloat". */}
            {Array.from({ length: 4 }, (_, i) => (
              <Slab
                key={`old-${i}`}
                position={[-2.5 + (i - 1.5) * 0.05, 0.0 - i * 0.18, -0.1 * i]}
                size={[1.0, 0.6, 0.06]}
                color={P.lineStrong}
                fill={0.18}
              />
            ))}
            <Tag position={[-2.5, -1.05, 0.2]} tone="muted">old captures</Tag>

            {/* Tool call and agent loop. */}
            <Slab position={[1.4, 1.4, 0]} size={[1.6, 0.7, 0.1]} color={P.amber} fill={0.22} />
            <Tag position={[1.4, 1.85, 0.2]} tone="amber">tool: crop</Tag>
            <Slab position={[1.4, 0.4, 0]} size={[1.6, 0.7, 0.1]} color={P.teal} fill={0.22} />
            <Tag position={[1.4, 0.85, 0.2]} tone="teal">think + act</Tag>
            {/* Loop arrow back to the screenshot. */}
            <Flow
              points={[
                [0.5, 1.4, 0],
                [-1.3, 1.4, 0],
              ]}
              color={P.amber}
              count={2}
              speed={0.5}
            />
            <Flow
              points={[
                [-1.3, 1.1, 0],
                [0.5, 0.4, 0],
              ]}
              color={P.teal}
              count={2}
              speed={0.5}
            />
            <Tag position={[1.4, -0.45, 0.2]} tone="muted">act → observe → act</Tag>
          </>
        )}

        {/* Footer — caption per mode. */}
        <Slab position={[0, -2.6, 0]} size={[9.0, 0.4, 0.1]} color={P.line} fill={0.08} />
        <Tag position={[0, -2.6, 0.2]} tone="muted">
          {mode === "text"
            ? "text → tokens → residual stream → next token"
            : mode === "vision"
              ? "image → patches → ViT → projector → tokens → stream"
              : "browser: act → screenshot → think → loop"}
        </Tag>
      </Stage>
    </Figure>
  );
}

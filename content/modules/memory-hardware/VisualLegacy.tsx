"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "vram" | "unified" | "pcie";
type Size = "8b" | "48b";

export default function VisualLegacy() {
  const [mode, setMode] = useState<Mode>("vram");
  const [size, setSize] = useState<Size>("8b");

  // Approximate visual fill for weights vs KV
  const weightsFill = size === "48b" ? (mode === "unified" ? 0.50 : 0.42) : (mode === "unified" ? 0.22 : 0.18);
  const kvFill = mode === "unified" ? 0.34 : 0.30;

  return (
    <Figure
      label="where weights sit · A3B trap"
      hint="step the topology, then toggle 8B vs A3B"
      legend={[
          { color: P.teal, label: "pesos" },
          { color: P.amber, label: "KV cache" },
          { color: P.violet, label: "ancho de banda" }
      ]}
      controls={
        <div className="flex flex-col gap-2">
          <Switcher
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { value: "vram", label: "VRAM", tone: P.teal },
              { value: "unified", label: "Unified", tone: P.amber },
              { value: "pcie", label: "PCIe", tone: P.violet }
            ]}
            ariaLabel="topología de memoria"
          />
          <Switcher
            value={size}
            onChange={(v) => setSize(v as Size)}
            options={[
              { value: "8b", label: "Dense 8B", tone: P.teal },
              { value: "48b", label: "A3B 48B/3B", tone: P.violet }
            ]}
            ariaLabel="tamaño del modelo"
          />
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 8.0], fov: 40 }}>

        {/* Three memory slabs */}
        <Slab
          position={[-2.4, 0.1, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.teal}
          fill={mode === "vram" ? 0.30 : 0.14}
        />
        <Tag position={[-2.4, 1.05, 0.2]} tone="teal">VRAM</Tag>

        <Slab
          position={[0, 0.1, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.amber}
          fill={mode === "unified" ? 0.30 : 0.14}
        />
        <Tag position={[0, 1.05, 0.2]} tone="amber">Unified</Tag>

        <Slab
          position={[2.4, 0.1, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.violet}
          fill={mode === "pcie" ? 0.30 : 0.14}
        />
        <Tag position={[2.4, 1.05, 0.2]} tone="violet">PCIe / RAM</Tag>

        {/* Weights stack (lower inside each slab) */}
        {size === "8b" ? (
          <Slab position={[-2.4, -0.15, 0.08]} size={[1.5, 0.4, 0.06]} color={P.teal} fill={weightsFill} />
        ) : (
          <>
            <Slab position={[-2.4, -0.20, 0.08]} size={[1.7, 0.55, 0.06]} color={P.teal} fill={weightsFill} />
            <Slab position={[-2.4, 0.05, 0.10]} size={[1.5, 0.30, 0.06]} color={P.violet} fill={0.38} />
            <Tag position={[-2.4, 0.55, 0.2]} tone="violet">experts</Tag>
          </>
        )}
        {size === "8b" ? null : (
          <Tag position={[-2.4, -0.55, 0.2]} tone="muted">48B totales en memoria</Tag>
        )}

        {/* KV growth slider visual */}
        <Slab position={[0, -0.55, 0.08]} size={[1.5, 0.3, 0.06]} color={P.amber} fill={kvFill} />
        <Tag position={[0, -0.95, 0.2]} tone="amber">KV ↑ con contexto</Tag>

        {/* Bandwidth arrows */}
        {mode === "unified" ? (
          <Flow points={[[-1.3, 0.1, 0], [-1.05, 0.1, 0]]} color={P.amber} count={3} />
        ) : (
          <Flow points={[[-1.3, 0.1, 0], [-1.05, 0.1, 0]]} color={P.teal} count={3} />
        )}
        {mode === "pcie" ? (
          <>
            <Flow points={[[1.05, 0.1, 0], [1.3, 0.1, 0]]} color={P.violet} count={2} />
            <Flow points={[[1.3, -0.3, 0], [1.05, -0.3, 0]]} color={P.amber} count={2} />
          </>
        ) : null}

      </Stage>
    </Figure>
  );
}

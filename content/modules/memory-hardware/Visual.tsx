"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "vram" | "unified" | "pcie";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("vram");
  return (
    <Figure
      label="where weights sit"
      hint="step the figure"
      legend={[
          { color: P.teal, label: "vram" },
          { color: P.amber, label: "unified" },
          { color: P.violet, label: "pcie" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "vram", label: "VRAM", tone: P.teal },
            { value: "unified", label: "Unified", tone: P.amber },
            { value: "pcie", label: "PCIe", tone: P.violet }
          ]}
          ariaLabel="step the figure"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.teal} fill={mode === "vram" ? 0.34 : 0.12} />
        <Tag position={[-2.2, 1.2, 0.2]} tone="teal">VRAM</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.amber} fill={mode === "unified" ? 0.34 : 0.12} />
        <Tag position={[0, 1.2, 0.2]} tone="amber">Unified</Tag>
        <Slab position={[2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.violet} fill={mode === "pcie" ? 0.34 : 0.12} />
        <Tag position={[2.2, 1.2, 0.2]} tone="violet">PCIe</Tag>
        <Flow points={[[-1.2, 0.2, 0], [-0.95, 0.2, 0]]} color={P.teal} count={2} />
        <Flow points={[[1.0, 0.2, 0], [1.25, 0.2, 0]]} color={P.amber} count={2} />
        
      </Stage>
    </Figure>
  );
}

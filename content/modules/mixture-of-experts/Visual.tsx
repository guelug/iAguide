"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "dense" | "route" | "vram";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("dense");
  return (
    <Figure
      label="router · experts"
      hint="most parameters sleep"
      legend={[
          { color: P.teal, label: "dense" },
          { color: P.amber, label: "top-k" },
          { color: P.violet, label: "vram bill" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "dense", label: "Dense", tone: P.teal },
            { value: "route", label: "Top-k", tone: P.amber },
            { value: "vram", label: "VRAM bill", tone: P.violet }
          ]}
          ariaLabel="most parameters sleep"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Node3D position={[0, 1.2, 0]} color={P.amber} radius={0.18} pulse={0.3} />
        <Tag position={[0, 1.65, 0.2]} tone="amber">router</Tag>
        {Array.from({ length: 6 }).map((_, i) => {
          const x = -2.5 + i * 1.0;
          const on = mode === "dense" || i === 1 || i === 4;
          return (
            <group key={i}>
              <Slab position={[x, -0.2, 0]} size={[0.7, 1.3, 0.1]} color={on ? P.teal : P.line} fill={on ? 0.3 : 0.08} />
            </group>
          );
        })}
        <Tag position={[0, -1.2, 0.2]} tone="violet">{mode === "vram" ? "all experts still resident" : "active MLP"}</Tag>
        <Flow points={[[0, 1.2, 0], [-1.5, 0.5, 0]]} color={P.teal} count={2} />
        <Flow points={[[0, 1.2, 0], [1.5, 0.5, 0]]} color={P.teal} count={2} />
    
      </Stage>
    </Figure>
  );
}

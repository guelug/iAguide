"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "quiz" | "gaia" | "product";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("quiz");
  return (
    <Figure
      label="quiz vs GAIA"
      hint="easy for people, hard for loops"
      legend={[
          { color: P.amber, label: "quiz" },
          { color: P.teal, label: "gaia" },
          { color: P.violet, label: "product" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "quiz", label: "Quiz", tone: P.amber },
            { value: "gaia", label: "GAIA", tone: P.teal },
            { value: "product", label: "Product", tone: P.violet }
          ]}
          ariaLabel="easy for people, hard for loops"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.1, 0.2, 0]} size={[2.0, 1.8, 0.12]} color={P.amber} fill={mode === "quiz" ? 0.32 : 0.12} />
        <Tag position={[-2.1, 1.25, 0.2]} tone="amber">multiple choice</Tag>
        <Slab position={[2.1, 0.2, 0]} size={[2.0, 1.8, 0.12]} color={P.teal} fill={mode !== "quiz" ? 0.32 : 0.12} />
        <Tag position={[2.1, 1.25, 0.2]} tone="teal">multi-hop tools</Tag>
        <Node3D position={[0, 0.2, 0]} color={mode === "product" ? P.violet : P.lineStrong} radius={0.2} />
        <Tag position={[0, -0.4, 0.2]} tone="violet">{mode === "product" ? "your users" : "not equal"}</Tag>
        <Wire points={[[-1.05, 0.2, 0], [-0.25, 0.2, 0]]} dashed={mode !== "product"} />
        <Wire points={[[0.25, 0.2, 0], [1.05, 0.2, 0]]} dashed={mode !== "product"} />
    
      </Stage>
    </Figure>
  );
}

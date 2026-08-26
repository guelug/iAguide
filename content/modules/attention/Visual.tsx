"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "qkv" | "heads" | "gqa";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("qkv");
  return (
    <Figure
      label="attention block"
      hint="one query, many keys, a blend of values"
      legend={[
          { color: P.teal, label: "q k v" },
          { color: P.amber, label: "heads" },
          { color: P.violet, label: "gqa" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "qkv", label: "Q K V", tone: P.teal },
            { value: "heads", label: "Heads", tone: P.amber },
            { value: "gqa", label: "GQA", tone: P.violet }
          ]}
          ariaLabel="one query, many keys, a blend of values"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        {Array.from({ length: 7 }).map((_, i) => {
          const x = -2.4 + i * 0.8;
          const share = mode === "gqa" ? i % 2 === 0 : true;
          return (
            <group key={i}>
              <Node3D position={[x, 1.1, 0]} color={P.teal} radius={i === 3 ? 0.18 : 0.1} pulse={i === 3 ? 0.3 : 0} />
              <Node3D position={[x, 0.2, 0]} color={share ? P.amber : P.line} radius={0.1} matte />
              <Node3D position={[x, -0.7, 0]} color={share ? P.violet : P.line} radius={0.1} matte />
              {i === 3 ? <Flow points={[[x, 1.1, 0], [-2.4, 0.2, 0]]} color={P.teal} count={2} /> : null}
            </group>
          );
        })}
        <Tag position={[0, 1.6, 0.2]} tone="teal">queries</Tag>
        <Tag position={[0, -1.2, 0.2]} tone="violet">{mode === "gqa" ? "shared KV" : "values"}</Tag>
        {mode === "heads" ? <Tag position={[0, -1.65, 0.2]} tone="amber">concat heads → MLP</Tag> : null}
    
      </Stage>
    </Figure>
  );
}

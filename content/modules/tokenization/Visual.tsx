"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "roles" | "special" | "template";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("roles");
  return (
    <Figure
      label="roles · special tokens · template"
      hint="three dimensions of the same string"
      legend={[
          { color: P.teal, label: "roles" },
          { color: P.rose, label: "special tokens" },
          { color: P.violet, label: "chat template" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "roles", label: "Roles", tone: P.teal },
            { value: "special", label: "Special tokens", tone: P.rose },
            { value: "template", label: "Chat template", tone: P.violet }
          ]}
          ariaLabel="three dimensions of the same string"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        {([
          ["system", P.teal, 1.05],
          ["user", P.amber, 0.15],
          ["assistant", P.violet, -0.75],
        ] as const).map(([role, color, y]) => (
          <group key={role}>
            <Slab position={[-2.1, y, 0]} size={[2.2, 0.7, 0.1]} color={color} fill={0.28} />
            <Tag position={[-2.1, y, 0.2]} tone={role === "system" ? "teal" : role === "user" ? "amber" : "violet"}>{role}</Tag>
            {mode !== "roles" ? (
              <Node3D position={[-0.7, y, 0.12]} color={P.rose} radius={0.1} matte />
            ) : null}
          </group>
        ))}
        <Slab position={[2.0, 0.15, 0]} size={[2.5, 2.6, 0.12]} color={mode === "template" ? P.violet : P.lineStrong} fill={mode === "template" ? 0.2 : 0.08} />
        <Tag position={[2.0, 1.55, 0.2]} tone={mode === "template" ? "violet" : "muted"}>
          {mode === "template" ? "rendered prompt" : "not yet a string"}
        </Tag>
        {mode === "template" ? (
          <Flow points={[[-0.9, 0.15, 0], [0.7, 0.15, 0]]} color={P.violet} count={4} />
        ) : (
          <Wire points={[[-0.9, 0.15, 0], [0.7, 0.15, 0]]} dashed />
        )}
        {mode === "special" ? <Tag position={[0, -1.55, 0.2]} tone="rose">im_start · eot_id · im_end</Tag> : null}
    
      </Stage>
    </Figure>
  );
}

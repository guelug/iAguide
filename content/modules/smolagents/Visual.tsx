"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "json" | "code" | "exec";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("json");
  return (
    <Figure
      label="code-as-action vs JSON"
      hint="same loop, different payload"
      legend={[
          { color: P.amber, label: "json blob" },
          { color: P.teal, label: "python code" },
          { color: P.violet, label: "sandbox" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "json", label: "JSON blob", tone: P.amber },
            { value: "code", label: "Python code", tone: P.teal },
            { value: "exec", label: "Sandbox", tone: P.violet }
          ]}
          ariaLabel="same loop, different payload"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.1, 0.25, 0]} size={[2.2, 1.9, 0.12]} color={P.amber} fill={mode === "json" ? 0.32 : 0.12} />
        <Tag position={[-2.1, 1.35, 0.2]} tone="amber">{"{"}name, args{"}"}</Tag>
        <Slab position={[2.1, 0.25, 0]} size={[2.2, 1.9, 0.12]} color={P.teal} fill={mode !== "json" ? 0.32 : 0.12} />
        <Tag position={[2.1, 1.35, 0.2]} tone="teal">results = tool()</Tag>
        <Node3D position={[0, 0.25, 0]} color={mode === "exec" ? P.violet : P.lineStrong} radius={0.2} pulse={mode === "exec" ? 0.4 : 0} />
        <Tag position={[0, -0.35, 0.2]} tone="violet">{mode === "exec" ? "interpreter" : "parser"}</Tag>
        <Flow points={[[-0.95, 0.25, 0], [-0.25, 0.25, 0]]} color={P.amber} count={2} />
        <Flow points={[[0.25, 0.25, 0], [0.95, 0.25, 0]]} color={P.teal} count={2} />
    
      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "stuff" | "index" | "soul";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("stuff");
  return (
    <Figure
      label="budget the window"
      hint="what you retrieve is a decision"
      legend={[
          { color: P.amber, label: "stuff files" },
          { color: P.teal, label: "skills index" },
          { color: P.violet, label: "soul / memory" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "stuff", label: "Stuff files", tone: P.amber },
            { value: "index", label: "Skills index", tone: P.teal },
            { value: "soul", label: "SOUL / MEMORY", tone: P.violet }
          ]}
          ariaLabel="what you retrieve is a decision"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[0, 0.9, 0]} size={[5.4, 0.5, 0.1]} color={P.teal} fill={0.18} />
        <Tag position={[0, 1.35, 0.2]} tone="teal">context window</Tag>
        {[
          [-2.0, "profile", P.teal],
          [-0.35, mode === "stuff" ? "whole repo" : "index hit", mode === "stuff" ? P.amber : P.teal],
          [1.3, "thread", P.lineStrong],
          [2.6, mode === "soul" ? "MEMORY" : "tools", mode === "soul" ? P.violet : P.amber],
        ].map(([x, lab, col], i) => (
          <group key={i}>
            <Slab position={[x as number, -0.2, 0]} size={[1.4, 1.1, 0.1]} color={col as string} fill={0.26} />
            <Tag position={[x as number, -0.2, 0.2]} size="xs" tone="muted">{lab as string}</Tag>
          </group>
        ))}
    
      </Stage>
    </Figure>
  );
}

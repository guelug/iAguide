"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "text" | "vision" | "browser";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("text");
  return (
    <Figure
      label="text · image · browser"
      hint="tokens are not only words"
      legend={[
          { color: P.teal, label: "text" },
          { color: P.amber, label: "vision" },
          { color: P.violet, label: "browser" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "text", label: "Text", tone: P.teal },
            { value: "vision", label: "Vision", tone: P.amber },
            { value: "browser", label: "Browser", tone: P.violet }
          ]}
          ariaLabel="tokens are not only words"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.3, 0]} size={[1.8, 1.6, 0.12]} color={P.teal} fill={mode === "text" ? 0.32 : 0.12} />
        <Tag position={[-2.2, 1.25, 0.2]} tone="teal">tokens</Tag>
        <Slab position={[0, 0.3, 0]} size={[1.8, 1.6, 0.12]} color={P.amber} fill={mode === "vision" ? 0.32 : 0.12} />
        <Tag position={[0, 1.25, 0.2]} tone="amber">patches</Tag>
        <Slab position={[2.2, 0.3, 0]} size={[1.8, 1.6, 0.12]} color={P.violet} fill={mode === "browser" ? 0.32 : 0.12} />
        <Tag position={[2.2, 1.25, 0.2]} tone="violet">screenshot</Tag>
        <Flow points={[[-2.2, -0.7, 0], [0, -1.2, 0], [2.2, -0.7, 0]]} color={mode === "browser" ? P.violet : mode === "vision" ? P.amber : P.teal} count={4} />
        <Tag position={[0, -1.65, 0.2]} tone="muted">one residual stream</Tag>
    
      </Stage>
    </Figure>
  );
}

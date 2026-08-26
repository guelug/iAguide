"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "perm" | "inject" | "rag";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("perm");
  return (
    <Figure
      label="permissions · retrieved text"
      hint="untrusted docs are not instructions"
      legend={[
          { color: P.teal, label: "permissions" },
          { color: P.rose, label: "injected doc" },
          { color: P.amber, label: "rag attack" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "perm", label: "Permissions", tone: P.teal },
            { value: "inject", label: "Injected doc", tone: P.rose },
            { value: "rag", label: "RAG attack", tone: P.amber }
          ]}
          ariaLabel="untrusted docs are not instructions"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.3, 0]} size={[2.0, 1.7, 0.12]} color={P.teal} fill={mode === "perm" ? 0.3 : 0.14} />
        <Tag position={[-2.2, 1.3, 0.2]} tone="teal">allowlist</Tag>
        <Slab position={[0.2, 0.3, 0]} size={[2.0, 1.7, 0.12]} color={mode !== "perm" ? P.rose : P.lineStrong} fill={mode !== "perm" ? 0.3 : 0.1} />
        <Tag position={[0.2, 1.3, 0.2]} tone={mode !== "perm" ? "rose" : "muted"}>retrieved chunk</Tag>
        <Slab position={[2.5, 0.3, 0]} size={[1.6, 1.7, 0.12]} color={P.violet} fill={0.16} />
        <Tag position={[2.5, 1.3, 0.2]} tone="violet">model</Tag>
        <Flow points={[[-1.15, 0.3, 0], [-0.85, 0.3, 0]]} color={P.teal} count={2} />
        <Flow points={[[1.25, 0.3, 0], [1.65, 0.3, 0]]} color={mode !== "perm" ? P.rose : P.lineStrong} count={3} />
    
      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "input" | "output" | "cache";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("input");
  return (
    <Figure
      label="tokens are a bill"
      hint="cache hits are the discount"
      legend={[
          { color: P.teal, label: "input tokens" },
          { color: P.amber, label: "output" },
          { color: P.violet, label: "cached prefix" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "input", label: "Input tokens", tone: P.teal },
            { value: "output", label: "Output", tone: P.amber },
            { value: "cache", label: "Cached prefix", tone: P.violet }
          ]}
          ariaLabel="cache hits are the discount"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-1.8, 0.3, 0]} size={[2.4, 1.5, 0.12]} color={P.teal} fill={mode === "cache" ? 0.12 : 0.3} />
        <Tag position={[-1.8, 1.2, 0.2]} tone="teal">{mode === "cache" ? "prefix hit" : "prefill bill"}</Tag>
        <Slab position={[1.8, 0.3, 0]} size={[2.4, 1.5, 0.12]} color={P.amber} fill={0.3} />
        <Tag position={[1.8, 1.2, 0.2]} tone="amber">decode bill</Tag>
        {mode === "cache" ? <Tag position={[0, -1.15, 0.2]} tone="violet">you still pay the new tokens</Tag> : <Tag position={[0, -1.15, 0.2]} tone="muted">input + output ≠ words</Tag>}
    
      </Stage>
    </Figure>
  );
}

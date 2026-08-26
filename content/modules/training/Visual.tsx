"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "pt" | "sft" | "rl";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("pt");
  return (
    <Figure
      label="pretrain · SFT · RL"
      hint="step the figure"
      legend={[
          { color: P.teal, label: "pretrain" },
          { color: P.amber, label: "sft" },
          { color: P.violet, label: "preference" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "pt", label: "Pretrain", tone: P.teal },
            { value: "sft", label: "SFT", tone: P.amber },
            { value: "rl", label: "Preference", tone: P.violet }
          ]}
          ariaLabel="step the figure"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.teal} fill={mode === "pt" ? 0.34 : 0.12} />
        <Tag position={[-2.2, 1.2, 0.2]} tone="teal">Pretrain</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.amber} fill={mode === "sft" ? 0.34 : 0.12} />
        <Tag position={[0, 1.2, 0.2]} tone="amber">SFT</Tag>
        <Slab position={[2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.violet} fill={mode === "rl" ? 0.34 : 0.12} />
        <Tag position={[2.2, 1.2, 0.2]} tone="violet">Preference</Tag>
        <Flow points={[[-1.2, 0.2, 0], [-0.95, 0.2, 0]]} color={P.teal} count={2} />
        <Flow points={[[1.0, 0.2, 0], [1.25, 0.2, 0]]} color={P.amber} count={2} />
        
      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "hallucinate" | "stop" | "real";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("hallucinate");
  return (
    <Figure
      label="stop · run · append"
      hint="do not let the model invent the Observation"
      legend={[
          { color: P.rose, label: "hallucinated obs" },
          { color: P.amber, label: "stop token" },
          { color: P.teal, label: "real tool" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "hallucinate", label: "Hallucinated obs", tone: P.rose },
            { value: "stop", label: "Stop token", tone: P.amber },
            { value: "real", label: "Real tool", tone: P.teal }
          ]}
          ariaLabel="do not let the model invent the Observation"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.4, 0]} size={[2.0, 1.6, 0.12]} color={P.violet} fill={0.2} />
        <Tag position={[-2.2, 1.35, 0.2]} tone="violet">model text</Tag>
        <Tag position={[-2.2, 0.5, 0.2]} tone="muted" size="xs">Thought</Tag>
        <Tag position={[-2.2, 0.05, 0.2]} tone="amber" size="xs">Action JSON</Tag>
        <Slab position={[2.0, 0.4, 0]} size={[2.2, 1.6, 0.12]} color={mode === "hallucinate" ? P.rose : P.teal} fill={0.28} />
        <Tag position={[2.0, 1.35, 0.2]} tone={mode === "hallucinate" ? "rose" : "teal"}>
          {mode === "hallucinate" ? "fake Observation" : "get_weather()"}
        </Tag>
        {mode === "stop" ? (
          <Tag position={[0, -1.2, 0.2]} tone="amber">stop=["Observation:"]</Tag>
        ) : null}
        <Flow points={[[-1.15, 0.4, 0], [0.85, 0.4, 0]]} color={mode === "hallucinate" ? P.rose : P.teal} count={3} paused={mode === "stop"} />
    
      </Stage>
    </Figure>
  );
}

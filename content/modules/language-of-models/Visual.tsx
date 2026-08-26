"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "engine" | "chat" | "loop";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("engine");
  return (
    <Figure
      label="engine inside the loop"
      hint="the model predicts tokens; the harness is elsewhere"
      legend={[
          { color: P.teal, label: "engine" },
          { color: P.amber, label: "chat model" },
          { color: P.violet, label: "inside a loop" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "engine", label: "Engine", tone: P.teal },
            { value: "chat", label: "Chat model", tone: P.amber },
            { value: "loop", label: "Inside a loop", tone: P.violet }
          ]}
          ariaLabel="the model predicts tokens; the harness is elsewhere"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[0, 0.35, 0]} size={[2.4, 1.4, 0.14]} color={P.teal} fill={mode === "engine" ? 0.38 : 0.16} />
        <Tag position={[0, 1.2, 0.2]} tone="teal">LLM</Tag>
        <Node3D position={[-0.55, 0.35, 0.18]} color={P.amber} radius={0.14} matte />
        <Node3D position={[0.0, 0.35, 0.18]} color={P.amber} radius={0.14} matte pulse={mode !== "engine" ? 0.4 : 0} />
        <Node3D position={[0.55, 0.35, 0.18]} color={P.line} radius={0.14} matte />
        <Tag position={[0, -0.55, 0.2]} tone="amber">{mode === "chat" ? "instruct template" : "next token"}</Tag>
        {mode === "loop" ? (
          <>
            <Wire points={[[-2.6, 0.35, 0], [-1.25, 0.35, 0]]} color={P.violet} />
            <Wire points={[[1.25, 0.35, 0], [2.6, 0.35, 0]]} color={P.violet} />
            <Node3D position={[-2.6, 0.35, 0]} color={P.violet} radius={0.16} />
            <Node3D position={[2.6, 0.35, 0]} color={P.violet} radius={0.16} />
            <Tag position={[-2.6, -0.15, 0.2]} tone="violet">tools</Tag>
            <Tag position={[2.6, -0.15, 0.2]} tone="violet">thread</Tag>
            <Flow points={[[-2.6, 0.35, 0], [0, 0.35, 0], [2.6, 0.35, 0], [2.6, -1.35, 0], [-2.6, -1.35, 0], [-2.6, 0.35, 0]]} color={P.violet} count={5} />
          </>
        ) : (
          <Flow points={[[-1.6, 0.35, 0], [1.6, 0.35, 0]]} color={P.teal} count={3} />
        )}
    
      </Stage>
    </Figure>
  );
}

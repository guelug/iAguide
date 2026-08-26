"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "tool" | "quiz" | "gaia";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("tool");
  return (
    <Figure
      label="unit tests without a model"
      hint="the loop is testable"
      legend={[
          { color: P.teal, label: "tool tests" },
          { color: P.amber, label: "looks good" },
          { color: P.rose, label: "fails gaia" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "tool", label: "Tool tests", tone: P.teal },
            { value: "quiz", label: "Looks good", tone: P.amber },
            { value: "gaia", label: "Fails GAIA", tone: P.rose }
          ]}
          ariaLabel="the loop is testable"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        {["allow", "parse", "stop"].map((lab, i) => (
          <group key={lab}>
            <Slab position={[-2.2 + i * 2.2, 0.55, 0]} size={[1.8, 1.1, 0.1]} color={i === 2 && mode === "gaia" ? P.rose : P.teal} fill={0.24} />
            <Tag position={[-2.2 + i * 2.2, 0.55, 0.2]} tone={i === 2 && mode === "gaia" ? "rose" : "teal"}>{lab}</Tag>
          </group>
        ))}
        <Tag position={[0, -1.0, 0.2]} tone={mode === "quiz" ? "amber" : mode === "gaia" ? "rose" : "teal"}>
          {mode === "quiz" ? "quiz 9/10" : mode === "gaia" ? "GAIA 2/466" : "no GPU required"}
        </Tag>
    
      </Stage>
    </Figure>
  );
}

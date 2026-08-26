"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "intake" | "assemble" | "model" | "tools" | "persist";

const OPTIONS = [
  { value: "intake" as const, label: "intake", tone: "var(--teal)" },
  { value: "assemble" as const, label: "assemble", tone: "var(--teal)" },
  { value: "model" as const, label: "model", tone: "var(--amber)" },
  { value: "tools" as const, label: "tools", tone: "var(--violet)" },
  { value: "persist" as const, label: "persist", tone: "var(--amber)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("intake");

  return (
    <Figure
      label="The agent loop"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "core path" },
        { color: P.amber, label: "cost / volatile" },
        { color: P.violet, label: "extension" },
      ]}
      controls={
        <Switcher
          ariaLabel="agent-loop diagram steps"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.4], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active }: { active: Step }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "intake" ? P.teal : P.lineStrong}
        fill={active === "intake" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        intake
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "assemble" ? P.amber : P.lineStrong}
        fill={active === "assemble" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        assemble
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "model" ? P.violet : P.lineStrong}
        fill={active === "model" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        model
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "tools" ? P.teal : P.lineStrong}
        fill={active === "tools" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        tools
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "persist" ? P.amber : P.lineStrong}
        fill={active === "persist" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        persist
      </Tag>
    </group>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "reg" | "disc" | "sets" | "path" | "term";

const OPTIONS = [
  { value: "reg" as const, label: "register()", tone: "var(--teal)" },
  { value: "disc" as const, label: "AST discover", tone: "var(--teal)" },
  { value: "sets" as const, label: "toolsets.py", tone: "var(--amber)" },
  { value: "path" as const, label: "dispatch path", tone: "var(--violet)" },
  { value: "term" as const, label: "7 backends", tone: "var(--amber)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("reg");

  return (
    <Figure
      label="Hermes: toolsets and registry"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "core path" },
        { color: P.amber, label: "cost / volatile" },
        { color: P.violet, label: "extension" },
      ]}
      controls={
        <Switcher
          ariaLabel="hermes-tools diagram steps"
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
        color={active === "reg" ? P.teal : P.lineStrong}
        fill={active === "reg" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        register()
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "disc" ? P.amber : P.lineStrong}
        fill={active === "disc" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        AST discover
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "sets" ? P.violet : P.lineStrong}
        fill={active === "sets" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        toolsets.py
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "path" ? P.teal : P.lineStrong}
        fill={active === "path" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        dispatch path
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "term" ? P.amber : P.lineStrong}
        fill={active === "term" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        7 backends
      </Tag>
    </group>
  );
}

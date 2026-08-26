"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "soul" | "ctx" | "mem" | "hint" | "skip";

const OPTIONS = [
  { value: "soul" as const, label: "SOUL.md", tone: "var(--teal)" },
  { value: "ctx" as const, label: "one context file", tone: "var(--teal)" },
  { value: "mem" as const, label: "MEMORY/USER", tone: "var(--amber)" },
  { value: "hint" as const, label: "platform hint", tone: "var(--violet)" },
  { value: "skip" as const, label: "skip_context", tone: "var(--amber)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("soul");

  return (
    <Figure
      label="Hermes: prompt tiers"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "core path" },
        { color: P.amber, label: "cost / volatile" },
        { color: P.violet, label: "extension" },
      ]}
      controls={
        <Switcher
          ariaLabel="hermes-assembly diagram steps"
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
        color={active === "soul" ? P.teal : P.lineStrong}
        fill={active === "soul" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        SOUL.md
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "ctx" ? P.amber : P.lineStrong}
        fill={active === "ctx" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        one context file
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "mem" ? P.violet : P.lineStrong}
        fill={active === "mem" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        MEMORY/USER
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "hint" ? P.teal : P.lineStrong}
        fill={active === "hint" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        platform hint
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "skip" ? P.amber : P.lineStrong}
        fill={active === "skip" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        skip_context
      </Tag>
    </group>
  );
}

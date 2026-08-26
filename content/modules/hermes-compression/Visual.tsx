"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "g85" | "a50" | "phase" | "inplace" | "s3";

const OPTIONS = [
  { value: "g85" as const, label: "gateway 85%", tone: "var(--amber)" },
  { value: "a50" as const, label: "in-loop 50%", tone: "var(--teal)" },
  { value: "phase" as const, label: "4 phases", tone: "var(--violet)" },
  { value: "inplace" as const, label: "in-place", tone: "var(--teal)" },
  { value: "s3" as const, label: "system_and_3", tone: "var(--amber)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("g85");

  return (
    <Figure
      label="Hermes: dual compression + system_and_3"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "core path" },
        { color: P.amber, label: "cost / volatile" },
        { color: P.violet, label: "extension" },
      ]}
      controls={
        <Switcher
          ariaLabel="hermes-compression diagram steps"
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
        color={active === "g85" ? P.teal : P.lineStrong}
        fill={active === "g85" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        gateway 85%
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "a50" ? P.amber : P.lineStrong}
        fill={active === "a50" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        in-loop 50%
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "phase" ? P.violet : P.lineStrong}
        fill={active === "phase" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        4 phases
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "inplace" ? P.teal : P.lineStrong}
        fill={active === "inplace" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        in-place
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "s3" ? P.amber : P.lineStrong}
        fill={active === "s3" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        system_and_3
      </Tag>
    </group>
  );
}

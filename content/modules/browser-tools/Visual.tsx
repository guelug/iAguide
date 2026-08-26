"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "tool" | "cdp" | "dialog" | "frames" | "target";

const OPTIONS = [
  { value: "tool" as const, label: "browser tool", tone: "var(--teal)" },
  { value: "cdp" as const, label: "CDP socket", tone: "var(--teal)" },
  { value: "dialog" as const, label: "dialogs", tone: "var(--amber)" },
  { value: "frames" as const, label: "frames", tone: "var(--violet)" },
  { value: "target" as const, label: "sandbox/host/node", tone: "var(--amber)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("tool");

  return (
    <Figure
      label="Browser as a tool backend"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "core path" },
        { color: P.amber, label: "cost / volatile" },
        { color: P.violet, label: "extension" },
      ]}
      controls={
        <Switcher
          ariaLabel="browser-tools diagram steps"
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
        color={active === "tool" ? P.teal : P.lineStrong}
        fill={active === "tool" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        browser tool
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "cdp" ? P.amber : P.lineStrong}
        fill={active === "cdp" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        CDP socket
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "dialog" ? P.violet : P.lineStrong}
        fill={active === "dialog" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        dialogs
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "frames" ? P.teal : P.lineStrong}
        fill={active === "frames" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        frames
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "target" ? P.amber : P.lineStrong}
        fill={active === "target" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        sandbox/host/node
      </Tag>
    </group>
  );
}

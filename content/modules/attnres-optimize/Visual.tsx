"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "naive" | "cached" | "twophase";

const OPTIONS = [
  { value: "naive" as const, label: "naive PP", tone: "var(--amber)" },
  { value: "cached" as const, label: "cached", tone: "var(--teal)" },
  { value: "twophase" as const, label: "two-phase", tone: "var(--violet)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("naive");

  return (
    <Figure
      label="AttnRes systems"
      hint="step the diagram"
      legend={[
        { color: P.amber, label: "full history / resend" },
        { color: P.teal, label: "cached increment" },
        { color: P.violet, label: "phase 1 / phase 2" },
      ]}
      controls={
        <Switcher
          ariaLabel="attention residual systems diagrams"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.6], fov: 40 }}>
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
      {active === "naive" ? <NaiveScene /> : null}
      {active === "cached" ? <CachedScene /> : null}
      {active === "twophase" ? <TwoPhaseScene /> : null}
    </group>
  );
}

function NaiveScene() {
  const ranks = [-2.25, -0.75, 0.75, 2.25];
  return (
    <group>
      <Tag position={[0, 1.7, 0]} tone="amber" center>
        every hop resends history
      </Tag>
      {ranks.map((x, i) => (
        <group key={i}>
          <Slab position={[x, -0.15, 0]} size={[1.15, 1.55, 0.14]} color={P.lineStrong} fill={0.16} />
          {[0, 1, 2, 3].slice(0, i + 1).map((k) => (
            <Slab
              key={k}
              position={[x, -0.55 + k * 0.32, 0]}
              size={[0.78, 0.22, 0.1]}
              color={P.amber}
              fill={0.28 + k * 0.12}
            />
          ))}
          <Tag position={[x, -1.25, 0]} tone="amber" center>
            {`rank ${i}`}
          </Tag>
        </group>
      ))}
      <Wire points={[[-2.25, 0.55, 0], [2.25, 0.55, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.25, 0.55, 0], [2.25, 0.55, 0]]} color={P.amber} count={4} speed={0.32} />
    </group>
  );
}

function CachedScene() {
  const ranks = [-2.25, -0.75, 0.75, 2.25];
  return (
    <group>
      <Tag position={[0, 1.7, 0]} tone="teal" center>
        send only the new block
      </Tag>
      {ranks.map((x, i) => (
        <group key={i}>
          <Slab position={[x, -0.2, 0]} size={[1.15, 1.45, 0.14]} color={P.lineStrong} fill={0.16} />
          <Slab position={[x, -0.45, 0]} size={[0.78, 0.55, 0.1]} color={P.teal} fill={0.22} />
          <Slab position={[x, 0.35, 0]} size={[0.78, 0.28, 0.1]} color={P.teal} fill={0.55} />
          <Tag position={[x, -1.25, 0]} tone="teal" center>
            {`rank ${i}`}
          </Tag>
        </group>
      ))}
      <Wire points={[[-2.25, 0.35, 0], [2.25, 0.35, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.25, 0.35, 0], [2.25, 0.35, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0.75, 0.35, 0]} color={P.teal} radius={0.1} pulse={0.35} />
    </group>
  );
}

function TwoPhaseScene() {
  const qs = [-1.7, -0.55, 0.6, 1.75];
  return (
    <group>
      <Tag position={[0, 1.7, 0]} tone="violet" center>
        phase 1 batch, phase 2 merge
      </Tag>
      {qs.map((x, i) => (
        <group key={i}>
          <Slab position={[x, 0.85, 0]} size={[0.85, 0.38, 0.1]} color={P.violet} fill={0.28 + i * 0.08} />
          <Tag position={[x, 1.28, 0]} tone="violet" center>
            {`w${i}`}
          </Tag>
        </group>
      ))}
      <Slab position={[0, 0.05, 0]} size={[3.6, 0.42, 0.12]} color={P.violet} fill={0.4} />
      <Tag position={[0, -0.45, 0]} tone="violet" center>
        batched vs previous blocks
      </Tag>
      <Slab position={[-1.1, -1.15, 0]} size={[1.5, 0.38, 0.1]} color={P.teal} fill={0.5} />
      <Slab position={[1.1, -1.15, 0]} size={[1.5, 0.38, 0.1]} color={P.amber} fill={0.5} />
      <Tag position={[-1.1, -1.6, 0]} tone="teal" center>
        max + LSE
      </Tag>
      <Tag position={[1.1, -1.6, 0]} tone="amber" center>
        online merge
      </Tag>
      <Wire points={[[0, -0.2, 0], [-1.1, -0.95, 0]]} color={P.line} opacity={0.45} />
      <Wire points={[[0, -0.2, 0], [1.1, -0.95, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-1.7, 0.65, 0], [0, 0.05, 0]]} color={P.violet} count={2} speed={0.28} />
    </group>
  );
}

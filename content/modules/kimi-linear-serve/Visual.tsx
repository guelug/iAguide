"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "laptop" | "gpu-box" | "1m-context";

const OPTIONS = [
  { value: "laptop" as const, label: "laptop", tone: "var(--amber)" },
  { value: "gpu-box" as const, label: "gpu-box", tone: "var(--teal)" },
  { value: "1m-context" as const, label: "1m-context", tone: "var(--violet)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("laptop");

  return (
    <Figure
      label="What actually fits"
      hint="step the diagram"
      legend={[
        { color: P.amber, label: "weights / overflow" },
        { color: P.teal, label: "KDA chips" },
        { color: P.violet, label: "MLA KV" },
      ]}
      controls={
        <Switcher
          ariaLabel="kimi linear serve diagrams"
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
      {active === "laptop" ? <LaptopScene /> : null}
      {active === "gpu-box" ? <GpuScene /> : null}
      {active === "1m-context" ? <ContextScene /> : null}
    </group>
  );
}

function LaptopScene() {
  return (
    <group>
      <Slab position={[0, -0.55, 0]} size={[2.4, 0.18, 1.5]} color={P.lineStrong} fill={0.22} />
      <Slab position={[0, 0.05, 0]} size={[2.05, 1.15, 0.12]} color={P.lineStrong} fill={0.18} />
      <Tag position={[0, -1.05, 0]} tone="amber" center>
        24 GB card
      </Tag>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Slab
          key={i}
          position={[-0.7 + (i % 3) * 0.7, 0.15 + Math.floor(i / 3) * 0.55, 0.2]}
          size={[0.58, 0.42, 0.12]}
          color={P.amber}
          fill={0.55}
        />
      ))}
      <Slab position={[2.35, 0.85, 0]} size={[0.7, 0.5, 0.12]} color={P.amber} fill={0.4} />
      <Slab position={[2.55, 1.4, 0]} size={[0.7, 0.5, 0.12]} color={P.amber} fill={0.32} />
      <Tag position={[2.5, 1.95, 0]} tone="amber" center>
        96 GB BF16
      </Tag>
      <Wire points={[[1.0, 0.6, 0], [2.1, 0.85, 0]]} color={P.line} opacity={0.5} />
      <Node3D position={[2.35, 0.85, 0]} color={P.amber} radius={0.08} pulse={0.45} />
    </group>
  );
}

function GpuScene() {
  const gpus = [-2.1, -0.7, 0.7, 2.1];
  return (
    <group>
      <Wire points={[[-2.4, -0.85, 0], [2.4, -0.85, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.4, -0.85, 0], [2.4, -0.85, 0]]} color={P.teal} count={3} speed={0.28} />
      {gpus.map((x, i) => (
        <group key={i}>
          <Slab position={[x, 0.15, 0]} size={[1.15, 1.35, 0.16]} color={P.teal} fill={0.28} />
          <Slab position={[x, 0.35, 0]} size={[0.85, 0.7, 0.12]} color={P.amber} fill={0.5} />
          <Tag position={[x, 1.05, 0]} tone="teal" center>
            {`gpu ${i + 1}`}
          </Tag>
        </group>
      ))}
      <Tag position={[0, 1.65, 0]} tone="amber" center>
        TP shards the 96 GB
      </Tag>
      <Tag position={[0, -1.35, 0]} tone="teal" center>
        experts travel with the shard
      </Tag>
    </group>
  );
}

function ContextScene() {
  const full = [0.22, 0.38, 0.55, 0.72, 0.9, 1.1, 1.32, 1.55];
  const hybrid = [0.22, 0.38];
  return (
    <group>
      <Tag position={[-1.7, 1.7, 0]} tone="violet" center>
        full MLA KV
      </Tag>
      {full.map((h, i) => (
        <Slab
          key={`f-${i}`}
          position={[-1.7, -0.85 + h / 2, 0]}
          size={[1.15, h, 0.12]}
          color={P.violet}
          fill={0.12 + i * 0.06}
        />
      ))}
      <Tag position={[1.45, 1.7, 0]} tone="teal" center>
        75% less KV
      </Tag>
      {hybrid.map((h, i) => (
        <Slab
          key={`h-${i}`}
          position={[0.7, -0.85 + h / 2, 0]}
          size={[0.85, h, 0.12]}
          color={P.violet}
          fill={0.45}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Slab
          key={`k-${i}`}
          position={[1.85, -0.55 + i * 0.42, 0]}
          size={[0.7, 0.28, 0.1]}
          color={P.teal}
          fill={0.55}
        />
      ))}
      <Tag position={[1.85, 0.85, 0]} tone="teal" center>
        KDA chips
      </Tag>
      <Tag position={[0.7, -1.35, 0]} tone="violet" center>
        MLA 1/4
      </Tag>
      <Wire points={[[-0.9, -0.85, 0], [0.1, -0.85, 0]]} color={P.line} opacity={0.4} />
    </group>
  );
}

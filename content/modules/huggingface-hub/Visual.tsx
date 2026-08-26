"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "repos" | "tokens" | "cli" | "cache";

const OPTIONS = [
  { value: "repos" as const, label: "repos", tone: "var(--teal)" },
  { value: "tokens" as const, label: "tokens", tone: "var(--amber)" },
  { value: "cli" as const, label: "hf cli", tone: "var(--violet)" },
  { value: "cache" as const, label: "cache", tone: "var(--teal)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("repos");

  return (
    <Figure
      label="Hugging Face Hub"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "Git + Xet repo" },
        { color: P.amber, label: "token / scope" },
        { color: P.violet, label: "CLI / cache" },
      ]}
      controls={
        <Switcher
          ariaLabel="huggingface hub diagram steps"
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
      {active === "repos" ? <ReposScene /> : null}
      {active === "tokens" ? <TokensScene /> : null}
      {active === "cli" ? <CliScene /> : null}
      {active === "cache" ? <CacheScene /> : null}
    </group>
  );
}

function ReposScene() {
  return (
    <group>
      <Wire points={[[-2.6, -0.15, 0], [2.6, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, -0.15, 0], [2.6, -0.15, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-2.1, 0.55, 0]} size={[1.7, 1.05, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[-2.1, 1.32, 0]} tone="teal" center>
        Models
      </Tag>
      <Tag position={[-2.1, -0.9, 0]} tone="teal" center>
        2M+
      </Tag>
      <Slab position={[0, 0.55, 0]} size={[1.7, 1.05, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[0, 1.32, 0]} tone="amber" center>
        Datasets
      </Tag>
      <Tag position={[0, -0.9, 0]} tone="amber" center>
        1.5M
      </Tag>
      <Slab position={[2.1, 0.55, 0]} size={[1.7, 1.05, 0.14]} color={P.violet} fill={0.48} />
      <Tag position={[2.1, 1.32, 0]} tone="violet" center>
        Spaces
      </Tag>
      <Tag position={[2.1, -0.9, 0]} tone="violet" center>
        1.5M
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.teal} radius={0.14} pulse={0.35} />
    </group>
  );
}

function TokensScene() {
  const bars = [
    { x: -2.1, h: 0.9, label: "fine-grained", color: P.teal, tone: "teal" as const, fill: 0.55 },
    { x: 0.0, h: 1.35, label: "read", color: P.amber, tone: "amber" as const, fill: 0.5 },
    { x: 2.1, h: 1.85, label: "write", color: P.violet, tone: "violet" as const, fill: 0.42 },
  ];
  return (
    <group>
      <Wire points={[[-2.8, -0.95, 0], [2.8, -0.95, 0]]} color={P.line} opacity={0.45} />
      {bars.map((b) => (
        <group key={b.label}>
          <Slab
            position={[b.x, -0.95 + b.h / 2, 0]}
            size={[1.5, b.h, 0.14]}
            color={b.color}
            fill={b.fill}
          />
          <Tag position={[b.x, -0.95 + b.h + 0.38, 0]} tone={b.tone} center>
            {b.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}

function CliScene() {
  return (
    <group>
      <Wire points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.violet} count={3} speed={0.28} />
      <Slab position={[-1.85, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[-1.85, 1.55, 0]} tone="teal" center>
        hf auth
      </Tag>
      <Tag position={[-1.85, -0.85, 0]} tone="teal" center>
        whoami
      </Tag>
      <Node3D position={[0.05, 0.1, 0]} color={P.violet} radius={0.14} pulse={0.35} />
      <Slab position={[1.9, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.violet} fill={0.48} />
      <Tag position={[1.9, 1.55, 0]} tone="violet" center>
        download
      </Tag>
      <Tag position={[1.9, -0.85, 0]} tone="violet" center>
        --dry-run
      </Tag>
    </group>
  );
}

function CacheScene() {
  const items: { x: number; label: string; tone: "teal" | "amber" | "violet"; color: string }[] = [
    { x: -2.15, label: "HF_HOME", tone: "teal", color: P.teal },
    { x: 0.0, label: "hub cache", tone: "amber", color: P.amber },
    { x: 2.15, label: "prune", tone: "violet", color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[0, 1.35, 0]} size={[1.9, 0.55, 0.12]} color={P.lineStrong} fill={0.22} />
      <Tag position={[0, 1.85, 0]} tone="teal" center>
        ~/.cache/huggingface
      </Tag>
      {items.map((it) => (
        <group key={it.label}>
          <Slab position={[it.x, 0.35, 0]} size={[1.55, 0.85, 0.14]} color={it.color} fill={0.52} />
          <Tag position={[it.x, -0.85, 0]} tone={it.tone} center>
            {it.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}

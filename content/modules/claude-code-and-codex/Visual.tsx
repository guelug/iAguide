"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "two" | "view" | "tree" | "api";

const OPTIONS = [
  { value: "two" as const, label: "dos productos", tone: "var(--teal)" },
  { value: "view" as const, label: "agent view", tone: "var(--amber)" },
  { value: "tree" as const, label: "worktree", tone: "var(--violet)" },
  { value: "api" as const, label: "API / CLI", tone: "var(--teal)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("two");

  return (
    <Figure
      label="Claude Code y Codex"
      hint="recorre el diagrama"
      legend={[
        { color: P.teal, label: "Claude Code" },
        { color: P.amber, label: "Codex / API" },
        { color: P.violet, label: "aislamiento git" },
      ]}
      controls={
        <Switcher
          ariaLabel="claude-code-and-codex diagram steps"
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
      {active === "two" ? <TwoScene /> : null}
      {active === "view" ? <ViewScene /> : null}
      {active === "tree" ? <TreeScene /> : null}
      {active === "api" ? <ApiScene /> : null}
    </group>
  );
}

function TwoScene() {
  return (
    <group>
      <Wire points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.7, 1.35, 0]} tone="teal" center>
        Claude Code
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="teal" center>
        claude agents
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="amber" center>
        Codex
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="amber" center>
        CLI + API
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.violet} radius={0.14} pulse={0.35} />
    </group>
  );
}

function ViewScene() {
  const rows = [
    { x: -2.1, label: "Working", tone: "teal" as const, color: P.teal },
    { x: 0.0, label: "Needs input", tone: "amber" as const, color: P.amber },
    { x: 2.1, label: "Completed", tone: "violet" as const, color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.6, 0.1, 0], [2.6, 0.1, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.6, 0.1, 0], [2.6, 0.1, 0]]} color={P.amber} count={3} speed={0.28} />
      {rows.map((r) => (
        <group key={r.label}>
          <Slab position={[r.x, 0.85, 0]} size={[1.5, 0.7, 0.12]} color={r.color} fill={0.52} />
          <Tag position={[r.x, 1.45, 0]} tone={r.tone} center>
            {r.label}
          </Tag>
        </group>
      ))}
      <Tag position={[0, -0.9, 0]} tone="amber" center>
        supervisor vivo
      </Tag>
    </group>
  );
}

function TreeScene() {
  return (
    <group>
      <Slab position={[0, 1.05, 0]} size={[2.6, 0.75, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[0, 1.65, 0]} tone="teal" center>
        repo
      </Tag>
      <Slab position={[-1.8, -0.45, 0]} size={[1.7, 0.7, 0.12]} color={P.violet} fill={0.45} />
      <Tag position={[-1.8, -1.05, 0]} tone="violet" center>
        worktree A
      </Tag>
      <Slab position={[1.8, -0.45, 0]} size={[1.7, 0.7, 0.12]} color={P.violet} fill={0.45} />
      <Tag position={[1.8, -1.05, 0]} tone="violet" center>
        worktree B
      </Tag>
      <Wire points={[[-1.8, -0.1, 0], [0, 0.65, 0], [1.8, -0.1, 0]]} color={P.line} opacity={0.5} />
      <Node3D position={[0, 0.65, 0]} color={P.violet} radius={0.12} pulse={0.4} />
    </group>
  );
}

function ApiScene() {
  return (
    <group>
      <Wire points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.amber} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[-1.7, 1.35, 0]} tone="amber" center>
        Codex CLI
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="amber" center>
        edita el repo
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="teal" center>
        gpt-5.6
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="teal" center>
        solo texto
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.amber} radius={0.14} pulse={0.35} />
    </group>
  );
}

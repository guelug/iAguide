"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "path" | "qlora" | "mix" | "export";

const OPTIONS = [
  { value: "path" as const, label: "path", tone: "var(--teal)" },
  { value: "qlora" as const, label: "qlora", tone: "var(--amber)" },
  { value: "mix" as const, label: "mix", tone: "var(--violet)" },
  { value: "export" as const, label: "export", tone: "var(--teal)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("path");

  return (
    <Figure
      label="Fine-tune Qwen3.8"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "path / artefact" },
        { color: P.amber, label: "VRAM / cost" },
        { color: P.violet, label: "reasoning mix" },
      ]}
      controls={
        <Switcher
          ariaLabel="qwen3.8 fine-tune diagram steps"
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
      {active === "path" ? <PathScene /> : null}
      {active === "qlora" ? <QloraScene /> : null}
      {active === "mix" ? <MixScene /> : null}
      {active === "export" ? <ExportScene /> : null}
    </group>
  );
}

function PathScene() {
  return (
    <group>
      <Wire points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.7, 1.35, 0]} tone="teal" center>
        Studio
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="teal" center>
        Train tab
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="amber" center>
        Kaggle
      </Tag>
      <Slab position={[1.2, -0.05, 0.18]} size={[0.72, 0.42, 0.1]} color={P.amber} fill={0.45} />
      <Slab position={[2.2, -0.05, 0.18]} size={[0.72, 0.42, 0.1]} color={P.amber} fill={0.45} />
      <Tag position={[1.7, -0.95, 0]} tone="amber" center>
        2x T4 free
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.teal} radius={0.14} pulse={0.35} />
    </group>
  );
}

function QloraScene() {
  const bars = [
    { x: -2.1, h: 0.85, label: "QLoRA 24G", color: P.teal, tone: "teal" as const, fill: 0.55 },
    { x: 0.0, h: 1.35, label: "LoRA >36G", color: P.amber, tone: "amber" as const, fill: 0.5 },
    { x: 2.1, h: 1.95, label: "Full FT 4x", color: P.violet, tone: "violet" as const, fill: 0.42 },
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

function MixScene() {
  return (
    <group>
      <Wire points={[[-2.6, -0.55, 0], [2.6, -0.55, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.6, -0.55, 0], [2.6, -0.55, 0]]} color={P.violet} count={3} speed={0.28} />
      {[0, 1, 2].map((i) => (
        <Slab
          key={`r-${i}`}
          position={[-1.55 + i * 1.05, 0.45, 0]}
          size={[0.9, 1.35, 0.12]}
          color={P.violet}
          fill={0.5}
        />
      ))}
      <Slab position={[1.85, 0.1, 0]} size={[0.9, 0.65, 0.12]} color={P.amber} fill={0.5} />
      <Tag position={[-0.5, 1.4, 0]} tone="violet" center>
        75% reasoning
      </Tag>
      <Tag position={[1.85, 0.7, 0]} tone="amber" center>
        25% direct
      </Tag>
      <Tag position={[0, -1.15, 0]} tone="violet" center>
        keep thinking
      </Tag>
      <Node3D position={[0, -0.55, 0]} color={P.violet} radius={0.12} pulse={0.3} />
    </group>
  );
}

function ExportScene() {
  const items: { x: number; label: string; tone: "teal" | "amber" | "violet"; color: string }[] = [
    { x: -2.15, label: "adapters", tone: "teal", color: P.teal },
    { x: 0.0, label: "GGUF q4", tone: "amber", color: P.amber },
    { x: 2.15, label: "vLLM 16b", tone: "violet", color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[0, 1.35, 0]} size={[1.6, 0.55, 0.12]} color={P.lineStrong} fill={0.22} />
      <Tag position={[0, 1.85, 0]} tone="teal" center>
        same template
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

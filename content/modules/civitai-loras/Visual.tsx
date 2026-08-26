"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "adapter" | "slot" | "strength" | "card" | "mismatch";

const OPTIONS = [
  { value: "adapter" as const, label: "adapter", tone: "var(--teal)" },
  { value: "slot" as const, label: "Load LoRA", tone: "var(--amber)" },
  { value: "strength" as const, label: "strengths", tone: "var(--violet)" },
  { value: "card" as const, label: "model card", tone: "var(--teal)" },
  { value: "mismatch" as const, label: "mismatch", tone: "var(--amber)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("adapter");

  return (
    <Figure
      label="LoRA on a frozen base"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "frozen base" },
        { color: P.amber, label: "LoRA adapter" },
        { color: P.violet, label: "CLIP / trigger" },
      ]}
      controls={
        <Switcher
          ariaLabel="civitai-loras diagram steps"
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
      {active === "adapter" ? <AdapterScene /> : null}
      {active === "slot" ? <SlotScene /> : null}
      {active === "strength" ? <StrengthScene /> : null}
      {active === "card" ? <CardScene /> : null}
      {active === "mismatch" ? <MismatchScene /> : null}
    </group>
  );
}

function AdapterScene() {
  return (
    <group>
      <Slab position={[0, 0.35, 0]} size={[3.2, 1.4, 0.14]} color={P.teal} fill={0.35} />
      <Tag position={[0, 1.3, 0]} tone="teal" center>
        frozen base
      </Tag>
      <Slab position={[0, 0.35, 0.2]} size={[1.6, 0.55, 0.12]} color={P.amber} fill={0.6} />
      <Tag position={[0, -0.95, 0]} tone="amber" center>
        small A B
      </Tag>
    </group>
  );
}

function SlotScene() {
  return (
    <group>
      <Wire points={[[-2.5, 0.15, 0], [2.5, 0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, 0.15, 0], [2.5, 0.15, 0]]} color={P.amber} count={3} speed={0.3} />
      <Slab position={[-2.0, 0.9, 0]} size={[1.5, 0.7, 0.12]} color={P.teal} fill={0.5} />
      <Tag position={[-2.0, 1.5, 0]} tone="teal" center>
        Checkpoint
      </Tag>
      <Slab position={[0, 0.9, 0]} size={[1.5, 0.7, 0.12]} color={P.amber} fill={0.55} />
      <Tag position={[0, 1.5, 0]} tone="amber" center>
        Load LoRA
      </Tag>
      <Slab position={[2.0, 0.9, 0]} size={[1.5, 0.7, 0.12]} color={P.violet} fill={0.5} />
      <Tag position={[2.0, 1.5, 0]} tone="violet" center>
        KSampler
      </Tag>
      <Tag position={[0, -0.9, 0]} tone="amber" center>
        in between
      </Tag>
    </group>
  );
}

function StrengthScene() {
  return (
    <group>
      <Slab position={[-1.6, 0.55, 0]} size={[2.1, 1.05, 0.14]} color={P.amber} fill={0.52} />
      <Tag position={[-1.6, 1.35, 0]} tone="amber" center>
        strength_model
      </Tag>
      <Slab position={[1.6, 0.55, 0]} size={[2.1, 1.05, 0.14]} color={P.violet} fill={0.52} />
      <Tag position={[1.6, 1.35, 0]} tone="violet" center>
        strength_clip
      </Tag>
      <Tag position={[0, -0.95, 0]} tone="teal" center>
        two knobs
      </Tag>
    </group>
  );
}

function CardScene() {
  return (
    <group>
      <Slab position={[0, 0.7, 0]} size={[2.8, 0.95, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[0, 1.45, 0]} tone="teal" center>
        CivitAI card
      </Tag>
      <Tag position={[-1.8, -0.85, 0]} tone="amber" center>
        trigger
      </Tag>
      <Tag position={[0, -0.85, 0]} tone="violet" center>
        base
      </Tag>
      <Tag position={[1.8, -0.85, 0]} tone="teal" center>
        license
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.teal} radius={0.12} pulse={0.35} />
    </group>
  );
}

function MismatchScene() {
  return (
    <group>
      <Slab position={[-1.7, 0.55, 0]} size={[2.1, 1.1, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[-1.7, 1.35, 0]} tone="amber" center>
        SD1.5 LoRA
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.1, 1.1, 0.14]} color={P.violet} fill={0.35} />
      <Tag position={[1.7, 1.35, 0]} tone="violet" center>
        SDXL ckpt
      </Tag>
      <Tag position={[0, -0.95, 0]} tone="amber" center>
        looks like noise
      </Tag>
    </group>
  );
}

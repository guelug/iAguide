"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Step = "ldm" | "ckpt" | "clip" | "vae" | "files";

const OPTIONS = [
  { value: "ldm" as const, label: "latent", tone: "var(--teal)" },
  { value: "ckpt" as const, label: "checkpoint", tone: "var(--amber)" },
  { value: "clip" as const, label: "CLIP", tone: "var(--violet)" },
  { value: "vae" as const, label: "VAE", tone: "var(--teal)" },
  { value: "files" as const, label: "folders", tone: "var(--amber)" },
];

export default function Visual() {
  const [step, setStep] = useState<Step>("ldm");

  return (
    <Figure
      label="Checkpoint, CLIP, VAE"
      hint="step the diagram"
      legend={[
        { color: P.teal, label: "latent / VAE" },
        { color: P.amber, label: "checkpoint" },
        { color: P.violet, label: "CLIP text" },
      ]}
      controls={
        <Switcher
          ariaLabel="image-models diagram steps"
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
      {active === "ldm" ? <LdmScene /> : null}
      {active === "ckpt" ? <CkptScene /> : null}
      {active === "clip" ? <ClipScene /> : null}
      {active === "vae" ? <VaeScene /> : null}
      {active === "files" ? <FilesScene /> : null}
    </group>
  );
}

function LdmScene() {
  return (
    <group>
      <Wire points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-2.0, 0.9, 0]} size={[1.6, 0.7, 0.12]} color={P.violet} fill={0.5} />
      <Tag position={[-2.0, 1.5, 0]} tone="violet" center>
        text
      </Tag>
      <Slab position={[0, 0.9, 0]} size={[1.6, 0.7, 0.12]} color={P.amber} fill={0.5} />
      <Tag position={[0, 1.5, 0]} tone="amber" center>
        denoise
      </Tag>
      <Slab position={[2.0, 0.9, 0]} size={[1.6, 0.7, 0.12]} color={P.teal} fill={0.5} />
      <Tag position={[2.0, 1.5, 0]} tone="teal" center>
        pixels
      </Tag>
      <Tag position={[0, -0.9, 0]} tone="teal" center>
        latent space
      </Tag>
    </group>
  );
}

function CkptScene() {
  return (
    <group>
      <Slab position={[0, 0.55, 0]} size={[2.8, 1.3, 0.16]} color={P.amber} fill={0.52} />
      <Tag position={[0, 1.45, 0]} tone="amber" center>
        .safetensors
      </Tag>
      <Tag position={[0, -1.0, 0]} tone="amber" center>
        artist brain
      </Tag>
      <Node3D position={[0, -0.35, 0]} color={P.amber} radius={0.14} pulse={0.35} />
    </group>
  );
}

function ClipScene() {
  return (
    <group>
      <Slab position={[-1.7, 0.55, 0]} size={[2.1, 1.0, 0.14]} color={P.violet} fill={0.5} />
      <Tag position={[-1.7, 1.3, 0]} tone="violet" center>
        prompt
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.1, 1.0, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[1.7, 1.3, 0]} tone="teal" center>
        embedding
      </Tag>
      <Wire points={[[-0.6, 0.55, 0], [0.6, 0.55, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-0.6, 0.55, 0], [0.6, 0.55, 0]]} color={P.violet} count={3} speed={0.3} />
      <Tag position={[0, -0.95, 0]} tone="violet" center>
        CLIP translator
      </Tag>
    </group>
  );
}

function VaeScene() {
  return (
    <group>
      <Slab position={[-1.7, 0.6, 0]} size={[2.0, 0.9, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.7, 1.3, 0]} tone="teal" center>
        latent
      </Tag>
      <Slab position={[1.7, 0.6, 0]} size={[2.0, 0.9, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.3, 0]} tone="amber" center>
        RGB
      </Tag>
      <Wire points={[[-0.65, 0.6, 0], [0.65, 0.6, 0]]} color={P.line} opacity={0.5} />
      <Node3D position={[0, 0.6, 0]} color={P.teal} radius={0.14} pulse={0.35} />
      <Tag position={[0, -0.95, 0]} tone="teal" center>
        decode
      </Tag>
    </group>
  );
}

function FilesScene() {
  const items = [
    { x: -2.2, label: "ckpt", tone: "amber" as const, color: P.amber },
    { x: -0.75, label: "vae", tone: "teal" as const, color: P.teal },
    { x: 0.75, label: "lora", tone: "violet" as const, color: P.violet },
    { x: 2.2, label: "cnet", tone: "teal" as const, color: P.teal },
  ];
  return (
    <group>
      <Wire points={[[-2.6, -0.2, 0], [2.6, -0.2, 0]]} color={P.line} opacity={0.45} />
      {items.map((it) => (
        <group key={it.label}>
          <Slab position={[it.x, 0.5, 0]} size={[1.2, 0.8, 0.12]} color={it.color} fill={0.5} />
          <Tag position={[it.x, 1.15, 0]} tone={it.tone} center>
            {it.label}
          </Tag>
        </group>
      ))}
      <Tag position={[0, -0.95, 0]} tone="amber" center>
        ComfyUI/models
      </Tag>
    </group>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "load" | "clip" | "sample" | "vae" | "queue";

export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "vae_save": "VAE save",
      "queue": "Queue",
      "text_encode": "text encode"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "vae_save": "VAE guarda",
      "queue": "Cola",
      "text_encode": "codifica texto"
    },
  });

  const OPTIONS = [
    { value: "load" as const, label: "checkpoint", tone: "var(--teal)" },
    { value: "clip" as const, label: "CLIP +/-", tone: "var(--amber)" },
    { value: "sample" as const, label: "KSampler", tone: "var(--violet)" },
    { value: "vae" as const, label: t.vae_save, tone: "var(--teal)" },
    { value: "queue" as const, label: t.queue, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("load");

  return (
    <Figure
      label="First ComfyUI graph"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: "weights / VAE" },
        { color: P.amber, label: t.text_encode },
        { color: P.violet, label: "sampler" },
      ]}
      controls={
        <Switcher
          ariaLabel="comfyui-first-workflow diagram steps"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.4], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} t={t} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active, t }: { active: Step; t: Record<string, string> }) {
  return (
    <group>
      {active === "load" ? <LoadScene /> : null}
      {active === "clip" ? <ClipScene /> : null}
      {active === "sample" ? <SampleScene /> : null}
      {active === "vae" ? <VaeScene /> : null}
      {active === "queue" ? <QueueScene /> : null}
    </group>
  );
}

function LoadScene() {
  return (
    <group>
      <Slab position={[0, 0.55, 0]} size={[2.6, 1.15, 0.16]} color={P.teal} fill={0.52} />
      <Tag position={[0, 1.4, 0]} tone="teal" center>
        Load Checkpoint
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="amber" center>
        MODEL
      </Tag>
      <Tag position={[0, -0.95, 0]} tone="violet" center>
        CLIP
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="teal" center>
        VAE
      </Tag>
    </group>
  );
}

function ClipScene() {
  return (
    <group>
      <Slab position={[-1.7, 0.6, 0]} size={[2.1, 0.95, 0.14]} color={P.amber} fill={0.52} />
      <Tag position={[-1.7, 1.35, 0]} tone="amber" center>
        positive
      </Tag>
      <Slab position={[1.7, 0.6, 0]} size={[2.1, 0.95, 0.14]} color={P.violet} fill={0.45} />
      <Tag position={[1.7, 1.35, 0]} tone="violet" center>
        negative
      </Tag>
      <Wire points={[[0, 1.7, 0], [0, -0.2, 0]]} color={P.line} opacity={0.4} />
      <Tag position={[0, -0.95, 0]} tone="teal" center>
        two CLIP Encode
      </Tag>
    </group>
  );
}

function SampleScene() {
  return (
    <group>
      <Slab position={[0, 0.7, 0]} size={[2.8, 1.0, 0.16]} color={P.violet} fill={0.52} />
      <Tag position={[0, 1.45, 0]} tone="violet" center>
        KSampler
      </Tag>
      <Tag position={[-2.1, -0.85, 0]} tone="teal" center>
        steps 20
      </Tag>
      <Tag position={[0, -0.85, 0]} tone="amber" center>
        cfg 7
      </Tag>
      <Tag position={[2.1, -0.85, 0]} tone="violet" center>
        euler
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.violet} radius={0.12} pulse={0.35} />
    </group>
  );
}

function VaeScene() {
  return (
    <group>
      <Wire points={[[-2.4, 0.15, 0], [2.4, 0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, 0.15, 0], [2.4, 0.15, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-1.6, 0.9, 0]} size={[1.9, 0.75, 0.12]} color={P.teal} fill={0.5} />
      <Tag position={[-1.6, 1.5, 0]} tone="teal" center>
        VAE Loader
      </Tag>
      <Slab position={[1.6, 0.9, 0]} size={[1.9, 0.75, 0.12]} color={P.amber} fill={0.5} />
      <Tag position={[1.6, 1.5, 0]} tone="amber" center>
        Save Image
      </Tag>
      <Tag position={[0, -0.9, 0]} tone="teal" center>
        decode then disk
      </Tag>
    </group>
  );
}

function QueueScene() {
  return (
    <group>
      <Slab position={[0, 0.55, 0]} size={[2.4, 1.1, 0.16]} color={P.amber} fill={0.52} />
      <Tag position={[0, 1.35, 0]} tone="amber" center>
        Queue Prompt
      </Tag>
      <Tag position={[0, -0.95, 0]} tone="teal" center>
        Ctrl+Enter
      </Tag>
      <Node3D position={[0, -0.25, 0]} color={P.amber} radius={0.14} pulse={0.4} />
    </group>
  );
}

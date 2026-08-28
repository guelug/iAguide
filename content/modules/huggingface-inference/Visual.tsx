"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "local" | "providers" | "endpoints" | "jobs";

export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "providers": "providers",
      "serverless_router": "serverless router",
      "dedicated_jobs": "dedicated / jobs"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "providers": "proveedores",
      "serverless_router": "router serverless",
      "dedicated_jobs": "dedicado / jobs"
    },
  });

  const OPTIONS = [
    { value: "local" as const, label: "pipeline", tone: "var(--teal)" },
    { value: "providers" as const, label: t.providers, tone: "var(--amber)" },
    { value: "endpoints" as const, label: "endpoints", tone: "var(--violet)" },
    { value: "jobs" as const, label: "jobs", tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("local");

  return (
    <Figure
      label="HF inference paths"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: "weights on this machine" },
        { color: P.amber, label: t.serverless_router },
        { color: P.violet, label: t.dedicated_jobs },
      ]}
      controls={
        <Switcher
          ariaLabel="huggingface inference diagram steps"
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
      {active === "local" ? <LocalScene /> : null}
      {active === "providers" ? <ProvidersScene /> : null}
      {active === "endpoints" ? <EndpointsScene /> : null}
      {active === "jobs" ? <JobsScene /> : null}
    </group>
  );
}

function LocalScene() {
  return (
    <group>
      <Wire points={[[-2.4, 0.15, 0], [2.4, 0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, 0.15, 0], [0.2, 0.15, 0]]} color={P.teal} count={3} speed={0.28} />
      <Slab position={[-1.85, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[-1.85, 1.55, 0]} tone="teal" center>
        safetensors
      </Tag>
      <Tag position={[-1.85, -0.85, 0]} tone="teal" center>
        Hub cache
      </Tag>
      <Node3D position={[0.15, 0.15, 0]} color={P.teal} radius={0.14} pulse={0.35} />
      <Slab position={[1.9, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.amber} fill={0.48} />
      <Tag position={[1.9, 1.55, 0]} tone="amber" center>
        pipeline
      </Tag>
      <Tag position={[1.9, -0.85, 0]} tone="amber" center>
        this GPU
      </Tag>
    </group>
  );
}

function ProvidersScene() {
  return (
    <group>
      <Wire points={[[-2.5, -0.2, 0], [2.5, -0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.2, 0], [2.5, -0.2, 0]]} color={P.amber} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.5, 0]} size={[2.2, 1.2, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.7, 1.32, 0]} tone="teal" center>
        HF_TOKEN
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="teal" center>
        Hermes / curl
      </Tag>
      <Slab position={[1.7, 0.5, 0]} size={[2.2, 1.2, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.32, 0]} tone="amber" center>
        router
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="amber" center>
        :fastest
      </Tag>
      <Node3D position={[0, -0.2, 0]} color={P.amber} radius={0.14} pulse={0.35} />
    </group>
  );
}

function EndpointsScene() {
  return (
    <group>
      <Wire points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.violet} count={3} speed={0.28} />
      <Slab position={[-1.85, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[-1.85, 1.55, 0]} tone="amber" center>
        Providers
      </Tag>
      <Tag position={[-1.85, -0.85, 0]} tone="amber" center>
        shared
      </Tag>
      <Node3D position={[0.05, 0.1, 0]} color={P.violet} radius={0.14} pulse={0.35} />
      <Slab position={[1.9, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.violet} fill={0.48} />
      <Tag position={[1.9, 1.55, 0]} tone="violet" center>
        Endpoints
      </Tag>
      <Tag position={[1.9, -0.85, 0]} tone="violet" center>
        dedicated
      </Tag>
    </group>
  );
}

function JobsScene() {
  const items: { x: number; label: string; tone: "teal" | "amber" | "violet"; color: string }[] = [
    { x: -2.15, label: "hf jobs", tone: "teal", color: P.teal },
    { x: 0.0, label: "TGI / vLLM", tone: "amber", color: P.amber },
    { x: 2.15, label: "your GPU", tone: "violet", color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[0, 1.35, 0]} size={[1.9, 0.55, 0.12]} color={P.lineStrong} fill={0.22} />
      <Tag position={[0, 1.85, 0]} tone="teal" center>
        self-host later
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

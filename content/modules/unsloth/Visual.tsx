"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "surfaces" | "methods" | "gguf" | "export";



export default function Visual() {
  const t = useCopy({
    en: {
      "train_with_unsloth": "Train with Unsloth",
      "step_the_diagram": "step the diagram",
      "export": "export",
      "studio_artefact": "Studio / artefact",
      "vram_method": "VRAM / method",
      "full_ft_4x": "Full FT 4x",
      "adapters": "adapters"
    },
    es: {
      "train_with_unsloth": "Entrena con Unsloth",
      "step_the_diagram": "recorre el diagrama",
      "export": "exporta",
      "studio_artefact": "Studio / artefacto",
      "vram_method": "VRAM / método",
      "full_ft_4x": "FT completo 4x",
      "adapters": "adaptadores"
    },
  });

  const OPTIONS = [
    { value: "surfaces" as const, label: "surfaces", tone: "var(--teal)" },
    { value: "methods" as const, label: "methods", tone: "var(--amber)" },
    { value: "gguf" as const, label: "gguf", tone: "var(--violet)" },
    { value: "export" as const, label: t.export, tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("surfaces");

  return (
    <Figure
      label={t.train_with_unsloth}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.studio_artefact },
        { color: P.amber, label: t.vram_method },
        { color: P.violet, label: "inference-only GGUF" },
      ]}
      controls={
        <Switcher
          ariaLabel="unsloth train diagram steps"
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

function Scene({ active, t }: { active: Step; t: any }) {
  return (
    <group>
      {active === "surfaces" ? <SurfacesScene /> : null}
      {active === "methods" ? <MethodsScene t={t} /> : null}
      {active === "gguf" ? <GgufScene /> : null}
      {active === "export" ? <ExportScene t={t} /> : null}
    </group>
  );
}

function SurfacesScene() {
  return (
    <group>
      <Wire points={[[-2.5, -0.2, 0], [2.5, -0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.2, 0], [2.5, -0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.5, 0]} size={[2.2, 1.2, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.7, 1.32, 0]} tone="teal" center>
        Desktop
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="teal" center>
        Train tab
      </Tag>
      <Slab position={[1.7, 0.5, 0]} size={[2.2, 1.2, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.32, 0]} tone="amber" center>
        Core
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="amber" center>
        FastModel
      </Tag>
      <Node3D position={[0, -0.2, 0]} color={P.teal} radius={0.14} pulse={0.35} />
    </group>
  );
}

function MethodsScene({ t }: { t: any }) {
  const bars = [
    { x: -2.1, h: 0.85, label: "QLoRA", color: P.teal, tone: "teal" as const, fill: 0.55 },
    { x: 0.0, h: 1.35, label: "LoRA 16b", color: P.amber, tone: "amber" as const, fill: 0.5 },
    { x: 2.1, h: 1.95, label: t.full_ft_4x, color: P.violet, tone: "violet" as const, fill: 0.42 },
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

function GgufScene() {
  return (
    <group>
      <Wire points={[[-2.4, 0.15, 0], [2.4, 0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, 0.15, 0], [0.2, 0.15, 0]]} color={P.teal} count={3} speed={0.28} />
      <Slab position={[-1.85, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[-1.85, 1.55, 0]} tone="teal" center>
        safetensors
      </Tag>
      <Tag position={[-1.85, -0.85, 0]} tone="teal" center>
        train here
      </Tag>
      <Node3D position={[0.15, 0.15, 0]} color={P.teal} radius={0.14} pulse={0.35} />
      <Slab position={[1.9, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.violet} fill={0.48} />
      <Tag position={[1.9, 1.55, 0]} tone="violet" center>
        GGUF
      </Tag>
      <Tag position={[1.9, -0.85, 0]} tone="violet" center>
        inference only
      </Tag>
    </group>
  );
}

function ExportScene({ t }: { t: any }) {
  const items: { x: number; label: string; tone: "teal" | "amber" | "violet"; color: string }[] = [
    { x: -2.15, label: t.adapters, tone: "teal", color: P.teal },
    { x: 0.0, label: "q4_k_m", tone: "amber", color: P.amber },
    { x: 2.15, label: "merged 16b", tone: "violet", color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[0, 1.35, 0]} size={[1.7, 0.55, 0.12]} color={P.lineStrong} fill={0.22} />
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

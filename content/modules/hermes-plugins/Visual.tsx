"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "yaml" | "ctx" | "disc" | "cap" | "doc";

const COPY = {
  en: {
    label: "Hermes: plugin context API",
    hint: "step the diagram",
    sources3: "3 sources",
    capabilities: "capabilities",
    corePath: "core path",
    costVolatile: "cost / volatile",
    extension: "extension",
  },
  es: {
    label: "Hermes: API de contexto de plugins",
    hint: "recorre el diagrama",
    sources3: "3 fuentes",
    capabilities: "capacidades",
    corePath: "ruta núcleo",
    costVolatile: "coste / volátil",
    extension: "extensión",
  },
};
type Copy = typeof COPY.en;

export default function Visual() {
  const t = useCopy(COPY);
  const [step, setStep] = useState<Step>("yaml");

  const options = [
    { value: "yaml" as const, label: "plugin.yaml", tone: "var(--teal)" },
    { value: "ctx" as const, label: "register(ctx)", tone: "var(--teal)" },
    { value: "disc" as const, label: t.sources3, tone: "var(--amber)" },
    { value: "cap" as const, label: t.capabilities, tone: "var(--violet)" },
    { value: "doc" as const, label: "doctor", tone: "var(--amber)" },
  ];

  return (
    <Figure
      label={t.label}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.corePath },
        { color: P.amber, label: t.costVolatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel={t.hint}
          value={step}
          onChange={setStep}
          options={options}
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

function Scene({ active, t }: { active: Step; t: Copy }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "yaml" ? P.teal : P.lineStrong}
        fill={active === "yaml" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.45, 0.0]} tone="teal" center>
        plugin.yaml
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "ctx" ? P.amber : P.lineStrong}
        fill={active === "ctx" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.45, 0.0]} tone="amber" center>
        register(ctx)
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "disc" ? P.violet : P.lineStrong}
        fill={active === "disc" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.45, 0.0]} tone="violet" center>{t.sources3}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "cap" ? P.teal : P.lineStrong}
        fill={active === "cap" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.45, 0.0]} tone="teal" center>{t.capabilities}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "doc" ? P.amber : P.lineStrong}
        fill={active === "doc" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        doctor
      </Tag>
    </group>
  );
}

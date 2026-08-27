"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type View = "preset" | "routing" | "guardrails";

export default function Visual() {
  const t = useCopy({
    en: {
      title: "One preset, several gates",
      hint: "switch the layer",
      preset: "preset",
      routing: "routing",
      guardrails: "guardrails",
      request: "request",
      model: "model",
      providers: "providers",
      policy: "policy",
    },
    es: {
      title: "Un preset, varias puertas",
      hint: "cambia de capa",
      preset: "preset",
      routing: "routing",
      guardrails: "guardrails",
      request: "petición",
      model: "modelo",
      providers: "proveedores",
      policy: "política",
    },
  });
  const [view, setView] = useState<View>("preset");
  const options = [
    { value: "preset" as const, label: t.preset, tone: "var(--teal)" },
    { value: "routing" as const, label: t.routing, tone: "var(--amber)" },
    { value: "guardrails" as const, label: t.guardrails, tone: "var(--violet)" },
  ];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.request },
        { color: P.amber, label: t.providers },
        { color: P.violet, label: t.policy },
      ]}
      controls={<Switcher ariaLabel="OpenRouter diagram layer" value={view} onChange={setView} options={options} />}
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.2, 7.5], fov: 40 }}>
        <Turntable speed={0.025} tilt={0.08}>
          <group>
            <Wire points={[[-2.8, 0, 0], [2.8, 0, 0]]} color={P.line} opacity={0.5} />
            <Flow points={[[-2.8, 0, 0], [2.8, 0, 0]]} color={view === "guardrails" ? P.violet : view === "routing" ? P.amber : P.teal} count={4} speed={0.28} />
            <Node3D position={[0, 0, 0]} color={view === "guardrails" ? P.violet : view === "routing" ? P.amber : P.teal} radius={0.2} pulse={0.35} />
            <Slab position={[-2.2, 0.85, 0]} size={[1.45, 0.62, 0.12]} color={view === "preset" ? P.teal : P.lineStrong} fill={view === "preset" ? 0.55 : 0.14} />
            <Tag position={[-2.2, 1.4, 0]} tone="teal" center>{t.request}</Tag>
            <Slab position={[0, 0.85, 0]} size={[1.45, 0.62, 0.12]} color={view === "routing" ? P.amber : P.lineStrong} fill={view === "routing" ? 0.55 : 0.14} />
            <Tag position={[0, 1.4, 0]} tone="amber" center>{t.providers}</Tag>
            <Slab position={[2.2, 0.85, 0]} size={[1.45, 0.62, 0.12]} color={view === "guardrails" ? P.violet : P.lineStrong} fill={view === "guardrails" ? 0.55 : 0.14} />
            <Tag position={[2.2, 1.4, 0]} tone="violet" center>{t.policy}</Tag>
            <Slab position={[0, -1, 0]} size={[1.45, 0.62, 0.12]} color={P.lineStrong} fill={0.16} />
            <Tag position={[0, -0.45, 0]} tone="teal" center>{t.model}</Tag>
          </group>
        </Turntable>
      </Stage>
    </Figure>
  );
}

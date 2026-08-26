"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "schema" | "registry" | "dispatch" | "policy" | "backend";



export default function Visual() {
  const t = useCopy({
    en: {
      "tools_runtime": "Tools runtime",
      "step_the_diagram": "step the diagram",
      "schema": "schema",
      "registry": "registry",
      "dispatch": "dispatch",
      "policy": "policy",
      "backend": "backend",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "tools_runtime": "Runtime de herramientas",
      "step_the_diagram": "recorre el diagrama",
      "schema": "schema",
      "registry": "registro",
      "dispatch": "dispatch",
      "policy": "política",
      "backend": "backend",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "schema" as const, label: t.schema, tone: "var(--teal)" },
    { value: "registry" as const, label: t.registry, tone: "var(--teal)" },
    { value: "dispatch" as const, label: t.dispatch, tone: "var(--amber)" },
    { value: "policy" as const, label: t.policy, tone: "var(--violet)" },
    { value: "backend" as const, label: t.backend, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("schema");

  return (
    <Figure
      label={t.tools_runtime}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="tools-runtime diagram steps"
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
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "schema" ? P.teal : P.lineStrong}
        fill={active === "schema" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.schema}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "registry" ? P.amber : P.lineStrong}
        fill={active === "registry" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.registry}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "dispatch" ? P.violet : P.lineStrong}
        fill={active === "dispatch" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.dispatch}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "policy" ? P.teal : P.lineStrong}
        fill={active === "policy" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.policy}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "backend" ? P.amber : P.lineStrong}
        fill={active === "backend" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.backend}</Tag>
    </group>
  );
}

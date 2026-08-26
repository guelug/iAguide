"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "stable" | "context" | "volatile" | "ephemeral" | "cache";



export default function Visual() {
  const t = useCopy({
    en: {
      "prompt_assembly": "Prompt assembly",
      "step_the_diagram": "step the diagram",
      "stable": "stable",
      "context": "context",
      "ephemeral": "ephemeral",
      "cache_key": "cache key",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "prompt_assembly": "Montaje del prompt",
      "step_the_diagram": "recorre el diagrama",
      "stable": "estable",
      "context": "contexto",
      "ephemeral": "efímero",
      "cache_key": "clave de caché",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "stable" as const, label: t.stable, tone: "var(--teal)" },
    { value: "context" as const, label: t.context, tone: "var(--teal)" },
    { value: "volatile" as const, label: "volatile", tone: "var(--amber)" },
    { value: "ephemeral" as const, label: t.ephemeral, tone: "var(--violet)" },
    { value: "cache" as const, label: t.cache_key, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("stable");

  return (
    <Figure
      label={t.prompt_assembly}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="prompt-assembly diagram steps"
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
        color={active === "stable" ? P.teal : P.lineStrong}
        fill={active === "stable" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.stable}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "context" ? P.amber : P.lineStrong}
        fill={active === "context" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.context}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "volatile" ? P.violet : P.lineStrong}
        fill={active === "volatile" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        volatile
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "ephemeral" ? P.teal : P.lineStrong}
        fill={active === "ephemeral" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.ephemeral}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "cache" ? P.amber : P.lineStrong}
        fill={active === "cache" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.cache_key}</Tag>
    </group>
  );
}

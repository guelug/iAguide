"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "intake" | "assemble" | "model" | "tools" | "persist";



export default function Visual() {
  const t = useCopy({
    en: {
      "the_agent_loop": "The agent loop",
      "step_the_diagram": "step the diagram",
      "intake": "intake",
      "assemble": "assemble",
      "model": "model",
      "persist": "persist",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "the_agent_loop": "El bucle del agente",
      "step_the_diagram": "recorre el diagrama",
      "intake": "entrada",
      "assemble": "ensambla",
      "model": "modelo",
      "persist": "persiste",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "intake" as const, label: t.intake, tone: "var(--teal)" },
    { value: "assemble" as const, label: t.assemble, tone: "var(--teal)" },
    { value: "model" as const, label: t.model, tone: "var(--amber)" },
    { value: "tools" as const, label: "tools", tone: "var(--violet)" },
    { value: "persist" as const, label: t.persist, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("intake");

  return (
    <Figure
      label={t.the_agent_loop}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="agent-loop diagram steps"
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
        color={active === "intake" ? P.teal : P.lineStrong}
        fill={active === "intake" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.intake}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "assemble" ? P.amber : P.lineStrong}
        fill={active === "assemble" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.assemble}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "model" ? P.violet : P.lineStrong}
        fill={active === "model" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.model}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "tools" ? P.teal : P.lineStrong}
        fill={active === "tools" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        tools
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "persist" ? P.amber : P.lineStrong}
        fill={active === "persist" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.persist}</Tag>
    </group>
  );
}

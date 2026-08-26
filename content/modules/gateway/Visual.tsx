"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "adapter" | "event" | "auth" | "agent" | "deliver";



export default function Visual() {
  const t = useCopy({
    en: {
      "the_gateway_process": "The gateway process",
      "step_the_diagram": "step the diagram",
      "adapter": "adapter",
      "event": "event",
      "agent_run": "agent run",
      "deliver": "deliver",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "the_gateway_process": "El proceso gateway",
      "step_the_diagram": "recorre el diagrama",
      "adapter": "adaptador",
      "event": "evento",
      "agent_run": "run del agente",
      "deliver": "entrega",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "adapter" as const, label: t.adapter, tone: "var(--teal)" },
    { value: "event" as const, label: t.event, tone: "var(--teal)" },
    { value: "auth" as const, label: "auth / pair", tone: "var(--amber)" },
    { value: "agent" as const, label: t.agent_run, tone: "var(--violet)" },
    { value: "deliver" as const, label: t.deliver, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("adapter");

  return (
    <Figure
      label={t.the_gateway_process}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="gateway diagram steps"
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
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "adapter" ? P.teal : P.lineStrong}
        fill={active === "adapter" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.adapter}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "event" ? P.amber : P.lineStrong}
        fill={active === "event" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.event}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "auth" ? P.violet : P.lineStrong}
        fill={active === "auth" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        auth / pair
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "agent" ? P.teal : P.lineStrong}
        fill={active === "agent" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.agent_run}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "deliver" ? P.amber : P.lineStrong}
        fill={active === "deliver" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.deliver}</Tag>
    </group>
  );
}

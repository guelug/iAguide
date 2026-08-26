"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "store" | "tick" | "fresh" | "skills" | "deliver";



export default function Visual() {
  const t = useCopy({
    en: {
      "scheduled_agent_jobs": "Scheduled agent jobs",
      "step_the_diagram": "step the diagram",
      "job_store": "job store",
      "fresh_agent": "fresh agent",
      "inject_skills": "inject skills",
      "deliver": "deliver",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "scheduled_agent_jobs": "Jobs de agente programados",
      "step_the_diagram": "recorre el diagrama",
      "job_store": "almacén de jobs",
      "fresh_agent": "agente fresco",
      "inject_skills": "inyecta skills",
      "deliver": "entrega",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "store" as const, label: t.job_store, tone: "var(--teal)" },
    { value: "tick" as const, label: "tick", tone: "var(--teal)" },
    { value: "fresh" as const, label: t.fresh_agent, tone: "var(--amber)" },
    { value: "skills" as const, label: t.inject_skills, tone: "var(--violet)" },
    { value: "deliver" as const, label: t.deliver, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("store");

  return (
    <Figure
      label={t.scheduled_agent_jobs}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="scheduled-jobs diagram steps"
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
        color={active === "store" ? P.teal : P.lineStrong}
        fill={active === "store" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.job_store}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "tick" ? P.amber : P.lineStrong}
        fill={active === "tick" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        tick
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "fresh" ? P.violet : P.lineStrong}
        fill={active === "fresh" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.fresh_agent}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "skills" ? P.teal : P.lineStrong}
        fill={active === "skills" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.inject_skills}</Tag>

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

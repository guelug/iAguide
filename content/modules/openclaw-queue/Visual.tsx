"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "a" | "b" | "c" | "d" | "e";



export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "steer": "steer",
      "followup": "followup",
      "collect": "collect",
      "interrupt": "interrupt",
      "lanes": "lanes",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "steer": "dirige",
      "followup": "seguimiento",
      "collect": "recoge",
      "interrupt": "interrumpe",
      "lanes": "carriles",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: t.steer, tone: "var(--teal)" },
    { value: "b" as const, label: t.followup, tone: "var(--teal)" },
    { value: "c" as const, label: t.collect, tone: "var(--amber)" },
    { value: "d" as const, label: t.interrupt, tone: "var(--violet)" },
    { value: "e" as const, label: t.lanes, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: session lanes and queue modes"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-queue diagram steps"
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
        color={active === "a" ? P.teal : P.lineStrong}
        fill={active === "a" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.steer}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.followup}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.collect}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.interrupt}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.lanes}</Tag>
    </group>
  );
}

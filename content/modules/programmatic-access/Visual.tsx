"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "acp" | "http" | "ws" | "embed" | "pick";



export default function Visual() {
  const t = useCopy({
    en: {
      "programmatic_access": "Programmatic access",
      "step_the_diagram": "step the diagram",
      "in_process": "in-process",
      "pick_one": "pick one",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "programmatic_access": "Acceso programático",
      "step_the_diagram": "recorre el diagrama",
      "in_process": "in-process",
      "pick_one": "elige uno",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "acp" as const, label: "ACP stdio", tone: "var(--teal)" },
    { value: "http" as const, label: "HTTP / SSE", tone: "var(--amber)" },
    { value: "ws" as const, label: "WS / TUI RPC", tone: "var(--violet)" },
    { value: "embed" as const, label: t.in_process, tone: "var(--teal)" },
    { value: "pick" as const, label: t.pick_one, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("acp");

  return (
    <Figure
      label={t.programmatic_access}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="programmatic-access diagram steps"
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
        color={active === "acp" ? P.teal : P.lineStrong}
        fill={active === "acp" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        ACP stdio
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "http" ? P.amber : P.lineStrong}
        fill={active === "http" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        HTTP / SSE
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "ws" ? P.violet : P.lineStrong}
        fill={active === "ws" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        WS / TUI RPC
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "embed" ? P.teal : P.lineStrong}
        fill={active === "embed" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.in_process}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "pick" ? P.amber : P.lineStrong}
        fill={active === "pick" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.pick_one}</Tag>

      {active === "pick" && (
        <>
          <Node3D position={[-2.3, 0.5, 0.1]} color={P.teal} radius={0.05} pulse={0.4} />
          <Node3D position={[2.3, 0.5, 0.1]} color={P.teal} radius={0.05} pulse={0.4} />
          <Wire points={[[-2.3, 0.5, 0], [2.3, 0.5, 0]]} color={P.teal} opacity={0.6} />
        </>
      )}
    </group>
  );
}

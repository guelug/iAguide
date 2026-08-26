"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "key" | "row" | "transcript" | "compact" | "search";



export default function Visual() {
  const t = useCopy({
    en: {
      "sessions_and_durable_threads": "Sessions and durable threads",
      "step_the_diagram": "step the diagram",
      "session_key": "session key",
      "sqlite_row": "SQLite row",
      "compact": "compact",
      "search": "search",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "sessions_and_durable_threads": "Sesiones e hilos duraderos",
      "step_the_diagram": "recorre el diagrama",
      "session_key": "clave de sesión",
      "sqlite_row": "fila SQLite",
      "compact": "compacta",
      "search": "busca",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "key" as const, label: t.session_key, tone: "var(--teal)" },
    { value: "row" as const, label: t.sqlite_row, tone: "var(--teal)" },
    { value: "transcript" as const, label: "transcript", tone: "var(--amber)" },
    { value: "compact" as const, label: t.compact, tone: "var(--violet)" },
    { value: "search" as const, label: t.search, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("key");

  return (
    <Figure
      label={t.sessions_and_durable_threads}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="sessions diagram steps"
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
        color={active === "key" ? P.teal : P.lineStrong}
        fill={active === "key" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.session_key}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "row" ? P.amber : P.lineStrong}
        fill={active === "row" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.sqlite_row}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "transcript" ? P.violet : P.lineStrong}
        fill={active === "transcript" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        transcript
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "compact" ? P.teal : P.lineStrong}
        fill={active === "compact" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.compact}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "search" ? P.amber : P.lineStrong}
        fill={active === "search" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.search}</Tag>
    </group>
  );
}

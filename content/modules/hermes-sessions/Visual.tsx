"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "db" | "wal" | "retry" | "lineage" | "search";



export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "wal_fts5": "WAL + FTS5",
      "lineage": "lineage",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "wal_fts5": "WAL + FTS5",
      "lineage": "linaje",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "db" as const, label: "state.db", tone: "var(--teal)" },
    { value: "wal" as const, label: t.wal_fts5, tone: "var(--teal)" },
    { value: "retry" as const, label: "write retries", tone: "var(--amber)" },
    { value: "lineage" as const, label: t.lineage, tone: "var(--violet)" },
    { value: "search" as const, label: "session_search", tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("db");

  return (
    <Figure
      label="Hermes: state.db and FTS5"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="hermes-sessions diagram steps"
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
        color={active === "db" ? P.teal : P.lineStrong}
        fill={active === "db" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        state.db
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "wal" ? P.amber : P.lineStrong}
        fill={active === "wal" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.wal_fts5}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "retry" ? P.violet : P.lineStrong}
        fill={active === "retry" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        write retries
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "lineage" ? P.teal : P.lineStrong}
        fill={active === "lineage" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.lineage}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "search" ? P.amber : P.lineStrong}
        fill={active === "search" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        session_search
      </Tag>
    </group>
  );
}

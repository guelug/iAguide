"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "discover" | "manifest" | "register" | "skill" | "index";



export default function Visual() {
  const t = useCopy({
    en: {
      "plugins_and_skills": "Plugins and skills",
      "step_the_diagram": "step the diagram",
      "discover": "discover",
      "manifest": "manifest",
      "register": "register",
      "skills_index": "skills index",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "plugins_and_skills": "Plugins y skills",
      "step_the_diagram": "recorre el diagrama",
      "discover": "descubre",
      "manifest": "manifiesto",
      "register": "registra",
      "skills_index": "índice de skills",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "discover" as const, label: t.discover, tone: "var(--teal)" },
    { value: "manifest" as const, label: t.manifest, tone: "var(--teal)" },
    { value: "register" as const, label: t.register, tone: "var(--amber)" },
    { value: "skill" as const, label: "SKILL.md", tone: "var(--violet)" },
    { value: "index" as const, label: t.skills_index, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("discover");

  return (
    <Figure
      label={t.plugins_and_skills}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="plugins-and-skills diagram steps"
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
        color={active === "discover" ? P.teal : P.lineStrong}
        fill={active === "discover" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.discover}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "manifest" ? P.amber : P.lineStrong}
        fill={active === "manifest" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.manifest}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "register" ? P.violet : P.lineStrong}
        fill={active === "register" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.register}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "skill" ? P.teal : P.lineStrong}
        fill={active === "skill" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        SKILL.md
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "index" ? P.amber : P.lineStrong}
        fill={active === "index" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.skills_index}</Tag>
    </group>
  );
}

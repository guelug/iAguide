"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "g85" | "a50" | "phase" | "inplace" | "s3";

const COPY = {
  en: {
    label: "Hermes: dual compression",
    hint: "step the diagram",
    gateway85: "gateway 85%",
    inLoop50: "in-loop 50%",
    fourPhases: "4 phases",
    inPlace: "in-place",
    systemAnd3: "system + 3",
    corePath: "core path",
    costVolatile: "cost / volatile",
    extension: "extension",
  },
  es: {
    label: "Hermes: compresión dual",
    hint: "recorre el diagrama",
    gateway85: "gateway 85%",
    inLoop50: "en el bucle 50%",
    fourPhases: "4 fases",
    inPlace: "in-place",
    systemAnd3: "sistema + 3",
    corePath: "ruta núcleo",
    costVolatile: "coste / volátil",
    extension: "extensión",
  },
};
type Copy = typeof COPY.en;

export default function Visual() {
  const t = useCopy(COPY);
  const [step, setStep] = useState<Step>("g85");

  const options = [
    { value: "g85" as const, label: t.gateway85, tone: "var(--amber)" },
    { value: "a50" as const, label: t.inLoop50, tone: "var(--teal)" },
    { value: "phase" as const, label: t.fourPhases, tone: "var(--violet)" },
    { value: "inplace" as const, label: t.inPlace, tone: "var(--teal)" },
    { value: "s3" as const, label: t.systemAnd3, tone: "var(--amber)" },
  ];

  return (
    <Figure
      label={t.label}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.corePath },
        { color: P.amber, label: t.costVolatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel={t.hint}
          value={step}
          onChange={setStep}
          options={options}
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

function Scene({ active, t }: { active: Step; t: Copy }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "g85" ? P.teal : P.lineStrong}
        fill={active === "g85" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.45, 0.0]} tone="teal" center>
        {t.gateway85}
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "a50" ? P.amber : P.lineStrong}
        fill={active === "a50" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.45, 0.0]} tone="amber" center>{t.inLoop50}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "phase" ? P.violet : P.lineStrong}
        fill={active === "phase" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.45, 0.0]} tone="violet" center>{t.fourPhases}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "inplace" ? P.teal : P.lineStrong}
        fill={active === "inplace" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.45, 0.0]} tone="teal" center>
        {t.inPlace}
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "s3" ? P.amber : P.lineStrong}
        fill={active === "s3" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        {t.systemAnd3}
      </Tag>
    </group>
  );
}

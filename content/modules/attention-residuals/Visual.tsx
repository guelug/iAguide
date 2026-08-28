"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "residual" | "full" | "block";

export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "residual": "residual",
      "full": "full",
      "block": "block",
      "plus_residual": "plus / residual",
      "full_attnres": "full AttnRes",
      "block_summaries": "block summaries"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "residual": "residual",
      "full": "completo",
      "block": "bloque",
      "plus_residual": "suma / residual",
      "full_attnres": "AttnRes completo",
      "block_summaries": "resúmenes de bloque"
    },
  });

  const OPTIONS = [
    { value: "residual" as const, label: t.residual, tone: "var(--amber)" },
    { value: "full" as const, label: t.full, tone: "var(--teal)" },
    { value: "block" as const, label: t.block, tone: "var(--violet)" },
  ];
  const [step, setStep] = useState<Step>("residual");

  return (
    <Figure
      label="Depth mixer"
      hint={t.step_the_diagram}
      legend={[
        { color: P.amber, label: t.plus_residual },
        { color: P.teal, label: t.full_attnres },
        { color: P.violet, label: t.block_summaries },
      ]}
      controls={
        <Switcher
          ariaLabel="attention residual diagrams"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.5], fov: 40 }}>
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
      {active === "residual" ? <ResidualScene /> : null}
      {active === "full" ? <FullScene /> : null}
      {active === "block" ? <BlockScene /> : null}
    </group>
  );
}

function ResidualScene() {
  const ys = [1.15, 0.35, -0.45, -1.25];
  return (
    <group>
      {ys.map((y, i) => (
        <group key={i}>
          <Slab
            position={[0, y, 0]}
            size={[1.7, 0.52, 0.12]}
            color={i === ys.length - 1 ? P.amber : P.lineStrong}
            fill={i === ys.length - 1 ? 0.55 : 0.16}
          />
          <Tag position={[1.55, y, 0]} tone="amber" center>
            {i === 0 ? "h0" : `+ f`}
          </Tag>
        </group>
      ))}
      <Wire points={[[0, 1.15, 0], [0, -1.25, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[0, 1.15, 0], [0, -1.25, 0]]} color={P.amber} count={3} speed={0.28} />
      <Tag position={[0, 1.75, 0]} tone="amber" center>
        h = h + f(h)
      </Tag>
    </group>
  );
}

function FullScene() {
  const src = [-2.1, -0.7, 0.7, 2.1];
  return (
    <group>
      {src.map((x, i) => (
        <group key={i}>
          <Slab position={[x, 0.95, 0]} size={[0.95, 0.5, 0.12]} color={P.teal} fill={0.22 + i * 0.08} />
          <Tag position={[x, 1.5, 0]} tone="teal" center>
            {`v${i}`}
          </Tag>
          <Wire points={[[x, 0.7, 0], [0, -0.55, 0]]} color={P.line} opacity={0.45} />
          <Flow points={[[x, 0.7, 0], [0, -0.55, 0]]} color={P.teal} count={2} speed={0.26} />
        </group>
      ))}
      <Node3D position={[0, -0.7, 0]} color={P.teal} radius={0.18} pulse={0.4} />
      <Slab position={[0, -1.25, 0]} size={[1.5, 0.48, 0.12]} color={P.teal} fill={0.55} />
      <Tag position={[0, -1.75, 0]} tone="teal" center>
        softmax over layers
      </Tag>
    </group>
  );
}

function BlockScene() {
  const groups = [-1.85, 0, 1.85];
  return (
    <group>
      {groups.map((gx, g) => (
        <group key={g}>
          {[0.85, 0.25, -0.35].map((y, i) => (
            <Slab
              key={i}
              position={[gx, y, 0]}
              size={[1.2, 0.42, 0.1]}
              color={P.lineStrong}
              fill={0.14}
            />
          ))}
          <Slab position={[gx, -1.05, 0]} size={[1.35, 0.38, 0.12]} color={P.violet} fill={0.5} />
          <Tag position={[gx, -1.55, 0]} tone="violet" center>
            {`block ${g + 1}`}
          </Tag>
        </group>
      ))}
      <Wire points={[[-1.85, -1.05, 0], [1.85, -1.05, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-1.85, -1.05, 0], [1.85, -1.05, 0]]} color={P.violet} count={3} speed={0.3} />
      <Node3D position={[0, -1.05, 0]} color={P.violet} radius={0.12} pulse={0.35} />
      <Tag position={[0, 1.55, 0]} tone="violet" center>
        attend over ~8 summaries
      </Tag>
    </group>
  );
}

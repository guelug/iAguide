"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "softmax" | "kda" | "hybrid";



export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "hybrid": "hybrid",
      "kda_fixed_s": "KDA / fixed S",
      "softmax_kv": "softmax KV",
      "hybrid_mix": "hybrid mix"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "hybrid": "híbrido",
      "kda_fixed_s": "KDA / S fijo",
      "softmax_kv": "KV de softmax",
      "hybrid_mix": "mezcla híbrida"
    },
  });

  const OPTIONS = [
    { value: "softmax" as const, label: "softmax", tone: "var(--amber)" },
    { value: "kda" as const, label: "kda", tone: "var(--teal)" },
    { value: "hybrid" as const, label: t.hybrid, tone: "var(--violet)" },
  ];
  const [step, setStep] = useState<Step>("softmax");

  return (
    <Figure
      label="Cache vs state"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.kda_fixed_s },
        { color: P.amber, label: t.softmax_kv },
        { color: P.violet, label: t.hybrid_mix },
      ]}
      controls={
        <Switcher
          ariaLabel="kimi delta attention diagrams"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.4, 7.6], fov: 40 }}>
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
      {active === "softmax" ? <SoftmaxScene /> : null}
      {active === "kda" ? <KdaScene /> : null}
      {active === "hybrid" ? <HybridScene /> : null}
    </group>
  );
}

function SoftmaxScene() {
  const heights = [0.28, 0.42, 0.56, 0.72, 0.9, 1.1, 1.32, 1.55];
  return (
    <group>
      <Wire points={[[-2.8, -0.7, 0], [2.8, -0.7, 0]]} color={P.line} opacity={0.45} />
      <Tag position={[0, -1.25, 0]} tone="amber" center>
        KV grows with T
      </Tag>
      {heights.map((h, i) => {
        const x = -2.2 + i * 0.62;
        return (
          <Slab
            key={i}
            position={[x, -0.7 + h / 2, 0]}
            size={[0.48, h, 0.14]}
            color={P.amber}
            fill={0.18 + i * 0.08}
          />
        );
      })}
      <Node3D position={[2.55, 1.15, 0]} color={P.amber} radius={0.14} pulse={0.4} />
      <Tag position={[2.55, 1.55, 0]} tone="amber" center>
        decode O(T)
      </Tag>
      <Flow points={[[-2.4, 1.15, 0], [2.4, 1.15, 0]]} color={P.amber} count={4} speed={0.32} />
    </group>
  );
}

function KdaScene() {
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      cells.push({ x: -0.54 + c * 0.36, y: -0.15 + r * 0.36 });
    }
  }
  return (
    <group>
      <Wire
        points={[
          [-2.2, 0.35, 0],
          [-1.1, 0.35, 0],
          [-1.1, -0.85, 0],
          [1.1, -0.85, 0],
          [1.1, 0.35, 0],
          [2.2, 0.35, 0],
        ]}
        color={P.line}
        opacity={0.5}
      />
      <Flow
        points={[
          [-2.2, 0.35, 0],
          [-1.1, 0.35, 0],
          [-1.1, -0.85, 0],
          [1.1, -0.85, 0],
          [1.1, 0.35, 0],
          [2.2, 0.35, 0],
        ]}
        color={P.teal}
        count={3}
        speed={0.28}
      />
      {cells.map((p, i) => (
        <Slab
          key={i}
          position={[p.x, p.y, 0]}
          size={[0.28, 0.28, 0.1]}
          color={P.teal}
          fill={0.5}
        />
      ))}
      <Tag position={[0, 1.55, 0]} tone="teal" center>
        fixed S  128 x 128
      </Tag>
      <Tag position={[-2.2, 0.85, 0]} tone="teal" center>
        k, v in
      </Tag>
      <Tag position={[2.2, 0.85, 0]} tone="teal" center>
        o = S q
      </Tag>
      <Node3D position={[0, -1.2, 0]} color={P.teal} radius={0.12} pulse={0.3} />
    </group>
  );
}

function HybridScene() {
  const kdaX = [-2.25, -0.95, 0.35];
  return (
    <group>
      <Wire points={[[-2.6, -0.55, 0], [2.6, -0.55, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.6, -0.55, 0], [2.6, -0.55, 0]]} color={P.violet} count={3} speed={0.3} />
      {kdaX.map((x, i) => (
        <group key={i}>
          <Slab position={[x, 0.35, 0]} size={[1.05, 0.72, 0.12]} color={P.teal} fill={0.52} />
          <Tag position={[x, 0.95, 0]} tone="teal" center>
            KDA
          </Tag>
          <Slab position={[x, -1.05, 0]} size={[0.72, 0.28, 0.1]} color={P.teal} fill={0.45} />
        </group>
      ))}
      <Slab position={[1.85, 0.35, 0]} size={[1.05, 0.72, 0.12]} color={P.amber} fill={0.55} />
      <Tag position={[1.85, 0.95, 0]} tone="amber" center>
        MLA
      </Tag>
      {[0, 1, 2, 3].map((i) => (
        <Slab
          key={i}
          position={[1.85, -0.85 + i * 0.16, 0]}
          size={[0.72, 0.12, 0.08]}
          color={P.amber}
          fill={0.35 + i * 0.08}
        />
      ))}
      <Tag position={[0, 1.55, 0]} tone="violet" center>
        3 KDA : 1 MLA
      </Tag>
    </group>
  );
}

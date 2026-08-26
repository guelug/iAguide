"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "three" | "turn" | "hf" | "rotate" | "myth";



export default function Visual() {
  const t = useCopy({
    en: {
      "what_a_harness_spends": "What a harness spends",
      "step_the_diagram": "step the diagram",
      "one_turn": "one turn",
      "hf_credit": "HF credit",
      "plus_myth": "Plus myth",
      "local_credit": "local / credit",
      "api_token": "API token",
      "electricity": "electricity"
    },
    es: {
      "what_a_harness_spends": "qué gasta un harness",
      "step_the_diagram": "recorre el diagrama",
      "one_turn": "un turno",
      "hf_credit": "crédito de HF",
      "plus_myth": "mito del Plus",
      "local_credit": "local / crédito",
      "api_token": "token de API",
      "electricity": "electricidad"
    },
  });

  const OPTIONS = [
    { value: "three" as const, label: "three bills", tone: "var(--teal)" },
    { value: "turn" as const, label: t.one_turn, tone: "var(--amber)" },
    { value: "hf" as const, label: t.hf_credit, tone: "var(--violet)" },
    { value: "rotate" as const, label: "429 / 402", tone: "var(--amber)" },
    { value: "myth" as const, label: t.plus_myth, tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("three");

  return (
    <Figure
      label={t.what_a_harness_spends}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: "subscription quota" },
        { color: P.amber, label: "pay-per-token" },
        { color: P.violet, label: t.local_credit },
      ]}
      controls={
        <Switcher
          ariaLabel="quotas-and-pricing diagram steps"
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
      {active === "three" ? <ThreeScene t={t} /> : null}
      {active === "turn" ? <TurnScene t={t} /> : null}
      {active === "hf" ? <HfScene /> : null}
      {active === "rotate" ? <RotateScene /> : null}
      {active === "myth" ? <MythScene /> : null}
    </group>
  );
}

function ThreeScene({ t }: { t: Record<string, string> }) {
  const cols = [
    { x: -2.15, h: 1.1, label: "sub quota", color: P.teal, tone: "teal" as const },
    { x: 0.0, h: 1.55, label: t.api_token, color: P.amber, tone: "amber" as const },
    { x: 2.15, h: 0.85, label: t.electricity, color: P.violet, tone: "violet" as const },
  ];
  return (
    <group>
      <Wire points={[[-2.8, -0.95, 0], [2.8, -0.95, 0]]} color={P.line} opacity={0.45} />
      {cols.map((c) => (
        <group key={c.label}>
          <Slab position={[c.x, -0.95 + c.h / 2, 0]} size={[1.5, c.h, 0.14]} color={c.color} fill={0.5} />
          <Tag position={[c.x, -0.95 + c.h + 0.38, 0]} tone={c.tone} center>
            {c.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}

function TurnScene({ t }: { t: Record<string, string> }) {
  return (
    <group>
      <Wire points={[[-2.5, 0.2, 0], [2.5, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, 0.2, 0], [2.5, 0.2, 0]]} color={P.amber} count={4} speed={0.35} />
      <Slab position={[-2.2, 0.95, 0]} size={[1.3, 0.6, 0.12]} color={P.teal} fill={0.5} />
      <Tag position={[-2.2, 1.5, 0]} tone="teal" center>
        user
      </Tag>
      <Slab position={[0, 0.95, 0]} size={[1.3, 0.6, 0.12]} color={P.amber} fill={0.5} />
      <Tag position={[0, 1.5, 0]} tone="amber" center>
        N tools
      </Tag>
      <Slab position={[2.2, 0.95, 0]} size={[1.3, 0.6, 0.12]} color={P.violet} fill={0.5} />
      <Tag position={[2.2, 1.5, 0]} tone="violet" center>
        N calls
      </Tag>
      <Tag position={[0, -0.85, 0]} tone="amber" center>{t.one_turn}</Tag>
    </group>
  );
}

function HfScene() {
  return (
    <group>
      <Slab position={[0, 0.7, 0]} size={[2.6, 0.9, 0.14]} color={P.violet} fill={0.5} />
      <Tag position={[0, 1.4, 0]} tone="violet" center>
        0.10 USD / mo
      </Tag>
      <Tag position={[0, -0.85, 0]} tone="teal" center>
        HF routed credit
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.violet} radius={0.14} pulse={0.35} />
    </group>
  );
}

function RotateScene() {
  return (
    <group>
      <Slab position={[-1.6, 0.7, 0]} size={[2.0, 0.85, 0.14]} color={P.amber} fill={0.52} />
      <Tag position={[-1.6, 1.4, 0]} tone="amber" center>
        429 rate
      </Tag>
      <Slab position={[1.6, 0.7, 0]} size={[2.0, 0.85, 0.14]} color={P.violet} fill={0.52} />
      <Tag position={[1.6, 1.4, 0]} tone="violet" center>
        402 bill
      </Tag>
      <Wire points={[[-1.6, 0.15, 0], [1.6, 0.15, 0]]} color={P.line} opacity={0.5} />
      <Tag position={[0, -0.95, 0]} tone="teal" center>
        cache dies
      </Tag>
    </group>
  );
}

function MythScene() {
  return (
    <group>
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.1, 0.14]} color={P.teal} fill={0.45} />
      <Tag position={[-1.7, 1.35, 0]} tone="teal" center>
        Plus fee
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.1, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="amber" center>
        harness spend
      </Tag>
      <Wire points={[[-0.5, 0.55, 0], [0.5, 0.55, 0]]} color={P.line} opacity={0.4} />
      <Tag position={[0, -0.95, 0]} tone="amber" center>
        not the same bill
      </Tag>
    </group>
  );
}

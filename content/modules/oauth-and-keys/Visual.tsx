"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "two" | "oauth" | "key" | "sink" | "pool";



export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "pay_per_token_key": "pay-per-token key",
      "key_a": "key A",
      "key_b": "key B",
      "key_c": "key C"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "pay_per_token_key": "clave de pago por token",
      "key_a": "clave A",
      "key_b": "clave B",
      "key_c": "clave C"
    },
  });

  const OPTIONS = [
    { value: "two" as const, label: "two paths", tone: "var(--teal)" },
    { value: "oauth" as const, label: "OAuth / sub", tone: "var(--amber)" },
    { value: "key" as const, label: "API key", tone: "var(--violet)" },
    { value: "sink" as const, label: "token sink", tone: "var(--amber)" },
    { value: "pool" as const, label: "pool", tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("two");

  return (
    <Figure
      label="OAuth versus API key"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: "harness / store" },
        { color: P.amber, label: "subscription OAuth" },
        { color: P.violet, label: t.pay_per_token_key },
      ]}
      controls={
        <Switcher
          ariaLabel="oauth-and-keys diagram steps"
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
      {active === "two" ? <TwoScene /> : null}
      {active === "oauth" ? <OauthScene /> : null}
      {active === "key" ? <KeyScene /> : null}
      {active === "sink" ? <SinkScene /> : null}
      {active === "pool" ? <PoolScene t={t} /> : null}
    </group>
  );
}

function TwoScene() {
  return (
    <group>
      <Wire points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[-1.7, 1.35, 0]} tone="amber" center>
        OAuth / sub
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="amber" center>
        browser login
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.violet} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="violet" center>
        API key
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="violet" center>
        gateway host
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.teal} radius={0.14} pulse={0.35} />
    </group>
  );
}

function OauthScene() {
  return (
    <group>
      <Wire points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.amber} count={3} speed={0.28} />
      <Slab position={[-2.1, 0.85, 0]} size={[1.5, 0.7, 0.12]} color={P.amber} fill={0.52} />
      <Tag position={[-2.1, 1.45, 0]} tone="amber" center>
        PKCE
      </Tag>
      <Slab position={[0, 0.85, 0]} size={[1.5, 0.7, 0.12]} color={P.teal} fill={0.5} />
      <Tag position={[0, 1.45, 0]} tone="teal" center>
        auth store
      </Tag>
      <Slab position={[2.1, 0.85, 0]} size={[1.5, 0.7, 0.12]} color={P.amber} fill={0.52} />
      <Tag position={[2.1, 1.45, 0]} tone="amber" center>
        refresh
      </Tag>
      <Tag position={[0, -0.9, 0]} tone="amber" center>
        consumer plan
      </Tag>
    </group>
  );
}

function KeyScene() {
  return (
    <group>
      <Wire points={[[-2.3, 0.05, 0], [2.3, 0.05, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.3, 0.05, 0], [2.3, 0.05, 0]]} color={P.violet} count={3} speed={0.3} />
      <Slab position={[-1.6, 0.8, 0]} size={[2.0, 0.85, 0.14]} color={P.violet} fill={0.5} />
      <Tag position={[-1.6, 1.5, 0]} tone="violet" center>
        ~/.env
      </Tag>
      <Slab position={[1.6, 0.8, 0]} size={[2.0, 0.85, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[1.6, 1.5, 0]} tone="teal" center>
        gateway host
      </Tag>
      <Tag position={[0, -0.95, 0]} tone="violet" center>
        pay per token
      </Tag>
    </group>
  );
}

function SinkScene() {
  return (
    <group>
      <Slab position={[0, 0.9, 0]} size={[2.4, 0.8, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[0, 1.55, 0]} tone="teal" center>
        one SQLite
      </Tag>
      <Slab position={[-1.8, -0.55, 0]} size={[1.7, 0.7, 0.12]} color={P.amber} fill={0.45} />
      <Tag position={[-1.8, -1.15, 0]} tone="amber" center>
        Claude Code
      </Tag>
      <Slab position={[1.8, -0.55, 0]} size={[1.7, 0.7, 0.12]} color={P.violet} fill={0.45} />
      <Tag position={[1.8, -1.15, 0]} tone="violet" center>
        OpenClaw
      </Tag>
      <Wire points={[[-1.8, -0.15, 0], [0, 0.5, 0], [1.8, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Node3D position={[0, 0.5, 0]} color={P.amber} radius={0.12} pulse={0.4} />
    </group>
  );
}

function PoolScene({ t }: { t: Record<string, string> }) {
  const keys = [
    { x: -2.0, label: t.key_a, tone: "teal" as const, color: P.teal },
    { x: 0.0, label: t.key_b, tone: "amber" as const, color: P.amber },
    { x: 2.0, label: t.key_c, tone: "violet" as const, color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.4, 0.15, 0], [2.4, 0.15, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.4, 0.15, 0], [2.4, 0.15, 0]]} color={P.teal} count={3} speed={0.32} />
      {keys.map((k) => (
        <group key={k.label}>
          <Slab position={[k.x, 0.85, 0]} size={[1.45, 0.7, 0.12]} color={k.color} fill={0.5} />
          <Tag position={[k.x, 1.45, 0]} tone={k.tone} center>
            {k.label}
          </Tag>
        </group>
      ))}
      <Tag position={[0, -0.9, 0]} tone="amber" center>
        429 then rotate
      </Tag>
    </group>
  );
}

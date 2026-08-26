"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "fit" | "think" | "ctx" | "serve";



export default function Visual() {
  const t = useCopy({
    en: {
      "run_qwen3_8_locally": "Run Qwen3.8 locally",
      "step_the_diagram": "step the diagram",
      "oom_overflow": "OOM / overflow"
    },
    es: {
      "run_qwen3_8_locally": "Corre Qwen3.8 en local",
      "step_the_diagram": "recorre el diagrama",
      "oom_overflow": "OOM / overflow"
    },
  });

  const OPTIONS = [
    { value: "fit" as const, label: "fit", tone: "var(--teal)" },
    { value: "think" as const, label: "think", tone: "var(--violet)" },
    { value: "ctx" as const, label: "ctx", tone: "var(--amber)" },
    { value: "serve" as const, label: "serve", tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("fit");

  return (
    <Figure
      label={t.run_qwen3_8_locally}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: "fits / GGUF" },
        { color: P.amber, label: t.oom_overflow },
        { color: P.violet, label: "thinking / NVFP4" },
      ]}
      controls={
        <Switcher
          ariaLabel="qwen3.8 local run diagram steps"
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
      {active === "fit" ? <FitScene /> : null}
      {active === "think" ? <ThinkScene /> : null}
      {active === "ctx" ? <CtxScene /> : null}
      {active === "serve" ? <ServeScene /> : null}
    </group>
  );
}

function FitScene() {
  const bits = [
    { x: -2.55, h: 0.42, label: "1b", color: P.lineStrong, fill: 0.22 },
    { x: -1.53, h: 0.58, label: "2b", color: P.lineStrong, fill: 0.24 },
    { x: -0.51, h: 0.78, label: "3b", color: P.lineStrong, fill: 0.26 },
    { x: 0.51, h: 1.12, label: "4b", color: P.teal, fill: 0.55 },
    { x: 1.53, h: 1.45, label: "8b", color: P.amber, fill: 0.4 },
    { x: 2.55, h: 1.95, label: "bf16", color: P.violet, fill: 0.32 },
  ];
  return (
    <group>
      <Wire points={[[-2.9, -1.05, 0], [2.9, -1.05, 0]]} color={P.line} opacity={0.45} />
      {bits.map((b) => (
        <group key={b.label}>
          <Slab
            position={[b.x, -1.05 + b.h / 2, 0]}
            size={[0.85, b.h, 0.12]}
            color={b.color}
            fill={b.fill}
          />
          <Tag position={[b.x, -1.05 + b.h + 0.32, 0]} tone={b.label === "4b" ? "teal" : "amber"} center>
            {b.label}
          </Tag>
        </group>
      ))}
      <Tag position={[0.51, -1.45, 0]} tone="teal" center>
        16-19 GB
      </Tag>
    </group>
  );
}

function ThinkScene() {
  return (
    <group>
      <Wire points={[[0, 1.2, 0], [0, -1.1, 0]]} color={P.line} opacity={0.4} />
      <Slab position={[-1.55, 0.25, 0]} size={[2.4, 1.7, 0.14]} color={P.violet} fill={0.48} />
      <Tag position={[-1.55, 1.35, 0]} tone="violet" center>
        thinking
      </Tag>
      <Tag position={[-1.55, 0.55, 0]} tone="violet" center>
        t 1.0
      </Tag>
      <Tag position={[-1.55, 0.05, 0]} tone="violet" center>
        top_p 0.95
      </Tag>
      <Tag position={[-1.55, -0.45, 0]} tone="violet" center>
        xhigh
      </Tag>
      <Slab position={[1.55, 0.25, 0]} size={[2.4, 1.7, 0.14]} color={P.teal} fill={0.48} />
      <Tag position={[1.55, 1.35, 0]} tone="teal" center>
        instruct
      </Tag>
      <Tag position={[1.55, 0.55, 0]} tone="teal" center>
        t 0.7
      </Tag>
      <Tag position={[1.55, 0.05, 0]} tone="teal" center>
        top_p 0.80
      </Tag>
      <Tag position={[1.55, -0.45, 0]} tone="teal" center>
        pen 1.5
      </Tag>
      <Node3D position={[0, -1.15, 0]} color={P.amber} radius={0.12} pulse={0.3} />
      <Tag position={[0, -1.55, 0]} tone="amber" center>
        Preserve Thinking
      </Tag>
    </group>
  );
}

function CtxScene() {
  const full = [0.28, 0.48, 0.7, 0.95, 1.22, 1.52, 1.85];
  return (
    <group>
      <Tag position={[-1.65, 1.65, 0]} tone="amber" center>
        262k on 24G
      </Tag>
      {full.map((h, i) => (
        <Slab
          key={"f-" + i}
          position={[-1.65, -0.95 + h / 2, 0]}
          size={[1.4, h, 0.12]}
          color={i > 3 ? P.amber : P.lineStrong}
          fill={0.16 + i * 0.07}
        />
      ))}
      <Slab position={[-1.65, 1.25, 0.2]} size={[1.55, 0.35, 0.1]} color={P.amber} fill={0.55} />
      <Tag position={[-1.65, -1.4, 0]} tone="amber" center>
        OOM
      </Tag>
      <Slab position={[1.55, -0.15, 0]} size={[1.55, 0.95, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[1.55, 0.55, 0]} tone="teal" center>
        sized ctx
      </Tag>
      <Tag position={[1.55, -0.95, 0]} tone="teal" center>
        fits the job
      </Tag>
      <Wire points={[[-0.7, -0.15, 0], [0.6, -0.15, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-0.7, -0.15, 0], [0.6, -0.15, 0]]} color={P.teal} count={2} speed={0.28} />
    </group>
  );
}

function ServeScene() {
  return (
    <group>
      <Wire points={[[-2.5, -0.35, 0], [2.5, -0.35, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.35, 0], [2.5, -0.35, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-1.55, 0.45, 0]} size={[2.3, 1.25, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.55, 1.3, 0]} tone="teal" center>
        GGUF
      </Tag>
      <Tag position={[-1.55, 0.55, 0]} tone="teal" center>
        UD-Q4_K_XL
      </Tag>
      <Tag position={[-1.55, -1.0, 0]} tone="teal" center>
        llama.cpp
      </Tag>
      <Slab position={[1.55, 0.45, 0]} size={[2.3, 1.25, 0.14]} color={P.violet} fill={0.5} />
      <Tag position={[1.55, 1.3, 0]} tone="violet" center>
        NVFP4
      </Tag>
      <Tag position={[1.55, 0.55, 0]} tone="violet" center>
        1.5x vs BF16
      </Tag>
      <Tag position={[1.55, -1.0, 0]} tone="violet" center>
        vLLM Blackwell
      </Tag>
      <Node3D position={[0, -0.35, 0]} color={P.teal} radius={0.14} pulse={0.35} />
    </group>
  );
}

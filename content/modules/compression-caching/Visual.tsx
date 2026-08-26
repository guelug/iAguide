"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "fill" | "flush" | "middle" | "tail" | "breakpoints";



export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "flush_memory": "flush memory",
      "summarise": "summarise",
      "keep_tail": "keep tail",
      "cache_bps": "cache BPs",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "flush_memory": "purga memoria",
      "summarise": "resume",
      "keep_tail": "guarda la cola",
      "cache_bps": "caché de BPs",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "fill" as const, label: "window fills", tone: "var(--teal)" },
    { value: "flush" as const, label: t.flush_memory, tone: "var(--amber)" },
    { value: "middle" as const, label: t.summarise, tone: "var(--violet)" },
    { value: "tail" as const, label: t.keep_tail, tone: "var(--teal)" },
    { value: "breakpoints" as const, label: t.cache_bps, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("fill");

  return (
    <Figure
      label="Compression and prompt cache"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="compression-caching diagram steps"
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
        color={active === "fill" ? P.teal : P.lineStrong}
        fill={active === "fill" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        window fills
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "flush" ? P.amber : P.lineStrong}
        fill={active === "flush" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.flush_memory}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "middle" ? P.violet : P.lineStrong}
        fill={active === "middle" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.summarise}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "tail" ? P.teal : P.lineStrong}
        fill={active === "tail" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.keep_tail}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "breakpoints" ? P.amber : P.lineStrong}
        fill={active === "breakpoints" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.cache_bps}</Tag>
    </group>
  );
}

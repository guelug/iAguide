"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* LoRA anatomy, rank scaling, and the trigger word that activates it. */
type Mode = "anatomy" | "rank" | "trigger";

const COPY = {
  en: {
    a_delta_on_frozen_w: "a delta on frozen W",
    anatomy_rank_trigger: "anatomy, rank, trigger",
    anatomy: "anatomy",
    rank: "rank",
    trigger: "trigger",
    base: "base",
    lora_delta: "LoRA delta",
    a_times_b: "A × B",
    frozen: "frozen",
    r: "r",
    parameters: "parameters",
    trigger_word: "trigger word",
    activates: "activates",
    base_alone: "base alone",
  },
  es: {
    a_delta_on_frozen_w: "un delta sobre W congelada",
    anatomy_rank_trigger: "anatomía, rank, gatillo",
    anatomy: "anatomía",
    rank: "rank",
    trigger: "gatillo",
    base: "base",
    lora_delta: "delta LoRA",
    a_times_b: "A × B",
    frozen: "congelada",
    r: "r",
    parameters: "parámetros",
    trigger_word: "trigger word",
    activates: "activa",
    base_alone: "solo base",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("anatomy");

  const weights = Array.from({ length: 24 }, (_, i) => ({
    position: [-1.6 + (i % 6) * 0.64, 0.85 - Math.floor(i / 6) * 0.55, 0] as [number, number, number],
    color: P.teal,
  }));

  return (
    <Figure
      label={t.a_delta_on_frozen_w}
      hint={t.anatomy_rank_trigger}
      legend={[
        { color: P.teal, label: t.base },
        { color: P.violet, label: t.lora_delta },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "anatomy", label: t.anatomy, tone: P.teal },
            { value: "rank", label: t.rank, tone: P.violet },
            { value: "trigger", label: t.trigger, tone: P.amber },
          ]}
          ariaLabel={t.a_delta_on_frozen_w}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "anatomy" && (
          <>
            {/* big frozen base */}
            <Lattice cells={weights} size={0.34} opacity={0.9} />
            <Tag position={[0, 1.9, 0.15]} tone="teal">{t.base}</Tag>
            <Halo position={[0, 0.15, 0]} radius={2.3} color={P.teal} opacity={0.3} spin={0.08} />
            {/* thin LoRA delta riding on top */}
            <Slab position={[0, 1.5, 0.3]} size={[3.6, 0.28, 0.08]} color={P.violet} fill={0.42} />
            <Tag position={[0, 2.05, 0.35]} tone="violet" size="xs">{t.lora_delta}</Tag>
            {/* rank decomp A × B */}
            <Slab position={[-2.6, -1.2, 0]} size={[0.5, 1.4, 0.1]} color={P.violet} fill={0.32} />
            <Slab position={[-1.9, -1.7, 0]} size={[1.4, 0.5, 0.1]} color={P.violet} fill={0.32} />
            <Tag position={[-2.0, -2.15, 0.15]} tone="violet" size="xs">{t.a_times_b}</Tag>
            <Tag position={[2.4, 1.5, 0.35]} tone="muted" size="xs">{t.frozen}</Tag>
          </>
        )}

        {mode === "rank" && (
          <>
            {/* three ranks with parameter counts */}
            {(
              [
                [4, "r=4 · 1,6M", 0.4],
                [16, "r=16 · 6,5M", 1.1],
                [64, "r=64 · 26M", 2.6],
              ] as const
            ).map(([r, lab, w], i) => (
              <group key={r}>
                <Slab position={[-2.0 + i * 2.0, 0.5, 0]} size={[w, 0.7, 0.14]} color={P.violet} fill={0.3} />
                <Tag position={[-2.0 + i * 2.0, 1.05, 0.15]} tone="violet" size="xs">{lab}</Tag>
                <Tag position={[-2.0 + i * 2.0, 0.05, 0.15]} tone="muted" size="xs">{t.r} = {r}</Tag>
              </group>
            ))}
            <Wire points={[[-3.0, -0.7, 0], [3.0, -0.7, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[3.0, -1.05, 0.15]} tone="muted" size="xs">{t.parameters}</Tag>
          </>
        )}

        {mode === "trigger" && (
          <>
            {/* prompt flows through base, LoRA lights on the trigger */}
            <Slab position={[-2.4, 0.6, 0]} size={[1.9, 0.7, 0.12]} color={P.teal} fill={0.2} />
            <Tag position={[-2.4, 1.05, 0.15]} tone="teal" size="xs">prompt</Tag>
            <Flow points={[[-1.45, 0.6, 0], [-0.6, 0.6, 0]]} color={P.teal} count={3} />
            <Slab position={[0.3, 0.6, 0]} size={[1.8, 1.3, 0.16]} color={P.teal} fill={0.18} />
            <Tag position={[0.3, 1.5, 0.15]} tone="teal" size="xs">{t.base_alone}</Tag>
            {/* the trigger word */}
            <Slab position={[-0.5, -0.85, 0]} size={[1.3, 0.45, 0.1]} color={P.amber} fill={0.3} />
            <Tag position={[-0.5, -1.3, 0.15]} tone="amber" size="xs">«sks person»</Tag>
            <Flow points={[[-0.3, -0.6, 0], [0.3, 0.0, 0]]} color={P.amber} count={2} size={0.045} />
            {/* lora lights */}
            <Slab position={[0.3, 1.65, 0.2]} size={[1.6, 0.28, 0.08]} color={P.violet} fill={0.45} />
            <Halo position={[0.3, 1.6, 0]} radius={0.85} color={P.violet} opacity={0.4} spin={0.25} />
            <Tag position={[0.3, 2.05, 0.3]} tone="violet" size="xs">{t.activates}</Tag>
            <Flow points={[[1.2, 0.6, 0], [2.4, 0.6, 0]]} color={P.amber} count={3} />
            <Slab position={[2.6, 0.6, 0]} size={[0.9, 0.9, 0.14]} color={P.amber} fill={0.3} />
            <Tag position={[2.6, 1.25, 0.15]} tone="amber" size="xs">{t.trigger_word}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

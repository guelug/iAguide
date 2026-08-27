"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* image-models: denoising over steps, prompt weights, LoRA vs full FT. */
type Mode = "denoise" | "weights" | "delta";

const COPY = {
  en: {
    from_noise_to_image: "from noise to image",
    fifty_steps_prompt_words_and_a_delta: "fifty steps, prompt weights, a delta",
    denoise: "denoise",
    weights: "weights",
    delta: "delta",
    step: "step",
    noise: "noise",
    signal: "signal",
    prompt: "prompt",
    strong: "strong weight",
    weak: "weak weight",
    lora: "lora",
    full_ft: "full ft",
    size_gap: "size gap",
  },
  es: {
    from_noise_to_image: "de ruido a imagen",
    fifty_steps_prompt_words_and_a_delta: "cincuenta pasos, pesos del prompt, un delta",
    denoise: "denoise",
    weights: "pesos",
    delta: "delta",
    step: "paso",
    noise: "ruido",
    signal: "señal",
    prompt: "prompt",
    strong: "peso fuerte",
    weak: "peso débil",
    lora: "lora",
    full_ft: "ft completo",
    size_gap: "tamaño",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("denoise");

  // noise lattice that progressively resolves into a grid (image)
  const rows = 8;
  const cols = 8;
  const cellsFor = (stage: number) =>
    Array.from({ length: rows * cols }, (_, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const jitter = (1 - stage) * 0.5;
      return {
        position: [
          -1.6 + c * 0.45 + (Math.random() - 0.5) * jitter,
          1.5 - r * 0.45 + (Math.random() - 0.5) * jitter,
          0,
        ] as [number, number, number],
        color: stage === 0 ? P.muted : stage === 1 ? P.violet : P.teal,
      };
    });

  return (
    <Figure
      label={t.from_noise_to_image}
      hint={t.fifty_steps_prompt_words_and_a_delta}
      legend={[
        { color: P.muted, label: t.noise },
        { color: P.teal, label: t.signal },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "denoise", label: t.denoise, tone: P.teal },
            { value: "weights", label: t.weights, tone: P.violet },
            { value: "delta", label: t.delta, tone: P.amber },
          ]}
          ariaLabel={t.from_noise_to_image}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "denoise" && (
          <>
            {/* three panels: noise, mid, resolved */}
            {[0, 1, 2].map((s) => (
              <group key={s} position={[(s - 1) * 2.4, 0, 0]}>
                <Slab position={[0, 0.25, -0.1]} size={[1.9, 1.9, 0.06]} color={P.muted} fill={0.04} rim={0.3} />
                <Lattice
                  cells={cellsFor(s / 2).map((c) => ({
                    ...c,
                    position: [c.position[0] * 0.55, c.position[1] * 0.55 + 0.25, 0] as [number, number, number],
                  }))}
                  size={0.14}
                  opacity={0.9}
                  matte
                />
                <Tag position={[0, -1.0, 0.15]} tone="muted" size="xs">
                  {t.step} {s === 0 ? 1 : s === 1 ? 25 : 50}
                </Tag>
              </group>
            ))}
            <Flow points={[[-2.4, 0.25, 0], [-1.2, 0.25, 0]]} color={P.violet} count={2} size={0.04} />
            <Flow points={[[1.2, 0.25, 0], [2.4, 0.25, 0]]} color={P.violet} count={2} size={0.04} />
          </>
        )}

        {mode === "weights" && (
          <>
            {/* prompt words as ribbons with variable width into the model */}
            <Slab position={[1.9, 0.5, 0]} size={[1.8, 1.5, 0.16]} color={P.violet} fill={0.2} />
            <Tag position={[1.9, 1.55, 0.15]} tone="violet">{t.prompt}</Tag>
            {(
              [
                [P.teal, 0.9, t.strong],
                [P.amber, 0.45, ""],
                [P.muted, 0.2, t.weak],
              ] as const
            ).map(([col, w, lab], i) => (
              <group key={i}>
                <Ribbon
                  points={[[-2.4, 0.95 - i * 0.55, 0], [0.0, 0.95 - i * 0.55, 0], [0.9, 0.7 - i * 0.3, 0]]}
                  color={col}
                  radius={0.04 * w * 2}
                />
                {lab && <Tag position={[-2.6, 0.95 - i * 0.55, 0.15]} tone={col === P.teal ? "teal" : "muted"} size="xs">{lab}</Tag>}
              </group>
            ))}
            <Flow points={[[1.0, 0.0, 0], [1.9, 0.0, 0]]} color={P.amber} count={2} size={0.05} />
          </>
        )}

        {mode === "delta" && (
          <>
            {/* full FT slab vs LoRA delta slab */}
            <Slab position={[-1.8, 0.3, 0]} size={[2.2, 2.0, 0.16]} color={P.teal} fill={0.18} />
            <Tag position={[-1.8, 1.55, 0.15]} tone="teal">base</Tag>
            {/* FT: a thick violet overlay across all of it */}
            <Slab position={[-1.8, 0.3, 0.18]} size={[2.2, 2.0, 0.05]} color={P.rose} fill={0.5} />
            <Tag position={[-1.8, -0.9, 0.15]} tone="rose" size="xs">{t.full_ft}</Tag>
            {/* LoRA: thin violet overlay on top */}
            <Slab position={[1.8, 0.3, 0]} size={[2.2, 2.0, 0.16]} color={P.teal} fill={0.18} />
            <Slab position={[1.8, 1.35, 0.18]} size={[2.2, 0.22, 0.05]} color={P.violet} fill={0.5} />
            <Tag position={[1.8, 1.75, 0.3]} tone="violet" size="xs">{t.lora}</Tag>
            <Tag position={[1.8, -0.9, 0.15]} tone="muted" size="xs">{t.size_gap}</Tag>
            <Halo position={[1.8, 1.35, 0]} radius={1.3} color={P.violet} opacity={0.3} spin={0.1} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

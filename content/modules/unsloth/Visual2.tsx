"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Unsloth: kernel patching, VRAM win, and the Colab pipeline. */
type Mode = "kernels" | "vram" | "pipeline";

const COPY = {
  en: {
    same_math_faster: "same math, faster",
    patched_kernels_less_vram_colab_end_to_end: "patched kernels · less VRAM · colab end-to-end",
    kernels: "kernels",
    vram: "vram",
    pipeline: "pipeline",
    attention: "attention",
    triton: "triton",
    baseline: "baseline",
    unsloth: "unsloth qlora",
    dataset: "dataset",
    trainer: "trainer",
    gguf: "gguf",
    export: "export",
    before: "before",
    after: "after",
  },
  es: {
    same_math_faster: "misma matemática, más rápido",
    patched_kernels_less_vram_colab_end_to_end: "kernels parcheados · menos VRAM · colab de punta a punta",
    kernels: "kernels",
    vram: "vram",
    pipeline: "pipeline",
    attention: "atención",
    triton: "triton",
    baseline: "baseline",
    unsloth: "unsloth qlora",
    dataset: "dataset",
    trainer: "trainer",
    gguf: "gguf",
    export: "exporta",
    before: "antes",
    after: "después",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("kernels");

  return (
    <Figure
      label={t.same_math_faster}
      hint={t.patched_kernels_less_vram_colab_end_to_end}
      legend={[
        { color: P.teal, label: t.baseline },
        { color: P.violet, label: t.unsloth },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "kernels", label: t.kernels, tone: P.teal },
            { value: "vram", label: t.vram, tone: P.violet },
            { value: "pipeline", label: t.pipeline, tone: P.amber },
          ]}
          ariaLabel={t.same_math_faster}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "kernels" && (
          <>
            {/* attention block with naive halo vs patched halo */}
            <Slab position={[-1.7, 0.55, 0]} size={[2.3, 1.5, 0.16]} color={P.teal} fill={0.16} />
            <Tag position={[-1.7, 1.55, 0.15]} tone="teal">{t.attention}</Tag>
            <Tag position={[-1.7, -0.35, 0.15]} tone="muted" size="xs">{t.before}</Tag>
            {[0, 1, 2].map((i) => (
              <Node3D key={i} position={[-2.35 + i * 0.65, 0.55, 0.15]} color={P.teal} radius={0.11} matte />
            ))}
            <Flow points={[[-0.4, 0.55, 0], [0.6, 0.55, 0]]} color={P.violet} count={3} />
            {/* patched version */}
            <Slab position={[1.9, 0.55, 0]} size={[2.3, 1.5, 0.16]} color={P.violet} fill={0.2} />
            <Tag position={[1.9, 1.55, 0.15]} tone="violet">{t.triton}</Tag>
            <Tag position={[1.9, -0.35, 0.15]} tone="muted" size="xs">{t.after}</Tag>
            {/* one fused kernel instead of three */}
            <Node3D position={[1.9, 0.55, 0.15]} color={P.violet} radius={0.2} pulse={0.3} />
            <Halo position={[1.9, 0.55, 0]} radius={0.85} color={P.violet} opacity={0.35} spin={0.2} />
          </>
        )}

        {mode === "vram" && (
          <>
            {/* two bars: 7B baseline vs Unsloth QLoRA */}
            <Slab position={[-1.5, -0.4 + 1.05, 0]} size={[1.7, 2.1, 0.14]} color={P.teal} fill={0.26} />
            <Tag position={[-1.5, 1.55, 0.15]} tone="teal">7B · bf16</Tag>
            <Tag position={[-1.5, 0.5, 0.15]} tone="teal" size="xs">16 gb</Tag>
            <Slab position={[1.5, -0.4 + 0.375, 0]} size={[1.7, 0.75, 0.14]} color={P.violet} fill={0.32} />
            <Tag position={[1.5, 0.65, 0.15]} tone="violet">{t.unsloth}</Tag>
            <Tag position={[1.5, 0.05, 0.15]} tone="violet" size="xs">5,5 gb</Tag>
            <Wire points={[[-2.7, -0.4, 0], [2.7, -0.4, 0]]} color={P.lineStrong} opacity={0.7} />
            <Tag position={[2.7, -0.75, 0.15]} tone="muted" size="xs">{t.vram}</Tag>
            <Flow points={[[-0.5, 1.4, 0], [0.6, 0.55, 0]]} color={P.violet} count={3} size={0.05} />
          </>
        )}

        {mode === "pipeline" && (
          <>
            {(
              [
                [t.dataset, P.teal, -2.5],
                [t.trainer, P.violet, 0],
                [t.gguf, P.amber, 2.4],
              ] as const
            ).map(([lab, col, x]) => (
              <group key={lab}>
                <Slab position={[x, 0.55, 0]} size={[1.8, 1.0, 0.14]} color={col} fill={0.2} />
                <Tag position={[x, 1.25, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"}>{lab}</Tag>
              </group>
            ))}
            <Flow points={[[-1.6, 0.55, 0], [-0.9, 0.55, 0]]} color={P.teal} count={3} />
            <Flow points={[[0.9, 0.55, 0], [1.5, 0.55, 0]]} color={P.violet} count={3} />
            <Tag position={[2.4, -0.05, 0.15]} tone="muted" size="xs">{t.export}</Tag>
            {/* colab badge */}
            <Slab position={[0, -1.1, 0]} size={[1.5, 0.45, 0.1]} color={P.amber} fill={0.26} />
            <Tag position={[0, -1.55, 0.15]} tone="amber" size="xs">colab · free T4</Tag>
            <Wire points={[[-1.0, -0.4, 0], [-0.4, -0.85, 0], [0.4, -0.85, 0], [1.0, -0.4, 0]]} color={P.lineStrong} dashed opacity={0.5} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

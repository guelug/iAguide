"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Fine-tuning: SFT vs DPO, catastrophic forgetting, held-out eval. */
type Mode = "paths" | "forget" | "eval";

const COPY = {
  en: {
    two_recipes_one_base: "two recipes, one base",
    sft_dpo_forgetting_eval: "sft · dpo · forgetting · eval",
    paths: "paths",
    forgetting: "forgetting",
    eval: "eval",
    sft: "SFT",
    dpo: "DPO",
    examples: "examples",
    chosen: "chosen",
    rejected: "rejected",
    before: "before",
    after: "after",
    fluent_but_generic: "fluent but generic",
    sharp_but_narrow: "sharp but narrow",
    held_out: "held-out",
    train: "train",
  },
  es: {
    two_recipes_one_base: "dos recetas, una base",
    sft_dpo_forgetting_eval: "sft · dpo · olvido · eval",
    paths: "caminos",
    forgetting: "olvido",
    eval: "eval",
    sft: "SFT",
    dpo: "DPO",
    examples: "ejemplos",
    chosen: "elegido",
    rejected: "rechazado",
    before: "antes",
    after: "después",
    fluent_but_generic: "fluido pero genérico",
    sharp_but_narrow: "afilado pero estrecho",
    held_out: "held-out",
    train: "train",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("paths");

  const trainCells = Array.from({ length: 18 }, (_, i) => ({
    position: [-2.0 + (i % 6) * 0.45, 0.4 - Math.floor(i / 6) * 0.42, 0] as [number, number, number],
    color: P.teal,
  }));
  const holdCells = Array.from({ length: 6 }, (_, i) => ({
    position: [1.6 + (i % 3) * 0.45, 0.4 - Math.floor(i / 3) * 0.45, 0] as [number, number, number],
    color: P.violet,
  }));

  return (
    <Figure
      label={t.two_recipes_one_base}
      hint={t.sft_dpo_forgetting_eval}
      legend={[
        { color: P.teal, label: t.sft },
        { color: P.amber, label: t.dpo },
        { color: P.rose, label: t.forgetting },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "paths", label: t.paths, tone: P.teal },
            { value: "forget", label: t.forgetting, tone: P.rose },
            { value: "eval", label: t.eval, tone: P.violet },
          ]}
          ariaLabel={t.two_recipes_one_base}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "paths" && (
          <>
            <Slab position={[0, 1.55, 0]} size={[1.8, 0.55, 0.12]} color={P.violet} fill={0.24} />
            <Tag position={[0, 1.95, 0.15]} tone="violet" size="xs">base model</Tag>
            {/* two arms */}
            <Flow points={[[-0.6, 1.3, 0], [-1.6, 0.7, 0]]} color={P.teal} count={2} size={0.045} />
            <Flow points={[[0.6, 1.3, 0], [1.6, 0.7, 0]]} color={P.amber} count={2} size={0.045} />
            {/* SFT arm: pairs of examples */}
            <Lattice cells={Array.from({ length: 6 }, (_, i) => ({
              position: [-2.3 + (i % 2) * 0.5, 0.4 - Math.floor(i / 2) * 0.45, 0] as [number, number, number],
              color: P.teal,
            }))} size={0.16} opacity={0.9} />
            <Tag position={[-1.95, -0.85, 0.15]} tone="teal">{t.sft} · {t.examples}</Tag>
            {/* DPO arm: chosen vs rejected pairs */}
            {[0, 1, 2].map((i) => (
              <group key={i}>
                <Node3D position={[1.6, 0.4 - i * 0.45, 0]} color={P.teal} radius={0.11} matte />
                <Node3D position={[2.3, 0.4 - i * 0.45, 0]} color={P.rose} radius={0.11} matte />
                <Wire points={[[1.75, 0.4 - i * 0.45, 0], [2.15, 0.4 - i * 0.45, 0]]} color={P.lineStrong} opacity={0.5} />
              </group>
            ))}
            <Tag position={[1.95, -0.95, 0.15]} tone="amber">{t.dpo} · {t.chosen}/{t.rejected}</Tag>
          </>
        )}

        {mode === "forget" && (
          <>
            {/* capability landscape before vs after */}
            <Ribbon
              points={Array.from({ length: 28 }, (_, i) => [-2.6 + i * 0.19, 0.5 + Math.sin(i * 0.4) * 0.7, 0])}
              color={P.teal}
              radius={0.03}
              opacity={0.9}
            />
            <Tag position={[-2.2, 1.6, 0.15]} tone="teal" size="xs">{t.before}</Tag>
            <Ribbon
              points={Array.from({ length: 28 }, (_, i) => {
                const x = -2.6 + i * 0.19;
                const spike = Math.exp(-Math.pow((x + 0.4) / 0.5, 2)) * 1.4;
                return [x, -1.3 + spike + Math.sin(i * 0.4) * 0.08, 0];
              })}
              color={P.rose}
              radius={0.03}
              opacity={0.9}
            />
            <Tag position={[2.3, 0.3, 0.15]} tone="rose" size="xs">{t.after}</Tag>
            <Wire points={[[-2.8, 0.05, 0], [2.8, 0.05, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Tag position={[-2.0, -1.7, 0.15]} tone="muted" size="xs">{t.fluent_but_generic} →</Tag>
            <Tag position={[1.5, -1.7, 0.15]} tone="rose" size="xs">{t.sharp_but_narrow}</Tag>
          </>
        )}

        {mode === "eval" && (
          <>
            {/* train vs held-out split, held-out sealed */}
            <Lattice cells={trainCells} size={0.22} opacity={0.85} />
            <Tag position={[-0.9, 1.15, 0.15]} tone="teal">{t.train}</Tag>
            <Slab position={[2.05, 0.0, 0]} size={[2.0, 1.6, 0.14]} color={P.violet} fill={0.1} rim={0.9} />
            <Lattice cells={holdCells} size={0.22} opacity={0.95} />
            <Tag position={[2.05, 1.15, 0.15]} tone="violet">{t.held_out}</Tag>
            <Halo position={[2.05, 0.0, 0]} radius={1.2} color={P.violet} opacity={0.4} spin={0.15} />
            {/* never cross the seam during training */}
            <Wire points={[[0.4, -0.8, 0], [0.4, 1.5, 0]]} color={P.rose} dashed opacity={0.7} />
            <Tag position={[0.4, -1.3, 0.15]} tone="rose" size="xs">no pasar</Tag>
            <Flow points={[[2.05, -0.85, 0], [2.05, -1.6, 0]]} color={P.violet} count={2} size={0.05} />
            <Tag position={[2.05, -1.95, 0.15]} tone="muted" size="xs">eval al final</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

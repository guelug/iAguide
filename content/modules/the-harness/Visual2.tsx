"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  Lattice,
  Motes,
  Node3D,
  Ribbon,
  Slab,
  Tag,
  type Cell,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* The base of the harness: two phases, then the MoE economics they buy. */
type Mode = "prefill" | "decode" | "a3b";

const COPY = {
  en: {
    prefill_and_decode_: "prefill and decode",
    a3b_and_model_choice: "A3B and model choice",
    two_phases_one_loop: "two phases, one loop",
    prefill: "Prefill",
    decode: "Decode",
    a3b: "A3B / MoE",
    prompt_and_history: "prompt + history",
    kv_cache_in_one_pass: "kv cache in one pass",
    one_token_per_step: "one token per step",
    kv_cache_grows: "kv cache grows",
    a3b_active: "A3B active",
    expert_2_active: "2 of ~8 experts",
    total_48B: "48B total",
    active_3B: "~3B active / token",
    on_disk: "on disk",
  },
  es: {
    prefill_and_decode_: "prefill y decode",
    a3b_and_model_choice: "A3B y elección de modelo",
    two_phases_one_loop: "dos fases, un bucle",
    prefill: "Prefill",
    decode: "Decode",
    a3b: "A3B / MoE",
    prompt_and_history: "prompt + historial",
    kv_cache_in_one_pass: "kv cache de una vez",
    one_token_per_step: "un token cada paso",
    kv_cache_grows: "kv cache crece",
    a3b_active: "A3B activos",
    expert_2_active: "2 de ~8 expertos",
    total_48B: "48B total",
    active_3B: "~3B activos / token",
    on_disk: "en disco",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("prefill");

  // 12 teal cubes descending through the stacked layer slabs
  const prefillTokens: Cell[] = Array.from({ length: 12 }, (_, i) => ({
    position: [-1.65 + (i % 12) * 0.3, 1.0 + Math.floor(i / 12) * 0.0, 0.2],
    color: P.teal,
  }));

  // 8 expert nodes for the MoE slab; only 2 are "lit"
  const experts: { x: number; y: number; lit: boolean }[] = [
    { x: -1.05, y: 0.35, lit: true },
    { x: -0.35, y: 0.35, lit: false },
    { x: 0.35, y: 0.35, lit: false },
    { x: 1.05, y: 0.35, lit: true },
    { x: -1.05, y: -0.4, lit: false },
    { x: -0.35, y: -0.4, lit: false },
    { x: 0.35, y: -0.4, lit: false },
    { x: 1.05, y: -0.4, lit: false },
  ];

  return (
    <Figure
      label={t.two_phases_one_loop}
      hint={t.a3b_and_model_choice}
      legend={[
        { color: P.teal, label: t.prefill },
        { color: P.amber, label: t.decode },
        { color: P.violet, label: t.a3b_active },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "prefill", label: t.prefill, tone: P.teal },
            { value: "decode", label: t.decode, tone: P.amber },
            { value: "a3b", label: t.a3b, tone: P.violet },
          ]}
          ariaLabel={t.two_phases_one_loop}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.4], fov: 38 }}>
        <Motes count={110} radius={7} opacity={0.3} />

        {mode === "prefill" && (
          <>
            {/* stacked layer slabs (compute stack) */}
            {[-0.6, -0.05, 0.5].map((y, i) => (
              <Slab
                key={i}
                position={[0, y, 0]}
                size={[3.6, 0.32, 0.1]}
                color={P.teal}
                fill={0.12}
                rim={0.55}
              />
            ))}
            <Tag position={[0, 1.0, 0.2]} tone="teal">{t.prompt_and_history}</Tag>
            {/* the row of teal token cubes sweeping through the stack */}
            <Lattice cells={prefillTokens} size={0.2} opacity={0.95} />
            <Flow
              points={[
                [-2.1, 1.25, 0.3],
                [-2.1, 0.6, 0.3],
                [-2.1, 0.05, 0.3],
                [-2.1, -0.5, 0.3],
                [2.1, -0.5, 0.3],
              ]}
              color={P.teal}
              count={5}
              speed={0.55}
            />
            <Tag position={[0, -1.2, 0.2]} tone="teal">{t.kv_cache_in_one_pass}</Tag>
          </>
        )}

        {mode === "decode" && (
          <>
            {/* single amber chain — one token per step */}
            {[-2.2, -1.2, -0.2, 0.8, 1.8].map((x, i) => (
              <Node3D
                key={i}
                position={[x, 0.6, 0]}
                color={P.amber}
                radius={0.16}
                pulse={i * 0.45}
              />
            ))}
            <Flow
              points={[
                [-2.4, 0.6, 0],
                [-1.2, 0.6, 0],
                [-0.2, 0.6, 0],
                [0.8, 0.6, 0],
                [1.8, 0.6, 0],
              ]}
              color={P.amber}
              count={4}
              speed={0.15}
            />
            <Tag position={[0, 1.35, 0.2]} tone="amber">{t.one_token_per_step}</Tag>

            {/* growing KV cache slab underneath */}
            <Slab
              position={[0, -0.7, 0]}
              size={[4.2, 0.5, 0.12]}
              color={P.violet}
              fill={0.18}
            />
            <Tag position={[0, -1.25, 0.2]} tone="violet">{t.kv_cache_grows}</Tag>

            {/* ribbon pointing back from the latest token to the growing KV */}
            <Ribbon
              points={[
                [1.8, 0.4, 0],
                [1.4, -0.05, 0],
                [0.6, -0.35, 0],
                [-0.4, -0.5, 0],
                [-1.4, -0.6, 0],
              ]}
              color={P.violet}
              radius={0.028}
            />
          </>
        )}

        {mode === "a3b" && (
          <>
            {/* big muted disk slab = 48B total on disk */}
            <Slab
              position={[-1.6, 0, 0]}
              size={[2.0, 2.2, 0.14]}
              color={P.muted}
              fill={0.22}
            />
            <Tag position={[-1.6, 1.45, 0.2]} tone="muted">{t.total_48B}</Tag>
            <Tag position={[-1.6, -1.45, 0.2]} tone="muted" size="xs">{t.on_disk}</Tag>

            {/* MoE slab — 8 expert nodes, only 2 lit */}
            <Slab
              position={[1.7, 0, 0]}
              size={[2.2, 2.2, 0.14]}
              color={P.violet}
              fill={0.12}
            />
            <Tag position={[1.7, 1.45, 0.2]} tone="violet">{t.expert_2_active}</Tag>
            {experts.map((e, i) => (
              <group key={i}>
                <Node3D
                  position={[e.x + 1.7 - 1.7, e.y, 0.14]}
                  color={e.lit ? P.violet : P.lineStrong}
                  radius={e.lit ? 0.14 : 0.1}
                  pulse={e.lit ? 0.4 : 0}
                  matte={!e.lit}
                />
              </group>
            ))}

            {/* contrast legend at the bottom */}
            <Tag position={[0, -1.45, 0.2]} tone="violet">{t.a3b_active}</Tag>
          </>
        )}
      </Stage>
    </Figure>
  );
}
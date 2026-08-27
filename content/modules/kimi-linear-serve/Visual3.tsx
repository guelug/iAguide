"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  Halo,
  Lattice,
  Motes,
  Node3D,
  PointerTilt,
  Ribbon,
  Slab,
  Tag,
  Wire,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Serving Kimi Linear: three formula/algorithm scenes — KV memory shape,
   arithmetic intensity of the MoE, and batch vs decode latency. */
type Mode = "kv_memory" | "arithmetic_intensity" | "batch_latency";

const COPY = {
  en: {
    formulas_for_serving_kimi_linear: "formulas for serving kimi linear",
    memory_flops_and_a_batch_decode_curve: "memory, flops, and a batch decode curve",
    kv_memory: "kv memory",
    arithmetic_intensity: "arithmetic intensity",
    batch_latency: "batch latency",
    mla_tower: "mla tower",
    kda_state: "kda state",
    grows_with_T: "grows with T",
    constant_in_T: "constant in T",
    formula_mla_kv: "O(T · d)",
    formula_kda_state: "O(d^2)",
    hybrid_budget: "hybrid budget",
    active_3b: "active 3b",
    resident_48b: "resident 48b",
    formula_active_flops: "2 · N_active · T",
    formula_moe_gate: "top-k gate",
    decode_step: "decode step",
    tpot: "tpot",
    formula_decode: "2 · N_active + kv_read",
    curve: "tpot curve",
    small_batch: "small batch",
    large_batch: "large batch",
    flat_line: "flat (hybrid)",
    steep_line: "steep (softmax)",
    formula_batch: "tpot ~ 1/batch",
  },
  es: {
    formulas_for_serving_kimi_linear: "fórmulas para servir kimi linear",
    memory_flops_and_a_batch_decode_curve: "memoria, flops y la curva de decode por lote",
    kv_memory: "memoria kv",
    arithmetic_intensity: "intensidad aritmética",
    batch_latency: "latencia por lote",
    mla_tower: "torre mla",
    kda_state: "estado kda",
    grows_with_T: "crece con T",
    constant_in_T: "constante en T",
    formula_mla_kv: "O(T · d)",
    formula_kda_state: "O(d^2)",
    hybrid_budget: "presupuesto híbrido",
    active_3b: "activos 3b",
    resident_48b: "residentes 48b",
    formula_active_flops: "2 · N_active · T",
    formula_moe_gate: "gate top-k",
    decode_step: "paso de decode",
    tpot: "tpot",
    formula_decode: "2 · N_active + kv_read",
    curve: "curva tpot",
    small_batch: "lote pequeño",
    large_batch: "lote grande",
    flat_line: "plana (híbrido)",
    steep_line: "empinada (softmax)",
    formula_batch: "tpot ~ 1/lote",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("kv_memory");

  // MLA tower: vertical stack that grows with T (animate the height visually).
  // KDA state: a small fixed block at the foot of the tower.
  return (
    <Figure
      label={t.formulas_for_serving_kimi_linear}
      hint={t.memory_flops_and_a_batch_decode_curve}
      legend={[
        { color: P.teal, label: t.grows_with_T },
        { color: P.violet, label: t.constant_in_T },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "kv_memory", label: t.kv_memory, tone: P.teal },
            { value: "arithmetic_intensity", label: t.arithmetic_intensity, tone: P.amber },
            { value: "batch_latency", label: t.batch_latency, tone: P.violet },
          ]}
          ariaLabel={t.formulas_for_serving_kimi_linear}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "kv_memory" && (
          <>
            {/* MLA tower: a tall stack of pages that grows with T */}
            <Slab
              position={[-1.7, 0.4, 0]}
              size={[1.4, 2.2, 0.16]}
              color={P.teal}
              fill={0.16}
            />
            <Tag position={[-1.7, 1.7, 0.2]} tone="teal">{t.mla_tower}</Tag>
            {/* pages stacked inside the tower */}
            {Array.from({ length: 8 }, (_, i) => (
              <Node3D
                key={i}
                position={[-1.7, 1.3 - i * 0.22, 0.1]}
                color={P.teal}
                radius={0.08}
                matte
              />
            ))}
            <Tag position={[-1.7, -0.85, 0.2]} tone="teal" size="xs">{t.formula_mla_kv}</Tag>
            {/* KDA state: small fixed block */}
            <Slab
              position={[1.7, 0.4, 0]}
              size={[1.4, 0.55, 0.16]}
              color={P.violet}
              fill={0.32}
            />
            <Tag position={[1.7, 0.9, 0.2]} tone="violet">{t.kda_state}</Tag>
            {/* the constant-size delta matrix 128 x 128 inside */}
            <Lattice
              cells={Array.from({ length: 64 }, (_, i) => ({
                position: [
                  1.7 - 0.42 + (i % 8) * 0.12,
                  0.4 - 0.18 + Math.floor(i / 8) * 0.05,
                  0.1,
                ] as [number, number, number],
                color: P.violet,
              }))}
              size={0.045}
              opacity={0.85}
              matte
            />
            <Tag position={[1.7, -0.85, 0.2]} tone="violet" size="xs">{t.formula_kda_state}</Tag>
            {/* growth arrow on MLA tower */}
            <Flow
              points={[[-2.55, 1.45, 0], [-3.05, -0.55, 0]]}
              color={P.teal}
              count={2}
              size={0.04}
            />
            <Tag position={[-2.85, 1.55, 0.2]} tone="teal" size="xs">{t.grows_with_T}</Tag>
            <Tag position={[1.7, -1.45, 0.2]} tone="violet" size="xs">{t.constant_in_T}</Tag>
            <Wire
              points={[[-0.85, 0.4, 0], [0.95, 0.4, 0]]}
              color={P.lineStrong}
              opacity={0.6}
            />
            <Tag position={[0.05, 0.7, 0.2]} tone="ink" size="xs">{t.hybrid_budget}</Tag>
          </>
        )}

        {mode === "arithmetic_intensity" && (
          <>
            {/* 48 experts MoE; only a slice is "active" (lit) */}
            <Slab
              position={[-2.0, 0.4, 0]}
              size={[2.2, 1.9, 0.14]}
              color={P.muted}
              fill={0.08}
            />
            <Tag position={[-2.0, 1.5, 0.2]} tone="ink">{t.resident_48b}</Tag>
            {/* resident grid: 6 x 8 dim cells (mostly muted) */}
            {Array.from({ length: 48 }, (_, i) => (
              <Node3D
                key={i}
                position={[
                  -2.6 + (i % 6) * 0.32,
                  1.15 - Math.floor(i / 6) * 0.22,
                  0.08,
                ]}
                color={P.muted}
                radius={0.07}
                matte
              />
            ))}
            {/* 3 active experts, highlighted */}
            {[7, 23, 41].map((i, k) => (
              <Node3D
                key={k}
                position={[
                  -2.6 + (i % 6) * 0.32,
                  1.15 - Math.floor(i / 6) * 0.22,
                  0.18,
                ]}
                color={P.amber}
                radius={0.1}
                pulse={k * 0.6}
              />
            ))}
            <Tag position={[-2.0, -0.8, 0.2]} tone="amber" size="xs">{t.active_3b}</Tag>

            {/* arrow into the compute lane */}
            <Flow
              points={[[-0.8, 0.4, 0], [0.0, 0.4, 0]]}
              color={P.amber}
              count={3}
              size={0.05}
            />

            {/* compute slab with the formula */}
            <Slab
              position={[1.7, 0.4, 0]}
              size={[2.4, 1.4, 0.14]}
              color={P.teal}
              fill={0.18}
            />
            <Tag position={[1.7, 1.3, 0.2]} tone="teal">{t.decode_step}</Tag>
            <Tag position={[1.7, 0.45, 0.2]} tone="ink" size="xs">{t.formula_active_flops}</Tag>
            <Tag position={[1.7, -0.1, 0.2]} tone="muted" size="xs">{t.formula_moe_gate}</Tag>

            {/* a small lattice representing one matmul (active experts) */}
            <Lattice
              cells={Array.from({ length: 12 }, (_, i) => ({
                position: [
                  1.2 + (i % 3) * 0.22,
                  -0.6 - Math.floor(i / 3) * 0.12,
                  0.1,
                ] as [number, number, number],
                color: P.amber,
              }))}
              size={0.07}
              opacity={0.9}
              matte
            />
          </>
        )}

        {mode === "batch_latency" && (
          <>
            {/* axes: x = batch size, y = TPOT */}
            <Wire points={[[-2.6, -1.0, 0], [2.6, -1.0, 0]]} color={P.lineStrong} opacity={0.7} />
            <Wire points={[[-2.6, -1.0, 0], [-2.6, 1.2, 0]]} color={P.lineStrong} opacity={0.7} />
            <Tag position={[-2.8, 1.25, 0.2]} tone="ink" size="xs">{t.tpot}</Tag>
            <Tag position={[2.7, -1.05, 0.2]} tone="ink" size="xs">{t.formula_batch}</Tag>

            {/* steep softmax curve: drops fast then levels */}
            <Ribbon
              points={Array.from({ length: 24 }, (_, i) => [
                -2.2 + i * 0.2,
                -0.85 + Math.exp(-i * 0.18) * 1.4,
                0.05,
              ])}
              color={P.rose}
              radius={0.04}
            />
            <Tag position={[-2.2, 1.0, 0.2]} tone="rose" size="xs">{t.steep_line}</Tag>

            {/* flat hybrid curve: drops much less with T because KDA is constant */}
            <Ribbon
              points={Array.from({ length: 24 }, (_, i) => [
                -2.2 + i * 0.2,
                -0.85 + (1 - i * 0.012) * 0.55,
                0.2,
              ])}
              color={P.teal}
              radius={0.05}
            />
            <Tag position={[2.2, 0.25, 0.3]} tone="teal" size="xs">{t.flat_line}</Tag>

            {/* batch markers */}
            <Node3D position={[-1.8, -1.0, 0.1]} color={P.violet} radius={0.09} matte />
            <Tag position={[-1.8, -1.3, 0.2]} tone="violet" size="xs">{t.small_batch}</Tag>
            <Node3D position={[1.9, -1.0, 0.1]} color={P.violet} radius={0.11} matte />
            <Tag position={[1.9, -1.3, 0.2]} tone="violet" size="xs">{t.large_batch}</Tag>

            {/* the formula badge */}
            <Slab
              position={[-2.05, 1.7, 0]}
              size={[2.0, 0.45, 0.12]}
              color={P.teal}
              fill={0.18}
            />
            <Tag position={[-2.05, 1.7, 0.2]} tone="teal" size="xs">{t.formula_decode}</Tag>

            <Halo position={[-2.2, -0.4, 0.1]} radius={0.55} color={P.rose} opacity={0.18} spin={0.05} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

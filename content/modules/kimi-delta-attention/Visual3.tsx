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

/* Kimi Linear is a hybrid stack; NoPE leaves position to KDA; a 75% smaller KV
   is the claim that matters to serving. */
type Mode = "hybrid" | "nope" | "kv";

const COPY = {
  en: {
    hybrid_not_pure_rnn: "hybrid, not a pure rnn",
    three_out_of_four_layers_are_kda: "3 of 4 layers are KDA",
    hybrid: "hybrid",
    nope: "nope",
    kv_savings: "kv −75%",
    kda_layer: "kda layer",
    full_attention_layer: "full attn layer",
    carries_position: "kda carries position",
    no_rope_in_mla: "no rope in mla",
    kv_48b_full: "kv at 48b, full",
    kv_48b_kda: "kv at 48b, kda",
    four_to_one: "4:1",
    same_model: "same model",
  },
  es: {
    hybrid_not_pure_rnn: "híbrido, no un rnn puro",
    three_out_of_four_layers_are_kda: "3 de 4 capas son kda",
    hybrid: "híbrido",
    nope: "nope",
    kv_savings: "kv −75%",
    kda_layer: "capa kda",
    full_attention_layer: "capa full attn",
    carries_position: "kda carga la posición",
    no_rope_in_mla: "sin rope en mla",
    kv_48b_full: "kv en 48b, full",
    kv_48b_kda: "kv en 48b, kda",
    four_to_one: "4:1",
    same_model: "mismo modelo",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("hybrid");

  const kvFull = Array.from({ length: 48 }, (_, i) => ({
    position: [
      -2.4 + (i % 8) * 0.3,
      0.9 - Math.floor(i / 8) * 0.3,
      0,
    ] as [number, number, number],
    color: P.teal,
  }));
  const kvKda = kvFull.filter((_, i) => i % 4 === 0).map((c) => ({
    ...c,
    position: [c.position[0] * 0.4 + 1.6, c.position[1], 0] as [number, number, number],
    color: P.violet,
  }));

  return (
    <Figure
      label={t.hybrid_not_pure_rnn}
      hint={t.three_out_of_four_layers_are_kda}
      legend={[
        { color: P.violet, label: t.kda_layer },
        { color: P.teal, label: t.full_attention_layer },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "hybrid", label: t.hybrid, tone: P.violet },
            { value: "nope", label: t.nope, tone: P.amber },
            { value: "kv", label: t.kv_savings, tone: P.teal },
          ]}
          ariaLabel={t.hybrid_not_pure_rnn}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "hybrid" && (
          <>
            {/* a 4-layer sandwich: KDA, KDA, KDA, FULL */}
            {[0, 1, 2, 3].map((i) => {
              const full = i === 3;
              return (
                <group key={i}>
                  <Slab
                    position={[0, 1.0 - i * 0.62, 0]}
                    size={[4.4, 0.42, 0.14]}
                    color={full ? P.teal : P.violet}
                    fill={full ? 0.28 : 0.16}
                  />
                  <Tag
                    position={[-2.6, 1.0 - i * 0.62, 0.15]}
                    tone={full ? "teal" : "violet"}
                    size="xs"
                  >
                    {full ? t.full_attention_layer : t.kda_layer}
                  </Tag>
                </group>
              );
            })}
            <Flow points={[[0, 1.6, 0], [0, -0.7, 0]]} color={P.muted} count={4} size={0.04} />
            <Tag position={[2.7, 0.35, 0.2]} tone="ink">4:1</Tag>
          </>
        )}

        {mode === "nope" && (
          <>
            {/* MLA without rope: a stack of heads with no positional spiral */}
            <Slab position={[-1.3, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.teal} fill={0.14} />
            <Tag position={[-1.3, 1.7, 0.2]} tone="teal">MLA</Tag>
            {[[-1.8, 0.85], [-1.1, 0.9], [-1.6, 0.2], [-0.9, 0.2]].map(([x, y], i) => (
              <Node3D key={i} position={[x, y, 0.1]} color={P.teal} radius={0.11} matte />
            ))}
            <Tag position={[-1.3, -0.55, 0.2]} tone="muted" size="xs">{t.no_rope_in_mla}</Tag>
            {/* KDA carries the position signal instead */}
            <Slab position={[1.5, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.violet} fill={0.14} />
            <Tag position={[1.5, 1.7, 0.2]} tone="violet">KDA</Tag>
            {/* the positional wave INSIDE the decay */}
            <Ribbon
              points={Array.from({ length: 24 }, (_, i) => [
                0.75 + i * 0.07,
                0.45 + Math.sin(i * 0.55) * 0.35 * Math.exp(-i * 0.04),
                0.1,
              ])}
              color={P.violet}
              radius={0.018}
            />
            <Tag position={[1.5, -0.55, 0.2]} tone="violet" size="xs">{t.carries_position}</Tag>
            <Flow points={[[-0.1, 0.5, 0], [0.4, 0.5, 0]]} color={P.amber} count={3} size={0.05} />
          </>
        )}

        {mode === "kv" && (
          <>
            <Lattice cells={kvFull} size={0.16} opacity={0.9} />
            <Lattice cells={kvKda} size={0.16} opacity={0.95} />
            <Tag position={[-1.35, 1.65, 0.2]} tone="teal" size="xs">{t.kv_48b_full}</Tag>
            <Tag position={[1.55, 1.65, 0.2]} tone="violet" size="xs">{t.kv_48b_kda}</Tag>
            <Halo position={[1.55, 0.0, 0]} radius={1.15} color={P.violet} opacity={0.3} spin={0.15} />
            <Tag position={[2.8, -0.9, 0.2]} tone="ink">{t.four_to_one}</Tag>
            <Tag position={[0.1, -1.6, 0.2]} tone="muted" size="xs">{t.same_model}</Tag>
            <Wire points={[[-0.2, 0.0, 0], [0.9, 0.0, 0]]} color={P.lineStrong} dashed opacity={0.6} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

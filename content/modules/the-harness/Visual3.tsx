"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Drift,
  Flow,
  Halo,
  Motes,
  Node3D,
  Ribbon,
  Slab,
  Tag,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Three signals to watch; and the deeper point: the harness is the product. */
type Mode = "signals" | "harness";

const COPY = {
  en: {
    in_production_: "in production",
    harness_vs_model: "harness vs model",
    three_signals_one_dashboard: "three signals, one dashboard",
    production_signals: "signals",
    harness_loop: "harness loop",
    cache_hit_rate: "cache hit rate",
    cost_per_turn: "cost / turn",
    ttft: "ttft",
    target_80: "target > 80%",
    cost_per_turn_label: "$ / turn",
    ttft_label: "first-token latency",
    harness_is_the_product: "harness = product",
    model_is_a_commodity: "model (commodity)",
    loop_label: "loop",
    user: "user",
    tools: "tools",
    history: "history",
  },
  es: {
    in_production_: "en producción",
    harness_vs_model: "arnés frente a modelo",
    three_signals_one_dashboard: "tres señales, un panel",
    production_signals: "Señales",
    harness_loop: "Bucle",
    cache_hit_rate: "tasa cache hit",
    cost_per_turn: "coste / turno",
    ttft: "ttft",
    target_80: "objetivo > 80%",
    cost_per_turn_label: "$ por turno",
    ttft_label: "latencia 1.er token",
    harness_is_the_product: "arnés = producto",
    model_is_a_commodity: "modelo (commodity)",
    loop_label: "bucle",
    user: "usuario",
    tools: "tools",
    history: "historial",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("signals");

  return (
    <Figure
      label={t.in_production_}
      hint={t.harness_vs_model}
      legend={[
        { color: P.teal, label: t.cache_hit_rate },
        { color: P.amber, label: t.cost_per_turn },
        { color: P.violet, label: t.ttft },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "signals", label: t.production_signals, tone: P.teal },
            { value: "harness", label: t.harness_loop, tone: P.violet },
          ]}
          ariaLabel={t.three_signals_one_dashboard}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.4], fov: 38 }}>
        <Motes count={110} radius={7} opacity={0.3} />

        {mode === "signals" && (
          <>
            {/* three gauges in a row */}
            {[
              { x: -2.3, color: P.teal, label: t.cache_hit_rate, sub: t.target_80, haloSpin: 0.45 },
              { x: 0.0, color: P.amber, label: t.cost_per_turn, sub: t.cost_per_turn_label, haloSpin: 0.25 },
              { x: 2.3, color: P.violet, label: t.ttft, sub: t.ttft_label, haloSpin: 0.18 },
            ].map((g, i) => (
              <group key={i}>
                <Slab
                  position={[g.x, 0, 0]}
                  size={[1.7, 1.7, 0.14]}
                  color={g.color}
                  fill={0.14}
                />
                <Halo
                  position={[g.x, 0, 0.12]}
                  radius={0.42}
                  color={g.color}
                  opacity={0.7}
                  spin={g.haloSpin}
                />
                <Node3D
                  position={[g.x, 0, 0.14]}
                  color={g.color}
                  radius={0.08}
                  matte
                />
                <Tag position={[g.x, 1.1, 0.2]} tone={
                  g.color === P.teal
                    ? "teal"
                    : g.color === P.amber
                    ? "amber"
                    : "violet"
                }>{g.label}</Tag>
                <Tag position={[g.x, -1.05, 0.2]} tone="muted" size="xs">{g.sub}</Tag>
              </group>
            ))}
          </>
        )}

        {mode === "harness" && (
          <>
            {/* centered loop ring of nodes */}
            <Drift amount={0.04} speed={0.3}>
              {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2;
                const x = Math.cos(a) * 1.9;
                const y = Math.sin(a) * 1.1;
                const tones = ["teal", "teal", "amber", "amber", "violet", "muted"] as const;
                const labels = [t.user, t.tools, t.history, t.user, t.tools, t.history];
                const cols = [P.teal, P.amber, P.violet, P.teal, P.amber, P.lineStrong];
                return (
                  <group key={i}>
                    <Node3D
                      position={[x, y, 0]}
                      color={cols[i]}
                      radius={0.16}
                      pulse={i * 0.4}
                    />
                    <Tag
                      position={[x * 1.2, y * 1.3, 0.2]}
                      tone={tones[i]}
                      size="xs"
                    >
                      {labels[i]}
                    </Tag>
                  </group>
                );
              })}
              <Flow
                points={Array.from({ length: 6 }, (_, i) => {
                  const a = (i / 6) * Math.PI * 2;
                  return [Math.cos(a) * 1.9, Math.sin(a) * 1.1, 0] as [number, number, number];
                }).concat([
                  [Math.cos(0) * 1.9, Math.sin(0) * 1.1, 0] as [number, number, number],
                ])}
                color={P.teal}
                count={6}
                speed={0.3}
              />
            </Drift>

            {/* engine slab in the middle that "swaps" — fixed center for clarity */}
            <Slab
              position={[0, 0, 0.1]}
              size={[1.6, 0.7, 0.14]}
              color={P.amber}
              fill={0.2}
            />
            <Tag position={[0, 0, 0.3]} tone="amber">{t.model_is_a_commodity}</Tag>

            {/* ribbon pointing back to the harness loop, above the engine */}
            <Ribbon
              points={[
                [-1.9, -1.05, 0],
                [-1.2, -1.45, 0],
                [0, -1.55, 0],
                [1.2, -1.45, 0],
                [1.9, -1.05, 0],
              ]}
              color={P.violet}
              radius={0.028}
            />

            <Tag position={[0, -1.55, 0.2]} tone="violet">{t.harness_is_the_product}</Tag>
          </>
        )}
      </Stage>
    </Figure>
  );
}
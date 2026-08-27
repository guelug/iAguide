"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Two charts, not one: SignalOps stayed green because it only watched p95. */
type Mode = "green" | "truth";

const COPY = {
  en: {
    latency_vs_error_: "latency vs error",
    one_green_chart_hid_a_40_failure: "one green chart hid a 40% failure",
    what_signalops_saw: "what signalops saw",
    what_was_happening: "what was happening",
    p95_18s: "p95 1.8s",
    healthy: "healthy",
    tool_error_40: "tool error 40%",
    crm_timeout: "crm timeout",
    fast_apology: "fast apology",
    user_still_without_ticket: "user still without ticket",
  },
  es: {
    latency_vs_error_: "latencia vs error",
    one_green_chart_hid_a_40_failure: "un gráfico verde ocultó un 40% de fallo",
    what_signalops_saw: "lo que signalops veía",
    what_was_happening: "lo que pasaba de verdad",
    p95_18s: "p95 1,8s",
    healthy: "saludable",
    tool_error_40: "error de tool 40%",
    crm_timeout: "timeout al crm",
    fast_apology: "disculpa rápida",
    user_still_without_ticket: "usuario sin ticket",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("green");

  // a calm p95 line (teal, flat) and a sawtooth error ratio (rose)
  const p95: [number, number, number][] = Array.from({ length: 9 }, (_, i) => [
    -2.8 + i * 0.7,
    0.15 + Math.sin(i * 0.9) * 0.06,
    0,
  ]);
  const err: [number, number, number][] = Array.from({ length: 9 }, (_, i) => [
    -2.8 + i * 0.7,
    -0.9 + (i % 2 === 0 ? 0.55 : 0.1) + i * 0.02,
    0,
  ]);

  return (
    <Figure
      label={t.latency_vs_error_}
      hint={t.one_green_chart_hid_a_40_failure}
      legend={[
        { color: P.teal, label: t.p95_18s },
        { color: P.rose, label: t.tool_error_40 },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "green", label: t.what_signalops_saw, tone: P.teal },
            { value: "truth", label: t.what_was_happening, tone: P.rose },
          ]}
          ariaLabel={t.latency_vs_error_}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={100} radius={7} opacity={0.3} />

        {/* chart frame */}
        <Wire points={[[-3.0, -1.3, 0], [-3.0, 1.6, 0]]} color={P.lineStrong} opacity={0.6} />
        <Wire points={[[-3.0, -1.3, 0], [3.0, -1.3, 0]]} color={P.lineStrong} opacity={0.6} />

        {/* p95 line — always visible, always green */}
        <Wire points={p95} color={P.teal} width={2} opacity={0.9} />
        <Tag position={[2.6, 0.35, 0.2]} tone="teal" size="xs">{t.p95_18s}</Tag>

        {mode === "green" ? (
          <>
            <Halo position={[0, 0.2, 0]} radius={2.6} color={P.teal} opacity={0.18} rotation={[0, 0, 0]} spin={0.05} />
            <Tag position={[0, 1.1, 0.2]} tone="teal">{t.healthy}</Tag>
            <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.12} pulse={0.4} />
          </>
        ) : (
          <>
            <Wire points={err} color={P.rose} width={2} opacity={0.95} />
            <Tag position={[2.6, -0.55, 0.2]} tone="rose" size="xs">{t.tool_error_40}</Tag>
            {err.filter((_, i) => i % 2 === 0).map((p, i) => (
              <Node3D key={i} position={p} color={P.rose} radius={0.08} pulse={0.5} matte />
            ))}
            {/* what the spans actually say */}
            <Slab position={[-2.0, 1.15, 0]} size={[1.7, 0.42, 0.1]} color={P.rose} fill={0.2} />
            <Tag position={[-2.0, 1.55, 0.2]} tone="rose" size="xs">{t.crm_timeout}</Tag>
            <Slab position={[0.2, 1.15, 0]} size={[1.7, 0.42, 0.1]} color={P.amber} fill={0.2} />
            <Tag position={[0.2, 1.55, 0.2]} tone="amber" size="xs">{t.fast_apology}</Tag>
            <Tag position={[2.4, 1.15, 0.2]} tone="ink" size="xs">{t.user_still_without_ticket}</Tag>
            <Flow points={[[-2.0, 0.9, 0], [-2.3, -0.7, 0]]} color={P.rose} count={2} size={0.045} />
          </>
        )}
      </Stage>
    </Figure>
  );
}

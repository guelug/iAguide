"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Drift, Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Autoregressive until EOS; sampling levers; determinism; the chat model is an
   engine inside the agent, not the agent itself. */
type Mode = "eos" | "sampling" | "engine";

const COPY = {
  en: {
    autoregressive_until_eos: "autoregressive until eos",
    the_same_engine_three_throttles_a_model_is_not_an_agent_: "one engine, three throttles — a model is not an agent",
    until_eos: "until eos",
    sampling: "sampling",
    chat_engine: "chat engine",
    temperature: "temperature",
    top_p: "top-p",
    greedy: "greedy",
    spread: "spread",
    peaked: "peaked",
    cutoff: "cutoff",
    system: "system",
    template: "template",
    loop: "loop",
    model: "model",
    deterministic: "deterministic",
    engine_is: "engine",
    seed_notes: "seed ≠ same output; kernels, batching, versions",
    eos: "eos",
    next_token: "next token",
    stops: "stops",
  },
  es: {
    autoregressive_until_eos: "autoregresivo hasta eos",
    the_same_engine_three_throttles_a_model_is_not_an_agent_: "un motor, tres aceleradores — un modelo no es un agente",
    until_eos: "hasta eos",
    sampling: "muestreo",
    chat_engine: "motor chat",
    temperature: "temperatura",
    top_p: "top-p",
    greedy: "codicioso",
    spread: "plana",
    peaked: "afilada",
    cutoff: "corte",
    system: "sistema",
    template: "plantilla",
    loop: "bucle",
    model: "modelo",
    deterministic: "determinista",
    engine_is: "motor",
    seed_notes: "seed ≠ misma salida; kernels, lote, versiones",
    eos: "eos",
    next_token: "siguiente token",
    stops: "para",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("eos");

  // token chain emitted until EOS
  const chain = ["El", " cielo", " está", " des", "pe", "jado"];

  return (
    <Figure
      label={t.autoregressive_until_eos}
      hint={t.the_same_engine_three_throttles_a_model_is_not_an_agent_}
      legend={[
        { color: P.teal, label: t.eos },
        { color: P.amber, label: t.sampling },
        { color: P.violet, label: t.chat_engine },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "eos", label: t.until_eos, tone: P.teal },
            { value: "sampling", label: t.sampling, tone: P.amber },
            { value: "engine", label: t.chat_engine, tone: P.violet },
          ]}
          ariaLabel={t.autoregressive_until_eos}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.8], fov: 36 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "eos" && (
          <>
            {/* tokens stream out one by one */}
            {chain.map((tk, i) => (
              <group key={i}>
                <Node3D position={[-2.4 + i * 0.85, 0.5, 0]} color={P.teal} radius={0.13} pulse={i * 0.3} matte />
                <Tag position={[-2.4 + i * 0.85, 0.95, 0.15]} tone="teal" size="xs">{tk}</Tag>
              </group>
            ))}
            {chain.slice(0, -1).map((_, i) => (
              <Flow
                key={i}
                points={[[-2.4 + i * 0.85 + 0.18, 0.5, 0], [-2.4 + (i + 1) * 0.85 - 0.18, 0.5, 0]]}
                color={P.teal}
                count={1}
                size={0.04}
                speed={0.3}
              />
            ))}
            {/* the EOS terminator */}
            <Halo position={[2.85, 0.5, 0]} radius={0.5} color={P.rose} opacity={0.6} spin={0.3} />
            <Node3D position={[2.85, 0.5, 0]} color={P.rose} radius={0.14} pulse={0.4} />
            <Tag position={[2.85, 1.1, 0.15]} tone="rose">{t.eos}</Tag>
            <Tag position={[0.2, -0.35, 0.15]} tone="muted">{t.stops}</Tag>
            {/* attention pointing back to the growing prefix */}
            {chain.map((_, i) => (
              <Wire
                key={i}
                points={[[-2.4 + i * 0.85, 0.3, 0], [-2.4 + i * 0.85 - 0.35, -1.5, 0]]}
                color={P.violet}
                opacity={0.25}
              />
            ))}
            <Tag position={[-2.0, -1.8, 0.15]} tone="violet" size="xs">kv · crece</Tag>
          </>
        )}

        {mode === "sampling" && (
          <>
            {/* three probability curves */}
            {[
              [0.15, P.teal, t.peaked, -1.15],
              [0.55, P.amber, t.spread, 0],
              [1.0, P.rose, "T=2", 1.15],
            ].map(([s, col, lab, y], k) => (
              <group key={k}>
                <Wire
                  points={Array.from({ length: 28 }, (_, i) => {
                    const x = -2.4 + i * 0.18;
                    const peak = Math.exp(-Math.pow((i - 14) / (4 * (s as number)), 2));
                    return [x, (y as number) + peak * 0.6, 0] as [number, number, number];
                  })}
                  color={col as string}
                  width={2.4}
                  opacity={0.9}
                />
                <Tag position={[2.9, (y as number) + 0.3, 0.15]} tone={col === P.teal ? "teal" : col === P.amber ? "amber" : "rose"} size="xs">
                  {lab as string}
                </Tag>
              </group>
            ))}
            <Tag position={[0, -1.85, 0.15]} tone="muted">{t.temperature}</Tag>
            {/* top-p cutoff */}
            <Wire points={[[-0.4, -1.05, 0.1], [-0.4, 1.85, 0.1]]} color={P.amber} dashed opacity={0.7} />
            <Tag position={[-0.4, 2.05, 0.15]} tone="amber" size="xs">{t.top_p} · {t.cutoff}</Tag>
          </>
        )}

        {mode === "engine" && (
          <Drift amount={0.04} speed={0.3}>
            {/* the model is an engine in the harness loop */}
            <Slab position={[0, 0.5, 0]} size={[2.2, 1.3, 0.16]} color={P.violet} fill={0.2} />
            <Tag position={[0, 1.45, 0.15]} tone="violet">{t.model}</Tag>
            {[[-0.55, 0.75], [0, 0.85], [0.55, 0.75], [0, 0.25]].map(([x, y], i) => (
              <Node3D key={i} position={[x, y, 0.15]} color={P.violet} radius={0.09} matte />
            ))}
            {/* template coming in from the loop */}
            <Slab position={[-2.4, 0.5, 0]} size={[1.6, 0.8, 0.12]} color={P.teal} fill={0.18} />
            <Tag position={[-2.4, 1.25, 0.15]} tone="teal" size="xs">{t.template}</Tag>
            <Flow points={[[-1.55, 0.5, 0], [-1.15, 0.5, 0]]} color={P.teal} count={2} size={0.05} />
            {/* next token coming out */}
            <Flow points={[[1.15, 0.5, 0], [2.6, 0.5, 0]]} color={P.amber} count={3} size={0.05} />
            <Node3D position={[2.85, 0.5, 0]} color={P.amber} radius={0.15} pulse={0.3} />
            <Tag position={[2.85, 0.95, 0.15]} tone="amber" size="xs">{t.next_token}</Tag>
            {/* system prompt as the rail above */}
            <Ribbon points={[[-2.6, 1.95, 0], [0, 2.3, 0], [2.6, 1.95, 0]]} color={P.lineStrong} radius={0.02} opacity={0.8} />
            <Tag position={[0, 2.25, 0.15]} tone="muted" size="xs">{t.system}</Tag>
            {/* the loop rail below */}
            <Flow points={[[2.6, -0.75, 0], [0, -1.35, 0], [-2.6, -0.75, 0], [-2.6, 0.1, 0]]} color={P.violet} count={4} size={0.045} />
            <Tag position={[0, -1.75, 0.15]} tone="violet" size="xs">{t.loop}</Tag>
            <Tag position={[0, -0.5, 0.15]} tone="muted" size="xs">{t.seed_notes}</Tag>
          </Drift>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

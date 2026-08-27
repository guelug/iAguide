"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  Halo,
  Motes,
  Node3D,
  PointerTilt,
  Slab,
  Tag,
  Wire,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* The dummy loop: Action until Final Answer, Observation appended by hand,
   max_steps as the seatbelt. */
type Mode = "action" | "final" | "cap";

const COPY = {
  en: {
    the_loop_in_twenty_lines: "the loop in twenty lines",
    action_observation_final_answer: "action, observation, final answer",
    action: "action",
    final: "final answer",
    cap: "max_steps",
    thought: "thought",
    parse: "parses",
    tool_runs: "tool runs",
    append_obs: "append observation",
    exit: "exit",
    no_more_calls: "no more calls",
    third_action: "3rd action",
    would_exceed: "would exceed",
    halt: "halt",
  },
  es: {
    the_loop_in_twenty_lines: "el bucle en veinte líneas",
    action_observation_final_answer: "acción, observación, final answer",
    action: "acción",
    final: "final answer",
    cap: "max_steps",
    thought: "pensamiento",
    parse: "parsea",
    tool_runs: "corre la tool",
    append_obs: "añade observación",
    exit: "sale",
    no_more_calls: "no más llamadas",
    third_action: "3ª acción",
    would_exceed: "se pasaría",
    halt: "alto",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("action");

  return (
    <Figure
      label={t.the_loop_in_twenty_lines}
      hint={t.action_observation_final_answer}
      legend={[
        { color: P.teal, label: "harness" },
        { color: P.amber, label: "tool" },
        { color: P.rose, label: t.cap },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "action", label: t.action, tone: P.teal },
            { value: "final", label: t.final, tone: P.violet },
            { value: "cap", label: t.cap, tone: P.rose },
          ]}
          ariaLabel={t.the_loop_in_twenty_lines}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "action" && (
          <>
            {/* model emits a Thought + Action JSON */}
            <Slab position={[-2.4, 0.85, 0]} size={[1.9, 1.0, 0.12]} color={P.teal} fill={0.16} />
            <Tag position={[-2.4, 1.55, 0.15]} tone="teal">{t.thought}</Tag>
            <Tag position={[-2.4, 0.85, 0.15]} tone="teal" size="xs">{"{ name: search, args: … }"}</Tag>
            {/* harness parses */}
            <Node3D position={[-0.2, 0.85, 0]} color={P.violet} radius={0.15} pulse={0.3} />
            <Tag position={[-0.2, 1.3, 0.15]} tone="violet" size="xs">{t.parse}</Tag>
            {/* tool runs */}
            <Slab position={[2.2, 0.85, 0]} size={[1.6, 0.8, 0.14]} color={P.amber} fill={0.24} />
            <Tag position={[2.2, 1.5, 0.15]} tone="amber">{t.tool_runs}</Tag>
            <Flow points={[[-1.45, 0.85, 0], [-0.45, 0.85, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[0.05, 0.85, 0], [1.35, 0.85, 0]]} color={P.violet} count={3} />
            {/* observation written back into the transcript */}
            <Flow points={[[2.2, 0.45, 0], [0.5, -0.8, 0], [-1.6, -0.6, 0], [-2.4, 0.3, 0]]} color={P.rose} count={4} />
            <Tag position={[0.4, -1.2, 0.15]} tone="rose" size="xs">{t.append_obs}</Tag>
          </>
        )}

        {mode === "final" && (
          <>
            <Slab position={[-2.2, 0.6, 0]} size={[1.9, 1.0, 0.12]} color={P.teal} fill={0.16} />
            <Tag position={[-2.2, 1.3, 0.15]} tone="teal">{t.thought}</Tag>
            <Flow points={[[-1.25, 0.6, 0], [0.2, 0.6, 0]]} color={P.teal} count={3} />
            {/* the Final Answer gate */}
            <Halo position={[0.9, 0.6, 0]} radius={0.55} color={P.violet} opacity={0.7} spin={0.25} />
            <Node3D position={[0.9, 0.6, 0]} color={P.violet} radius={0.16} pulse={0.4} />
            <Tag position={[0.9, 1.35, 0.15]} tone="violet">{t.final}</Tag>
            <Flow points={[[1.5, 0.6, 0], [2.8, 0.6, 0]]} color={P.violet} count={2} />
            <Tag position={[3.0, 0.6, 0.15]} tone="violet" size="xs">{t.exit}</Tag>
            {/* loop rail becomes quiet */}
            <Wire points={[[2.0, -0.4, 0], [0, -1.1, 0], [-2.0, -0.4, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Tag position={[0, -1.5, 0.15]} tone="muted" size="xs">{t.no_more_calls}</Tag>
          </>
        )}

        {mode === "cap" && (
          <>
            {/* steps 1, 2 ok — 3rd would exceed */}
            {[1, 2, 3].map((n) => (
              <group key={n}>
                <Slab
                  position={[-1.8 + (n - 1) * 1.7, 0.5, 0]}
                  size={[1.4, 0.55, 0.12]}
                  color={n < 3 ? P.teal : P.rose}
                  fill={n < 3 ? 0.22 : 0.1}
                />
                <Tag position={[-1.8 + (n - 1) * 1.7, 1.05, 0.15]} tone={n < 3 ? "teal" : "rose"} size="xs">
                  step {n}
                </Tag>
              </group>
            ))}
            <Flow points={[[-1.1, 0.5, 0], [-0.45, 0.5, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[0.6, 0.5, 0], [1.3, 0.5, 0]]} color={P.rose} count={2} size={0.05} />
            <Halo position={[1.9, 0.5, 0]} radius={0.55} color={P.rose} opacity={0.6} spin={0.3} />
            <Tag position={[1.9, 1.25, 0.15]} tone="rose">{t.halt}</Tag>
            <Wire points={[[-2.9, -0.5, 0], [2.9, -0.5, 0]]} color={P.lineStrong} opacity={0.7} />
            <Tag position={[-2.9, -0.95, 0.15]} tone="muted" size="xs">{t.cap} = 2</Tag>
            <Tag position={[1.9, -0.95, 0.15]} tone="rose" size="xs">{t.would_exceed}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

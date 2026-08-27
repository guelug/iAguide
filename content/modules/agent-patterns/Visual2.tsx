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
  Slab,
  Tag,
  Wire,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* The five patterns and the failure mode each one buys. */
type Mode = "plan" | "react" | "sub" | "critic" | "memory";

const COPY = {
  en: {
    five_patterns_: "five patterns",
    each_buys_a_failure_: "each buys a failure",
    plan_and_execute: "plan-and-execute",
    react: "react",
    manager_subagent: "manager / subagent",
    critic: "critic",
    durable_memory: "durable memory",
    plan_: "Plan",
    react_2: "ReAct",
    subagent: "Subagent",
    critic_2: "Critic",
    memory: "Memory",
    stale_plan: "stale plan",
    no_final_answer: "never emits Final Answer",
    double_prefill: "double prefill",
    same_bias_approves: "same bias approves",
    old_memory_as_policy: "old memory as policy",
    execute: "execute",
    observe: "observe",
    replans: "replans",
    noisy_task: "noisy task",
    summary: "summary",
    draft: "draft",
    review: "review",
    rewrite: "rewrite",
    write_confirmed: "write · confirmed",
    read_on_boot: "read on boot",
    date_tagged: "date-tagged",
    failure: "failure",
  },
  es: {
    five_patterns_: "cinco patrones",
    each_buys_a_failure_: "cada uno compra un fallo",
    plan_and_execute: "planificar-y-actuar",
    react: "react",
    manager_subagent: "manager / subagente",
    critic: "crítico",
    durable_memory: "memoria durable",
    plan_: "Plan",
    react_2: "ReAct",
    subagent: "Subagente",
    critic_2: "Crítico",
    memory: "Memoria",
    stale_plan: "plan obsoleto",
    no_final_answer: "nunca emite Final Answer",
    double_prefill: "doble prefill",
    same_bias_approves: "mismo sesgo aprueba",
    old_memory_as_policy: "memoria vieja como política",
    execute: "ejecuta",
    observe: "observa",
    replans: "replanifica",
    noisy_task: "tarea ruidosa",
    summary: "resumen",
    draft: "borrador",
    review: "revisión",
    rewrite: "reescribe",
    write_confirmed: "escribe · confirmado",
    read_on_boot: "lee al arrancar",
    date_tagged: "con fecha",
    failure: "fallo",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("react");

  const fail: Record<Mode, string> = {
    plan: t.stale_plan,
    react: t.no_final_answer,
    sub: t.double_prefill,
    critic: t.same_bias_approves,
    memory: t.old_memory_as_policy,
  };

  return (
    <Figure
      label={t.five_patterns_}
      hint={t.each_buys_a_failure_}
      legend={[
        { color: P.teal, label: t.react_2 },
        { color: P.amber, label: t.subagent },
        { color: P.rose, label: t.failure },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "plan", label: t.plan_, tone: P.muted },
            { value: "react", label: t.react_2, tone: P.teal },
            { value: "sub", label: t.subagent, tone: P.amber },
            { value: "critic", label: t.critic_2, tone: P.violet },
            { value: "memory", label: t.memory, tone: P.teal },
          ]}
          ariaLabel={t.five_patterns_}
        />
      }
    >
      <Stage
        className="h-full w-full"
        camera={{ position: [0, 0.4, 8.2], fov: 38 }}
      >
        <Motes count={120} radius={7} opacity={0.35} />

        {mode === "plan" && (
          <>
            <Slab position={[-2.4, 0.9, 0]} size={[2.4, 0.5, 0.12]} color={P.muted} fill={0.22} />
            <Tag position={[-2.4, 1.4, 0.2]} tone="muted">{t.plan_}</Tag>
            {[-2.9, -2.3, -1.7].map((x, i) => (
              <Node3D key={i} position={[x, 0.9, 0.12]} color={P.muted} radius={0.09} matte />
            ))}
            <Wire points={[[-2.4, 0.55, 0], [-0.2, 0.0, 0]]} color={P.lineStrong} dashed />
            <Slab position={[0.6, -0.25, 0]} size={[2.2, 0.5, 0.12]} color={P.teal} fill={0.2} />
            <Tag position={[0.6, 0.25, 0.2]} tone="teal">{t.execute}</Tag>
            {/* The observation that should have changed the plan — ignored. */}
            <Node3D position={[2.4, -0.25, 0]} color={P.rose} radius={0.16} pulse={0.3} />
            <Tag position={[2.4, 0.35, 0.2]} tone="rose">{t.observe}</Tag>
            <Wire points={[[2.0, -0.25, 0], [1.0, -0.25, 0]]} color={P.rose} dashed opacity={0.5} />
            <Halo position={[2.4, -0.25, 0]} radius={0.4} color={P.rose} opacity={0.5} spin={0.4} />
            <Tag position={[0, -1.3, 0.2]} tone="rose">{t.stale_plan}</Tag>
          </>
        )}

        {mode === "react" && (
          <>
            <Drift amount={0.05} speed={0.3}>
              {[
                [-2.3, 0.75, t.plan_, P.teal],
                [0, 0.75, t.execute, P.amber],
                [2.3, 0.75, t.observe, P.violet],
              ].map(([x, y, lab, col], i) => (
                <group key={i}>
                  <Node3D
                    position={[x as number, y as number, 0]}
                    color={col as string}
                    radius={0.19}
                    pulse={i * 0.5}
                  />
                  <Tag position={[x as number, (y as number) + 0.45, 0.2]} tone={i === 0 ? "teal" : i === 1 ? "amber" : "violet"}>
                    {lab as string}
                  </Tag>
                </group>
              ))}
              <Flow
                points={[[-2.3, 0.75, 0], [0, 0.75, 0], [2.3, 0.75, 0], [2.3, -0.9, 0], [-2.3, -0.9, 0], [-2.3, 0.75, 0]]}
                color={P.teal}
                count={6}
              />
            </Drift>
            <Tag position={[0, -1.35, 0.2]} tone="muted">{t.replans}</Tag>
          </>
        )}

        {mode === "sub" && (
          <>
            <Node3D position={[-2.2, 0.8, 0]} color={P.teal} radius={0.22} pulse={0.2} />
            <Tag position={[-2.2, 1.35, 0.2]} tone="teal">manager</Tag>
            <Flow points={[[-2.0, 0.45, 0], [-0.2, -0.2, 0], [1.4, -0.5, 0]]} color={P.amber} count={3} />
            <Slab position={[2.2, -0.5, 0]} size={[1.7, 1.5, 0.14]} color={P.amber} fill={0.16} />
            <Node3D position={[2.2, -0.3, 0.1]} color={P.amber} radius={0.16} pulse={0.5} />
            <Tag position={[2.2, 0.55, 0.2]} tone="amber">{t.noisy_task}</Tag>
            <Flow points={[[1.7, -0.2, 0], [0.2, 0.35, 0], [-1.9, 0.65, 0]]} color={P.violet} count={2} size={0.045} />
            <Tag position={[0, 0.0, 0.2]} tone="violet" size="xs">{t.summary}</Tag>
            <Tag position={[0, -1.4, 0.2]} tone="rose">{t.double_prefill}</Tag>
          </>
        )}

        {mode === "critic" && (
          <>
            <Node3D position={[-2.2, 0.7, 0]} color={P.teal} radius={0.2} pulse={0.2} />
            <Tag position={[-2.2, 1.25, 0.2]} tone="teal">{t.draft}</Tag>
            <Flow points={[[-1.95, 0.7, 0], [0, 0.7, 0]]} color={P.teal} count={3} />
            <Node3D position={[0.6, 0.7, 0]} color={P.violet} radius={0.2} pulse={0.4} />
            <Tag position={[0.6, 1.25, 0.2]} tone="violet">{t.review}</Tag>
            <Flow points={[[0.4, 0.4, 0], [-1.6, -0.3, 0], [-2.2, 0.35, 0]]} color={P.rose} count={2} />
            <Tag position={[-0.7, -0.55, 0.2]} tone="rose" size="xs">{t.rewrite}</Tag>
            {/* same-bias mirror: the approving halo */}
            <Halo position={[2.4, 0.7, 0]} radius={0.45} color={P.rose} opacity={0.45} spin={0.3} />
            <Node3D position={[2.4, 0.7, 0]} color={P.violet} radius={0.12} matte />
            <Tag position={[2.4, -0.1, 0.2]} tone="rose">{t.same_bias_approves}</Tag>
          </>
        )}

        {mode === "memory" && (
          <>
            <Slab position={[-2.2, 0.5, 0]} size={[1.9, 2.1, 0.14]} color={P.teal} fill={0.14} />
            <Tag position={[-2.2, 1.9, 0.2]} tone="teal">MEMORY.md</Tag>
            {[
              [0.95, t.date_tagged, P.teal],
              [0.35, "—", P.muted],
              [-0.25, "…", P.lineStrong],
            ].map(([y, lab, col], i) => (
              <group key={i}>
                <Node3D position={[-2.2, y as number, 0.12]} color={col as string} radius={0.1} matte />
                <Tag position={[-1.15, y as number, 0.15]} tone="muted" size="xs">{lab as string}</Tag>
              </group>
            ))}
            <Flow points={[[-1.2, 0.5, 0], [0.4, 0.5, 0]]} color={P.teal} count={3} />
            <Node3D position={[1.2, 0.5, 0]} color={P.amber} radius={0.2} pulse={0.3} />
            <Tag position={[1.2, 1.05, 0.2]} tone="amber">{t.read_on_boot}</Tag>
            {/* the wrong path: memory acting as system policy */}
            <Flow points={[[-1.3, -0.5, 0], [0.5, -1.0, 0], [2.3, -1.0, 0]]} color={P.rose} count={3} />
            <Node3D position={[2.3, -1.0, 0]} color={P.rose} radius={0.15} pulse={0.6} />
            <Tag position={[2.3, -0.35, 0.2]} tone="rose" size="xs">{t.old_memory_as_policy}</Tag>
            <Tag position={[1.2, -0.05, 0.2]} tone="teal" size="xs">{t.write_confirmed}</Tag>
          </>
        )}
      </Stage>
    </Figure>
  );
}

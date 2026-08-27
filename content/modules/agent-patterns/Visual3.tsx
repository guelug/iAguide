"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Three signals that a while-loop is not enough. */
type Mode = "approval" | "branch" | "state";

const COPY = {
  en: {
    when_a_while_isnt_enough: "when a while isn't enough",
    three_signals: "three signals",
    human_approval: "human approval",
    real_branches: "real branches",
    state_across_turns: "state across turns",
    approval_: "Approval",
    branches: "Branches",
    state: "State",
    draft_changes: "draft changes",
    waits_for_yes: "waits for legal",
    approve: "approve",
    reject: "reject",
    tool_a: "tool a",
    tool_b: "tool b",
    escalate: "escalate",
    turn_n: "turn n",
    turn_n_1: "turn n+1",
    checkpoint: "checkpoint",
    replay: "replay",
    graph_is_ceremony: "graph = ceremony",
    graph_is_product: "graph = product",
  },
  es: {
    when_a_while_isnt_enough: "cuando un while no basta",
    three_signals: "tres señales",
    human_approval: "aprobación humana",
    real_branches: "branches reales",
    state_across_turns: "estado entre turnos",
    approval_: "Aprobación",
    branches: "Branches",
    state: "Estado",
    draft_changes: "redacta cambios",
    waits_for_yes: "espera a legal",
    approve: "aprueba",
    reject: "rechaza",
    tool_a: "tool a",
    tool_b: "tool b",
    escalate: "escala",
    turn_n: "turno n",
    turn_n_1: "turno n+1",
    checkpoint: "checkpoint",
    replay: "replay",
    graph_is_ceremony: "grafo = ceremonia",
    graph_is_product: "grafo = producto",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("approval");

  return (
    <Figure
      label={t.when_a_while_isnt_enough}
      hint={t.three_signals}
      legend={[
        { color: P.teal, label: t.graph_is_product },
        { color: P.muted, label: t.graph_is_ceremony },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "approval", label: t.approval_, tone: P.amber },
            { value: "branch", label: t.branches, tone: P.teal },
            { value: "state", label: t.state, tone: P.violet },
          ]}
          ariaLabel={t.three_signals}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.5, 8.4], fov: 38 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.08}>

        {mode === "approval" && (
          <>
            <Node3D position={[-2.5, 0.6, 0]} color={P.teal} radius={0.2} pulse={0.2} />
            <Tag position={[-2.5, 1.15, 0.2]} tone="teal">{t.draft_changes}</Tag>
            <Flow points={[[-2.25, 0.6, 0], [-0.4, 0.6, 0]]} color={P.teal} count={3} />
            {/* the approval gate: a ring the flow has to pass through */}
            <Halo position={[0.3, 0.6, 0]} radius={0.5} color={P.amber} opacity={0.7} spin={0.25} />
            <Node3D position={[0.3, 0.6, 0]} color={P.amber} radius={0.13} pulse={0.5} />
            <Tag position={[0.3, 1.35, 0.2]} tone="amber">{t.waits_for_yes}</Tag>
            <Flow points={[[0.3, 0.1, 0], [2.4, -0.6, 0]]} color={P.teal} count={2} />
            <Tag position={[2.4, -1.1, 0.2]} tone="teal" size="xs">{t.approve}</Tag>
            <Wire points={[[0.3, 1.1, 0], [2.4, 1.3, 0]]} color={P.rose} dashed opacity={0.6} />
            <Tag position={[2.4, 1.7, 0.2]} tone="rose" size="xs">{t.reject}</Tag>
          </>
        )}

        {mode === "branch" && (
          <>
            <Node3D position={[-2.6, 0.7, 0]} color={P.teal} radius={0.18} pulse={0.2} />
            <Tag position={[-2.6, 1.2, 0.2]} tone="teal">{t.tool_a}</Tag>
            <Flow points={[[-2.35, 0.5, 0], [-0.6, 0.0, 0]]} color={P.teal} count={2} />
            {/* decision diamond */}
            <Node3D position={[-0.3, -0.1, 0]} color={P.amber} radius={0.15} faceted pulse={0.4} />
            <Wire points={[[-0.3, -0.1, 0], [1.2, 0.8, 0]]} color={P.teal} />
            <Wire points={[[-0.3, -0.1, 0], [1.2, -0.8, 0]]} color={P.violet} />
            <Node3D position={[1.7, 0.85, 0]} color={P.teal} radius={0.16} />
            <Tag position={[1.7, 1.35, 0.2]} tone="teal" size="xs">{t.tool_b}</Tag>
            <Slab position={[1.7, -0.85, 0]} size={[1.5, 0.5, 0.12]} color={P.rose} fill={0.2} />
            <Tag position={[1.7, -1.35, 0.2]} tone="rose" size="xs">{t.escalate}</Tag>
            <Flow points={[[1.9, 0.65, 0], [2.5, -0.45, 0]]} color={P.violet} count={2} size={0.045} />
          </>
        )}

        {mode === "state" && (
          <>
            <Slab position={[-1.9, 0.35, 0]} size={[1.8, 1.3, 0.14]} color={P.teal} fill={0.16} />
            <Tag position={[-1.9, 1.35, 0.2]} tone="teal">{t.turn_n}</Tag>
            <Slab position={[1.9, 0.35, 0]} size={[1.8, 1.3, 0.14]} color={P.violet} fill={0.16} />
            <Tag position={[1.9, 1.35, 0.2]} tone="violet">{t.turn_n_1}</Tag>
            <Flow points={[[-1.0, 0.35, 0], [0.3, 0.35, 0]]} color={P.violet} count={3} size={0.05} />
            {/* the checkpoint store underneath both turns */}
            <Slab position={[0, -1.0, 0]} size={[4.6, 0.45, 0.12]} color={P.violet} fill={0.12} />
            <Tag position={[0, -1.55, 0.2]} tone="violet">{t.checkpoint}</Tag>
            <Wire points={[[-1.4, -0.75, 0], [-1.7, -0.3, 0]]} color={P.violet} dashed opacity={0.6} />
            <Wire points={[[1.4, -0.75, 0], [1.7, -0.3, 0]]} color={P.violet} dashed opacity={0.6} />
            <Tag position={[0, -0.35, 0.2]} tone="muted" size="xs">{t.replay}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

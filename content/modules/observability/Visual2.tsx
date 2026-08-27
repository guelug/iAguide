"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Drift, Flow, Lattice, Motes, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* The unit's loop: offline eval, deploy, monitor online, failures come back. */
type Mode = "loop" | "trophy";

const COPY = {
  en: {
    offline_then_online_: "offline, then online",
    failures_return_to_the_set: "failures return to the set",
    eval_loop: "eval loop",
    trophy_set: "trophy set",
    offline_set: "offline set",
    deploy: "deploy",
    monitor_online: "monitor online",
    collect_failures: "collect failures",
    frozen_at_launch: "frozen at launch",
    real_queries: "real queries",
    drift: "drift",
    a_trophy_not_a_test: "a trophy, not a test",
  },
  es: {
    offline_then_online_: "offline antes, online después",
    failures_return_to_the_set: "los fallos vuelven al set",
    eval_loop: "bucle de eval",
    trophy_set: "set trofeo",
    offline_set: "set offline",
    deploy: "despliega",
    monitor_online: "monitorea online",
    collect_failures: "recoge fallos",
    frozen_at_launch: "congelado en el lanzamiento",
    real_queries: "consultas reales",
    drift: "deriva",
    a_trophy_not_a_test: "un trofeo, no un test",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("loop");

  const goldCells = Array.from({ length: 10 }, (_, i) => ({
    position: [-1.4 + (i % 5) * 0.7, 0.95 + Math.floor(i / 5) * 0.55, 0] as [number, number, number],
    color: P.teal,
  }));

  return (
    <Figure
      label={t.offline_then_online_}
      hint={t.failures_return_to_the_set}
      legend={[
        { color: P.teal, label: t.offline_set },
        { color: P.violet, label: t.monitor_online },
        { color: P.rose, label: t.collect_failures },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "loop", label: t.eval_loop, tone: P.teal },
            { value: "trophy", label: t.trophy_set, tone: P.rose },
          ]}
          ariaLabel={t.offline_then_online_}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={120} radius={7} opacity={0.3} />
        {mode === "loop" ? (
          <Drift amount={0.04} speed={0.3}>
            {/* gold rows in the offline set */}
            <Lattice cells={goldCells} size={0.16} opacity={0.9} />
            <Tag position={[0, 1.85, 0.2]} tone="teal">{t.offline_set}</Tag>
            {/* deploy */}
            <Node3D position={[-2.6, -0.15, 0]} color={P.amber} radius={0.18} pulse={0.3} />
            <Tag position={[-2.6, 0.4, 0.2]} tone="amber">{t.deploy}</Tag>
            {/* online monitoring */}
            <Slab position={[2.5, -0.15, 0]} size={[1.9, 1.0, 0.14]} color={P.violet} fill={0.16} />
            <Tag position={[2.5, 0.75, 0.2]} tone="violet">{t.monitor_online}</Tag>
            {[[2.2, -0.3], [2.5, 0.0], [2.8, -0.35]].map(([x, y], i) => (
              <Node3D key={i} position={[x, y, 0.1]} color={P.violet} radius={0.09} matte />
            ))}
            {/* the return edge — the product */}
            <Flow
              points={[[2.5, -0.7, 0], [0.4, -1.35, 0], [-1.4, -1.1, 0], [-1.4, 0.6, 0]]}
              color={P.rose}
              count={4}
            />
            <Tag position={[0.3, -1.75, 0.2]} tone="rose">{t.collect_failures}</Tag>
            <Flow points={[[-1.6, 0.6, 0], [-2.6, 0.15, 0]]} color={P.teal} count={2} size={0.045} />
            <Flow points={[[-2.35, -0.15, 0], [1.5, -0.15, 0]]} color={P.violet} count={3} />
          </Drift>
        ) : (
          <>
            {/* frozen set */}
            <Lattice cells={goldCells} size={0.16} opacity={0.95} matte />
            <Tag position={[0, 1.85, 0.2]} tone="teal">{t.frozen_at_launch}</Tag>
            <Wire points={[[-1.8, 0.55, 0], [1.8, 0.55, 0]]} color={P.lineStrong} dashed opacity={0.7} />
            {/* live traffic diverging below — never fed back */}
            {Array.from({ length: 7 }, (_, i) => (
              <Node3D
                key={i}
                position={[-2.4 + i * 0.8, -1.0 + Math.sin(i * 1.7) * 0.35, 0]}
                color={i % 3 === 2 ? P.rose : P.muted}
                radius={0.09}
                matte
              />
            ))}
            <Tag position={[0, -1.7, 0.2]} tone="muted" size="xs">{t.real_queries}</Tag>
            <Tag position={[2.6, -0.45, 0.2]} tone="rose" size="xs">{t.drift}</Tag>
            <Tag position={[0, -0.35, 0.2]} tone="rose">{t.a_trophy_not_a_test}</Tag>
          </>
        )}
      </Stage>
    </Figure>
  );
}

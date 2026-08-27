"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* reinforcement-learning: trajectory ribbon, advantage bars on log-probs, PPO clip. */
type Mode = "trajectory" | "advantage" | "clip";

const COPY = {
  en: {
    rl_is_trial_error_learned: "rl is trial-and-error learned",
    trajectory_advantage_clip: "trajectory · advantage · clip",
    trajectory: "trajectory",
    advantage: "advantage",
    clip: "clip",
    agent: "agent",
    env: "env",
    reward: "reward",
    good: "good",
    bad: "bad",
    ratio: "ratio",
    clipped: "clipped",
  },
  es: {
    rl_is_trial_error_learned: "rl es prueba y error aprendido",
    trajectory_advantage_clip: "trayectoria · ventaja · clip",
    trajectory: "trayectoria",
    advantage: "ventaja",
    clip: "clip",
    agent: "agente",
    env: "entorno",
    reward: "recompensa",
    good: "bueno",
    bad: "malo",
    ratio: "ratio",
    clipped: "recortado",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("trajectory");

  return (
    <Figure
      label={t.rl_is_trial_error_learned}
      hint={t.trajectory_advantage_clip}
      legend={[
        { color: P.teal, label: t.agent },
        { color: P.violet, label: t.env },
        { color: P.amber, label: t.reward },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "trajectory", label: t.trajectory, tone: P.teal },
            { value: "advantage", label: t.advantage, tone: P.violet },
            { value: "clip", label: t.clip, tone: P.amber },
          ]}
          ariaLabel={t.rl_is_trial_error_learned}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "trajectory" && (
          <>
            {/* agent, env, reward ribbons */}
            <Halo position={[-1.9, 0.6, 0]} radius={0.55} color={P.teal} opacity={0.55} spin={0.2} />
            <Node3D position={[-1.9, 0.6, 0]} color={P.teal} radius={0.2} pulse={0.3} />
            <Tag position={[-1.9, 1.2, 0.15]} tone="teal">{t.agent}</Tag>

            <Slab position={[1.9, 0.6, 0]} size={[1.8, 1.4, 0.14]} color={P.violet} fill={0.2} rim={0.7} />
            <Tag position={[1.9, 1.5, 0.15]} tone="violet">{t.env}</Tag>

            <Ribbon points={[[-1.4, 0.85, 0], [0.5, 0.85, 0]]} color={P.teal} radius={0.04} opacity={0.85} />
            <Tag position={[-0.5, 1.2, 0.15]} tone="teal" size="xs">action</Tag>
            <Ribbon points={[[0.5, 0.35, 0], [-1.4, 0.35, 0]]} color={P.amber} radius={0.04} opacity={0.85} />
            <Tag position={[-0.5, -0.05, 0.15]} tone="amber" size="xs">{t.reward}</Tag>

            {/* trajectory trace */}
            <Ribbon
              points={[[-1.9, -0.3, 0], [-0.9, -0.9, 0], [0.5, -0.5, 0], [1.9, -0.9, 0]]}
              color={P.lineStrong}
              radius={0.02}
              opacity={0.6}
            />
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">{t.trajectory}</Tag>
          </>
        )}

        {mode === "advantage" && (
          <>
            {/* log-prob bars multiplied by ± advantage bars */}
            {[0, 1, 2].map((i) => (
              <group key={i} position={[-1.8 + i * 1.8, 0.0, 0]}>
                {/* log prob */}
                <Slab position={[0, 0.55, 0]} size={[0.4, 1.0, 0.1]} color={P.teal} fill={0.3} />
                <Tag position={[0, 1.2, 0.15]} tone="teal" size="xs">log p</Tag>
                {/* advantage */}
                <Slab
                  position={[0.7, i === 1 ? 0.35 : 0.55, 0]}
                  size={[0.4, i === 1 ? -0.4 : 0.6, 0.1]}
                  color={i === 1 ? P.rose : P.amber}
                  fill={0.4}
                />
                <Tag
                  position={[0.7, 1.0, 0.15]}
                  tone={i === 1 ? "rose" : "amber"}
                  size="xs"
                >
                  {i === 1 ? "A<0" : i === 0 ? "A=0" : "A>0"}
                </Tag>
                {/* result */}
                <Slab
                  position={[1.4, i === 1 ? 0.3 : 0.55, 0]}
                  size={[0.45, i === 1 ? 0.05 : 0.85, 0.12]}
                  color={i === 1 ? P.rose : P.teal}
                  fill={0.5}
                />
              </group>
            ))}
            <Wire points={[[-2.6, -0.25, 0], [2.8, -0.25, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[-2.6, -0.6, 0.15]} tone="teal" size="xs">{t.good}</Tag>
            <Tag position={[2.6, -0.6, 0.15]} tone="rose" size="xs">{t.bad}</Tag>
            <Tag position={[0, 1.85, 0.15]} tone="muted" size="xs">grad ≈ E[A · ∇ log π]</Tag>
          </>
        )}

        {mode === "clip" && (
          <>
            {/* ratio axis with the hatched clip band */}
            <Wire points={[[-2.7, -0.5, 0], [2.7, -0.5, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[2.6, -0.85, 0.15]} tone="muted" size="xs">{t.ratio} →</Tag>
            {/* 0.2 and 1.8 markers */}
            <Wire points={[[-1.4, -0.5, 0], [-1.4, 1.5, 0]]} color={P.rose} dashed opacity={0.7} />
            <Tag position={[-1.4, 1.85, 0.15]} tone="rose" size="xs">1 - ε</Tag>
            <Wire points={[[1.4, -0.5, 0], [1.4, 1.5, 0]]} color={P.rose} dashed opacity={0.7} />
            <Tag position={[1.4, 1.85, 0.15]} tone="rose" size="xs">1 + ε</Tag>
            {/* hatched clipped band */}
            <Lattice
              cells={Array.from({ length: 12 }, (_, i) => ({
                position: [-2.5 + (i % 6) * 0.6, 0.4 - Math.floor(i / 6) * 0.45, 0] as [number, number, number],
                color: P.amber,
              }))}
              size={0.18}
              opacity={0.9}
              matte
            />
            <Halo position={[0, 0.0, 0]} radius={1.6} color={P.amber} opacity={0.32} spin={0.1} />
            <Tag position={[0, 2.2, 0.15]} tone="amber">{t.clip}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

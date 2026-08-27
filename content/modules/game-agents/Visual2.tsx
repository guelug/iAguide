"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Game agents: perceive-decide-act in a frame budget; RL loop; the capture tax. */
type Mode = "pda" | "rl" | "budget";

const COPY = {
  en: {
    the_frame_is_the_clock: "the frame is the clock",
    perceive_decide_act_reward_budget: "perceive, decide, act · reward · budget",
    pda: "perceive·act",
    rl: "rl loop",
    budget: "budget",
    perceive: "perceive",
    decide: "decide",
    act: "act",
    env: "env",
    reward: "reward",
    frame_ms: "frame · 16ms",
    capture: "capture",
    think: "think",
    act_left: "act left",
  },
  es: {
    the_frame_is_the_clock: "el frame es el reloj",
    perceive_decide_act_reward_budget: "percibe, decide, actúa · recompensa · presupuesto",
    pda: "percibe·actúa",
    rl: "bucle rl",
    budget: "presupuesto",
    perceive: "percibe",
    decide: "decide",
    act: "actúa",
    env: "entorno",
    reward: "recompensa",
    frame_ms: "frame · 16ms",
    capture: "captura",
    think: "piensa",
    act_left: "queda actuar",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("pda");

  return (
    <Figure
      label={t.the_frame_is_the_clock}
      hint={t.perceive_decide_act_reward_budget}
      legend={[
        { color: P.teal, label: t.perceive },
        { color: P.violet, label: t.decide },
        { color: P.amber, label: t.act },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "pda", label: t.pda, tone: P.teal },
            { value: "rl", label: t.rl, tone: P.violet },
            { value: "budget", label: t.budget, tone: P.amber },
          ]}
          ariaLabel={t.the_frame_is_the_clock}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "pda" && (
          <>
            {/* screen → model → action → screen */}
            <Slab position={[-2.4, 0.55, 0]} size={[1.8, 1.4, 0.14]} color={P.teal} fill={0.16} />
            <Tag position={[-2.4, 1.45, 0.15]} tone="teal">{t.perceive}</Tag>
            <Flow points={[[-1.45, 0.55, 0], [-0.8, 0.55, 0]]} color={P.teal} count={2} size={0.05} />
            <Node3D position={[0, 0.55, 0]} color={P.violet} radius={0.2} pulse={0.3} />
            <Tag position={[0, 1.0, 0.15]} tone="violet">{t.decide}</Tag>
            <Flow points={[[0.3, 0.55, 0], [1.3, 0.55, 0]]} color={P.amber} count={2} />
            <Slab position={[2.2, 0.55, 0]} size={[1.4, 0.9, 0.12]} color={P.amber} fill={0.22} />
            <Tag position={[2.2, 1.2, 0.15]} tone="amber">{t.act}</Tag>
            {/* action feeds back to the next frame */}
            <Ribbon points={[[2.2, 0.05, 0], [0, -1.1, 0], [-2.4, 0.0, 0]]} color={P.lineStrong} radius={0.02} opacity={0.6} />
            <Tag position={[0, -1.5, 0.15]} tone="muted" size="xs">{t.frame_ms}</Tag>
          </>
        )}

        {mode === "rl" && (
          <>
            <Halo position={[-1.5, 0.5, 0]} radius={0.6} color={P.violet} opacity={0.5} spin={0.2} />
            <Node3D position={[-1.5, 0.5, 0]} color={P.violet} radius={0.2} pulse={0.3} />
            <Tag position={[-1.5, 1.3, 0.15]} tone="violet" size="xs">policy</Tag>
            <Slab position={[1.5, 0.5, 0]} size={[1.8, 1.4, 0.14]} color={P.teal} fill={0.16} />
            <Tag position={[1.5, 1.45, 0.15]} tone="teal">{t.env}</Tag>
            {/* action out, reward back */}
            <Flow points={[[-1.0, 0.75, 0], [0.6, 0.75, 0]]} color={P.teal} count={3} />
            <Tag position={[-0.2, 1.05, 0.15]} tone="muted" size="xs">action</Tag>
            <Flow points={[[0.6, 0.25, 0], [-1.0, 0.25, 0]]} color={P.amber} count={3} />
            <Tag position={[-0.2, -0.1, 0.15]} tone="amber" size="xs">{t.reward}</Tag>
            {/* gradient ribbon updates policy */}
            <Ribbon points={[[-1.5, -0.15, 0], [-1.5, -1.0, 0], [-0.4, -1.0, 0]]} color={P.violet} radius={0.02} opacity={0.7} />
            <Tag position={[-1.6, -1.35, 0.15]} tone="violet" size="xs">∇ update</Tag>
          </>
        )}

        {mode === "budget" && (
          <>
            {/* a 16ms budget gauge split into capture / think / act */}
            <Slab position={[-1.5, 0.5, 0]} size={[2.0, 0.85, 0.14]} color={P.rose} fill={0.4} />
            <Slab position={[-0.2, 0.5, 0]} size={[0.85, 0.85, 0.14]} color={P.violet} fill={0.3} />
            <Slab position={[1.0, 0.5, 0]} size={[1.6, 0.85, 0.14]} color={P.teal} fill={0.24} />
            <Tag position={[-1.9, 1.25, 0.15]} tone="rose" size="xs">{t.capture} ~9ms</Tag>
            <Tag position={[-0.2, 1.25, 0.15]} tone="violet" size="xs">{t.think} 3ms</Tag>
            <Tag position={[1.4, 1.25, 0.15]} tone="teal" size="xs">{t.act_left} 4ms</Tag>
            <Wire points={[[-2.6, 0.05, 0], [2.2, 0.05, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[0, -0.4, 0.15]} tone="muted" size="xs">{t.frame_ms}</Tag>
            {/* the capture loop that eats the budget */}
            <Flow points={[[-1.5, -0.35, 0], [-1.5, -1.3, 0]]} color={P.rose} count={3} size={0.05} />
            <Tag position={[-1.5, -1.7, 0.15]} tone="rose" size="xs">{t.capture} loop</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

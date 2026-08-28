"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* agent-loop: while read→decide→act→observe; interrupt cuts; final-answer halo. */
type Mode = "while" | "interrupt" | "stop";

const COPY = {
  en: {
    the_loop_is_the_brain: "the loop is the brain",
    while_interrupt_final: "while · interrupt · final",
    while_mode: "while",
    interrupt: "interrupt",
    stop: "final",
    read: "read",
    decide: "decide",
    act: "act",
    observe: "observe",
    max_steps: "max steps",
    final_answer: "final answer",
  },
  es: {
    the_loop_is_the_brain: "el bucle es el cerebro",
    while_interrupt_final: "mientras · interrumpe · final",
    while_mode: "mientras",
    interrupt: "interrumpe",
    stop: "final",
    read: "lee",
    decide: "decide",
    act: "actúa",
    observe: "observa",
    max_steps: "max steps",
    final_answer: "respuesta final",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("while");

  return (
    <Figure
      label={t.the_loop_is_the_brain}
      hint={t.while_interrupt_final}
      legend={[
        { color: P.teal, label: t.while_mode },
        { color: P.rose, label: t.interrupt },
        { color: P.amber, label: t.stop },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "while", label: t.while_mode, tone: P.teal },
            { value: "interrupt", label: t.interrupt, tone: P.rose },
            { value: "stop", label: t.stop, tone: P.amber },
          ]}
          ariaLabel={t.the_loop_is_the_brain}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "while" && (
          <>
            {/* the four verbs as a rotating ring */}
            {[t.read, t.decide, t.act, t.observe].map((verb, i) => {
              const a = (i / 4) * Math.PI * 2;
              const x = Math.cos(a) * 1.4;
              const y = 0.4 + Math.sin(a) * 1.4;
              const tones = ["teal", "violet", "amber", "teal"] as const;
              const colors = [P.teal, P.violet, P.amber, P.teal];
              return (
                <group key={verb}>
                  <Node3D position={[x, y, 0]} color={colors[i]} radius={0.2} pulse={i * 0.25} />
                  <Tag position={[x, y + 0.35, 0.15]} tone={tones[i]} size="xs">{verb}</Tag>
                </group>
              );
            })}
            {/* arrows around */}
            {[0, 1, 2, 3].map((i) => {
              const a1 = (i / 4) * Math.PI * 2 + 0.55;
              const a2 = ((i + 1) / 4) * Math.PI * 2 - 0.55;
              return (
                <Ribbon
                  key={i}
                  points={[
                    [Math.cos(a1) * 1.4, 0.4 + Math.sin(a1) * 1.4, 0],
                    [Math.cos(a2) * 1.4, 0.4 + Math.sin(a2) * 1.4, 0],
                  ]}
                  color={P.lineStrong}
                  radius={0.02}
                  opacity={0.6}
                />
              );
            })}
            <Halo position={[0, 0.4, 0]} radius={1.75} color={P.teal} opacity={0.25} spin={0.08} />
          </>
        )}

        {mode === "interrupt" && (
          <>
            {/* the loop running with a rose ribbon slicing through */}
            {[t.read, t.decide, t.act, t.observe].map((verb, i) => {
              const a = (i / 4) * Math.PI * 2;
              return (
                <Node3D
                  key={verb}
                  position={[Math.cos(a) * 1.4, 0.4 + Math.sin(a) * 1.4, 0]}
                  color={P.violet}
                  radius={0.18}
                  matte
                />
              );
            })}
            <Ribbon
              points={[[-2.5, -0.6, 0], [0, 0.4, 0], [2.5, 1.2, 0]]}
              color={P.rose}
              radius={0.05}
              opacity={0.95}
            />
            <Slab position={[2.6, 1.3, 0]} size={[1.6, 0.5, 0.1]} color={P.rose} fill={0.3} />
            <Tag position={[2.6, 1.75, 0.15]} tone="rose" size="xs">{t.interrupt}</Tag>
            <Tag position={[0, -1.5, 0.15]} tone="muted" size="xs">user pressed stop · ctrl+c</Tag>
          </>
        )}

        {mode === "stop" && (
          <>
            <Halo position={[0, 0.4, 0]} radius={1.0} color={P.amber} opacity={0.7} spin={0.3} />
            <Node3D position={[0, 0.4, 0]} color={P.amber} radius={0.25} pulse={0.4} />
            <Tag position={[0, 1.6, 0.15]} tone="amber">{t.final_answer}</Tag>
            {/* the loop has faded behind */}
            {[0, 1, 2, 3].map((i) => {
              const a = (i / 4) * Math.PI * 2;
              return (
                <Node3D
                  key={i}
                  position={[Math.cos(a) * 2.4, 0.4 + Math.sin(a) * 2.4, 0]}
                  color={P.muted}
                  radius={0.1}
                  matte
                />
              );
            })}
            <Tag position={[0, -1.35, 0.15]} tone="muted" size="xs">loop done</Tag>
            <Ribbon points={[[0, -1.55, 0], [0, -2.2, 0]]} color={P.amber} radius={0.04} opacity={0.7} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

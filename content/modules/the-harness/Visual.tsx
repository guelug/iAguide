"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "loop" | "tools" | "sub";

export default function Visual() {
  const t = useCopy({
    en: {
      "the_loop_around_the_weights": "the loop around the weights",
      "pulse_is_a_turn_not_a_second_brain": "pulse is a turn, not a second brain",
      "subagent": "subagent",
      "loop": "Loop",
      "subagent_2": "Subagent"
    },
    es: {
      "the_loop_around_the_weights": "el bucle alrededor de los pesos",
      "pulse_is_a_turn_not_a_second_brain": "el pulso es un turno, no un segundo cerebro",
      "subagent": "subagente",
      "loop": "Bucle",
      "subagent_2": "Subagente"
    },
  });
  const [mode, setMode] = useState<Mode>("loop");
  return (
    <Figure
      label={t.the_loop_around_the_weights}
      hint={t.pulse_is_a_turn_not_a_second_brain}
      legend={[
          { color: P.teal, label: "loop" },
          { color: P.amber, label: "tools" },
          { color: P.violet, label: t.subagent }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "loop", label: t.loop, tone: P.teal },
            { value: "tools", label: "Tools", tone: P.amber },
            { value: "sub", label: t.subagent_2, tone: P.violet }
          ]}
          ariaLabel={t.pulse_is_a_turn_not_a_second_brain}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        {[
          ["user", -2.5, 1.0, "teal"],
          ["thread", -0.8, 1.0, "teal"],
          ["model", 0.9, 1.0, "amber"],
          ["tools", 2.5, 1.0, "amber"],
          ["sub", 2.5, -0.9, "violet"],
          ["cache", 0.9, -0.9, "muted"],
          ["compact", -0.8, -0.9, "muted"],
        ].map(([id, x, y, tone]) => (
          <group key={id as string}>
            <Node3D position={[x as number, y as number, 0]} color={tone === "amber" ? P.amber : tone === "violet" ? P.violet : tone === "muted" ? P.lineStrong : P.teal} radius={0.16} pulse={id === (mode === "tools" ? "tools" : mode === "sub" ? "sub" : "model") ? 0.35 : 0} />
            <Tag position={[x as number, (y as number) + (y as number > 0 ? 0.4 : -0.4), 0.2]} tone={tone === "amber" ? "amber" : tone === "violet" ? "violet" : "teal"} size="xs">{id as string}</Tag>
          </group>
        ))}
        <Flow points={[[-2.5, 1, 0], [-0.8, 1, 0], [0.9, 1, 0], [2.5, 1, 0], [2.5, -0.9, 0], [0.9, -0.9, 0], [-0.8, -0.9, 0], [-0.8, 1, 0]]} color={mode === "sub" ? P.violet : mode === "tools" ? P.amber : P.teal} count={5} />
    
      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "state" | "act" | "illegal";

export default function Visual() {
  const t = useCopy({
    en: {
      "state_legal_actions": "state · legal actions",
      "the_engine_is_the_rules_the_llm_is_not": "the engine is the rules; the LLM is not",
      "state": "state",
      "actions": "actions",
      "forbidden_move": "forbidden move",
      "state_2": "State",
      "actions_2": "Actions",
      "forbidden_move_2": "Forbidden move"
    },
    es: {
      "state_legal_actions": "estado · acciones legales",
      "the_engine_is_the_rules_the_llm_is_not": "el motor son las reglas; el LLM no",
      "state": "estado",
      "actions": "acciones",
      "forbidden_move": "jugada prohibida",
      "state_2": "Estado",
      "actions_2": "Acciones",
      "forbidden_move_2": "Jugada prohibida"
    },
  });
  const [mode, setMode] = useState<Mode>("state");
  return (
    <Figure
      label={t.state_legal_actions}
      hint={t.the_engine_is_the_rules_the_llm_is_not}
      legend={[
          { color: P.teal, label: t.state },
          { color: P.amber, label: t.actions },
          { color: P.rose, label: t.forbidden_move }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "state", label: t.state_2, tone: P.teal },
            { value: "act", label: t.actions_2, tone: P.amber },
            { value: "illegal", label: t.forbidden_move_2, tone: P.rose }
          ]}
          ariaLabel={t.the_engine_is_the_rules_the_llm_is_not}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.1, 0.3, 0]} size={[2.1, 1.8, 0.12]} color={P.teal} fill={0.24} />
        <Tag position={[-2.1, 1.35, 0.2]} tone="teal">HP / types / PP</Tag>
        <Slab position={[2.1, 0.3, 0]} size={[2.1, 1.8, 0.12]} color={mode === "illegal" ? P.rose : P.amber} fill={0.26} />
        <Tag position={[2.1, 1.35, 0.2]} tone={mode === "illegal" ? "rose" : "amber"}>{mode === "illegal" ? "move not in set" : "choose_move"}</Tag>
        <Node3D position={[0, 0.3, 0]} color={P.violet} radius={0.2} pulse={0.3} />
        <Tag position={[0, -0.35, 0.2]} tone="violet">LLM</Tag>
        <Flow points={[[-1.0, 0.3, 0], [-0.25, 0.3, 0]]} color={P.teal} count={2} />
        <Flow points={[[0.25, 0.3, 0], [1.0, 0.3, 0]]} color={mode === "illegal" ? P.rose : P.amber} count={2} />
    
      </Stage>
    </Figure>
  );
}

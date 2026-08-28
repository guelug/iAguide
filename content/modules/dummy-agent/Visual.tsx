"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "hallucinate" | "stop" | "real";

export default function Visual() {
  const t = useCopy({
    en: {
      "stop_run_append": "stop · run · append",
      "do_not_let_the_model_invent_the_observation": "do not let the model invent the Observation",
      "hallucinated_obs": "hallucinated obs",
      "stop_token": "stop token",
      "real_tool": "real tool",
      "hallucinated_obs_2": "Hallucinated obs",
      "stop_token_2": "Stop token",
      "real_tool_2": "Real tool"
    },
    es: {
      "stop_run_append": "stop · run · append",
      "do_not_let_the_model_invent_the_observation": "no dejes que el modelo invente la Observation",
      "hallucinated_obs": "obs alucinada",
      "stop_token": "token de stop",
      "real_tool": "tool real",
      "hallucinated_obs_2": "Obs alucinada",
      "stop_token_2": "Token de stop",
      "real_tool_2": "Tool real"
    },
  });
  const [mode, setMode] = useState<Mode>("hallucinate");
  return (
    <Figure
      label={t.stop_run_append}
      hint={t.do_not_let_the_model_invent_the_observation}
      legend={[
          { color: P.rose, label: t.hallucinated_obs },
          { color: P.amber, label: t.stop_token },
          { color: P.teal, label: t.real_tool }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "hallucinate", label: t.hallucinated_obs_2, tone: P.rose },
            { value: "stop", label: t.stop_token_2, tone: P.amber },
            { value: "real", label: t.real_tool_2, tone: P.teal }
          ]}
          ariaLabel={t.do_not_let_the_model_invent_the_observation}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.4, 0]} size={[2.0, 1.6, 0.12]} color={P.violet} fill={0.2} />
        <Tag position={[-2.2, 1.35, 0.2]} tone="violet">model text</Tag>
        <Tag position={[-2.2, 0.5, 0.2]} tone="muted" size="xs">Thought</Tag>
        <Tag position={[-2.2, 0.05, 0.2]} tone="amber" size="xs">Action JSON</Tag>
        <Slab position={[2.0, 0.4, 0]} size={[2.2, 1.6, 0.12]} color={mode === "hallucinate" ? P.rose : P.teal} fill={0.28} />
        <Tag position={[2.0, 1.35, 0.2]} tone={mode === "hallucinate" ? "rose" : "teal"}>
          {mode === "hallucinate" ? "fake Observation" : "get_weather()"}
        </Tag>
        {mode === "stop" ? (
          <Tag position={[0, -1.2, 0.2]} tone="amber">{'stop=["Observation:"]'}</Tag>
        ) : null}
        <Flow points={[[-1.15, 0.4, 0], [0.85, 0.4, 0]]} color={mode === "hallucinate" ? P.rose : P.teal} count={3} paused={mode === "stop"} />
    
      </Stage>
    </Figure>
  );
}

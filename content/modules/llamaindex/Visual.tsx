"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "index" | "query" | "agent";

export default function Visual() {
  const t = useCopy({
    en: {
      "index_retriever_agent": "index → retriever → agent",
      "index": "index",
      "agent": "agent",
      "index_2": "Index",
      "agent_2": "Agent"
    },
    es: {
      "index_retriever_agent": "índice → retriever → agente",
      "index": "índice",
      "agent": "agente",
      "index_2": "Índice",
      "agent_2": "Agente"
    },
  });
  const [mode, setMode] = useState<Mode>("index");
  return (
    <Figure
      label={t.index_retriever_agent}
      hint="LlamaIndex is retrieval-shaped"
      legend={[
          { color: P.teal, label: t.index },
          { color: P.amber, label: "queryengine" },
          { color: P.violet, label: t.agent }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "index", label: t.index_2, tone: P.teal },
            { value: "query", label: "QueryEngine", tone: P.amber },
            { value: "agent", label: t.agent_2, tone: P.violet }
          ]}
          ariaLabel="LlamaIndex is retrieval-shaped"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.4, 0.2, 0]} size={[1.7, 1.8, 0.12]} color={P.teal} fill={mode === "index" ? 0.32 : 0.14} />
        <Tag position={[-2.4, 1.25, 0.2]} tone="teal">LlamaHub</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.7, 1.8, 0.12]} color={P.amber} fill={mode === "query" ? 0.32 : 0.14} />
        <Tag position={[0, 1.25, 0.2]} tone="amber">retriever</Tag>
        <Slab position={[2.4, 0.2, 0]} size={[1.7, 1.8, 0.12]} color={P.violet} fill={mode === "agent" ? 0.32 : 0.14} />
        <Tag position={[2.4, 1.25, 0.2]} tone="violet">workflow</Tag>
        <Flow points={[[-1.5, 0.2, 0], [-0.9, 0.2, 0]]} color={P.teal} count={3} />
        <Flow points={[[0.9, 0.2, 0], [1.5, 0.2, 0]]} color={mode === "agent" ? P.violet : P.amber} count={3} />
    
      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "naive" | "agent" | "inject";

export default function Visual() {
  const t = useCopy({
    en: {
      "retrieve_then_read_vs_choose": "retrieve-then-read vs choose",
      "the_agent_may_skip_the_index": "the agent may skip the index",
      "naive_rag": "naive rag",
      "chooses_tools": "chooses tools",
      "injected_bio": "injected bio",
      "naive_rag_2": "Naive RAG",
      "chooses_tools_2": "Chooses tools",
      "injected_bio_2": "Injected bio"
    },
    es: {
      "retrieve_then_read_vs_choose": "recuperar-y-leer vs elegir",
      "the_agent_may_skip_the_index": "el agente puede saltarse el índice",
      "naive_rag": "rag ingenuo",
      "chooses_tools": "elige herramientas",
      "injected_bio": "bio inyectada",
      "naive_rag_2": "RAG ingenuo",
      "chooses_tools_2": "Elige herramientas",
      "injected_bio_2": "Bio inyectada"
    },
  });
  const [mode, setMode] = useState<Mode>("naive");
  return (
    <Figure
      label={t.retrieve_then_read_vs_choose}
      hint={t.the_agent_may_skip_the_index}
      legend={[
          { color: P.amber, label: t.naive_rag },
          { color: P.violet, label: t.chooses_tools },
          { color: P.rose, label: t.injected_bio }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "naive", label: t.naive_rag_2, tone: P.amber },
            { value: "agent", label: t.chooses_tools_2, tone: P.violet },
            { value: "inject", label: t.injected_bio_2, tone: P.rose }
          ]}
          ariaLabel={t.the_agent_may_skip_the_index}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.3, 0.35, 0]} size={[1.8, 1.7, 0.12]} color={P.amber} fill={0.2} />
        <Tag position={[-2.3, 1.35, 0.2]} tone="amber">guest bios</Tag>
        <Slab position={[0.1, 0.35, 0]} size={[1.7, 1.7, 0.12]} color={mode === "inject" ? P.rose : P.teal} fill={0.22} />
        <Tag position={[0.1, 1.35, 0.2]} tone={mode === "inject" ? "rose" : "teal"}>{mode === "inject" ? "ignore policy" : "retrieved"}</Tag>
        <Slab position={[2.4, 0.35, 0]} size={[1.7, 1.7, 0.12]} color={P.violet} fill={mode === "agent" ? 0.32 : 0.14} />
        <Tag position={[2.4, 1.35, 0.2]} tone="violet">gala agent</Tag>
        <Flow points={[[-1.35, 0.35, 0], [-0.8, 0.35, 0]]} color={mode === "inject" ? P.rose : P.amber} count={3} />
        {mode === "agent" ? (
          <Flow points={[[2.4, -0.7, 0], [0.1, -1.2, 0], [-2.3, -0.7, 0]]} color={P.violet} count={4} />
        ) : (
          <Flow points={[[1.0, 0.35, 0], [1.5, 0.35, 0]]} color={P.teal} count={2} />
        )}
    
      </Stage>
    </Figure>
  );
}

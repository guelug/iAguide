"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Classic RAG vs agentic RAG, and when NOT to retrieve. */
type Mode = "classic" | "agentic" | "when";

const COPY = {
  en: {
    rag_classic_vs_agentic: "rag: classic vs agentic",
    the_agent_decides_to_retrieve: "the agent decides to retrieve",
    classic: "classic",
    agentic: "agentic",
    when_not: "when not",
    retrieve_first: "retrieve first",
    answer: "answer",
    agent_decides: "agent decides",
    query: "query",
    chunks: "chunks",
    cite: "cite",
    direct_answer: "direct answer",
    no_retrieval: "no retrieval",
  },
  es: {
    rag_classic_vs_agentic: "rag: clásico vs agéntico",
    the_agent_decides_to_retrieve: "el agente decide recuperar",
    classic: "clásico",
    agentic: "agéntico",
    when_not: "cuándo no",
    retrieve_first: "recupera primero",
    answer: "respuesta",
    agent_decides: "decide el agente",
    query: "consulta",
    chunks: "chunks",
    cite: "cita",
    direct_answer: "respuesta directa",
    no_retrieval: "sin recuperar",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("agentic");

  return (
    <Figure
      label={t.rag_classic_vs_agentic}
      hint={t.the_agent_decides_to_retrieve}
      legend={[
        { color: P.teal, label: t.classic },
        { color: P.violet, label: t.agentic },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "classic", label: t.classic, tone: P.teal },
            { value: "agentic", label: t.agentic, tone: P.violet },
            { value: "when", label: t.when_not, tone: P.amber },
          ]}
          ariaLabel={t.rag_classic_vs_agentic}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "classic" && (
          <>
            {/* query → retriever → chunks → prompt+answer. No decision. */}
            <Node3D position={[-2.6, 0.7, 0]} color={P.teal} radius={0.15} />
            <Tag position={[-2.6, 1.15, 0.15]} tone="teal" size="xs">{t.query}</Tag>
            <Flow points={[[-2.35, 0.7, 0], [-1.2, 0.7, 0]]} color={P.teal} count={2} size={0.05} />
            <Slab position={[-0.4, 0.7, 0]} size={[1.5, 0.9, 0.14]} color={P.violet} fill={0.2} />
            <Tag position={[-0.4, 1.4, 0.15]} tone="violet" size="xs">{t.retrieve_first}</Tag>
            <Flow points={[[0.35, 0.7, 0], [1.4, 0.7, 0]]} color={P.violet} count={3} size={0.05} />
            {[0, 1, 2].map((i) => (
              <Node3D key={i} position={[1.9, 1.1 - i * 0.4, 0]} color={P.violet} radius={0.11} matte />
            ))}
            <Tag position={[2.4, 0.7, 0.15]} tone="violet" size="xs">{t.chunks}</Tag>
            <Flow points={[[1.9, 0.25, 0], [1.4, -0.8, 0]]} color={P.amber} count={3} />
            <Slab position={[0.6, -1.0, 0]} size={[2.2, 0.5, 0.12]} color={P.amber} fill={0.22} />
            <Tag position={[0.6, -1.5, 0.15]} tone="amber">{t.answer}</Tag>
          </>
        )}

        {mode === "agentic" && (
          <>
            {/* the agent in the middle decides when to pull */}
            <Halo position={[0, 0.5, 0]} radius={0.55} color={P.violet} opacity={0.55} spin={0.2} />
            <Node3D position={[0, 0.5, 0]} color={P.violet} radius={0.18} pulse={0.3} />
            <Tag position={[0, 1.25, 0.15]} tone="violet">{t.agent_decides}</Tag>
            <Node3D position={[-2.6, 0.5, 0]} color={P.teal} radius={0.14} />
            <Tag position={[-2.6, 0.95, 0.15]} tone="teal" size="xs">{t.query}</Tag>
            <Flow points={[[-2.35, 0.5, 0], [-0.6, 0.5, 0]]} color={P.teal} count={2} size={0.05} />
            {/* optional retrieval as a tool call */}
            <Slab position={[0, -1.0, 0]} size={[2.4, 0.55, 0.12]} color={P.amber} fill={0.2} />
            <Tag position={[0, -1.55, 0.15]} tone="amber" size="xs">retrieve(query)</Tag>
            <Flow points={[[0, -0.1, 0], [0, -0.7, 0]]} color={P.amber} count={2} size={0.045} />
            {/* answer with citations back to chunks */}
            {[0, 1, 2].map((i) => (
              <Node3D key={i} position={[2.5, 1.2 - i * 0.55, 0]} color={P.teal} radius={0.1} matte />
            ))}
            <Tag position={[2.5, 1.75, 0.15]} tone="teal" size="xs">{t.chunks}</Tag>
            <Slab position={[2.5, -0.8, 0]} size={[1.6, 0.55, 0.12]} color={P.teal} fill={0.24} />
            <Tag position={[2.5, -1.35, 0.15]} tone="teal">{t.answer}</Tag>
            {[0, 1, 2].map((i) => (
              <Wire key={i} points={[[2.5, 1.05 - i * 0.55, 0], [2.5, -0.5, 0]]} color={P.teal} opacity={0.35} dashed />
            ))}
            <Tag position={[3.2, -0.1, 0.15]} tone="teal" size="xs">{t.cite}</Tag>
          </>
        )}

        {mode === "when" && (
          <>
            <Node3D position={[-2.4, 0.6, 0]} color={P.teal} radius={0.16} />
            <Tag position={[-2.4, 1.1, 0.15]} tone="teal" size="xs">{t.query}</Tag>
            {/* a question the model already knows */}
            <Slab position={[0, 0.6, 0]} size={[2.4, 0.9, 0.14]} color={P.violet} fill={0.14} />
            <Tag position={[0, 1.25, 0.15]} tone="violet" size="xs">«¿capital de Francia?»</Tag>
            <Flow points={[[-2.1, 0.6, 0], [-1.2, 0.6, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[1.2, 0.6, 0], [2.4, 0.6, 0]]} color={P.teal} count={2} />
            <Slab position={[2.4, 0.6, 0]} size={[1.2, 0.5, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[2.4, 1.05, 0.15]} tone="teal" size="xs">{t.direct_answer}</Tag>
            {/* retrieval gate closed */}
            <Slab position={[0, -0.95, 0]} size={[2.4, 0.55, 0.12]} color={P.rose} fill={0.08} />
            <Tag position={[0, -1.5, 0.15]} tone="rose" size="xs">{t.no_retrieval}</Tag>
            <Wire points={[[-0.6, -0.3, 0], [0.6, -0.3, 0]]} color={P.rose} dashed opacity={0.6} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

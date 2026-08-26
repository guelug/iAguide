"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "stuff" | "retrieve" | "agentic";

export default function Visual() {
  const t = useCopy({
    en: {
      "top_k": "top-k",
      "retrieve": "retrieve"
    },
    es: {
      "top_k": "top-k",
      "retrieve": "recupera"
    },
  });
  const [mode, setMode] = useState<Mode>("stuff");
  return (
    <Figure
      label="empujar · recuperar · agéntico"
      hint="tres geometrías del mismo corpus"
      legend={[
        { color: P.amber, label: "empujar" },
        { color: P.teal, label: "recuperar" },
        { color: P.violet, label: "agéntico" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "stuff", label: "Empujar", tone: P.amber },
            { value: "retrieve", label: "Recuperar", tone: P.teal },
            { value: "agentic", label: "Agéntico", tone: P.violet }
          ]}
          ariaLabel="empujar recuperar y agentico"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        <Slab position={[-2.6, 0.05, 0]} size={[1.9, 2.2, 0.12]} color={P.amber} fill={0.18} />
        <Tag position={[-2.6, 1.3, 0.2]} tone="amber">corpus</Tag>
        {Array.from({ length: 10 }).map((_, i) => (
          <Node3D
            key={i}
            position={[-3.0 + (i % 4) * 0.45, 0.9 - Math.floor(i / 4) * 0.32, 0.18]}
            color={mode === "stuff" ? P.amber : i % 3 === 0 ? P.teal : P.lineStrong}
            radius={mode === "stuff" ? 0.11 : 0.08}
            matte
            pulse={mode === "stuff" ? i * 0.3 : 0}
          />
        ))}

        {mode === "stuff" ? (
          <>
            <Slab position={[0.5, 0.05, 0]} size={[1.4, 2.2, 0.12]} color={P.amber} fill={0.32} />
            <Tag position={[0.5, 1.3, 0.2]} tone="amber">prompt</Tag>
            <Node3D position={[0.5, 0.5, 0.18]} color={P.amber} radius={0.22} pulse={0.6} />
            <Slab position={[2.8, 0.05, 0]} size={[1.4, 2.2, 0.12]} color={P.violet} fill={0.18} />
            <Tag position={[2.8, 1.3, 0.2]} tone="violet">modelo</Tag>
            <Node3D position={[2.8, 0.5, 0.18]} color={P.violet} radius={0.18} pulse={0.4} />
            <Flow points={[[-1.6, 0.05, 0], [-0.25, 0.05, 0]]} color={P.amber} count={6} />
            <Flow points={[[1.25, 0.05, 0], [2.05, 0.05, 0]]} color={P.amber} count={6} />
            <Tag position={[0, -1.55, 0.2]} tone="amber" size="xs">quema ventana · mata caché</Tag>
          </>
        ) : null}

        {mode === "retrieve" ? (
          <>
            <Slab position={[0.0, 0.5, 0]} size={[1.4, 1.3, 0.12]} color={P.teal} fill={0.32} />
            <Tag position={[0.0, 1.3, 0.2]} tone="teal">retriever</Tag>
            <Node3D position={[0.0, 0.9, 0.18]} color={P.teal} radius={0.18} pulse={0.5} />
            <Tag position={[0.0, -0.25, 0.2]} tone="teal" size="xs">{t.top_k}</Tag>
            <Slab position={[2.8, 0.05, 0]} size={[1.4, 2.2, 0.12]} color={P.violet} fill={0.18} />
            <Tag position={[2.8, 1.3, 0.2]} tone="violet">modelo</Tag>
            <Node3D position={[2.8, 0.5, 0.18]} color={P.violet} radius={0.18} pulse={0.4} />
            {Array.from({ length: 5 }).map((_, i) => (
              <Node3D
                key={i}
                position={[0.55, 1.0 - i * 0.18, 0.18]}
                color={i === 0 ? P.amber : P.lineStrong}
                radius={i === 0 ? 0.13 : 0.09}
                matte
              />
            ))}
            <Flow points={[[-1.6, 0.5, 0], [-0.75, 0.5, 0]]} color={P.teal} count={3} />
            <Flow points={[[0.75, 0.5, 0], [2.05, 0.5, 0]]} color={P.teal} count={3} />
            <Tag position={[0, -1.55, 0.2]} tone="teal" size="xs">siempre recupera · predecible</Tag>
          </>
        ) : null}

        {mode === "agentic" ? (
          <>
            <Slab position={[0.0, 0.5, 0]} size={[1.4, 1.3, 0.12]} color={P.violet} fill={0.32} />
            <Tag position={[0.0, 1.3, 0.2]} tone="violet">agente</Tag>
            <Node3D position={[0.0, 0.7, 0.18]} color={P.violet} radius={0.22} pulse={0.6} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Slab
                key={i}
                position={[-1.4 + i * 1.4, -0.55, 0]}
                size={[1.0, 0.4, 0.1]}
                color={i === 1 ? P.teal : P.lineStrong}
                fill={i === 1 ? 0.5 : 0.18}
              />
            ))}
            <Tag position={[-1.4, -0.55, 0.18]} tone="muted" size="xs">{t.retrieve}</Tag>
            <Tag position={[0.0, -0.55, 0.18]} tone="teal" size="xs">buscar web</Tag>
            <Tag position={[1.4, -0.55, 0.18]} tone="muted" size="xs">reformular</Tag>
            <Wire points={[[0.0, 0.35, 0], [-1.4, -0.35, 0]]} color={P.teal} dashed />
            <Wire points={[[0.0, 0.35, 0], [1.4, -0.35, 0]]} color={P.violet} dashed />
            <Flow points={[[-1.4, -0.95, 0], [-1.4, -1.5, 0], [-2.6, -1.5, 0], [-2.6, -0.5, 0]]} color={P.teal} count={3} />
            <Tag position={[0, -1.55, 0.2]} tone="violet" size="xs">modelo decide</Tag>
          </>
        ) : null}
      </Stage>
    </Figure>
  );
}
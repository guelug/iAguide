"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "open" | "closed" | "moe";

export default function Visual() {
  const t = useCopy({
    en: {
      "read_the_card": "read the card",
      "step_the_figure": "step the figure",
      "open_weights": "open weights",
      "open_weights_2": "Open weights"
    },
    es: {
      "read_the_card": "lee la ficha",
      "step_the_figure": "recorre la figura",
      "open_weights": "pesos abiertos",
      "open_weights_2": "Pesos abiertos"
    },
  });
  const [mode, setMode] = useState<Mode>("open");
  return (
    <Figure
      label={t.read_the_card}
      hint={t.step_the_figure}
      legend={[
          { color: P.teal, label: t.open_weights },
          { color: P.amber, label: "api" },
          { color: P.violet, label: "moe" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "open", label: t.open_weights_2, tone: P.teal },
            { value: "closed", label: "API", tone: P.amber },
            { value: "moe", label: "MoE", tone: P.violet }
          ]}
          ariaLabel={t.step_the_figure}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 8.5], fov: 40 }}>

        {/* Open weights — large file slab */}
        <Slab
          position={[-2.6, 0.0, 0]}
          size={[2.1, 1.7, 0.12]}
          color={P.teal}
          fill={mode === "open" ? 0.34 : 0.14}
        />
        <Tag position={[-2.6, 1.05, 0.2]} tone="teal">pesos abiertos</Tag>
        {mode === "open" ? (
          <Tag position={[-2.6, -1.05, 0.2]} tone="teal">descargable · tuyos</Tag>
        ) : null}

        {/* Closed API — small key icon */}
        <Slab
          position={[0, 0.0, 0]}
          size={[1.5, 1.0, 0.12]}
          color={P.amber}
          fill={mode === "closed" ? 0.34 : 0.14}
        />
        <Tag position={[0, 0.85, 0.2]} tone="amber">API cerrada</Tag>
        {mode === "closed" ? (
          <>
            <Slab position={[0, -0.55, 0.05]} size={[0.8, 0.3, 0.08]} color={P.amber} fill={0.50} />
            <Tag position={[0, -1.0, 0.2]} tone="amber">alquilas tokens</Tag>
          </>
        ) : null}

        {/* MoE — 8 expert mini-slabs */}
        <Slab
          position={[2.6, 0.0, 0]}
          size={[2.1, 1.7, 0.12]}
          color={P.violet}
          fill={mode === "moe" ? 0.18 : 0.10}
        />
        <Tag position={[2.6, 1.05, 0.2]} tone="violet">MoE</Tag>
        {mode === "moe" ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <Slab
                key={i}
                position={[1.7 + (i % 4) * 0.6, -0.4 + Math.floor(i / 4) * 0.6, 0.05]}
                size={[0.45, 0.4, 0.08]}
                color={i < 2 ? P.teal : P.violet}
                fill={i < 2 ? 0.50 : 0.20}
              />
            ))}
            <Tag position={[2.6, -0.95, 0.2]} tone="violet">2 activos · 8 totales</Tag>
          </>
        ) : null}

      </Stage>
    </Figure>
  );
}

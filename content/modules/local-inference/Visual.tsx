"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "gguf" | "ollama" | "vllm";

export default function Visual() {
  const t = useCopy({
    en: {
      "engines": "engines",
      "step_the_figure": "step the figure"
    },
    es: {
      "engines": "motores",
      "step_the_figure": "recorre la figura"
    },
  });
  const [mode, setMode] = useState<Mode>("gguf");

  // vLLM = many parallel slabs (batching); llama.cpp/Ollama = single user
  const users = mode === "vllm" ? 4 : 1;

  return (
    <Figure
      label={t.engines}
      hint={t.step_the_figure}
      legend={[
          { color: P.teal, label: "llama.cpp" },
          { color: P.amber, label: "ollama" },
          { color: P.violet, label: "vllm" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "gguf", label: "llama.cpp", tone: P.teal },
            { value: "ollama", label: "Ollama", tone: P.amber },
            { value: "vllm", label: "vLLM", tone: P.violet }
          ]}
          ariaLabel={t.step_the_figure}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 8.5], fov: 40 }}>

        {/* Three engines */}
        <Slab
          position={[-2.6, 0.0, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.teal}
          fill={mode === "gguf" ? 0.34 : 0.14}
        />
        <Tag position={[-2.6, 1.0, 0.2]} tone="teal">llama.cpp · GGUF</Tag>

        <Slab
          position={[0, 0.0, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.amber}
          fill={mode === "ollama" ? 0.34 : 0.14}
        />
        <Tag position={[0, 1.0, 0.2]} tone="amber">Ollama · HTTP</Tag>

        <Slab
          position={[2.6, 0.0, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.violet}
          fill={mode === "vllm" ? 0.34 : 0.14}
        />
        <Tag position={[2.6, 1.0, 0.2]} tone="violet">vLLM · batch</Tag>

        {/* User cards below each engine */}
        {Array.from({ length: users }).map((_, i) => {
          const x = mode === "vllm" ? 1.4 + (i - 1.5) * 0.8 : (mode === "ollama" ? 0 : -2.6);
          return (
            <Slab
              key={i}
              position={[x, -0.8, 0.05]}
              size={[0.55, 0.4, 0.08]}
              color={P.violet}
              fill={0.42}
            />
          );
        })}
        {mode === "vllm" ? (
          <Tag position={[2.6, -1.15, 0.2]} tone="violet">4 usuarios · batch continuo</Tag>
        ) : mode === "ollama" ? (
          <Tag position={[0, -1.15, 0.2]} tone="amber">1 usuario · HTTP en 11434</Tag>
        ) : (
          <Tag position={[-2.6, -1.15, 0.2]} tone="teal">1 usuario · flags totales</Tag>
        )}

        {/* Decode arrow streaming from engine */}
        <Flow
          points={mode === "vllm" ? [[1.6, 0.0, 0], [3.6, 0.0, 0]] : [[-1.5, 0.0, 0], [-3.6, 0.0, 0]]}
          color={mode === "vllm" ? P.violet : P.teal}
          count={mode === "vllm" ? 8 : 4}
        />

      </Stage>
    </Figure>
  );
}

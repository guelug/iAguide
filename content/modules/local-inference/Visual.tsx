"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "gguf" | "ollama" | "vllm";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("gguf");
  return (
    <Figure
      label="engines"
      hint="step the figure"
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
          ariaLabel="step the figure"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.teal} fill={mode === "gguf" ? 0.34 : 0.12} />
        <Tag position={[-2.2, 1.2, 0.2]} tone="teal">llama.cpp</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.amber} fill={mode === "ollama" ? 0.34 : 0.12} />
        <Tag position={[0, 1.2, 0.2]} tone="amber">Ollama</Tag>
        <Slab position={[2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.violet} fill={mode === "vllm" ? 0.34 : 0.12} />
        <Tag position={[2.2, 1.2, 0.2]} tone="violet">vLLM</Tag>
        <Flow points={[[-1.2, 0.2, 0], [-0.95, 0.2, 0]]} color={P.teal} count={2} />
        <Flow points={[[1.0, 0.2, 0], [1.25, 0.2, 0]]} color={P.amber} count={2} />
        
      </Stage>
    </Figure>
  );
}

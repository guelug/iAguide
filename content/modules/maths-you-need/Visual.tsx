"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "softmax" | "ce" | "lora";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("softmax");
  return (
    <Figure
      label="softmax · cross-entropy · lora"
      hint="tres pasos para entender la pérdida"
      legend={[
        { color: P.teal, label: "softmax" },
        { color: P.amber, label: "cross-entropy" },
        { color: P.violet, label: "lora" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "softmax", label: "Softmax", tone: P.teal },
            { value: "ce", label: "Cross-entropy", tone: P.amber },
            { value: "lora", label: "LoRA", tone: P.violet }
          ]}
          ariaLabel="softmax cross-entropy y lora"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        {mode === "softmax" ? (
          <>
            <Slab position={[-2.4, 0.05, 0]} size={[1.9, 1.6, 0.12]} color={P.teal} fill={0.32} />
            <Tag position={[-2.4, 1.0, 0.2]} tone="teal">logits z</Tag>
            {[-1.5, 0.3, 2.4, 1.1, -0.4].map((v, i) => (
              <group key={i}>
                <Slab position={[-2.9 + (i % 3) * 0.6, 0.35 - Math.floor(i / 3) * 0.55, 0.1]} size={[0.45, 0.04 + Math.max(v, 0) * 0.18, 0.1]} color={P.teal} fill={0.5} />
                <Tag position={[-2.9 + (i % 3) * 0.6, 0.15 - Math.floor(i / 3) * 0.55, 0.18]} tone="muted" size="xs">{v.toFixed(1)}</Tag>
              </group>
            ))}
            <Slab position={[0.1, 0.05, 0]} size={[1.0, 1.6, 0.12]} color={P.lineStrong} fill={0.06} />
            <Tag position={[0.1, 1.0, 0.2]} tone="muted">/ T</Tag>
            <Node3D position={[0.1, -0.3, 0.18]} color={P.violet} radius={0.18} pulse={0.4} />
            <Slab position={[2.4, 0.05, 0]} size={[1.9, 1.6, 0.12]} color={P.amber} fill={0.32} />
            <Tag position={[2.4, 1.0, 0.2]} tone="amber">probs p</Tag>
            {[0.04, 0.12, 0.65, 0.14, 0.05].map((v, i) => (
              <group key={i}>
                <Slab position={[1.9 + (i % 3) * 0.6, 0.35 - Math.floor(i / 3) * 0.55, 0.1]} size={[0.45, 0.04 + v * 1.4, 0.1]} color={P.amber} fill={0.5} />
                <Tag position={[1.9 + (i % 3) * 0.6, 0.15 - Math.floor(i / 3) * 0.55, 0.18]} tone="muted" size="xs">{v.toFixed(2)}</Tag>
              </group>
            ))}
            <Flow points={[[-1.4, 0.05, 0], [-0.4, 0.05, 0]]} color={P.teal} count={3} />
            <Flow points={[[0.6, 0.05, 0], [1.4, 0.05, 0]]} color={P.amber} count={3} />
            <Tag position={[0, -1.55, 0.2]} tone="muted" size="xs">∑ p = 1</Tag>
          </>
        ) : null}

        {mode === "ce" ? (
          <>
            <Slab position={[-2.4, 0.05, 0]} size={[2.0, 1.6, 0.12]} color={P.amber} fill={0.32} />
            <Tag position={[-2.4, 1.0, 0.2]} tone="amber">pred p</Tag>
            {[0.7, 0.2, 0.05, 0.04, 0.01].map((v, i) => (
              <Slab key={i} position={[-2.9 + (i % 3) * 0.6, 0.35 - Math.floor(i / 3) * 0.55, 0.1]} size={[0.45, 0.04 + v * 1.0, 0.1]} color={P.amber} fill={0.5} />
            ))}
            <Tag position={[-2.4, -0.85, 0.2]} tone="amber" size="xs">token true = idx 0</Tag>
            <Slab position={[0.0, 0.05, 0]} size={[1.0, 1.6, 0.12]} color={P.rose} fill={0.2} />
            <Tag position={[0.0, 1.0, 0.2]} tone="rose">−log p</Tag>
            <Node3D position={[0.0, 0.0, 0.18]} color={P.rose} radius={0.2} pulse={0.6} />
            <Tag position={[0.0, -0.85, 0.2]} tone="rose" size="xs">−log 0.7 ≈ 0.36</Tag>
            <Slab position={[2.4, 0.05, 0]} size={[2.0, 1.6, 0.12]} color={P.violet} fill={0.18} />
            <Tag position={[2.4, 1.0, 0.2]} tone="violet">sorpresa</Tag>
            <Tag position={[2.4, 0.4, 0.2]} tone="violet" size="xs">baja = confianza</Tag>
            <Tag position={[2.4, 0.0, 0.2]} tone="violet" size="xs">alta = overfit</Tag>
            <Flow points={[[-1.35, 0.05, 0], [-0.55, 0.05, 0]]} color={P.amber} count={2} />
            <Flow points={[[0.55, 0.05, 0], [1.35, 0.05, 0]]} color={P.rose} count={2} />
          </>
        ) : null}

        {mode === "lora" ? (
          <>
            <Slab position={[-2.5, 0.05, 0]} size={[1.7, 1.6, 0.12]} color={P.teal} fill={0.32} />
            <Tag position={[-2.5, 1.0, 0.2]} tone="teal">W (4096²)</Tag>
            <Tag position={[-2.5, -0.85, 0.2]} tone="teal" size="xs">16.7M · congelada</Tag>
            {Array.from({ length: 5 }).map((_, r) => (
              <Slab key={r} position={[-2.7, 0.55 - r * 0.3, 0.1]} size={[1.3, 0.16, 0.08]} color={P.teal} fill={0.5} />
            ))}
            <Slab position={[0.0, 0.55, 0]} size={[0.4, 0.4, 0.1]} color={P.amber} fill={0.4} />
            <Tag position={[0.0, 1.0, 0.2]} tone="amber">A (r×k)</Tag>
            <Tag position={[0.0, -0.05, 0.2]} tone="amber" size="xs">r = 16</Tag>
            <Slab position={[0.0, -0.35, 0]} size={[0.4, 0.4, 0.1]} color={P.amber} fill={0.4} />
            <Slab position={[2.4, 0.55, 0]} size={[0.4, 0.4, 0.1]} color={P.violet} fill={0.4} />
            <Tag position={[2.4, 1.0, 0.2]} tone="violet">B (d×r)</Tag>
            <Tag position={[2.4, -0.05, 0.2]} tone="violet" size="xs">d = 4096</Tag>
            <Slab position={[2.4, -0.35, 0]} size={[0.4, 0.4, 0.1]} color={P.violet} fill={0.4} />
            <Tag position={[0.0, -1.05, 0.2]} tone="muted" size="xs">ΔW = B · A · α/r</Tag>
            <Flow points={[[-1.6, 0.55, 0], [-0.25, 0.55, 0]]} color={P.teal} count={2} />
            <Flow points={[[0.25, 0.55, 0], [0.25, -0.35, 0], [-0.25, -0.35, 0], [-0.25, 0.55, 0]]} color={P.amber} count={3} />
            <Flow points={[[0.25, -0.35, 0], [2.15, -0.35, 0]]} color={P.violet} count={2} />
          </>
        ) : null}
      </Stage>
    </Figure>
  );
}
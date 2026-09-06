"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "qkv" | "heads" | "gqa";

export default function VisualLegacy() {
  const t = useCopy({
    en: { heads: "heads", heads_2: "Heads" },
    es: { heads: "cabezas", heads_2: "Cabezas" },
  });
  const [mode, setMode] = useState<Mode>("qkv");
  return (
    <Figure
      label="qkv · heads · gqa"
      hint="una atención, tres dibujos"
      legend={[
        { color: P.teal, label: "qkv" },
        { color: P.amber, label: t.heads },
        { color: P.violet, label: "gqa" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "qkv", label: "Q K V", tone: P.teal },
            { value: "heads", label: t.heads_2, tone: P.amber },
            { value: "gqa", label: "GQA", tone: P.violet },
          ]}
          ariaLabel="qkv heads y gqa"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        {mode === "qkv" ? (
          <>
            {Array.from({ length: 7 }).map((_, i) => {
              const x = -2.4 + i * 0.8;
              return (
                <group key={i}>
                  <Node3D position={[x, 1.2, 0]} color={P.teal} radius={i === 3 ? 0.2 : 0.11} matte pulse={i === 3 ? 0.4 : 0} />
                  <Node3D position={[x, 0.1, 0]} color={P.amber} radius={0.11} matte />
                  <Node3D position={[x, -1.0, 0]} color={P.violet} radius={0.11} matte />
                  <Tag position={[x, 1.65, 0.2]} tone={i === 3 ? "teal" : "muted"} size="xs">{i === 3 ? "Q" : " "}</Tag>
                  <Tag position={[x, 0.55, 0.2]} tone={i === 3 ? "amber" : "muted"} size="xs">{i === 3 ? "K" : " "}</Tag>
                  <Tag position={[x, -0.55, 0.2]} tone={i === 3 ? "violet" : "muted"} size="xs">{i === 3 ? "V" : " "}</Tag>
                </group>
              );
            })}
            <Tag position={[0, 1.95, 0.2]} tone="teal">queries</Tag>
            <Tag position={[0, 0.85, 0.2]} tone="amber">keys (atendibles)</Tag>
            <Tag position={[0, -1.45, 0.2]} tone="violet">values (mezcla)</Tag>
            <Flow points={[[0, 1.0, 0], [0, 0.0, 0]]} color={P.teal} count={2} />
            <Wire points={[[0, 0.0, 0], [0, -0.9, 0]]} color={P.violet} dashed />
          </>
        ) : null}

        {mode === "heads" ? (
          <>
            {[0, 1, 2, 3].map((h) => {
              const y = 1.0 - h * 0.7;
              const color = h % 2 === 0 ? P.amber : P.violet;
              return (
                <group key={h}>
                  {Array.from({ length: 7 }).map((_, i) => <Node3D key={i} position={[-2.4 + i * 0.8, y, 0]} color={color} radius={0.08} matte />)}
                  <Tag position={[-3.0, y, 0.2]} tone={color === P.amber ? "amber" : "violet"} size="xs">H{h}</Tag>
                </group>
              );
            })}
            <Slab position={[0, -1.65, 0]} size={[5.0, 0.3, 0.1]} color={P.teal} fill={0.3} />
            <Tag position={[0, -1.65, 0.2]} tone="teal">concat → MLP</Tag>
            <Flow points={[[0, 1.0, 0], [0, -1.5, 0]]} color={P.teal} count={3} />
          </>
        ) : null}

        {mode === "gqa" ? (
          <>
            {[0, 1, 2, 3].map((h) => {
              const y = 1.0 - h * 0.7;
              return (
                <group key={h}>
                  {Array.from({ length: 7 }).map((_, i) => <Node3D key={i} position={[-2.4 + i * 0.8, y, 0]} color={P.amber} radius={0.08} matte />)}
                  <Tag position={[-3.0, y, 0.2]} tone="amber" size="xs">Q{h}</Tag>
                </group>
              );
            })}
            {Array.from({ length: 7 }).map((_, i) => <Node3D key={i} position={[-2.4 + i * 0.8, -1.5, 0]} color={P.violet} radius={0.12} matte pulse={(i % 2) * 0.4} />)}
            <Tag position={[0, -1.9, 0.2]} tone="violet" size="xs">KV compartido (1 grupo)</Tag>
            {Array.from({ length: 7 }).map((_, i) => i % 2 === 0 ? <Wire key={i} points={[[-2.4 + i * 0.8, 1.0, 0], [-2.4 + i * 0.8, -1.4, 0]]} color={P.violet} dashed /> : null)}
            {Array.from({ length: 7 }).map((_, i) => i % 2 === 1 ? <Wire key={i} points={[[-2.4 + i * 0.8, 1.0, 0], [-2.4 + i * 0.8, -1.4, 0]]} color={P.violet} dashed /> : null)}
          </>
        ) : null}
      </Stage>
    </Figure>
  );
}

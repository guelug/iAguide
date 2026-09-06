"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "bpe" | "roles" | "template";

export default function Visual() {
  const t = useCopy({
    en: {
      "roles": "roles",
      "roles_2": "Roles"
    },
    es: {
      "roles": "roles",
      "roles_2": "Roles"
    },
  });
  const [mode, setMode] = useState<Mode>("bpe");
  return (
    <Figure
      label="bpe · chat template · strawberry"
      hint="cómo se rompe un modelo por dentro"
      legend={[
        { color: P.amber, label: "bpe" },
        { color: P.teal, label: t.roles },
        { color: P.violet, label: "template" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "bpe", label: "BPE", tone: P.amber },
            { value: "roles", label: t.roles_2, tone: P.teal },
            { value: "template", label: "Template", tone: P.violet }
          ]}
          ariaLabel="bpe roles y template"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        {mode === "bpe" ? (
          <>
            <Slab position={[-2.4, 0.1, 0]} size={[1.8, 1.0, 0.12]} color={P.amber} fill={0.18} />
            <Tag position={[-2.4, 0.7, 0.2]} tone="amber">texto</Tag>
            <Node3D position={[-2.9, -0.05, 0.18]} color={P.amber} radius={0.13} matte />
            <Node3D position={[-2.4, -0.05, 0.18]} color={P.amber} radius={0.13} matte />
            <Node3D position={[-1.9, -0.05, 0.18]} color={P.amber} radius={0.13} matte />
            <Tag position={[-2.4, -0.5, 0.2]} tone="muted" size="xs">strawberry</Tag>
            <Slab position={[0.0, 0.1, 0]} size={[1.8, 1.0, 0.12]} color={P.teal} fill={0.34} />
            <Tag position={[0.0, 0.7, 0.2]} tone="teal">tokens</Tag>
            {["str", "aw", "berry"].map((t, i) => (
              <Node3D key={t} position={[-0.5 + i * 0.5, -0.05, 0.18]} color={P.teal} radius={0.13} matte pulse={i * 0.5} />
            ))}
            <Tag position={[0.0, -0.5, 0.2]} tone="teal" size="xs">3 ids</Tag>
            <Slab position={[2.4, 0.1, 0]} size={[1.8, 1.0, 0.12]} color={P.violet} fill={0.18} />
            <Tag position={[2.4, 0.7, 0.2]} tone="violet">letras</Tag>
            <Node3D position={[1.9, -0.05, 0.18]} color={P.violet} radius={0.08} matte />
            <Node3D position={[2.1, -0.05, 0.18]} color={P.violet} radius={0.08} matte />
            <Node3D position={[2.3, -0.05, 0.18]} color={P.violet} radius={0.08} matte />
            <Node3D position={[2.5, -0.05, 0.18]} color={P.violet} radius={0.08} matte />
            <Node3D position={[2.7, -0.05, 0.18]} color={P.violet} radius={0.08} matte />
            <Node3D position={[2.9, -0.05, 0.18]} color={P.violet} radius={0.08} matte />
            <Tag position={[2.4, -0.5, 0.2]} tone="violet" size="xs">10 letras</Tag>
            <Flow points={[[ -1.45, 0.1, 0], [-0.95, 0.1, 0]]} color={P.amber} count={2} />
            <Flow points={[[0.95, 0.1, 0], [1.45, 0.1, 0]]} color={P.violet} count={2} />
            <Wire points={[[0.4, -0.3, 0], [1.7, -0.3, 0]]} color={P.rose} dashed />
            <Tag position={[1.05, -1.1, 0.2]} tone="rose" size="xs">modelo no ve letras</Tag>
          </>
        ) : null}

        {mode === "roles" ? (
          <>
            {(["system", "user", "assistant", "tool"] as const).map((role, i) => {
              const color = role === "system" ? P.teal : role === "user" ? P.amber : role === "assistant" ? P.violet : P.rose;
              const y = 1.05 - i * 0.55;
              return (
                <group key={role}>
                  <Slab position={[-2.0, y, 0]} size={[2.0, 0.5, 0.1]} color={color} fill={0.24} />
                  <Tag position={[-2.0, y, 0.18]} tone={role === "system" ? "teal" : role === "user" ? "amber" : role === "assistant" ? "violet" : "rose"}>{role}</Tag>
                  <Node3D position={[-0.5, y, 0.16]} color={P.rose} radius={0.08} matte />
                  <Node3D position={[-0.3, y, 0.16]} color={P.rose} radius={0.08} matte />
                </group>
              );
            })}
            <Slab position={[2.0, 0.05, 0]} size={[2.4, 2.4, 0.12]} color={P.lineStrong} fill={0.06} />
            <Tag position={[2.0, 1.4, 0.2]} tone="muted">una cadena</Tag>
            {Array.from({ length: 14 }).map((_, i) => (
              <Node3D
                key={i}
                position={[1.4 + (i % 7) * 0.32, 0.95 - Math.floor(i / 7) * 0.4, 0.18]}
                color={i < 4 ? P.teal : i < 8 ? P.amber : i < 12 ? P.violet : P.rose}
                radius={0.06}
                matte
              />
            ))}
            <Flow points={[[-0.85, 0.05, 0], [0.7, 0.05, 0]]} color={P.violet} count={4} />
          </>
        ) : null}

        {mode === "template" ? (
          <>
            <Slab position={[-2.6, 0.05, 0]} size={[2.0, 2.2, 0.12]} color={P.violet} fill={0.18} />
            <Tag position={[-2.6, 1.3, 0.2]} tone="violet">plantilla</Tag>
            {["<|im_start|>", "user", "...", "<|im_end|>", "<|im_start|>", "assistant"].map((s, i) => {
              const y = 0.85 - i * 0.32;
              const color = i % 2 === 0 ? P.violet : P.lineStrong;
              return (
                <group key={i}>
                  <Node3D position={[-2.6, y, 0.18]} color={color} radius={0.08} matte />
                  <Tag position={[-2.0, y, 0.2]} tone={i % 2 === 0 ? "violet" : "muted"} size="xs">{s}</Tag>
                </group>
              );
            })}
            <Slab position={[0.0, 0.05, 0]} size={[2.0, 2.2, 0.12]} color={P.teal} fill={0.34} />
            <Tag position={[0.0, 1.3, 0.2]} tone="teal">render</Tag>
            {Array.from({ length: 12 }).map((_, i) => (
              <Node3D
                key={i}
                position={[-0.6 + (i % 4) * 0.4, 0.85 - Math.floor(i / 4) * 0.4, 0.18]}
                color={i % 4 === 0 ? P.violet : i % 4 === 3 ? P.violet : P.teal}
                radius={0.07}
                matte
              />
            ))}
            <Slab position={[2.6, 0.05, 0]} size={[1.8, 2.2, 0.12]} color={P.amber} fill={0.16} />
            <Tag position={[2.6, 1.3, 0.2]} tone="amber">modelo</Tag>
            <Node3D position={[2.6, 0.0, 0.18]} color={P.amber} radius={0.22} pulse={0.5} />
            <Flow points={[[ -1.5, 0.05, 0], [-1.1, 0.05, 0]]} color={P.violet} count={3} />
            <Flow points={[[1.1, 0.05, 0], [1.6, 0.05, 0]]} color={P.teal} count={3} />
          </>
        ) : null}
      </Stage>
    </Figure>
  );
}

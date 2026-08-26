"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "prefill" | "decode" | "moe";

export default function Visual() {
  const t = useCopy({
    en: {
      "prefill_decode_moe": "prefill · decode · moe"
    },
    es: {
      "prefill_decode_moe": "prefill · decode · moe"
    },
  });
  const [mode, setMode] = useState<Mode>("prefill");
  return (
    <Figure
      label={t.prefill_decode_moe}
      hint="dos fases y un rodeo"
      legend={[
        { color: P.teal, label: "prefill" },
        { color: P.amber, label: "decode" },
        { color: P.violet, label: "moe / a3b" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "prefill", label: "Prefill", tone: P.teal },
            { value: "decode", label: "Decode", tone: P.amber },
            { value: "moe", label: "MoE A3B", tone: P.violet }
          ]}
          ariaLabel="prefill decode y moe a3b"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        {mode === "prefill" ? (
          <>
            <Slab position={[-2.4, 0.1, 0]} size={[2.0, 1.4, 0.12]} color={P.teal} fill={0.34} />
            <Tag position={[-2.4, 1.0, 0.2]} tone="teal">prompt</Tag>
            {Array.from({ length: 6 }).map((_, i) => (
              <Node3D
                key={i}
                position={[-3.0 + (i % 3) * 0.6, -0.05 - Math.floor(i / 3) * 0.45, 0.18]}
                color={P.teal}
                radius={0.13}
                matte
                pulse={i * 0.4}
              />
            ))}
            <Slab position={[0.8, 0.1, 0]} size={[1.6, 1.4, 0.12]} color={P.amber} fill={0.18} />
            <Tag position={[0.8, 1.0, 0.2]} tone="amber">caché KV</Tag>
            {Array.from({ length: 6 }).map((_, i) => (
              <Node3D
                key={i}
                position={[0.3 + (i % 3) * 0.5, -0.05 - Math.floor(i / 3) * 0.45, 0.18]}
                color={P.amber}
                radius={0.09}
                matte
              />
            ))}
            <Slab position={[2.9, 0.1, 0]} size={[1.2, 1.4, 0.12]} color={P.violet} fill={0.14} />
            <Tag position={[2.9, 1.0, 0.2]} tone="violet">logits</Tag>
            <Node3D position={[2.9, -0.05, 0.18]} color={P.violet} radius={0.18} pulse={0.6} />
            <Flow points={[[-1.35, 0.1, 0], [0.0, 0.1, 0]]} color={P.teal} count={6} />
            <Flow points={[[1.65, 0.1, 0], [2.3, 0.1, 0]]} color={P.amber} count={2} />
            <Tag position={[0, -1.3, 0.2]} tone="muted">paralelo · compute-bound</Tag>
          </>
        ) : null}

        {mode === "decode" ? (
          <>
            <Slab position={[-2.6, 0.1, 0]} size={[1.7, 1.4, 0.12]} color={P.amber} fill={0.18} />
            <Tag position={[-2.6, 1.0, 0.2]} tone="amber">caché KV</Tag>
            {Array.from({ length: 8 }).map((_, i) => (
              <Node3D
                key={i}
                position={[-3.2 + (i % 4) * 0.4, -0.05 - Math.floor(i / 4) * 0.45, 0.18]}
                color={P.amber}
                radius={0.07}
                matte
              />
            ))}
            <Slab position={[0.0, 0.1, 0]} size={[1.6, 1.4, 0.12]} color={P.teal} fill={0.34} />
            <Tag position={[0.0, 1.0, 0.2]} tone="teal">pesos</Tag>
            <Node3D position={[0.0, -0.05, 0.18]} color={P.teal} radius={0.22} pulse={0.4} />
            <Tag position={[0, -0.65, 0.2]} tone="teal" size="xs">memory-bandwidth-bound</Tag>
            <Slab position={[2.6, 0.1, 0]} size={[1.4, 1.4, 0.12]} color={P.violet} fill={0.18} />
            <Tag position={[2.6, 1.0, 0.2]} tone="violet">token n</Tag>
            <Node3D position={[2.6, -0.05, 0.18]} color={P.violet} radius={0.16} pulse={1.2} />
            <Flow points={[[-1.65, 0.1, 0], [-0.85, 0.1, 0]]} color={P.amber} count={3} />
            <Flow points={[[0.9, 0.1, 0], [1.85, 0.1, 0]]} color={P.violet} count={1} />
            <Wire points={[[2.6, -0.55, 0], [2.6, -1.05, 0], [-2.6, -1.05, 0], [-2.6, -0.55, 0]]} color={P.amber} dashed />
            <Tag position={[0, -1.3, 0.2]} tone="muted">secuencial · 1 token / paso</Tag>
          </>
        ) : null}

        {mode === "moe" ? (
          <>
            <Slab position={[-2.6, 0.1, 0]} size={[1.6, 1.4, 0.12]} color={P.violet} fill={0.22} />
            <Tag position={[-2.6, 1.0, 0.2]} tone="violet">router</Tag>
            <Node3D position={[-2.6, -0.05, 0.18]} color={P.violet} radius={0.18} pulse={0.8} />
            {Array.from({ length: 6 }).map((_, i) => (
              <group key={i}>
                <Slab
                  position={[1.0 + (i % 3) * 0.9, 0.4 - Math.floor(i / 3) * 0.6, 0]}
                  size={[0.7, 0.42, 0.1]}
                  color={i === 1 || i === 4 ? P.teal : P.lineStrong}
                  fill={i === 1 || i === 4 ? 0.4 : 0.12}
                />
                <Tag position={[1.0 + (i % 3) * 0.9, 0.4 - Math.floor(i / 3) * 0.6, 0.18]} tone={i === 1 || i === 4 ? "teal" : "muted"} size="xs">
                  {`E${i}`}
                </Tag>
              </group>
            ))}
            <Flow points={[[-1.7, 0.1, 0], [-0.6, 0.1, 0], [0.5, 0.1, 0]]} color={P.violet} count={2} />
            <Wire points={[[0.5, 0.4, 0], [1.7, 0.4, 0]]} color={P.teal} />
            <Wire points={[[0.5, -0.2, 0], [1.7, -0.2, 0]]} color={P.teal} />
            <Wire points={[[0.5, 0.1, 0], [1.0, -0.2, 0]]} color={P.lineStrong} dashed />
            <Wire points={[[0.5, 0.1, 0], [1.9, -0.2, 0]]} color={P.lineStrong} dashed />
            <Wire points={[[0.5, 0.1, 0], [1.0, 0.4, 0]]} color={P.lineStrong} dashed />
            <Wire points={[[0.5, 0.1, 0], [1.9, 0.4, 0]]} color={P.lineStrong} dashed />
            <Tag position={[1.4, -1.0, 0.2]} tone="teal">~3B activos</Tag>
            <Tag position={[1.4, -1.35, 0.2]} tone="muted" size="xs">~48B en disco</Tag>
          </>
        ) : null}
      </Stage>
    </Figure>
  );
}
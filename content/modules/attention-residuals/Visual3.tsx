"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Learned alpha structure, Block as 8 summaries, ablation ladder. */
type Mode = "map" | "block" | "abl";

const COPY = {
  en: {
    what_the_weights_actually_learn: "what the weights actually learn",
    locality_lives_the_embedding_doesnt_die_skips_appear: "locality lives; the embedding doesn't die; skips appear",
    learned_map: "learned map",
    blocks_8: "8 blocks",
    ablations: "ablations",
    target_layer: "target layer",
    source_layer: "source layer",
    diagonal: "diagonal",
    alpha: "alpha",
    embedding_survives: "embedding survives",
    long_skip: "long skip",
    block_summary: "block summary",
    embedding_b0: "embedding b0",
    partial: "partial",
    full_attnres: "full attnres",
    block_8: "block 8",
    sigmoid: "sigmoid",
    denseformer: "denseformer",
    residual: "residual",
    loss: "loss",
    lower_is_better: "lower is better",
  },
  es: {
    what_the_weights_actually_learn: "lo que de verdad aprenden los pesos",
    locality_lives_the_embedding_doesnt_die_skips_appear: "la localidad vive; el embedding no muere; aparecen skips",
    learned_map: "mapa aprendido",
    blocks_8: "8 bloques",
    ablations: "ablaciones",
    target_layer: "capa destino",
    source_layer: "capa fuente",
    diagonal: "diagonal",
    alpha: "α",
    embedding_survives: "el embedding sobrevive",
    long_skip: "skip largo",
    block_summary: "resumen de bloque",
    embedding_b0: "embedding b0",
    partial: "parcial",
    full_attnres: "full attnres",
    block_8: "block 8",
    sigmoid: "sigmoide",
    denseformer: "denseformer",
    residual: "residual",
    loss: "pérdida",
    lower_is_better: "menos es mejor",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("map");

  // 8x8 alpha heatmap: mass on the diagonal + column 0 (embedding) + one long skip
  const cells: import("@/components/three/atoms").Cell[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c <= r; c++) {
      let heat = 0;
      if (c === r) heat = 0.85;            // locality: the road
      else if (c === 0) heat = 0.35;       // embedding survives
      else if (r === 7 && c === 3) heat = 0.3; // a learned long skip
      else heat = 0.06;
      cells.push({
        position: [(-1.9 + c * 0.48) as number, (1.5 - r * 0.48) as number, 0],
        color: mixHex(P.violetWash, P.violet, heat),
      });
    }
  }

  // ablation ladder (loss values from Table 4, 16-layer model, baseline 1.766)
  const rows = [
    ["full attnres", 1.737, P.teal],
    ["block 8", 1.746, P.teal],
    ["sigmoid", 1.741, P.violet],
    ["mhc", 1.747, P.violet],
    ["denseformer", 1.767, P.rose],
    ["residual", 1.766, P.rose],
  ] as const;
  const minLoss = 1.735, maxLoss = 1.77;

  return (
    <Figure
      label={t.what_the_weights_actually_learn}
      hint={t.locality_lives_the_embedding_doesnt_die_skips_appear}
      legend={[
        { color: P.violet, label: t.alpha },
        { color: P.teal, label: t.block_8 },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "map", label: t.learned_map, tone: P.violet },
            { value: "block", label: t.blocks_8, tone: P.teal },
            { value: "abl", label: t.ablations, tone: P.amber },
          ]}
          ariaLabel={t.what_the_weights_actually_learn}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "map" && (
          <>
            <Lattice cells={cells} size={0.3} matte />
            <Tag position={[0, 2.05, 0.15]} tone="violet" size="xs">{t.target_layer} ↓</Tag>
            <Tag position={[-2.9, -2.2, 0.15]} tone="muted" size="xs">{t.source_layer} →</Tag>
            {/* diagonal highlight */}
            <Wire
              points={Array.from({ length: 8 }, (_, i) => [-1.9 + i * 0.48, 1.5 - i * 0.48, 0.18] as [number, number, number])}
              color={P.violet}
              width={2.4}
              opacity={0.8}
            />
            <Tag position={[2.8, 1.4, 0.15]} tone="violet" size="xs">{t.diagonal}</Tag>
            {/* embedding column */}
            <Wire points={[[-1.9, 1.85, 0.18], [-1.9, -1.85, 0.18]]} color={P.teal} width={2.4} opacity={0.8} />
            <Tag position={[-2.9, 0.0, 0.15]} tone="teal" size="xs">{t.embedding_survives}</Tag>
            {/* the long skip */}
            <Node3D position={[-1.9 + 3 * 0.48, 1.5 - 7 * 0.48, 0.18]} color={P.amber} radius={0.12} pulse={0.4} />
            <Tag position={[2.0, -1.85, 0.15]} tone="amber" size="xs">{t.long_skip}</Tag>
          </>
        )}

        {mode === "block" && (
          <>
            {/* 27 transformer layers grouped into 9 block summaries + b0 */}
            {Array.from({ length: 27 }, (_, i) => {
              const g = Math.floor(i / 3);
              return (
                <Node3D
                  key={i}
                  position={[-2.55 + (i % 3) * 0.3, 1.75 - g * 0.42, 0]}
                  color={P.muted}
                  radius={0.07}
                  matte
                />
              );
            })}
            <Tag position={[-2.1, 2.15, 0.15]} tone="muted" size="xs">27 caps</Tag>
            {/* block summaries as slabs */}
            {Array.from({ length: 9 }, (_, g) => (
              <group key={g}>
                <Slab
                  position={[0.4 + (g % 3) * 0.95, 1.55 - Math.floor(g / 3) * 0.72, 0]}
                  size={[0.75, 0.44, 0.12]}
                  color={g === 0 ? P.teal : P.violet}
                  fill={g === 0 ? 0.3 : 0.2}
                />
                {g === 0 && (
                  <Tag position={[0.4, 2.0, 0.15]} tone="teal" size="xs">{t.embedding_b0}</Tag>
                )}
              </group>
            ))}
            <Tag position={[1.35, -0.7, 0.15]} tone="violet" size="xs">{t.block_summary}</Tag>
            {/* in-flight partial */}
            <Slab position={[2.75, -0.55, 0]} size={[0.75, 0.44, 0.12]} color={P.amber} fill={0.3} />
            <Tag position={[2.75, -1.05, 0.15]} tone="amber" size="xs">{t.partial}</Tag>
            {/* softmax into the reader layer */}
            {[0, 3, 6].map((g) => (
              <Flow
                key={g}
                points={[[0.4 + (g % 3) * 0.95, 1.55 - Math.floor(g / 3) * 0.72 - 0.28, 0], [0.9, -1.55, 0]]}
                color={P.violet}
                count={2}
                size={0.04}
                speed={0.22}
              />
            ))}
            <Slab position={[0.9, -1.8, 0]} size={[2.0, 0.4, 0.12]} color={P.violet} fill={0.24} />
            <Tag position={[0.9, -2.2, 0.15]} tone="violet" size="xs">h_l</Tag>
          </>
        )}

        {mode === "abl" && (
          <>
            {/* horizontal bar chart of losses */}
            {rows.map(([name, loss, col], i) => {
              const w = 1.4 + ((loss - minLoss) / (maxLoss - minLoss)) * 2.6;
              const y = 1.5 - i * 0.52;
              return (
                <group key={name}>
                  <Slab position={[-2.9 + w / 2, y, 0]} size={[w, 0.34, 0.1]} color={col} fill={0.32} />
                  <Tag position={[-3.35, y, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "rose"} size="xs">
                    {name}
                  </Tag>
                  <Tag position={[-2.75 + w, y, 0.15]} tone="muted" size="xs">
                    {loss.toFixed(3)}
                  </Tag>
                </group>
              );
            })}
            <Wire points={[[-3.0, -2.0, 0], [3.0, -2.0, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[0, -2.35, 0.15]} tone="muted" size="xs">
              {t.loss} · {t.lower_is_better}
            </Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

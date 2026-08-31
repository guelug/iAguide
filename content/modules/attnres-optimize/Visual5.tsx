"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  Duct,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Algorithm 1, drawn as two desks plus the I/O table.
 *
 * Phase 1 batches the S queries of a block against previous K/V once.
 * Phase 2 walks the block, merging the intra-block partial with online
 * softmax. The I/O mode is the table in one glance: residual 3d, Block
 * 5.5d, Full 24d. This is not the cross-stage cache scene.
 */

type Mode = "phase1" | "phase2" | "io";

const COPY = {
  en: {
    title: "two-phase inference, then the I/O bill",
    hint: "batch previous K/V · merge the partial · 5.5d not 24d",
    phase1: "phase 1",
    phase2: "phase 2",
    io: "I/O",
    legendBatch: "batched previous K/V",
    legendPartial: "intra-block partial",
    legendFull: "Full 24d",
    queries: "S queries",
    prev: "previous blocks",
    stats: "O, max, lse",
    partial: "partial",
    residual: "residual 3d",
    block: "Block 5.5d",
    full: "Full 24d",
    notes: {
      phase1:
        "w_l is a parameter, so the S queries of the block are known up front. One batched attention against previous K/V. You keep output, max, and log-sum-exp — and you read those blocks once, not S times.",
      phase2:
        "The partial depends on f of the previous layer, so Phase 2 loops. Each layer scores one extra key, then merges with Phase 1 via online softmax. You never rebuild an N-by-S score matrix.",
      io: "Table 1, per token per layer: residual 3d, Block two-phase 5.5d, Full two-phase 24d. Block is the production mixer because the I/O stays a handful of d vectors, not because depth attention is free.",
    },
  },
  es: {
    title: "inferencia en dos fases, luego la factura de I/O",
    hint: "agrupa K/V previos · fusiona el parcial · 5.5d no 24d",
    phase1: "fase 1",
    phase2: "fase 2",
    io: "I/O",
    legendBatch: "K/V previos agrupados",
    legendPartial: "parcial intra-bloque",
    legendFull: "Full 24d",
    queries: "S queries",
    prev: "bloques previos",
    stats: "O, max, lse",
    partial: "parcial",
    residual: "residual 3d",
    block: "Block 5.5d",
    full: "Full 24d",
    notes: {
      phase1:
        "w_l es un parámetro, así que las S queries del bloque se conocen de antemano. Una atención agrupada contra las K/V previas. Guardas salida, máximo y log-sum-exp — y lees esos bloques una vez, no S veces.",
      phase2:
        "El parcial depende de f de la capa anterior, así que la Fase 2 recorre. Cada capa puntúa una key extra y fusiona con la Fase 1 vía softmax online. Nunca reconstruyes una matriz N por S.",
      io: "Tabla 1, por token por capa: residual 3d, Block dos fases 5.5d, Full dos fases 24d. Block es el mezclador de producción porque el I/O cabe en un puñado de vectores d, no porque la atención de profundidad sea gratis.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("phase1");

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.violet, label: t.legendBatch },
        { color: P.amber, label: t.legendPartial },
        { color: P.rose, label: t.legendFull },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "phase1", label: t.phase1, tone: P.violet },
            { value: "phase2", label: t.phase2, tone: P.amber },
            { value: "io", label: t.io, tone: P.teal },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[mode]}</strong>
          {" — "}
          {t.notes[mode]}
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={13.2} depth={11.4} y={-0.04} />
        <PlanTrace
          points={[[-5.4, 3.2], [-1.2, 3.2], [-1.2, 0.2]]}
          y={-0.03}
          color={mode === "io" ? P.teal : mode === "phase2" ? P.amber : P.violet}
          opacity={0.65}
        />
        <AxisLine from={[-4.6, 0, 2.1]} to={[4.8, 0, 2.1]} />
        <IsoDust count={42} center={[0, 0.6, 0]} spread={[5.0, 1.0, 3.4]} />

        {mode !== "io" ? (
          <>
            {Array.from({ length: 6 }, (_, i) => (
              <Sheet
                key={`q-${i}`}
                position={[-3.35, 0.05 + i * 0.07, 1.35]}
                size={[1.35, 0.95]}
                color={P.violetWash}
                fill={mode === "phase1" ? 0.9 : 0.35}
                marks={3}
                markColor={P.violet}
              />
            ))}
            <Tag position={[-3.35, 1.55, 1.35]} tone="violet" size="xs">
              {t.queries}
            </Tag>

            {Array.from({ length: 4 }, (_, i) => (
              <Sheet
                key={`k-${i}`}
                position={[0.15 + i * 0.72, 0.05, -0.55]}
                size={[0.62, 0.95]}
                color={P.tealWash}
                fill={mode === "phase1" ? 0.88 : 0.28}
                marks={2}
                markColor={P.teal}
              />
            ))}
            <Tag position={[1.2, 1.35, -0.55]} tone="teal" size="xs">
              {t.prev}
            </Tag>

            <GlassPanel
              position={[3.35, 1.15, 1.45]}
              rotation={ISO}
              size={[2.05, 1.7]}
              color={P.amber}
              opacity={mode === "phase2" ? 0.32 : 0.16}
            />
            <Tag position={[3.35, 2.25, 1.45]} tone="amber" size="xs">
              {mode === "phase1" ? t.stats : t.partial}
            </Tag>
            {mode === "phase1" ? (
              [0, 1, 2].map((i) => (
                <mesh key={i} position={[3.05 + i * 0.28, 0.22, 1.35]} castShadow>
                  <boxGeometry args={[0.2, 0.2, 0.2]} />
                  <meshStandardMaterial color={P.amber} roughness={0.4} />
                </mesh>
              ))
            ) : (
              Array.from({ length: 4 }, (_, i) => (
                <Sheet
                  key={`p-${i}`}
                  position={[3.15, 0.08 + i * 0.11, 1.35]}
                  size={[1.15, 0.85]}
                  color={P.amberWash}
                  fill={0.35 + i * 0.15}
                  marks={2}
                  markColor={P.amber}
                />
              ))
            )}

            <Duct
              from={mode === "phase1" ? [0.9, 0.22, -0.2] : [3.0, 0.35, 1.2]}
              to={mode === "phase1" ? [2.55, 0.55, 1.15] : [-2.4, 0.35, 1.15]}
              color={mode === "phase1" ? P.violet : P.amber}
              radius={0.1}
              bend={0.55}
            />
            <Flow
              points={
                mode === "phase1"
                  ? [
                      [0.7, 0.25, -0.15],
                      [2.4, 0.5, 1.1],
                    ]
                  : [
                      [3.0, 0.4, 1.15],
                      [-2.3, 0.4, 1.1],
                    ]
              }
              color={mode === "phase1" ? P.violet : P.amber}
              count={4}
            />
          </>
        ) : (
          <>
            {[
              { x: -3.1, h: 0.7, color: P.teal, label: t.residual, tone: "teal" as const },
              { x: 0.05, h: 1.25, color: P.amber, label: t.block, tone: "amber" as const },
              { x: 3.2, h: 3.05, color: P.rose, label: t.full, tone: "rose" as const },
            ].map((b) => (
              <group key={b.label}>
                <GlassPanel
                  position={[b.x, 0.12 + b.h / 2, 0.2]}
                  rotation={ISO}
                  size={[2.05, b.h]}
                  color={b.color}
                  opacity={0.3}
                />
                <Tag position={[b.x, b.h + 0.85, 0.2]} tone={b.tone} size="xs">
                  {b.label}
                </Tag>
              </group>
            ))}
          </>
        )}
      </Stage>
    </Figure>
  );
}

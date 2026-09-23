"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, ShadowBlob, Tag, type Cell, type V3 } from "@/components/three/atoms";
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
import { P, mixHex } from "@/lib/palette";
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

function LegacyVisual() {
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

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: el horario del Algoritmo 1 sobre un bloque de S = 16 capas.
 * Ingenuo: cada capa relee los n resúmenes previos (S·n lecturas).
 * Fase 1: las S queries w_l son parámetros, así que se apilan y se puntúan
 * contra los n resúmenes de una vez (n lecturas, una matriz S×n en SRAM).
 * Fase 2: se recorre el bloque; cada capa i ≥ 1 añade una sola key, el
 * parcial, y fusiona con (O, m, ℓ) de la Fase 1 por softmax online.
 */

type AlgoMode = "naive" | "phase1" | "phase2";

const S_LAYERS = 16;
const LAYER_Y0 = 0.5;
const LAYER_DY = 0.17;
const TOWER_X = -2.7;
const GRID_X0 = -1.35;
const GRID_DX = 0.3;
const RACK_X = 2.55;
const PARTIAL_X = -3.7;

const esInt = new Intl.NumberFormat("es-ES");

const layerY = (i: number) => LAYER_Y0 + i * LAYER_DY;

/** Logits didácticos deterministas: capa i, resumen k. */
function scoreRows(n: number) {
  return Array.from({ length: S_LAYERS }, (_, i) => {
    const logits = Array.from({ length: n }, (_, k) => Math.sin(i * 1.7 + k * 2.3) * 1.2 + (k === n - 1 ? 0.6 : 0));
    const m = Math.max(...logits);
    const e = logits.map((s) => Math.exp(s - m));
    const l = e.reduce((a, b) => a + b, 0);
    return { weights: e.map((v) => v / l), m, l };
  });
}

function readsFor(mode: AlgoMode, n: number, cursor: number) {
  if (mode === "naive") return { previous: (cursor + 1) * n, partial: cursor, final: S_LAYERS * n };
  if (mode === "phase1") return { previous: n, partial: 0, final: n };
  return { previous: n, partial: cursor, final: n };
}

/** Avanza un contador desde dentro del Stage: respeta pausa y movimiento reducido. */
function Ticker({ seconds, onTick }: { seconds: number; onTick: () => void }) {
  const { still } = useStage();
  const elapsed = useRef(0);
  useFrame((_, dt) => {
    if (still) {
      elapsed.current = 0;
      return;
    }
    elapsed.current += dt;
    if (elapsed.current >= seconds) {
      elapsed.current = 0;
      onTick();
    }
  });
  return null;
}

function BlockTower({ mode, cursor }: { mode: AlgoMode; cursor: number }) {
  return (
    <group>
      {Array.from({ length: S_LAYERS }, (_, i) => {
        const current = mode !== "phase1" && i === cursor;
        const done = mode === "phase1" || i < cursor;
        const face = current ? (mode === "naive" ? P.rose : P.amber) : done ? mixHex(P.paper, P.teal, 0.6) : "#CFC8B8";
        return (
          <group key={i} position={[TOWER_X, layerY(i), 0]}>
            <RoundedBox args={[1.25, 0.09, 1.0]} radius={0.03} smoothness={2} castShadow receiveShadow>
              <meshPhysicalMaterial color={face} roughness={0.4} clearcoat={0.4} clearcoatRoughness={0.3} />
            </RoundedBox>
            <mesh position={[0.72, 0, 0]} castShadow>
              <boxGeometry args={[0.16, 0.07, 0.16]} />
              <meshPhysicalMaterial color={mode === "phase1" || current ? P.violet : mixHex(P.paper, P.violet, 0.45)} roughness={0.35} clearcoat={0.5} />
            </mesh>
          </group>
        );
      })}
      {[-0.55, 0.55].flatMap((dx) =>
        [-0.42, 0.42].map((dz) => (
          <mesh key={`${dx}:${dz}`} position={[TOWER_X + dx, layerY(S_LAYERS / 2) - 0.08, dz]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, S_LAYERS * LAYER_DY + 0.2, 10]} />
            <meshStandardMaterial color="#8C9895" metalness={0.7} roughness={0.3} />
          </mesh>
        )),
      )}
      <Tag position={[TOWER_X, layerY(S_LAYERS) + 0.22, 0]} tone="ink" size="xs" center>
        bloque · 16 capas
      </Tag>
      <Tag position={[TOWER_X + 0.85, layerY(S_LAYERS - 3), 0.5]} tone="violet" size="xs">
        queries w_l
      </Tag>
    </group>
  );
}

function AlgoBench({ mode, n, cursor }: { mode: AlgoMode; n: number; cursor: number }) {
  const rows = useMemo(() => scoreRows(n), [n]);
  const gridX = (k: number) => GRID_X0 + k * GRID_DX;
  const partialCol = gridX(n) + 0.18;
  const cells = useMemo(() => {
    const out: Cell[] = [];
    rows.forEach((row, i) => {
      const filled = mode === "phase1" || mode === "phase2" || i <= cursor;
      row.weights.forEach((w, k) => {
        const active = mode === "naive" ? i === cursor : mode === "phase1";
        const base = mode === "naive" ? P.rose : P.violet;
        out.push({
          position: [gridX(k), layerY(i), 0],
          scale: [GRID_DX * 0.82, LAYER_DY * 0.7, filled ? 0.12 + w * 0.5 : 0.04],
          color: filled ? mixHex(P.paper, base, (active ? 0.45 : 0.2) + w * 0.55) : "#DAD4C8",
        });
      });
      if (mode === "phase2" && i >= 1 && i <= cursor) {
        out.push({
          position: [partialCol, layerY(i), 0],
          scale: [GRID_DX * 0.82, LAYER_DY * 0.7, 0.35],
          color: i === cursor ? P.amber : mixHex(P.paper, P.amber, 0.55),
        });
      }
    });
    return out;
  }, [rows, mode, cursor, partialCol]);
  const rackX = (k: number) => RACK_X + (k - (n - 1) / 2) * 0.24;
  const rowY = layerY(mode === "phase1" ? S_LAYERS / 2 : cursor);
  const partialH = mode === "phase2" ? Math.max(0.02, cursor * LAYER_DY) : 0.02;

  return (
    <group>
      <ShadowBlob position={[0, 0.004, 0]} scale={10} opacity={0.12} />
      <RoundedBox args={[8.9, 0.24, 2.8]} position={[-0.2, 0.12, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      <BlockTower mode={mode} cursor={cursor} />

      {/* matriz de puntuaciones S × n: vive en SRAM, nunca en HBM */}
      <RoundedBox args={[n * GRID_DX + 0.55, 0.06, 0.9]} position={[GRID_X0 + ((n - 1) * GRID_DX) / 2 + 0.12, 0.27, 0]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#2C3332" roughness={0.45} metalness={0.2} />
      </RoundedBox>
      <Lattice cells={cells} size={1} />
      <Tag position={[GRID_X0 + ((n - 1) * GRID_DX) / 2, layerY(S_LAYERS) + 0.22, 0]} tone={mode === "naive" ? "rose" : "violet"} size="xs" center>
        {`puntuaciones 16×${n}`}
      </Tag>
      {mode === "phase2" ? (
        <Tag position={[partialCol + 0.22, layerY(Math.max(1, cursor)), 0.3]} tone="amber" size="xs">
          + parcial
        </Tag>
      ) : null}

      {/* caché de resúmenes b0…b(n−1) */}
      <RoundedBox args={[n * 0.24 + 0.4, 0.1, 1.2]} position={[RACK_X, 0.29, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.35} />
      </RoundedBox>
      {Array.from({ length: n }, (_, k) => (
        <RoundedBox key={k} args={[0.14, 1.3, 0.95]} position={[rackX(k), 0.99, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.55 + (k / Math.max(1, n)) * 0.35)} roughness={0.38} clearcoat={0.45} />
        </RoundedBox>
      ))}
      <Tag position={[RACK_X, 1.95, 0]} tone="teal" size="xs" center>
        {`${n} resúmenes`}
      </Tag>

      {/* parcial intra-bloque: b ← b + f(h) */}
      <RoundedBox args={[0.5, 0.06, 0.5]} position={[PARTIAL_X, 0.27, 0]} radius={0.02} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.35} />
      </RoundedBox>
      <mesh position={[PARTIAL_X, 0.3 + partialH / 2, 0]} castShadow>
        <boxGeometry args={[0.26, partialH, 0.26]} />
        <meshPhysicalMaterial color={P.amber} roughness={0.35} clearcoat={0.5} />
      </mesh>
      <Tag position={[PARTIAL_X, 0.1, 0.55]} tone="amber" size="xs" center plate={false}>
        parcial
      </Tag>

      {mode === "phase1" ? (
        [0, 5, 10, 15].map((i) => (
          <Flow key={i} points={[[RACK_X - 0.3, 1.0, 0], [gridX(n) + 0.6, layerY(i) + 0.2, 0.2], [gridX(n - 1), layerY(i), 0.1]]} color={P.teal} count={2} size={0.04} speed={0.4} offset={i * 0.07} lineOpacity={0.25} />
        ))
      ) : (
        <Flow points={[[RACK_X - 0.3, 1.0, 0], [gridX(n) + 0.6, rowY + 0.25, 0.2], [gridX(n - 1), rowY, 0.1]]} color={mode === "naive" ? P.rose : P.teal} count={mode === "naive" ? 4 : 1} size={0.045} speed={0.6} lineOpacity={0.3} />
      )}
      {mode === "phase2" ? (
        <Flow points={[[PARTIAL_X, 0.35 + partialH, 0], [PARTIAL_X + 0.4, rowY + 0.3, 0.3], [TOWER_X - 0.62, rowY, 0]]} color={P.amber} count={2} size={0.045} speed={0.55} lineOpacity={0.35} />
      ) : null}
      {mode !== "phase1" ? <Halo position={[TOWER_X, rowY, 0]} radius={0.78} thickness={0.012} color={mode === "naive" ? P.rose : P.amber} opacity={0.9} /> : null}
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<AlgoMode>("phase1");
  const [n, setN] = useState(4);
  const [cursor, setCursor] = useState(0);
  const layer = mode === "phase1" ? S_LAYERS - 1 : cursor;
  const reads = readsFor(mode, n, layer);
  const naiveBlock = S_LAYERS * n;
  const ratio = naiveBlock / n;

  const sentence: Record<AlgoMode, string> = {
    naive: `Ingenuo: la capa ${layer} vuelve a puntuar su w_l contra los ${n} resúmenes. Llevamos ${esInt.format(reads.previous)} lecturas de la caché en este bloque; al terminar serán S·n = ${esInt.format(naiveBlock)}. Es el impuesto O(L·N): la misma caché leída una vez por capa.`,
    phase1: `Fase 1: w_l es un parámetro, no depende de h, así que las 16 queries del bloque se conocen antes de ejecutarlo. Se apilan en Q [16, d] y se puntúan contra K/V [${n}, d] en una sola atención agrupada: ${n} lecturas en lugar de ${naiveBlock}. Por fila se guardan O, el máximo m y ℓ.`,
    phase2: `Fase 2, capa ${layer}: ${layer === 0 ? "la primera capa del bloque no tiene parcial; su h es la salida de la Fase 1 renormalizada." : `puntúa w_l contra el parcial (una key extra, ámbar), fusiona con (O, m, ℓ) de la Fase 1 por softmax online y suma f(h) al parcial. Van ${layer} keys de parcial y ninguna relectura de la caché.`} El bucle es secuencial porque el parcial depende de f de la capa anterior.`,
  };

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
        {[
          ["Lecturas de la caché", esInt.format(reads.previous)],
          ["Keys de parcial", esInt.format(reads.partial)],
          ["Ahorro por bloque", `×${esInt.format(ratio)}`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>{sentence[mode]}</p>
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        I/O por token y capa (L = 128, N = 8, S = 16): residual 3d · Block dos fases (N/S + 5)d = 5,5d · Full dos fases (S + N)d = 24d
      </p>
      <p className="text-xs text-muted">
        Puntuaciones didácticas (senos fijos, softmax por fila); la profundidad de cada celda es su peso. La matriz 16 × n vive en memoria rápida
        del kernel y nunca se escribe en HBM. «Ahorro» compara lecturas de resúmenes previos: S·n frente a n.
      </p>
    </div>
  );

  return (
    <Figure
      label="Inferencia en dos fases (Algoritmo 1)"
      hint="agrupa las 16 queries · fusiona el parcial capa a capa"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "resúmenes previos" },
        { color: P.violet, label: "queries y puntuaciones" },
        { color: P.amber, label: "parcial intra-bloque" },
        { color: P.rose, label: "relectura ingenua" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Horario de inferencia"
            value={mode}
            onChange={(v) => {
              setMode(v);
              setCursor(0);
            }}
            options={[
              { value: "naive", label: "Ingenuo", tone: P.rose },
              { value: "phase1", label: "Fase 1", tone: P.violet },
              { value: "phase2", label: "Fase 2", tone: P.amber },
            ]}
          />
          <Knob label="Resúmenes n" min={1} max={8} value={n} onChange={setN} tone={P.teal} />
          <Readout items={[{ label: "capa", value: mode === "phase1" ? "todas" : String(layer), tone: P.amber }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-4, 5.2, 10.5], fov: 34 }} fit={1.08}>
        <AlgoBench mode={mode} n={n} cursor={layer} />
        {mode !== "phase1" ? <Ticker seconds={0.9} onTick={() => setCursor((c) => (c + 1) % S_LAYERS)} /> : null}
      </Stage>
    </Figure>
  );
}

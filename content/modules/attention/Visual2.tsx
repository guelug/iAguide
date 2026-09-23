"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { RoundedBox } from "@react-three/drei";
import { Color, InstancedMesh, Object3D } from "three";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, hash, useCycle, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Attention: QK^T heatmap, causal mask, multi-head split. */
type Mode = "qk" | "mask" | "heads";

const COPY = {
  en: {
    attention_is_a_soft_choice: "attention is a soft choice",
    qk_mask_heads: "QK^T · causal mask · multi-head",
    qk: "QK^T",
    mask: "causal mask",
    heads: "multi-head",
    each_row_a_distribution: "each row a distribution",
    future_blocked: "future blocked",
    parallel_views: "parallel views",
    head: "head",
  },
  es: {
    attention_is_a_soft_choice: "la atención es una elección suave",
    qk_mask_heads: "QK^T · máscara causal · multi-cabeza",
    qk: "QK^T",
    mask: "máscara causal",
    heads: "multi-cabeza",
    each_row_a_distribution: "cada fila es una distribución",
    future_blocked: "futuro bloqueado",
    parallel_views: "vistas en paralelo",
    head: "cabeza",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("qk");

  const N = 8;
  const heatmap = Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N), c = i % N;
    // soft heat concentrated on the diagonal for illustration
    const v = Math.max(0, 1 - Math.abs(r - c) * 0.25) * (c <= r ? 1 : 0.05);
    return {
      position: [-2.0 + c * 0.45, 1.0 - r * 0.45, 0] as [number, number, number],
      color: v > 0.7 ? P.teal : v > 0.4 ? P.violet : P.muted,
      scale: 0.22 + v * 0.35,
    };
  });

  return (
    <Figure
      label={t.attention_is_a_soft_choice}
      hint={t.qk_mask_heads}
      legend={[
        { color: P.teal, label: t.qk },
        { color: P.rose, label: t.mask },
        { color: P.violet, label: t.heads },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "qk", label: t.qk, tone: P.teal },
            { value: "mask", label: t.mask, tone: P.rose },
            { value: "heads", label: t.heads, tone: P.violet },
          ]}
          ariaLabel={t.attention_is_a_soft_choice}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "qk" && (
          <>
            <Lattice
              cells={heatmap.map((c) => ({ position: c.position, color: c.color }))}
              size={0.32}
              opacity={0.85}
              matte
            />
            <Tag position={[0, 1.8, 0.15]} tone="teal">Q · Kᵀ ≈ α</Tag>
            <Tag position={[0, -1.6, 0.15]} tone="muted" size="xs">{t.each_row_a_distribution}</Tag>
          </>
        )}

        {mode === "mask" && (
          <>
            <Lattice
              cells={heatmap.map((c) => {
                const r = Math.floor((c.position[0] + 2.0) / 0.45);
                const col = Math.floor((1.0 - c.position[1]) / 0.45);
                const blocked = r < col;
                return {
                  ...c,
                  color: blocked ? P.rose : c.color,
                  position: c.position,
                };
              })}
              size={0.32}
              opacity={0.85}
              matte
            />
            {/* the rose fence */}
            <Ribbon
              points={Array.from({ length: 8 }, (_, i) => [-2.0 + i * 0.45, 1.0 - i * 0.45 + 0.22, 0] as [number, number, number])}
              color={P.rose}
              radius={0.03}
              opacity={0.9}
            />
            <Tag position={[0, 1.8, 0.15]} tone="rose">{t.mask}</Tag>
            <Tag position={[1.5, -0.4, 0.15]} tone="rose" size="xs">{t.future_blocked}</Tag>
            <Tag position={[0, -1.6, 0.15]} tone="muted" size="xs">decoder only</Tag>
          </>
        )}

        {mode === "heads" && (
          <>
            {/* three parallel head stacks running the same 8 tokens */}
            {[0, 1, 2].map((h) => (
              <group key={h} position={[(h - 1) * 1.9, 0, 0]}>
                <Slab position={[0, 0.4, 0]} size={[1.5, 1.6, 0.12]} color={[P.teal, P.violet, P.amber][h]} fill={0.18} />
                <Tag position={[0, 1.5, 0.15]} tone={[P.teal, P.violet, P.amber][h] === P.teal ? "teal" : [P.teal, P.violet, P.amber][h] === P.violet ? "violet" : "amber"} size="xs">
                  {t.head} {h + 1}
                </Tag>
                <Lattice
                  cells={Array.from({ length: 4 }, (_, i) => ({
                    position: [-0.55 + i * 0.37, 0.55, 0.1] as [number, number, number],
                    color: [P.teal, P.violet, P.amber][h],
                  }))}
                  size={0.13}
                  opacity={0.9}
                  matte
                />
              </group>
            ))}
            {/* all converge */}
            <Ribbon
              points={[[-1.9, -0.4, 0], [-0.6, -0.9, 0], [0.6, -0.9, 0], [1.9, -0.4, 0]]}
              color={P.lineStrong}
              radius={0.02}
              opacity={0.5}
            />
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">{t.parallel_views}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ======================================================================
 * Versión española: por qué la atención domina el coste.
 *
 * Una matriz de puntuaciones calculada de verdad: n tokens con vectores
 * deterministas de dimensión 4, producto escalado q·k/√d y softmax por
 * fila bajo máscara causal. La altura de cada celda es su peso. Las
 * cuatro estrategias cambian qué celdas se calculan y cuántas acaban
 * escritas en memoria, que es lo que la lección pide contar.
 * ==================================================================== */

type Strategy = "prefill" | "decode" | "window" | "flash";
type CellState = "computed" | "masked" | "outside" | "cached" | "pending";
type ScoreCell = { i: number; j: number; state: CellState; w: number };

const D_HEAD = 4;
const MAX_N = 24;
const PITCH = 0.3;
const TILE = 4;
const MINI = 0.1;

const esNum = (n: number, digits = 0) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

function embedding(i: number) {
  return Array.from({ length: D_HEAD }, (_, k) => hash(i + 1, k + 3) * 2 - 1);
}

function attended(i: number, j: number, strategy: Strategy, windowSize: number) {
  if (j > i) return false;
  if (strategy === "window" && j <= i - windowSize) return false;
  return true;
}

/** Softmax(q·k/√d) row by row over the positions the strategy lets a query see. */
function scoreMatrix(n: number, strategy: Strategy, windowSize: number) {
  const emb = Array.from({ length: n }, (_, i) => embedding(i));
  const weights: number[][] = [];
  for (let i = 0; i < n; i++) {
    const q = emb[i].map((v) => v * 2.4);
    const raw: number[] = [];
    for (let j = 0; j < n; j++) {
      raw.push(attended(i, j, strategy, windowSize) ? q.reduce((s, v, k) => s + v * emb[j][k], 0) / Math.sqrt(D_HEAD) : -Infinity);
    }
    const max = Math.max(...raw);
    const exp = raw.map((s) => (s === -Infinity ? 0 : Math.exp(s - max)));
    const sum = exp.reduce((a, b) => a + b, 0);
    weights.push(exp.map((e) => e / sum));
  }
  return weights;
}

function tilesFor(n: number) {
  const count = Math.ceil(n / TILE);
  const list: { ti: number; tj: number }[] = [];
  for (let ti = 0; ti < count; ti++) for (let tj = 0; tj <= ti; tj++) list.push({ ti, tj });
  return list;
}

/** Q·K products one forward pass performs for one head in one layer. */
function products(n: number, strategy: Strategy, windowSize: number) {
  if (strategy === "decode") return n;
  if (strategy === "window") {
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.min(i + 1, windowSize);
    return s;
  }
  return (n * (n + 1)) / 2;
}

/** Score values a kernel writes to HBM (FP16, one head, one layer). */
function materialized(n: number, strategy: Strategy, windowSize: number) {
  if (strategy === "flash") return 0;
  if (strategy === "decode") return n;
  if (strategy === "window") return products(n, strategy, windowSize);
  return n * n;
}

const STRATEGY_COPY: Record<Strategy, { label: string; tone: string }> = {
  prefill: { label: "Prefill", tone: P.teal },
  decode: { label: "Decode", tone: P.violet },
  window: { label: "Ventana", tone: P.amber },
  flash: { label: "Por bloques", tone: P.inkSoft },
};

function SpanishVisual() {
  const [strategy, setStrategy] = useState<Strategy>("prefill");
  const [n, setN] = useState(12);
  const [windowSize, setWindowSize] = useState(4);
  const count = products(n, strategy, windowSize);
  const doubled = products(2 * n, strategy, windowSize);
  const stored = materialized(n, strategy, windowSize);
  const realBytes = 32768 * 32768 * 2;

  const notes: Record<Strategy, string> = {
    prefill: `En el prefill cada una de las ${n} consultas puntúa todas las claves anteriores y a sí misma: ${esNum(count)} productos Q·K por cabeza y capa, es decir n(n+1)/2. Una implementación ingenua escribe la matriz completa de ${n}×${n} en HBM antes del softmax, incluidas las celdas que la máscara pone a −∞.`,
    decode: `En decode solo existe una consulta nueva, la fila ${n}. Lee las ${n} claves de la caché y hace ${n} productos. Las filas anteriores no se recalculan: sus K y V ya están guardadas. Por eso cada paso cuesta más a medida que el historial crece, aunque solo se escriba un token.`,
    window: `Con ventana deslizante de ${windowSize} posiciones cada consulta solo ve las últimas ${windowSize} claves. Los productos bajan a ${esNum(count)} y crecen de forma lineal con el contexto. El precio: la fila no ve lo que quedó fuera de la banda; se compensa apilando capas.`,
    flash: `FlashAttention hace exactamente los mismos ${esNum(count)} productos que el prefill, pero por bloques de ${TILE}×${TILE} que caben en la SRAM del chip. Cada bloque se normaliza con un softmax acumulado y se descarta: la matriz de puntuaciones nunca se escribe en HBM. Los bloques por encima de la diagonal ni se visitan.`,
  };

  return (
    <Figure
      label="Por qué la atención domina el coste"
      hint={`${n} tokens · d = ${D_HEAD} · una cabeza, una capa`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Peso softmax" },
        { color: P.violet, label: "Fila activa" },
        { color: P.rose, label: "Futuro enmascarado" },
        { color: P.amber, label: "Memoria escrita" },
      ]}
      controls={
        <>
          <Switcher
            ariaLabel="Estrategia de atención"
            value={strategy}
            onChange={setStrategy}
            options={(Object.keys(STRATEGY_COPY) as Strategy[]).map((value) => ({ value, ...STRATEGY_COPY[value] }))}
          />
          <Knob label="Contexto" value={n} min={4} max={MAX_N} onChange={setN} format={(v) => `${v} tokens`} />
          {strategy === "window" ? <Knob label="Ventana" value={windowSize} min={2} max={8} onChange={setWindowSize} tone={P.amber} /> : null}
        </>
      }
      note={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
            {[
              ["Productos Q·K", esNum(count)],
              ["Puntuaciones en HBM", `${esNum(stored)} · ${esNum(stored * 2)} B`],
              ["Al duplicar el contexto", `×${esNum(doubled / count, 1)}`],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className="mt-1 block font-display text-2xl text-ink">{value}</strong>
              </div>
            ))}
          </div>
          <p>{notes[strategy]}</p>
          <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
            peso(i, j) = softmax_j(q_i · k_j / √{D_HEAD}) · máscara j ≤ i{strategy === "window" ? ` y j > i − ${windowSize}` : ""} · a 32 768 tokens la matriz ingenua de una cabeza ocuparía {esNum(realBytes / 2 ** 30)} GiB en FP16.
          </p>
          <p className="text-xs text-muted">
            Vectores deterministas de dimensión 4, no pesos de un modelo real. Las alturas son pesos calculados; cada fila suma 1. La matriz representa un tensor, no una pieza física.
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [6.5, 8, 9.5], fov: 34 }} fit={1.04}>
        <ScoreBench n={n} strategy={strategy} windowSize={windowSize} />
      </Stage>
    </Figure>
  );
}

const CELL_EMPTY = "#D9DDD8";

function ScoreBench({ n, strategy, windowSize }: { n: number; strategy: Strategy; windowSize: number }) {
  const weights = useMemo(() => scoreMatrix(n, strategy, windowSize), [n, strategy, windowSize]);
  const tiles = useMemo(() => tilesFor(n), [n]);
  const [row] = useCycle(n, 0.75, strategy !== "prefill");
  const [tileStep] = useCycle(tiles.length + 2, 0.7, strategy !== "flash");
  const activeRow = strategy === "decode" ? n - 1 : strategy === "prefill" ? row % n : -1;
  const tileIndex = Math.min(tileStep, tiles.length - 1);
  const currentTile = strategy === "flash" ? tiles[tileIndex] : undefined;

  const cells = useMemo<ScoreCell[]>(() => {
    const list: ScoreCell[] = [];
    const doneTile = (i: number, j: number) => {
      const k = tiles.findIndex((t) => t.ti === Math.floor(i / TILE) && t.tj === Math.floor(j / TILE));
      return k <= tileIndex;
    };
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        let state: CellState = "computed";
        if (j > i) state = "masked";
        else if (!attended(i, j, strategy, windowSize)) state = "outside";
        else if (strategy === "decode" && i < n - 1) state = "cached";
        else if (strategy === "flash" && !doneTile(i, j)) state = "pending";
        list.push({ i, j, state, w: weights[i][j] });
      }
    return list;
  }, [n, strategy, windowSize, weights, tiles, tileIndex]);

  const half = ((n - 1) * PITCH) / 2;
  const side = n * PITCH + 0.9;
  const x = (j: number) => j * PITCH - half;
  const z = (i: number) => i * PITCH - half;
  const stored = materialized(n, strategy, windowSize);
  const trayX = side / 2 + 2.1;
  const storedCells = cells.filter((c) => (strategy === "prefill" ? true : strategy === "flash" ? false : c.state === "computed"));

  return (
    <group>
      <ShadowBlob position={[0.9, -0.36, 0.2]} scale={side + 5} opacity={0.1} />
      {/* Tray: dark plinth, paper bed, brass rails along the two axes. */}
      <RoundedBox args={[side + 0.4, 0.26, side + 0.4]} position={[0, -0.2, 0]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#263532" roughness={0.4} metalness={0.3} clearcoat={0.4} />
      </RoundedBox>
      <RoundedBox args={[side, 0.08, side]} position={[0, -0.04, 0]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color={mixHex(P.paper, P.sunken, 0.7)} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.02, -side / 2 - 0.06]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, side, 14]} />
        <meshStandardMaterial color="#B68442" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[-side / 2 - 0.06, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, side, 14]} />
        <meshStandardMaterial color="#B68442" metalness={0.72} roughness={0.28} />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (side / 2 + 0.08), -0.06, sz * (side / 2 + 0.08)]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 10]} />
          <meshStandardMaterial color="#A1A6A4" metalness={0.8} roughness={0.27} />
        </mesh>
      )))}
      {/* Tick marks for every position on both axes. */}
      {Array.from({ length: n }, (_, k) => (
        <group key={k}>
          <mesh position={[x(k), 0.01, -side / 2 + 0.1]}>
            <boxGeometry args={[0.035, 0.02, 0.12]} />
            <meshStandardMaterial color={P.teal} roughness={0.5} />
          </mesh>
          <mesh position={[-side / 2 + 0.1, 0.01, z(k)]}>
            <boxGeometry args={[0.12, 0.02, 0.035]} />
            <meshStandardMaterial color={k === activeRow ? P.violet : P.inkSoft} roughness={0.5} />
          </mesh>
        </group>
      ))}

      <ScoreCells cells={cells} n={n} activeRow={activeRow} x={x} z={z} />
      <CausalStair n={n} x={x} z={z} />

      {activeRow >= 0 ? (
        <mesh position={[0, 0.02, z(activeRow)]}>
          <boxGeometry args={[n * PITCH + 0.12, 0.03, PITCH * 0.96]} />
          <meshBasicMaterial color={P.violet} transparent opacity={0.16} depthWrite={false} />
        </mesh>
      ) : null}
      {strategy === "decode" ? (
        <Flow points={[[x(0), 0.55, z(n - 1)], [x(n - 1), 0.55, z(n - 1)]]} color={P.violet} count={4} size={0.04} speed={0.35} lineOpacity={0.25} />
      ) : null}
      {currentTile ? <TileCage tile={currentTile} n={n} x={x} z={z} sram={[trayX, 0.55, 0.3 + (MAX_N * MINI + 0.3) / 2 + 0.55]} /> : null}
      {strategy === "flash"
        ? tiles.map((t) => {
            const w = Math.min(TILE, n - t.tj * TILE) * PITCH;
            const d = Math.min(TILE, n - t.ti * TILE) * PITCH;
            const cx = x(t.tj * TILE) - PITCH / 2 + w / 2;
            const cz = z(t.ti * TILE) - PITCH / 2 + d / 2;
            return (
              <group key={`${t.ti}-${t.tj}`} position={[cx, 0.004, cz]}>
                {[[0, -d / 2, w, 0.03], [0, d / 2, w, 0.03], [-w / 2, 0, 0.03, d], [w / 2, 0, 0.03, d]].map(([px, pz, sx, sz], k) => (
                  <mesh key={k} position={[px, 0, pz]}>
                    <boxGeometry args={[sx, 0.012, sz]} />
                    <meshStandardMaterial color={P.amber} roughness={0.4} />
                  </mesh>
                ))}
              </group>
            );
          })
        : null}

      <Tag position={[0, 0.25, -side / 2 - 0.45]} tone="teal" center>Claves K</Tag>
      <Tag position={[-side / 2 - 0.55, 0.25, 0]} tone="ink" center>Consultas Q</Tag>
      <Tag position={[half * 0.55, 0.2, -half * 0.55]} tone="rose" size="xs" center>Futuro enmascarado</Tag>
      {activeRow >= 0 ? <Tag position={[half + 0.75, 0.3, z(activeRow)]} tone="violet" size="xs" center>{strategy === "decode" ? "Token nuevo" : "Σ fila = 1"}</Tag> : null}

      <MemoryTray x={trayX} stored={storedCells} count={stored} flash={strategy === "flash"} />
    </group>
  );
}

function ScoreCells({ cells, n, activeRow, x, z }: { cells: ScoreCell[]; n: number; activeRow: number; x: (j: number) => number; z: (i: number) => number }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    cells.forEach((cell, k) => {
      const live = cell.state === "computed";
      const h = live ? 0.05 + cell.w * 1.25 : cell.state === "masked" ? 0.02 : 0.035;
      o.position.set(x(cell.j), h / 2, z(cell.i));
      o.scale.set(PITCH * 0.82, h, PITCH * 0.82);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
      if (cell.state === "masked") c.set(mixHex(P.roseWash, P.rose, 0.35));
      else if (!live) c.set(CELL_EMPTY);
      else if (cell.i === activeRow) c.set(mixHex(P.violetWash, P.violet, 0.45 + 0.55 * Math.sqrt(cell.w)));
      else c.set(mixHex("#DCE9E6", P.teal, 0.3 + 0.7 * Math.sqrt(cell.w)));
      m.setColorAt(k, c);
    });
    for (let k = cells.length; k < MAX_N * MAX_N; k++) {
      o.scale.set(0, 0, 0);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
    }
    m.count = n * n;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    m.computeBoundingBox();
  }, [cells, n, activeRow, x, z]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_N * MAX_N]} castShadow receiveShadow>
      <boxGeometry />
      <meshPhysicalMaterial roughness={0.34} metalness={0.05} clearcoat={0.4} clearcoatRoughness={0.3} />
    </instancedMesh>
  );
}

/** The causal boundary as a low stepped wall between j = i and j = i + 1. */
function CausalStair({ n, x, z }: { n: number; x: (j: number) => number; z: (i: number) => number }) {
  const pieces: { p: V3; s: V3 }[] = [];
  for (let i = 0; i < n - 1; i++) {
    pieces.push({ p: [x(i) + PITCH / 2, 0.07, z(i)], s: [0.025, 0.14, PITCH] });
    pieces.push({ p: [x(i) + PITCH, 0.07, z(i) + PITCH / 2], s: [PITCH, 0.14, 0.025] });
  }
  return (
    <group>
      {pieces.map((piece, k) => (
        <mesh key={k} position={piece.p} castShadow>
          <boxGeometry args={piece.s} />
          <meshStandardMaterial color={P.rose} roughness={0.45} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** Scores written to HBM, one mini cell per stored FP16 value at its (i, j); SRAM chip for the tiled kernel. */
function MemoryTray({ x, stored, count, flash }: { x: number; stored: ScoreCell[]; count: number; flash: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const side = MAX_N * MINI + 0.3;
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    for (let k = 0; k < MAX_N * MAX_N; k++) {
      const cell = stored[k];
      if (cell) {
        o.position.set(cell.j * MINI - ((MAX_N - 1) * MINI) / 2, 0.1, cell.i * MINI - ((MAX_N - 1) * MINI) / 2);
        o.scale.set(MINI * 0.8, 0.06, MINI * 0.8);
        c.set(cell.state === "masked" ? mixHex(P.amber, P.rose, 0.55) : P.amber);
      } else {
        o.position.set(0, 0, 0);
        o.scale.set(0, 0, 0);
        c.set(P.amber);
      }
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
      m.setColorAt(k, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [stored]);
  return (
    <group position={[x, -0.1, 0.3]}>
      <RoundedBox args={[side, 0.14, side]} radius={0.05} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color="#2F3B39" roughness={0.42} metalness={0.3} clearcoat={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.072, 0]}>
        <boxGeometry args={[MAX_N * MINI + 0.04, 0.004, MAX_N * MINI + 0.04]} />
        <meshStandardMaterial color="#3E4B48" roughness={0.6} />
      </mesh>
      {Array.from({ length: 6 }, (_, k) => (
        <mesh key={k} position={[-side / 2 - 0.05, -0.02, (k - 2.5) * 0.4]}>
          <boxGeometry args={[0.08, 0.06, 0.22]} />
          <meshStandardMaterial color="#B6914B" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <instancedMesh ref={mesh} args={[undefined, undefined, MAX_N * MAX_N]} castShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.4} metalness={0.15} />
      </instancedMesh>
      <Tag position={[0, 0.35, -side / 2 - 0.25]} tone="amber" size="xs" center>HBM · puntuaciones</Tag>
      {count === 0 ? <Tag position={[0, 0.3, 0]} tone="muted" size="xs" center>0 B escritos</Tag> : null}
      {flash ? (
        <group position={[0, 0.65, side / 2 + 0.55]}>
          <RoundedBox args={[0.7, 0.16, 0.7]} radius={0.04} smoothness={2} castShadow>
            <meshPhysicalMaterial color="#3A3F44" roughness={0.3} metalness={0.5} clearcoat={0.5} />
          </RoundedBox>
          {Array.from({ length: TILE * TILE }, (_, k) => (
            <mesh key={k} position={[((k % TILE) - 1.5) * 0.13, 0.1, (Math.floor(k / TILE) - 1.5) * 0.13]}>
              <boxGeometry args={[0.1, 0.04, 0.1]} />
              <meshStandardMaterial color={P.amber} roughness={0.4} />
            </mesh>
          ))}
          <Tag position={[0.75, 0.15, 0]} tone="amber" size="xs">SRAM</Tag>
        </group>
      ) : null}
    </group>
  );
}

/** Wire cage over the block currently loaded on chip, and its trip to SRAM. */
function TileCage({ tile, n, x, z, sram }: { tile: { ti: number; tj: number }; n: number; x: (j: number) => number; z: (i: number) => number; sram: V3 }) {
  const w = Math.min(TILE, n - tile.tj * TILE) * PITCH + 0.04;
  const d = Math.min(TILE, n - tile.ti * TILE) * PITCH + 0.04;
  const cx = x(tile.tj * TILE) - PITCH / 2 + w / 2 - 0.02;
  const cz = z(tile.ti * TILE) - PITCH / 2 + d / 2 - 0.02;
  const h = 1.45;
  const corners: [number, number][] = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  return (
    <group>
      <group position={[cx, 0, cz]}>
        <Wire points={[...corners.map(([a, b]) => [a, h, b] as V3), [corners[0][0], h, corners[0][1]]]} color={P.amberDeep} width={1.6} opacity={0.9} />
        {corners.map(([a, b], k) => <Wire key={k} points={[[a, 0.02, b], [a, h, b]]} color={P.amberDeep} width={1} opacity={0.6} />)}
        <mesh position={[0, h, 0]}>
          <boxGeometry args={[w, 0.01, d]} />
          <meshBasicMaterial color={P.amber} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </group>
      <Flow points={[[cx, h, cz], [(cx + sram[0]) / 2, h + 0.5, (cz + sram[2]) / 2], sram]} color={P.amber} count={3} size={0.04} speed={0.5} lineOpacity={0.3} />
    </group>
  );
}

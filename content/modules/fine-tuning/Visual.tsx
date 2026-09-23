"use client";

import { useState, useLayoutEffect, useMemo, useRef } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, Ribbon, Slab, Tag, Wire, Arrow, ShadowBlob, hash } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { RoundedBox } from "@react-three/drei";
import { Color, InstancedMesh, Object3D } from "three";
import { useLocale } from "next-intl";

type Mode = "base" | "lora" | "merge";

function LegacyVisual() {
  const [mode, setMode] = useState<Mode>("base");

  // Frozen weight matrix — visualised as a 4x4 grid of cells.
  const W = Array.from({ length: 16 }, (_, i) => {
    const c = i % 4;
    const r = Math.floor(i / 4);
    return {
      position: [-1.85 + c * 0.32, 0.65 - r * 0.32, 0] as [number, number, number],
      scale: 1,
      color: P.teal,
    };
  });

  // LoRA matrices A and B — tall thin strips.
  const A = Array.from({ length: 4 }, (_, i) => ({
    position: [0.95, 0.65 - i * 0.32, 0] as [number, number, number],
    scale: 1,
    color: P.amber,
  }));
  const B = Array.from({ length: 4 }, (_, i) => ({
    position: [1.6, 0.65 - i * 0.32, 0] as [number, number, number],
    scale: 1,
    color: P.amber,
  }));

  return (
    <Figure
      label="LoRA delta"
      hint="a thin rectangle, not a new brain"
      legend={[
        { color: P.teal, label: "frozen W" },
        { color: P.amber, label: "BA" },
        { color: P.violet, label: "served W'" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "base", label: "Base W", tone: P.teal },
            { value: "lora", label: "LoRA", tone: P.amber },
            { value: "merge", label: "Merge", tone: P.violet },
          ]}
          ariaLabel="a thin rectangle, not a new brain"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 9], fov: 38 }}>
        <Motes count={100} radius={6.5} color={P.faint} size={0.025} opacity={0.32} />

        {/* Frozen W on the left — always there, never moves. */}
        <Lattice cells={W} size={0.27} matte />
        <Slab position={[-1.85, 0.0, -0.1]} size={[1.4, 1.4, 0.08]} color={P.line} fill={0.08} />
        <Tag position={[-1.85, 1.5, 0.2]} tone="teal">W · frozen</Tag>

        {/* LoRA strips — appear in lora + merge modes. */}
        {(mode === "lora" || mode === "merge") && (
          <>
            <Lattice cells={A} size={0.18} matte />
            <Lattice cells={B} size={0.18} matte />
            <Tag position={[1.25, 1.5, 0.2]} tone="amber">A · B (rank r)</Tag>
            {/* Multiplication arrow. */}
            <Flow points={[[1.1, 0.0, 0], [1.45, 0.0, 0]]} color={P.amber} count={2} />
            <Tag position={[1.27, -0.55, 0.2]} tone="muted">BA</Tag>
          </>
        )}

        {/* Merge mode — a violet slab showing W' served. */}
        {mode === "merge" && (
          <>
            <Slab position={[-1.85, 0.0, 0.1]} size={[1.4, 1.4, 0.08]} color={P.violet} fill={0.3} />
            <Halo position={[-1.85, 0.0, 0.18]} radius={0.85} color={P.violet} opacity={0.4} spin={0.4} />
            <Ribbon
              points={[
                [1.78, 0.0, 0],
                [2.5, 0.0, 0],
                [2.5, 0.5, 0],
                [-0.7, 0.5, 0],
                [-0.95, 0.0, 0],
              ]}
              color={P.violet}
              radius={0.04}
              opacity={0.7}
            />
            <Tag position={[-1.85, -1.55, 0.2]} tone="violet">{"W' = W + (α/r) BA"}</Tag>
            {/* "served" indicator. */}
            <Node3D position={[3.6, 0.0, 0]} color={P.violet} radius={0.22} pulse={0.5} />
            <Tag position={[3.6, 0.45, 0.2]} tone="violet">served</Tag>
            <Flow
              points={[
                [2.5, 0.0, 0],
                [3.3, 0.0, 0],
              ]}
              color={P.violet}
              count={3}
              speed={0.5}
            />
          </>
        )}

        {/* LoRA-only: highlight that gradients only touch A and B. */}
        {mode === "lora" && (
          <>
            <Halo position={[1.25, 0.0, 0.1]} radius={0.6} color={P.amber} opacity={0.5} spin={0.6} />
            <Slab position={[1.25, -1.5, 0]} size={[1.5, 0.5, 0.1]} color={P.amber} fill={0.16} />
            <Tag position={[1.25, -1.85, 0.2]} tone="amber">gradients only here</Tag>
            {/* W ghost outline to remind user nothing moves. */}
            <Wire
              points={[
                [-2.55, 0.65, 0],
                [-1.15, 0.65, 0],
                [-1.15, -0.65, 0],
                [-2.55, -0.65, 0],
                [-2.55, 0.65, 0],
              ]}
              color={P.lineStrong}
              opacity={0.6}
              dashed
            />
          </>
        )}

        {/* Footer. */}
        <Slab position={[0, -2.6, 0]} size={[9.0, 0.4, 0.1]} color={P.line} fill={0.08} />
        <Tag position={[0, -2.6, 0.2]} tone="muted">
          {mode === "base"
            ? "frozen base model · no adaptation yet"
            : mode === "lora"
              ? "LoRA learns ΔW = (α/r) BA; A and B only"
              : "merge_and_unload: W' is one dense matrix, served at full speed"}
        </Tag>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * LoRA en miniatura, calculado. W es una matriz 8×8 de valores fijos
 * (alturas de las celdas). B es 8×r y A es r×8; ΔW = (α/r)·B·A se calcula
 * aquí celda a celda. B empieza en cero, así que al arrancar ΔW = 0 y
 * W' = W. Tras «entrenar» usamos valores fijos didácticos para A y B (no
 * son el resultado de un entrenamiento real). Al fusionar, las celdas pasan
 * a ser W' = W + ΔW: una sola matriz densa, servida a coste de base.
 *
 * Las cifras a escala real usan la fórmula de la lección: parámetros por
 * matriz = r·(d + k), con d = k = 4096, dos módulos (q_proj, v_proj) y 32
 * capas.
 */

type FtMode = "base" | "init" | "trained" | "merged";

const N = 8;
const ALPHA_OVER_R = 2; // alpha = 2r, la receta habitual de la lección
const RANKS = [4, 8, 16, 32, 64];
const D = 4096;
const LAYERS = 32;
const MODULES = 2;

function wValue(i: number, j: number) {
  return 0.45 + 0.55 * hash(i * N + j, 3.1);
}

/** Fixed, didactic trained factors. Row i of B, column j of A. */
function bValue(i: number, c: number) {
  return (hash(i * 7 + c, 5.7) - 0.45) * 0.34;
}
function aValue(c: number, j: number) {
  return (hash(c * 11 + j, 9.3) - 0.4) * 0.34;
}

type Mats = { W: number[][]; B: number[][]; A: number[][]; dW: number[][]; Wp: number[][] };

function computeMats(r: number, trained: boolean): Mats {
  const W = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => wValue(i, j)));
  const B = Array.from({ length: N }, (_, i) => Array.from({ length: r }, (_, c) => (trained ? bValue(i, c) : 0)));
  const A = Array.from({ length: r }, (_, c) => Array.from({ length: N }, (_, j) => aValue(c, j)));
  const dW = W.map((row, i) => row.map((_, j) => {
    let s = 0;
    for (let c = 0; c < r; c++) s += B[i][c] * A[c][j];
    return ALPHA_OVER_R * s;
  }));
  const Wp = W.map((row, i) => row.map((w, j) => w + dW[i][j]));
  return { W, B, A, dW, Wp };
}

const FM = {
  base: "#2e3437",
  baseTop: "#434a4e",
  brass: "#b68442",
  steel: "#a1a8ab",
  ceramic: "#efebe2",
};

const PITCH = 0.36;
const CELL = 0.29;
const HSCALE = 0.95;

const tmp = new Object3D();
const tmpColor = new Color();

/** Instanced column field: one column per matrix entry, height = value. */
function Field({
  rows,
  cols,
  value,
  color,
  origin,
  lift = () => 0,
  opacity = 1,
  pitch = PITCH,
  scale = HSCALE,
  base = 0,
  shadow = true,
}: {
  rows: number;
  cols: number;
  value: (i: number, j: number) => number;
  color: (i: number, j: number, v: number) => string;
  origin: [number, number, number];
  lift?: (i: number, j: number) => number;
  opacity?: number;
  pitch?: number;
  scale?: number;
  base?: number;
  shadow?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let k = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const v = value(i, j);
        const h = Math.max(0.012, base + Math.abs(v) * scale);
        tmp.position.set((j - (cols - 1) / 2) * pitch, lift(i, j) + h / 2, (i - (rows - 1) / 2) * pitch);
        tmp.scale.set(CELL * (pitch / PITCH), h, CELL * (pitch / PITCH));
        tmp.updateMatrix();
        mesh.setMatrixAt(k, tmp.matrix);
        mesh.setColorAt(k, tmpColor.set(color(i, j, v)));
        k++;
      }
    }
    mesh.count = k;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
  });
  return (
    <group position={origin}>
      <instancedMesh ref={ref} args={[undefined, undefined, rows * cols]} castShadow={shadow} receiveShadow>
        <boxGeometry />
        <meshPhysicalMaterial roughness={0.38} clearcoat={0.4} clearcoatRoughness={0.3} transparent={opacity < 1} opacity={opacity} />
      </instancedMesh>
    </group>
  );
}

function Padlock({ position, shut }: { position: [number, number, number]; shut: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.42, 0.34, 0.2]} position={[0, 0.17, 0]} radius={0.05} smoothness={2} castShadow>
        <meshPhysicalMaterial color={shut ? FM.brass : FM.steel} metalness={0.75} roughness={0.28} clearcoat={0.4} />
      </RoundedBox>
      <mesh position={[0, shut ? 0.4 : 0.5, 0]} castShadow>
        <torusGeometry args={[0.13, 0.03, 10, 24, Math.PI]} />
        <meshStandardMaterial color={FM.steel} metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Plinth({ w, d, position, tone }: { w: number; d: number; position: [number, number, number]; tone: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[w, 0.14, d]} position={[0, 0.07, 0]} radius={0.05} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={FM.ceramic} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.145, d / 2 - 0.06]}>
        <boxGeometry args={[w - 0.14, 0.012, 0.035]} />
        <meshStandardMaterial color={tone} roughness={0.4} />
      </mesh>
    </group>
  );
}

function LoraScene({ mode, r }: { mode: FtMode; r: number }) {
  const trained = mode === "trained" || mode === "merged";
  const m = useMemo(() => computeMats(r, trained), [r, trained]);
  const showAB = mode !== "base";
  const merged = mode === "merged";
  const bX = -2.45; // B column to the left of W
  const aZ = -2.4; // A row behind W
  const factorPitch = 0.3;
  return (
    <group>
      <ShadowBlob position={[0, -0.36, 0]} scale={8.5} opacity={0.13} />
      <RoundedBox args={[6.9, 0.3, 6.5]} position={[-0.6, -0.2, -0.5]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={FM.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[6.5, 0.07, 6.1]} position={[-0.6, -0.02, -0.5]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={FM.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>

      {/* W: the frozen base matrix (or W' once merged). */}
      <Plinth w={3.2} d={3.2} position={[0, 0, 0]} tone={merged ? P.violet : P.teal} />
      <Field
        rows={N}
        cols={N}
        origin={[0, 0.15, 0]}
        value={(i, j) => (merged ? m.Wp[i][j] : m.W[i][j])}
        color={(i, j) => (merged ? mixHex(P.paper, P.violet, 0.45 + 0.4 * Math.min(1, Math.abs(m.dW[i][j]) * 6)) : mixHex(P.paper, P.teal, 0.3 + 0.35 * m.W[i][j]))}
      />
      {/* ΔW as a translucent layer riding on top of W while it is still separate. */}
      {mode === "trained" ? (
        <Field
          rows={N}
          cols={N}
          origin={[0, 0.15, 0]}
          lift={(i, j) => m.W[i][j] * HSCALE + 0.02}
          value={(i, j) => m.dW[i][j]}
          color={(i, j) => (m.dW[i][j] >= 0 ? P.amber : P.rose)}
          opacity={0.85}
          shadow={false}
        />
      ) : null}
      {mode !== "merged" ? <Padlock position={[-1.2, 0.15, 1.95]} shut={true} /> : null}
      <Tag position={[0, 1.55, 0]} tone={merged ? "violet" : "teal"} center>{merged ? "W′ fusionada" : "W congelada"}</Tag>

      {showAB && !merged ? (
        <>
          {/* B: d × r, standing to the left. */}
          <Plinth w={0.3 * r + 0.4} d={3.2} position={[bX, 0, 0]} tone={P.amber} />
          <Field rows={N} cols={r} origin={[bX, 0.15, 0]} pitch={factorPitch} scale={4} base={0.06} value={(i, c) => m.B[i][c]} color={(i, c) => (mode === "init" ? "#cfcac0" : m.B[i][c] >= 0 ? P.amber : P.rose)} />
          <Tag position={[bX, 0.95, 1.85]} tone="amber" size="xs" center>{mode === "init" ? "B = 0" : "B · d×r"}</Tag>
          {/* A: r × k, lying behind. */}
          <Plinth w={3.2} d={0.3 * r + 0.4} position={[0, 0, aZ]} tone={P.amber} />
          <Field rows={r} cols={N} origin={[0, 0.15, aZ]} pitch={factorPitch} scale={4} base={0.06} value={(c, j) => m.A[c][j]} color={(c, j) => (m.A[c][j] >= 0 ? P.amber : P.rose)} />
          <Tag position={[1.95, 0.55, aZ]} tone="amber" size="xs" center>A · r×k</Tag>
          <Arrow from={[bX + 0.4 + 0.15 * r, 0.6, 0]} to={[-1.55, 0.6, 0]} color={P.amber} width={1.6} head={0.1} />
          <Arrow from={[0, 0.6, aZ + 0.35 + 0.15 * r]} to={[0, 0.6, -1.55]} color={P.amber} width={1.6} head={0.1} />
        </>
      ) : null}
      {merged ? (
        <Tag position={[bX, 0.4, 0]} tone="muted" size="xs" center>A y B absorbidas</Tag>
      ) : null}
      {mode === "trained" ? <Tag position={[1.75, 0.9, 0.9]} tone="amber" size="xs">ΔW = (α/r)·B·A</Tag> : null}
    </group>
  );
}

const fmt = (n: number) => new Intl.NumberFormat("es-ES").format(n);
const fmtM = (n: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n / 1e6) + " M";

const FT_TEXT: Record<FtMode, string> = {
  base: "La matriz W del modelo base: cada columna es un peso. En LoRA nunca recibe gradiente; queda bajo candado.",
  init: "Se añaden A (aleatoria) y B (a cero). Como B = 0, el producto B·A es cero y W′ = W: el modelo arranca idéntico al base.",
  trained: "Sólo A y B se han movido. Su producto escalado ΔW = (α/r)·B·A es una capa fina (ámbar suma, rosa resta) sobre W, que sigue intacta.",
  merged: "merge_and_unload suma ΔW dentro de W. Queda una sola matriz densa W′: A y B desaparecen y se sirve al mismo coste que el base.",
};

function SpanishVisual() {
  const [mode, setMode] = useState<FtMode>("base");
  const [rankIndex, setRankIndex] = useState(2);
  const rReal = RANKS[rankIndex];
  const rMini = rankIndex + 1;
  const perMatrixFull = D * D;
  const perMatrixLora = rReal * (D + D);
  const total = perMatrixLora * MODULES * LAYERS;
  const mats = useMemo(() => computeMats(rMini, mode === "trained" || mode === "merged"), [rMini, mode]);
  const maxDelta = Math.max(...mats.dW.flat().map(Math.abs));
  return (
    <Figure
      label="LoRA: una corrección fina sobre W congelada"
      hint="W′ = W + (α/r)·B·A"
      height="h-[460px] md:h-[560px]"
      legend={[
        { color: P.teal, label: "W congelada" },
        { color: P.amber, label: "A, B y ΔW" },
        { color: P.violet, label: "W′ servida" },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "base", label: "Base", tone: P.teal },
              { value: "init", label: "B = 0", tone: P.amber },
              { value: "trained", label: "Entrenado", tone: P.amber },
              { value: "merged", label: "Fusionado", tone: P.violet },
            ]}
            ariaLabel="Estado del adaptador LoRA"
          />
          <Knob label="rango r" value={rankIndex} min={0} max={RANKS.length - 1} onChange={setRankIndex} format={(v) => String(RANKS[v])} tone="var(--amber)" />
        </>
      }
      note={
        <div className="space-y-3">
          <p><strong>{FT_TEXT[mode]}</strong></p>
          <Readout
            items={[
              { label: "W por matriz", value: fmtM(perMatrixFull), tone: "var(--teal)" },
              { label: "A + B por matriz", value: fmt(perMatrixLora), tone: "var(--amber)" },
              { label: "fracción", value: ((perMatrixLora / perMatrixFull) * 100).toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " %", tone: "var(--amber)" },
              { label: "adaptador (q, v × 32 capas)", value: fmtM(total), tone: "var(--violet)" },
              { label: "|ΔW| máx. maqueta", value: maxDelta.toFixed(3), tone: "var(--rose)" },
            ]}
          />
          <p className="font-mono text-xs">r·(d + k) = {rReal} × (4096 + 4096) = {fmt(perMatrixLora)} parámetros entrenables por matriz, frente a 4096 × 4096 = {fmt(perMatrixFull)}.</p>
          <p className="text-xs text-muted">
            Cifras a escala d = k = 4096 con la fórmula de la lección. La maqueta es una matriz 8×8 con {rMini} {rMini === 1 ? "columna" : "columnas"} en B y {rMini === 1 ? "fila" : "filas"} en A (r de la maqueta crece con el mando, no con el valor real); α = 2r. Los valores de A y B «entrenados» son fijos y didácticos, no salen de un entrenamiento. El producto ΔW sí se calcula aquí celda a celda.
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [4.6, 6.8, 7.6], fov: 32 }} fit={0.98}>
        <LoraScene mode={mode} r={rMini} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

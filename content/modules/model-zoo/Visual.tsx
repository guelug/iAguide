"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Color, InstancedMesh, Object3D } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, PointerTilt, ShadowBlob, Slab, Tag, hash, useCycle } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "open" | "closed" | "moe";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "read_the_card": "read the card",
      "step_the_figure": "step the figure",
      "open_weights": "open weights",
      "open_weights_2": "Open weights"
    },
    es: {
      "read_the_card": "lee la ficha",
      "step_the_figure": "recorre la figura",
      "open_weights": "pesos abiertos",
      "open_weights_2": "Pesos abiertos"
    },
  });
  const [mode, setMode] = useState<Mode>("open");
  return (
    <Figure
      label={t.read_the_card}
      hint={t.step_the_figure}
      legend={[
          { color: P.teal, label: t.open_weights },
          { color: P.amber, label: "api" },
          { color: P.violet, label: "moe" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "open", label: t.open_weights_2, tone: P.teal },
            { value: "closed", label: "API", tone: P.amber },
            { value: "moe", label: "MoE", tone: P.violet }
          ]}
          ariaLabel={t.step_the_figure}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 8.5], fov: 40 }}>

        {/* Open weights — large file slab */}
        <Slab
          position={[-2.6, 0.0, 0]}
          size={[2.1, 1.7, 0.12]}
          color={P.teal}
          fill={mode === "open" ? 0.34 : 0.14}
        />
        <Tag position={[-2.6, 1.05, 0.2]} tone="teal">pesos abiertos</Tag>
        {mode === "open" ? (
          <Tag position={[-2.6, -1.05, 0.2]} tone="teal">descargable · tuyos</Tag>
        ) : null}

        {/* Closed API — small key icon */}
        <Slab
          position={[0, 0.0, 0]}
          size={[1.5, 1.0, 0.12]}
          color={P.amber}
          fill={mode === "closed" ? 0.34 : 0.14}
        />
        <Tag position={[0, 0.85, 0.2]} tone="amber">API cerrada</Tag>
        {mode === "closed" ? (
          <>
            <Slab position={[0, -0.55, 0.05]} size={[0.8, 0.3, 0.08]} color={P.amber} fill={0.50} />
            <Tag position={[0, -1.0, 0.2]} tone="amber">alquilas tokens</Tag>
          </>
        ) : null}

        {/* MoE — 8 expert mini-slabs */}
        <Slab
          position={[2.6, 0.0, 0]}
          size={[2.1, 1.7, 0.12]}
          color={P.violet}
          fill={mode === "moe" ? 0.18 : 0.10}
        />
        <Tag position={[2.6, 1.05, 0.2]} tone="violet">MoE</Tag>
        {mode === "moe" ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <Slab
                key={i}
                position={[1.7 + (i % 4) * 0.6, -0.4 + Math.floor(i / 4) * 0.6, 0.05]}
                size={[0.45, 0.4, 0.08]}
                color={i < 2 ? P.teal : P.violet}
                fill={i < 2 ? 0.50 : 0.20}
              />
            ))}
            <Tag position={[2.6, -0.95, 0.2]} tone="violet">2 activos · 8 totales</Tag>
          </>
        ) : null}

      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * Memoria frente a cómputo. Cada cubo es 1.000 millones de parámetros.
 * Todos los cubos ocupan memoria (totales × bytes por parámetro); solo los
 * encendidos trabajan en cada token (≈ 2 × activos FLOP). En un MoE el
 * router cambia qué cubos se encienden de un token a otro: la posición es
 * ilustrativa, la cantidad no.
 */

type ModelId = "dense" | "a3b" | "mixtral";
type Precision = "fp16" | "q8" | "q4";

const MODELS: Record<ModelId, { label: string; total: number; active: number; moe: boolean; source: string }> = {
  dense: { label: "Dense 8B", total: 8, active: 8, moe: false, source: "dense de 8B: todos los parámetros en cada token" },
  a3b: { label: "A3B 48B/3B", total: 48, active: 3, moe: true, source: "el ejemplo A3B de la lección: 48B totales, 3B activos" },
  mixtral: { label: "Mixtral 8×7B", total: 46.7, active: 12.9, moe: true, source: "Mixtral 8×7B (Jiang et al., 2024): 46,7B totales, 12,9B activos" },
};
const BYTES: Record<Precision, { label: string; b: number }> = {
  fp16: { label: "FP16", b: 2 },
  q8: { label: "Q8", b: 1 },
  q4: { label: "Q4", b: 0.6 },
};
const num = (n: number, d = 1) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: d }).format(n);

function budget(model: ModelId, prec: Precision) {
  const m = MODELS[model];
  const memGB = m.total * BYTES[prec].b;
  const gflop = 2 * m.active;
  return { ...m, memGB, gflop, cubes: Math.round(m.total), lit: Math.round(m.active) };
}

const MZ = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };
const COLS = 8;
const PITCH = 0.42;
const tmpObj = new Object3D();
const tmpCol = new Color();

function ZMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

/* Qué cubos trabajan en el token t: todos en dense; un subconjunto del
   tamaño exacto de los activos en MoE, distinto en cada token. */
function litSet(cubes: number, lit: number, token: number, moe: boolean) {
  if (!moe) return new Set(Array.from({ length: cubes }, (_, i) => i));
  const order = Array.from({ length: cubes }, (_, i) => i).sort((a, b) => hash(a, token + 1) - hash(b, token + 1));
  return new Set(order.slice(0, lit));
}

function ParamGrid({ cubes, lit, moe, color }: { cubes: number; lit: number; moe: boolean; color: string }) {
  const ref = useRef<InstancedMesh>(null);
  const { still } = useStage();
  const [token] = useCycle(6, 1.2);
  const t = still ? 0 : token;
  const rows = Math.ceil(cubes / COLS);
  const on = useMemo(() => litSet(cubes, lit, t, moe), [cubes, lit, t, moe]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < 48; i++) {
      const c = i % COLS;
      const r = Math.floor(i / COLS);
      const visible = i < cubes;
      const active = on.has(i);
      tmpObj.position.set((c - (COLS - 1) / 2) * PITCH, active ? 0.08 : 0, (r - (rows - 1) / 2) * PITCH);
      tmpObj.scale.setScalar(visible ? 0.33 : 0.0001);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
      tmpCol.set(active ? color : mixHex(P.paper, "#9AA09C", 0.5));
      mesh.setColorAt(i, tmpCol);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [cubes, on, rows, color]);
  const depth = rows * PITCH + 0.35;
  return (
    <group position={[-0.9, -0.25, 0]}>
      <RoundedBox position={[0, -0.26, 0]} args={[COLS * PITCH + 0.4, 0.14, Math.max(1.4, depth)]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <ZMat color={MZ.graphite} metal={0.3} />
      </RoundedBox>
      <instancedMesh ref={ref} args={[undefined, undefined, 48]} castShadow receiveShadow>
        <boxGeometry />
        <meshPhysicalMaterial roughness={0.35} clearcoat={0.5} metalness={0.05} />
      </instancedMesh>
      <Tag position={[0, -0.2, Math.max(1.4, depth) / 2 + 0.3]} tone="ink" size="xs" center>{"memoria · " + cubes + " cubos"}</Tag>
      {/* el token entra y cruza la rejilla */}
      <Flow points={[[-2.3, 0.45, 0], [0, 0.55, 0], [2.3, 0.45, 0]]} color={P.violet} count={2} size={0.05} speed={0.35} lineOpacity={0.2} />
    </group>
  );
}

/* Dos columnas, cada una a su propia escala: GB (máx. 96) y GFLOP por token (máx. 26). */
function Meter({ x, value, max, color, label, tag }: { x: number; value: number; max: number; color: string; label: string; tag: string }) {
  const h = Math.max(0.04, (value / max) * 2.2);
  return (
    <group position={[x, -0.5, 0]}>
      <RoundedBox position={[0, 0, 0]} args={[0.7, 0.12, 0.7]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <ZMat color={MZ.ceramic} />
      </RoundedBox>
      <mesh position={[0, 1.16, -0.25]}>
        <boxGeometry args={[0.04, 2.2, 0.04]} />
        <meshStandardMaterial color={MZ.steel} metalness={0.7} roughness={0.3} />
      </mesh>
      <RoundedBox position={[0, 0.06 + h / 2, 0]} args={[0.46, h, 0.46]} radius={0.04} smoothness={2} castShadow>
        <ZMat color={color} clear={0.6} />
      </RoundedBox>
      <Tag position={[0, 0.2 + h + 0.12, 0]} tone={color === P.amber ? "amber" : "violet"} size="xs" center>{tag}</Tag>
      <Tag position={[0, -0.2, 0.6]} tone="muted" size="xs" center>{label}</Tag>
    </group>
  );
}

function ZooBench({ model, prec }: { model: ModelId; prec: Precision }) {
  const b = budget(model, prec);
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.1, 0]}>
        <ShadowBlob position={[0, -0.95, 0.2]} scale={9} opacity={0.12} />
        <RoundedBox position={[0, -0.78, 0]} args={[8.2, 0.36, 3.4]} radius={0.17} smoothness={4} castShadow receiveShadow>
          <ZMat color={MZ.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.56, 0]} args={[7.9, 0.08, 3.1]} radius={0.04} smoothness={3} receiveShadow>
          <ZMat color={MZ.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        <ParamGrid key={model} cubes={b.cubes} lit={b.lit} moe={b.moe} color={b.moe ? P.violet : P.teal} />
        <Meter x={2.45} value={b.memGB} max={96} color={P.amber} label="memoria" tag={num(b.memGB) + " GB"} />
        <Meter x={3.35} value={b.gflop} max={26} color={P.violet} label="cómputo" tag={num(b.gflop) + " GFLOP"} />
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [model, setModel] = useState<ModelId>("a3b");
  const [prec, setPrec] = useState<Precision>("q4");
  const b = budget(model, prec);
  const dense3 = 2 * 3;
  return (
    <Figure
      label="Lee la ficha · totales en memoria, activos en cómputo"
      hint="cada cubo = 1.000 millones de parámetros"
      height="h-[420px] md:h-[520px]"
      legend={[
        { color: b.moe ? P.violet : P.teal, label: "parámetros activos en este token" },
        { color: "#9AA09C", label: "cargados, sin trabajar" },
        { color: P.amber, label: "memoria de pesos" },
        { color: P.violet, label: "FLOP por token" },
      ]}
      controls={
        <>
          <Switcher value={model} onChange={setModel} ariaLabel="Modelo" options={(Object.keys(MODELS) as ModelId[]).map((id) => ({ value: id, label: MODELS[id].label, tone: MODELS[id].moe ? P.violet : P.teal }))} />
          <Switcher value={prec} onChange={setPrec} ariaLabel="Precisión" options={(Object.keys(BYTES) as Precision[]).map((id) => ({ value: id, label: BYTES[id].label, tone: P.amber }))} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            <strong>{b.label}:</strong> {b.source}. Todos los cubos tienen que estar en memoria; {b.moe ? `en cada token el router solo enciende ${b.lit} de ${b.cubes}, y cuáles cambia de un token a otro.` : "en cada token trabajan todos: memoria y cómputo escalan 1:1 con el tamaño."}
            {model === "a3b" ? ` Por eso “3B activos” no significa “cabe como un 3B”: el cómputo se parece al de un dense 3B (${dense3} GFLOP), la memoria no.` : ""}
          </p>
          <Readout
            items={[
              { label: "memoria de pesos", value: `${num(b.total)} × ${num(BYTES[prec].b)} B = ${num(b.memGB)} GB`, tone: "var(--amber)" },
              { label: "cómputo", value: `2 × ${num(b.active)} = ${num(b.gflop)} GFLOP/token`, tone: "var(--violet)" },
              { label: "activos / totales", value: num((100 * b.active) / b.total, 0) + " %", tone: "var(--teal)" },
            ]}
          />
          <p className="text-xs text-muted">Reglas prácticas de la lección: bytes por parámetro 2 (FP16), 1 (Q8) y 0,6 (Q4, incluye la sobrecarga típica de los formatos K); FLOP ≈ 2 × parámetros activos por token. Solo pesos: no incluye KV caché ni reservas del runtime. Los cubos se redondean al millar de millones; la posición de los encendidos es ilustrativa.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.5, 4.6, 8.6], fov: 34 }} fit={1.1}>
        <ZooBench model={model} prec={prec} />
      </Stage>
    </Figure>
  );
}

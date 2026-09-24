"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState, type RefObject } from "react";
import { Group } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Bars, Flow, Marker, PointerTilt, ShadowBlob, Tag, Wire } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Banco de decode: cada paso relee los pesos enteros.
 *
 * Modelo didáctico con cota de ancho de banda (decode limitado por memoria,
 * cómputo ignorado): un modelo de 8B en FP16 ocupa 16 GB; la HBM lee a
 * 2.000 GB/s; la caché KV de cada secuencia (2.048 tokens × 128 KiB por
 * token, forma tipo Llama de 8B: 32 capas × 8 cabezas KV × 128 × 2 × 2 B)
 * se lee también en cada paso. Tiempo de paso = (pesos + B × KV) / ancho de
 * banda. Especulativo: un borrador de 1B propone k tokens y una pasada del
 * grande los verifica; tokens esperados por ciclo = (1 − α^(k+1)) / (1 − α)
 * (Leviathan et al., 2023).
 */

type ServeMode = "one" | "batch" | "spec";

const WEIGHTS_GB = 16;
const BW_GBPS = 2000;
const KV_PER_TOKEN = 32 * 8 * 128 * 2 * 2; // bytes
const CONTEXT = 2048;
const KV_SEQ_GB = (KV_PER_TOKEN * CONTEXT) / 1e9;
const DRAFT_GB = 2;
const MAX_LANES = 16;

function stepMs(batch: number) {
  return ((WEIGHTS_GB + batch * KV_SEQ_GB) / BW_GBPS) * 1000;
}

function specStats(k: number, alpha: number) {
  const expected = alpha >= 0.999 ? k + 1 : (1 - Math.pow(alpha, k + 1)) / (1 - alpha);
  const draftMs = ((DRAFT_GB + KV_SEQ_GB / 8) / BW_GBPS) * 1000 * k;
  const verifyMs = stepMs(1);
  const cycle = draftMs + verifyMs;
  return { expected, draftMs, verifyMs, cycle, tps: (expected / cycle) * 1000 };
}

const fmt = (n: number, d = 1) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

/** Deterministic acceptance for cycle n: how many of k drafts pass at rate α. */
function accepted(n: number, k: number, alpha: number) {
  let a = 0;
  for (let j = 0; j < k; j++) {
    let x = Math.imul(n * 31 + j + 7, 2654435761) >>> 0;
    x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
    if (((x ^ (x >>> 13)) >>> 0) / 4294967296 < alpha) a += 1;
    else break;
  }
  return a;
}

const LANE_X0 = 0.7;
const CUBE = 0.2;
const laneZ = (i: number, n: number) => (i - (n - 1) / 2) * Math.min(0.34, 4.4 / Math.max(1, n));

function WeightStack({ sweep }: { sweep: RefObject<Group | null> }) {
  return (
    <group position={[-3.0, 0, 0]}>
      <RoundedBox args={[1.9, 0.18, 1.9]} position={[0, 0.09, 0]} radius={0.05} smoothness={3} castShadow receiveShadow><Physical color="#263532" metal={0.3} coat={0.3} /></RoundedBox>
      {Array.from({ length: 8 }, (_, k) => (
        <RoundedBox key={k} args={[1.6, 0.14, 1.6]} position={[0, 0.3 + k * 0.19, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <Physical color={mixHex(P.amberWash, P.amber, 0.25 + (k % 2) * 0.15)} coat={0.5} />
        </RoundedBox>
      ))}
      {/* the read head: one full pass over every layer per decode step */}
      <group ref={sweep}>
        <mesh><boxGeometry args={[1.78, 0.03, 1.78]} /><meshBasicMaterial color={P.teal} transparent opacity={0.65} /></mesh>
      </group>
      <Tag position={[0, -0.05, 1.25]} tone="amber" size="xs" center>pesos 16 GB</Tag>
    </group>
  );
}

function GpuDie({ busy }: { busy: number }) {
  return (
    <group position={[-0.9, 0, 0]}>
      <RoundedBox args={[1.2, 0.3, 1.2]} position={[0, 0.15, 0]} radius={0.05} smoothness={3} castShadow receiveShadow><Physical color="#2E3B38" metal={0.35} coat={0.4} /></RoundedBox>
      <RoundedBox args={[0.7, 0.08, 0.7]} position={[0, 0.34, 0]} radius={0.02} smoothness={2} castShadow><Physical color={mixHex("#9AA6A2", P.teal, busy)} metal={0.5} coat={0.5} /></RoundedBox>
      <Tag position={[0, -0.05, 0.85]} tone="teal" size="xs" center>GPU</Tag>
    </group>
  );
}

function Lanes({ lanes, counts, drafts, draftOk, kv }: { lanes: number; counts: number[]; drafts: number; draftOk: number; kv: boolean }) {
  return (
    <group>
      {Array.from({ length: lanes }, (_, i) => {
        const z = laneZ(i, lanes);
        const n = counts[i] ?? 0;
        return (
          <group key={i} position={[0, 0, z]}>
            <mesh position={[LANE_X0 + 1.8, 0.03, 0]} receiveShadow><boxGeometry args={[3.8, 0.04, Math.min(0.26, 3.9 / lanes)]} /><meshStandardMaterial color="#3C4A46" roughness={0.6} /></mesh>
            {kv && <mesh position={[LANE_X0 - 0.2, 0.1, 0]} castShadow><boxGeometry args={[0.16, 0.14, Math.min(0.2, 3.4 / lanes)]} /><meshStandardMaterial color={P.violet} roughness={0.4} /></mesh>}
            {Array.from({ length: n }, (_, c) => (
              <mesh key={c} position={[LANE_X0 + 0.15 + c * (CUBE + 0.04), 0.16, 0]} castShadow>
                <boxGeometry args={[CUBE, CUBE, Math.min(CUBE, 3.2 / lanes)]} />
                <meshStandardMaterial color={P.amber} roughness={0.4} />
              </mesh>
            ))}
            {Array.from({ length: drafts }, (_, c) => (
              <mesh key={`d${c}`} position={[LANE_X0 + 0.15 + (n + c) * (CUBE + 0.04), 0.16, 0]}>
                <boxGeometry args={[CUBE, CUBE, CUBE]} />
                <meshStandardMaterial color={c < draftOk ? P.teal : P.rose} transparent opacity={0.75} roughness={0.4} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

const VISUAL_SLOWDOWN = 110; // one 8 ms step ≈ 0,9 s on screen

function DecodeRig({ mode, batch, k, alpha }: { mode: ServeMode; batch: number; k: number; alpha: number }) {
  const sweep = useRef<Group>(null);
  const clock = useRef(0);
  const { still } = useStage();
  const [n, setN] = useState(3);
  const lanes = mode === "batch" ? Math.min(batch, MAX_LANES) : 1;
  const period = (mode === "spec" ? specStats(k, alpha).cycle : stepMs(mode === "batch" ? batch : 1)) * VISUAL_SLOWDOWN / 1000;
  useFrame((_, dt) => {
    if (still) return;
    clock.current += dt;
    const phase = (clock.current % period) / period;
    if (sweep.current) sweep.current.position.y = 1.9 - phase * 1.65;
    if (clock.current >= period) { clock.current -= period; setN((v) => v + 1); }
  });
  // continuous batching: each lane is a different request of a different length; when one finishes, another joins
  const counts = useMemo(() => Array.from({ length: lanes }, (_, i) => {
    if (mode === "spec") {
      let total = 0;
      for (let c = 0; c < n; c++) total += accepted(c, k, alpha) + 1;
      return total % 14;
    }
    const len = 6 + ((i * 7) % 9);
    return (n + i * 3) % len;
  }), [lanes, mode, n, k, alpha]);
  const drafts = mode === "spec" ? k : 0;
  const draftOk = mode === "spec" ? accepted(n, k, alpha) : 0;
  return (
    <PointerTilt amount={0.035}>
      <group>
        <ShadowBlob position={[0.2, -0.12, 0]} scale={9.5} opacity={0.07} />
        <RoundedBox args={[9.6, 0.16, 5.4]} position={[0.4, -0.1, 0]} radius={0.06} smoothness={3} receiveShadow><Physical color="#6E5440" rough={0.6} coat={0.15} /></RoundedBox>
        <WeightStack sweep={sweep} />
        <GpuDie busy={mode === "one" ? 0.3 : 0.9} />
        <Flow points={[[-2.0, 0.8, 0], [-1.5, 0.7, 0], [-1.1, 0.45, 0]]} color={P.amber} count={3} size={0.05} speed={1.0 / period} lineOpacity={0.4} />
        <Lanes lanes={lanes} counts={counts} drafts={drafts} draftOk={draftOk} kv />
        {mode === "spec" && (
          <group position={[0.3, 0, 1.9]}>
            <RoundedBox args={[0.8, 0.5, 0.8]} position={[0, 0.25, 0]} radius={0.05} smoothness={3} castShadow receiveShadow><Physical color={P.violet} coat={0.5} /></RoundedBox>
            <Tag position={[0, -0.05, 0.6]} tone="violet" size="xs" center>borrador 1B</Tag>
            <Flow points={[[0.3, 0.5, -0.3], [0.9, 0.6, -1.0], [LANE_X0 + 1.0, 0.35, -1.9]]} color={P.violet} count={Math.max(2, k)} size={0.04} speed={0.8} lineOpacity={0.35} />
          </group>
        )}
        <Tag position={[LANE_X0 + 1.8, 0.1, laneZ(lanes - 1, lanes) + 0.45]} tone="muted" size="xs" center>{mode === "batch" ? `${batch} secuencias` : "una secuencia"}</Tag>
        <Tag position={[LANE_X0 - 0.2, 0.55, laneZ(0, lanes) - 0.3]} tone="violet" size="xs" center>KV</Tag>
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<ServeMode>("one");
  const [batch, setBatch] = useState(16);
  const [k, setK] = useState(4);
  const [alpha, setAlpha] = useState(0.7);
  const one = stepMs(1);
  const b = mode === "batch" ? batch : 1;
  const tStep = stepMs(b);
  const agg = (b / tStep) * 1000;
  const spec = specStats(k, alpha);
  const perUser = mode === "spec" ? spec.tps : 1000 / tStep;
  const aggregate = mode === "spec" ? spec.tps : agg;
  const tpot = mode === "spec" ? spec.cycle / spec.expected : tStep;
  const body =
    mode === "one"
      ? <>Cada token nuevo obliga a leer los 16 GB de pesos (más la KV de la secuencia): {fmt(one, 2)} ms por paso a 2.000 GB/s. Una sola petición recibe {fmt(1000 / one, 0)} tokens/s y la GPU hace una lectura completa para una única predicción.</>
      : mode === "batch"
        ? <>Con {batch} secuencias en el mismo paso, los pesos se leen <strong>una vez</strong> para todas; solo crece la lectura de KV ({fmt(KV_SEQ_GB * 1000, 0)} MB por secuencia). El paso sube a {fmt(tStep, 2)} ms (TPOT de cada usuario), pero el agregado pasa a {fmt(agg, 0)} tokens/s, {fmt(agg / (1000 / one), 1)}× el de un usuario solo. Las pistas son peticiones de longitudes distintas: cuando una termina, otra entra en su hueco a mitad del decode.</>
        : <>El borrador de 1B propone {k} tokens ({fmt(spec.draftMs, 2)} ms) y una pasada del modelo grande los verifica ({fmt(spec.verifyMs, 2)} ms). Con aceptación α = {fmt(alpha, 2)} se esperan {fmt(spec.expected, 2)} tokens por ciclo → {fmt(spec.tps, 0)} tokens/s, {fmt(spec.tps / (1000 / one), 2)}× un usuario solo. Verde: aceptados; rosa: el primer rechazo y todo lo que va detrás se descarta.</>;
  return (
    <Figure
      label="Banco de decode · los pesos se releen en cada paso"
      hint="cota de ancho de banda · 8B FP16 · 2.000 GB/s"
      height="h-[460px] md:h-[560px]"
      legend={[{ color: P.amber, label: "pesos / tokens" }, { color: P.teal, label: "lectura / aceptado" }, { color: P.violet, label: "KV / borrador" }, { color: P.rose, label: "rechazado" }]}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Planificación" options={[{ value: "one", label: "Un usuario", tone: P.teal }, { value: "batch", label: "Batch continuo", tone: P.amber }, { value: "spec", label: "Especulativo", tone: P.violet }]} />
          {mode === "batch" && <Knob label="secuencias" value={batch} min={1} max={64} onChange={setBatch} tone="var(--amber)" />}
          {mode === "spec" && <><Knob label="k" value={k} min={1} max={8} onChange={setK} tone="var(--violet)" /><Knob label="α" value={alpha} min={0.3} max={0.95} step={0.05} onChange={setAlpha} format={(v) => fmt(v, 2)} tone="var(--teal)" /></>}
        </>
      }
      note={
        <div className="space-y-3">
          <p>{body}</p>
          <Readout items={[
            { label: "tokens/s por usuario", value: fmt(perUser, 0), tone: "var(--teal)" },
            { label: "tokens/s agregados", value: fmt(aggregate, 0), tone: "var(--amber)" },
            { label: "TPOT", value: `${fmt(tpot, 2)} ms`, tone: "var(--violet)" },
          ]} />
          <p className="text-xs text-muted">Modelo didáctico limitado por memoria: paso = (16 GB + secuencias × {fmt(KV_SEQ_GB * 1000, 0)} MB de KV) / 2.000 GB/s; ignora cómputo, prefill y sobrecarga del scheduler, así que exagera la ganancia de batches grandes. Se dibujan como mucho {MAX_LANES} pistas. La animación va {VISUAL_SLOWDOWN} veces más lenta que el tiempo calculado. Fórmula especulativa: Leviathan et al. (2023).</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 5.8, 8.8], fov: 34 }} fit={1.06}>
        <DecodeRig mode={mode} batch={batch} k={k} alpha={alpha} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Mode = "one" | "batch" | "spec";

const COPY = {
  en: {
    title: "one GPU, three schedules",
    hint: "bottom row is the GPU's own clock · every gap is money burning",
    one: "One user",
    batch: "Continuous batch",
    spec: "Speculative",
    legendStep: "GPU step",
    legendIdle: "idle",
    legendToken: "token delivered",
    gpu: "gpu",
    request: "req",
    busy: "gpu busy",
    perStep: "tokens / step",
    oneNote: "a single stream leaves the GPU idle between steps — latency is fine, throughput is a waste",
    batchNote: "other requests join the same step: the step costs a little more and pays out many times",
    specNote: "a small draft model proposes several tokens; one verification pass keeps the ones it got right",
    drafted: "drafted",
    kept: "kept",
  },
  es: {
    title: "una GPU, tres calendarios",
    hint: "la fila de abajo es el reloj de la GPU · cada hueco es dinero quemándose",
    one: "Un usuario",
    batch: "Batch continuo",
    spec: "Especulativo",
    legendStep: "paso de GPU",
    legendIdle: "inactiva",
    legendToken: "token entregado",
    gpu: "gpu",
    request: "pet",
    busy: "gpu ocupada",
    perStep: "tokens / paso",
    oneNote: "un solo flujo deja la GPU parada entre pasos — la latencia está bien, el rendimiento se tira",
    batchNote: "otras peticiones se suben al mismo paso: cuesta un poco más y rinde muchas veces",
    specNote: "un modelo borrador propone varios tokens; una pasada de verificación se queda los acertados",
    drafted: "propuestos",
    kept: "aceptados",
  },
};

const T0 = -2.9;
const T1 = 2.9;
const SPANT = T1 - T0;
const PERIOD = 0.74;
const STEPS = 8;

type Plan = {
  /** Width of one GPU step on the time axis. */
  width: number;
  /** Requests served per step. */
  lanes: number;
  /** Tokens delivered per request per step. */
  perLane: number;
};

const PLANS: Record<Mode, Plan> = {
  one: { width: 0.2, lanes: 1, perLane: 1 },
  batch: { width: 0.5, lanes: 5, perLane: 1 },
  spec: { width: 0.34, lanes: 1, perLane: 3 },
};

/** A step block on the GPU's timeline. */
function Step({ x, width, color }: { x: number; width: number; color: string }) {
  return (
    <mesh position={[x + width / 2, 0, 0]}>
      <boxGeometry args={[width, 0.26, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.42} metalness={0.04} />
    </mesh>
  );
}

/** Sweeps the timeline so the reader sees the schedule being consumed. */
function Playhead({ color }: { color: string }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = (clock.elapsedTime * 0.22) % 1;
    g.position.x = T0 + t * SPANT;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.55, 0.3]}>
        <boxGeometry args={[0.02, 2.5, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("one");
  const plan = PLANS[mode];
  const accent = mode === "batch" ? P.amber : mode === "spec" ? P.violet : P.teal;
  const note = mode === "batch" ? t.batchNote : mode === "spec" ? t.specNote : t.oneNote;

  const steps = useMemo(
    () => Array.from({ length: STEPS }, (_, i) => T0 + 0.1 + i * PERIOD),
    [],
  );

  // Both numbers describe the picture above them, not a benchmark.
  const busy = Math.min(1, plan.width / PERIOD);
  const tokensPerStep = plan.lanes * plan.perLane;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendStep },
        { color: P.line, label: t.legendIdle },
        { color: P.amber, label: t.legendToken },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "one", label: t.one, tone: P.teal },
            { value: "batch", label: t.batch, tone: P.amber },
            { value: "spec", label: t.spec, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      note={note}
      height="h-[370px] md:h-[460px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.6, 7.2], fov: 40 }} background={P.paper} fit={1.1}>
        <PointerTilt amount={0.06}>
          <group position={[0, 0.15, 0]} rotation={[-0.18, 0, 0]}>
            <ShadowBlob position={[0, -1.35, 0]} scale={8} opacity={0.05} />

            {/* Request lanes: who is waiting, and what they get back. */}
            {Array.from({ length: plan.lanes }, (_, lane) => {
              const y = 1.65 - lane * 0.34;
              return (
                <group key={lane} position={[0, y, 0]}>
                  <Wire
                    points={[
                      [T0, 0, 0],
                      [T1, 0, 0],
                    ]}
                    color={P.line}
                    opacity={0.9}
                    width={1}
                  />
                  {steps.map((x, i) =>
                    Array.from({ length: plan.perLane }, (_, k) => (
                      <mesh
                        key={`${i}-${k}`}
                        position={[x + plan.width + 0.08 + k * 0.13, 0.09, 0]}
                      >
                        <boxGeometry args={[0.1, 0.1, 0.1]} />
                        <meshStandardMaterial
                          color={mode === "spec" && k === 2 ? P.rose : P.amber}
                          roughness={0.42}
                        />
                      </mesh>
                    )),
                  )}
                  <Tag position={[T0 - 0.42, 0, 0]} tone="muted" size="xs">
                    {t.request} {lane + 1}
                  </Tag>
                </group>
              );
            })}

            {/* The GPU's own clock. Gaps here are the whole lesson. */}
            <group position={[0, -0.55, 0]}>
              <mesh position={[0, 0, -0.03]}>
                <boxGeometry args={[SPANT, 0.3, 0.34]} />
                <meshStandardMaterial color={P.sunken} roughness={0.6} />
              </mesh>
              {steps.map((x, i) => (
                <Step key={i} x={x} width={plan.width} color={accent} />
              ))}
              <Tag position={[T0 - 0.42, 0, 0]} tone="ink" size="xs">
                {t.gpu}
              </Tag>
              <Marker position={[T0 + 0.1 + plan.width / 2, -0.36, 0.2]} n={1} color={accent} />
            </group>

            <Playhead color={accent} />

            {mode === "spec" ? (
              <group position={[0, -1.15, 0]}>
                <Tag position={[-1.2, 0, 0]} tone="amber" size="xs" center>
                  {t.drafted}: 3
                </Tag>
                <Tag position={[1.2, 0, 0]} tone="teal" size="xs" center>
                  {t.kept}: 2
                </Tag>
              </group>
            ) : null}
          </group>

          <group position={[0, -2.15, 0]}>
            <Bars
              bars={[
                { label: t.busy, value: busy, color: accent, note: `${Math.round(busy * 100)}%` },
                {
                  label: t.perStep,
                  value: Math.min(1, tokensPerStep / 6),
                  color: P.amber,
                  note: `${tokensPerStep}`,
                },
              ]}
              height={0.6}
              width={0.46}
              gap={0.95}
              depth={0.28}
            />
          </group>
        </PointerTilt>

      </Stage>
    </Figure>
  );
}

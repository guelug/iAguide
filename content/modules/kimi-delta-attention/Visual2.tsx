"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import {
  Flow,
  Halo,
  Lattice,
  Motes,
  Node3D,
  PointerTilt,
  Ribbon,
  ShadowBlob,
  Slab,
  Tag,
  Wire,
  hash,
  type Cell,
} from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Softmax attention grows a KV list; linear attention folds the past into a
   matrix; KDA adds a per-channel gate on top of the delta rule. */
type Mode = "softmax" | "linear" | "kda";

const COPY = {
  en: {
    memory_grows_vs_memory_stays: "memory grows vs memory stays",
    a_cache_a_matrix_a_gate: "a cache, a matrix, a gate",
    softmax: "softmax",
    linear: "linear",
    kda: "kda",
    kv_list_grows: "kv list grows",
    reads_every_past_token: "reads every past token",
    state_matrix: "state matrix",
    fixed_size: "fixed size",
    forgets_old_keys: "old keys collide",
    delta_rule: "delta rule",
    per_channel_gate: "per-channel gate",
    erases_then_writes: "erases, then writes",
    token: "token",
    cost_grows: "cost grows",
    cost_stays: "cost stays",
  },
  es: {
    memory_grows_vs_memory_stays: "la memoria crece vs la memora queda",
    a_cache_a_matrix_a_gate: "una caché, una matriz, una puerta",
    softmax: "softmax",
    linear: "lineal",
    kda: "kda",
    kv_list_grows: "la lista kv crece",
    reads_every_past_token: "lee cada token pasado",
    state_matrix: "matriz de estado",
    fixed_size: "tamaño fijo",
    forgets_old_keys: "claves viejas colisionan",
    delta_rule: "regla delta",
    per_channel_gate: "puerta por canal",
    erases_then_writes: "borra, luego escribe",
    token: "token",
    cost_grows: "el coste crece",
    cost_stays: "el coste se queda",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("softmax");

  // growing KV list for softmax (left column, taller every step)
  const kvCells = Array.from({ length: 18 }, (_, i) => ({
    position: [-2.2, 1.3 - i * 0.16, 0] as [number, number, number],
    color: i < 14 ? P.teal : P.amber,
  }));

  // the state matrix for linear (fixed grid)
  const stateCells = Array.from({ length: 36 }, (_, i) => ({
    position: [
      -1.2 + (i % 6) * 0.22,
      0.8 - Math.floor(i / 6) * 0.22,
      0,
    ] as [number, number, number],
    color: i % 7 === 0 ? P.violet : P.teal,
  }));

  // KDA: channel gates
  const channels = Array.from({ length: 6 }, (_, i) => ({
    position: [-1.6 + i * 0.62, -0.4, 0] as [number, number, number],
    color: i % 2 === 0 ? P.violet : P.teal,
  }));

  return (
    <Figure
      label={t.memory_grows_vs_memory_stays}
      hint={t.a_cache_a_matrix_a_gate}
      legend={[
        { color: P.teal, label: t.softmax },
        { color: P.violet, label: t.linear },
        { color: P.amber, label: t.kda },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "softmax", label: t.softmax, tone: P.teal },
            { value: "linear", label: t.linear, tone: P.violet },
            { value: "kda", label: t.kda, tone: P.amber },
          ]}
          ariaLabel={t.memory_grows_vs_memory_stays}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "softmax" && (
          <>
            <Lattice cells={kvCells} size={0.13} opacity={0.9} />
            <Tag position={[-2.2, 1.7, 0.2]} tone="teal">{t.kv_list_grows}</Tag>
            {/* the newest token reads the whole past */}
            <Node3D position={[1.6, 0.3, 0]} color={P.amber} radius={0.2} pulse={0.3} />
            <Tag position={[1.6, 0.85, 0.2]} tone="amber">{t.token} t</Tag>
            {kvCells.slice(0, 8).map((c, i) => (
              <Wire
                key={i}
                points={[c.position, [1.35, 0.3, 0]]}
                color={P.teal}
                opacity={0.35}
              />
            ))}
            <Tag position={[0.2, -0.4, 0.2]} tone="muted" size="xs">{t.reads_every_past_token}</Tag>
            {/* cost curve grows */}
            <Ribbon points={[[-0.4, -1.2, 0], [0.6, -1.0, 0], [1.6, -0.55, 0], [2.6, 0.1, 0]]} color={P.rose} radius={0.02} opacity={0.8} />
            <Tag position={[1.4, -1.35, 0.2]} tone="rose" size="xs">{t.cost_grows}</Tag>
          </>
        )}

        {mode === "linear" && (
          <>
            <Slab position={[0, 0.2, -0.15]} size={[2.0, 1.9, 0.1]} color={P.violet} fill={0.08} />
            <Lattice cells={stateCells} size={0.15} opacity={0.9} />
            <Tag position={[0, 1.7, 0.2]} tone="violet">{t.state_matrix}</Tag>
            <Tag position={[0, -1.0, 0.2]} tone="violet" size="xs">{t.fixed_size}</Tag>
            {/* past tokens pour into the matrix instead of piling up */}
            <Flow points={[[-2.6, 0.9, 0], [-1.35, 0.6, 0]]} color={P.teal} count={3} size={0.05} />
            <Node3D position={[-2.8, 0.95, 0]} color={P.teal} radius={0.13} />
            <Node3D position={[-2.8, 0.45, 0]} color={P.teal} radius={0.11} />
            <Node3D position={[-2.8, -0.05, 0]} color={P.teal} radius={0.09} />
            {/* the collision warning */}
            <Halo position={[0, 0.15, 0]} radius={1.45} color={P.rose} opacity={0.25} spin={0.1} />
            <Tag position={[2.0, -0.7, 0.2]} tone="rose" size="xs">{t.forgets_old_keys}</Tag>
            <Tag position={[2.2, 0.9, 0.2]} tone="teal" size="xs">{t.cost_stays}</Tag>
          </>
        )}

        {mode === "kda" && (
          <>
            {/* state matrix, dimmer (the thing being written into) */}
            <Lattice cells={stateCells} size={0.14} opacity={0.5} />
            <Tag position={[0, 1.7, 0.2]} tone="violet">{t.state_matrix}</Tag>
            {/* per-channel gates */}
            {channels.map((c, i) => (
              <group key={i}>
                <Node3D position={c.position} color={c.color} radius={0.12} faceted pulse={i * 0.3} />
                <Wire points={[[c.position[0], -0.25, 0], [c.position[0], 0.1, 0]]} color={c.color} opacity={0.5} />
              </group>
            ))}
            <Tag position={[0, -0.95, 0.2]} tone="amber">{t.per_channel_gate}</Tag>
            {/* the delta erase-then-write */}
            <Flow points={[[-2.8, -1.3, 0], [-0.3, -1.15, 0], [1.8, -1.15, 0]]} color={P.rose} count={3} size={0.05} />
            <Tag position={[-1.9, -1.65, 0.2]} tone="rose" size="xs">{t.delta_rule}</Tag>
            <Tag position={[1.9, -1.55, 0.2]} tone="amber" size="xs">{t.erases_then_writes}</Tag>
            <Node3D position={[2.5, 0.9, 0]} color={P.amber} radius={0.16} pulse={0.4} />
            <Tag position={[2.5, 1.35, 0.2]} tone="amber" size="xs">{t.token} t</Tag>
            <Flow points={[[2.4, 0.75, 0], [1.3, 0.35, 0]]} color={P.amber} count={2} size={0.045} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: el estado S (d_k × d_v = 6 × 6) de una cabeza, escrito token a
 * token. Cuatro reglas de escritura sobre la misma secuencia:
 *   lineal  S ← S + k vᵀ
 *   delta   S ← (I − β k kᵀ) S + β k vᵀ
 *   GDN     S ← (I − β k kᵀ) α S + β k vᵀ          (α escalar)
 *   KDA     S ← (I − β k kᵀ) Diag(α) S + β k vᵀ    (α por canal)
 * Cada token se dibuja en dos medios pasos: borrar (olvido + proyección) y
 * escribir. Las keys se repiten con values nuevos: la lineal acumula ruido,
 * la delta sobrescribe. La lista KV de softmax crece al lado.
 */

type Rule = "linear" | "delta" | "gdn" | "kda";

const D = 6;
const TOKENS = 10;
const KEY_ORDER = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];
const ALPHA_KDA = [0.99, 0.97, 0.93, 0.86, 0.76, 0.62];
const ALPHA_GDN = 0.9;

function unit(v: number[]) {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

const KEYS = Array.from({ length: 4 }, (_, j) => unit(Array.from({ length: D }, (_, i) => (i === j + 1 ? 1.6 : 0) + (hash(j * 7 + i, 3) - 0.5))));
const VALUES = Array.from({ length: TOKENS }, (_, t) => Array.from({ length: D }, (_, i) => Math.round((hash(t * 11 + i, 5) * 2 - 1) * 100) / 100));

type Mat = number[][];

const zeros = (): Mat => Array.from({ length: D }, () => Array(D).fill(0));

function alphaFor(rule: Rule, i: number) {
  if (rule === "kda") return ALPHA_KDA[i];
  if (rule === "gdn") return ALPHA_GDN;
  return 1;
}

/** Medios pasos: [S0, borrado1, escrito1, borrado2, escrito2, …]. */
function simulate(rule: Rule, beta: number) {
  const states: Mat[] = [zeros()];
  let S = zeros();
  for (let t = 0; t < TOKENS; t += 1) {
    const k = KEYS[KEY_ORDER[t]];
    const v = VALUES[t];
    const b = rule === "linear" ? 1 : beta;
    // olvido por canal (filas = canales de key)
    let E = S.map((row, i) => row.map((x) => x * alphaFor(rule, i)));
    if (rule !== "linear") {
      // (I − β k kᵀ) E : resta la proyección sobre k
      const kE = Array.from({ length: D }, (_, j) => k.reduce((s, ki, i) => s + ki * E[i][j], 0));
      E = E.map((row, i) => row.map((x, j) => x - b * k[i] * kE[j]));
    }
    states.push(E);
    S = E.map((row, i) => row.map((x, j) => x + b * k[i] * v[j]));
    states.push(S);
  }
  return states;
}

/** Error relativo medio al leer cada key con su value más reciente. */
function recallError(S: Mat, tokensSeen: number) {
  const latest = new Map<number, number[]>();
  for (let t = 0; t < tokensSeen; t += 1) latest.set(KEY_ORDER[t], VALUES[t]);
  if (!latest.size) return 0;
  let total = 0;
  latest.forEach((v, key) => {
    const k = KEYS[key];
    const r = Array.from({ length: D }, (_, j) => k.reduce((s, ki, i) => s + ki * S[i][j], 0));
    total += Math.hypot(...r.map((x, j) => x - v[j])) / (Math.hypot(...v) || 1);
  });
  return total / latest.size;
}

const PITCH = 0.42;
const GRID_Y = 0.42;
const cellX = (j: number) => (j - (D - 1) / 2) * PITCH;
const cellZ = (i: number) => (i - (D - 1) / 2) * PITCH;

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

function StateGrid({ S, phase, k, v, rule }: { S: Mat; phase: "erase" | "write" | "idle"; k: number[] | null; v: number[] | null; rule: Rule }) {
  const cells = useMemo(() => {
    const out: Cell[] = [];
    S.forEach((row, i) =>
      row.forEach((x, j) => {
        const h = Math.min(1.6, Math.abs(x) * 0.75) + 0.02;
        const tone = x >= 0 ? P.teal : P.rose;
        out.push({
          position: [cellX(j), GRID_Y + h / 2, cellZ(i)],
          scale: [PITCH * 0.78, h, PITCH * 0.78],
          color: mixHex(P.paper, tone, 0.35 + Math.min(1, Math.abs(x)) * 0.6),
        });
      }),
    );
    return out;
  }, [S]);
  const edge = (D / 2) * PITCH;
  return (
    <group>
      <RoundedBox args={[D * PITCH + 0.35, 0.12, D * PITCH + 0.35]} position={[0, GRID_Y - 0.06, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#2C3332" roughness={0.42} metalness={0.2} />
      </RoundedBox>
      <Lattice cells={cells} size={1} />
      {k
        ? k.map((ki, i) => (
            <RoundedBox key={`k${i}`} args={[0.24, Math.abs(ki) * 0.7 + 0.02, 0.24]} position={[-edge - 0.45, GRID_Y + (Math.abs(ki) * 0.7 + 0.02) / 2, cellZ(i)]} radius={0.03} smoothness={2} castShadow>
              <meshPhysicalMaterial color={phase === "erase" ? P.rose : P.violet} roughness={0.35} clearcoat={0.5} />
            </RoundedBox>
          ))
        : null}
      {v && phase === "write"
        ? v.map((vj, j) => (
            <RoundedBox key={`v${j}`} args={[0.24, Math.abs(vj) * 0.7 + 0.02, 0.24]} position={[cellX(j), GRID_Y + (Math.abs(vj) * 0.7 + 0.02) / 2, edge + 0.45]} radius={0.03} smoothness={2} castShadow>
              <meshPhysicalMaterial color={P.amber} roughness={0.35} clearcoat={0.5} />
            </RoundedBox>
          ))
        : null}
      {Array.from({ length: D }, (_, i) => {
        const a = alphaFor(rule, i);
        return (
          <group key={`a${i}`} position={[edge + 0.45, GRID_Y, cellZ(i)]}>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
              <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.04 + a * 0.35, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, a * 0.7, 20]} />
              <meshPhysicalMaterial color={rule === "kda" ? mixHex(P.paper, P.teal, 0.3 + (1 - a) * 1.5) : "#B9B09E"} roughness={0.35} clearcoat={0.5} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[-edge - 0.45, GRID_Y + 1.0, cellZ(0) - 0.3]} tone={phase === "erase" ? "rose" : "violet"} size="xs" center>
        {phase === "erase" ? "borra k" : "key k"}
      </Tag>
      <Tag position={[edge + 0.45, GRID_Y + 0.95, cellZ(0) - 0.3]} tone="teal" size="xs" center>
        {rule === "kda" ? "puerta por canal" : rule === "gdn" ? "puerta escalar" : "sin olvido"}
      </Tag>
      {phase === "write" ? (
        <Tag position={[cellX(D - 1) + 0.35, GRID_Y + 0.9, edge + 0.45]} tone="amber" size="xs" center>
          value v
        </Tag>
      ) : null}
      <Tag position={[0, GRID_Y - 0.1, edge + 1.05]} tone="ink" size="xs" center>
        estado S · 6×6
      </Tag>
    </group>
  );
}

function KvList({ tokens }: { tokens: number }) {
  const x = -3.3;
  return (
    <group position={[x, 0.3, 0]}>
      <RoundedBox args={[1.1, 0.08, 1.1]} position={[0, 0.04, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.5} roughness={0.35} />
      </RoundedBox>
      {Array.from({ length: tokens }, (_, t) => (
        <group key={t} position={[0, 0.14 + t * 0.13, 0]}>
          <RoundedBox args={[0.8, 0.09, 0.36]} position={[0, 0, -0.2]} radius={0.02} smoothness={2} castShadow>
            <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.65)} roughness={0.4} clearcoat={0.4} />
          </RoundedBox>
          <RoundedBox args={[0.8, 0.09, 0.36]} position={[0, 0, 0.2]} radius={0.02} smoothness={2} castShadow>
            <meshPhysicalMaterial color={mixHex(P.paper, P.amber, 0.65)} roughness={0.4} clearcoat={0.4} />
          </RoundedBox>
        </group>
      ))}
      <Tag position={[0, 0.3 + Math.max(tokens, 1) * 0.13 + 0.2, 0]} tone="amber" size="xs" center>
        {`lista KV · ${tokens}`}
      </Tag>
    </group>
  );
}

const RULE_TEXT: Record<Rule, string> = {
  linear: "Lineal: S ← S + k vᵀ. Cada escritura se apila sobre las anteriores; cuando una key vuelve con otro value, la lectura devuelve la suma de ambos.",
  delta: "Regla delta: primero resta de S lo que ya respondía a k, (I − β k kᵀ) S, y luego escribe β k vᵀ. Una key repetida sobrescribe en lugar de acumular.",
  gdn: "Gated DeltaNet: antes del borrado, toda la matriz decae con un único α = 0,9 por cabeza. Olvida todo al mismo ritmo.",
  kda: "KDA: el olvido es Diag(α), una tasa por canal de key (los cilindros). Las filas con α bajo se lavan rápido; las de α ≈ 1 guardan su rasgo.",
};

function SpanishVisual() {
  const [rule, setRule] = useState<Rule>("delta");
  const [beta, setBeta] = useState(1);
  const [half, setHalf] = useState(0);
  const states = useMemo(() => simulate(rule, beta), [rule, beta]);
  const total = states.length;
  const h = Math.min(half, total - 1);
  const token = Math.ceil(h / 2);
  const phase: "erase" | "write" | "idle" = h === 0 ? "idle" : h % 2 === 1 ? "erase" : "write";
  const tIdx = token - 1;
  const k = tIdx >= 0 ? KEYS[KEY_ORDER[tIdx]] : null;
  const v = tIdx >= 0 ? VALUES[tIdx] : null;
  const S = states[h];
  const seen = phase === "write" ? token : Math.max(0, token - 1);
  const err = recallError(S, seen);
  const finalErr = recallError(states[total - 1], TOKENS);
  const repeated = tIdx >= 4;
  const es2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
        {[
          ["Token", token === 0 ? "—" : `${token} / ${TOKENS} · ${phase === "erase" ? "borrar" : "escribir"}`],
          ["Memoria softmax", `${2 * seen * D} números`],
          ["Estado S", `${D * D} números fijos`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>{RULE_TEXT[rule]}</p>
      <p>
        {token === 0
          ? "S empieza a cero. La secuencia escribe cuatro keys y luego las repite con values nuevos."
          : repeated
            ? `El token ${token} reutiliza la key ${KEY_ORDER[tIdx] + 1} con un value nuevo. `
            : `El token ${token} escribe la key ${KEY_ORDER[tIdx] + 1} por primera vez. `}
        Error de recuperación (leer cada key y comparar con su value más reciente): {es2.format(err)}; al final de la secuencia, {es2.format(finalErr)}.
      </p>
      <p className="text-xs text-muted">
        Cabeza de juguete: d = 6, keys unitarias casi ortogonales, values deterministas. En Kimi Linear el estado es 128 × 128 por cabeza. Las
        barras de S muestran |S<sub>ij</sub>|; teal positivo, rosa negativo.
      </p>
    </div>
  );

  return (
    <Figure
      label="Escribir en una memoria fija: lineal, delta y KDA"
      hint="cada token: borrar, luego escribir"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.violet, label: "key k" },
        { color: P.amber, label: "value v / lista KV" },
        { color: P.teal, label: "estado S y puertas α" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Regla de escritura"
            value={rule}
            onChange={(r) => {
              setRule(r);
              setHalf(0);
            }}
            options={[
              { value: "linear", label: "Lineal", tone: P.rose },
              { value: "delta", label: "Delta", tone: P.violet },
              { value: "gdn", label: "GDN", tone: P.amber },
              { value: "kda", label: "KDA", tone: P.teal },
            ]}
          />
          <Knob label="Paso delta" min={0.1} max={1} step={0.05} value={beta} onChange={setBeta} format={(x) => es2.format(x)} tone={P.violet} />
          <button type="button" className="chip" onClick={() => setHalf((x) => (Math.min(x, total - 1) + 1) % total)}>
            Medio paso
          </button>
          <Readout items={[{ label: "error", value: es2.format(err), tone: err > 0.5 ? P.rose : P.teal }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3.2, 6.2, 8.6], fov: 34 }} fit={1.08}>
        <ShadowBlob position={[-1.2, 0.004, 0]} scale={7.5} opacity={0.1} />
        <RoundedBox args={[7.4, 0.24, 4.0]} position={[-1.1, 0.12, 0.1]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
        </RoundedBox>
        <StateGrid S={S} phase={phase} k={k} v={v} rule={rule} />
        <KvList tokens={seen} />
        <Ticker seconds={1.1} onTick={() => setHalf((x) => (Math.min(x, total - 1) + 1) % total)} />
      </Stage>
    </Figure>
  );
}

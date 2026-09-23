"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { MathUtils } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* AttnRes systems: online softmax, two-phase prefill+decode, comm cost. */
type Mode = "online" | "twophase" | "comm";

const COPY = {
  en: {
    the_serving_two_percent: "the serving two percent",
    online_softmax_two_phases_real_comm: "online softmax · two phases · real comm",
    online: "online",
    two_phase: "two phases",
    comm: "comm",
    running_max: "running max",
    running_sum: "running sum",
    blocks_written: "blocks written",
    decode_reads_summaries: "decode reads summaries",
    per_layer: "per-layer",
    block_summaries: "block summaries",
    cost: "cost",
    less_than_2: "< 2%",
  },
  es: {
    the_serving_two_percent: "el 2% de servir",
    online_softmax_two_phases_real_comm: "softmax online · dos fases · comm real",
    online: "online",
    two_phase: "dos fases",
    comm: "comm",
    running_max: "max corriente",
    running_sum: "suma corriente",
    blocks_written: "bloques escritos",
    decode_reads_summaries: "decode lee resúmenes",
    per_layer: "por capa",
    block_summaries: "resúmenes",
    cost: "coste",
    less_than_2: "< 2%",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("online");

  return (
    <Figure
      label={t.the_serving_two_percent}
      hint={t.online_softmax_two_phases_real_comm}
      legend={[
        { color: P.teal, label: t.two_phase },
        { color: P.violet, label: t.online },
        { color: P.amber, label: t.comm },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "online", label: t.online, tone: P.violet },
            { value: "twophase", label: t.two_phase, tone: P.teal },
            { value: "comm", label: t.comm, tone: P.amber },
          ]}
          ariaLabel={t.the_serving_two_percent}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "online" && (
          <>
            {/* keys stream in; a running m and l are kept */}
            {Array.from({ length: 6 }, (_, i) => (
              <Node3D
                key={i}
                position={[-2.6 + i * 0.55, 0.95 - (i % 2) * 0.2, 0]}
                color={P.teal}
                radius={0.11}
                matte
              />
            ))}
            <Flow points={[[-2.4, 0.7, 0], [-0.2, 0.4, 0]]} color={P.teal} count={3} size={0.04} />
            {/* running state */}
            <Halo position={[0.4, 0.3, 0]} radius={0.55} color={P.violet} opacity={0.55} spin={0.25} />
            <Node3D position={[0.4, 0.3, 0]} color={P.violet} radius={0.18} pulse={0.3} />
            <Tag position={[0.4, 0.85, 0.15]} tone="violet" size="xs">{t.running_max}</Tag>
            <Tag position={[0.4, -0.1, 0.15]} tone="violet" size="xs">{t.running_sum}</Tag>
            {/* normalized output */}
            <Flow points={[[0.85, 0.3, 0], [2.4, 0.3, 0]]} color={P.violet} count={2} />
            <Slab position={[2.6, 0.3, 0]} size={[0.9, 0.9, 0.12]} color={P.teal} fill={0.24} />
            <Tag position={[2.6, 0.95, 0.15]} tone="teal" size="xs">α</Tag>
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">rescale on the fly</Tag>
          </>
        )}

        {mode === "twophase" && (
          <>
            {/* prefill writes N block summaries */}
            <Slab position={[-1.9, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.teal} fill={0.16} />
            <Tag position={[-1.9, 1.55, 0.15]} tone="teal">prefill</Tag>
            {Array.from({ length: 9 }, (_, i) => (
              <Node3D
                key={i}
                position={[-2.65 + (i % 3) * 0.55, 0.9 - Math.floor(i / 3) * 0.4, 0.15]}
                color={P.teal}
                radius={0.1}
                matte
              />
            ))}
            <Tag position={[-1.9, -0.4, 0.15]} tone="muted" size="xs">{t.blocks_written}</Tag>
            {/* decode reads them back, plus the running partial */}
            <Slab position={[1.9, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.amber} fill={0.16} />
            <Tag position={[1.9, 1.55, 0.15]} tone="amber">decode</Tag>
            <Slab position={[1.9, 0.5, 0.15]} size={[1.7, 0.4, 0.06]} color={P.violet} fill={0.4} />
            <Tag position={[1.9, -0.4, 0.15]} tone="muted" size="xs">{t.decode_reads_summaries}</Tag>
            <Flow points={[[-0.75, 0.5, 0], [0.75, 0.5, 0]]} color={P.violet} count={3} />
          </>
        )}

        {mode === "comm" && (
          <>
            {/* two pipeline stages exchanging either per-layer outputs (fat) or block summaries (thin) */}
            <Slab position={[-2.0, 0.9, 0]} size={[1.9, 0.7, 0.14]} color={P.teal} fill={0.22} />
            <Tag position={[-2.0, 1.45, 0.15]} tone="teal" size="xs">stage k</Tag>
            <Slab position={[2.0, 0.9, 0]} size={[1.9, 0.7, 0.14]} color={P.violet} fill={0.22} />
            <Tag position={[2.0, 1.45, 0.15]} tone="violet" size="xs">stage k+1</Tag>
            {/* fat ribbon: per-layer */}
            <Ribbon points={[[-1.0, 0.75, 0], [0, 0.75, 0], [1.0, 0.75, 0]]} color={P.rose} radius={0.08} opacity={0.6} />
            <Tag position={[0, 1.25, 0.15]} tone="rose" size="xs">{t.per_layer} · O(L)</Tag>
            {/* thin ribbon: block summaries */}
            <Ribbon points={[[-1.0, -0.05, 0], [0, -0.05, 0], [1.0, -0.05, 0]]} color={P.teal} radius={0.025} opacity={0.9} />
            <Tag position={[0, -0.45, 0.15]} tone="teal" size="xs">{t.block_summaries} · O(N)</Tag>
            {/* the bill */}
            <Slab position={[0, -1.2, 0]} size={[2.0, 0.5, 0.12]} color={P.amber} fill={0.28} />
            <Tag position={[0, -1.65, 0.15]} tone="amber" size="xs">{t.cost}: {t.less_than_2}</Tag>
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
 * Lámina ES: softmax online sobre el eje de profundidad.
 * Seis fuentes (b0…b4 ya completados y el parcial intra-bloque) llegan
 * al mezclador de una capa. El estado corriente es (m, ℓ, acc): al llegar
 * un logit mayor que m, todo lo acumulado se reescala por e^(m−m'). Al
 * final, h = acc / ℓ coincide con el softmax de la concatenación.
 */

type OnlineMode = "stream" | "twophase";

const SOURCE_LABELS = ["b0", "b1", "b2", "b3", "b4", "parcial"];
const BASE_LOGITS = [0.6, 1.4, 0.2, 2.2, 1.0];
const CHANNELS = 4;
const VALUES: number[][] = [
  [0.82, 0.3, 0.55, 0.64],
  [0.4, 0.74, 0.28, 0.9],
  [0.66, 0.52, 0.86, 0.34],
  [0.26, 0.92, 0.46, 0.58],
  [0.94, 0.38, 0.7, 0.22],
  [0.5, 0.62, 0.96, 0.78],
];
const X0 = -3.1;
const DX = 0.92;
const LOGIT_Y = 0.9;
const BASE_TOP = 0.3;
const WEIGHT_Z = 1.25;
const TANK_X = 3.15;
const OUT_X = 4.35;
const WEIGHT_H = 0.95;

const es2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const es3 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

type OnlineState = { m: number; l: number; acc: number[]; seen: number };

function mergeGroup(state: OnlineState, logits: number[], group: number[]) {
  const mg = Math.max(...group.map((k) => logits[k]));
  const lg = group.reduce((sum, k) => sum + Math.exp(logits[k] - mg), 0);
  const og = Array.from({ length: CHANNELS }, (_, c) => group.reduce((sum, k) => sum + Math.exp(logits[k] - mg) * VALUES[k][c], 0));
  if (state.seen === 0) return { m: mg, l: lg, acc: og, seen: group.length };
  const m = Math.max(state.m, mg);
  const a = Math.exp(state.m - m);
  const b = Math.exp(mg - m);
  return {
    m,
    l: state.l * a + lg * b,
    acc: state.acc.map((v, c) => v * a + og[c] * b),
    seen: state.seen + group.length,
  };
}

function onlineModel(partialLogit: number, mode: OnlineMode) {
  const logits = [...BASE_LOGITS, partialLogit];
  const groups = mode === "stream" ? logits.map((_, k) => [k]) : [[0, 1, 2, 3, 4], [5]];
  const states: OnlineState[] = [{ m: -Infinity, l: 0, acc: Array(CHANNELS).fill(0), seen: 0 }];
  for (const group of groups) states.push(mergeGroup(states[states.length - 1], logits, group));
  const gm = Math.max(...logits);
  const gl = logits.reduce((s, v) => s + Math.exp(v - gm), 0);
  const reference = Array.from({ length: CHANNELS }, (_, c) => logits.reduce((s, v, k) => s + Math.exp(v - gm) * VALUES[k][c], 0) / gl);
  return { logits, groups, states, reference };
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

function DampedRod({ position, width, depth, height, color, opacity = 1 }: { position: V3; width: number; depth: number; height: number; color: string; opacity?: number }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const first = useRef(true);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = Math.max(0.001, height);
    const next = first.current || still ? target : MathUtils.damp(g.scale.y, target, 5, dt);
    first.current = false;
    g.scale.y = next;
    g.visible = next > 0.004;
  });
  return (
    <group position={position}>
      <group ref={ref} scale={[1, 0.001, 1]}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, 1, depth]} />
          <meshPhysicalMaterial color={color} roughness={0.34} clearcoat={0.5} clearcoatRoughness={0.22} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 0.98} />
        </mesh>
      </group>
    </group>
  );
}

function DampedPlane({ y, x0, x1, visible }: { y: number; x0: number; x1: number; visible: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = still ? y : MathUtils.damp(g.position.y, y, 5, dt);
  });
  return (
    <group ref={ref} position={[0, y, 0]} visible={visible}>
      <mesh position={[(x0 + x1) / 2, 0, 0.1]}>
        <boxGeometry args={[x1 - x0, 0.012, 1.1]} />
        <meshPhysicalMaterial color={P.violet} transparent opacity={0.22} roughness={0.2} clearcoat={0.8} depthWrite={false} />
      </mesh>
      <Wire points={[[x0, 0.008, 0.65], [x1, 0.008, 0.65]]} color={P.violet} width={1.6} opacity={0.9} />
      <Tag position={[x0 - 0.12, 0.02, 0.65]} tone="violet" size="xs">
        máx m
      </Tag>
    </group>
  );
}

function OnlineBench({ mode, step, partialLogit }: { mode: OnlineMode; step: number; partialLogit: number }) {
  const model = useMemo(() => onlineModel(partialLogit, mode), [partialLogit, mode]);
  const state = model.states[step];
  const seen = state.seen;
  const current = step > 0 ? model.groups[step - 1] : [];
  const xs = model.logits.map((_, k) => X0 + k * DX + (k === 5 ? 0.35 : 0));
  const weights = model.logits.map((s, k) => (k < seen ? Math.exp(s - state.m) : 0));
  const output = state.acc.map((v) => (state.l > 0 ? v / state.l : 0));
  const heights = weights.map((w) => w * WEIGHT_H * 0.55);
  const stack = heights.map((h, k) => ({
    k,
    h,
    y: BASE_TOP + 0.08 + heights.slice(0, k).reduce((sum, v) => sum + v, 0),
  }));

  return (
    <group>
      <ShadowBlob position={[0.4, 0.004, 0.5]} scale={10} opacity={0.1} />
      <RoundedBox args={[9.6, 0.24, 3.9]} position={[0.55, 0.12, 0.7]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[5.95, 0.06, 3.4]} position={[X0 + 2.45, BASE_TOP - 0.03, 0.7]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#C9BFAD" roughness={0.55} />
      </RoundedBox>
      {mode === "twophase" ? (
        <group>
          <RoundedBox args={[4.4, 0.05, 2.5]} position={[X0 + 1.84, BASE_TOP + 0.01, 0.45]} radius={0.025} smoothness={2} receiveShadow>
            <meshStandardMaterial color={mixHex("#C9BFAD", P.violet, 0.3)} roughness={0.5} />
          </RoundedBox>
          <Tag position={[X0 + 1.84, BASE_TOP, 2.4]} tone="violet" size="xs" center>
            fase 1 agrupada
          </Tag>
          <Tag position={[xs[5], BASE_TOP, 2.4]} tone="violet" size="xs" center>
            fase 2
          </Tag>
        </group>
      ) : null}

      {model.logits.map((s, k) => {
        const x = xs[k];
        const done = k < seen;
        const active = current.includes(k);
        const tone = k === 5 ? P.violet : P.teal;
        const color = done ? (active ? tone : mixHex(P.paper, tone, 0.72)) : mixHex(P.paper, tone, 0.18);
        return (
          <group key={k}>
            <RoundedBox args={[0.5, 0.06, 0.5]} position={[x, BASE_TOP + 0.03, 0]} radius={0.02} smoothness={2} castShadow receiveShadow>
              <meshStandardMaterial color={active ? "#B7833E" : "#8C9895"} metalness={0.55} roughness={0.35} />
            </RoundedBox>
            <DampedRod position={[x, BASE_TOP + 0.06, 0]} width={0.34} depth={0.34} height={Math.max(0.05, s) * LOGIT_Y} color={color} opacity={done ? 1 : 0.55} />
            <group position={[x, BASE_TOP + 0.02, 0.62]}>
              <RoundedBox args={[0.5, 0.04, 0.2]} radius={0.015} smoothness={2} receiveShadow>
                <meshStandardMaterial color="#B9B09E" roughness={0.5} />
              </RoundedBox>
              {VALUES[k].map((v, c) => (
                <mesh key={c} position={[-0.18 + c * 0.12, 0.02 + v * 0.14, 0]} castShadow>
                  <boxGeometry args={[0.08, v * 0.28, 0.1]} />
                  <meshStandardMaterial color={done ? mixHex(P.paper, P.amber, 0.8) : "#CFC8B8"} roughness={0.45} />
                </mesh>
              ))}
            </group>
            <DampedRod position={[x, BASE_TOP + 0.02, WEIGHT_Z]} width={0.3} depth={0.3} height={weights[k] * WEIGHT_H} color={active ? P.amber : mixHex(P.paper, P.amber, 0.7)} />
            <Tag position={[x, BASE_TOP - 0.02, WEIGHT_Z + 0.52]} tone={k === 5 ? "violet" : "teal"} size="xs" center plate={false}>
              {SOURCE_LABELS[k]}
            </Tag>
          </group>
        );
      })}
      <Tag position={[X0 - 0.55, BASE_TOP + 0.45, 0]} tone="teal" size="xs" center>
        logits s
      </Tag>
      <Tag position={[X0 - 0.55, BASE_TOP + 0.4, WEIGHT_Z]} tone="amber" size="xs" center>
        e^(s−m)
      </Tag>

      <DampedPlane y={BASE_TOP + 0.06 + (seen ? state.m : 0) * LOGIT_Y} x0={xs[0] - 0.3} x1={xs[5] + 0.3} visible={seen > 0} />

      {/* acumulador ℓ: las mismas pesas, apiladas */}
      <group>
        <RoundedBox args={[0.9, 0.08, 0.9]} position={[TANK_X, BASE_TOP + 0.04, WEIGHT_Z - 0.4]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.35} />
        </RoundedBox>
        <mesh position={[TANK_X, BASE_TOP + 1.05, WEIGHT_Z - 0.4]}>
          <cylinderGeometry args={[0.36, 0.36, 1.95, 40, 1, true]} />
          <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.16} roughness={0.08} clearcoat={1} depthWrite={false} side={2} />
        </mesh>
        <Halo position={[TANK_X, BASE_TOP + 2.03, WEIGHT_Z - 0.4]} radius={0.36} thickness={0.012} color={P.lineStrong} />
        {stack.map(({ k, y, h }) => (
          <DampedRod key={k} position={[TANK_X, y, WEIGHT_Z - 0.4]} width={0.44} depth={0.44} height={Math.max(0, h - 0.02)} color={k === 5 ? P.violet : mixHex(P.teal, P.amber, 0.25 + k * 0.1)} />
        ))}
        <Tag position={[TANK_X, BASE_TOP + 2.3, WEIGHT_Z - 0.4]} tone="ink" size="xs" center>
          suma ℓ
        </Tag>
      </group>

      {/* salida normalizada frente a la referencia concatenada */}
      <group position={[OUT_X, BASE_TOP, WEIGHT_Z - 0.4]}>
        <RoundedBox args={[0.9, 0.08, 0.5]} position={[0, 0.04, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color="#2C3332" roughness={0.4} metalness={0.2} />
        </RoundedBox>
        {output.map((v, c) => {
          const x = -0.3 + c * 0.2;
          const ref = model.reference[c] * 1.4;
          return (
            <group key={c}>
              <DampedRod position={[x, 0.08, 0]} width={0.14} depth={0.3} height={v * 1.4} color={P.violet} />
              <mesh position={[x, 0.08 + ref, 0]}>
                <boxGeometry args={[0.2, 0.025, 0.36]} />
                <meshStandardMaterial color={P.ink} roughness={0.5} />
              </mesh>
            </group>
          );
        })}
        <Tag position={[0, 1.75, 0]} tone="violet" size="xs" center>
          salida h
        </Tag>
      </group>

      {current.length ? (
        <Flow
          points={[[xs[current[current.length - 1]], BASE_TOP + 1.1, WEIGHT_Z], [TANK_X - 0.9, BASE_TOP + 2.4, WEIGHT_Z - 0.2], [TANK_X, BASE_TOP + 2.1, WEIGHT_Z - 0.4]]}
          color={P.amber}
          count={3}
          size={0.045}
          speed={0.5}
          lineOpacity={0.3}
        />
      ) : null}
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<OnlineMode>("stream");
  const [partialLogit, setPartialLogit] = useState(1.6);
  const model = useMemo(() => onlineModel(partialLogit, mode), [partialLogit, mode]);
  const total = model.states.length;
  const [step, setStep] = useState(0);
  const safeStep = Math.min(step, total - 1);
  const state = model.states[safeStep];
  const prev = model.states[Math.max(0, safeStep - 1)];
  const group = safeStep > 0 ? model.groups[safeStep - 1] : [];
  const output = state.acc.map((v) => (state.l > 0 ? v / state.l : 0));
  const done = safeStep === total - 1;
  const error = done ? Math.max(...output.map((v, c) => Math.abs(v - model.reference[c]))) : NaN;
  const groupMax = group.length ? Math.max(...group.map((k) => model.logits[k])) : 0;
  const rescale = safeStep > 1 ? Math.exp(prev.m - state.m) : 1;
  const names = group.map((k) => SOURCE_LABELS[k]).join(", ");

  let sentence: string;
  if (safeStep === 0) {
    sentence = "Estado vacío: m = −∞, ℓ = 0. Todavía no se ha leído ninguna fuente.";
  } else if (safeStep === 1) {
    sentence =
      mode === "twophase"
        ? `Fase 1: una sola atención agrupada contra b0…b4 devuelve m₁ = ${es2.format(state.m)}, ℓ₁ = ${es3.format(state.l)} y la salida sin normalizar. Esos tres tensores son todo lo que se guarda.`
        : `Llega b0 con s = ${es2.format(model.logits[0])}. Es la primera fuente: m = ${es2.format(state.m)} y ℓ = e⁰ = 1.`;
  } else if (state.m > prev.m) {
    sentence = `Llega ${names} con s = ${es2.format(groupMax)}, mayor que m = ${es2.format(prev.m)}. El máximo sube y todo lo acumulado se multiplica por e^(${es2.format(prev.m)}−${es2.format(state.m)}) = ${es3.format(rescale)}: por eso encogen las pesas anteriores.`;
  } else {
    sentence = `Llega ${names} con s = ${es2.format(groupMax)} ≤ m = ${es2.format(state.m)}. El máximo no cambia: solo se suma e^(s−m) = ${es3.format(Math.exp(groupMax - state.m))} a ℓ y su valor ponderado al acumulador.`;
  }

  const note = (
    <div className="space-y-3">
      <p>
        <strong className="font-medium text-ink">
          Paso {safeStep} de {total - 1}.
        </strong>{" "}
        {sentence}
      </p>
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        m ← max(m₁, m₂) · ℓ ← e^(m₁−m)·ℓ₁ + e^(m₂−m)·ℓ₂ · acc ← e^(m₁−m)·acc₁ + e^(m₂−m)·acc₂ · h = acc / ℓ
        <br />
        ahora: m = {state.seen ? es2.format(state.m) : "−∞"} · ℓ = {es3.format(state.l)} · h = [{output.map((v) => es3.format(v)).join("; ")}]
      </p>
      <p>
        {done
          ? `Terminado: h coincide con el softmax de la concatenación (marcas negras) con un error máximo de ${error < 1e-12 ? "menos de 10⁻¹²" : error.toExponential(1)}. Nunca se construyó una lista de puntuaciones ni se volvió a leer una fuente.`
          : "Las marcas negras sobre la salida son el softmax de referencia de las seis fuentes a la vez; las barras violetas llegan a ellas al terminar el recorrido."}{" "}
        {mode === "twophase"
          ? "En dos fases, b0…b4 se leen una vez por bloque; en cada capa solo se pliega el parcial."
          : "En modo paso a paso cada fuente se pliega en el estado sin guardar las anteriores."}
      </p>
      <p className="text-xs text-muted">
        Números didácticos: seis fuentes, valores de cuatro canales y logits fijos; solo el del parcial se ajusta. El estado (m, ℓ, acc) es el
        mismo esquema que FlashAttention usa sobre tokens, aquí sobre el eje de profundidad.
      </p>
    </div>
  );

  return (
    <Figure
      label="Softmax online: fusionar sin volver atrás"
      hint="máximo corriente · suma corriente · reescalado"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "resúmenes b0…b4" },
        { color: P.violet, label: "parcial y salida" },
        { color: P.amber, label: "pesos e^(s−m)" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Esquema de fusión"
            value={mode}
            onChange={(value) => {
              setMode(value);
              setStep(0);
            }}
            options={[
              { value: "stream", label: "Paso a paso", tone: P.teal },
              { value: "twophase", label: "Dos fases", tone: P.violet },
            ]}
          />
          <Knob label="Logit parcial" min={-0.5} max={3} step={0.1} value={partialLogit} onChange={setPartialLogit} format={(v) => es2.format(v)} tone={P.violet} />
          <button type="button" className="chip" onClick={() => setStep((s) => (Math.min(s, total - 1) + 1) % total)}>
            Paso
          </button>
          <button type="button" className="chip" onClick={() => setStep(0)}>
            Reiniciar
          </button>
          <Readout
            items={[
              { label: "m", value: state.seen ? es2.format(state.m) : "−∞", tone: P.violet },
              { label: "ℓ", value: es3.format(state.l), tone: P.amber },
            ]}
          />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3.2, 5.4, 10.5], fov: 34 }} fit={1.06}>
        <OnlineBench mode={mode} step={safeStep} partialLogit={partialLogit} />
        <Ticker seconds={2.1} onTick={() => setStep((s) => (Math.min(s, total - 1) + 1) % total)} />
      </Stage>
    </Figure>
  );
}

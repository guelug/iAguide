"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
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
} from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Kimi Linear is a hybrid stack; NoPE leaves position to KDA; a 75% smaller KV
   is the claim that matters to serving. */
type Mode = "hybrid" | "nope" | "kv";

const COPY = {
  en: {
    hybrid_not_pure_rnn: "hybrid, not a pure rnn",
    three_out_of_four_layers_are_kda: "3 of 4 layers are KDA",
    hybrid: "hybrid",
    nope: "nope",
    kv_savings: "kv −75%",
    kda_layer: "kda layer",
    full_attention_layer: "full attn layer",
    carries_position: "kda carries position",
    no_rope_in_mla: "no rope in mla",
    kv_48b_full: "kv at 48b, full",
    kv_48b_kda: "kv at 48b, kda",
    four_to_one: "4:1",
    same_model: "same model",
  },
  es: {
    hybrid_not_pure_rnn: "híbrido, no un rnn puro",
    three_out_of_four_layers_are_kda: "3 de 4 capas son kda",
    hybrid: "híbrido",
    nope: "nope",
    kv_savings: "kv −75%",
    kda_layer: "capa kda",
    full_attention_layer: "capa full attn",
    carries_position: "kda carga la posición",
    no_rope_in_mla: "sin rope en mla",
    kv_48b_full: "kv en 48b, full",
    kv_48b_kda: "kv en 48b, kda",
    four_to_one: "4:1",
    same_model: "mismo modelo",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("hybrid");

  const kvFull = Array.from({ length: 48 }, (_, i) => ({
    position: [
      -2.4 + (i % 8) * 0.3,
      0.9 - Math.floor(i / 8) * 0.3,
      0,
    ] as [number, number, number],
    color: P.teal,
  }));
  const kvKda = kvFull.filter((_, i) => i % 4 === 0).map((c) => ({
    ...c,
    position: [c.position[0] * 0.4 + 1.6, c.position[1], 0] as [number, number, number],
    color: P.violet,
  }));

  return (
    <Figure
      label={t.hybrid_not_pure_rnn}
      hint={t.three_out_of_four_layers_are_kda}
      legend={[
        { color: P.violet, label: t.kda_layer },
        { color: P.teal, label: t.full_attention_layer },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "hybrid", label: t.hybrid, tone: P.violet },
            { value: "nope", label: t.nope, tone: P.amber },
            { value: "kv", label: t.kv_savings, tone: P.teal },
          ]}
          ariaLabel={t.hybrid_not_pure_rnn}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "hybrid" && (
          <>
            {/* a 4-layer sandwich: KDA, KDA, KDA, FULL */}
            {[0, 1, 2, 3].map((i) => {
              const full = i === 3;
              return (
                <group key={i}>
                  <Slab
                    position={[0, 1.0 - i * 0.62, 0]}
                    size={[4.4, 0.42, 0.14]}
                    color={full ? P.teal : P.violet}
                    fill={full ? 0.28 : 0.16}
                  />
                  <Tag
                    position={[-2.6, 1.0 - i * 0.62, 0.15]}
                    tone={full ? "teal" : "violet"}
                    size="xs"
                  >
                    {full ? t.full_attention_layer : t.kda_layer}
                  </Tag>
                </group>
              );
            })}
            <Flow points={[[0, 1.6, 0], [0, -0.7, 0]]} color={P.muted} count={4} size={0.04} />
            <Tag position={[2.7, 0.35, 0.2]} tone="ink">4:1</Tag>
          </>
        )}

        {mode === "nope" && (
          <>
            {/* MLA without rope: a stack of heads with no positional spiral */}
            <Slab position={[-1.3, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.teal} fill={0.14} />
            <Tag position={[-1.3, 1.7, 0.2]} tone="teal">MLA</Tag>
            {[[-1.8, 0.85], [-1.1, 0.9], [-1.6, 0.2], [-0.9, 0.2]].map(([x, y], i) => (
              <Node3D key={i} position={[x, y, 0.1]} color={P.teal} radius={0.11} matte />
            ))}
            <Tag position={[-1.3, -0.55, 0.2]} tone="muted" size="xs">{t.no_rope_in_mla}</Tag>
            {/* KDA carries the position signal instead */}
            <Slab position={[1.5, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.violet} fill={0.14} />
            <Tag position={[1.5, 1.7, 0.2]} tone="violet">KDA</Tag>
            {/* the positional wave INSIDE the decay */}
            <Ribbon
              points={Array.from({ length: 24 }, (_, i) => [
                0.75 + i * 0.07,
                0.45 + Math.sin(i * 0.55) * 0.35 * Math.exp(-i * 0.04),
                0.1,
              ])}
              color={P.violet}
              radius={0.018}
            />
            <Tag position={[1.5, -0.55, 0.2]} tone="violet" size="xs">{t.carries_position}</Tag>
            <Flow points={[[-0.1, 0.5, 0], [0.4, 0.5, 0]]} color={P.amber} count={3} size={0.05} />
          </>
        )}

        {mode === "kv" && (
          <>
            <Lattice cells={kvFull} size={0.16} opacity={0.9} />
            <Lattice cells={kvKda} size={0.16} opacity={0.95} />
            <Tag position={[-1.35, 1.65, 0.2]} tone="teal" size="xs">{t.kv_48b_full}</Tag>
            <Tag position={[1.55, 1.65, 0.2]} tone="violet" size="xs">{t.kv_48b_kda}</Tag>
            <Halo position={[1.55, 0.0, 0]} radius={1.15} color={P.violet} opacity={0.3} spin={0.15} />
            <Tag position={[2.8, -0.9, 0.2]} tone="ink">{t.four_to_one}</Tag>
            <Tag position={[0.1, -1.6, 0.2]} tone="muted" size="xs">{t.same_model}</Tag>
            <Wire points={[[-0.2, 0.0, 0], [0.9, 0.0, 0]]} color={P.lineStrong} dashed opacity={0.6} />
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
 * Lámina ES: el sándwich KDA:MLA sobre el modelo de 16 capas de la
 * ablación (Tabla 1 del paper). El control elige la proporción; la torre
 * se recompone, la caché KV es proporcional al número de capas MLA y las
 * barras muestran la perplejidad de validación medida para cada proporción.
 * NoPE/RoPE cambia las capas MLA y la cifra RULER de contexto largo.
 */

type Pos = "nope" | "rope";

const LAYERS = 16;
const RATIOS = [
  { r: 0, label: "0:1", val: 5.77, train: "9,45", name: "MLA puro" },
  { r: 1, label: "1:1", val: 5.66, train: "9,29", name: "1:1" },
  { r: 3, label: "3:1", val: 5.65, train: "9,23", name: "3:1" },
  { r: 7, label: "7:1", val: 5.7, train: "9,23", name: "7:1" },
  { r: 15, label: "15:1", val: 5.82, train: "—", name: "15:1" },
];
const RULER = { nope: 84.3, rope: 78.8 };
const PLATE_DY = 0.19;

const isMla = (r: number, layer: number) => (layer + 1) % (r + 1) === 0;

function Sandwich({ r, pos }: { r: number; pos: Pos }) {
  const y = (l: number) => 0.5 + l * PLATE_DY;
  return (
    <group>
      {Array.from({ length: LAYERS }, (_, l) => {
        const mla = isMla(r, l);
        return (
          <group key={l} position={[0, y(l), 0]}>
            <RoundedBox args={[1.7, 0.11, 1.15]} radius={0.035} smoothness={2} castShadow receiveShadow>
              <meshPhysicalMaterial color={mla ? mixHex(P.paper, P.amber, 0.8) : mixHex(P.paper, P.teal, 0.7)} roughness={0.4} clearcoat={0.45} clearcoatRoughness={0.28} />
            </RoundedBox>
            {mla ? (
              pos === "rope" ? (
                <mesh position={[0.55, 0, 0.6]}>
                  <torusGeometry args={[0.055, 0.018, 10, 28]} />
                  <meshStandardMaterial color={P.rose} roughness={0.4} />
                </mesh>
              ) : null
            ) : (
              <mesh position={[0.55, 0, 0.59]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.04, 18]} />
                <meshStandardMaterial color={P.tealDeep} roughness={0.4} />
              </mesh>
            )}
          </group>
        );
      })}
      {[-0.78, 0.78].flatMap((dx) =>
        [-0.5, 0.5].map((dz) => (
          <mesh key={`${dx}:${dz}`} position={[dx, y(LAYERS / 2) - 0.1, dz]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, LAYERS * PLATE_DY + 0.25, 8]} />
            <meshStandardMaterial color="#8C9895" metalness={0.7} roughness={0.3} />
          </mesh>
        )),
      )}
      <Tag position={[0, y(LAYERS) + 0.2, 0]} tone="ink" size="xs" center>
        16 capas
      </Tag>
    </group>
  );
}

function KvColumn({ mla }: { mla: number }) {
  const H = 3.0;
  const h = Math.max(0.02, (mla / LAYERS) * H);
  return (
    <group position={[2.3, 0.3, 0]}>
      <RoundedBox args={[0.9, 0.1, 0.9]} position={[0, 0.05, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.5} roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0.1 + H / 2, 0]}>
        <cylinderGeometry args={[0.36, 0.36, H, 40, 1, true]} />
        <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.14} roughness={0.08} clearcoat={1} depthWrite={false} side={2} />
      </mesh>
      <mesh position={[0, 0.1 + h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, h, 40]} />
        <meshPhysicalMaterial color={P.amber} roughness={0.35} clearcoat={0.5} />
      </mesh>
      <Tag position={[0, 0.1 + H + 0.25, 0]} tone="amber" size="xs" center>
        {`caché KV ${Math.round((mla / LAYERS) * 100)} %`}
      </Tag>
    </group>
  );
}

function PplBars({ idx }: { idx: number }) {
  const bx = (i: number) => -4.3 + i * 0.5;
  const hOf = (v: number) => (v - 5.55) * 7;
  return (
    <group>
      <RoundedBox args={[2.8, 0.1, 1.0]} position={[bx(2), 0.35, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#2C3332" roughness={0.42} metalness={0.2} />
      </RoundedBox>
      {RATIOS.map((q, i) => (
        <group key={q.label}>
          <RoundedBox args={[0.34, hOf(q.val), 0.34]} position={[bx(i), 0.4 + hOf(q.val) / 2, 0]} radius={0.03} smoothness={2} castShadow>
            <meshPhysicalMaterial color={i === idx ? P.violet : mixHex(P.paper, P.violet, 0.4)} roughness={0.35} clearcoat={0.5} />
          </RoundedBox>
          <Tag position={[bx(i), 0.3, 0.62]} tone={i === idx ? "ink" : "muted"} size="xs" center plate={false}>
            {q.label}
          </Tag>
        </group>
      ))}
      <Tag position={[bx(idx), 0.4 + hOf(RATIOS[idx].val) + 0.22, 0]} tone="violet" size="xs" center>
        {`val ${String(RATIOS[idx].val).replace(".", ",")}`}
      </Tag>
      <Tag position={[bx(2), 2.25, 0]} tone="muted" size="xs" center plate={false}>
        perplejidad
      </Tag>
    </group>
  );
}

function SpanishVisual() {
  const [idx, setIdx] = useState(2);
  const [pos, setPos] = useState<Pos>("nope");
  const q = RATIOS[idx];
  const mla = Array.from({ length: LAYERS }, (_, l) => isMla(q.r, l)).filter(Boolean).length;
  const kda = LAYERS - mla;
  const saving = 1 - mla / LAYERS;

  const comment: Record<number, string> = {
    0: "MLA puro: todas las capas guardan caché KV. En la corrida justa de 1,4T perdía (val 5,77).",
    1: "1:1 gasta la mitad de la pila en capas globales y apenas gana calidad (val 5,66): mucho presupuesto de decode por poco.",
    3: "3:1 es el mejor equilibrio de la Tabla 1 (val 5,65): una capa MLA cada cuatro, y la caché KV cae un 75 %.",
    7: "7:1 entrena igual (9,23) pero generaliza peor (val 5,70).",
    15: "15:1 deja demasiadas pocas capas globales para copiar y recuperar (val 5,82).",
  };

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
        {[
          ["Capas KDA : MLA", `${kda} : ${mla}`],
          ["Caché KV frente a MLA puro", `−${Math.round(saving * 100)} %`],
          ["PPL val · train", `${String(q.val).replace(".", ",")} · ${q.train}`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>{comment[q.r]}</p>
      <p>
        {pos === "nope"
          ? `NoPE: las capas MLA no llevan RoPE; la posición y la recencia las cargan las capas KDA (su transición con puerta ya es una señal posicional). RULER a contexto largo: ${String(RULER.nope).replace(".", ",")}.`
          : `Con RoPE en las capas MLA (anillos rosas) el híbrido rendía peor en contexto largo: RULER ${String(RULER.rope).replace(".", ",")} frente a ${String(RULER.nope).replace(".", ",")} con NoPE. No añadas RoPE «por si acaso».`}
      </p>
      <p className="text-xs text-muted">
        Perplejidades del modelo de scaling law de 16 capas (Tabla 1 del paper Kimi Linear); el eje de las barras empieza en 5,55 para que se vean las
        diferencias. Caché KV relativa = capas MLA / 16, ignorando el estado fijo de KDA.
      </p>
    </div>
  );

  return (
    <Figure
      label="El sándwich KDA:MLA y la caché que queda"
      hint="16 capas · Tabla 1 del paper · NoPE en MLA"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "capa KDA" },
        { color: P.amber, label: "capa MLA / caché KV" },
        { color: P.violet, label: "perplejidad val" },
      ]}
      note={note}
      controls={
        <>
          <Knob label="KDA:MLA" min={0} max={RATIOS.length - 1} value={idx} onChange={setIdx} format={(i) => RATIOS[i].label} tone={P.teal} />
          <Switcher
            ariaLabel="Posición en MLA"
            value={pos}
            onChange={setPos}
            options={[
              { value: "nope", label: "NoPE", tone: P.teal },
              { value: "rope", label: "RoPE", tone: P.rose },
            ]}
          />
          <Readout items={[{ label: "KV", value: `${Math.round((mla / LAYERS) * 100)} %`, tone: P.amber }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3, 4.8, 10], fov: 34 }} fit={1.08}>
        <ShadowBlob position={[-0.9, 0.004, 0]} scale={8} opacity={0.1} />
        <RoundedBox args={[8.4, 0.24, 2.4]} position={[-0.9, 0.12, 0.1]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
        </RoundedBox>
        <Sandwich r={q.r} pos={pos} />
        <KvColumn mla={mla} />
        <PplBars idx={idx} />
        <Flow points={[[0.9, 0.5 + 15 * PLATE_DY, 0], [1.6, 3.2, 0], [2.3, 0.4 + (mla / LAYERS) * 3.0 + 0.1, 0]]} color={P.amber} count={2} size={0.04} speed={0.4} lineOpacity={0.25} />
      </Stage>
    </Figure>
  );
}

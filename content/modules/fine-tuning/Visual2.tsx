"use client";

import { useState, useRef } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire, ShadowBlob, Arrow } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type Group } from "three";
import { useLocale } from "next-intl";

/* Fine-tuning: SFT vs DPO, catastrophic forgetting, held-out eval. */
type Mode = "paths" | "forget" | "eval";

const COPY = {
  en: {
    two_recipes_one_base: "two recipes, one base",
    sft_dpo_forgetting_eval: "sft · dpo · forgetting · eval",
    paths: "paths",
    forgetting: "forgetting",
    eval: "eval",
    sft: "SFT",
    dpo: "DPO",
    examples: "examples",
    chosen: "chosen",
    rejected: "rejected",
    before: "before",
    after: "after",
    fluent_but_generic: "fluent but generic",
    sharp_but_narrow: "sharp but narrow",
    held_out: "held-out",
    train: "train",
  },
  es: {
    two_recipes_one_base: "dos recetas, una base",
    sft_dpo_forgetting_eval: "sft · dpo · olvido · eval",
    paths: "caminos",
    forgetting: "olvido",
    eval: "eval",
    sft: "SFT",
    dpo: "DPO",
    examples: "ejemplos",
    chosen: "elegido",
    rejected: "rechazado",
    before: "antes",
    after: "después",
    fluent_but_generic: "fluido pero genérico",
    sharp_but_narrow: "afilado pero estrecho",
    held_out: "held-out",
    train: "train",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("paths");

  const trainCells = Array.from({ length: 18 }, (_, i) => ({
    position: [-2.0 + (i % 6) * 0.45, 0.4 - Math.floor(i / 6) * 0.42, 0] as [number, number, number],
    color: P.teal,
  }));
  const holdCells = Array.from({ length: 6 }, (_, i) => ({
    position: [1.6 + (i % 3) * 0.45, 0.4 - Math.floor(i / 3) * 0.45, 0] as [number, number, number],
    color: P.violet,
  }));

  return (
    <Figure
      label={t.two_recipes_one_base}
      hint={t.sft_dpo_forgetting_eval}
      legend={[
        { color: P.teal, label: t.sft },
        { color: P.amber, label: t.dpo },
        { color: P.rose, label: t.forgetting },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "paths", label: t.paths, tone: P.teal },
            { value: "forget", label: t.forgetting, tone: P.rose },
            { value: "eval", label: t.eval, tone: P.violet },
          ]}
          ariaLabel={t.two_recipes_one_base}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "paths" && (
          <>
            <Slab position={[0, 1.55, 0]} size={[1.8, 0.55, 0.12]} color={P.violet} fill={0.24} />
            <Tag position={[0, 1.95, 0.15]} tone="violet" size="xs">base model</Tag>
            {/* two arms */}
            <Flow points={[[-0.6, 1.3, 0], [-1.6, 0.7, 0]]} color={P.teal} count={2} size={0.045} />
            <Flow points={[[0.6, 1.3, 0], [1.6, 0.7, 0]]} color={P.amber} count={2} size={0.045} />
            {/* SFT arm: pairs of examples */}
            <Lattice cells={Array.from({ length: 6 }, (_, i) => ({
              position: [-2.3 + (i % 2) * 0.5, 0.4 - Math.floor(i / 2) * 0.45, 0] as [number, number, number],
              color: P.teal,
            }))} size={0.16} opacity={0.9} />
            <Tag position={[-1.95, -0.85, 0.15]} tone="teal">{t.sft} · {t.examples}</Tag>
            {/* DPO arm: chosen vs rejected pairs */}
            {[0, 1, 2].map((i) => (
              <group key={i}>
                <Node3D position={[1.6, 0.4 - i * 0.45, 0]} color={P.teal} radius={0.11} matte />
                <Node3D position={[2.3, 0.4 - i * 0.45, 0]} color={P.rose} radius={0.11} matte />
                <Wire points={[[1.75, 0.4 - i * 0.45, 0], [2.15, 0.4 - i * 0.45, 0]]} color={P.lineStrong} opacity={0.5} />
              </group>
            ))}
            <Tag position={[1.95, -0.95, 0.15]} tone="amber">{t.dpo} · {t.chosen}/{t.rejected}</Tag>
          </>
        )}

        {mode === "forget" && (
          <>
            {/* capability landscape before vs after */}
            <Ribbon
              points={Array.from({ length: 28 }, (_, i) => [-2.6 + i * 0.19, 0.5 + Math.sin(i * 0.4) * 0.7, 0])}
              color={P.teal}
              radius={0.03}
              opacity={0.9}
            />
            <Tag position={[-2.2, 1.6, 0.15]} tone="teal" size="xs">{t.before}</Tag>
            <Ribbon
              points={Array.from({ length: 28 }, (_, i) => {
                const x = -2.6 + i * 0.19;
                const spike = Math.exp(-Math.pow((x + 0.4) / 0.5, 2)) * 1.4;
                return [x, -1.3 + spike + Math.sin(i * 0.4) * 0.08, 0];
              })}
              color={P.rose}
              radius={0.03}
              opacity={0.9}
            />
            <Tag position={[2.3, 0.3, 0.15]} tone="rose" size="xs">{t.after}</Tag>
            <Wire points={[[-2.8, 0.05, 0], [2.8, 0.05, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Tag position={[-2.0, -1.7, 0.15]} tone="muted" size="xs">{t.fluent_but_generic} →</Tag>
            <Tag position={[1.5, -1.7, 0.15]} tone="rose" size="xs">{t.sharp_but_narrow}</Tag>
          </>
        )}

        {mode === "eval" && (
          <>
            {/* train vs held-out split, held-out sealed */}
            <Lattice cells={trainCells} size={0.22} opacity={0.85} />
            <Tag position={[-0.9, 1.15, 0.15]} tone="teal">{t.train}</Tag>
            <Slab position={[2.05, 0.0, 0]} size={[2.0, 1.6, 0.14]} color={P.violet} fill={0.1} rim={0.9} />
            <Lattice cells={holdCells} size={0.22} opacity={0.95} />
            <Tag position={[2.05, 1.15, 0.15]} tone="violet">{t.held_out}</Tag>
            <Halo position={[2.05, 0.0, 0]} radius={1.2} color={P.violet} opacity={0.4} spin={0.15} />
            {/* never cross the seam during training */}
            <Wire points={[[0.4, -0.8, 0], [0.4, 1.5, 0]]} color={P.rose} dashed opacity={0.7} />
            <Tag position={[0.4, -1.3, 0.15]} tone="rose" size="xs">no pasar</Tag>
            <Flow points={[[2.05, -0.85, 0], [2.05, -1.6, 0]]} color={P.violet} count={2} size={0.05} />
            <Tag position={[2.05, -1.95, 0.15]} tone="muted" size="xs">eval al final</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Tres bancos sobre la misma base:
 *  - Recetas: SFT sube la probabilidad de la respuesta de ejemplo; DPO
 *    abre el margen entre elegida y rechazada respecto a la referencia.
 *    Las log-probabilidades de partida y su avance por paso son de
 *    juguete; las pérdidas se calculan con las fórmulas de la lección.
 *  - Olvido: seis capacidades antes/después. Modelo de juguete declarado:
 *    la tarea de dominio gana +0,35; las capacidades generales pierden
 *    hasta 0,4 y esa caída se reduce linealmente con el porcentaje de
 *    ejemplos generales mezclados, hasta anularse al 15 %.
 *  - Evaluación: IC del 95 % de una tasa de acierto p = 0,8 medida sobre n
 *    prompts reservados: ±1,96·√(p(1−p)/n). Estadística real.
 */

type Ft2Mode = "recipes" | "forget" | "eval";

const BETA = 0.1;
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Toy policy log-probs after `step` updates (0..10). */
function recipeModel(step: number) {
  const t = step / 10;
  const pSft = 0.18 + 0.62 * t; // p(y|x) of the SFT target answer
  const sftLoss = -Math.log(pSft);
  // DPO: log-ratios of policy vs reference for chosen (w) and rejected (l).
  const ratioW = 4 * t; // chosen rises
  const ratioL = -6 * t; // rejected falls
  const margin = BETA * (ratioW - ratioL);
  const dpoLoss = -Math.log(sigmoid(margin));
  return { pSft, sftLoss, margin, dpoLoss };
}

const SKILLS = [
  { name: "saludo", general: true, before: 0.82 },
  { name: "charla", general: true, before: 0.76 },
  { name: "«no sé»", general: true, before: 0.64 },
  { name: "formato", general: true, before: 0.7 },
  { name: "dominio", general: false, before: 0.38 },
  { name: "resumen", general: true, before: 0.72 },
];

function forgetModel(mixPct: number) {
  const protect = Math.min(1, mixPct / 15);
  return SKILLS.map((s) => ({
    ...s,
    after: s.general ? Math.max(0.05, s.before - 0.4 * (1 - protect)) : Math.min(0.95, s.before + 0.35),
  }));
}

const P_ACC = 0.8;
function ciHalf(n: number) {
  return 1.96 * Math.sqrt((P_ACC * (1 - P_ACC)) / n);
}

const F2 = {
  base: "#2e3437",
  baseTop: "#434a4e",
  brass: "#b68442",
  steel: "#a1a8ab",
  ceramic: "#efebe2",
};

function Bench2() {
  return (
    <group>
      <ShadowBlob position={[0, -0.36, 0.2]} scale={10} opacity={0.12} />
      <RoundedBox args={[8.6, 0.3, 5.4]} position={[0, -0.2, 0.2]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={F2.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[8.2, 0.07, 5.0]} position={[0, -0.02, 0.2]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={F2.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {[-4, 4].flatMap((x) => [-2.2, 2.6].map((z) => (
        <mesh key={x + ":" + z} position={[x, 0.02, z]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
          <meshStandardMaterial color={F2.brass} metalness={0.8} roughness={0.25} />
        </mesh>
      )))}
    </group>
  );
}

function Card({ position, color, h = 0.05, w = 0.9, d = 0.6 }: { position: [number, number, number]; color: string; h?: number; w?: number; d?: number }) {
  return (
    <RoundedBox args={[w, h, d]} position={position} radius={Math.min(0.02, h / 2.2)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.45} clearcoat={0.35} />
    </RoundedBox>
  );
}

/** A vertical rail with a sliding carriage: an instrument for one number. */
function Rail({ x, z, value, color, label, height = 2.2 }: { x: number; z: number; value: number; color: string; label: string; height?: number }) {
  const car = useRef<Group>(null);
  const { still } = useStage();
  const goal = 0.25 + value * height;
  useFrame((_, dt) => {
    if (!car.current) return;
    car.current.position.y += (goal - car.current.position.y) * (still ? 1 : Math.min(1, dt * 5));
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.25 + height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, height + 0.2, 12]} />
        <meshStandardMaterial color={F2.steel} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.16, 24]} />
        <meshStandardMaterial color={F2.brass} metalness={0.7} roughness={0.3} />
      </mesh>
      <group ref={car} position={[0, goal, 0]}>
        <RoundedBox args={[0.5, 0.16, 0.34]} radius={0.05} smoothness={2} castShadow>
          <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.6} />
        </RoundedBox>
        <Tag position={[0.35, 0, 0]} tone={color === P.rose ? "rose" : color === P.teal ? "teal" : "amber"} size="xs">{label}</Tag>
      </group>
    </group>
  );
}

function RecipesScene({ step }: { step: number }) {
  const m = recipeModel(step);
  const t = step / 10;
  return (
    <group>
      {/* The shared base model. */}
      <RoundedBox args={[2.2, 0.55, 1.1]} position={[0, 0.3, -1.7]} radius={0.1} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.3)} roughness={0.4} clearcoat={0.5} />
      </RoundedBox>
      <Tag position={[0, 0.85, -1.7]} tone="violet" size="xs" center>modelo base</Tag>
      <Arrow from={[-1.1, 0.35, -1.3]} to={[-2.2, 0.35, -0.3]} color={P.teal} width={1.6} head={0.1} />
      <Arrow from={[1.1, 0.35, -1.3]} to={[2.2, 0.35, -0.3]} color={P.amber} width={1.6} head={0.1} />

      {/* SFT: a stack of worked examples and one rail, p(y|x). */}
      <group position={[-2.6, 0, 0.6]}>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i}>
            <Card position={[-0.7, 0.06 + i * 0.075, 0]} color={mixHex(P.paper, P.teal, 0.25 + (i % 2) * 0.1)} />
          </group>
        ))}
        <Tag position={[-0.7, 0.72, 0.35]} tone="teal" size="xs" center>ejemplos</Tag>
        <Rail x={0.55} z={0} value={m.pSft} color={P.teal} label={"p(y|x) " + m.pSft.toFixed(2).replace(".", ",")} />
        <Tag position={[0, -0.02, 0.85]} tone="teal" center>SFT</Tag>
      </group>

      {/* DPO: chosen and rejected rails around the reference line. */}
      <group position={[2.3, 0, 0.6]}>
        <mesh position={[0.4, 1.35, 0]}>
          <boxGeometry args={[1.4, 0.03, 0.05]} />
          <meshStandardMaterial color={F2.brass} metalness={0.7} roughness={0.3} />
        </mesh>
        <Tag position={[-0.6, 1.35, 0]} tone="ink" size="xs" center>π_ref</Tag>
        <Rail x={0} z={0} value={0.5 + 0.2 * t} color={P.teal} label="elegida" />
        <Rail x={0.8} z={0} value={0.5 - 0.3 * t} color={P.rose} label="rechazada" />
        <Tag position={[0.4, -0.02, 0.85]} tone="amber" center>DPO</Tag>
      </group>
    </group>
  );
}

function ForgetScene({ mix }: { mix: number }) {
  const skills = forgetModel(mix);
  const general = Math.round((20 * mix) / 100);
  return (
    <group>
      {skills.map((s, i) => {
        const x = -2.9 + i * 1.0;
        const hb = s.before * 2.4;
        const ha = s.after * 2.4;
        const color = s.general ? (s.after < s.before - 0.05 ? P.rose : P.teal) : P.amber;
        return (
          <group key={s.name} position={[x, 0, 0]}>
            <RoundedBox args={[0.62, 0.1, 0.62]} position={[0, 0.05, 0]} radius={0.03} smoothness={2} receiveShadow>
              <meshStandardMaterial color={F2.ceramic} roughness={0.6} />
            </RoundedBox>
            <mesh position={[0, 0.1 + hb / 2, 0]}>
              <boxGeometry args={[0.56, hb, 0.56]} />
              <meshStandardMaterial color={P.lineStrong} transparent opacity={0.22} depthWrite={false} />
            </mesh>
            <RoundedBox args={[0.44, ha, 0.44]} position={[0, 0.1 + ha / 2, 0]} radius={0.04} smoothness={2} castShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, color, 0.7)} roughness={0.35} clearcoat={0.5} />
            </RoundedBox>
            <mesh position={[0, 0.1 + hb, 0]}>
              <boxGeometry args={[0.6, 0.012, 0.6]} />
              <meshStandardMaterial color={P.lineStrong} />
            </mesh>
            <Tag position={[0, -0.05, 0.55]} tone={s.general ? "muted" : "amber"} size="xs" center>{s.name}</Tag>
          </group>
        );
      })}
      {/* Training mix: 20 cards, general vs domain. */}
      <group position={[3.5, 0, 0.2]}>
        {Array.from({ length: 20 }, (_, i) => (
          <Card key={i} position={[0, 0.05 + i * 0.06, 0]} h={0.045} w={0.8} d={0.55} color={i < general ? mixHex(P.paper, P.teal, 0.45) : mixHex(P.paper, P.amber, 0.45)} />
        ))}
        <Tag position={[0, 1.45, 0]} tone="ink" size="xs" center>mezcla</Tag>
      </group>
    </group>
  );
}

const DATASET = 300;

function EvalScene({ n }: { n: number }) {
  const heldCards = Math.round(n / 10);
  const trainCards = Math.round((DATASET - n) / 10);
  const half = ciHalf(n);
  const rodX = (v: number) => -2 + v * 4;
  return (
    <group>
      {/* Train deck: one card = 10 examples. */}
      <group position={[-2.4, 0, -0.6]}>
        {Array.from({ length: trainCards }, (_, i) => (
          <Card key={i} position={[0, 0.05 + i * 0.055, 0]} h={0.04} w={1.2} d={0.8} color={mixHex(P.paper, P.teal, 0.3 + (i % 3) * 0.06)} />
        ))}
        <Tag position={[0, 0.25 + trainCards * 0.055, 0]} tone="teal" size="xs" center>{"train · " + (DATASET - n)}</Tag>
      </group>
      {/* Held-out: sealed glass case with a brass band. */}
      <group position={[1.9, 0, -0.6]}>
        {Array.from({ length: heldCards }, (_, i) => (
          <Card key={i} position={[0, 0.05 + i * 0.055, 0]} h={0.04} w={1.2} d={0.8} color={mixHex(P.paper, P.violet, 0.35)} />
        ))}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.5, 0.9, 1.1]} />
          <meshPhysicalMaterial color={P.violetWash} transparent opacity={0.22} roughness={0.1} clearcoat={1} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.54, 0.035, 1.14]} />
          <meshStandardMaterial color={F2.brass} metalness={0.8} roughness={0.25} />
        </mesh>
        <Tag position={[0, 1.15, 0]} tone="violet" size="xs" center>{"reservado · " + n}</Tag>
      </group>
      {/* Seam that training never crosses. */}
      <mesh position={[-0.25, 0.3, -0.6]}>
        <boxGeometry args={[0.04, 0.6, 1.6]} />
        <meshStandardMaterial color={P.rose} roughness={0.4} />
      </mesh>
      {/* Interval rod: accuracy 0..1 with the 95 % bracket. */}
      <group position={[0, 0, 1.55]}>
        <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 4.1, 12]} />
          <meshStandardMaterial color={F2.steel} metalness={0.8} roughness={0.25} />
        </mesh>
        {[0, 0.5, 1].map((v) => (
          <group key={v}>
            <mesh position={[rodX(v), 0.2, 0]}>
              <boxGeometry args={[0.02, 0.22, 0.02]} />
              <meshStandardMaterial color={P.inkSoft} />
            </mesh>
            <Tag position={[rodX(v), -0.05, 0.3]} tone="muted" size="xs" center>{String(v).replace(".", ",")}</Tag>
          </group>
        ))}
        <RoundedBox args={[half * 2 * 4, 0.16, 0.32]} position={[rodX(P_ACC), 0.2, 0]} radius={0.05} smoothness={2} castShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.5)} roughness={0.35} clearcoat={0.5} transparent opacity={0.85} />
        </RoundedBox>
        <mesh position={[rodX(P_ACC), 0.2, 0]}>
          <sphereGeometry args={[0.1, 18, 12]} />
          <meshStandardMaterial color={P.violetDeep} />
        </mesh>
        <Tag position={[rodX(P_ACC), 0.55, 0]} tone="violet" size="xs" center>{"± " + (half * 100).toFixed(1).replace(".", ",") + " pts"}</Tag>
      </group>
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<Ft2Mode>("recipes");
  const [step, setStep] = useState(5);
  const [mix, setMix] = useState(0);
  const [n, setN] = useState(30);
  const rm = recipeModel(step);
  const skills = forgetModel(mix);
  const generalDrop = skills.filter((s) => s.general).reduce((sum, s) => sum + (s.before - s.after), 0) / skills.filter((s) => s.general).length;
  const half = ciHalf(n);
  const note =
    mode === "recipes" ? (
      <div className="space-y-3">
        <p><strong>Dos recetas desde la misma base.</strong> SFT empuja hacia arriba la probabilidad de la respuesta escrita en el ejemplo (pérdida −log p(y|x)). DPO no necesita una respuesta perfecta: sube la elegida y baja la rechazada respecto al modelo de referencia; lo que optimiza es el margen entre ambas.</p>
        <Readout items={[
          { label: "p(y|x) SFT", value: rm.pSft.toFixed(2), tone: "var(--teal)" },
          { label: "pérdida SFT", value: rm.sftLoss.toFixed(3), tone: "var(--teal)" },
          { label: "margen β·Δ", value: rm.margin.toFixed(2), tone: "var(--amber)" },
          { label: "pérdida DPO", value: rm.dpoLoss.toFixed(3), tone: "var(--amber)" },
        ]} />
        <p className="text-xs text-muted">Log-probabilidades de juguete que avanzan linealmente con el paso; β = 0,1. Las pérdidas sí se calculan: −log p y −log σ(β[(log π/π_ref)(y_w) − (log π/π_ref)(y_l)]). Con margen 0 la pérdida DPO es log 2 ≈ 0,693.</p>
      </div>
    ) : mode === "forget" ? (
      <div className="space-y-3">
        <p><strong>{mix === 0 ? "Sólo datos del dominio: el modelo se afila y olvida." : mix >= 15 ? "Con suficiente mezcla general, las capacidades generales se conservan." : "La mezcla general reduce el olvido."}</strong> La silueta gris es la capacidad antes del ajuste; el bloque sólido, después. Es el caso del LoRA que olvidó saludar: la receta de la lección mezcla un 10–20 % de ejemplos generales.</p>
        <Readout items={[
          { label: "ejemplos generales", value: mix + " %", tone: "var(--teal)" },
          { label: "ganancia dominio", value: "+0,35", tone: "var(--amber)" },
          { label: "caída media general", value: generalDrop.toFixed(2).replace(".", ","), tone: "var(--rose)" },
        ]} />
        <p className="text-xs text-muted">Modelo de juguete declarado, no una medición: caída general = 0,4 × (1 − min(1, mezcla/15 %)). Sirve para ver la dirección del efecto, no su tamaño en tu modelo.</p>
      </div>
    ) : (
      <div className="space-y-3">
        <p><strong>El set reservado no cruza la costura.</strong> Se aparta antes de entrenar y sólo se usa para juzgar. Su tamaño decide cuánto puedes creer la cifra: con n = {n}, un 80 % de acierto quiere decir «entre {((P_ACC - half) * 100).toFixed(0)} % y {Math.min(100, (P_ACC + half) * 100).toFixed(0)} %».</p>
        <Readout items={[
          { label: "prompts reservados", value: String(n), tone: "var(--violet)" },
          { label: "para entrenar", value: String(DATASET - n), tone: "var(--teal)" },
          { label: "IC 95 %", value: "± " + (half * 100).toFixed(1).replace(".", ",") + " pts", tone: "var(--violet)" },
        ]} />
        <p className="font-mono text-xs">±1,96 · √(0,8 · 0,2 / {n}) = ±{half.toFixed(3).replace(".", ",")}</p>
        <p className="text-xs text-muted">Aproximación normal para una proporción, con p = 0,8 supuesta y {DATASET} ejemplos en total (dentro de los 100–500 de la receta). Cada carta dibujada son 10 ejemplos.</p>
      </div>
    );
  return (
    <Figure
      label="Dos recetas, una base, un sello"
      hint="SFT · DPO · olvido · evaluación reservada"
      height="h-[460px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "SFT / general" },
        { color: P.amber, label: "DPO / dominio" },
        { color: P.rose, label: "olvido / rechazada" },
        { color: P.violet, label: "reservado" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} options={[
            { value: "recipes", label: "Recetas", tone: P.teal },
            { value: "forget", label: "Olvido", tone: P.rose },
            { value: "eval", label: "Evaluación", tone: P.violet },
          ]} ariaLabel="Vista de la lámina de fine-tuning" />
          {mode === "recipes" ? <Knob label="paso" value={step} min={0} max={10} onChange={setStep} /> : null}
          {mode === "forget" ? <Knob label="mezcla general" value={mix} min={0} max={30} onChange={setMix} format={(v) => v + " %"} tone="var(--teal)" /> : null}
          {mode === "eval" ? <Knob label="reservados" value={n} min={10} max={100} step={10} onChange={setN} tone="var(--violet)" /> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3.4, 5.4, 9.2], fov: 32 }} fit={1.04}>
        <Bench2 />
        {mode === "recipes" ? <RecipesScene step={step} /> : mode === "forget" ? <ForgetScene mix={mix} /> : <EvalScene n={n} />}
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

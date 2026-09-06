"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Bars,
  Flow,
  Halo,
  PointerTilt,
  ShadowBlob,
  Tag,
  Wire,
  type V3,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import VisualLegacy from "./VisualLegacy";

type Mode = "qkv" | "heads" | "gqa";
type Vector4 = readonly [number, number, number, number];

/**
 * One small, reproducible calculation powers every view. The query is for
 * the final token «alfombra» in this causal example: «El gato duerme sobre la alfombra».
 */
const TOKENS = ["El", "gato", "duerme", "sobre", "la", "alfombra"] as const;
const QUERY_INDEX = 5;
const QUERY: Vector4 = [0.8, 0.1, 0.6, 0.2];
const KEYS: readonly Vector4[] = [
  [0.2, 0.4, 0.1, 0.6],
  [0.8, 0.1, 0.6, 0.2],
  [0.6, 0.2, 0.5, 0.1],
  [0.1, 0.5, 0.2, 0.8],
  [0.2, 0.4, 0.4, 0.2],
  [0.7, 0.2, 0.5, 0.3],
];
const VALUES: readonly V3[] = [
  [0.9, 0.1, 0.2],
  [0.2, 0.85, 0.35],
  [0.5, 0.4, 0.9],
  [0.8, 0.3, 0.15],
  [0.75, 0.7, 0.2],
  [0.2, 0.6, 0.95],
];
const HEAD_QUERIES: readonly Vector4[] = [
  QUERY,
  [0.2, 0.7, 0.2, 0.6],
  [0.4, 0.3, 0.8, 0.1],
  [0.6, 0.2, 0.2, 0.7],
];

const WOOD = "#332923";
const WOOD_LIGHT = "#5A4334";
const BRASS = "#B5843A";
const BRASS_DARK = "#7B5520";
const IVORY = "#F1EBDD";

function dot(a: readonly number[], b: readonly number[]) {
  return a.reduce((sum, value, i) => sum + value * (b[i] ?? 0), 0);
}

function softmax(scores: readonly number[]) {
  const peak = Math.max(...scores);
  const exp = scores.map((score) => Math.exp(score - peak));
  const total = exp.reduce((sum, value) => sum + value, 0);
  return exp.map((value) => value / total);
}

function attentionWeights(query: Vector4) {
  const scale = Math.sqrt(query.length);
  return softmax(KEYS.map((key) => dot(query, key) / scale));
}

const SCORES = KEYS.map((key) => dot(QUERY, key) / Math.sqrt(QUERY.length));
const WEIGHTS = attentionWeights(QUERY);
const HEAD_WEIGHTS = HEAD_QUERIES.map(attentionWeights);
const MIXED_VALUE: V3 = VALUES[0].map((_, dimension) =>
  VALUES.reduce((sum, value, token) => sum + value[dimension] * WEIGHTS[token], 0),
) as V3;

function numberEs(value: number, decimals = 2) {
  return value.toFixed(decimals).replace(".", ",");
}

function tokenX(index: number) {
  return -2.75 + index * 1.1;
}

export default function Visual() {
  const locale = useLocale();
  return locale === "es" ? <VisualSpanish /> : <VisualLegacy />;
}

function VisualSpanish() {
  const [mode, setMode] = useState<Mode>("qkv");

  const modeNote = useMemo(() => {
    if (mode === "heads") {
      return "Cada cabeza hace su propia mezcla: aquí mantenemos K y V fijos para comparar cómo cambiar Q cambia el mapa de pesos. Las cuatro salidas se concatenan antes de proyectarse.";
    }
    if (mode === "gqa") {
      return "GQA conserva cuatro consultas, pero dos grupos comparten sus claves y valores. La lectura sigue siendo distinta por cabeza y la caché KV se reduce a la mitad.";
    }
    return "La consulta de «alfombra» compara su vector con las seis claves del contexto, normaliza las puntuaciones y mezcla los seis valores. Al ser el último token, no mira hacia el futuro.";
  }, [mode]);

  const readout = useMemo(() => {
    if (mode === "heads") {
      return [
        { label: "cabezas", value: "4", tone: P.amber },
        { label: "mapas", value: "4 × 6", tone: P.teal },
        { label: "salida", value: "concatenar → Wₒ", tone: P.violet },
      ];
    }
    if (mode === "gqa") {
      return [
        { label: "queries", value: "4", tone: P.teal },
        { label: "bancos KV", value: "2", tone: P.violet },
        { label: "caché", value: "−50 %", tone: P.amber },
      ];
    }
    return [
      { label: "d", value: "4", tone: P.teal },
      { label: "α(gato)", value: numberEs(WEIGHTS[1]), tone: P.amber },
      { label: "α(alfombra)", value: numberEs(WEIGHTS[5]), tone: P.amber },
      { label: "Σα", value: numberEs(WEIGHTS.reduce((sum, weight) => sum + weight, 0)), tone: P.violet },
    ];
  }, [mode]);

  return (
    <Figure
      label="ATENCIÓN · MEZCLA VECTORIAL"
      hint="1 QKV · 2 multicabeza · 3 GQA"
      legend={[
        { color: P.teal, label: "consulta" },
        { color: P.amber, label: "claves / pesos" },
        { color: P.violet, label: "valores / mezcla" },
      ]}
      controls={
        <div
          role="group"
          aria-label="Modos de la atención"
          className="flex items-center gap-2"
        >
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "qkv", label: "QKV", tone: P.teal },
              { value: "heads", label: "Multicabeza", tone: P.amber },
              { value: "gqa", label: "GQA", tone: P.violet },
            ]}
            ariaLabel="Cambiar vista: QKV, multicabeza o GQA"
          />
          <span className="sr-only">Usa Tab para enfocar cada modo y Enter o Espacio para activarlo.</span>
        </div>
      }
      note={
        <div className="space-y-2">
          <p aria-live="polite">{modeNote}</p>
          {mode === "qkv" ? (
            <p className="text-[0.82rem] text-muted">
              Ejemplo: para «gato», q·k = 1,05 y q·k/√d = 1,05/2 = {numberEs(SCORES[1])}. Después del softmax, α(gato) = {numberEs(WEIGHTS[1])}; la mezcla final es V̄ = [{MIXED_VALUE.map((value) => numberEs(value)).join("; ")}].
            </p>
          ) : null}
          <p className="text-[0.76rem] text-faint">
            Modelo didáctico: la base representa operaciones matemáticas, no piezas físicas de una GPU; los vectores son inventados para enseñar el cálculo.
          </p>
          <Readout items={readout} />
        </div>
      }
      height="h-[465px] md:h-[570px]"
    >
      <Stage
        className="h-full w-full"
        maxDpr={1.8}
        camera={{ position: [2.1, 4.8, 10.8], fov: 34 }}
        background={P.paper}
        fit={0.96}
      >
        <PointerTilt amount={0.045}>
          {mode === "qkv" ? <QkvScene /> : null}
          {mode === "heads" ? <HeadsScene /> : null}
          {mode === "gqa" ? <GqaScene /> : null}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

function InstrumentBase({ accent }: { accent: string }) {
  const ticks = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2);
  return (
    <group position={[0, -1.86, -0.12]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[3.72, 3.92, 0.34, 64]} />
        <meshStandardMaterial color={WOOD} roughness={0.42} metalness={0.08} envMapIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.42, 3.55, 0.12, 64]} />
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.48} metalness={0.06} envMapIntensity={0.65} />
      </mesh>
      <mesh position={[0, 0.27, 0]} receiveShadow>
        <cylinderGeometry args={[3.14, 3.18, 0.07, 64]} />
        <meshStandardMaterial color={IVORY} roughness={0.7} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.96, 0.045, 10, 96]} />
        <meshStandardMaterial color={BRASS} roughness={0.26} metalness={0.72} envMapIntensity={1.05} />
      </mesh>
      <mesh position={[0, 0.345, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.62, 0.025, 8, 72]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.5} envMapIntensity={0.9} />
      </mesh>
      {ticks.map((angle) => (
        <mesh
          key={angle}
          position={[Math.cos(angle) * 3.08, 0.36, Math.sin(angle) * 3.08]}
          rotation={[0, -angle, 0]}
        >
          <boxGeometry args={[0.055, 0.04, 0.22]} />
          <meshStandardMaterial color={BRASS_DARK} roughness={0.35} metalness={0.62} />
        </mesh>
      ))}
      <mesh position={[0, 0.37, 0]}>
        <boxGeometry args={[3.4, 0.035, 0.035]} />
        <meshStandardMaterial color={P.lineStrong} roughness={0.55} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.372, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[3.4, 0.035, 0.035]} />
        <meshStandardMaterial color={P.lineStrong} roughness={0.55} metalness={0.16} />
      </mesh>
    </group>
  );
}

function TokenCard({ token, position, weight = 0, active = false }: { token: string; position: V3; weight?: number; active?: boolean }) {
  const accent = active ? P.teal : weight > 0.18 ? P.amber : P.lineStrong;
  const fill = active ? P.tealWash : weight > 0.18 ? P.amberWash : IVORY;
  return (
    <group position={position}>
      <RoundedBox args={[0.86, 0.5, 0.28]} radius={0.07} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={fill} roughness={0.34} metalness={0.08} envMapIntensity={0.78} />
      </RoundedBox>
      <mesh position={[0, 0.06, 0.16]}>
        <boxGeometry args={[0.74, 0.075, 0.025]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.32} />
      </mesh>
      <Tag position={[0, -0.01, 0.2]} tone={active ? "teal" : weight > 0.18 ? "amber" : "ink"} size="xs" center>
        {token}
      </Tag>
      {active ? <Halo position={[0, 0, 0.22]} radius={0.58} thickness={0.018} color={P.teal} opacity={0.55} rotation={[Math.PI / 2, 0, 0]} spin={0.2} /> : null}
    </group>
  );
}

function TokenRail({ weights = WEIGHTS }: { weights?: readonly number[] }) {
  return (
    <group>
      <mesh position={[0, 1.5, -0.17]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 6.95, 16]} />
        <meshStandardMaterial color={BRASS} roughness={0.24} metalness={0.75} envMapIntensity={1.08} />
      </mesh>
      {TOKENS.map((token, i) => (
        <TokenCard
          key={token}
          token={token}
          weight={weights[i] ?? 0}
          active={i === QUERY_INDEX}
          position={[tokenX(i), 1.76, 0.06]}
        />
      ))}
    </group>
  );
}

function VectorCard({ position, label, values, color, width = 0.82 }: { position: V3; label?: string; values: readonly number[]; color: string; width?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={[width, 0.34, 0.22]} radius={0.045} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={P.surface} roughness={0.38} metalness={0.08} envMapIntensity={0.76} />
      </RoundedBox>
      {values.map((value, i) => (
        <mesh key={i} position={[-width * 0.28 + i * (width * 0.18), -0.01 + value * 0.075, 0.14]}>
          <boxGeometry args={[width * 0.105, 0.07 + value * 0.14, 0.035]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.24} />
        </mesh>
      ))}
      {label ? (
        <Tag position={[0, -0.27, 0.16]} tone={color === P.teal ? "teal" : color === P.amber ? "amber" : "violet"} size="xs" center>
          {label}
        </Tag>
      ) : null}
    </group>
  );
}

function WeightMatrix({ weights, position = [0, -0.93, 0.52] as V3, label = "QKᵀ / √d → softmax" }: { weights: readonly number[]; position?: V3; label?: string }) {
  const baseline = -0.34;
  return (
    <group position={position}>
      <RoundedBox args={[6.72, 0.92, 0.12]} radius={0.07} smoothness={3} receiveShadow>
        <meshStandardMaterial color={P.amberWash} transparent opacity={0.75} roughness={0.58} metalness={0.04} />
      </RoundedBox>
      <Tag position={[0, 0.62, 0.15]} tone="amber" size="xs" center>
        {label}
      </Tag>
      {weights.map((weight, i) => {
        const x = tokenX(i);
        const height = 0.15 + weight * 1.45;
        return (
          <group key={TOKENS[i]}>
            <mesh position={[x, baseline + height / 2, 0.17]} castShadow receiveShadow>
              <boxGeometry args={[0.67, height, 0.26]} />
              <meshStandardMaterial color={weight > 0.18 ? BRASS : P.amber} roughness={0.3} metalness={0.34} envMapIntensity={0.86} />
            </mesh>
            {i === QUERY_INDEX ? (
              <Tag position={[x, baseline - 0.22, 0.28]} tone="amber" size="xs" center>
                {`${TOKENS[i]} · α ${numberEs(weight)}`}
              </Tag>
            ) : null}
          </group>
        );
      })}
      <Wire points={[[-3.18, baseline, 0.2], [3.18, baseline, 0.2]]} color={P.amberDeep} opacity={0.5} width={1.5} />
    </group>
  );
}

function ValueMixer({ position, values = MIXED_VALUE }: { position: V3; values?: V3 }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.34, 1.28, 0.42]} radius={0.09} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={P.surface} roughness={0.3} metalness={0.13} envMapIntensity={0.95} />
      </RoundedBox>
      <mesh position={[0, 0.49, 0.24]}>
        <boxGeometry args={[1.16, 0.16, 0.035]} />
        <meshStandardMaterial color={P.violet} roughness={0.3} metalness={0.38} />
      </mesh>
      {values.map((value, i) => {
        const height = 0.12 + value * 0.75;
        return (
          <mesh key={i} position={[-0.28 + i * 0.28, -0.25 + height / 2, 0.25]} castShadow>
            <boxGeometry args={[0.14, height, 0.1]} />
            <meshStandardMaterial color={P.violet} roughness={0.3} metalness={0.34} envMapIntensity={0.9} />
          </mesh>
        );
      })}
      <Tag position={[0, 0.49, 0.3]} tone="ink" size="xs" center>
        V̄ · mezcla
      </Tag>
    </group>
  );
}

function QkvScene() {
  return (
    <group>
      <ShadowBlob position={[0, -1.54, 0]} scale={7.1} opacity={0.075} />
      <InstrumentBase accent={P.teal} />
      <TokenRail />
      <Tag position={[0, 2.53, 0.2]} tone="teal" size="xs" center>
        pregunta: «alfombra»
      </Tag>

      {TOKENS.map((token, i) => (
        <group key={token}>
          <Wire points={[[tokenX(i), 1.47, 0.06], [tokenX(i), 0.91, 0.16]]} color={i === QUERY_INDEX ? P.teal : P.lineStrong} opacity={i === QUERY_INDEX ? 0.9 : 0.32} dashed={i !== QUERY_INDEX} />
          <Wire points={[[tokenX(i), 0.52, 0.16], [tokenX(i), 0.2, 0.16]]} color={P.lineStrong} opacity={0.28} dashed />
          <VectorCard position={[tokenX(i), 0.7, 0.2]} values={KEYS[i]} color={P.amber} />
          <VectorCard position={[tokenX(i), 0.01, 0.2]} values={VALUES[i]} color={P.violet} />
        </group>
      ))}
      <Tag position={[-3.72, 0.7, 0.23]} tone="amber" size="xs" center>
        claves
      </Tag>
      <Tag position={[-3.72, 0.01, 0.23]} tone="violet" size="xs" center>
        valores
      </Tag>

      <Arrow from={[tokenX(QUERY_INDEX), 1.48, 0.28]} to={[-3.36, -0.42, 0.58]} color={P.teal} width={1.8} head={0.12} bow={0.45} />
      <VectorCard position={[-3.42, -0.46, 0.62]} label="Q" values={QUERY} color={P.teal} width={1.18} />
      <Arrow from={[-2.82, -0.46, 0.65]} to={[-2.08, -0.92, 0.64]} color={P.teal} width={1.7} head={0.1} />
      <WeightMatrix weights={WEIGHTS} />
      <Arrow from={[0, -0.32, 0.72]} to={[2.52, -0.16, 0.76]} color={P.violet} width={1.7} head={0.11} bow={0.18} />
      {VALUES.map((_, i) => (
        <Flow
          key={i}
          points={[[tokenX(i), -0.19, 0.35], [2.45, -0.16, 0.76]]}
          color={P.violet}
          count={1}
          speed={0.18 + WEIGHTS[i] * 0.18}
          size={0.035 + WEIGHTS[i] * 0.045}
          lineOpacity={0.12 + WEIGHTS[i] * 0.85}
          width={1.0 + WEIGHTS[i] * 1.8}
        />
      ))}
      <ValueMixer position={[3.18, -0.15, 0.8]} />
      <Tag position={[0, -1.7, 0.52]} tone="muted" size="xs" center>
        seis valores entran · un vector sale
      </Tag>
    </group>
  );
}

function WeightChip({ position, value, color }: { position: V3; value: number; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.78, 0.29, 0.22]} radius={0.045} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={color} transparent opacity={0.17 + value * 2.4} roughness={0.32} metalness={0.16} envMapIntensity={0.75} />
      </RoundedBox>
      <mesh position={[0, 0, 0.15]}>
        <boxGeometry args={[0.09, 0.06 + value * 0.82, 0.035]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.35} />
      </mesh>
    </group>
  );
}

function HeadsScene() {
  const ys = [0.92, 0.31, -0.3, -0.91];
  const tones = [P.teal, P.amber, P.violet, P.rose];
  return (
    <group>
      <ShadowBlob position={[0, -1.54, 0]} scale={7.1} opacity={0.075} />
      <InstrumentBase accent={P.amber} />
      <TokenRail weights={HEAD_WEIGHTS[0]} />
      <Tag position={[0, 2.53, 0.2]} tone="amber" size="xs" center>
        cuatro lecturas en paralelo
      </Tag>
      {ys.map((y, head) => (
        <group key={head}>
          <RoundedBox position={[0, y, 0.25]} args={[6.55, 0.41, 0.12]} radius={0.06} smoothness={3} receiveShadow>
            <meshStandardMaterial color={tones[head]} transparent opacity={0.08} roughness={0.5} metalness={0.08} />
          </RoundedBox>
          <Tag position={[-3.53, y, 0.38]} tone={head === 0 ? "teal" : head === 1 ? "amber" : head === 2 ? "violet" : "rose"} size="xs" center>
            {`H${head + 1}`}
          </Tag>
          {TOKENS.map((_, i) => (
            <group key={i}>
              <WeightChip position={[tokenX(i), y, 0.43]} value={HEAD_WEIGHTS[head][i]} color={tones[head]} />
            </group>
          ))}
          <Flow points={[[3.05, y, 0.44], [3.78, -0.12, 0.64]]} color={tones[head]} count={1} speed={0.18 + head * 0.03} size={0.04} lineOpacity={0.44} width={1.4} />
        </group>
      ))}
      <RoundedBox position={[3.74, -0.12, 0.74]} args={[1.35, 1.46, 0.4]} radius={0.09} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={P.surface} roughness={0.32} metalness={0.12} envMapIntensity={0.9} />
      </RoundedBox>
      <mesh position={[3.74, 0.42, 0.96]}>
        <boxGeometry args={[1.15, 0.16, 0.04]} />
        <meshStandardMaterial color={P.amber} roughness={0.29} metalness={0.42} />
      </mesh>
      <Tag position={[3.74, 0.42, 1.02]} tone="ink" size="xs" center>
        concatenar
      </Tag>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[3.44 + (i % 2) * 0.28, -0.18 + Math.floor(i / 2) * 0.32, 0.97]}>
          <boxGeometry args={[0.13, 0.23 + i * 0.035, 0.11]} />
          <meshStandardMaterial color={tones[i]} roughness={0.3} metalness={0.38} />
        </mesh>
      ))}
      <Tag position={[3.74, -1.04, 0.96]} tone="amber" size="xs" center>
        Wₒ · salida
      </Tag>
      <Tag position={[0, -1.7, 0.52]} tone="muted" size="xs" center>
        cada cabeza aprende su propio mapa α
      </Tag>
    </group>
  );
}

function KvGroup({ position, groupLabel, color }: { position: V3; groupLabel: string; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.42, 0.9, 0.36]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={P.surface} roughness={0.32} metalness={0.12} envMapIntensity={0.9} />
      </RoundedBox>
      <mesh position={[-0.31, 0.08, 0.21]}>
        <boxGeometry args={[0.46, 0.18, 0.06]} />
        <meshStandardMaterial color={P.amber} roughness={0.31} metalness={0.33} />
      </mesh>
      <mesh position={[0.31, 0.08, 0.21]}>
        <boxGeometry args={[0.46, 0.18, 0.06]} />
        <meshStandardMaterial color={P.violet} roughness={0.31} metalness={0.33} />
      </mesh>
      <Tag position={[-0.31, 0.08, 0.27]} tone="amber" size="xs" center>
        K
      </Tag>
      <Tag position={[0.31, 0.08, 0.27]} tone="violet" size="xs" center>
        V
      </Tag>
      <Tag position={[0, -0.63, 0.24]} tone="ink" size="xs" center>
        {groupLabel}
      </Tag>
      <Halo position={[0, 0, 0.2]} radius={0.75} thickness={0.016} color={color} opacity={0.46} rotation={[Math.PI / 2, 0, 0]} spin={0.16} />
    </group>
  );
}

function GqaScene() {
  const qYs = [0.86, 0.24, -0.38, -1.0];
  const kvYs = [0.55, -0.68];
  return (
    <group>
      <ShadowBlob position={[0, -1.54, 0]} scale={7.1} opacity={0.075} />
      <InstrumentBase accent={P.violet} />
      <Tag position={[0, 2.47, 0.2]} tone="violet" size="xs" center>
        mismas consultas · menos bancos KV
      </Tag>
      <Tag position={[-2.93, 1.55, 0.24]} tone="ink" size="xs" center>
        cuatro consultas
      </Tag>
      {qYs.map((y, i) => (
        <group key={i}>
          <VectorCard position={[-2.63, y, 0.44]} label={`Q${i + 1}`} values={HEAD_QUERIES[i]} color={P.teal} width={1.12} />
          <Arrow from={[-2.05, y, 0.6]} to={[-0.64, kvYs[i < 2 ? 0 : 1], 0.65]} color={P.teal} width={1.5} head={0.1} bow={i % 2 === 0 ? 0.2 : -0.2} />
        </group>
      ))}
      <KvGroup position={[0.18, kvYs[0], 0.64]} groupLabel="KV · grupo 1" color={P.violet} />
      <KvGroup position={[0.18, kvYs[1], 0.64]} groupLabel="KV · grupo 2" color={P.violet} />
      <Tag position={[0.18, 1.28, 0.28]} tone="violet" size="xs" center>
        K / V compartidas
      </Tag>
      <Arrow from={[0.95, 0.55, 0.7]} to={[1.76, 0.08, 0.85]} color={P.violet} width={1.6} head={0.11} />
      <Arrow from={[0.95, -0.68, 0.7]} to={[1.76, -0.08, 0.85]} color={P.violet} width={1.6} head={0.11} />
      <group position={[2.48, -0.14, 0.76]}>
        <Bars
          bars={[
            { label: "MHA", value: 1, color: P.amber, note: "4" },
            { label: "GQA", value: 0.5, color: P.violet, note: "2" },
          ]}
          height={1.18}
          width={0.42}
          gap={0.34}
          depth={0.35}
          tone="ink"
        />
        <Tag position={[0, 1.62, 0.2]} tone="violet" size="xs" center>
          caché KV
        </Tag>
      </group>
      <Flow points={[[1.0, 0.55, 0.7], [2.18, -0.06, 0.8]]} color={P.violet} count={2} speed={0.22} size={0.045} lineOpacity={0.42} />
      <Flow points={[[1.0, -0.68, 0.7], [2.18, -0.2, 0.8]]} color={P.violet} count={2} speed={0.2} size={0.045} lineOpacity={0.42} />
      <Tag position={[0, -1.7, 0.52]} tone="muted" size="xs" center>
        4 consultas · 2 parejas K/V · 50 % menos caché
      </Tag>
    </group>
  );
}

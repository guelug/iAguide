"use client";

import { Edges, Line, RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  PointerTilt,
  ShadowBlob,
  Tag,
  type V3,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import VisualLegacy from "./VisualLegacy";

type Precision = "4" | "8" | "16";
type Focus = "pcb" | "gpu" | "vram" | "cooler" | "contacts";
type Assembly = "covered" | "exploded";

const GiB = 1024 ** 3;
const GPU_CAPACITY_GIB = 24;
const VRAM_BANKS = 8;
const LAYERS = 32;
const KV_HEADS = 8;
const HEAD_DIM = 128;
const CACHE_BYTES = 2;
const BATCH = 1;
const RESERVE_GIB = 1.5;

const WOOD = "#4A3025";
const WOOD_EDGE = "#80583D";
const PCB = "#1D473D";
const PCB_DARK = "#12352F";
const SILK = "#B9C9B7";
const BRASS = "#B5843A";
const BRASS_DARK = "#76501E";
const COPPER = "#C4773B";
const IVORY = "#F1EBDD";
const IVORY_SHADE = "#D4C8B1";
const GRAPHITE = "#272D2B";

const BANK_XZ: readonly [number, number][] = [
  [-2.18, -1.18],
  [-0.95, -1.18],
  [0.95, -1.18],
  [2.18, -1.18],
  [-2.18, 1.18],
  [-0.95, 1.18],
  [0.95, 1.18],
  [2.18, 1.18],
];

const TRACE_ROUTES: readonly { points: V3[]; color: string }[] = [
  { points: [[-2.72, 0.105, -1.55], [-1.58, 0.105, -1.55], [-1.05, 0.105, -0.82]], color: COPPER },
  { points: [[-2.72, 0.105, 1.55], [-1.58, 0.105, 1.55], [-1.05, 0.105, 0.82]], color: P.teal },
  { points: [[2.72, 0.105, -1.55], [1.58, 0.105, -1.55], [1.05, 0.105, -0.82]], color: COPPER },
  { points: [[2.72, 0.105, 1.55], [1.58, 0.105, 1.55], [1.05, 0.105, 0.82]], color: P.teal },
  { points: [[-2.58, 0.105, 0], [-1.65, 0.105, 0], [-1.05, 0.105, 0]], color: BRASS },
  { points: [[2.58, 0.105, 0], [1.65, 0.105, 0], [1.05, 0.105, 0]], color: BRASS },
  { points: [[0, 0.105, -1.78], [0, 0.105, -1.12], [0, 0.105, -0.82]], color: P.violet },
  { points: [[0, 0.105, 1.78], [0, 0.105, 1.12], [0, 0.105, 0.82]], color: P.violet },
];

const VIA_XZ: readonly [number, number][] = [
  [-2.55, -1.55],
  [-2.55, 1.55],
  [2.55, -1.55],
  [2.55, 1.55],
  [-1.58, 0],
  [1.58, 0],
  [0, -1.78],
  [0, 1.78],
];

function numberEs(value: number, decimals = 1) {
  return value.toFixed(decimals).replace(".", ",");
}

function CapacityBar({ label, value, color }: { label: string; value: number; color: string }) {
  const percent = Math.max(0, Math.min(100, (value / GPU_CAPACITY_GIB) * 100));
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-2 text-[0.68rem]">
      <span className="uppercase tracking-[0.12em] text-faint">{label}</span>
      <span
        className="h-1.5 overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-label={`${label}: ${numberEs(value)} GiB de ${GPU_CAPACITY_GIB} GiB`}
        aria-valuemin={0}
        aria-valuemax={GPU_CAPACITY_GIB}
        aria-valuenow={Number(value.toFixed(2))}
      >
        <span className="block h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </span>
      <span className="tabular-nums text-muted">{numberEs(value)} GiB</span>
    </div>
  );
}

function Trace({ points, color, width = 0.8, opacity = 0.76 }: { points: V3[]; color: string; width?: number; opacity?: number }) {
  return (
    <Line
      points={points}
      color={color}
      lineWidth={width}
      transparent
      opacity={opacity}
      depthWrite={false}
    />
  );
}

function Via({ position, selected = false }: { position: V3; selected?: boolean }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.045, 0.045, 0.026, 12]} />
      <meshStandardMaterial
        color={selected ? BRASS : COPPER}
        roughness={0.28}
        metalness={0.68}
        envMapIntensity={0.85}
      />
    </mesh>
  );
}

function Screw({ position, selected = false }: { position: V3; selected?: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.075, 0.075, 0.045, 16]} />
        <meshStandardMaterial
          color={selected ? BRASS : BRASS_DARK}
          roughness={0.24}
          metalness={0.76}
          envMapIntensity={0.95}
        />
      </mesh>
      <Trace points={[[-0.045, 0.025, 0], [0.045, 0.025, 0]]} color={IVORY} width={0.7} opacity={0.7} />
      <Trace points={[[0, 0.026, -0.045], [0, 0.026, 0.045]]} color={IVORY} width={0.7} opacity={0.7} />
    </group>
  );
}

function ContactStrip({ selected }: { selected: boolean }) {
  return (
    <group position={[0, 0.12, 1.91]}>
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={i} position={[-2.35 + i * 0.205, 0, 0]}>
          <boxGeometry args={[0.095, 0.065, 0.26]} />
          <meshStandardMaterial
            color={selected ? BRASS : BRASS_DARK}
            roughness={0.24}
            metalness={0.72}
            envMapIntensity={0.9}
          />
        </mesh>
      ))}
      <Line
        points={[[-2.48, 0.045, 0.15], [2.48, 0.045, 0.15]]}
        color={selected ? IVORY : BRASS}
        lineWidth={selected ? 1.8 : 0.75}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </group>
  );
}

function VramBank({ position, index, selected, exploded }: { position: V3; index: number; selected: boolean; exploded: number }) {
  return (
    <group position={[position[0], position[1] + exploded * 0.06, position[2]]}>
      <RoundedBox
        args={[0.86, 0.13, 0.5]}
        radius={0.035}
        smoothness={2}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={selected ? BRASS : IVORY}
          roughness={selected ? 0.3 : 0.42}
          metalness={selected ? 0.42 : 0.05}
          envMapIntensity={0.9}
        />
        <Edges
          color={selected ? IVORY : IVORY_SHADE}
          lineWidth={selected ? 2 : 0.7}
          transparent
          opacity={selected ? 0.98 : 0.62}
          depthWrite={false}
        />
      </RoundedBox>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.58, 0.026, 0.28]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.34} metalness={0.18} envMapIntensity={0.72} />
      </mesh>
      {[-0.28, -0.09, 0.09, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.095, 0]}>
          <boxGeometry args={[0.035, 0.032, 0.34]} />
          <meshStandardMaterial color={selected ? BRASS : COPPER} roughness={0.28} metalness={0.72} />
        </mesh>
      ))}
      {selected ? <Tag position={[0, 0.23, 0]} tone="amber" size="xs" center>{`VRAM ${index + 1}`}</Tag> : null}
    </group>
  );
}

function GpuChip({ selected, exploded }: { selected: boolean; exploded: number }) {
  return (
    <group position={[0, 0.22 + exploded * 0.14, 0]}>
      <RoundedBox
        args={[1.72, 0.24, 1.45]}
        radius={0.1}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={selected ? IVORY : IVORY_SHADE}
          roughness={selected ? 0.28 : 0.4}
          metalness={0.08}
          envMapIntensity={0.95}
        />
        <Edges
          color={selected ? BRASS : SILK}
          lineWidth={selected ? 2.2 : 0.8}
          transparent
          opacity={selected ? 1 : 0.64}
          depthWrite={false}
        />
      </RoundedBox>
      <RoundedBox args={[1.18, 0.07, 0.9]} radius={0.045} smoothness={2} position={[0, 0.17, 0]}>
        <meshStandardMaterial color={selected ? BRASS_DARK : GRAPHITE} roughness={0.3} metalness={0.26} envMapIntensity={0.85} />
        <Edges color={selected ? BRASS : P.inkSoft} lineWidth={selected ? 1.6 : 0.55} transparent opacity={0.82} depthWrite={false} />
      </RoundedBox>
      <Trace points={[[-0.42, 0.215, -0.32], [0.42, 0.215, -0.32], [0.42, 0.215, 0.32], [-0.42, 0.215, 0.32], [-0.42, 0.215, -0.32]]} color={selected ? IVORY : SILK} width={0.7} opacity={0.76} />
    </group>
  );
}

function Heatsink({ selected, exploded }: { selected: boolean; exploded: number }) {
  const fins = useMemo(() => Array.from({ length: 11 }, (_, i) => -1.2 + i * 0.24), []);
  return (
    <group position={[0, 0.47 + exploded * 1.08, 0]}>
      <RoundedBox args={[2.9, 0.16, 1.84]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial
          color={selected ? IVORY : IVORY_SHADE}
          roughness={selected ? 0.3 : 0.46}
          metalness={0.12}
          envMapIntensity={0.9}
        />
        <Edges color={selected ? BRASS : BRASS_DARK} lineWidth={selected ? 2 : 0.8} transparent opacity={selected ? 1 : 0.62} depthWrite={false} />
      </RoundedBox>
      {fins.map((x) => (
        <RoundedBox key={x} args={[0.12, 0.42, 1.68]} radius={0.025} smoothness={2} position={[x, 0.27, 0]} castShadow>
          <meshStandardMaterial color={selected ? IVORY : IVORY_SHADE} roughness={0.42} metalness={0.1} envMapIntensity={0.82} />
        </RoundedBox>
      ))}
      {[
        [-1.1, 0.53, -0.62],
        [1.1, 0.53, -0.62],
        [-1.1, 0.53, 0.62],
        [1.1, 0.53, 0.62],
      ].map((position, i) => (
        <Screw key={i} position={position as V3} selected={selected} />
      ))}
    </group>
  );
}

function WalnutBase() {
  return (
    <RoundedBox args={[6.65, 0.32, 4.65]} radius={0.13} smoothness={3} position={[0, -0.25, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={WOOD} roughness={0.5} metalness={0.03} envMapIntensity={0.7} />
      <Edges color={WOOD_EDGE} lineWidth={0.9} transparent opacity={0.74} depthWrite={false} />
    </RoundedBox>
  );
}

function GpuBoard({ focus, bank, exploded }: { focus: Focus; bank: number; exploded: number }) {
  return (
    <group>
      <WalnutBase />
      {[
        [-2.48, -1.48],
        [2.48, -1.48],
        [-2.48, 1.48],
        [2.48, 1.48],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.03, z]}>
          <cylinderGeometry args={[0.1, 0.1, 0.18, 16]} />
          <meshStandardMaterial color={BRASS_DARK} roughness={0.3} metalness={0.68} envMapIntensity={0.78} />
        </mesh>
      ))}

      <RoundedBox args={[5.8, 0.18, 3.8]} radius={0.1} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={focus === "pcb" ? PCB_DARK : PCB} roughness={0.62} metalness={0.08} envMapIntensity={0.72} />
        <Edges color={focus === "pcb" ? BRASS : SILK} lineWidth={focus === "pcb" ? 2.2 : 0.85} transparent opacity={focus === "pcb" ? 1 : 0.62} depthWrite={false} />
      </RoundedBox>

      {TRACE_ROUTES.map((trace, i) => <Trace key={i} points={trace.points} color={trace.color} />)}
      {VIA_XZ.map(([x, z], i) => <Via key={i} position={[x, 0.14, z]} selected={focus === "pcb"} />)}
      <Flow points={[[-2.72, 0.16, 0.82], [-1.4, 0.16, 0.82], [-1.02, 0.16, 0.6]]} color={P.teal} count={2} size={0.042} speed={0.16} lineOpacity={0} />

      {BANK_XZ.map(([x, z], i) => (
        <VramBank
          key={i}
          index={i}
          position={[x, 0.2, z]}
          selected={focus === "vram" && bank === i + 1}
          exploded={exploded}
        />
      ))}
      <GpuChip selected={focus === "gpu"} exploded={exploded} />
      <Heatsink selected={focus === "cooler"} exploded={exploded} />
      <ContactStrip selected={focus === "contacts"} />
      <Tag position={[0, -0.01, 2.34]} tone={focus === "contacts" ? "amber" : "muted"} size="xs" center>
        PCIe x16 · contactos
      </Tag>
    </group>
  );
}

function MemoryModel() {
  const locale = useLocale();
  return locale === "es" ? <VisualSpanish /> : <VisualLegacy />;
}

function VisualSpanish() {
  const [paramsB, setParamsB] = useState(8);
  const [bits, setBits] = useState<Precision>("16");
  const [contextK, setContextK] = useState(32);
  const [assembly, setAssembly] = useState<Assembly>("exploded");
  const [explosion, setExplosion] = useState(0.72);
  const [focus, setFocus] = useState<Focus>("gpu");
  const [bank, setBank] = useState(1);

  const calc = useMemo(() => {
    const bitsValue = Number(bits);
    const weights = (paramsB * 1e9 * bitsValue / 8) / GiB;
    const kvPerToken = 2 * LAYERS * KV_HEADS * HEAD_DIM * CACHE_BYTES * BATCH;
    const kv = (kvPerToken * contextK * 1024) / GiB;
    const total = weights + kv + RESERVE_GIB;
    const perBank = (weights + kv) / VRAM_BANKS;
    return {
      bitsValue,
      weights,
      kv,
      total,
      perBank,
      available: GPU_CAPACITY_GIB - total,
      kvPerTokenKiB: kvPerToken / 1024,
    };
  }, [bits, contextK, paramsB]);

  const actualExplosion = assembly === "covered" ? 0 : explosion;
  const selectedLabel: Record<Focus, string> = {
    pcb: "PCB y pistas",
    gpu: "chip de cálculo",
    vram: `banco VRAM ${bank}`,
    cooler: "disipador",
    contacts: "contactos PCIe",
  };
  const status = calc.available >= 0
    ? `Cabe con ${numberEs(calc.available)} GiB de margen.`
    : `No cabe: faltan ${numberEs(Math.abs(calc.available))} GiB.`;

  return (
    <Figure
      label="MEMORIA DE GPU · MAQUETA DESMONTABLE"
      hint="pesos · caché KV · reserva · distribución física"
      height="h-[540px]"
      legend={[
        { color: P.teal, label: "PCB / pistas" },
        { color: P.amber, label: "VRAM / contactos" },
        { color: P.violet, label: "flujo KV" },
        { color: P.ink, label: "disipador" },
      ]}
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Switcher
            value={bits}
            onChange={setBits}
            options={[
              { value: "4" as Precision, label: "4 bits", tone: P.violet },
              { value: "8" as Precision, label: "8 bits", tone: P.amber },
              { value: "16" as Precision, label: "16 bits", tone: P.teal },
            ]}
            ariaLabel="Precisión de los pesos"
          />
          <Knob label="Parámetros" value={paramsB} min={4} max={70} step={1} onChange={setParamsB} format={(v) => `${v}B`} tone={P.teal} />
          <Knob label="Contexto" value={contextK} min={1} max={128} step={1} onChange={setContextK} format={(v) => `${v}k`} tone={P.violet} />
          <Switcher
            value={assembly}
            onChange={setAssembly}
            options={[
              { value: "covered" as Assembly, label: "Cubierta", tone: P.ink },
              { value: "exploded" as Assembly, label: "Despiece", tone: P.amber },
            ]}
            ariaLabel="Cubierta o despiece"
          />
          <Knob label="Separación" value={explosion} min={0} max={1} step={0.01} onChange={setExplosion} format={(v) => `${Math.round(v * 100)}%`} tone={P.amber} />
          <Switcher
            value={focus}
            onChange={setFocus}
            options={[
              { value: "pcb" as Focus, label: "PCB", tone: P.teal },
              { value: "gpu" as Focus, label: "Chip", tone: P.violet },
              { value: "vram" as Focus, label: "VRAM", tone: P.amber },
              { value: "cooler" as Focus, label: "Disipador", tone: P.ink },
              { value: "contacts" as Focus, label: "PCIe", tone: P.teal },
            ]}
            ariaLabel="Componente resaltado"
          />
          <Knob label="Banco" value={bank} min={1} max={8} step={1} onChange={setBank} format={(v) => `${v}/8`} tone={P.amber} />
        </div>
      }
      note={
        <div className="space-y-2">
          <p aria-live="polite">
            {status} Se resalta: <strong>{selectedLabel[focus]}</strong>. La GPU de referencia es conceptual (24 GiB); la placa es una maqueta pedagógica, no una microarquitectura ni una GPU concreta.
          </p>
          <p className="text-[0.8rem] text-muted">
            Pesos = {paramsB}B × {calc.bitsValue}/8 = {numberEs(calc.weights)} GiB · KV = 2 × {LAYERS} capas × {KV_HEADS} cabezas KV (GQA) × {HEAD_DIM} dim × {CACHE_BYTES} bytes × {contextK}k tokens × lote {BATCH} = {numberEs(calc.kv)} GiB · reserva fija = {numberEs(RESERVE_GIB)} GiB.
          </p>
          <p className="text-[0.76rem] text-faint">
            Supuestos explícitos: pesos ideales sin sobrecarga de cuantización, caché KV en FP16, GQA con {KV_HEADS} cabezas KV, dimensión {HEAD_DIM}, lote 1 y unidades GiB (2³⁰ bytes). La reserva cubre runtime y buffers temporales; el reparto entre ocho bancos es una media ilustrativa.
          </p>
          <div className="space-y-1.5" aria-label={`Uso de memoria sobre ${GPU_CAPACITY_GIB} GiB`}>
            <CapacityBar label="pesos" value={calc.weights} color={P.teal} />
            <CapacityBar label="KV" value={calc.kv} color={P.violet} />
            <CapacityBar label="reserva" value={RESERVE_GIB} color={P.amber} />
            <p className="text-[0.68rem] text-faint">Escala horizontal: {GPU_CAPACITY_GIB} GiB de VRAM conceptual.</p>
          </div>
          <Readout
            items={[
              { label: "pesos", value: `${numberEs(calc.weights)} GiB`, tone: P.teal },
              { label: "KV", value: `${numberEs(calc.kv)} GiB`, tone: P.violet },
              { label: "reserva", value: `${numberEs(RESERVE_GIB)} GiB`, tone: P.amber },
              { label: "total", value: `${numberEs(calc.total)} GiB`, tone: calc.available >= 0 ? P.ink : P.rose },
              { label: "banco medio", value: `${numberEs(calc.perBank)} GiB`, tone: P.amber },
              { label: "por token", value: `${numberEs(calc.kvPerTokenKiB, 0)} KiB`, tone: P.violet },
            ]}
          />
        </div>
      }
    >
      <Stage
        className="h-full w-full"
        maxDpr={1.8}
        camera={{ position: [7.2, 5.6, 8.2], fov: 34 }}
        background={P.paper}
        fit={1.05}
      >
        <PointerTilt amount={0.045}>
          <group position={[-0.7, 0.05, 0]} rotation={[0, -0.08, 0]}>
            <ShadowBlob position={[0, -0.45, 0]} scale={4.7} opacity={0.12} />
            <GpuBoard focus={focus} bank={bank} exploded={actualExplosion} />
          </group>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return <MemoryModel />;
}

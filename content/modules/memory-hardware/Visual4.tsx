"use client";

import { Edges, Line, RoundedBox } from "@react-three/drei";
import { useMemo, useState, type ReactNode } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, PointerTilt, ShadowBlob, Tag, type V3 } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Platform = "nvidia" | "apple";
type AppleVariant = "max40" | "max32";
type Focus = "cpu" | "gpu" | "memory" | "link";
type Assembly = "covered" | "exploded";

const BOARD = "#183D39";
const BOARD_DARK = "#0E2928";
const BOARD_APPLE = "#3B3B38";
const BOARD_EDGE = "#5D8B7E";
const COPPER = "#B96E36";
const GOLD = "#B8873C";
const GOLD_DARK = "#6B4C20";
const CERAMIC = "#989B90";
const CERAMIC_DARK = "#626A64";
const GRAPHITE = "#252B2B";
const SILICON = "#25383B";
const HEATSINK = "#737C78";
const HEATSINK_DARK = "#4F5855";

const NVIDIA_SOURCE = "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/";
const APPLE_SOURCE = "https://support.apple.com/en-mide/121553";

const APPLE_VARIANTS: Record<AppleVariant, { label: string; total: number; bandwidth: number }> = {
  max40: { label: "M4 Max · 16 CPU · 40 GPU · configuración 128 GB", total: 128, bandwidth: 546 },
  max32: { label: "M4 Max · 14 CPU · 32 GPU · configuración 36 GB", total: 36, bandwidth: 410 },
};

function numberEs(value: number, decimals = 1) {
  return value.toFixed(decimals).replace(".", ",");
}

function Trace({ points, color, width = 0.8, opacity = 0.72 }: { points: V3[]; color: string; width?: number; opacity?: number }) {
  return <Line points={points} color={color} lineWidth={width} transparent opacity={opacity} depthWrite={false} />;
}

function Screw({ position, color = GOLD_DARK, scale = 1 }: { position: V3; color?: string; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <cylinderGeometry args={[0.075, 0.075, 0.045, 16]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.76} envMapIntensity={0.9} />
      </mesh>
      <Trace points={[[-0.045, 0.026, 0], [0.045, 0.026, 0]]} color={CERAMIC} width={0.65} opacity={0.72} />
      <Trace points={[[0, 0.027, -0.045], [0, 0.027, 0.045]]} color={CERAMIC} width={0.65} opacity={0.72} />
    </group>
  );
}

function EdgePackage({
  position,
  size,
  selected,
  color = CERAMIC,
  children,
}: {
  position: V3;
  size: V3;
  selected: boolean;
  color?: string;
  children?: ReactNode;
}) {
  return (
    <RoundedBox args={size} radius={0.06} smoothness={3} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={selected ? P.amber : color} roughness={selected ? 0.28 : 0.42} metalness={selected ? 0.36 : 0.08} envMapIntensity={0.9} />
      <Edges color={selected ? P.amber : CERAMIC_DARK} lineWidth={selected ? 2 : 0.72} transparent opacity={selected ? 1 : 0.68} depthWrite={false} />
      {children}
    </RoundedBox>
  );
}

function MemoryPackage({ position, selected, exploded, size = [0.62, 0.16, 0.42] as V3 }: { position: V3; selected: boolean; exploded: number; size?: V3 }) {
  return (
    <group position={[position[0], position[1] + exploded * 0.1, position[2]]}>
      <EdgePackage position={[0, 0, 0]} size={size} selected={selected} color={CERAMIC}>
        <mesh position={[0, size[1] / 2 + 0.012, 0]}>
          <boxGeometry args={[size[0] * 0.62, 0.025, size[2] * 0.56]} />
          <meshStandardMaterial color={GRAPHITE} roughness={0.32} metalness={0.2} envMapIntensity={0.75} />
        </mesh>
        {[-0.2, 0, 0.2].map((x) => (
          <mesh key={x} position={[x * size[0], size[1] / 2 + 0.028, 0]}>
            <boxGeometry args={[0.032, 0.03, size[2] * 0.72]} />
            <meshStandardMaterial color={selected ? P.amber : COPPER} roughness={0.28} metalness={0.72} />
          </mesh>
        ))}
      </EdgePackage>
    </group>
  );
}

function FinCooler({ selected, exploded, compact = false }: { selected: boolean; exploded: number; compact?: boolean }) {
  const count = compact ? 7 : 11;
  const xs = useMemo(() => Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * (compact ? 0.2 : 0.24)), [compact, count]);
  const width = compact ? 1.65 : 2.95;
  const depth = compact ? 1.15 : 2.05;
  return (
    <group position={[0, 0.48 + exploded * (compact ? 0.95 : 1.4), 0]}>
      <RoundedBox args={[width, 0.16, depth]} radius={0.07} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={selected ? CERAMIC : HEATSINK} roughness={0.34} metalness={0.58} envMapIntensity={0.86} />
        <Edges color={selected ? P.amber : HEATSINK_DARK} lineWidth={selected ? 1.8 : 0.7} transparent opacity={0.76} depthWrite={false} />
      </RoundedBox>
      {xs.map((x) => (
        <RoundedBox key={x} args={[compact ? 0.09 : 0.12, compact ? 0.34 : 0.42, depth * 0.87]} radius={0.02} smoothness={2} position={[x, compact ? 0.22 : 0.27, 0]} castShadow>
          <meshStandardMaterial color={selected ? CERAMIC : HEATSINK} roughness={0.36} metalness={0.54} envMapIntensity={0.82} />
        </RoundedBox>
      ))}
      {[
        [-width * 0.34, compact ? 0.36 : 0.52, -depth * 0.31],
        [width * 0.34, compact ? 0.36 : 0.52, -depth * 0.31],
        [-width * 0.34, compact ? 0.36 : 0.52, depth * 0.31],
        [width * 0.34, compact ? 0.36 : 0.52, depth * 0.31],
      ].map((position, i) => <Screw key={i} position={position as V3} color={selected ? GOLD : GOLD_DARK} scale={compact ? 0.78 : 1} />)}
    </group>
  );
}

function CpuPackage({ selected, exploded }: { selected: boolean; exploded: number }) {
  return (
    <group position={[0, 0.28 + exploded * 0.18, 0]}>
      <EdgePackage position={[0, 0, 0]} size={[0.94, 0.2, 0.94]} selected={selected} color={CERAMIC}>
        <RoundedBox args={[0.66, 0.055, 0.66]} radius={0.03} smoothness={2} position={[0, 0.13, 0]}>
          <meshStandardMaterial color={selected ? GOLD_DARK : GRAPHITE} roughness={0.3} metalness={0.28} envMapIntensity={0.78} />
          <Edges color={selected ? P.amber : P.inkSoft} lineWidth={0.65} transparent opacity={0.75} depthWrite={false} />
        </RoundedBox>
      </EdgePackage>
    </group>
  );
}

function Dimm({ position, selected, exploded }: { position: V3; selected: boolean; exploded: number }) {
  return (
    <group position={[position[0], position[1] + exploded * 0.08, position[2]]}>
      <RoundedBox args={[0.27, 0.16, 1.72]} radius={0.035} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={selected ? P.amber : BOARD_DARK} roughness={0.46} metalness={0.1} envMapIntensity={0.72} />
        <Edges color={selected ? P.amber : BOARD_EDGE} lineWidth={selected ? 1.6 : 0.58} transparent opacity={0.75} depthWrite={false} />
      </RoundedBox>
      {[-0.58, -0.3, 0, 0.3, 0.58].map((z) => (
        <mesh key={z} position={[0, 0.1, z]}>
          <boxGeometry args={[0.14, 0.028, 0.18]} />
          <meshStandardMaterial color={selected ? GOLD : COPPER} roughness={0.28} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function HostBoard({ focus, exploded }: { focus: Focus; exploded: number }) {
  const selected = focus === "cpu" || focus === "memory";
  return (
    <group position={[-2.8, -0.23, 0]}>
      <RoundedBox args={[2.45, 0.2, 3.2]} radius={0.1} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={selected ? BOARD_DARK : BOARD} roughness={0.58} metalness={0.08} envMapIntensity={0.68} />
        <Edges color={selected ? P.teal : BOARD_EDGE} lineWidth={selected ? 1.8 : 0.78} transparent opacity={0.78} depthWrite={false} />
      </RoundedBox>
      <Trace points={[[-0.98, 0.12, -1.15], [-0.45, 0.12, -0.45], [0, 0.12, 0]]} color={COPPER} />
      <Trace points={[[0.98, 0.12, 1.15], [0.45, 0.12, 0.45], [0, 0.12, 0]]} color={P.teal} />
      <Trace points={[[-0.98, 0.12, 1.15], [-0.45, 0.12, 0.45], [0, 0.12, 0]]} color={GOLD} />
      <CpuPackage selected={focus === "cpu"} exploded={exploded} />
      <Dimm position={[-0.82, 0.18, -0.78]} selected={focus === "memory"} exploded={exploded} />
      <Dimm position={[0.82, 0.18, 0.78]} selected={focus === "memory"} exploded={exploded} />
      {[[-0.92, 0.1, -1.25], [0.92, 0.1, -1.25], [-0.92, 0.1, 1.25], [0.92, 0.1, 1.25]].map((position, i) => <Screw key={i} position={position as V3} scale={0.78} />)}
      <Tag position={[0, 0.15, 1.83]} tone={focus === "cpu" || focus === "memory" ? "teal" : "muted"} size="xs" center>
        CPU + RAM del equipo
      </Tag>
    </group>
  );
}

function PcieBridge({ selected, exploded }: { selected: boolean; exploded: number }) {
  return (
    <group position={[-1.05, 0.12 + exploded * 0.05, 0]}>
      <RoundedBox args={[1.08, 0.16, 0.62]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={selected ? P.amber : GOLD_DARK} roughness={0.28} metalness={0.68} envMapIntensity={0.85} />
        <Edges color={selected ? P.amber : GOLD} lineWidth={selected ? 1.9 : 0.72} transparent opacity={0.88} depthWrite={false} />
      </RoundedBox>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-0.4 + i * 0.09, 0.1, 0]}>
          <boxGeometry args={[0.035, 0.03, 0.44]} />
          <meshStandardMaterial color={selected ? CERAMIC : COPPER} roughness={0.26} metalness={0.72} />
        </mesh>
      ))}
      <Tag position={[0, 0.28, 0.5]} tone={selected ? "amber" : "muted"} size="xs" center>
        PCIe
      </Tag>
    </group>
  );
}

function GpuCard({ focus, exploded }: { focus: Focus; exploded: number }) {
  const gpuSelected = focus === "gpu";
  const memorySelected = focus === "memory";
  const vram = [
    [-1.28, 0.26, -0.88], [-0.52, 0.26, -1.02], [0.52, 0.26, -1.02], [1.28, 0.26, -0.88],
    [-1.28, 0.26, 0.88], [-0.52, 0.26, 1.02], [0.52, 0.26, 1.02], [1.28, 0.26, 0.88],
  ] as V3[];
  return (
    <group position={[1.6, -0.22, 0]}>
      <RoundedBox args={[4.35, 0.22, 2.82]} radius={0.1} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={focus === "link" ? BOARD_DARK : BOARD} roughness={0.6} metalness={0.08} envMapIntensity={0.72} />
        <Edges color={focus === "link" ? P.amber : BOARD_EDGE} lineWidth={focus === "link" ? 1.8 : 0.8} transparent opacity={0.78} depthWrite={false} />
      </RoundedBox>
      <Trace points={[[-1.9, 0.14, -1.08], [-0.75, 0.14, -0.42], [0, 0.14, 0]]} color={COPPER} />
      <Trace points={[[1.9, 0.14, 1.08], [0.75, 0.14, 0.42], [0, 0.14, 0]]} color={P.teal} />
      <Trace points={[[-1.88, 0.14, 1.08], [-0.74, 0.14, 0.42], [0, 0.14, 0]]} color={GOLD} />
      {[-1.76, -1.42, -1.08, -0.74, -0.4, -0.06, 0.28, 0.62, 0.96, 1.3, 1.64].map((x) => (
        <mesh key={x} position={[x, 0.14, 1.48]}>
          <boxGeometry args={[0.12, 0.06, 0.27]} />
          <meshStandardMaterial color={focus === "link" ? GOLD : GOLD_DARK} roughness={0.25} metalness={0.76} envMapIntensity={0.92} />
        </mesh>
      ))}
      {vram.map((position, i) => <MemoryPackage key={i} position={position} selected={memorySelected} exploded={exploded} />)}
      <group position={[0, 0.26 + exploded * 0.2, 0]}>
        <EdgePackage position={[0, 0, 0]} size={[1.35, 0.23, 1.12]} selected={gpuSelected} color={CERAMIC}>
          <RoundedBox args={[0.94, 0.065, 0.74]} radius={0.035} smoothness={2} position={[0, 0.15, 0]}>
            <meshStandardMaterial color={gpuSelected ? GOLD_DARK : SILICON} roughness={0.3} metalness={0.25} envMapIntensity={0.82} />
            <Edges color={gpuSelected ? P.amber : P.inkSoft} lineWidth={gpuSelected ? 1.6 : 0.6} transparent opacity={0.8} depthWrite={false} />
          </RoundedBox>
          <Trace points={[[-0.36, 0.2, -0.25], [0.36, 0.2, -0.25], [0.36, 0.2, 0.25], [-0.36, 0.2, 0.25], [-0.36, 0.2, -0.25]]} color={gpuSelected ? CERAMIC : P.teal} width={0.7} opacity={0.78} />
        </EdgePackage>
      </group>
      <FinCooler selected={false} exploded={exploded} />
      {[[-1.9, 0.14, -1.12], [1.9, 0.14, -1.12], [-1.9, 0.14, 1.12], [1.9, 0.14, 1.12]].map((position, i) => <Screw key={i} position={position as V3} />)}
      <Tag position={[0, 0.17, -1.7]} tone={gpuSelected || memorySelected ? "amber" : "muted"} size="xs" center>
        RTX 5090 · GPU + VRAM
      </Tag>
    </group>
  );
}

function NvidiaScene({ focus, exploded }: { focus: Focus; exploded: number }) {
  const flowColor = focus === "link" ? P.amber : P.violet;
  return (
    <>
      <HostBoard focus={focus} exploded={exploded} />
      <PcieBridge selected={focus === "link"} exploded={exploded} />
      <GpuCard focus={focus} exploded={exploded} />
      <Trace points={[[-1.92, 0.38, 0], [-1.55, 0.38, 0], [-1.05, 0.38, 0], [-0.55, 0.38, 0], [0.4, 0.38, 0]]} color={flowColor} width={1.1} opacity={0.2} />
      <Flow points={[[-1.92, 0.38, 0], [-1.55, 0.38, 0], [-1.05, 0.38, 0], [-0.55, 0.38, 0], [0.4, 0.38, 0]] as V3[]} color={flowColor} count={5} speed={0.2} size={0.045} lineOpacity={0} />
    </>
  );
}

function SocDie({ focus, exploded }: { focus: Focus; exploded: number }) {
  const cpuSelected = focus === "cpu";
  const gpuSelected = focus === "gpu";
  return (
    <group position={[0, 0.3 + exploded * 0.2, 0]}>
      <EdgePackage position={[0, 0, 0]} size={[2.42, 0.25, 1.78]} selected={focus === "cpu" || focus === "gpu"} color={CERAMIC}>
        <RoundedBox args={[0.78, 0.075, 1.1]} radius={0.04} smoothness={2} position={[-0.58, 0.17, 0]}>
          <meshStandardMaterial color={cpuSelected ? P.tealDeep : SILICON} roughness={0.3} metalness={0.2} envMapIntensity={0.82} />
          <Edges color={cpuSelected ? P.teal : P.inkSoft} lineWidth={cpuSelected ? 1.6 : 0.56} transparent opacity={0.78} depthWrite={false} />
        </RoundedBox>
        <RoundedBox args={[1.02, 0.075, 1.1]} radius={0.04} smoothness={2} position={[0.52, 0.17, 0]}>
          <meshStandardMaterial color={gpuSelected ? P.violetDeep : GRAPHITE} roughness={0.3} metalness={0.24} envMapIntensity={0.82} />
          <Edges color={gpuSelected ? P.violet : P.inkSoft} lineWidth={gpuSelected ? 1.6 : 0.56} transparent opacity={0.78} depthWrite={false} />
        </RoundedBox>
        <Trace points={[[-0.95, 0.21, -0.47], [0.98, 0.21, -0.47], [0.98, 0.21, 0.47], [-0.95, 0.21, 0.47], [-0.95, 0.21, -0.47]]} color={focus === "link" ? P.amber : BOARD_EDGE} width={0.72} opacity={0.76} />
      </EdgePackage>
    </group>
  );
}

function AppleBoard({ focus, exploded }: { focus: Focus; exploded: number }) {
  const memoryPositions = [[-2.0, 0.29, -0.72], [2.0, 0.29, -0.72], [-2.0, 0.29, 0.72], [2.0, 0.29, 0.72]] as V3[];
  return (
    <group>
      <RoundedBox args={[5.65, 0.24, 3.35]} radius={0.13} smoothness={3} position={[0, -0.23, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={focus === "link" ? BOARD_APPLE : "#464944"} roughness={0.62} metalness={0.1} envMapIntensity={0.72} />
        <Edges color={focus === "link" ? P.amber : BOARD_EDGE} lineWidth={focus === "link" ? 1.8 : 0.8} transparent opacity={0.78} depthWrite={false} />
      </RoundedBox>
      <Trace points={[[-2.35, 0.14, -1.18], [-1.35, 0.14, -0.48], [-0.72, 0.14, 0]]} color={COPPER} />
      <Trace points={[[2.35, 0.14, 1.18], [1.35, 0.14, 0.48], [0.72, 0.14, 0]]} color={P.teal} />
      {memoryPositions.map((position, i) => <MemoryPackage key={i} position={position} selected={focus === "memory"} exploded={exploded} size={[0.78, 0.18, 0.5]} />)}
      <SocDie focus={focus} exploded={exploded} />
      <FinCooler selected={false} exploded={exploded} />
      {[[-2.35, 0.12, -1.18], [2.35, 0.12, -1.18], [-2.35, 0.12, 1.18], [2.35, 0.12, 1.18]].map((position, i) => <Screw key={i} position={position as V3} />)}
      <Tag position={[-0.55, 0.18, -1.15]} tone={focus === "cpu" || focus === "gpu" ? "teal" : "muted"} size="xs" center>
        M4 Max · CPU + GPU
      </Tag>
      <Tag position={[1.78, 0.2, 1.18]} tone={focus === "memory" ? "amber" : "muted"} size="xs" center>
        memoria unificada
      </Tag>
    </group>
  );
}

function AppleScene({ focus, exploded }: { focus: Focus; exploded: number }) {
  const flowColor = focus === "link" ? P.amber : P.teal;
  return (
    <>
      <AppleBoard focus={focus} exploded={exploded} />
      <Trace points={[[-1.2, 0.52, 0], [-0.55, 0.52, 0], [0.4, 0.52, 0], [1.45, 0.52, 0]]} color={flowColor} width={1.1} opacity={0.22} />
      <Flow points={[[-1.2, 0.52, 0], [-0.55, 0.52, 0], [0.4, 0.52, 0], [1.45, 0.52, 0]] as V3[]} color={flowColor} count={5} speed={0.18} size={0.045} lineOpacity={0} />
      <Tag position={[0, -0.02, 1.92]} tone={focus === "link" ? "amber" : "muted"} size="xs" center>
        espacio compartido · sin PCIe
      </Tag>
    </>
  );
}

function CapacityBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-2 text-[0.68rem]">
      <span className="font-mono uppercase tracking-[0.12em] text-faint">{label}</span>
      <span
        className="h-1.5 overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-label={`${label}: ${numberEs(value)} GB de ${numberEs(max)} GB`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Number(value.toFixed(1))}
      >
        <span className="block h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </span>
      <span className="font-mono tabular-nums text-muted">{numberEs(value)} GB</span>
    </div>
  );
}

export default function Visual4() {
  const [platform, setPlatform] = useState<Platform>("nvidia");
  const [appleVariant, setAppleVariant] = useState<AppleVariant>("max40");
  const [focus, setFocus] = useState<Focus>("link");
  const [assembly, setAssembly] = useState<Assembly>("exploded");
  const [explosion, setExplosion] = useState(0.8);

  const apple = APPLE_VARIANTS[appleVariant];
  const total = platform === "nvidia" ? 32 : apple.total;
  const reserve = platform === "nvidia" ? 1.5 : 8;
  const available = total - reserve;
  const actualExplosion = assembly === "covered" ? 0 : explosion;
  const isNvidia = platform === "nvidia";
  const platformLabel = isNvidia ? "NVIDIA RTX 5090" : apple.label;
  const topology = isNvidia
    ? "CPU y RAM viven en la placa del equipo; los datos cruzan el puente PCIe hacia la GPU y sus 32 GB GDDR7 dedicados."
    : "CPU y GPU viven en el mismo SoC y leen el mismo espacio de memoria unificada; no hay una copia PCIe del modelo hacia una VRAM aparte.";
  const bandwidth = isNvidia ? "1.792 GB/s" : `${apple.bandwidth} GB/s de ancho de banda`;

  return (
    <Figure
      label="Memoria y topología · NVIDIA frente a Apple"
      hint="VRAM dedicada · memoria unificada · ruta de lectura"
      height="h-[540px]"
      legend={[
        { color: P.teal, label: "CPU / GPU" },
        { color: P.amber, label: "memoria" },
        { color: P.violet, label: "lectura" },
      ]}
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Switcher
            value={platform}
            onChange={setPlatform}
            options={[
              { value: "nvidia" as Platform, label: "NVIDIA RTX 5090", tone: P.teal },
              { value: "apple" as Platform, label: "Apple M4 Max", tone: P.violet },
            ]}
            ariaLabel="Plataforma comparada"
          />
          {platform === "apple" ? (
            <Switcher
              value={appleVariant}
              onChange={setAppleVariant}
              options={[
                { value: "max40" as AppleVariant, label: "16 CPU · 40 GPU · 128 GB", tone: P.violet },
                { value: "max32" as AppleVariant, label: "14 CPU · 32 GPU · 36 GB", tone: P.teal },
              ]}
              ariaLabel="Variante de M4 Max"
            />
          ) : null}
          <Switcher
            value={focus}
            onChange={setFocus}
            options={[
              { value: "cpu" as Focus, label: "CPU", tone: P.teal },
              { value: "gpu" as Focus, label: "GPU", tone: P.violet },
              { value: "memory" as Focus, label: "Memoria", tone: P.amber },
              { value: "link" as Focus, label: "Enlace", tone: P.ink },
            ]}
            ariaLabel="Pieza resaltada"
          />
          <Switcher
            value={assembly}
            onChange={setAssembly}
            options={[
              { value: "covered" as Assembly, label: "Cubierta", tone: P.ink },
              { value: "exploded" as Assembly, label: "Despiece", tone: P.amber },
            ]}
            ariaLabel="Vista cubierta o despiece"
          />
          <Knob label="Separación" value={explosion} min={0} max={1} step={0.01} onChange={setExplosion} format={(v) => `${Math.round(v * 100)}%`} tone={P.amber} />
        </div>
      }
      note={
        <div className="space-y-3">
          <p aria-live="polite">
            <strong>{platformLabel}</strong> · se resalta {focus === "cpu" ? "CPU" : focus === "gpu" ? "GPU" : focus === "memory" ? "memoria" : "el enlace de lectura"}. Los puntos en movimiento muestran por dónde se leen los datos; la maqueta explica la topología, no reproduce dimensiones ni una disposición física exactas.
          </p>
          <div className="space-y-1.5" aria-label={`Capacidad total y margen estimado para cargas en ${platformLabel}`}>
            <CapacityBar label="total" value={total} max={total} color={isNvidia ? P.teal : P.violet} />
            <CapacityBar label="margen estimado" value={available} max={total} color={P.amber} />
            <p className="text-[0.68rem] text-faint">El margen es una estimación pedagógica: total menos {numberEs(reserve)} GB de reserva supuesta de controladores/sistema.</p>
          </div>
          <Readout
            items={[
              { label: "capacidad total", value: `${numberEs(total)} GB`, tone: isNvidia ? P.teal : P.violet },
              { label: "margen estimado", value: `${numberEs(available)} GB`, tone: P.amber },
              { label: "reserva supuesta", value: `${numberEs(reserve)} GB`, tone: P.muted },
              { label: "memoria", value: isNvidia ? "GDDR7 dedicada" : "unificada", tone: P.ink },
              { label: "ancho de banda", value: bandwidth, tone: P.violet },
            ]}
          />
          <p className="text-[0.82rem] text-muted">{topology}</p>
          <p className="text-[0.76rem] text-faint">
            El número de memoria es capacidad instalada; el «margen estimado» deja sitio para el sistema y buffers. En NVIDIA, CPU/RAM y VRAM son dominios separados. En Apple, CPU/GPU comparten el espacio y compiten por él. La reserva no es una cifra fija de todos los equipos.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] text-muted">
            Fuentes: <a className="underline decoration-line underline-offset-2" href="https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf" target="_blank" rel="noreferrer">arquitectura Blackwell ↗</a> <a className="underline decoration-line underline-offset-2" href={NVIDIA_SOURCE} target="_blank" rel="noreferrer">ficha oficial RTX 5090 ↗</a>
            <a className="underline decoration-line underline-offset-2" href={APPLE_SOURCE} target="_blank" rel="noreferrer">especificaciones Apple M4 Max ↗</a>
          </p>
        </div>
      }
    >
      <Stage
        className="h-full w-full"
        maxDpr={1.8}
        camera={{ position: [8.3, 5.7, 9.6], fov: 35 }}
        background={P.paper}
        fit={1.08}
      >
        <PointerTilt amount={0.045}>
          <ShadowBlob position={[0, -0.56, 0]} scale={5.15} opacity={0.1} />
          {isNvidia ? <NvidiaScene focus={focus} exploded={actualExplosion} /> : <AppleScene focus={focus} exploded={actualExplosion} />}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

"use client";

import { Edges, Line, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CatmullRomCurve3, Group, Vector3 } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, PointerTilt, ShadowBlob, Tag, type V3 } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Platform = "nvidia" | "apple";
type Phase = "load" | "prefill" | "decode";
type PacketKind = "weights" | "tokens" | "kv" | "kvOut";

type Route = {
  id: string;
  points: V3[];
  kind: PacketKind;
  packets: number;
};

const HARDWARE = {
  wood: "#3B2D27",
  woodEdge: "#79523B",
  pcb: "#183F38",
  pcbDark: "#0F2C28",
  graphite: "#292D2D",
  steel: "#8C9895",
  steelDark: "#4E5A59",
  ivory: "#A3ABA2",
  ivoryShade: "#7E8982",
  brass: "#B7833E",
  brassLight: "#E1BD7E",
  copper: "#C4753E",
};

const PACKET_COLOR: Record<PacketKind, string> = {
  weights: P.amber,
  tokens: P.teal,
  kv: P.violet,
  kvOut: P.rose,
};

const PHASES: Phase[] = ["load", "prefill", "decode"];
const PHASE_LABEL: Record<Phase, string> = {
  load: "Cargar",
  prefill: "Prefill",
  decode: "Decode",
};

function HardwareLabel({ position, tone, children }: { position: V3; tone: "teal" | "amber" | "violet" | "ink" | "rose"; children: ReactNode }) {
  return <Tag position={position} tone={tone} size="xs" center>{children}</Tag>;
}

function Bench() {
  return (
    <group position={[0, 0.85, 0]}>
      <ShadowBlob position={[0, -1.62, 0.25]} scale={5.2} opacity={0.14} />
      <RoundedBox position={[0, -1.43, 0]} args={[9.8, 0.42, 2.75]} radius={0.2} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color={HARDWARE.wood} roughness={0.62} metalness={0.03} />
        <Edges color={HARDWARE.woodEdge} lineWidth={1.1} transparent opacity={0.72} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[0, -1.19, 0.02]} args={[9.48, 0.11, 2.43]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#5B4434" roughness={0.5} metalness={0.02} />
      </RoundedBox>
      {[-4.35, 4.35].flatMap((x) => [-0.88, 0.88].map((z) => [x, z] as const)).map(([x, z]) => (
        <mesh key={x + "-" + z} position={[x, -1.15, z]}>
          <cylinderGeometry args={[0.08, 0.08, 0.16, 16]} />
          <meshStandardMaterial color={HARDWARE.brass} roughness={0.26} metalness={0.72} />
        </mesh>
      ))}
      <Line points={[[-4.48, -1.04, 0], [4.48, -1.04, 0]]} color={HARDWARE.brass} lineWidth={0.9} transparent opacity={0.48} depthWrite={false} />
    </group>
  );
}

function Port({ position, active = false, color = HARDWARE.brass }: { position: V3; active?: boolean; color?: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.18, 0.18, 0.22]} radius={0.035} smoothness={2} castShadow>
        <meshStandardMaterial color={active ? color : HARDWARE.steelDark} roughness={0.3} metalness={0.72} envMapIntensity={0.88} />
      </RoundedBox>
      <mesh position={[0, 0, 0.115]}>
        <boxGeometry args={[0.07, 0.07, 0.02]} />
        <meshStandardMaterial color={active ? P.tealWash : HARDWARE.graphite} roughness={0.28} metalness={0.28} />
      </mesh>
    </group>
  );
}

function PacketTray({ position, tone, count = 3 }: { position: V3; tone: PacketKind; count?: number }) {
  const color = PACKET_COLOR[tone];
  return (
    <group position={position}>
      <RoundedBox args={[0.78, 0.07, 0.46]} radius={0.025} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={HARDWARE.steelDark} roughness={0.42} metalness={0.5} />
      </RoundedBox>
      {Array.from({ length: count }, (_, i) => (
        <RoundedBox key={i} position={[-0.23 + i * 0.23, 0.1, 0]} args={[0.16, 0.13, 0.22]} radius={0.025} smoothness={2} castShadow>
          <meshStandardMaterial color={color} roughness={0.34} metalness={0.12} envMapIntensity={0.84} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Trace({ points, color = HARDWARE.copper, active = false }: { points: V3[]; color?: string; active?: boolean }) {
  return <Line points={points} color={active ? color : HARDWARE.steelDark} lineWidth={active ? 1.8 : 0.7} transparent opacity={active ? 0.9 : 0.33} depthWrite={false} />;
}

function SsdDrive({ active }: { active: boolean }) {
  return (
    <group position={[-3.62, -0.15, 0]}>
      <RoundedBox args={[1.18, 0.42, 0.84]} radius={0.09} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={HARDWARE.graphite} roughness={0.43} metalness={0.35} envMapIntensity={0.8} />
        <Edges color={active ? HARDWARE.brassLight : HARDWARE.steel} lineWidth={active ? 2 : 0.7} transparent opacity={0.86} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[0, 0.235, 0]} args={[0.92, 0.055, 0.62]} radius={0.025} smoothness={2} castShadow>
        <meshStandardMaterial color={HARDWARE.pcb} roughness={0.52} metalness={0.12} />
      </RoundedBox>
      {[-0.3, 0, 0.3].map((x) => (
        <RoundedBox key={x} position={[x, 0.28, 0]} args={[0.18, 0.06, 0.28]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color={active ? P.amberWash : HARDWARE.ivoryShade} roughness={0.38} metalness={0.08} />
        </RoundedBox>
      ))}
      <mesh position={[0.66, 0.01, 0.22]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.34, 0.12, 0.08]} />
        <meshStandardMaterial color={HARDWARE.brass} roughness={0.24} metalness={0.76} />
      </mesh>
      <Port position={[0.67, 0.02, 0.36]} active={active} />
      <mesh position={[-0.42, 0.29, 0.31]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshBasicMaterial color={active ? P.teal : HARDWARE.copper} />
      </mesh>
    </group>
  );
}

function Dimm({ position, active }: { position: V3; active: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.14, 0.76, 0.42]} radius={0.025} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={active ? HARDWARE.ivory : HARDWARE.ivoryShade} roughness={0.44} metalness={0.05} />
      </RoundedBox>
      {[-0.24, -0.08, 0.08, 0.24].map((z) => (
        <RoundedBox key={z} position={[0, 0.08, z]} args={[0.17, 0.18, 0.085]} radius={0.012} smoothness={2} castShadow>
          <meshStandardMaterial color={active ? P.tealDeep : HARDWARE.graphite} roughness={0.34} metalness={0.12} />
        </RoundedBox>
      ))}
      <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.035, 0.12, 0.02]} />
        <meshStandardMaterial color={HARDWARE.brass} roughness={0.24} metalness={0.74} />
      </mesh>
    </group>
  );
}

function HostRig({ active }: { active: boolean }) {
  return (
    <group position={[-1.72, -0.1, 0]}>
      <RoundedBox args={[1.68, 0.16, 1.5]} radius={0.07} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={active ? HARDWARE.pcb : HARDWARE.pcbDark} roughness={0.6} metalness={0.08} />
        <Edges color={active ? P.teal : HARDWARE.steelDark} lineWidth={active ? 1.6 : 0.65} transparent opacity={0.8} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[-0.22, 0.2, -0.05]} args={[0.5, 0.2, 0.52]} radius={0.045} smoothness={2} castShadow>
        <meshStandardMaterial color={active ? HARDWARE.ivory : HARDWARE.ivoryShade} roughness={0.32} metalness={0.12} />
        <Edges color={active ? HARDWARE.brassLight : HARDWARE.steel} lineWidth={active ? 1.4 : 0.6} transparent opacity={0.84} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[-0.22, 0.32, -0.05]} args={[0.32, 0.04, 0.32]} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color={HARDWARE.graphite} roughness={0.3} metalness={0.25} />
      </RoundedBox>
      <Dimm position={[0.43, 0.28, -0.25]} active={active} />
      <Dimm position={[0.66, 0.28, 0.24]} active={active} />
      <Trace points={[[-0.75, 0.12, 0.55], [-0.38, 0.12, 0.26], [0.15, 0.12, 0.26]]} color={P.teal} active={active} />
      <Trace points={[[0.78, 0.13, -0.54], [0.34, 0.13, -0.35], [-0.02, 0.13, -0.1]]} color={HARDWARE.copper} active={active} />
      <Port position={[-0.87, 0.35, 0.34]} active={active} />
      <Port position={[0.89, 0.34, 0.34]} active={active} />
      <PacketTray position={[-0.42, 0.53, -0.5]} tone="weights" count={2} />
    </group>
  );
}

function PcieBridge({ active }: { active: boolean }) {
  return (
    <group position={[-0.15, -0.08, 0]}>
      <RoundedBox args={[1.1, 0.13, 0.76]} radius={0.045} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={active ? HARDWARE.graphite : HARDWARE.steelDark} roughness={0.4} metalness={0.34} />
        <Edges color={active ? HARDWARE.brassLight : HARDWARE.steel} lineWidth={active ? 1.6 : 0.7} transparent opacity={0.8} depthWrite={false} />
      </RoundedBox>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-0.45 + i * 0.082, 0.1, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.045, 0.18, 0.028]} />
          <meshStandardMaterial color={active ? HARDWARE.brass : HARDWARE.brassLight} roughness={0.24} metalness={0.76} />
        </mesh>
      ))}
      <Trace points={[[-0.42, 0.14, -0.2], [0.42, 0.14, -0.2]]} color={P.teal} active={active} />
      <Port position={[-0.62, 0.28, 0.25]} active={active} />
      <Port position={[0.62, 0.28, 0.25]} active={active} />
    </group>
  );
}

function VramChip({ position, active }: { position: V3; active: boolean }) {
  return (
    <RoundedBox position={position} args={[0.34, 0.16, 0.25]} radius={0.035} smoothness={2} castShadow receiveShadow>
      <meshStandardMaterial color={active ? P.violetWash : HARDWARE.ivoryShade} roughness={0.4} metalness={0.08} />
      <Edges color={active ? P.violet : HARDWARE.steel} lineWidth={active ? 1.35 : 0.55} transparent opacity={0.82} depthWrite={false} />
    </RoundedBox>
  );
}

function GpuRig({ phase }: { phase: Phase }) {
  const active = phase !== "load";
  return (
    <group position={[2.45, -0.02, 0]}>
      <RoundedBox args={[2.08, 0.18, 1.72]} radius={0.09} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={active ? HARDWARE.pcb : HARDWARE.pcbDark} roughness={0.6} metalness={0.1} />
        <Edges color={active ? P.amber : HARDWARE.steelDark} lineWidth={active ? 1.8 : 0.7} transparent opacity={0.82} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[0, 0.26, 0]} args={[0.84, 0.26, 0.7]} radius={0.07} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={active ? HARDWARE.ivory : HARDWARE.ivoryShade} roughness={0.3} metalness={0.14} />
        <Edges color={active ? HARDWARE.brassLight : HARDWARE.steel} lineWidth={active ? 1.8 : 0.7} transparent opacity={0.9} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[0, 0.42, 0]} args={[0.55, 0.04, 0.46]} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color={active ? HARDWARE.graphite : HARDWARE.steelDark} roughness={0.3} metalness={0.24} />
      </RoundedBox>
      {[
        [-0.68, 0.28, -0.5],
        [0.68, 0.28, -0.5],
        [-0.68, 0.28, 0.5],
        [0.68, 0.28, 0.5],
      ].map(([x, y, z], i) => <VramChip key={i} position={[x, y, z]} active={active} />)}
      {Array.from({ length: 8 }, (_, i) => (
        <RoundedBox key={i} position={[-0.82 + i * 0.235, 0.42, 0]} args={[0.11, 0.22, 1.4]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color={active ? HARDWARE.ivoryShade : HARDWARE.steel} roughness={0.46} metalness={0.12} />
        </RoundedBox>
      ))}
      <Port position={[-1.08, 0.34, 0.34]} active={phase === "load"} />
      <Port position={[1.08, 0.44, 0.42]} active={active} color={P.violet} />
      <Trace points={[[-0.7, 0.14, 0], [0, 0.14, 0], [0.72, 0.14, 0.48]]} color={P.violet} active={active} />
      <PacketTray position={[0.7, 0.72, 0.52]} tone="kv" count={2} />
    </group>
  );
}

function SharedPool({ phase }: { phase: Phase }) {
  const active = phase !== "load";
  return (
    <group position={[0.72, -0.05, 0]}>
      <RoundedBox args={[3.22, 0.2, 1.76]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={active ? HARDWARE.pcb : HARDWARE.pcbDark} roughness={0.58} metalness={0.12} />
        <Edges color={active ? P.amber : HARDWARE.steelDark} lineWidth={active ? 1.8 : 0.7} transparent opacity={0.86} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[-0.82, 0.27, 0]} args={[1.08, 0.25, 1.12]} radius={0.08} smoothness={3} castShadow>
        <meshStandardMaterial color={active ? HARDWARE.ivory : HARDWARE.ivoryShade} roughness={0.38} metalness={0.1} />
        <Edges color={active ? P.teal : HARDWARE.steel} lineWidth={active ? 1.5 : 0.65} transparent opacity={0.8} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[0.7, 0.27, 0]} args={[1.08, 0.25, 1.12]} radius={0.08} smoothness={3} castShadow>
        <meshStandardMaterial color={active ? P.amberWash : HARDWARE.ivoryShade} roughness={0.4} metalness={0.1} />
        <Edges color={active ? P.amber : HARDWARE.steel} lineWidth={active ? 1.5 : 0.65} transparent opacity={0.8} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[-0.05, 0.52, 0]} args={[0.8, 0.08, 0.7]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color={active ? HARDWARE.graphite : HARDWARE.steelDark} roughness={0.3} metalness={0.24} />
      </RoundedBox>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-1.28 + i * 0.32, 0.16, 0.86]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.14, 0.22, 0.025]} />
          <meshStandardMaterial color={active ? HARDWARE.brass : HARDWARE.steelDark} roughness={0.25} metalness={0.72} />
        </mesh>
      ))}
      <Trace points={[[-1.45, 0.14, -0.62], [-0.6, 0.14, -0.62], [0.05, 0.14, -0.22], [0.75, 0.14, -0.22]]} color={P.teal} active={active} />
      <Trace points={[[-1.24, 0.14, 0.36], [-0.6, 0.14, 0.36], [0.65, 0.14, 0.36]]} color={P.violet} active={active} />
      <Port position={[-1.65, 0.35, 0.35]} active={phase === "load"} />
      <Port position={[1.65, 0.42, 0.34]} active={active} color={P.violet} />
      <PacketTray position={[-0.7, 0.67, -0.68]} tone="weights" count={2} />
      <PacketTray position={[0.72, 0.67, 0.66]} tone="kv" count={2} />
    </group>
  );
}

function SoCLabelled({ phase }: { phase: Phase }) {
  return (
    <group position={[2.7, 0.06, 0]}>
      <RoundedBox args={[1.36, 0.26, 1.3]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={phase === "load" ? HARDWARE.ivoryShade : HARDWARE.ivory} roughness={0.3} metalness={0.16} />
        <Edges color={phase === "load" ? HARDWARE.steel : HARDWARE.brassLight} lineWidth={phase === "load" ? 0.8 : 1.8} transparent opacity={0.88} depthWrite={false} />
      </RoundedBox>
      <RoundedBox position={[-0.34, 0.18, 0]} args={[0.48, 0.08, 0.72]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color={P.tealDeep} roughness={0.32} metalness={0.18} />
      </RoundedBox>
      <RoundedBox position={[0.34, 0.18, 0]} args={[0.48, 0.08, 0.72]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color={P.amberDeep} roughness={0.32} metalness={0.18} />
      </RoundedBox>
      <Trace points={[[-0.58, 0.16, -0.45], [0, 0.16, -0.45], [0.58, 0.16, 0.45]]} color={P.violet} active={phase !== "load"} />
      <Port position={[-0.74, 0.38, 0.34]} active={phase !== "load"} color={P.violet} />
    </group>
  );
}

function RouteRail({ route }: { route: Route }) {
  const color = PACKET_COLOR[route.kind];
  const start = route.points[0];
  const end = route.points[route.points.length - 1];
  return (
    <group>
      <Line points={route.points} color={color} lineWidth={2.1} transparent opacity={0.52} depthWrite={false} />
      <Arrow from={route.points[route.points.length - 2]} to={end} color={color} width={1.5} head={0.11} />
      <mesh position={start}>
        <cylinderGeometry args={[0.065, 0.065, 0.07, 14]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.64} />
      </mesh>
      <mesh position={end}>
        <cylinderGeometry args={[0.065, 0.065, 0.07, 14]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.64} />
      </mesh>
    </group>
  );
}

function MovingPacket({ route, resetKey, index }: { route: Route; resetKey: number; index: number }) {
  const ref = useRef<Group | null>(null);
  const progress = useRef(index / Math.max(1, route.packets));
  const point = useRef(new Vector3());
  const curve = useMemo(() => new CatmullRomCurve3(route.points.map((entry) => new Vector3(...entry)), false, "catmullrom", 0.35), [route]);
  const { still } = useStage();
  const color = PACKET_COLOR[route.kind];

  useFrame((_, dt) => {
    if (!ref.current) return;
    if (!still) progress.current = (progress.current + dt * (route.kind === "tokens" ? 0.3 : 0.23)) % 1;
    curve.getPointAt(progress.current, point.current);
    ref.current.position.copy(point.current);
    ref.current.rotation.y += still ? 0 : dt * 1.8;
  });

  // Changing the cycle restarts the packet without creating a second clock.
  useEffect(() => {
    progress.current = index / Math.max(1, route.packets);
  }, [resetKey, index, route.packets]);

  return (
    <group ref={ref}>
      <RoundedBox args={[route.kind === "tokens" ? 0.22 : 0.34, 0.14, route.kind === "tokens" ? 0.18 : 0.24]} radius={0.025} smoothness={2} castShadow>
        <meshStandardMaterial color={color} roughness={0.34} metalness={0.14} envMapIntensity={0.88} />
      </RoundedBox>
      <mesh position={[0, 0.08, 0.08]}>
        <boxGeometry args={[route.kind === "tokens" ? 0.11 : 0.18, 0.025, 0.025]} />
        <meshBasicMaterial color={P.paper} />
      </mesh>
    </group>
  );
}

function nvidiaRoutes(phase: Phase): Route[] {
  if (phase === "load") {
    return [
      { id: "nvidia-ssd-ram", points: [[-3, 0.08, 0.36], [-2.7, 0.5, 0.36], [-2.58, 0.42, 0.36]], kind: "weights", packets: 1 },
      { id: "nvidia-ram-pcie", points: [[-0.84, 0.42, 0.36], [-0.78, 0.62, 0.36], [-0.72, 0.42, 0.36]], kind: "weights", packets: 1 },
      { id: "nvidia-pcie-vram", points: [[0.46, 0.42, 0.36], [0.9, 0.68, 0.36], [1.38, 0.42, 0.36]], kind: "weights", packets: 1 },
    ];
  }
  if (phase === "prefill") {
    return [
      { id: "nvidia-token-batch", points: [[0.4, 0.46, 0.36], [1.15, 0.76, 0.36], [2.45, 0.5, 0.36]], kind: "tokens", packets: 3 },
      { id: "nvidia-weights-read", points: [[3.02, 0.72, 0.44], [2.8, 0.82, 0.36], [2.45, 0.5, 0.36]], kind: "weights", packets: 2 },
      { id: "nvidia-kv-write", points: [[2.45, 0.5, 0.36], [2.9, 0.82, 0.36], [3.02, 0.72, 0.44]], kind: "kv", packets: 2 },
    ];
  }
  return [
    { id: "nvidia-decode-token", points: [[0.4, 0.46, 0.36], [1.2, 0.78, 0.36], [2.45, 0.5, 0.36]], kind: "tokens", packets: 1 },
    { id: "nvidia-decode-weights", points: [[3.02, 0.72, 0.44], [2.8, 0.82, 0.36], [2.45, 0.5, 0.36]], kind: "weights", packets: 1 },
    { id: "nvidia-decode-kv-read", points: [[3.08, 0.62, -0.35], [2.75, 0.7, -0.12], [2.45, 0.5, 0.36]], kind: "kv", packets: 1 },
    { id: "nvidia-decode-kv-write", points: [[2.45, 0.5, 0.36], [2.82, 0.66, -0.14], [3.08, 0.62, -0.35]], kind: "kvOut", packets: 1 },
  ];
}

function appleRoutes(phase: Phase): Route[] {
  if (phase === "load") {
    return [{ id: "apple-ssd-pool", points: [[-3, 0.08, 0.36], [-1.75, 0.58, 0.36], [-0.96, 0.4, 0.36]], kind: "weights", packets: 1 }];
  }
  if (phase === "prefill") {
    return [
      { id: "apple-token-batch", points: [[0.9, 0.5, 0.34], [1.65, 0.8, 0.34], [2.55, 0.46, 0.34]], kind: "tokens", packets: 3 },
      { id: "apple-weights-read", points: [[-0.2, 0.82, -0.34], [1.25, 0.76, -0.22], [2.55, 0.46, 0.34]], kind: "weights", packets: 2 },
      { id: "apple-kv-write", points: [[2.55, 0.46, 0.34], [1.4, 0.52, 0.5], [0.75, 0.66, 0.58]], kind: "kv", packets: 2 },
    ];
  }
  return [
    { id: "apple-decode-token", points: [[0.9, 0.5, 0.34], [1.72, 0.82, 0.34], [2.55, 0.46, 0.34]], kind: "tokens", packets: 1 },
    { id: "apple-decode-weights", points: [[-0.2, 0.82, -0.34], [1.25, 0.76, -0.22], [2.55, 0.46, 0.34]], kind: "weights", packets: 1 },
    { id: "apple-decode-kv-read", points: [[0.72, 0.66, 0.58], [1.5, 0.66, 0.44], [2.55, 0.46, 0.34]], kind: "kv", packets: 1 },
    { id: "apple-decode-kv-write", points: [[2.55, 0.46, 0.34], [1.45, 0.54, 0.5], [0.72, 0.66, 0.58]], kind: "kvOut", packets: 1 },
  ];
}

function NvidiaMachine({ phase }: { phase: Phase }) {
  return (
    <group>
      <SsdDrive active={phase === "load"} />
      <HostRig active={phase === "load"} />
      <PcieBridge active={phase === "load"} />
      <GpuRig phase={phase} />
      <PacketTray position={[-3.62, 0.48, 0.48]} tone="weights" count={2} />
      <HardwareLabel position={[-3.62, 1.16, 0.42]} tone="amber">SSD</HardwareLabel>
      <HardwareLabel position={[-1.72, 1.3, 0.42]} tone="teal">CPU + RAM</HardwareLabel>
      <HardwareLabel position={[-0.15, 1.16, 0.42]} tone="ink"><span className="normal-case">PCIe</span></HardwareLabel>
      <HardwareLabel position={[2.45, 1.4, 0.42]} tone="violet">GPU + VRAM</HardwareLabel>
    </group>
  );
}

function AppleMachine({ phase }: { phase: Phase }) {
  return (
    <group>
      <SsdDrive active={phase === "load"} />
      <SharedPool phase={phase} />
      <SoCLabelled phase={phase} />
      <HardwareLabel position={[-3.62, 1.16, 0.42]} tone="amber">SSD</HardwareLabel>
      <HardwareLabel position={[0.72, 1.42, 0.42]} tone="teal"><span className="normal-case">memoria compartida</span></HardwareLabel>
      <HardwareLabel position={[2.7, 1.35, 0.42]} tone="violet">SoC CPU + GPU</HardwareLabel>
    </group>
  );
}

function InferenceScene({ platform, phase, cycle }: { platform: Platform; phase: Phase; cycle: number }) {
  const routes = useMemo(() => platform === "nvidia" ? nvidiaRoutes(phase) : appleRoutes(phase), [platform, phase]);
  return (
    <PointerTilt amount={0.045}>
      <group>
        <Bench />
        {platform === "nvidia" ? <NvidiaMachine phase={phase} /> : <AppleMachine phase={phase} />}
        {routes.map((route) => (
          <group key={route.id}>
            <RouteRail route={route} />
            {Array.from({ length: route.packets }, (_, index) => <MovingPacket key={route.id + "-" + index} route={route} resetKey={cycle} index={index} />)}
          </group>
        ))}
      </group>
    </PointerTilt>
  );
}

function PhaseControls({ phase, onPhase, onRepeat }: { phase: Phase; onPhase: (phase: Phase) => void; onRepeat: () => void }) {
  const index = PHASES.indexOf(phase);
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Control de fases de inferencia">
      <button type="button" className="chip px-2" disabled={index === 0} aria-label="Fase anterior" onClick={() => onPhase(PHASES[Math.max(0, index - 1)])}>← Anterior</button>
      <button type="button" className="chip px-2" onClick={onRepeat} aria-label="Repetir fase actual">Repetir fase</button>
      <button type="button" className="chip px-2" disabled={index === PHASES.length - 1} aria-label="Fase siguiente" onClick={() => onPhase(PHASES[Math.min(PHASES.length - 1, index + 1)])}>Siguiente →</button>
    </div>
  );
}

function phaseDescription(platform: Platform, phase: Phase) {
  if (phase === "load") {
    return platform === "nvidia"
      ? "El archivo de pesos sale del SSD, pasa a la RAM del equipo y cruza PCIe antes de quedar en la VRAM."
      : "El archivo de pesos sale del SSD y se escribe en la memoria compartida que usan CPU y GPU; no aparece una copia RAM→VRAM por PCIe.";
  }
  if (phase === "prefill") return "Entra un lote de tokens, se consultan los pesos y se genera una entrada KV para cada token del lote.";
  return "Entra un solo token, se leen los pesos y la KV existente, se produce la salida y se añade únicamente el nuevo KV de ese token.";
}

function InferenceNote({ platform, phase }: { platform: Platform; phase: Phase }) {
  const nvidia = platform === "nvidia";
  const rows = nvidia
    ? [
      ["Cargar", "SSD y archivo de pesos", "RAM del equipo → VRAM cruzando PCIe"],
      ["Prefill", "pesos en VRAM + lote de tokens", "KV de cada token en VRAM"],
      ["Decode", "pesos + KV existente + 1 token", "salida + nuevo KV"],
    ]
    : [
      ["Cargar", "SSD y archivo de pesos", "memoria compartida CPU/GPU"],
      ["Prefill", "pesos + lote de tokens en la memoria compartida", "KV de cada token en la memoria compartida"],
      ["Decode", "pesos + KV existente + 1 token", "salida + nuevo KV en la memoria compartida"],
    ];
  return (
    <div className="space-y-3">
      <p aria-live="polite"><strong>{PHASE_LABEL[phase]}.</strong> {phaseDescription(platform, phase)}</p>
      <Readout items={[
        { label: "plataforma", value: nvidia ? "NVIDIA discreta" : "Apple unificada", tone: nvidia ? P.teal : P.amber },
        { label: "fase", value: PHASE_LABEL[phase], tone: P.violet },
        { label: "ruta", value: phase === "load" ? (nvidia ? "SSD → RAM → PCIe → VRAM" : "SSD → memoria compartida") : (nvidia ? "GPU ↔ VRAM" : "GPU ↔ memoria compartida"), tone: P.ink },
      ]} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
          <caption className="mb-1 text-left font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">Lectura y escritura por fase</caption>
          <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">fase</th><th className="border-b border-line px-2 py-1">se lee</th><th className="border-b border-line px-2 py-1">se escribe</th></tr></thead>
          <tbody>{rows.map(([name, read, write]) => { const current = name === PHASE_LABEL[phase]; return <tr key={name} className={current ? "bg-teal-wash/60" : undefined}><td className="border-b border-line/60 px-2 py-1 font-mono">{name}</td><td className="border-b border-line/60 px-2 py-1">{read}</td><td className="border-b border-line/60 px-2 py-1">{write}</td></tr>; })}</tbody>
        </table>
      </div>
      <p className="text-xs text-muted">La velocidad de los paquetes solo ordena la explicación: es una animación didáctica, no un benchmark ni una promesa de latencia. La ruta Apple muestra memoria compartida; no afirma que todo el sistema haga siempre una sola copia física.</p>
      <p className="text-xs text-muted">La bancada es un mapa topológico didáctico, no la disposición física real de cada equipo. En Apple, CPU y GPU son bloques del mismo SoC; los encapsulados de memoria se representan aparte para explicar el acceso compartido.</p>
    </div>
  );
}

export default function Visual5() {
  const [platform, setPlatform] = useState<Platform>("nvidia");
  const [phase, setPhase] = useState<Phase>("load");
  const [cycle, setCycle] = useState(0);
  const changePhase = (next: Phase) => {
    setPhase(next);
    setCycle((value) => value + 1);
  };
  const changePlatform = (next: Platform) => {
    setPlatform(next);
    setCycle((value) => value + 1);
  };
  return (
    <Figure
      label="Recorrido de inferencia · memoria y rutas"
      hint="cargar · prefill · decode · una ruta causal"
      height="h-[540px]"
      legend={[{ color: P.amber, label: "pesos / archivo" }, { color: P.teal, label: "tokens" }, { color: P.violet, label: "KV" }, { color: P.rose, label: "KV nuevo" }]}
      note={<InferenceNote platform={platform} phase={phase} />}
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Switcher
            value={platform}
            onChange={changePlatform}
            options={[{ value: "nvidia", label: "NVIDIA discreta", tone: P.teal }, { value: "apple", label: "Apple unificada", tone: P.amber }]}
            ariaLabel="Plataforma de memoria"
          />
          <Switcher
            value={phase}
            onChange={changePhase}
            options={[{ value: "load", label: "Cargar", tone: P.amber }, { value: "prefill", label: "Prefill", tone: P.teal }, { value: "decode", label: "Decode", tone: P.violet }]}
            ariaLabel="Fase de inferencia"
          />
          <PhaseControls phase={phase} onPhase={changePhase} onRepeat={() => setCycle((value) => value + 1)} />
        </div>
      }
    >
      <Stage className="h-full w-full" maxDpr={1.8} camera={{ position: [5.8, 4.4, 9.2], fov: 34 }} background={P.paper} fit={1.07}>
        <InferenceScene platform={platform} phase={phase} cycle={cycle} />
      </Stage>
    </Figure>
  );
}

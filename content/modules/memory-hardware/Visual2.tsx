"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Knob, Readout } from "@/components/three/Figure";
import { ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "memory" | "routes" | "cost";
const COPY = {
  en: { title: "memory has three tenants", hint: "weights · KV cache · runtime", memory: "tenants", routes: "topology", cost: "bandwidth", weights: "weights", kv: "KV cache", runtime: "runtime", vram: "VRAM", unified: "unified", ram: "RAM", context: "context", fixed: "fixed", grows: "grows" },
  es: { title: "la memoria tiene tres inquilinos", hint: "pesos · caché KV · runtime", memory: "inquilinos", routes: "topología", cost: "ancho banda", weights: "pesos", kv: "caché KV", runtime: "runtime", vram: "VRAM", unified: "unificada", ram: "RAM", context: "contexto", fixed: "fijo", grows: "crece" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("memory");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.weights }, { color: P.violet, label: t.kv }, { color: P.amber, label: t.runtime }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "memory", label: t.memory, tone: P.teal }, { value: "routes", label: t.routes, tone: P.violet }, { value: "cost", label: t.cost, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "memory" && <>{[[t.weights, P.teal, -1.7], [t.kv, P.violet, 0], [t.runtime, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag><Tag position={[x as number, 0.05, 0.15]} tone="muted" size="xs">{i === 0 ? t.fixed : i === 1 ? t.grows : "overhead"}</Tag></group>)}</>}
        {mode === "routes" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.vram}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.unified}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">PCIe copy ↔ pool compartido</Tag></>}
        {mode === "cost" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.context}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.rose} radius={0.05} opacity={0.9} /><Node3D position={[1.7, 0.2, 0]} color={P.rose} radius={0.2} pulse={0.4} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">bandwidth</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">decode relee pesos por token</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Tres inquilinos de la memoria: pesos (fijos), caché KV (crece con el
   contexto y con cada usuario concurrente) y reserva del runtime. Modelo
   didáctico de un 8B denso con GQA: 32 capas × 8 cabezas KV × 128 dim ×
   2 (K y V) × 2 bytes = 131 072 B por token. GB decimales. */

type Device = "gpu24" | "mac32" | "mac64";
const DEVICES: Record<Device, { label: string; total: number; system: number; runtime: number; kind: string }> = {
  gpu24: { label: "GPU 24 GB", total: 24, system: 0, runtime: 2, kind: "VRAM dedicada" },
  mac32: { label: "Mac 32 GB", total: 32, system: 8, runtime: 2, kind: "memoria unificada" },
  mac64: { label: "Mac 64 GB", total: 64, system: 10, runtime: 2, kind: "memoria unificada" },
};
const PARAMS = 8e9;
const KV_BYTES_PER_TOKEN = 32 * 8 * 128 * 2 * 2;
const BITS = [4, 8, 16] as const;
const CONTEXTS = [4096, 8192, 16384, 32768, 65536, 131072];

function budget(device: Device, bits: number, ctxIndex: number, users: number, runtime: number) {
  const d = { ...DEVICES[device], runtime };
  const weights = (PARAMS * bits) / 8 / 1e9;
  const context = CONTEXTS[ctxIndex];
  const kvPerUser = (KV_BYTES_PER_TOKEN * context) / 1e9;
  const kv = kvPerUser * users;
  const used = weights + kv + d.runtime + d.system;
  return { d, weights, context, kvPerUser, kv, used, free: d.total - used, fits: used <= d.total };
}

const fmt1 = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const fmtK = (tokens: number) => `${Math.round(tokens / 1024)}k`;

const H = {
  base: "#2C3533",
  baseTop: "#3B4744",
  glass: "#DDE6E3",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};
const GB_H = 0.1; // altura de escena por GB
const TANK_W = 1.6;
const TANK_D = 1.25;

function Plinth({ width }: { width: number }) {
  return (
    <group>
      <ShadowBlob position={[0, -0.3, 0]} scale={width + 1.5} opacity={0.12} />
      <RoundedBox args={[width, 0.3, 3.2]} position={[0, -0.13, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={H.base} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[width - 0.35, 0.06, 2.85]} position={[0, 0.05, 0]} radius={0.03} smoothness={3} receiveShadow>
        <meshStandardMaterial color={H.baseTop} roughness={0.45} metalness={0.22} />
      </RoundedBox>
    </group>
  );
}

type Layer = { key: string; gb: number; color: string; label?: string; tone?: "teal" | "violet" | "amber" | "muted" };

function stackLayers(layers: Layer[]) {
  const placed: (Layer & { h: number; y: number; top: number })[] = [];
  let y = 0.12;
  for (const layer of layers) {
    const h = Math.max(0.02, layer.gb * GB_H);
    placed.push({ ...layer, h, y: y + h / 2, top: y + h });
    y += h + 0.008;
  }
  return { placed, top: y };
}

function MemoryTank({ total, layers, position }: { total: number; layers: Layer[]; position: V3 }) {
  const height = total * GB_H;
  const { placed, top } = stackLayers(layers);
  const overflow = Math.max(0, top - 0.12 - height);
  return (
    <group position={position}>
      {/* zócalo */}
      <RoundedBox args={[TANK_W + 0.4, 0.14, TANK_D + 0.4]} position={[0, 0.07, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={H.charcoal} roughness={0.4} metalness={0.35} />
      </RoundedBox>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}:${sz}`} position={[sx * (TANK_W / 2 + 0.1), 0.15, sz * (TANK_D / 2 + 0.1)]}>
          <cylinderGeometry args={[0.045, 0.045, 0.04, 12]} />
          <meshStandardMaterial color={H.brass} roughness={0.3} metalness={0.8} />
        </mesh>
      )))}
      {/* contenido: una losa por inquilino */}
      {placed.map((layer) => {
        const over = layer.top - 0.12 > height + 0.001;
        return (
          <RoundedBox key={layer.key} args={[TANK_W - 0.12, layer.h, TANK_D - 0.12]} position={[0, layer.y, 0]} radius={Math.min(0.03, layer.h / 2.2)} smoothness={2} castShadow receiveShadow>
            <meshPhysicalMaterial color={over ? mixHex(layer.color, P.rose, 0.55) : layer.color} roughness={0.42} clearcoat={0.45} transparent={over} opacity={over ? 0.75 : 1} />
          </RoundedBox>
        );
      })}
      {/* cristal y aristas de capacidad */}
      <mesh position={[0, 0.12 + height / 2, 0]}>
        <boxGeometry args={[TANK_W, height, TANK_D]} />
        <meshPhysicalMaterial color={H.glass} roughness={0.08} transmission={0.6} thickness={0.2} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`p${sx}:${sz}`} position={[sx * TANK_W / 2, 0.12 + height / 2, sz * TANK_D / 2]} castShadow>
          <boxGeometry args={[0.05, height, 0.05]} />
          <meshStandardMaterial color={H.steel} roughness={0.3} metalness={0.8} />
        </mesh>
      )))}
      {/* borde de capacidad: marco, no tapa */}
      {[[0, TANK_D / 2, TANK_W + 0.08, 0.06], [0, -TANK_D / 2, TANK_W + 0.08, 0.06], [TANK_W / 2, 0, 0.06, TANK_D + 0.08], [-TANK_W / 2, 0, 0.06, TANK_D + 0.08]].map(([x, z, w, d]) => (
        <mesh key={`r${x}:${z}`} position={[x, 0.12 + height, z]} castShadow>
          <boxGeometry args={[w, 0.05, d]} />
          <meshStandardMaterial color={H.brass} roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
      {/* graduación cada 4 GB en la cara frontal */}
      {Array.from({ length: Math.floor(total / 4) + 1 }, (_, i) => (
        <mesh key={i} position={[TANK_W / 2 + 0.03, 0.12 + i * 4 * GB_H, TANK_D / 2 + 0.03]}>
          <boxGeometry args={[i % 2 === 0 ? 0.22 : 0.12, 0.012, 0.012]} />
          <meshStandardMaterial color={H.charcoal} />
        </mesh>
      ))}
      {overflow > 0 ? (
        <mesh position={[0, 0.12 + height + overflow / 2, 0]}>
          <boxGeometry args={[TANK_W + 0.1, overflow, TANK_D + 0.1]} />
          <meshBasicMaterial color={P.rose} transparent opacity={0.12} depthWrite={false} />
        </mesh>
      ) : null}
      {placed.filter((l) => l.label).map((layer, i) => (
        <Tag key={`t${layer.key}`} position={[(i % 2 ? 1 : -1) * (TANK_W / 2 + 0.75), layer.y, TANK_D / 2]} tone={layer.tone ?? "muted"} size="xs" center>{layer.label}</Tag>
      ))}
    </group>
  );
}

function TenantScene({ device, bits, ctxIndex, users, runtime }: { device: Device; bits: number; ctxIndex: number; users: number; runtime: number }) {
  const b = budget(device, bits, ctxIndex, users, runtime);
  const layers: Layer[] = [
    ...(b.d.system > 0 ? [{ key: "sys", gb: b.d.system, color: mixHex(P.paper, P.ink, 0.28), label: "sistema", tone: "muted" as const }] : []),
    { key: "rt", gb: b.d.runtime, color: P.amber, label: "runtime", tone: "amber" },
    { key: "w", gb: b.weights, color: P.teal, label: `pesos ${bits} bits`, tone: "teal" },
    ...Array.from({ length: users }, (_, i) => ({ key: `kv${i}`, gb: b.kvPerUser, color: i % 2 ? mixHex(P.violet, P.paper, 0.25) : P.violet, label: i === 0 ? (users > 1 ? `KV × ${users}` : "caché KV") : undefined, tone: "violet" as const })),
  ];
  const height = b.d.total * GB_H;
  return (
    <PointerTilt amount={0.05}>
      <group>
        <Plinth width={6.6} />
        <MemoryTank total={b.d.total} layers={layers} position={[0.4, 0.08, 0]} />
        <Tag position={[0.4, 0.3 + Math.max(height, b.used * GB_H) + 0.28, 0]} tone={b.fits ? "teal" : "rose"} center>
          {b.fits ? `${fmt1(b.free)} GB libres` : `faltan ${fmt1(-b.free)} GB`}
        </Tag>
        <Tag position={[0.4 + TANK_W / 2 + 0.55, 0.2 + height, -0.3]} tone="muted" size="xs" center>{`${b.d.total} GB`}</Tag>
        {/* regla de contexto: una marca por cada 4k tokens de un usuario */}
        <group position={[2.6, 0.12, -0.2]}>
          <RoundedBox args={[0.5, 0.08, 1.9]} radius={0.03} smoothness={2} castShadow receiveShadow>
            <meshStandardMaterial color={H.charcoal} roughness={0.4} metalness={0.3} />
          </RoundedBox>
          {Array.from({ length: CONTEXTS.length }, (_, i) => (
            <mesh key={i} position={[0, 0.08 + (i <= ctxIndex ? 0.04 : 0), -0.8 + i * 0.32]} castShadow>
              <boxGeometry args={[0.3, i <= ctxIndex ? 0.1 : 0.03, 0.2]} />
              <meshStandardMaterial color={i <= ctxIndex ? P.violet : H.steel} roughness={0.4} metalness={0.3} />
            </mesh>
          ))}
          <Tag position={[0, 0.45, 0.2]} tone="violet" size="xs" center>{`contexto ${fmtK(b.context)}`}</Tag>
        </group>
      </group>
    </PointerTilt>
  );
}

type Trap = "kv" | "runtime" | "unified";
const TRAPS: Record<Trap, { device: Device; bits: number; ctx: number; users: number; runtime: number }> = {
  kv: { device: "gpu24", bits: 4, ctx: 4, users: 2, runtime: 2 },
  runtime: { device: "gpu24", bits: 16, ctx: 3, users: 1, runtime: 3 },
  unified: { device: "mac32", bits: 8, ctx: 3, users: 1, runtime: 2 },
};

const TRAP_TEXT: Record<Trap, string> = {
  kv: "Trampa 1: los pesos caben, la KV no. Un 8B a 4 bits ocupa 4 GB; a 64k de contexto la KV de un usuario ya son 8,6 GB. Dos usuarios concurrentes la duplican. Sube a 3 usuarios y el depósito rebosa.",
  runtime: "Trampa 2: la VRAM parece libre, pero el runtime reserva 1–3 GB para sí (contexto CUDA, activaciones del prefill, fragmentación). Aquí se reservan 3 GB y el margen se queda en nada.",
  unified: "Trampa 3: memoria instalada no es memoria para el modelo. En un Mac de 32 GB, el sistema y las aplicaciones comparten el mismo presupuesto con la GPU. La reserva del sistema es ilustrativa: mídela en tu sesión.",
};

function TenantNote({ trap, device, bits, ctxIndex, users, runtime }: { trap: Trap; device: Device; bits: number; ctxIndex: number; users: number; runtime: number }) {
  const b = budget(device, bits, ctxIndex, users, runtime);
  return (
    <div className="space-y-3">
      <p><strong>{TRAP_TEXT[trap].split(":")[0]}.</strong>{TRAP_TEXT[trap].slice(TRAP_TEXT[trap].indexOf(":") + 1)}</p>
      <Readout items={[
        { label: "pesos", value: `${fmt1(b.weights)} GB`, tone: "var(--teal)" },
        { label: "KV total", value: `${fmt1(b.kv)} GB`, tone: "var(--violet)" },
        { label: "runtime + sistema", value: `${fmt1(b.d.runtime + b.d.system)} GB`, tone: "var(--amber)" },
        { label: b.fits ? "libre" : "exceso", value: `${fmt1(Math.abs(b.free))} GB`, tone: b.fits ? "var(--teal)" : "var(--rose)" },
      ]} />
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        pesos = 8·10⁹ × {bits}/8 B = {fmt1(b.weights)} GB · KV/usuario = 32 capas × 8 cabezas KV × 128 × 2 (K, V) × 2 B = 131 072 B/token × {b.context.toLocaleString("es-ES")} = {fmt1(b.kvPerUser)} GB · total = {fmt1(b.used)} de {b.d.total} GB ({b.d.kind})
      </p>
      <p className="text-xs text-muted">Regla práctica, no medición: GB decimales; pesos ideales sin metadatos (un Q4_K_M real pesa algo más); KV en FP16 sin cuantizar. La lección redondea la KV a 64k en 8 GB. Mide la memoria residente a 4k y a tu contexto objetivo: el delta es tu KV.</p>
    </div>
  );
}

function SpanishVisual() {
  const [trap, setTrap] = useState<Trap>("kv");
  const [device, setDevice] = useState<Device>(TRAPS.kv.device);
  const [bits, setBits] = useState(TRAPS.kv.bits);
  const [ctxIndex, setCtxIndex] = useState(TRAPS.kv.ctx);
  const [users, setUsers] = useState(TRAPS.kv.users);
  const [runtime, setRuntime] = useState(TRAPS.kv.runtime);
  const choose = (next: Trap) => {
    const preset = TRAPS[next];
    setTrap(next); setDevice(preset.device); setBits(preset.bits); setCtxIndex(preset.ctx); setUsers(preset.users); setRuntime(preset.runtime);
  };
  return (
    <Figure
      label="La memoria tiene tres inquilinos"
      hint="pesos fijos · KV que crece · reserva del runtime"
      height="h-[460px] md:h-[560px]"
      legend={[
        { color: P.teal, label: "pesos" },
        { color: P.violet, label: "caché KV por usuario" },
        { color: P.amber, label: "runtime" },
        { color: P.rose, label: "exceso" },
      ]}
      note={<TenantNote trap={trap} device={device} bits={bits} ctxIndex={ctxIndex} users={users} runtime={runtime} />}
      controls={
        <>
          <Switcher value={trap} onChange={choose} ariaLabel="Trampa" options={[
            { value: "kv", label: "Trampa 1 · KV", tone: P.violet },
            { value: "runtime", label: "Trampa 2 · runtime", tone: P.amber },
            { value: "unified", label: "Trampa 3 · unificada", tone: P.teal },
          ]} />
          <Switcher value={device} onChange={setDevice} ariaLabel="Equipo" options={(Object.keys(DEVICES) as Device[]).map((d) => ({ value: d, label: DEVICES[d].label, tone: P.inkSoft }))} />
          <Switcher value={String(bits)} onChange={(v) => setBits(Number(v))} ariaLabel="Precisión de los pesos" options={BITS.map((b) => ({ value: String(b), label: `${b} bits`, tone: P.teal }))} />
          <Knob label="contexto" value={ctxIndex} min={0} max={CONTEXTS.length - 1} onChange={setCtxIndex} format={(i) => fmtK(CONTEXTS[i])} tone="var(--violet)" />
          <Knob label="usuarios" value={users} min={1} max={4} onChange={setUsers} tone="var(--violet)" />
          <Knob label="runtime" value={runtime} min={1} max={3} onChange={setRuntime} format={(v) => `${v} GB`} tone="var(--amber)" />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [4.5, 4.2, 8.5], fov: 34 }} fit={1.1}>
        <TenantScene device={device} bits={bits} ctxIndex={ctxIndex} users={users} runtime={runtime} />
      </Stage>
    </Figure>
  );
}

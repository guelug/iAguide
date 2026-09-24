"use client";
import { Edges, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { PointerTilt, ShadowBlob } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "path" | "qlora" | "mix" | "export";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "path": "path",
      "mix": "mix",
      "export": "export",
      "vram_cost": "VRAM / cost",
      "full_ft_4x": "Full FT 4x",
      "adapters": "adapters",
      "gguf_q4": "GGUF q4"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "path": "ruta",
      "mix": "mezcla",
      "export": "exporta",
      "vram_cost": "VRAM / coste",
      "full_ft_4x": "FT completo 4x",
      "adapters": "adaptadores",
      "gguf_q4": "GGUF q4"
    },
  });

  const OPTIONS = [
    { value: "path" as const, label: t.path, tone: "var(--teal)" },
    { value: "qlora" as const, label: "qlora", tone: "var(--amber)" },
    { value: "mix" as const, label: t.mix, tone: "var(--violet)" },
    { value: "export" as const, label: t.export, tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("path");

  return (
    <Figure
      label="Fine-tune Qwen3.8"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: "path / artefact" },
        { color: P.amber, label: t.vram_cost },
        { color: P.violet, label: "reasoning mix" },
      ]}
      controls={
        <Switcher
          ariaLabel="qwen3.8 fine-tune diagram steps"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.4], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} t={t} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active, t }: { active: Step; t: Record<string, string> }) {
  return (
    <group>
      {active === "path" ? <PathScene /> : null}
      {active === "qlora" ? <QloraScene t={t} /> : null}
      {active === "mix" ? <MixScene /> : null}
      {active === "export" ? <ExportScene t={t} /> : null}
    </group>
  );
}

function PathScene() {
  return (
    <group>
      <Wire points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.7, 1.35, 0]} tone="teal" center>
        Studio
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="teal" center>
        Train tab
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="amber" center>
        Kaggle
      </Tag>
      <Slab position={[1.2, -0.05, 0.18]} size={[0.72, 0.42, 0.1]} color={P.amber} fill={0.45} />
      <Slab position={[2.2, -0.05, 0.18]} size={[0.72, 0.42, 0.1]} color={P.amber} fill={0.45} />
      <Tag position={[1.7, -0.95, 0]} tone="amber" center>
        2x T4 free
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.teal} radius={0.14} pulse={0.35} />
    </group>
  );
}

function QloraScene({ t }: { t: Record<string, string> }) {
  const bars = [
    { x: -2.1, h: 0.85, label: "QLoRA 24G", color: P.teal, tone: "teal" as const, fill: 0.55 },
    { x: 0.0, h: 1.35, label: "LoRA >36G", color: P.amber, tone: "amber" as const, fill: 0.5 },
    { x: 2.1, h: 1.95, label: t.full_ft_4x, color: P.violet, tone: "violet" as const, fill: 0.42 },
  ];
  return (
    <group>
      <Wire points={[[-2.8, -0.95, 0], [2.8, -0.95, 0]]} color={P.line} opacity={0.45} />
      {bars.map((b) => (
        <group key={b.label}>
          <Slab
            position={[b.x, -0.95 + b.h / 2, 0]}
            size={[1.5, b.h, 0.14]}
            color={b.color}
            fill={b.fill}
          />
          <Tag position={[b.x, -0.95 + b.h + 0.38, 0]} tone={b.tone} center>
            {b.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}

function MixScene() {
  return (
    <group>
      <Wire points={[[-2.6, -0.55, 0], [2.6, -0.55, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.6, -0.55, 0], [2.6, -0.55, 0]]} color={P.violet} count={3} speed={0.28} />
      {[0, 1, 2].map((i) => (
        <Slab
          key={`r-${i}`}
          position={[-1.55 + i * 1.05, 0.45, 0]}
          size={[0.9, 1.35, 0.12]}
          color={P.violet}
          fill={0.5}
        />
      ))}
      <Slab position={[1.85, 0.1, 0]} size={[0.9, 0.65, 0.12]} color={P.amber} fill={0.5} />
      <Tag position={[-0.5, 1.4, 0]} tone="violet" center>
        75% reasoning
      </Tag>
      <Tag position={[1.85, 0.7, 0]} tone="amber" center>
        25% direct
      </Tag>
      <Tag position={[0, -1.15, 0]} tone="violet" center>
        keep thinking
      </Tag>
      <Node3D position={[0, -0.55, 0]} color={P.violet} radius={0.12} pulse={0.3} />
    </group>
  );
}

function ExportScene({ t }: { t: Record<string, string> }) {
  const items: { x: number; label: string; tone: "teal" | "amber" | "violet"; color: string }[] = [
    { x: -2.15, label: t.adapters, tone: "teal", color: P.teal },
    { x: 0.0, label: t.gguf_q4, tone: "amber", color: P.amber },
    { x: 2.15, label: "vLLM 16b", tone: "violet", color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[0, 1.35, 0]} size={[1.6, 0.55, 0.12]} color={P.lineStrong} fill={0.22} />
      <Tag position={[0, 1.85, 0]} tone="teal" center>
        same template
      </Tag>
      {items.map((it) => (
        <group key={it.label}>
          <Slab position={[it.x, 0.35, 0]} size={[1.55, 0.85, 0.14]} color={it.color} fill={0.52} />
          <Tag position={[it.x, -0.85, 0]} tone={it.tone} center>
            {it.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Cfg = { bits: 4 | 16; vision: boolean; ctx: 2048 | 4096 | 8192; batch: 1 | 2; offload: boolean; gpu: 24 | 48 | 80 };
type Layer = { id: string; label: string; gb: number; color: string };

const PARAMS = 27e9;
/* Didactic coefficients, chosen to reproduce the page's thresholds (QLoRA
   fits 24 GB, LoRA 16-bit needs more than 36 GB). Not a profiler reading. */
const EMBED_GB = (151_936 * 5_120 * 2) / 1e9; // assumed vocab × hidden × BF16
const LORA_GB = 0.6; // rank-16 adapters + AdamW states
const ACT_GB_PER_1K = 0.9; // with "unsloth" gradient checkpointing, batch 1
const VISION_GB = 3.0;
const RESERVE_GB = 1.0;

function vram(c: Cfg) {
  const weights = (PARAMS * (c.bits === 4 ? 4.5 : 16)) / 8 / 1e9; // NF4 incl. scales ≈ 4.5 bits
  const layers: Layer[] = [
    { id: "w", label: c.bits === 4 ? "pesos 4-bit" : "pesos 16-bit", gb: weights, color: P.amber },
    { id: "e", label: "embedding", gb: c.offload ? 0 : EMBED_GB, color: P.violet },
    { id: "l", label: "LoRA + AdamW", gb: LORA_GB, color: P.teal },
    { id: "a", label: "activaciones", gb: (ACT_GB_PER_1K * c.ctx * c.batch) / 1024, color: "#2F7FA8" },
    { id: "v", label: "capas de visión", gb: c.vision ? VISION_GB : 0, color: P.rose },
    { id: "r", label: "reserva", gb: RESERVE_GB, color: "#8B939C" },
  ];
  const total = layers.reduce((a, l) => a + l.gb, 0);
  return { layers: layers.filter((l) => l.gb > 0), total, free: c.gpu - total, oom: total > c.gpu, weights };
}

const gb = (n: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(n);

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className="chip" aria-pressed={on} style={on ? { background: "var(--teal-wash)", borderColor: "var(--teal)" } : undefined} onClick={onClick}>
      {label}
    </button>
  );
}

const CASE: Cfg = { bits: 16, vision: true, ctx: 8192, batch: 1, offload: false, gpu: 24 };

function SpanishVisual() {
  const [c, setC] = useState<Cfg>(CASE);
  const m = useMemo(() => vram(c), [c]);
  const set = (patch: Partial<Cfg>) => setC((prev) => ({ ...prev, ...patch }));
  const note = (
    <div className="space-y-3">
      <p>
        <strong>{m.oom ? `OOM: faltan ${gb(-m.free)} GB.` : `Cabe: sobran ${gb(m.free)} GB.`}</strong>{" "}
        {c.bits === 16 ? `Con LoRA 16-bit solo los pesos ocupan ${gb(m.weights)} GB: la página dice que LoRA necesita más de 36 GB. ` : `QLoRA carga los pesos en 4 bits (${gb(m.weights)} GB): es lo que permite los 24 GB. `}
        Recorre los mandos del caso en orden: 4-bit, visión apagada si el trabajo es texto, contexto 2048, batch 1 y offload del embedding.
      </p>
      <Readout
        items={[
          { label: "total estimado", value: `${gb(m.total)} GB`, tone: m.oom ? "var(--rose)" : "var(--teal)" },
          { label: "GPU", value: `${c.gpu} GB`, tone: "var(--ink)" },
          { label: "contexto × batch", value: `${c.ctx} × ${c.batch}`, tone: "var(--ink)" },
          { label: "embedding", value: c.offload ? "en RAM" : `${gb(EMBED_GB)} GB en VRAM`, tone: "var(--violet)" },
        ]}
      />
      <p className="text-xs text-muted">Presupuesto didáctico: pesos = 27·10⁹ × bits / 8; activaciones ≈ {gb(ACT_GB_PER_1K)} GB por cada 1024 tokens y muestra con checkpointing; embedding supuesto de 151 936 × 5 120 en BF16. Los coeficientes se eligieron para respetar los umbrales de la página (QLoRA en 24 GB, LoRA &gt; 36 GB); mide con tu corrida real.</p>
    </div>
  );
  return (
    <Figure
      label="Qwen3.8-27B · presupuesto de VRAM del ajuste"
      hint="el caso de 24 GB, mando a mando"
      height="h-[460px] md:h-[540px]"
      legend={[
        { color: P.amber, label: "pesos" },
        { color: "#2F7FA8", label: "activaciones" },
        { color: P.rose, label: "visión / exceso" },
        { color: P.violet, label: "embedding" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={String(c.bits) as "4" | "16"} onChange={(v) => set({ bits: v === "4" ? 4 : 16 })} ariaLabel="Precisión" options={[{ value: "16", label: "LoRA 16-bit", tone: P.rose }, { value: "4", label: "QLoRA 4-bit", tone: P.teal }]} />
          <Toggle on={!c.vision} label={c.vision ? "Visión: sí" : "Visión: no"} onClick={() => set({ vision: !c.vision })} />
          <Switcher value={String(c.ctx) as "2048" | "4096" | "8192"} onChange={(v) => set({ ctx: Number(v) as Cfg["ctx"] })} ariaLabel="max_seq_length" options={[{ value: "2048", label: "2048", tone: P.teal }, { value: "4096", label: "4096", tone: P.amber }, { value: "8192", label: "8192", tone: P.rose }]} />
          <Toggle on={c.batch === 1} label={"batch " + c.batch} onClick={() => set({ batch: c.batch === 1 ? 2 : 1 })} />
          <Toggle on={c.offload} label={c.offload ? "offload: sí" : "offload: no"} onClick={() => set({ offload: !c.offload })} />
          <Switcher value={String(c.gpu) as "24" | "48" | "80"} onChange={(v) => set({ gpu: Number(v) as Cfg["gpu"] })} ariaLabel="Memoria de la GPU" options={[{ value: "24", label: "24 GB", tone: P.inkSoft }, { value: "48", label: "48 GB", tone: P.inkSoft }, { value: "80", label: "80 GB", tone: P.inkSoft }]} />
          <button type="button" className="chip" onClick={() => setC(CASE)}>Repetir caso</button>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.6, 2.4, 11], fov: 35 }} fit={1.05}>
        <TankScene m={m} gpu={c.gpu} offload={c.offload} />
      </Stage>
    </Figure>
  );
}

type VM = ReturnType<typeof vram>;
const S = 0.052; // scene units per GB
const FLOOR = -1.6;

function StackSlab({ y, h, color }: { y: number; h: number; color: string }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = still ? y : MathUtils.damp(g.position.y, y, 6, dt);
    const sy = still ? h : MathUtils.damp(g.scale.y, h, 6, dt);
    g.scale.y = Math.max(0.001, sy);
  });
  return (
    <group ref={ref} position={[0, y, 0]} scale={[1, Math.max(0.001, h), 1]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 1, 1.1]} />
        <meshPhysicalMaterial color={color} roughness={0.38} clearcoat={0.5} />
      </mesh>
    </group>
  );
}

function TankScene({ m, gpu, offload }: { m: VM; gpu: number; offload: boolean }) {
  const cap = gpu * S;
  const slabs = m.layers.map((l, i) => {
    const below = m.layers.slice(0, i).reduce((a, x) => a + x.gb * S, 0);
    const h = l.gb * S;
    return { ...l, h, y: FLOOR + below + h / 2 };
  });
  const top = FLOOR + m.total * S;
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[0, FLOOR - 0.3, 0.1]} scale={7} opacity={0.1} />
        <RoundedBox position={[0, FLOOR - 0.16, 0]} args={[6.4, 0.24, 2.4]} radius={0.1} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#2D3436" roughness={0.5} metalness={0.2} />
        </RoundedBox>
        {/* the VRAM tank: its height is the card's capacity */}
        <mesh position={[0, FLOOR + cap / 2, 0]}>
          <boxGeometry args={[1.8, cap, 1.4]} />
          <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.12)} transparent opacity={0.18} roughness={0.15} depthWrite={false} />
        </mesh>
        {[-0.9, 0.9].flatMap((x) => [-0.7, 0.7].map((z) => (
          <mesh key={x + ":" + z} position={[x, FLOOR + cap / 2, z]} castShadow>
            <boxGeometry args={[0.06, cap, 0.06]} />
            <meshStandardMaterial color="#8C9895" metalness={0.6} roughness={0.3} />
          </mesh>
        )))}
        <mesh position={[0, FLOOR + cap, 0]}>
          <boxGeometry args={[1.95, 0.05, 1.55]} />
          <meshStandardMaterial color="#B7833E" metalness={0.7} roughness={0.3} />
        </mesh>
        <Tag position={[-1.25, FLOOR + cap, 0.7]} tone="ink" size="xs" center>{"GPU " + gpu + " GB"}</Tag>
        {slabs.map((sl) => <StackSlab key={sl.id} y={sl.y} h={sl.h} color={sl.color} />)}
        {slabs.map((sl, i) => {
          // leader labels: keep at least 0.22 between consecutive tags
          const ty = slabs.slice(0, i + 1).reduce((prev, x) => Math.max(x.y, prev + 0.22), -Infinity);
          return (
            <group key={"t" + sl.id}>
              <Tag position={[1.05, ty, 0.6]} tone="ink" size="xs">{sl.label + " · " + gb(sl.gb)}</Tag>
              <mesh position={[0.9, (sl.y + ty) / 2, 0.58]}>
                <boxGeometry args={[0.012, Math.max(0.01, Math.abs(ty - sl.y)), 0.012]} />
                <meshBasicMaterial color={P.lineStrong} />
              </mesh>
            </group>
          );
        })}
        {m.oom ? (
          <>
            <mesh position={[0, (FLOOR + cap + top) / 2, 0]}>
              <boxGeometry args={[1.62, top - FLOOR - cap, 1.22]} />
              <meshBasicMaterial color={P.rose} transparent opacity={0.22} depthWrite={false} />
              <Edges color={P.rose} />
            </mesh>
            <Tag position={[-1.25, top, 0.6]} tone="rose" size="xs" center>{"exceso " + gb(-m.free) + " GB"}</Tag>
          </>
        ) : (
          <Tag position={[-1.25, top, 0.6]} tone="teal" size="xs" center>{"libre " + gb(m.free) + " GB"}</Tag>
        )}
        {/* host RAM tray: where offload_embedding puts the embedding */}
        <group position={[-2.3, FLOOR, 0.2]}>
          <RoundedBox position={[0, 0.06, 0]} args={[1.2, 0.12, 1.0]} radius={0.04} smoothness={2} castShadow receiveShadow>
            <meshStandardMaterial color="#4E5A59" metalness={0.4} roughness={0.4} />
          </RoundedBox>
          {offload ? (
            <RoundedBox position={[0, 0.12 + (EMBED_GB * S) / 2, 0]} args={[0.9, EMBED_GB * S, 0.7]} radius={0.02} smoothness={2} castShadow>
              <meshPhysicalMaterial color={P.violet} roughness={0.38} clearcoat={0.5} />
            </RoundedBox>
          ) : null}
          <Tag position={[0, -0.3, 0.6]} tone="violet" size="xs" center>RAM del host</Tag>
        </group>
      </group>
    </PointerTilt>
  );
}

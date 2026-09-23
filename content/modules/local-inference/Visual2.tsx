"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type Cell } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "runtimes" | "phases" | "formats";
const COPY = {
  en: { title: "local inference is a choice of engine", hint: "runtimes · phases · formats", runtimes: "runtimes", phases: "prefill / decode", formats: "formats", llama: "llama.cpp", ollama: "Ollama", vllm: "vLLM", mlx: "MLX", prefill: "prefill", decode: "decode", gguf: "GGUF", safe: "safetensors", unified: "unified", vram: "VRAM" },
  es: { title: "la inferencia local elige motor", hint: "runtimes · fases · formatos", runtimes: "motores", phases: "prefill / decode", formats: "formatos", llama: "llama.cpp", ollama: "Ollama", vllm: "vLLM", mlx: "MLX", prefill: "prefill", decode: "decode", gguf: "GGUF", safe: "safetensors", unified: "unificada", vram: "VRAM" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("runtimes");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.llama }, { color: P.violet, label: t.ollama }, { color: P.amber, label: t.vllm }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "runtimes", label: t.runtimes, tone: P.teal }, { value: "phases", label: t.phases, tone: P.violet }, { value: "formats", label: t.formats, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "runtimes" && <>{[[t.llama, P.teal, -1.8], [t.ollama, P.violet, 0], [t.vllm, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">un usuario · throughput distinto</Tag></>}
        {mode === "phases" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.prefill}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.decode}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">TTFT ↔ tokens/segundo</Tag></>}
        {mode === "formats" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.gguf}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.lineStrong} radius={0.05} opacity={0.8} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.safe}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.unified} ↔ {t.vram}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: las dos flags que deciden si arranca, -ngl y -c, sobre el caso
 * de la lección: un GGUF de 30B en Q4 (~18 GB) en una tarjeta de 12 GB.
 * Modelo didáctico: 48 capas de 0,375 GB; KV = 2 × 48 × 4 cabezas KV × 128
 * × 2 B = 96 KiB por token de contexto reservado, repartida con las capas;
 * 0,8 GB de reserva del runtime. Decode ideal: leer los pesos de GPU a
 * 360 GB/s y los de RAM a 60 GB/s en cada token.
 */

const LAYERS = 48;
const WEIGHTS_GB = 18;
const LAYER_GB = WEIGHTS_GB / LAYERS;
const KV_BYTES_PER_TOKEN = 2 * LAYERS * 4 * 128 * 2;
const RESERVE_GB = 0.8;
const VRAM_BW = 360;
const RAM_BW = 60;
const CTX = [2048, 4096, 8192, 16384, 32768, 65536];
const CTX_LABEL = ["2k", "4k", "8k", "16k", "32k", "64k"];
const GB_H = 0.17;
const binX = -1.6;
const ramX = 2.4;
const floor = 0.62;

const es1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const es2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function budget(ngl: number, ctx: number, vram: number) {
  const kvTotal = (ctx * KV_BYTES_PER_TOKEN) / 1e9;
  const kvGpu = kvTotal * (ngl / LAYERS);
  const kvCpu = kvTotal - kvGpu;
  const gpuWeights = ngl * LAYER_GB;
  const cpuWeights = (LAYERS - ngl) * LAYER_GB;
  const used = gpuWeights + kvGpu + RESERVE_GB;
  const perToken = gpuWeights / VRAM_BW + cpuWeights / RAM_BW;
  let maxNgl = 0;
  for (let n = LAYERS; n >= 0; n -= 1) {
    if (n * LAYER_GB + kvTotal * (n / LAYERS) + RESERVE_GB <= vram) {
      maxNgl = n;
      break;
    }
  }
  return { kvTotal, kvGpu, kvCpu, gpuWeights, cpuWeights, used, oom: used > vram, tokS: 1 / perToken, maxNgl };
}

function OffloadBench({ ngl, ctx, vram }: { ngl: number; ctx: number; vram: number }) {
  const b = budget(ngl, ctx, vram);
  const cap = vram * GB_H;
  const { gpu, cpu } = useMemo(() => {
    const g: Cell[] = [];
    const c: Cell[] = [];
    let y = floor;
    const push = (list: Cell[], x: number, gb: number, color: string, w = 1.1) => {
      const h = gb * GB_H;
      list.push({ position: [x, y + h / 2, 0], scale: [w, Math.max(0.004, h * 0.86), 0.9], color });
      y += h;
    };
    push(g, binX, RESERVE_GB, "#9DA5A0");
    for (let l = 0; l < ngl; l += 1) {
      const over = y + LAYER_GB * GB_H > floor + cap;
      push(g, binX, LAYER_GB, over ? P.rose : mixHex(P.paper, P.teal, 0.55 + (l % 4) * 0.1));
    }
    if (b.kvGpu > 0) push(g, binX, b.kvGpu, y + b.kvGpu * GB_H > floor + cap ? P.rose : P.violet);
    y = floor;
    for (let l = ngl; l < LAYERS; l += 1) push(c, ramX, LAYER_GB, mixHex(P.paper, P.amber, 0.55 + (l % 4) * 0.1), 0.9);
    if (b.kvCpu > 0) push(c, ramX, b.kvCpu, mixHex(P.paper, P.violet, 0.6), 0.9);
    return { gpu: g, cpu: c };
  }, [ngl, b.kvGpu, b.kvCpu, cap]);
  const cpuShare = b.cpuWeights / WEIGHTS_GB;
  const ramTop = floor + (b.cpuWeights + b.kvCpu) * GB_H;

  return (
    <group>
      <ShadowBlob position={[0.3, 0.004, 0]} scale={8} opacity={0.1} />
      <RoundedBox args={[7.6, 0.24, 2.8]} position={[0.3, 0.12, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      {/* tarjeta: PCB, disipador y el depósito de VRAM */}
      <RoundedBox args={[2.6, 0.12, 1.8]} position={[binX, 0.3, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color="#183F38" roughness={0.45} clearcoat={0.3} />
      </RoundedBox>
      <RoundedBox args={[1.5, 0.2, 1.3]} position={[binX, 0.46, 0]} radius={0.05} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color="#2C3332" roughness={0.4} metalness={0.25} />
      </RoundedBox>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[binX - 1.15 + i * 0.176, 0.25, 0.91]}>
          <boxGeometry args={[0.09, 0.09, 0.02]} />
          <meshStandardMaterial color="#B7833E" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[binX, floor + cap / 2, 0]}>
        <boxGeometry args={[1.3, cap, 1.1]} />
        <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.12} roughness={0.1} clearcoat={1} depthWrite={false} />
      </mesh>
      <Wire points={[[binX - 0.66, floor + cap, 0.56], [binX + 0.66, floor + cap, 0.56], [binX + 0.66, floor + cap, -0.56], [binX - 0.66, floor + cap, -0.56], [binX - 0.66, floor + cap, 0.56]]} color={b.oom ? P.rose : P.inkSoft} width={1.6} opacity={0.9} />
      <Tag position={[binX - 0.8, floor + cap, 0.56]} tone={b.oom ? "rose" : "ink"} size="xs">
        {b.oom ? "OOM" : `VRAM ${vram} GB`}
      </Tag>
      <Lattice cells={gpu} size={1} />
      <Tag position={[binX, 0.2, 1.25]} tone="teal" size="xs" center plate={false}>
        {`-ngl ${ngl} · GPU`}
      </Tag>

      {/* RAM del sistema: módulos DIMM y las capas que se quedan en CPU */}
      <RoundedBox args={[1.6, 0.1, 1.5]} position={[ramX, 0.29, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1F3A34" roughness={0.45} />
      </RoundedBox>
      {[-0.55, 0.55].map((x) => (
        <RoundedBox key={x} args={[0.08, 0.3, 1.3]} position={[ramX + x, 0.47, 0]} radius={0.02} smoothness={2} castShadow>
          <meshPhysicalMaterial color="#2C3332" roughness={0.4} />
        </RoundedBox>
      ))}
      <Lattice cells={cpu} size={1} />
      <Tag position={[ramX, Math.max(ramTop, floor) + 0.25, 0]} tone="amber" size="xs" center>
        {`${LAYERS - ngl} capas en RAM`}
      </Tag>

      {/* PCIe: cada token cruza por las capas que no están en VRAM */}
      <RoundedBox args={[1.3, 0.1, 0.5]} position={[0.4, 0.3, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.35} />
      </RoundedBox>
      {cpuShare > 0 ? (
        <Flow points={[[ramX - 0.6, 0.55, 0], [0.4, 0.9, 0], [binX + 0.7, 0.6, 0]]} color={P.amber} count={Math.max(1, Math.round(cpuShare * 8))} size={0.05} speed={0.3 + (1 - cpuShare) * 0.6} lineOpacity={0.3} />
      ) : null}
      <Tag position={[0.4, 0.2, 0.55]} tone="muted" size="xs" center plate={false}>
        PCIe
      </Tag>
    </group>
  );
}

function SpanishVisual() {
  const [ngl, setNgl] = useState(24);
  const [ctxIndex, setCtxIndex] = useState(1);
  const [vram, setVram] = useState<"12" | "16" | "24">("12");
  const v = Number(vram);
  const ctx = CTX[ctxIndex];
  const b = budget(ngl, ctx, v);

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 border-b border-line pb-3 sm:grid-cols-4">
        {[
          ["VRAM usada", `${es1.format(b.used)} / ${v} GB`],
          ["KV reservada (-c)", `${es2.format(b.kvTotal)} GB`],
          ["Máx. -ngl que cabe", String(b.maxNgl)],
          ["Decode ideal", b.oom ? "no arranca" : `${es1.format(b.tokS)} tok/s`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>
        {b.oom
          ? `OOM: ${ngl} capas (${es1.format(b.gpuWeights)} GB) más su parte de KV (${es2.format(b.kvGpu)} GB) y la reserva no caben en ${v} GB. Baja -ngl a ${b.maxNgl} o reduce -c.`
          : ngl === LAYERS
            ? "Todo el modelo vive en VRAM: cada token lee los 18 GB a velocidad de GPU y nada cruza PCIe."
            : `${LAYERS - ngl} capas (${es1.format(b.cpuWeights)} GB) se quedan en RAM. En cada token de decode esas capas se leen a velocidad de RAM del host: son ${es1.format((b.cpuWeights / RAM_BW) * 1000)} ms de los ${es1.format((1 / b.tokS) * 1000)} ms por token.`}{" "}
        -c {CTX_LABEL[ctxIndex]} es una reserva, no un máximo permisivo: {es2.format(b.kvTotal)} GB de caché KV aunque el prompt sea corto.
      </p>
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        ./llama-cli -m model-Q4_K_M.gguf -ngl {ngl} -c {ctx}
      </p>
      <p className="text-xs text-muted">
        Modelo didáctico del caso de la lección (30B Q4 ≈ 18 GB): 48 capas iguales, 4 cabezas KV de 128, 0,8 GB de reserva, 360 GB/s de VRAM y 60 GB/s
        de RAM. El decode ideal ignora cómputo y latencia; la lección cita 5–15 tok/s reales con capas en RAM.
      </p>
    </div>
  );

  return (
    <Figure
      label="-ngl y -c: qué cabe en la tarjeta y qué cruza PCIe"
      hint="30B Q4 · capas en GPU frente a capas en RAM"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "capas en VRAM" },
        { color: P.amber, label: "capas en RAM" },
        { color: P.violet, label: "caché KV (-c)" },
        { color: P.rose, label: "no cabe" },
      ]}
      note={note}
      controls={
        <>
          <Knob label="-ngl" min={0} max={LAYERS} value={ngl} onChange={setNgl} tone={b.oom ? P.rose : P.teal} />
          <Knob label="-c" min={0} max={CTX.length - 1} value={ctxIndex} onChange={setCtxIndex} format={(i) => CTX_LABEL[i]} tone={P.violet} />
          <Switcher
            ariaLabel="VRAM de la tarjeta"
            value={vram}
            onChange={setVram}
            options={[
              { value: "12", label: "12 GB", tone: P.inkSoft },
              { value: "16", label: "16 GB", tone: P.inkSoft },
              { value: "24", label: "24 GB", tone: P.inkSoft },
            ]}
          />
          <Readout items={[{ label: "tok/s", value: b.oom ? "—" : es1.format(b.tokS), tone: b.oom ? P.rose : P.teal }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3, 5, 9.5], fov: 34 }} fit={1.05}>
        <OffloadBench ngl={ngl} ctx={ctx} vram={v} />
      </Stage>
    </Figure>
  );
}

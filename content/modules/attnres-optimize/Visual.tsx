"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Node3D, ShadowBlob, Slab, Tag, Turntable, Wire, type Cell, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "naive" | "cached" | "twophase";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "naive_pp": "naive PP",
      "cached": "cached",
      "two_phase": "two-phase",
      "full_history_resend": "full history / resend",
      "cached_increment": "cached increment",
      "phase_1_phase_2": "phase 1 / phase 2"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "naive_pp": "PP ingenuo",
      "cached": "en caché",
      "two_phase": "dos fases",
      "full_history_resend": "historial completo / reenvío",
      "cached_increment": "incremento en caché",
      "phase_1_phase_2": "fase 1 / fase 2"
    },
  });

  const OPTIONS = [
    { value: "naive" as const, label: t.naive_pp, tone: "var(--amber)" },
    { value: "cached" as const, label: t.cached, tone: "var(--teal)" },
    { value: "twophase" as const, label: t.two_phase, tone: "var(--violet)" },
  ];
  const [step, setStep] = useState<Step>("naive");

  return (
    <Figure
      label="AttnRes systems"
      hint={t.step_the_diagram}
      legend={[
        { color: P.amber, label: t.full_history_resend },
        { color: P.teal, label: t.cached_increment },
        { color: P.violet, label: t.phase_1_phase_2 },
      ]}
      controls={
        <Switcher
          ariaLabel="attention residual systems diagrams"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.6], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active }: { active: Step }) {
  return (
    <group>
      {active === "naive" ? <NaiveScene /> : null}
      {active === "cached" ? <CachedScene /> : null}
      {active === "twophase" ? <TwoPhaseScene /> : null}
    </group>
  );
}

function NaiveScene() {
  const ranks = [-2.25, -0.75, 0.75, 2.25];
  return (
    <group>
      <Tag position={[0, 1.7, 0]} tone="amber" center>
        every hop resends history
      </Tag>
      {ranks.map((x, i) => (
        <group key={i}>
          <Slab position={[x, -0.15, 0]} size={[1.15, 1.55, 0.14]} color={P.lineStrong} fill={0.16} />
          {[0, 1, 2, 3].slice(0, i + 1).map((k) => (
            <Slab
              key={k}
              position={[x, -0.55 + k * 0.32, 0]}
              size={[0.78, 0.22, 0.1]}
              color={P.amber}
              fill={0.28 + k * 0.12}
            />
          ))}
          <Tag position={[x, -1.25, 0]} tone="amber" center>
            {`rank ${i}`}
          </Tag>
        </group>
      ))}
      <Wire points={[[-2.25, 0.55, 0], [2.25, 0.55, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.25, 0.55, 0], [2.25, 0.55, 0]]} color={P.amber} count={4} speed={0.32} />
    </group>
  );
}

function CachedScene() {
  const ranks = [-2.25, -0.75, 0.75, 2.25];
  return (
    <group>
      <Tag position={[0, 1.7, 0]} tone="teal" center>
        send only the new block
      </Tag>
      {ranks.map((x, i) => (
        <group key={i}>
          <Slab position={[x, -0.2, 0]} size={[1.15, 1.45, 0.14]} color={P.lineStrong} fill={0.16} />
          <Slab position={[x, -0.45, 0]} size={[0.78, 0.55, 0.1]} color={P.teal} fill={0.22} />
          <Slab position={[x, 0.35, 0]} size={[0.78, 0.28, 0.1]} color={P.teal} fill={0.55} />
          <Tag position={[x, -1.25, 0]} tone="teal" center>
            {`rank ${i}`}
          </Tag>
        </group>
      ))}
      <Wire points={[[-2.25, 0.35, 0], [2.25, 0.35, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.25, 0.35, 0], [2.25, 0.35, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0.75, 0.35, 0]} color={P.teal} radius={0.1} pulse={0.35} />
    </group>
  );
}

function TwoPhaseScene() {
  const qs = [-1.7, -0.55, 0.6, 1.75];
  return (
    <group>
      <Tag position={[0, 1.7, 0]} tone="violet" center>
        phase 1 batch, phase 2 merge
      </Tag>
      {qs.map((x, i) => (
        <group key={i}>
          <Slab position={[x, 0.85, 0]} size={[0.85, 0.38, 0.1]} color={P.violet} fill={0.28 + i * 0.08} />
          <Tag position={[x, 1.28, 0]} tone="violet" center>
            {`w${i}`}
          </Tag>
        </group>
      ))}
      <Slab position={[0, 0.05, 0]} size={[3.6, 0.42, 0.12]} color={P.violet} fill={0.4} />
      <Tag position={[0, -0.45, 0]} tone="violet" center>
        batched vs previous blocks
      </Tag>
      <Slab position={[-1.1, -1.15, 0]} size={[1.5, 0.38, 0.1]} color={P.teal} fill={0.5} />
      <Slab position={[1.1, -1.15, 0]} size={[1.5, 0.38, 0.1]} color={P.amber} fill={0.5} />
      <Tag position={[-1.1, -1.6, 0]} tone="teal" center>
        max + LSE
      </Tag>
      <Tag position={[1.1, -1.6, 0]} tone="amber" center>
        online merge
      </Tag>
      <Wire points={[[0, -0.2, 0], [-1.1, -0.95, 0]]} color={P.line} opacity={0.45} />
      <Wire points={[[0, -0.2, 0], [1.1, -0.95, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-1.7, 0.65, 0], [0, 0.05, 0]]} color={P.violet} count={2} speed={0.28} />
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: la comunicación del pipeline como una escalera de bloques.
 * Cada columna es un salto entre chunks consecutivos (C = P·V chunks,
 * C − 1 saltos) y cada losa es un resumen de bloque de ancho d que cruza
 * ese salto por token. Ingenuo: el salto j reenvía los j bloques
 * acumulados. Con caché: la primera etapa virtual acumula igual y cada
 * salto posterior envía solo el incremento de P bloques.
 */

type EsMode = "naive" | "cached";

const ES_D = 4096;
const ES_BYTES = 2;
const ES_SPAN = 8.4;
const ES_BASE_Y = 0.34;
const ES_COLUMN_DEPTH = 0.78;
const ES_RANK_Z = 1.45;

const esInt = new Intl.NumberFormat("es-ES");
const esOne = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

function cachedBlocksAt(hop: number, ranks: number) {
  return hop < ranks ? hop : ranks;
}

function commModel(ranks: number, virtual: number) {
  const chunks = ranks * virtual;
  const hops = chunks - 1;
  const naive = (chunks * (chunks - 1)) / 2;
  const cached = (ranks * (ranks - 1)) / 2 + (virtual - 1) * ranks * ranks;
  const naivePeak = hops;
  const cachedPeak = virtual > 1 ? ranks : ranks - 1;
  return { chunks, hops, naive, cached, naivePeak, cachedPeak };
}

function kib(blocks: number) {
  return esOne.format((blocks * ES_D * ES_BYTES) / 1024);
}

function hopLayout(ranks: number, virtual: number) {
  const hops = ranks * virtual - 1;
  const groupGap = 0.7;
  const units = hops + (virtual - 1) * groupGap;
  const pitch = Math.min(0.62, ES_SPAN / Math.max(units, 1));
  const width = units * pitch;
  const xs: number[] = [];
  for (let hop = 1; hop <= hops; hop += 1) {
    const group = Math.floor(hop / ranks);
    const index = hop - 1 + group * groupGap;
    xs.push(-width / 2 + pitch / 2 + index * pitch);
  }
  const groups = Array.from({ length: virtual }, (_, v) => {
    const first = v === 0 ? 1 : v * ranks;
    const last = Math.min(hops, v * ranks + ranks - 1);
    return { v, first, last, x0: xs[first - 1] - pitch * 0.5, x1: xs[last - 1] + pitch * 0.5 };
  }).filter((g) => g.last >= g.first);
  return { xs, pitch, width, groups };
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

function RankCard({ position, sending, receiving, label }: { position: V3; sending: boolean; receiving: boolean; label: string }) {
  const face = receiving ? P.teal : sending ? P.amber : "#7E8982";
  return (
    <group position={position}>
      <RoundedBox args={[0.7, 0.14, 0.46]} position={[0, 0.07, 0]} radius={0.035} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#2C3332" roughness={0.42} metalness={0.2} clearcoat={0.4} clearcoatRoughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.06, 0.26]} position={[-0.08, 0.17, -0.02]} radius={0.02} smoothness={2} castShadow>
        <meshPhysicalMaterial color={face} roughness={0.35} clearcoat={0.5} clearcoatRoughness={0.25} />
      </RoundedBox>
      {[0.2, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.16, -0.02]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.3]} />
          <meshStandardMaterial color="#8C9895" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {[-0.24, -0.16, -0.08, 0, 0.08, 0.16, 0.24].map((x) => (
        <mesh key={x} position={[x, 0.07, 0.232]}>
          <boxGeometry args={[0.045, 0.08, 0.01]} />
          <meshStandardMaterial color="#B7833E" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <Tag position={[0, 0.02, 0.5]} tone={receiving ? "teal" : sending ? "amber" : "muted"} size="xs" center plate={false}>
        {label}
      </Tag>
    </group>
  );
}

function CommStaircase({ mode, ranks, virtual, hop }: { mode: EsMode; ranks: number; virtual: number; hop: number }) {
  const model = commModel(ranks, virtual);
  const layout = useMemo(() => hopLayout(ranks, virtual), [ranks, virtual]);
  const tileH = Math.min(0.24, 3.5 / Math.max(model.hops, 1));
  const tileStep = tileH * 1.2;
  const colW = layout.pitch * 0.72;
  const top = ES_BASE_Y + 0.11;

  const { solid, ghost, pads } = useMemo(() => {
    const solidCells: Cell[] = [];
    const ghostCells: Cell[] = [];
    const padCells: Cell[] = [];
    for (let j = 1; j <= model.hops; j += 1) {
      const x = layout.xs[j - 1];
      const kept = cachedBlocksAt(j, ranks);
      const lift = j === hop ? 0.14 : 0;
      padCells.push({
        position: [x, top - 0.035, 0],
        scale: [colW + 0.08, 0.05, ES_COLUMN_DEPTH + 0.08],
        color: j === hop ? P.violet : "#9DA5A0",
      });
      for (let k = 0; k < j; k += 1) {
        const position: V3 = [x, top + tileH / 2 + k * tileStep + lift, 0];
        const scale: V3 = [colW, tileH, ES_COLUMN_DEPTH];
        if (mode === "naive") {
          const base = k < kept ? P.amber : P.rose;
          solidCells.push({ position, scale, color: j === hop ? base : mixHex(P.paper, base, 0.72) });
        } else if (k < kept) {
          solidCells.push({ position, scale, color: j === hop ? P.teal : mixHex(P.paper, P.teal, 0.75) });
        } else {
          ghostCells.push({ position, scale, color: P.lineStrong });
        }
      }
    }
    return { solid: solidCells, ghost: ghostCells, pads: padCells };
  }, [model.hops, layout, ranks, mode, hop, tileH, tileStep, colW, top]);

  const peak = mode === "naive" ? model.naivePeak : model.cachedPeak;
  const peakY = top + peak * tileStep + 0.02;
  const baseW = layout.width + 1.5;
  const tickStep = model.hops <= 12 ? 2 : model.hops <= 32 ? 4 : 8;
  const ticks = Array.from({ length: Math.floor(model.hops / tickStep) + 1 }, (_, i) => i * tickStep);
  const axisX = -layout.width / 2 - 0.42;
  const hx = layout.xs[hop - 1] ?? 0;
  const hopBlocks = mode === "naive" ? hop : cachedBlocksAt(hop, ranks);
  const hopTop = top + hopBlocks * tileStep + 0.14;
  const sender = (hop - 1) % ranks;
  const receiver = hop % ranks;
  const rankPitch = Math.min(1.05, (layout.width + 0.2) / ranks);
  const rankX = (r: number) => (r - (ranks - 1) / 2) * rankPitch;
  const accent = mode === "naive" ? P.amber : P.teal;

  return (
    <group>
      <ShadowBlob position={[0, 0.005, 0.45]} scale={baseW * 1.15} opacity={0.12} />
      <RoundedBox args={[baseW, 0.24, 3.4]} position={[0, 0.12, 0.45]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} metalness={0.02} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[baseW - 0.3, 0.08, 1.45]} position={[0, ES_BASE_Y - 0.06, 0]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#C9BFAD" roughness={0.55} />
      </RoundedBox>

      {layout.groups.map((g) => (
        <group key={g.v}>
          <RoundedBox
            args={[g.x1 - g.x0, 0.05, ES_COLUMN_DEPTH + 0.3]}
            position={[(g.x0 + g.x1) / 2, ES_BASE_Y + 0.005, 0]}
            radius={0.02}
            smoothness={2}
            receiveShadow
          >
            <meshStandardMaterial color={g.v === 0 ? "#B9B09E" : mixHex("#C9BFAD", P.teal, mode === "cached" ? 0.28 : 0.08)} roughness={0.5} />
          </RoundedBox>
          <Tag position={[(g.x0 + g.x1) / 2, ES_BASE_Y, ES_COLUMN_DEPTH / 2 + 0.42]} tone={g.v === 0 ? "muted" : mode === "cached" ? "teal" : "muted"} size="xs" center plate={false}>
            {`etapa ${g.v + 1}`}
          </Tag>
        </group>
      ))}

      <Lattice cells={pads} size={1} />
      <Lattice cells={solid} size={1} />
      {ghost.length ? <Lattice cells={ghost} size={1} opacity={0.14} /> : null}

      <Wire points={[[-layout.width / 2 - 0.1, peakY, ES_COLUMN_DEPTH / 2 + 0.02], [layout.width / 2 + 0.1, peakY, ES_COLUMN_DEPTH / 2 + 0.02]]} color={accent} dashed width={1.3} opacity={0.8} />
      <Tag position={[layout.width / 2 + 0.25, peakY, ES_COLUMN_DEPTH / 2]} tone={mode === "naive" ? "amber" : "teal"} size="xs">
        {`pico ${peak}`}
      </Tag>

      <Wire points={[[axisX, top, 0], [axisX, top + model.hops * tileStep + 0.1, 0]]} color={P.inkSoft} width={1.2} opacity={0.7} />
      {ticks.map((t) => (
        <group key={t}>
          <Wire points={[[axisX, top + t * tileStep, 0], [axisX + 0.1, top + t * tileStep, 0]]} color={P.inkSoft} width={1} opacity={0.7} />
          <Tag position={[axisX - 0.2, top + t * tileStep, 0]} tone="muted" size="xs" center plate={false}>
            {String(t)}
          </Tag>
        </group>
      ))}
      <Tag position={[axisX, top + model.hops * tileStep + 0.38, 0]} tone="muted" size="xs" center>
        bloques por salto
      </Tag>

      <Halo position={[hx, top - 0.005, 0]} radius={Math.max(colW, 0.3) * 0.9} thickness={0.012} color={P.violet} opacity={0.9} />
      <Flow
        points={[[hx - layout.pitch * 0.9, hopTop - 0.05, 0], [hx, hopTop + 0.22, 0], [hx + layout.pitch * 0.9, hopTop - 0.05, 0]]}
        color={P.violet}
        count={2}
        size={0.045}
        speed={0.6}
        lineOpacity={0.35}
      />
      {Array.from({ length: ranks }, (_, r) => (
        <RankCard key={r} position={[rankX(r), ES_BASE_Y - 0.1, ES_RANK_Z]} sending={r === sender} receiving={r === receiver} label={`r${r}`} />
      ))}
      <Flow
        points={[[rankX(sender), ES_BASE_Y + 0.25, ES_RANK_Z - 0.05], [(rankX(sender) + rankX(receiver)) / 2, ES_BASE_Y + 0.75, ES_RANK_Z - 0.05], [rankX(receiver), ES_BASE_Y + 0.25, ES_RANK_Z - 0.05]]}
        color={accent}
        count={Math.min(6, Math.max(1, hopBlocks))}
        size={0.05}
        speed={0.45}
        lineOpacity={0.35}
      />
      <Tag position={[rankX(0) - rankPitch * 0.5 - 0.35, ES_BASE_Y, ES_RANK_Z]} tone="ink" size="xs" center>
        {`${ranks} GPU`}
      </Tag>
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<EsMode>("naive");
  const [ranks, setRanks] = useState(4);
  const [virtual, setVirtual] = useState(2);
  const model = commModel(ranks, virtual);
  const [cursor, setCursor] = useState(0);
  const hop = (cursor % model.hops) + 1;
  const sent = mode === "naive" ? model.naive : model.cached;
  const hopBlocks = mode === "naive" ? hop : cachedBlocksAt(hop, ranks);
  const saved = model.naive - model.cached;

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 border-b border-line pb-3 sm:grid-cols-4">
        {[
          ["Chunks C = P·V", esInt.format(model.chunks)],
          ["Bloques enviados", esInt.format(sent)],
          ["Pico por salto", `${mode === "naive" ? model.naivePeak : model.cachedPeak} bloques`],
          ["Por token (d = 4096, BF16)", `${kib(sent)} KiB`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      {mode === "naive" ? (
        <p>
          Cada salto <em>j</em> reenvía los <em>j</em> resúmenes de bloque acumulados: la escalera es el número triangular
          C(C−1)/2 = {esInt.format(model.naive)} bloques y el último salto transporta {model.naivePeak}. Las losas rosas ({esInt.format(saved)})
          son historial que el rank receptor ya recibió en su etapa virtual anterior: lo que la caché dejaría de enviar.
        </p>
      ) : (
        <p>
          La primera etapa virtual acumula igual: 1 + … + {ranks - 1} = {esInt.format((ranks * (ranks - 1)) / 2)} bloques. Desde la segunda,
          cada salto envía solo el incremento de P = {ranks} bloques: (V−1)·P² = {esInt.format((virtual - 1) * ranks * ranks)}. Total{" "}
          {esInt.format(model.cached)} frente a {esInt.format(model.naive)}; el pico baja de {model.naivePeak} a {model.cachedPeak}, que es lo
          que deja esconder el tráfico bajo el cómputo 1F1B. Las siluetas grises son los {esInt.format(saved)} bloques ahorrados.
          {virtual === 1 ? " Con V = 1 no hay segunda visita al mismo rank y la caché no ahorra nada." : ""}
        </p>
      )}
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        Salto {hop}: r{(hop - 1) % ranks} → r{hop % ranks} envía {hopBlocks} {hopBlocks === 1 ? "bloque" : "bloques"} = {kib(hopBlocks)} KiB por token ·
        ingenuo {esInt.format(model.naive)} · caché {esInt.format(model.cached)} · pico ×{esOne.format(model.naivePeak / Math.max(1, model.cachedPeak))}
      </p>
      <p className="text-xs text-muted">
        Modelo de la lección: N<sub>p</sub> = 1 bloque nuevo por etapa física, un token, d = 4096 en BF16. Las cifras en KiB son
        didácticas y excluyen cabeceras y el estado oculto normal. Las tarjetas de rank indican solo quién envía y quién recibe.
      </p>
    </div>
  );

  return (
    <Figure
      label="Comunicación de pipeline: ingenua frente a caché entre etapas"
      hint="cada columna es un salto · cada losa, un bloque de ancho d"
      height="h-[520px] md:h-[600px]"
      legend={
        mode === "naive"
          ? [
              { color: P.amber, label: "bloque necesario" },
              { color: P.rose, label: "reenvío redundante" },
              { color: P.violet, label: "salto actual" },
            ]
          : [
              { color: P.teal, label: "incremento enviado" },
              { color: P.lineStrong, label: "ahorrado por la caché" },
              { color: P.violet, label: "salto actual" },
            ]
      }
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Protocolo de comunicación"
            value={mode}
            onChange={setMode}
            options={[
              { value: "naive", label: "PP ingenuo", tone: P.amber },
              { value: "cached", label: "Caché entre etapas", tone: P.teal },
            ]}
          />
          <Knob label="Ranks P" min={2} max={8} value={ranks} onChange={setRanks} tone={P.inkSoft} />
          <Knob label="Etapas V" min={1} max={8} value={virtual} onChange={setVirtual} tone={P.violet} />
          <Readout
            items={[
              { label: "ingenuo", value: esInt.format(model.naive), tone: P.amber },
              { label: "caché", value: esInt.format(model.cached), tone: P.teal },
            ]}
          />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-4.6, 6, 10], fov: 34 }} fit={1.08}>
        <CommStaircase mode={mode} ranks={ranks} virtual={virtual} hop={Math.min(hop, model.hops)} />
        <Ticker seconds={1.6} onTick={() => setCursor((c) => (c + 1) % Math.max(1, model.hops))} />
      </Stage>
    </Figure>
  );
}

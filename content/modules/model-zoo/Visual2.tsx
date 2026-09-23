"use client";

import { useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import type { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "open" | "moe" | "card";
const COPY = {
  en: { title: "read the model card, not the slogan", hint: "open · dense / MoE · checklist", open: "open", moe: "dense / MoE", card: "model card", api: "API", weights: "weights", code: "code", dense: "dense", active: "active", total: "total", license: "license", template: "chat template", file: "file" },
  es: { title: "lee la ficha, no el eslogan", hint: "abierto · dense / MoE · checklist", open: "abierto", moe: "dense / MoE", card: "ficha", api: "API", weights: "pesos", code: "código", dense: "dense", active: "activos", total: "totales", license: "licencia", template: "plantilla chat", file: "archivo" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("open");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.weights }, { color: P.violet, label: t.code }, { color: P.amber, label: t.license }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "open", label: t.open, tone: P.teal }, { value: "moe", label: t.moe, tone: P.violet }, { value: "card", label: t.card, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "open" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.weights}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.api}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">abierto no siempre significa open source</Tag></>}
        {mode === "moe" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.total}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.active}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">memoria ↔ FLOPs</Tag></>}
        {mode === "card" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.amber} opacity={0.32} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="amber">{t.card}</Tag>{[[t.license, P.teal, -1.7], [t.template, P.violet, 0], [t.file, P.rose, 1.7]].map(([label, color, x], i) => <group key={label as string}><Node3D position={[x as number, -0.65, 0]} color={color as string} radius={0.13} matte /><Tag position={[x as number, -0.2, 0.15]} tone={(["teal", "violet", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}</>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * La ficha como lista de comprobación. Tres fichas de ejemplo (inventadas,
 * no son modelos reales) se leen en el orden de la lección; cada fila se
 * evalúa contra el uso previsto y el motor elegido. El cartucho de archivo
 * solo encaja en el zócalo de su motor: GGUF → llama.cpp/Ollama,
 * safetensors → vLLM, MLX → MLX-LM.
 */

type CardId = "instruct" | "base" | "moe";
type Engine = "llamacpp" | "vllm" | "mlx";
type Use = "commercial" | "research";
type FileFmt = "GGUF" | "safetensors" | "MLX";
type Status = "ok" | "fail" | "warn";

const CARDS: Record<CardId, { label: string; license: string; commercial: boolean; arch: string; moeTable: boolean; template: boolean; kind: string; file: FileFmt; quant: string; evals: boolean }> = {
  instruct: { label: "Ficha A · instruct 8B", license: "Apache-2.0", commercial: true, arch: "dense 8B · 32k", moeTable: true, template: true, kind: "instruct", file: "GGUF", quant: "Q4_K_M, Q8_0", evals: true },
  base: { label: "Ficha B · base 7B", license: "solo investigación", commercial: false, arch: "dense 7B · 8k", moeTable: true, template: false, kind: "base", file: "safetensors", quant: "ninguna", evals: true },
  moe: { label: "Ficha C · MoE 48B/3B", license: "Apache-2.0", commercial: true, arch: "MoE · 48B totales / 3B activos", moeTable: true, template: true, kind: "instruct", file: "MLX", quant: "4 bits", evals: false },
};
const ENGINES: Record<Engine, { label: string; wants: FileFmt }> = {
  llamacpp: { label: "llama.cpp / Ollama", wants: "GGUF" },
  vllm: { label: "vLLM", wants: "safetensors" },
  mlx: { label: "MLX-LM", wants: "MLX" },
};

function review(card: CardId, engine: Engine, use: Use) {
  const c = CARDS[card];
  const fits = ENGINES[engine].wants === c.file;
  const rows: { n: number; item: string; status: Status; why: string }[] = [
    { n: 1, item: "Licencia", status: use === "research" || c.commercial ? "ok" : "fail", why: c.license + (use === "commercial" && !c.commercial ? ": no permite uso comercial" : "") },
    { n: 2, item: "Arquitectura", status: c.moeTable ? "ok" : "warn", why: c.arch },
    { n: 3, item: "Plantilla chat", status: c.template ? "ok" : "fail", why: c.template ? "chat_template en el tokenizer" : "modelo base: no hay plantilla, completa texto" },
    { n: 4, item: "Uso previsto", status: "ok", why: "límites declarados" },
    { n: 5, item: "Archivos", status: fits ? "ok" : "fail", why: `${c.file} → ${ENGINES[engine].label} ${fits ? "lo carga" : "espera " + ENGINES[engine].wants}` },
    { n: 6, item: "Evals", status: "warn", why: c.evals ? "publicadas: una pista, no tu test" : "sin evals: haz tu humo de cinco prompts" },
    { n: 7, item: "Cuantizaciones", status: c.quant === "ninguna" ? "warn" : "ok", why: c.quant },
  ];
  const blocking = rows.filter((r) => r.status === "fail");
  return { rows, fits, blocking, servable: blocking.length === 0 };
}

const MC = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };
const STATUS_COLOR: Record<Status, string> = { ok: P.teal, fail: P.rose, warn: P.amber };
const FMT_COLOR: Record<FileFmt, string> = { GGUF: P.teal, safetensors: P.amber, MLX: P.violet };

function CMat2({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

/* Forma del cartucho según formato: prisma hexagonal, caja o cilindro. */
function FormatShape({ fmt, scale = 1, color }: { fmt: FileFmt; scale?: number; color: string }) {
  if (fmt === "GGUF") return <mesh castShadow scale={scale}><cylinderGeometry args={[0.28, 0.28, 0.5, 6]} /><CMat2 color={color} clear={0.6} /></mesh>;
  if (fmt === "MLX") return <mesh castShadow scale={scale}><cylinderGeometry args={[0.26, 0.26, 0.5, 32]} /><CMat2 color={color} clear={0.6} /></mesh>;
  return <RoundedBox args={[0.46 * scale, 0.5 * scale, 0.46 * scale]} radius={0.05} smoothness={2} castShadow><CMat2 color={color} clear={0.6} /></RoundedBox>;
}

/* La ficha: panel inclinado con siete filas y su lámpara de estado. */
function CardStand({ rows }: { rows: ReturnType<typeof review>["rows"] }) {
  return (
    <group position={[-1.6, 0, 0]}>
      <RoundedBox position={[0, -0.55, 0]} args={[3.3, 0.16, 1.9]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <CMat2 color={MC.ceramic} rough={0.55} clear={0.3} />
      </RoundedBox>
      <group position={[0, 0.55, -0.2]} rotation={[-0.32, 0, 0]}>
        <RoundedBox args={[3.0, 2.25, 0.1]} radius={0.05} smoothness={3} castShadow receiveShadow>
          <CMat2 color={mixHex(P.paper, "#E7DFCF", 0.8)} rough={0.6} clear={0.2} />
        </RoundedBox>
        {rows.map((r, i) => {
          const y = 0.9 - i * 0.3;
          const c = STATUS_COLOR[r.status];
          return (
            <group key={r.n} position={[0, y, 0.06]}>
              <mesh position={[0.15, 0, 0]}>
                <boxGeometry args={[2.1, 0.2, 0.02]} />
                <meshStandardMaterial color={mixHex(P.paper, c, 0.18)} roughness={0.6} />
              </mesh>
              <mesh position={[-1.25, 0, 0.04]}>
                <sphereGeometry args={[0.08, 18, 14]} />
                <meshStandardMaterial color={c} emissive={c} emissiveIntensity={r.status === "fail" ? 0.5 : 0.25} roughness={0.3} />
              </mesh>
              <Tag position={[-1.02, 0, 0.05]} tone={r.status === "ok" ? "teal" : r.status === "fail" ? "rose" : "amber"} size="xs" plate={false}>{r.n + " " + r.item}</Tag>
            </group>
          );
        })}
      </group>
      {[-1.35, 1.35].map((x) => (
        <mesh key={x} position={[x, -0.1, -0.55]} rotation={[-0.5, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.9, 10]} />
          <meshStandardMaterial color={MC.brass} metalness={0.75} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

/* Zócalo del motor con su hueco; el cartucho baja si la forma coincide. */
function EngineSocket({ engine, file }: { engine: Engine; file: FileFmt }) {
  const want = ENGINES[engine].wants;
  const fits = want === file;
  const cart = useRef<Group>(null);
  const { still } = useStage();
  const targetY = fits ? 0.36 : 0.95;
  useFrame((_, dt) => {
    const g = cart.current;
    if (!g) return;
    const k = still ? 1 : Math.min(1, dt * 3);
    g.position.y += (targetY - g.position.y) * k;
  });
  return (
    <group position={[2.35, 0, 0]}>
      <RoundedBox position={[0, -0.55, 0]} args={[1.9, 0.16, 1.9]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <CMat2 color={MC.ceramic} rough={0.55} clear={0.3} />
      </RoundedBox>
      <RoundedBox position={[0, -0.2, 0]} args={[1.4, 0.55, 1.4]} radius={0.1} smoothness={3} castShadow receiveShadow>
        <CMat2 color={MC.graphite} metal={0.3} />
      </RoundedBox>
      {/* hueco: silueta del formato que espera el motor */}
      <group position={[0, 0.085, 0]} scale={[1.12, 0.04, 1.12]}>
        <FormatShape fmt={want} color={mixHex(MC.graphite, FMT_COLOR[want], 0.45)} />
      </group>
      <group ref={cart} position={[0, 0.95, 0]}>
        <FormatShape fmt={file} color={fits ? mixHex(P.paper, FMT_COLOR[file], 0.6) : mixHex(P.paper, P.rose, 0.45)} />
      </group>
      <Tag position={[0, 1.6, 0]} tone={fits ? "teal" : "rose"} center>{file}</Tag>
      <Tag position={[0, -0.45, 1.1]} tone="ink" size="xs" center>{ENGINES[engine].label}</Tag>
    </group>
  );
}

function CardBench({ card, engine, use }: { card: CardId; engine: Engine; use: Use }) {
  const r = review(card, engine, use);
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.1, 0]}>
        <ShadowBlob position={[0, -0.98, 0.2]} scale={9} opacity={0.12} />
        <RoundedBox position={[0, -0.8, 0]} args={[8.0, 0.36, 2.9]} radius={0.17} smoothness={4} castShadow receiveShadow>
          <CMat2 color={MC.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.58, 0]} args={[7.7, 0.08, 2.6]} radius={0.04} smoothness={3} receiveShadow>
          <CMat2 color={MC.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        <CardStand rows={r.rows} />
        <EngineSocket engine={engine} file={CARDS[card].file} />
        <Arrow from={[-1.1 + 1.0, -0.05 + 0.1, 0.5]} to={[1.35, 0.2, 0.3]} color={r.fits ? P.teal : P.rose} width={1.4} head={0.09} bow={0.3} dashed={!r.fits} />
        <Tag position={[-1.6, -0.45, 1.2]} tone={r.servable ? "teal" : "rose"} center>{r.servable ? "lista para servir" : r.blocking.length + " bloqueos"}</Tag>
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [card, setCard] = useState<CardId>("base");
  const [engine, setEngine] = useState<Engine>("llamacpp");
  const [use, setUse] = useState<Use>("commercial");
  const r = review(card, engine, use);
  const c = CARDS[card];
  return (
    <Figure
      label="La ficha en siete filas · ¿puedo servir este modelo?"
      hint="licencia · plantilla · archivo frente a motor"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "comprobado" },
        { color: P.amber, label: "revísalo tú" },
        { color: P.rose, label: "bloquea" },
      ]}
      controls={
        <>
          <Switcher value={card} onChange={setCard} ariaLabel="Ficha de ejemplo" options={(Object.keys(CARDS) as CardId[]).map((id) => ({ value: id, label: CARDS[id].label.split(" · ")[0], tone: P.inkSoft }))} />
          <Switcher value={engine} onChange={setEngine} ariaLabel="Motor" options={(Object.keys(ENGINES) as Engine[]).map((id) => ({ value: id, label: ENGINES[id].label, tone: FMT_COLOR[ENGINES[id].wants] }))} />
          <Switcher value={use} onChange={setUse} ariaLabel="Uso previsto" options={[{ value: "commercial", label: "Comercial", tone: P.amber }, { value: "research", label: "Investigación", tone: P.teal }]} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            <strong>{c.label}.</strong>{" "}
            {r.servable
              ? `Nada bloquea: licencia compatible, plantilla presente y un ${c.file} que ${ENGINES[engine].label} carga. Las filas en ámbar siguen siendo trabajo tuyo.`
              : `Bloquea: ${r.blocking.map((b) => b.item.toLowerCase()).join(", ")}.`}
            {!c.template ? " Un modelo base en un chat completa el prompt en vez de seguir una plantilla: la UI parecerá rota." : ""}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse text-left text-xs">
              <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">#</th><th className="border-b border-line px-2 py-1">fila</th><th className="border-b border-line px-2 py-1">estado</th><th className="border-b border-line px-2 py-1">lectura</th></tr></thead>
              <tbody>{r.rows.map((row) => <tr key={row.n}><td className="border-b border-line/60 px-2 py-1 font-mono">{row.n}</td><td className="border-b border-line/60 px-2 py-1">{row.item}</td><td className="border-b border-line/60 px-2 py-1 font-mono" style={{ color: STATUS_COLOR[row.status] }}>{row.status === "ok" ? "ok" : row.status === "fail" ? "bloquea" : "revisar"}</td><td className="border-b border-line/60 px-2 py-1">{row.why}</td></tr>)}</tbody>
            </table>
          </div>
          <Readout items={[{ label: "archivo", value: c.file, tone: FMT_COLOR[c.file] }, { label: "motor espera", value: ENGINES[engine].wants, tone: FMT_COLOR[ENGINES[engine].wants] }, { label: "tipo", value: c.kind, tone: "var(--ink)" }]} />
          <p className="text-xs text-muted">Fichas inventadas para practicar el orden de lectura; no describen modelos reales. Las evals publicadas nunca pasan de “revisar”: tu test de aceptación es el humo de cinco prompts escritos por ti.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.4, 5.0, 8.8], fov: 34 }} fit={1.08}>
        <CardBench card={card} engine={engine} use={use} />
      </Stage>
    </Figure>
  );
}

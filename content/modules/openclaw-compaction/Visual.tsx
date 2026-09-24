"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Group } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Node3D, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Carrete de compaction de OpenClaw.
 *
 * Atrás, la transcripción en disco: nunca pierde un mensaje. Delante, lo que
 * el modelo verá en el siguiente turno. El punto de corte se calcula
 * caminando desde el final con keepRecentTokens (20.000 por defecto); si el
 * primer mensaje conservado es un toolResult, el corte retrocede hasta su
 * llamada para que el par no se separe. El resumen solo se escribe si pasa
 * la auditoría safeguard (headings, pending asks, identificadores exactos).
 * Tamaños de mensaje didácticos, elegidos para que el corte por defecto
 * caiga dentro de un par de tool y se vea el ajuste.
 */

type Kind = "user" | "call" | "result" | "assistant";
type Turn = { i: number; kind: Kind; tokens: number };

const UNITS: [number, number, number, number][] = [
  // user, toolCall, toolResult, assistant (chronological, oldest first)
  [420, 180, 6100, 700],
  [300, 200, 4800, 900],
  [380, 160, 7200, 650],
  [260, 220, 5400, 800],
  [350, 200, 2750, 500],
  [400, 180, 4600, 900],
  [250, 200, 5200, 600],
  [300, 200, 3000, 800],
];
const KINDS: Kind[] = ["user", "call", "result", "assistant"];
const TURNS: Turn[] = UNITS.flatMap((u) => u.map((tokens, k) => ({ kind: KINDS[k], tokens }))).map((m, i) => ({ ...m, i }));
const SUMMARY_TOKENS = 1800; // illustrative size of the stored summary entry

function cutPoint(keep: number) {
  let acc = 0;
  let start = TURNS.length;
  while (start > 0 && acc + TURNS[start - 1].tokens <= keep) { acc += TURNS[start - 1].tokens; start -= 1; }
  const raw = start;
  // never keep a toolResult without the assistant toolCall that produced it
  while (start > 0 && TURNS[start]?.kind === "result") start -= 1;
  return { raw, cut: start, moved: raw - start };
}

const sumTokens = (xs: Turn[]) => xs.reduce((a, m) => a + m.tokens, 0);
const fmtN = (n: number) => Math.round(n).toLocaleString("es-ES");

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

function Ease({ to, sx = 1, speed = 4, children }: { to: V3; sx?: number; speed?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const placed = useRef(false);
  const { still } = useStage();
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    if (!placed.current || still) { g.position.set(...to); g.scale.x = sx; placed.current = true; invalidate(); }
  }, [to, sx, still, invalidate]);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g || still) return;
    const k = Math.min(1, dt * speed);
    g.position.x += (to[0] - g.position.x) * k;
    g.position.y += (to[1] - g.position.y) * k;
    g.position.z += (to[2] - g.position.z) * k;
    g.scale.x += (sx - g.scale.x) * k;
  });
  return <group ref={ref}>{children}</group>;
}

const KIND_STYLE: Record<Kind, { color: string; h: number }> = {
  user: { color: P.amber, h: 0.6 },
  call: { color: "#6F7A86", h: 0.36 },
  result: { color: "#B9B3A4", h: 0.46 },
  assistant: { color: P.violet, h: 0.5 },
};

const SCALE = 9 / 52000;
const X0 = -4.5;
const GAP = 0.018;

type Tile = { key: string; kind: Kind | "summary"; x: number; w: number; tint?: string; z: number; y: number };

function packTiles(list: { key: string; kind: Kind | "summary"; tokens: number; tint?: string }[], z: number, y = 0): Tile[] {
  let cursor = X0;
  return list.map((m) => {
    const w = Math.max(0.05, m.tokens * SCALE);
    const t = { key: m.key, kind: m.kind, x: cursor + w / 2, w, tint: m.tint, z, y };
    cursor += w + GAP;
    return t;
  });
}

function TileMesh({ t, scaleH = 1 }: { t: Tile; scaleH?: number }) {
  const st = t.kind === "summary" ? { color: P.teal, h: 0.66 } : KIND_STYLE[t.kind];
  const h = st.h * scaleH;
  return (
    <Ease to={[t.x, t.y + h / 2 + 0.06, t.z]} sx={t.w}>
      <RoundedBox args={[1, h, 0.7]} radius={0.012} smoothness={2} castShadow receiveShadow>
        <Physical color={t.tint ?? st.color} coat={0.5} />
      </RoundedBox>
    </Ease>
  );
}

function Tier({ z, width, label, tone, dark }: { z: number; width: number; label: string; tone: "teal" | "muted" | "ink"; dark?: boolean }) {
  return (
    <group position={[0, 0, z]}>
      <RoundedBox args={[width, 0.12, 1.05]} position={[X0 + width / 2 - 0.25, -0.02, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <Physical color={dark ? "#263532" : "#4A3A2C"} rough={0.5} metal={dark ? 0.3 : 0.05} coat={0.3} />
      </RoundedBox>
      <Tag position={[X0 + width + 0.3, 0.1, 0]} tone={tone} size="xs" center>{label}</Tag>
    </group>
  );
}

function MemoryDrawer({ notes }: { notes: number }) {
  return (
    <group position={[3.0, 0, 2.3]}>
      <RoundedBox args={[1.6, 0.42, 0.9]} position={[0, 0.21, 0]} radius={0.05} smoothness={3} castShadow receiveShadow><Physical color="#4A3A2C" rough={0.6} coat={0.2} /></RoundedBox>
      <mesh position={[0, 0.22, 0.46]}><boxGeometry args={[0.5, 0.12, 0.02]} /><meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.3} /></mesh>
      {Array.from({ length: notes }, (_, k) => (
        <RoundedBox key={k} args={[1.2, 0.02, 0.6]} position={[0.02 * k, 0.45 + k * 0.035, -0.02 * k]} radius={0.005} smoothness={1} castShadow><Physical color="#F4EFE4" rough={0.8} coat={0.05} /></RoundedBox>
      ))}
      <Tag position={[0, -0.05, 0.7]} tone="amber" size="xs" center>archivos de memoria</Tag>
    </group>
  );
}

function AuditGate({ x, pass }: { x: number; pass: boolean }) {
  const lamps = [
    { label: "headings", ok: true },
    { label: "pending asks", ok: true },
    { label: "identificadores", ok: pass },
  ];
  return (
    <group position={[x, 0, 0.6]}>
      {[-0.55, 0.55].map((dz) => <mesh key={dz} position={[0, 0.7, dz]} castShadow><boxGeometry args={[0.07, 1.4, 0.07]} /><meshStandardMaterial color="#8A8F88" metalness={0.7} roughness={0.3} /></mesh>)}
      <mesh position={[0, 1.42, 0]} castShadow><boxGeometry args={[0.12, 0.12, 1.25]} /><meshStandardMaterial color={P.violet} roughness={0.35} /></mesh>
      {lamps.map((l, k) => (
        <mesh key={l.label} position={[0.08, 1.42, -0.38 + k * 0.38]}><sphereGeometry args={[0.07, 16, 12]} /><meshStandardMaterial color={l.ok ? P.teal : P.rose} emissive={l.ok ? P.teal : P.rose} emissiveIntensity={0.4} /></mesh>
      ))}
      <Tag position={[0, 1.78, 0]} tone={pass ? "teal" : "rose"} size="xs" center>{pass ? "safeguard: pasa" : "safeguard: falla"}</Tag>
    </group>
  );
}

const DISK_Z = -1.15;
const CTX_Z = 0.6;

function Wedge({ x, color, ghost }: { x: number; color: string; ghost?: boolean }) {
  return (
    <Ease to={[x, 1.15, CTX_Z]}>
      <mesh rotation={[Math.PI, 0, 0]} castShadow={!ghost}><coneGeometry args={[0.2, 0.42, 4]} /><meshStandardMaterial color={color} transparent={ghost} opacity={ghost ? 0.35 : 1} metalness={0.5} roughness={0.3} /></mesh>
      <mesh position={[0, -0.5, 0]}><boxGeometry args={[0.03, 0.8, 0.9]} /><meshBasicMaterial color={color} transparent opacity={ghost ? 0.25 : 0.7} /></mesh>
    </Ease>
  );
}

function ReelScene({ step, keep, pass }: { step: number; keep: number; pass: boolean }) {
  const { raw, cut } = useMemo(() => cutPoint(keep), [keep]);
  const saved = step === 4 && pass;
  const disk = packTiles([
    ...TURNS.map((m) => ({ key: `d${m.i}`, kind: m.kind, tokens: m.tokens, tint: mixHex(P.paper, KIND_STYLE[m.kind].color, 0.55) })),
    ...(saved ? [{ key: "dsum", kind: "summary" as const, tokens: SUMMARY_TOKENS }] : []),
  ], DISK_Z);
  const compacted = step === 3 || saved;
  const ctxList = compacted
    ? [{ key: "sum", kind: "summary" as const, tokens: SUMMARY_TOKENS }, ...TURNS.slice(cut).map((m) => ({ key: `c${m.i}`, kind: m.kind, tokens: m.tokens }))]
    : TURNS.map((m, k) => ({ key: `c${m.i}`, kind: m.kind, tokens: m.tokens, tint: step === 2 && k < cut ? mixHex(P.paper, P.violet, 0.3) : undefined }));
  const ctx = packTiles(ctxList, CTX_Z);
  const edge = (list: Tile[], k: number) => (list[k] ? list[k].x - list[k].w / 2 - GAP / 2 : X0);
  const fullCtx = packTiles(TURNS.map((m) => ({ key: `f${m.i}`, kind: m.kind, tokens: m.tokens })), CTX_Z);
  const sumTile = ctx[0];
  return (
    <group>
      <ShadowBlob position={[0, -0.12, 0.3]} scale={11} opacity={0.08} />
      <RoundedBox args={[11.6, 0.16, 5.6]} position={[0.3, -0.12, 0.45]} radius={0.06} smoothness={3} receiveShadow>
        <Physical color="#6E5440" rough={0.6} coat={0.15} />
      </RoundedBox>
      <Tier z={DISK_Z} width={9.6} label="disco" tone="ink" dark />
      <Tier z={CTX_Z} width={9.6} label="contexto" tone="teal" />
      {disk.map((t) => <TileMesh key={t.key} t={t} scaleH={0.7} />)}
      {ctx.map((t) => <TileMesh key={t.key} t={t} />)}
      <MemoryDrawer notes={step >= 1 ? 3 : 0} />
      {step === 1 && (
        <>
          <Flow points={[[X0 + 6.5, 0.8, CTX_Z], [2.2, 1.3, 1.6], [3.0, 0.6, 2.3]]} color={P.amber} count={3} size={0.05} speed={0.35} lineOpacity={0.35} />
          <Tag position={[2.2, 1.6, 1.6]} tone="amber" size="xs" center>memory flush</Tag>
        </>
      )}
      {step === 2 && (
        <>
          {raw !== cut && <Wedge x={edge(fullCtx, raw)} color={P.rose} ghost />}
          <Wedge x={edge(fullCtx, cut)} color="#B68442" />
          <Tag position={[edge(fullCtx, cut), 1.65, CTX_Z]} tone="amber" size="xs" center>{raw !== cut ? "corte ajustado" : "corte"}</Tag>
          <Tag position={[X0 + 2.0, 1.0, CTX_Z]} tone="violet" size="xs" center>a resumir</Tag>
        </>
      )}
      {compacted && sumTile && <Tag position={[sumTile.x, 1.05, CTX_Z]} tone="teal" size="xs" center>resumen</Tag>}
      {step === 3 && <Flow points={[[X0 + 2, 0.5, DISK_Z], [X0 + 0.8, 1.0, -0.3], [sumTile.x, 0.8, CTX_Z]]} color={P.teal} count={3} size={0.045} speed={0.4} lineOpacity={0.3} />}
      {step === 4 && <AuditGate x={pass ? sumTile.x : X0 + 0.6} pass={pass} />}
      {step === 4 && !pass && (
        <group position={[X0 + 0.6, 0.1, 1.75]}>
          <RoundedBox args={[0.5, 0.1, 0.5]} radius={0.02} smoothness={2} castShadow><Physical color={P.rose} coat={0.4} /></RoundedBox>
          <Tag position={[0, 0.35, 0]} tone="rose" size="xs" center>no se escribe</Tag>
        </group>
      )}
    </group>
  );
}

const STEPS = ["Cerca del límite", "Memory flush", "Punto de corte", "Resumen", "Auditoría safeguard"];

function SpanishVisual() {
  const [step, setStep] = useState(0);
  const [keep, setKeep] = useState(20_000);
  const [pass, setPass] = useState(true);
  const { raw, cut, moved } = useMemo(() => cutPoint(keep), [keep]);
  const total = sumTokens(TURNS);
  const kept = sumTokens(TURNS.slice(cut));
  const nextView = step === 3 || (step === 4 && pass) ? SUMMARY_TOKENS + kept : total;
  const text: ReactNode = [
    <>La transcripción tiene {TURNS.length} mensajes y {fmtN(total)} tokens: la sesión se acerca al límite de contexto (o el proveedor ya devolvió un error de overflow y OpenClaw compactará y reintentará).</>,
    <>Antes de compactar, OpenClaw recuerda al agente guardar lo importante: un turno silencioso de <strong>memory flush</strong> escribe notas durables en los archivos de memoria. Lo que esté ahí no depende de la calidad del resumen.</>,
    <>El corte se busca desde el final con <code>keepRecentTokens</code> = {fmtN(keep)}. {moved > 0 ? <>El presupuesto cortaría en el mensaje {raw + 1}, un <code>toolResult</code>: OpenClaw retrocede {moved} mensaje hasta su llamada para que el par quede junto. Se conservan {TURNS.length - cut} mensajes ({fmtN(kept)} tokens).</> : <>El corte cae en el mensaje {cut + 1}, que no parte ningún par de tool. Se conservan {TURNS.length - cut} mensajes ({fmtN(kept)} tokens).</>}</>,
    <>Los {cut} mensajes viejos se resumen en una entrada compacta; los recientes siguen intactos. En disco no cambia nada: compaction solo cambia lo que el modelo ve en el siguiente turno ({fmtN(nextView)} tokens en lugar de {fmtN(total)}).</>,
    pass
      ? <>Con <code>mode: &quot;safeguard&quot;</code> (por defecto en configs nuevos), el resumen debe conservar los headings requeridos, las peticiones pendientes y los identificadores exactos (<code>identifierPolicy: &quot;strict&quot;</code>). Pasa: se guarda en la transcripción y la sesión conserva su identidad.</>
      : <>El resumen perdió un identificador exacto. Tras los intentos correctivos configurados, compaction se detiene <strong>antes de escribir</strong>: el historial original se conserva y el modelo sigue viendo los {TURNS.length} mensajes.</>,
  ][step];
  return (
    <Figure
      label="Carrete de compaction · el disco no olvida"
      hint="keepRecentTokens · pares de tool · safeguard"
      height="h-[460px] md:h-[560px]"
      legend={[{ color: P.amber, label: "usuario" }, { color: "#6F7A86", label: "toolCall" }, { color: "#B9B3A4", label: "toolResult" }, { color: P.violet, label: "assistant" }, { color: P.teal, label: "resumen" }]}
      controls={
        <>
          <div className="flex items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Paso de la compaction">
            <button type="button" className="chip min-w-8 px-2" disabled={step === 0} aria-label="Paso anterior" onClick={() => setStep(step - 1)}>←</button>
            <span className="px-1 font-mono text-[0.6rem] tabular-nums text-muted">paso {step + 1}/5</span>
            <button type="button" className="chip min-w-8 px-2" disabled={step === 4} aria-label="Paso siguiente" onClick={() => setStep(step + 1)}>→</button>
          </div>
          <Knob label="keepRecentTokens" value={keep} min={6_000} max={30_000} step={1_000} onChange={setKeep} format={(v) => `${Math.round(v / 1000)}K`} tone="var(--amber)" />
          <Switcher value={pass ? "ok" : "bad"} onChange={(v) => setPass(v === "ok")} ariaLabel="Calidad del resumen" options={[{ value: "ok", label: "Resumen completo", tone: P.teal }, { value: "bad", label: "Pierde un id", tone: P.rose }]} />
        </>
      }
      note={
        <div className="space-y-3">
          <p><strong>{STEPS[step]}.</strong> {text}</p>
          <Readout items={[
            { label: "en disco", value: `${TURNS.length} mensajes`, tone: "var(--ink)" },
            { label: "corte", value: `mensaje ${cut + 1}${moved ? ` (ajustado −${moved})` : ""}`, tone: "var(--amber)" },
            { label: "el modelo verá", value: `${fmtN(nextView)} tokens`, tone: "var(--teal)" },
            { label: "sessionId", value: "sin cambios" },
          ]} />
          <p className="text-xs text-muted">Tamaños de mensaje didácticos, elegidos para que el corte por defecto (20.000) caiga dentro de un par de tool. El tamaño del resumen ({fmtN(SUMMARY_TOKENS)} tokens) es ilustrativo. El compactador SQLite integrado conserva el sessionId; <code>/new</code> es otra operación.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 7.2, 8.4], fov: 34 }} fit={1.05}>
        <ReelScene step={step} keep={keep} pass={pass} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Step = "a" | "b" | "c" | "d" | "e";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "summarise": "summarise",
      "safeguard": "safeguard",
      "flush": "flush",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "summarise": "resume",
      "safeguard": "salvaguarda",
      "flush": "purga",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: t.summarise, tone: "var(--teal)" },
    { value: "b" as const, label: "tool pairs", tone: "var(--teal)" },
    { value: "c" as const, label: t.safeguard, tone: "var(--violet)" },
    { value: "d" as const, label: t.flush, tone: "var(--amber)" },
    { value: "e" as const, label: "/compact", tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: safeguard compaction"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-compaction diagram steps"
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
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "a" ? P.teal : P.lineStrong}
        fill={active === "a" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.summarise}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        tool pairs
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.safeguard}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.flush}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        /compact
      </Tag>
    </group>
  );
}

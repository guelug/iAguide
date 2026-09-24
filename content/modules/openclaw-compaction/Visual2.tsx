"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Tres cuchillos, tres cosas que cortan.
 *
 * La misma transcripción didáctica que en la lámina principal. Compaction
 * resume lo viejo y lo guarda en la transcripción; pruning recorta
 * resultados de tool viejos solo en memoria, para una petición; reset
 * (/new) acuña un sessionId nuevo. Se dibujan tres cosas: la ficha de
 * identidad, la transcripción en disco y lo que recibe el modelo.
 */

type Knife = "compaction" | "pruning" | "reset";

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

const KEEP_RECENT = 20_000;
const PRUNE_KEEP_RESULTS = 2; // didáctico: resultados de tool recientes que pruning no toca
const PRUNE_STUB = 20;

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


const DISK_Z = -1.15;
const REQ_Z = 0.6;

function knifeView(knife: Knife) {
  const { cut } = cutPoint(KEEP_RECENT);
  const resultIdx = TURNS.filter((m) => m.kind === "result").map((m) => m.i);
  const recentResults = new Set(resultIdx.slice(-PRUNE_KEEP_RESULTS));
  if (knife === "compaction") {
    return {
      request: [{ key: "sum", kind: "summary" as const, tokens: SUMMARY_TOKENS }, ...TURNS.slice(cut).map((m) => ({ key: `r${m.i}`, kind: m.kind, tokens: m.tokens }))],
      disk: [...TURNS.map((m) => ({ key: `d${m.i}`, kind: m.kind, tokens: m.tokens })), { key: "dsum", kind: "summary" as const, tokens: SUMMARY_TOKENS }],
      oldDisk: null,
    };
  }
  if (knife === "pruning") {
    return {
      request: TURNS.map((m) => ({ key: `r${m.i}`, kind: m.kind, tokens: m.kind === "result" && !recentResults.has(m.i) ? PRUNE_STUB : m.tokens, tint: m.kind === "result" && !recentResults.has(m.i) ? P.rose : undefined })),
      disk: TURNS.map((m) => ({ key: `d${m.i}`, kind: m.kind, tokens: m.tokens })),
      oldDisk: null,
    };
  }
  return {
    request: [{ key: "rnew", kind: "user" as const, tokens: 300 }],
    disk: [{ key: "dnew", kind: "user" as const, tokens: 300 }],
    oldDisk: TURNS.map((m) => ({ key: `o${m.i}`, kind: m.kind, tokens: m.tokens, tint: mixHex(P.paper, KIND_STYLE[m.kind].color, 0.35) })),
  };
}

function IdCard({ id, position, tone }: { id: string; position: V3; tone: "teal" | "rose" | "muted" }) {
  const color = tone === "teal" ? P.teal : tone === "rose" ? P.rose : "#B9B3A4";
  return (
    <group position={position}>
      <RoundedBox args={[0.8, 1.05, 0.14]} position={[0, 0.55, 0]} radius={0.05} smoothness={3} castShadow receiveShadow><Physical color={color} coat={0.55} /></RoundedBox>
      <mesh position={[0, 0.82, 0.08]}><circleGeometry args={[0.09, 20]} /><meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.3} /></mesh>
      {[0.5, 0.36, 0.22].map((y) => <mesh key={y} position={[0, y, 0.075]}><boxGeometry args={[0.5, 0.03, 0.005]} /><meshBasicMaterial color="#F4EFE4" /></mesh>)}
      <Tag position={[0, 1.35, 0]} tone={tone} size="xs" center>{id}</Tag>
    </group>
  );
}

function KnifeScene({ knife }: { knife: Knife }) {
  const view = useMemo(() => knifeView(knife), [knife]);
  const req = packTiles(view.request, REQ_Z);
  const disk = packTiles(view.disk, DISK_Z);
  const old = view.oldDisk ? packTiles(view.oldDisk, DISK_Z - 1.25) : [];
  return (
    <group>
      <ShadowBlob position={[0, -0.12, 0]} scale={11} opacity={0.08} />
      <RoundedBox args={[12.2, 0.16, 6.4]} position={[0.1, -0.12, -0.2]} radius={0.06} smoothness={3} receiveShadow>
        <Physical color="#6E5440" rough={0.6} coat={0.15} />
      </RoundedBox>
      <Tier z={DISK_Z} width={9.8} label={knife === "reset" ? "transcripción nueva" : "transcripción"} tone="ink" dark />
      <Tier z={REQ_Z} width={9.8} label="lo que ve el modelo" tone="teal" />
      {view.oldDisk && <Tier z={DISK_Z - 1.25} width={9.8} label="archivos viejos" tone="muted" dark />}
      {disk.map((t) => <TileMesh key={t.key} t={t} scaleH={0.7} />)}
      {old.map((t) => <TileMesh key={t.key} t={t} scaleH={0.55} />)}
      {req.map((t) => <TileMesh key={t.key} t={t} />)}
      {knife === "reset"
        ? <><IdCard id="id nuevo" position={[X0 - 1.0, 0, REQ_Z - 0.3]} tone="rose" /><IdCard id="id anterior" position={[X0 - 1.0, 0, DISK_Z - 1.1]} tone="muted" /></>
        : <IdCard id="mismo id" position={[X0 - 1.0, 0, -0.3]} tone="teal" />}
      {knife === "compaction" && <Tag position={[req[0].x, 1.05, REQ_Z]} tone="teal" size="xs" center>resumen</Tag>}
      {knife === "compaction" && <Tag position={[disk[disk.length - 1].x, 0.85, DISK_Z]} tone="teal" size="xs" center>guardado</Tag>}
      {knife === "pruning" && <Tag position={[X0 + 2.2, 0.95, REQ_Z]} tone="rose" size="xs" center>recortado en memoria</Tag>}
    </group>
  );
}

const ROWS: { label: string; values: Record<Knife, string> }[] = [
  { label: "Qué hace", values: { compaction: "Resume conversación vieja", pruning: "Recorta resultados de tool viejos", reset: "Acuña un sessionId nuevo" } },
  { label: "¿Guardado?", values: { compaction: "Sí, en la transcripción", pruning: "No, en memoria por petición", reset: "Id nuevo; los archivos pueden quedar" } },
  { label: "Alcance", values: { compaction: "Toda la conversación", pruning: "Solo resultados de tool", reset: "Identidad de sesión" } },
];

function SpanishVisual() {
  const [knife, setKnife] = useState<Knife>("compaction");
  const view = useMemo(() => knifeView(knife), [knife]);
  const total = sumTokens(TURNS);
  const seen = view.request.reduce((a, m) => a + m.tokens, 0);
  const text: Record<Knife, ReactNode> = {
    compaction: <>Los mensajes viejos se sustituyen por un resumen que <strong>se guarda en la transcripción</strong>; la cola reciente ({fmtN(KEEP_RECENT)} tokens de <code>keepRecentTokens</code>) sigue intacta. La ficha de identidad no cambia: el compactador SQLite conserva el sessionId.</>,
    pruning: <>Session pruning recorta los resultados de tool viejos <strong>solo en la petición</strong> que sale hacia el modelo; la transcripción en disco no cambia y no se guarda nada. Es lo primero que conviene probar si compacta demasiado a menudo por outputs grandes.</>,
    reset: <><code>/new</code> arranca una sesión fresca sin compactar: <strong>sessionId nuevo</strong> y contexto vacío. Los archivos de la sesión anterior pueden quedar en disco, pero ya no son la sesión viva. No lo actives «porque el resumen pierde cosas» salvo que quieras de verdad otra identidad.</>,
  };
  return (
    <Figure
      label="Tres cuchillos · compaction, pruning y reset"
      hint="identidad · transcripción · petición"
      height="h-[460px] md:h-[560px]"
      legend={[{ color: P.teal, label: "resumen / identidad" }, { color: P.rose, label: "recorte o id nuevo" }, { color: P.violet, label: "assistant" }, { color: "#B9B3A4", label: "toolResult" }]}
      controls={<Switcher value={knife} onChange={setKnife} ariaLabel="Operación" options={[{ value: "compaction", label: "Compaction", tone: P.teal }, { value: "pruning", label: "Pruning", tone: P.rose }, { value: "reset", label: "Reset (/new)", tone: P.violet }]} />}
      note={
        <div className="space-y-3">
          <p>{text[knife]}</p>
          <Readout items={[
            { label: "tokens a la vista del modelo", value: `${fmtN(seen)} de ${fmtN(total)}`, tone: "var(--teal)" },
            { label: "transcripción en disco", value: knife === "compaction" ? "+1 entrada de resumen" : knife === "pruning" ? "sin cambios" : "nueva, vacía" },
            { label: "sessionId", value: knife === "reset" ? "nuevo" : "el mismo", tone: knife === "reset" ? "var(--rose)" : "var(--teal)" },
          ]} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-left text-xs">
              <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1" />{(["compaction", "pruning", "reset"] as Knife[]).map((k) => <th key={k} className={`border-b border-line px-2 py-1 ${k === knife ? "text-ink" : ""}`}>{k}</th>)}</tr></thead>
              <tbody>{ROWS.map((r) => <tr key={r.label}><td className="border-b border-line/60 px-2 py-1 font-mono text-muted">{r.label}</td>{(["compaction", "pruning", "reset"] as Knife[]).map((k) => <td key={k} className={`border-b border-line/60 px-2 py-1 ${k === knife ? "text-ink" : "text-muted"}`}>{r.values[k]}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="text-xs text-muted">Transcripción didáctica de {TURNS.length} mensajes. La regla de pruning dibujada (se respetan los {PRUNE_KEEP_RESULTS} resultados de tool más recientes) es ilustrativa: la política real está en la página Session pruning de OpenClaw.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 7.2, 8.4], fov: 34 }} fit={1.05}>
        <KnifeScene knife={knife} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Mode = "compact" | "safeguard" | "reset";
const COPY = {
  en: { title: "compaction preserves the session", hint: "summary · safeguard · reset", compact: "compact", safeguard: "safeguard", reset: "reset", old: "old turns", recent: "recent", summary: "summary", history: "full history", quality: "quality gate", same: "same session", fresh: "new session", tool: "tool pair" },
  es: { title: "compactar conserva la sesión", hint: "resumen · safeguard · reset", compact: "compacta", safeguard: "safeguard", reset: "reset", old: "turnos viejos", recent: "recientes", summary: "resumen", history: "historial completo", quality: "puerta de calidad", same: "misma sesión", fresh: "sesión nueva", tool: "par tool" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("compact");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.recent }, { color: P.violet, label: t.summary }, { color: P.amber, label: t.history }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "compact", label: t.compact, tone: P.teal }, { value: "safeguard", label: t.safeguard, tone: P.violet }, { value: "reset", label: t.reset, tone: P.rose }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "compact" && <><Slab position={[-1.7, 0.2, 0]} size={[1.75, 1.1, 0.12]} color={P.violet} fill={0.22} /><Tag position={[-1.7, 0.83, 0.15]} tone="violet">{t.old}</Tag><Ribbon points={[[-0.65, 0.2, 0], [0.65, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.75, 1.1, 0.12]} color={P.teal} fill={0.24} /><Tag position={[1.7, 0.83, 0.15]} tone="teal">{t.summary}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.recent} intactos · {t.tool} no se separa</Tag></>}
        {mode === "safeguard" && <><Halo position={[0, 0.2, 0]} radius={1.25} color={P.violet} opacity={0.35} spin={0.12} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[0, 0.8, 0.15]} tone="violet">{t.quality}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">headings</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">pending asks</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">si falla, conserva el original</Tag></>}
        {mode === "reset" && <><Slab position={[-1.7, 0.2, 0]} size={[1.75, 0.9, 0.12]} color={P.teal} fill={0.24} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">/compact</Tag><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.18} pulse={0.3} /><Tag position={[0, 0.72, 0.15]} tone="violet">{t.same}</Tag><Slab position={[1.7, 0.2, 0]} size={[1.75, 0.9, 0.12]} color={P.rose} fill={0.24} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">/new</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">/compact ≠ {t.fresh}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

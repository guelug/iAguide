"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Group } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Flow, Node3D, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Banco de compresión de Hermes.
 *
 * Una conversación didáctica de 45 mensajes (≈ 95K tokens, la foto «antes»
 * de la página oficial) se dibuja como una fila de bloques cuyo ancho es su
 * número de tokens, sobre una regla que mide la ventana del modelo. Los dos
 * umbrales (bucle 50 %, gateway 85 %) son marcas en esa regla. El algoritmo
 * de cuatro fases se calcula de verdad con los defaults del compresor:
 * protect_first_n 3, protect_last_n 20, target_ratio 0,20, resumen = 20 %
 * del medio con mínimo 2.000 y máximo min(5 % de la ventana, 12.000).
 */

type Role = "system" | "user" | "assistant" | "call" | "tool";
type Msg = { i: number; role: Role; tokens: number };
type BenchMode = "thresholds" | "phases" | "inplace";

const PROTECT_FIRST = 3;
const PROTECT_LAST = 20;
const TARGET_RATIO = 0.2;
const STUB = 12; // «[Old tool output cleared to save context space]»

function unit(i: number, salt: number) {
  let x = (Math.imul(i, 374761393) + Math.imul(salt, 668265263)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function buildConversation(): Msg[] {
  const roles: [Role, number][] = [["system", 1800], ["user", 350], ["assistant", 900]];
  while (roles.length < 40) {
    roles.push(["call", 220]);
    roles.push(["tool", Math.round(3200 + unit(roles.length, 3) * 4400)]);
    if (roles.length % 7 === 0) roles.push(["assistant", 420]);
  }
  roles.length = 40;
  // the tail from the official example: «Fix the failing tests», read_file, «Great, also add error handling»
  roles.push(["user", 60], ["call", 200], ["tool", 2600], ["assistant", 500], ["user", 50]);
  return roles.map(([role, tokens], i) => ({ i, role, tokens }));
}

const CONVERSATION = buildConversation();
const sum = (xs: Msg[]) => xs.reduce((a, m) => a + m.tokens, 0);

type Plan = {
  threshold: number;
  gateway: number;
  pruned: Msg[];
  prunedCount: number;
  headEnd: number;
  tailStart: number;
  aligned: number;
  summary: number;
  summaryMax: number;
  after: Msg[];
};

function plan(ctx: number): Plan {
  const threshold = 0.5 * ctx;
  const gateway = 0.85 * ctx;
  const n = CONVERSATION.length;
  // phase 1: prune tool outputs (> 200 chars ≈ 50 tokens) outside the protected tail
  let prunedCount = 0;
  const pruned = CONVERSATION.map((m) => {
    if (m.role === "tool" && m.i < n - PROTECT_LAST && m.tokens > 50) { prunedCount += 1; return { ...m, tokens: STUB }; }
    return m;
  });
  // phase 2: walk the tail by token budget, fall back to protect_last_n, then align to the parent call
  const budget = TARGET_RATIO * threshold;
  let acc = 0;
  let start = n;
  while (start > PROTECT_FIRST && acc + pruned[start - 1].tokens <= budget) { acc += pruned[start - 1].tokens; start -= 1; }
  let tailStart = Math.min(start, n - PROTECT_LAST);
  const beforeAlign = tailStart;
  while (tailStart > PROTECT_FIRST && pruned[tailStart].role === "tool") tailStart -= 1;
  const headEnd = PROTECT_FIRST;
  // phase 3: structured summary budget
  const middle = pruned.slice(headEnd, tailStart);
  const summaryMax = Math.min(ctx * 0.05, 12000);
  const summary = Math.round(Math.min(summaryMax, Math.max(2000, sum(middle) * 0.2)));
  // phase 4: head + summary + untouched tail
  const after: Msg[] = [...pruned.slice(0, headEnd), { i: -1, role: "assistant", tokens: summary }, ...pruned.slice(tailStart)];
  return { threshold, gateway, pruned, prunedCount, headEnd, tailStart, aligned: beforeAlign - tailStart, summary, summaryMax, after };
}

const fmtK = (n: number) => `${(n / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })}K`;
const fmtN = (n: number) => Math.round(n).toLocaleString("es-ES");

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

/** Moves (and scales along x) towards a target; snaps when motion is paused. */
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

/* ------------------------------------------------------------ geometry */

const RAIL = 9;
const X0 = -RAIL / 2;
const MIN_W = 0.035;
const GAP = 0.012;

const ROLE_STYLE: Record<Role, { color: string; h: number }> = {
  system: { color: P.teal, h: 0.52 },
  user: { color: P.amber, h: 0.42 },
  assistant: { color: P.violet, h: 0.32 },
  call: { color: "#6F7A86", h: 0.24 },
  tool: { color: "#B9B3A4", h: 0.3 },
};

type Placed = { key: string; role: Role; x: number; w: number; y: number; z: number; summary?: boolean };

function pack(list: { key: string; role: Role; tokens: number; summary?: boolean }[], scale: number, start = X0, gapAfter: Record<number, number> = {}): Placed[] {
  let cursor = start;
  return list.map((m, k) => {
    const w = Math.max(MIN_W, m.tokens * scale);
    const placed = { key: m.key, role: m.role, x: cursor + w / 2, w, y: 0, z: 0, summary: m.summary };
    cursor += w + GAP + (gapAfter[k] ?? 0);
    return placed;
  });
}

/** Where every original message sits at a given step of the four-phase algorithm. */
function layout(p: Plan, ctx: number, step: number): { blocks: Placed[]; summary: Placed | null } {
  const s = RAIL / ctx;
  const src = step === 0 ? CONVERSATION : p.pruned;
  const items = src.map((m) => ({ key: `m${m.i}`, role: m.role, tokens: m.tokens }));
  if (step <= 1) return { blocks: pack(items, s), summary: null };
  const gaps = { [p.headEnd - 1]: 0.28, [p.tailStart - 1]: 0.28 };
  const opened = pack(items, s, X0, gaps);
  if (step === 2) return { blocks: opened, summary: null };
  const head = items.slice(0, p.headEnd);
  const tail = items.slice(p.tailStart);
  const summaryItem = { key: "summary", role: "assistant" as Role, tokens: p.summary, summary: true };
  const assembled = pack([...head, summaryItem, ...tail], s, X0, step === 3 ? { [p.headEnd - 1]: 0.28, [p.headEnd]: 0.28 } : {});
  const byKey = new Map(assembled.map((b) => [b.key, b]));
  // middle messages leave the live list: they drop into the archive drawer in front of the rail
  const blocks = opened.map((b, k) => {
    if (k >= p.headEnd && k < p.tailStart) {
      const col = k - p.headEnd;
      return { ...b, x: -3.6 + (col % 11) * 0.3, w: 0.22, y: -0.55 - Math.floor(col / 11) * 0.0, z: 1.25 + Math.floor(col / 11) * 0.34 };
    }
    return byKey.get(b.key) ?? b;
  });
  return { blocks, summary: byKey.get("summary") ?? null };
}

function Block({ b, dim = false }: { b: Placed; dim?: boolean }) {
  const st = ROLE_STYLE[b.role];
  const h = b.summary ? 0.46 : st.h;
  const color = b.summary ? P.violetDeep : st.color;
  return (
    <Ease to={[b.x, b.y + h / 2 + 0.06, b.z]} sx={b.w}>
      <RoundedBox args={[1, h, 0.62]} radius={0.012} smoothness={2} castShadow receiveShadow>
        <Physical color={dim ? mixHex(P.paper, color, 0.35) : color} rough={0.4} coat={0.5} />
      </RoundedBox>
    </Ease>
  );
}

function Rail({ ctx, fill, threshold, gateway }: { ctx: number; fill: number; threshold: number; gateway: number }) {
  const s = RAIL / ctx;
  const gate = (x: number, color: string) => (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.55, -0.42]} castShadow><boxGeometry args={[0.035, 1.1, 0.035]} /><meshStandardMaterial color={color} roughness={0.35} metalness={0.3} /></mesh>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.02, 0.02, 0.9]} /><meshBasicMaterial color={color} /></mesh>
    </group>
  );
  return (
    <group>
      <ShadowBlob position={[0, -0.3, 0.3]} scale={11} opacity={0.08} />
      <RoundedBox args={[RAIL + 0.6, 0.14, 1.2]} position={[0, -0.07, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <Physical color="#263532" rough={0.4} coat={0.3} metal={0.3} />
      </RoundedBox>
      <RoundedBox args={[RAIL + 1.0, 0.18, 3.2]} position={[0, -0.25, 0.6]} radius={0.06} smoothness={3} receiveShadow>
        <Physical color="#6E5440" rough={0.6} coat={0.15} />
      </RoundedBox>
      {/* ruler ticks every 10 % of the window */}
      {Array.from({ length: 11 }, (_, k) => (
        <mesh key={k} position={[X0 + (k * RAIL) / 10, 0.005, 0.55]}><boxGeometry args={[0.012, 0.01, k % 5 === 0 ? 0.14 : 0.07]} /><meshBasicMaterial color="#C9C3B5" /></mesh>
      ))}
      {/* fill: how much of the window the prompt occupies */}
      <mesh position={[X0 + (Math.min(fill, ctx) * s) / 2, 0.004, 0.5]}><boxGeometry args={[Math.min(fill, ctx) * s, 0.008, 0.05]} /><meshBasicMaterial color={fill >= gateway ? P.rose : fill >= threshold ? P.amber : P.teal} /></mesh>
      {gate(X0 + threshold * s, P.amber)}
      {gate(X0 + gateway * s, P.rose)}
      <Tag position={[X0 + threshold * s, 1.25, -0.42]} tone="amber" size="xs" center>bucle 50 %</Tag>
      <Tag position={[X0 + gateway * s, 1.25, -0.42]} tone="rose" size="xs" center>gateway 85 %</Tag>
      <Tag position={[X0 + RAIL, -0.1, 0.75]} tone="muted" size="xs" center>{`ventana ${fmtK(ctx)}`}</Tag>
    </group>
  );
}

function SessionChip({ id, position, tone, dim = false }: { id: string; position: V3; tone: "teal" | "violet" | "muted"; dim?: boolean }) {
  const color = tone === "teal" ? P.teal : tone === "violet" ? P.violet : P.lineStrong;
  return (
    <group position={position}>
      <RoundedBox args={[0.7, 0.9, 0.12]} position={[0, 0.45, 0]} radius={0.04} smoothness={3} castShadow receiveShadow>
        <Physical color={dim ? mixHex(P.paper, color, 0.3) : color} coat={0.55} />
      </RoundedBox>
      <mesh position={[0, 0.72, 0.07]}><circleGeometry args={[0.07, 20]} /><meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.3} /></mesh>
      <Tag position={[0, 1.15, 0]} tone={tone} size="xs" center>{id}</Tag>
    </group>
  );
}

function ArchiveTray({ label }: { label: string }) {
  return (
    <group position={[-2.1, -0.62, 1.42]}>
      <RoundedBox args={[3.6, 0.1, 0.95]} radius={0.04} smoothness={2} receiveShadow castShadow>
        <Physical color="#DAD4C6" rough={0.6} coat={0.2} />
      </RoundedBox>
      {[-0.46, 0.46].map((z) => (
        <mesh key={z} position={[0, 0.1, z]}><boxGeometry args={[3.6, 0.12, 0.03]} /><meshStandardMaterial color="#B9B3A4" roughness={0.6} /></mesh>
      ))}
      <Tag position={[0, -0.2, 0.62]} tone="muted" size="xs" center>{label}</Tag>
    </group>
  );
}

const STEP_NAMES = ["Antes", "1 · Podar", "2 · Fronteras", "3 · Resumen", "4 · Ensamblar"];

function BenchScene({ mode, ctx, step, growth, inPlace, p }: { mode: BenchMode; ctx: number; step: number; growth: number; inPlace: boolean; p: Plan }) {
  const shown = mode === "thresholds" ? 0 : mode === "inplace" ? 4 : step;
  const { blocks, summary } = useMemo(() => layout(p, ctx, shown), [p, ctx, shown]);
  const s = RAIL / ctx;
  const liveTokens = shown === 4 ? sum(p.after) : shown >= 1 ? sum(p.pruned) : sum(CONVERSATION);
  const fill = liveTokens + (mode === "thresholds" ? growth : 0);
  const headX = X0 + 0.1;
  const opened = shown === 2 || shown === 3;
  const midX = blocks[p.headEnd]?.x ?? 0;
  const tailX = blocks[p.tailStart]?.x ?? 0;
  return (
    <group>
      <Rail ctx={ctx} fill={fill} threshold={p.threshold} gateway={p.gateway} />
      {blocks.map((b) => <Block key={b.key} b={b} dim={shown >= 3 && b.z > 0.5} />)}
      {summary && <Block key="summary" b={summary} />}
      {mode === "thresholds" && growth > 0 && (
        <Ease to={[X0 + sum(CONVERSATION) * s + (growth * s) / 2 + 0.03, 0.26, 0]} sx={growth * s}>
          <RoundedBox args={[1, 0.4, 0.62]} radius={0.012} smoothness={2} castShadow><Physical color={P.rose} coat={0.5} /></RoundedBox>
        </Ease>
      )}
      {mode === "thresholds" && growth > 0 && <Tag position={[X0 + sum(CONVERSATION) * s + (growth * s) / 2, 0.85, 0.3]} tone="rose" size="xs" center>noche en Discord</Tag>}
      {opened && (
        <>
          <Tag position={[headX, 0.85, 0.35]} tone="teal" size="xs" center>cabeza</Tag>
          {shown === 2 && <Tag position={[midX + 1.0, 0.85, 0.35]} tone="violet" size="xs" center>medio</Tag>}
          <Tag position={[shown === 2 ? tailX + 0.6 : X0 + sum(p.after) * s * 0.75, 0.85, 0.35]} tone="amber" size="xs" center>cola intacta</Tag>
        </>
      )}
      {shown === 3 && summary && (
        <>
          <Flow points={[[-2.2, -0.45, 1.3], [summary.x - 0.6, 0.4, 0.8], [summary.x, 0.62, 0.1]]} color={P.violet} count={4} size={0.045} speed={0.4} lineOpacity={0.3} />
          <Tag position={[summary.x, 1.0, 0.1]} tone="violet" size="xs" center>resumen</Tag>
        </>
      )}
      {shown === 1 && <Tag position={[X0 + 1.2, 0.8, 0.3]} tone="muted" size="xs" center>salidas podadas</Tag>}
      {shown >= 3 && <ArchiveTray label={mode === "inplace" && !inPlace ? "sesión padre" : "archivados · active=0"} />}
      {mode === "inplace" ? (
        inPlace ? (
          <SessionChip id="sesión a1b2" position={[X0 - 0.75, -0.05, 0]} tone="teal" />
        ) : (
          <>
            <SessionChip id="sesión c3d4" position={[X0 - 0.75, -0.05, 0]} tone="violet" />
            <SessionChip id="padre a1b2" position={[X0 - 0.75, -0.05, 1.45]} tone="muted" dim />
            <Arrow from={[X0 - 0.75, 0.3, 0.25]} to={[X0 - 0.75, 0.3, 1.3]} color={P.violet} width={1.4} />
          </>
        )
      ) : (
        <SessionChip id="sesión a1b2" position={[X0 - 0.75, -0.05, 0]} tone="teal" />
      )}
    </group>
  );
}

function StillProbe({ onChange }: { onChange: (still: boolean) => void }) {
  const { still } = useStage();
  useLayoutEffect(() => onChange(still), [still, onChange]);
  return null;
}

const CTX_OPTIONS = [128_000, 200_000, 262_144];

function SpanishVisual() {
  const [mode, setMode] = useState<BenchMode>("phases");
  const [ctxKey, setCtxKey] = useState("128000");
  const [growth, setGrowth] = useState(15_000);
  const [inPlace, setInPlace] = useState(true);
  const [step, setStep] = useState(0);
  const [, setStill] = useState(false);
  const ctx = Number(ctxKey);
  const p = useMemo(() => plan(ctx), [ctx]);
  const before = sum(CONVERSATION);
  const afterTokens = sum(p.after);
  const middleCount = p.tailStart - p.headEnd;
  const prompt = before + growth;
  const loopFires = before >= p.threshold;
  const gatewayFires = prompt >= p.gateway;

  let body: ReactNode;
  if (mode === "thresholds") {
    body = (
      <>
        <p><strong>Dos compresores, dos momentos.</strong> Con una ventana de {fmtK(ctx)}, el compresor del bucle dispara a {fmtN(p.threshold)} tokens (50 %) usando los tokens exactos que devuelve la API; la higiene del gateway dispara a {fmtN(p.gateway)} (85 %) antes de que corra el agente, para sesiones que crecieron entre turnos.</p>
        <p>{gatewayFires
          ? `La conversación (${fmtK(before)}) más ${fmtK(growth)} llegados durante la noche suman ${fmtK(prompt)}: cruzan el 85 % y el gateway comprime antes de llamar al modelo, en lugar de devolver un error 400.`
          : loopFires
            ? `La conversación (${fmtK(before)}) ya supera el 50 %: el bucle la comprimirá en el siguiente paso. Con ${fmtK(growth)} de crecimiento nocturno (${fmtK(prompt)}) el gateway todavía no interviene.`
            : `Con ${fmtK(prompt)} ninguno de los dos dispara: el umbral se calcula siempre sobre la ventana del modelo principal, no del modelo de resumen.`}</p>
      </>
    );
  } else if (mode === "phases") {
    const text = [
      `Antes: ${CONVERSATION.length} mensajes y ${fmtK(before)} tokens. Cada bloque mide lo que ocupa en la ventana.`,
      `Fase 1, sin LLM: ${p.prunedCount} salidas de tools fuera de la cola protegida se sustituyen por «[Old tool output cleared…]». Quedan ${fmtK(sum(p.pruned))}.`,
      `Fase 2: cabeza = ${PROTECT_FIRST} mensajes (system y primer intercambio). La cola se recorre desde el final con un presupuesto de ${fmtN(TARGET_RATIO * p.threshold)} tokens (20 % del umbral) y nunca baja de ${PROTECT_LAST} mensajes${p.aligned > 0 ? `; la frontera retrocede ${p.aligned} mensaje para no separar una tool_call de su resultado` : "; la frontera ya cae en un mensaje que no parte ningún par de tool"}. Medio: ${middleCount} mensajes.`,
      `Fase 3: el medio se resume con la plantilla Goal / Progress / Key Decisions / Relevant Files / Next Steps… Presupuesto = 20 % del medio, entre 2.000 y ${fmtN(p.summaryMax)} → ${fmtN(p.summary)} tokens.`,
      `Fase 4: cabeza + resumen + cola sin tocar = ${p.after.length} mensajes y ${fmtK(afterTokens)} tokens. Los mensajes del medio no se borran: pasan al archivo.`,
    ][step];
    body = <p><strong>{STEP_NAMES[step]}.</strong> {text}</p>;
  } else {
    body = inPlace
      ? <p><strong>in_place: true (por defecto).</strong> La compactación reescribe la lista viva con el mismo id de sesión. Los {middleCount} mensajes del medio quedan archivados en blando (<code>active=0</code>, <code>compacted=1</code>) y <code>session_search</code> los sigue encontrando. El evento <code>session:compress</code> lleva <code>old_session_id</code> vacío.</p>
      : <p><strong>in_place: false (camino legado).</strong> Cada compactación confirma un id nuevo enlazado por <code>parent_session_id</code>. Los turnos antiguos se quedan en la sesión padre, que ya no es la viva: un consumidor que compara ids verá un cambio que el modo por defecto no produce.</p>;
  }

  return (
    <Figure
      label="Banco de compresión · dos umbrales y cuatro fases"
      hint="ancho del bloque = tokens del mensaje"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "system" },
        { color: P.amber, label: "usuario" },
        { color: P.violet, label: "assistant / resumen" },
        { color: "#6F7A86", label: "tool_call" },
        { color: "#B9B3A4", label: "resultado tool" },
      ]}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Vista del banco" options={[
            { value: "thresholds", label: "Umbrales", tone: P.amber },
            { value: "phases", label: "4 fases", tone: P.violet },
            { value: "inplace", label: "In-place", tone: P.teal },
          ]} />
          <Switcher value={ctxKey} onChange={setCtxKey} ariaLabel="Ventana del modelo principal" options={CTX_OPTIONS.map((c) => ({ value: String(c), label: fmtK(c), tone: P.inkSoft }))} />
          {mode === "phases" && (
            <div className="flex items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Fase del algoritmo">
              <button type="button" className="chip min-w-8 px-2" disabled={step === 0} aria-label="Fase anterior" onClick={() => setStep(Math.max(0, step - 1))}>←</button>
              <span className="px-1 font-mono text-[0.6rem] tabular-nums text-muted">fase {step}/4</span>
              <button type="button" className="chip min-w-8 px-2" disabled={step === 4} aria-label="Fase siguiente" onClick={() => setStep(Math.min(4, step + 1))}>→</button>
            </div>
          )}
          {mode === "thresholds" && <Knob label="crecimiento nocturno" value={growth} min={0} max={60_000} step={5_000} onChange={setGrowth} format={fmtK} tone="var(--rose)" />}
          {mode === "inplace" && <Switcher value={inPlace ? "on" : "off"} onChange={(v) => setInPlace(v === "on")} ariaLabel="in_place" options={[{ value: "on", label: "in_place: true", tone: P.teal }, { value: "off", label: "in_place: false", tone: P.violet }]} />}
        </>
      }
      note={
        <div className="space-y-3">
          {body}
          <Readout items={[
            { label: "umbral bucle", value: fmtN(p.threshold), tone: "var(--amber)" },
            { label: "higiene gateway", value: fmtN(p.gateway), tone: "var(--rose)" },
            { label: "antes", value: `${CONVERSATION.length} msj · ${fmtK(before)}` },
            { label: "después", value: `${p.after.length} msj · ${fmtK(afterTokens)}`, tone: "var(--violet)" },
          ]} />
          <p className="text-xs text-muted">Conversación didáctica generada en el código para parecerse a la foto «antes» de la documentación (45 mensajes, unos 95K tokens). Defaults del compresor integrado: threshold 0,50, target_ratio 0,20, protect_first_n 3, protect_last_n 20. Los bloques diminutos tienen un ancho mínimo para poder verlos.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.5, 4.2, 10.5], fov: 34 }} fit={1.05}>
        <StillProbe onChange={setStill} />
        <BenchScene mode={mode} ctx={ctx} step={step} growth={growth} inPlace={inPlace} p={p} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Step = "g85" | "a50" | "phase" | "inplace" | "s3";

const COPY = {
  en: {
    label: "Hermes: dual compression",
    hint: "step the diagram",
    gateway85: "gateway 85%",
    inLoop50: "in-loop 50%",
    fourPhases: "4 phases",
    inPlace: "in-place",
    systemAnd3: "system + 3",
    corePath: "core path",
    costVolatile: "cost / volatile",
    extension: "extension",
  },
  es: {
    label: "Hermes: compresión dual",
    hint: "recorre el diagrama",
    gateway85: "gateway 85%",
    inLoop50: "en el bucle 50%",
    fourPhases: "4 fases",
    inPlace: "in-place",
    systemAnd3: "sistema + 3",
    corePath: "ruta núcleo",
    costVolatile: "coste / volátil",
    extension: "extensión",
  },
};
type Copy = typeof COPY.en;

function LegacyVisual() {
  const t = useCopy(COPY);
  const [step, setStep] = useState<Step>("g85");

  const options = [
    { value: "g85" as const, label: t.gateway85, tone: "var(--amber)" },
    { value: "a50" as const, label: t.inLoop50, tone: "var(--teal)" },
    { value: "phase" as const, label: t.fourPhases, tone: "var(--violet)" },
    { value: "inplace" as const, label: t.inPlace, tone: "var(--teal)" },
    { value: "s3" as const, label: t.systemAnd3, tone: "var(--amber)" },
  ];

  return (
    <Figure
      label={t.label}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.corePath },
        { color: P.amber, label: t.costVolatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel={t.hint}
          value={step}
          onChange={setStep}
          options={options}
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

function Scene({ active, t }: { active: Step; t: Copy }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "g85" ? P.teal : P.lineStrong}
        fill={active === "g85" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.45, 0.0]} tone="teal" center>
        {t.gateway85}
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "a50" ? P.amber : P.lineStrong}
        fill={active === "a50" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.45, 0.0]} tone="amber" center>{t.inLoop50}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "phase" ? P.violet : P.lineStrong}
        fill={active === "phase" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.45, 0.0]} tone="violet" center>{t.fourPhases}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "inplace" ? P.teal : P.lineStrong}
        fill={active === "inplace" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.45, 0.0]} tone="teal" center>
        {t.inPlace}
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "s3" ? P.amber : P.lineStrong}
        fill={active === "s3" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        {t.systemAnd3}
      </Tag>
    </group>
  );
}

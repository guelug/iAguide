"use client";

import { useState } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, ShadowBlob, Arrow } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";

type Mode="lifecycle"|"agentic"|"abort";
const COPY={en:{label:"the loop owns a whole lifecycle",hint:"receive · act · stream · persist",lifecycle:"lifecycle",agentic:"agentic",abort:"abort",receive:"receive",act:"act",stream:"stream",persist:"persist",tool:"tool call",stop:"stop signal"},es:{label:"el bucle posee todo el ciclo de vida",hint:"recibe · actúa · emite · persiste",lifecycle:"ciclo",agentic:"agentic",abort:"aborta",receive:"recibe",act:"actúa",stream:"emite",persist:"persiste",tool:"llamada tool",stop:"señal stop"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("lifecycle");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.receive},{color:P.violet,label:t.act},{color:P.amber,label:t.persist}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"lifecycle",label:t.lifecycle,tone:P.teal},{value:"agentic",label:t.agentic,tone:P.violet},{value:"abort",label:t.abort,tone:P.rose}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="lifecycle"&&<>{[[t.receive,P.teal,-2],[t.act,P.violet,-.7],[t.stream,P.amber,.7],[t.persist,P.rose,2]].map(([lab,col,x],i)=><group key={lab as string}><Slab position={[x as number,.5,0]} size={[1.25,.8,.12]} color={col as string} fill={.24}/><Tag position={[x as number,1.05,.15]} tone={(["teal","violet","amber","rose"] as const)[i]} size="xs">{lab as string}</Tag>{i<3&&<Ribbon points={[[x as number+.65,.5,0],[(x as number)+.75,.5,0]]} color={P.lineStrong} radius={.035} opacity={.7}/>}</group>)}</>}
{mode==="agentic"&&<><Halo position={[0,.5,0]} radius={1.35} color={P.violet} opacity={.3} spin={.1}/><Node3D position={[0,.5,0]} color={P.violet} radius={.22} pulse={.3}/><Tag position={[0,1.05,.15]} tone="violet">while</Tag><Ribbon points={[[0,-.1,0],[-1.7,-.7,0]]} color={P.teal} radius={.04} opacity={.85}/><Slab position={[-2,-.85,0]} size={[1.3,.55,.1]} color={P.teal} fill={.24}/><Tag position={[-2,-.45,.15]} tone="teal" size="xs">{t.tool}</Tag><Ribbon points={[[0,.1,0],[1.8,-.7,0],[1.8,1.2,0],[.3,1.5,0]]} color={P.lineStrong} radius={.03} opacity={.7}/></>}
{mode==="abort"&&<><Node3D position={[0,.5,0]} color={P.amber} radius={.22} pulse={.3}/><Halo position={[0,.5,0]} radius={.7} color={P.amber} opacity={.55} spin={.2}/><Tag position={[0,1.05,.15]} tone="amber">final answer</Tag><Ribbon points={[[-2,.4,0],[2,1.0,0]]} color={P.rose} radius={.06} opacity={.95}/><Tag position={[2,1.35,.15]} tone="rose">{t.stop}</Tag></>}
</PointerTilt></Stage></Figure>}

/* ------------------------------------------------------------------ ES */

/*
 * Dos invariantes del bucle de Hermes, comprobados en código:
 *  1. Alternancia: nunca dos assistant ni dos user seguidos; sólo tool
 *     se apila, y sólo detrás de un assistant con tool_calls. El
 *     validador de abajo recorre la fila y marca cada junta inválida.
 *  2. Compresión: preflight al 50 % de la ventana, gateway al 85 %;
 *     se vuelca memoria, se resume el medio, se protegen los últimos 20
 *     mensajes (compression.protect_last_n) sin partir pares
 *     tool call/resultado, y nace una sesión hija.
 */

type Hl2Mode = "alternation" | "compression";
type Scenario = "tools" | "partial" | "cron";
type Row = { role: "system" | "user" | "assistant" | "tool"; label: string; calls?: boolean; partial?: boolean };

const SCENARIOS: Record<Scenario, Row[]> = {
  tools: [
    { role: "system", label: "system" },
    { role: "user", label: "user" },
    { role: "assistant", label: "assistant", calls: true },
    { role: "tool", label: "tool" },
    { role: "tool", label: "tool" },
    { role: "assistant", label: "assistant" },
  ],
  partial: [
    { role: "system", label: "system" },
    { role: "user", label: "user" },
    { role: "assistant", label: "parcial", partial: true },
    { role: "assistant", label: "assistant" },
  ],
  cron: [
    { role: "system", label: "system" },
    { role: "user", label: "user" },
    { role: "user", label: "cron" },
    { role: "assistant", label: "assistant" },
  ],
};

/** Returns, for each junction i (between row i and i+1), an error or null. */
function validate(rows: Row[]) {
  return rows.slice(0, -1).map((a, i) => {
    const b = rows[i + 1];
    if (a.role === "assistant" && b.role === "assistant") return "dos assistant seguidos";
    if (a.role === "user" && b.role === "user") return "dos user seguidos";
    if (b.role === "tool" && !(a.role === "tool" || (a.role === "assistant" && a.calls))) return "tool sin tool_calls";
    if (a.role === "assistant" && a.calls && b.role !== "tool") return "tool_calls sin filas tool";
    return null;
  });
}

const ROLE_TINT: Record<Row["role"], string> = { system: "#8d9398", user: P.amber, assistant: P.violet, tool: P.teal };

const H2 = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2" };

function H2Bench() {
  return (
    <group>
      <ShadowBlob position={[0, -0.38, 0]} scale={10} opacity={0.12} />
      <RoundedBox args={[9.2, 0.3, 5]} position={[0, -0.2, 0]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={H2.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[8.8, 0.07, 4.6]} position={[0, -0.02, 0]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={H2.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

function AlternationScene({ scenario }: { scenario: Scenario }) {
  const rows = SCENARIOS[scenario];
  const errors = validate(rows);
  const pitch = 1.3;
  const x0 = -((rows.length - 1) * pitch) / 2;
  const ok = errors.every((e) => !e);
  return (
    <group>
      {/* The rail the history is threaded on. */}
      <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, rows.length * pitch + 0.6, 12]} />
        <meshStandardMaterial color={H2.brass} metalness={0.75} roughness={0.28} />
      </mesh>
      {rows.map((r, i) => {
        const x = x0 + i * pitch;
        const tint = r.partial ? P.rose : ROLE_TINT[r.role];
        return (
          <group key={i} position={[x, 0, 0]}>
            <RoundedBox args={[1.0, 0.7, 0.5]} position={[0, 0.45, 0]} radius={0.08} smoothness={3} castShadow receiveShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, tint, 0.35)} roughness={0.42} clearcoat={0.45} transparent={r.partial} opacity={r.partial ? 0.7 : 1} />
            </RoundedBox>
            <mesh position={[0, 0.82, 0]}>
              <boxGeometry args={[0.84, 0.03, 0.34]} />
              <meshStandardMaterial color={tint} roughness={0.4} />
            </mesh>
            {r.calls ? (
              <mesh position={[0.34, 0.45, 0.27]}>
                <boxGeometry args={[0.18, 0.18, 0.04]} />
                <meshStandardMaterial color={P.teal} />
              </mesh>
            ) : null}
            <Tag position={[0, 1.12, 0]} tone={r.partial ? "rose" : "ink"} size="xs" center>
              <span className="normal-case">{r.label}</span>
            </Tag>
          </group>
        );
      })}
      {/* Junction clamps: brass when valid, rose and open when not. */}
      {errors.map((e, i) => {
        const x = x0 + (i + 0.5) * pitch;
        return (
          <group key={"j" + i} position={[x, 0, 0]}>
            <mesh position={[0, 0.45, 0]} rotation={[0, 0, e ? 0.5 : 0]}>
              <boxGeometry args={[0.08, 0.5, 0.36]} />
              <meshStandardMaterial color={e ? P.rose : H2.brass} metalness={e ? 0.2 : 0.7} roughness={0.3} />
            </mesh>
            {e ? <Tag position={[0, -0.05, 0.6]} tone="rose" size="xs" center>{e}</Tag> : null}
          </group>
        );
      })}
      <Arrow from={[x0 + (rows.length - 1) * pitch + 0.7, 0.45, 0]} to={[x0 + (rows.length - 1) * pitch + 1.5, 0.45, 0]} color={ok ? P.teal : P.rose} width={2} head={0.12} />
      <Tag position={[x0 + (rows.length - 1) * pitch + 1.95, 0.45, 0]} tone={ok ? "teal" : "rose"} center>{ok ? "proveedor: 200" : "proveedor: 400"}</Tag>
    </group>
  );
}

const WINDOW = 80; // messages that fill the window in this model (equal sizes)
const PROTECT = 20;
type Kind = "system" | "user" | "call" | "tool" | "assistant";

function messageKind(i: number): Kind {
  if (i === 0) return "system";
  return (["user", "call", "tool", "assistant"] as const)[(i - 1) % 4];
}

function compressModel(fillPct: number, threshold: number) {
  const n = Math.round((fillPct / 100) * WINDOW);
  const fires = fillPct > threshold;
  let start = Math.max(1, n - PROTECT);
  let shifted = false;
  if (messageKind(start) === "tool") {
    start -= 1; // keep the tool call with its result
    shifted = true;
  }
  const summarized = fires ? start - 1 : 0;
  const after = fires ? 2 + (n - start) : n;
  return { n, fires, start, summarized, after, shifted };
}

const KIND_TINT: Record<Kind, string> = { system: "#8d9398", user: P.amber, call: P.violet, tool: P.teal, assistant: P.violet };
const TILE = 0.085;

function Tray({ z, label, children }: { z: number; label: string; children: React.ReactNode }) {
  const x0 = -3.6;
  return (
    <group position={[0, 0, z]}>
      <RoundedBox args={[WINDOW * TILE + 0.3, 0.08, 0.9]} position={[x0 + (WINDOW * TILE) / 2, 0.04, 0]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color={H2.ceramic} roughness={0.6} />
      </RoundedBox>
      {[50, 85].map((pct) => (
        <mesh key={pct} position={[x0 + (pct / 100) * WINDOW * TILE, 0.3, 0]}>
          <boxGeometry args={[0.02, 0.5, 0.95]} />
          <meshStandardMaterial color={pct === 50 ? P.amber : P.rose} transparent opacity={0.7} />
        </mesh>
      ))}
      <Tag position={[x0 - 0.55, 0.2, 0]} tone="muted" size="xs" center>{label}</Tag>
      {children}
    </group>
  );
}

function CompressionScene({ fill, threshold }: { fill: number; threshold: number }) {
  const m = compressModel(fill, threshold);
  const x0 = -3.6;
  const tiles = (from: number, to: number, offset: number) =>
    Array.from({ length: Math.max(0, to - from) }, (_, k) => {
      const i = from + k;
      const kind = messageKind(i);
      return (
        <mesh key={i} position={[x0 + (offset + k + 0.5) * TILE, 0.2, 0]} castShadow>
          <boxGeometry args={[TILE - 0.012, kind === "system" ? 0.3 : 0.22, 0.6]} />
          <meshStandardMaterial color={mixHex(P.paper, KIND_TINT[kind], 0.6)} roughness={0.45} />
        </mesh>
      );
    });
  return (
    <group>
      <Tray z={-1.0} label="antes">{tiles(0, m.n, 0)}</Tray>
      <Tray z={0.7} label="después">
        {m.fires ? (
          <>
            {tiles(0, 1, 0)}
            <RoundedBox args={[TILE * 2 - 0.012, 0.3, 0.64]} position={[x0 + 2 * TILE, 0.2, 0]} radius={0.03} smoothness={2} castShadow>
              <meshPhysicalMaterial color={P.violet} roughness={0.35} clearcoat={0.5} />
            </RoundedBox>
            {tiles(m.start, m.n, 3)}
            <Tag position={[x0 + 2 * TILE, 0.62, 0]} tone="violet" size="xs" center>resumen</Tag>
            <Tag position={[x0 + (3 + (m.n - m.start) / 2) * TILE, 0.62, 0]} tone="teal" size="xs" center>{"últimos " + (m.n - m.start)}</Tag>
          </>
        ) : (
          <>
            {tiles(0, m.n, 0)}
            <Tag position={[x0 + (m.n / 2) * TILE, 0.62, 0]} tone="muted" size="xs" center>sin compresión</Tag>
          </>
        )}
      </Tray>
      <Tag position={[x0 + 0.5 * WINDOW * TILE, 0.72, -1.0]} tone="amber" size="xs" center>50 %</Tag>
      <Tag position={[x0 + 0.85 * WINDOW * TILE, 0.72, -1.0]} tone="rose" size="xs" center>85 %</Tag>
      {/* Memory is flushed to disk before anything is summarized. */}
      <group position={[3.75, 0, -0.15]}>
        <RoundedBox args={[0.8, 0.5, 0.6]} position={[0, 0.25, 0]} radius={0.07} smoothness={3} castShadow>
          <meshPhysicalMaterial color={m.fires ? mixHex(P.paper, P.amber, 0.45) : "#dedad1"} roughness={0.4} clearcoat={0.45} />
        </RoundedBox>
        <Tag position={[0, 0.72, 0]} tone={m.fires ? "amber" : "muted"} size="xs" center>MEMORY.md</Tag>
      </group>
      {m.fires ? <Arrow from={[3.2, 0.35, -0.9]} to={[3.55, 0.4, -0.35]} color={P.amber} width={1.6} head={0.08} /> : null}
      {m.fires ? <Tag position={[3.75, 0.2, 1.3]} tone="violet" size="xs" center>sesión hija</Tag> : null}
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<Hl2Mode>("alternation");
  const [scenario, setScenario] = useState<Scenario>("tools");
  const [fill, setFill] = useState(60);
  const [threshold, setThreshold] = useState(50);
  const errors = validate(SCENARIOS[scenario]).filter(Boolean);
  const cm = compressModel(fill, threshold);
  const note =
    mode === "alternation" ? (
      <div className="space-y-3">
        <p>
          <strong>{scenario === "tools" ? "Turno con tools: la cadena es válida." : scenario === "partial" ? "El assistant parcial guardado rompe la alternancia." : "Una fila de cron entre user y assistant rompe la cadena."}</strong>{" "}
          {scenario === "tools"
            ? "Tras el assistant con tool_calls pueden apilarse varias filas tool; después vuelve un assistant."
            : scenario === "partial"
              ? "Es el caso del host que guardaba el parcial «para reanudar»: la siguiente llamada lleva dos assistant seguidos. Hermes abandona el hilo HTTP y no inyecta el parcial."
              : "Por eso las entregas de cron no se espejan en un chat vivo del gateway: es un invariante del bucle, no una preferencia de entrega."}
        </p>
        <Readout items={[
          { label: "filas", value: String(SCENARIOS[scenario].length), tone: "var(--ink)" },
          { label: "juntas inválidas", value: String(errors.length), tone: errors.length ? "var(--rose)" : "var(--teal)" },
          { label: "respuesta", value: errors.length ? "400" : "200", tone: errors.length ? "var(--rose)" : "var(--teal)" },
        ]} />
        <p className="text-xs text-muted">Reglas de la lección: nunca dos assistant ni dos user seguidos; sólo tool se apila, detrás de un assistant con tool_calls. El validador de la lámina aplica exactamente esas reglas.</p>
      </div>
    ) : (
      <div className="space-y-3">
        <p>
          <strong>{cm.fires ? `Al ${fill} % se supera el umbral del ${threshold} %: se comprime.` : `Al ${fill} % no se alcanza el umbral del ${threshold} %.`}</strong>{" "}
          {cm.fires
            ? `Primero se vuelca la memoria a disco; luego ${cm.summarized} mensajes del medio pasan a un resumen, y se conservan intactos los últimos ${cm.n - cm.start}${cm.shifted ? " (uno más para no separar una tool de su llamada)" : ""}. Nace una sesión hija con un linaje nuevo.`
            : "El historial sigue entero; se comprobará otra vez antes de la siguiente llamada."}
        </p>
        <Readout items={[
          { label: "mensajes antes", value: String(cm.n), tone: "var(--ink)" },
          { label: "resumidos", value: String(cm.summarized), tone: "var(--violet)" },
          { label: "después", value: String(cm.after), tone: "var(--teal)" },
          { label: "protect_last_n", value: String(PROTECT), tone: "var(--teal)" },
        ]} />
        <p className="text-xs text-muted">Maqueta: {WINDOW} mensajes de igual tamaño llenan la ventana; patrón user → assistant con tool_calls → tool → assistant. Umbrales 50 % (preflight, antes de la llamada) y 85 % (gateway, entre turnos) de la guía de Nous Research.</p>
      </div>
    );
  return (
    <Figure
      label="Dos invariantes: alternancia y compresión"
      hint="validador de historial · umbrales 50 / 85 %"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.amber, label: "user / umbral 50 %" },
        { color: P.violet, label: "assistant / resumen" },
        { color: P.teal, label: "tool / protegidos" },
        { color: P.rose, label: "junta inválida / 85 %" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Invariante" options={[{ value: "alternation", label: "Alternancia", tone: P.violet }, { value: "compression", label: "Compresión", tone: P.amber }]} />
          {mode === "alternation" ? (
            <Switcher value={scenario} onChange={setScenario} ariaLabel="Historial de ejemplo" options={[{ value: "tools", label: "Con tools", tone: P.teal }, { value: "partial", label: "Parcial guardado", tone: P.rose }, { value: "cron", label: "Cron en medio", tone: P.rose }]} />
          ) : (
            <>
              <Switcher value={String(threshold) as "50" | "85"} onChange={(v) => setThreshold(Number(v))} ariaLabel="Disparador" options={[{ value: "50", label: "Preflight 50 %", tone: P.amber }, { value: "85", label: "Gateway 85 %", tone: P.rose }]} />
              <Knob label="ventana ocupada" value={fill} min={20} max={100} step={5} onChange={setFill} format={(v) => v + " %"} tone="var(--amber)" />
            </>
          )}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.4, 5.6, 8.6], fov: 32 }} fit={1.04}>
        <H2Bench />
        {mode === "alternation" ? <AlternationScene scenario={scenario} /> : <CompressionScene fill={fill} threshold={threshold} />}
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

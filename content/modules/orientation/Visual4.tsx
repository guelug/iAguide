"use client";
import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { MathUtils, type Group } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Arrow, useCycle, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

type Mode = "roles" | "window" | "agent";
const COPY = {
  en: {
    title: "the thread is glued back every call",
    hint: "roles · window · agent loop",
    roles: "roles",
    window: "window",
    agent: "agent",
    system: "system",
    user: "user",
    assistant: "assistant",
    tool: "tool",
    budget: "budget",
    response: "answer",
    chat: "chat",
    loop: "loop",
    rolesNote: "one chain, not a drawer",
    windowNote: "what falls off the left is gone",
    agentNote: "the model writes the request · code runs it",
  },
  es: {
    title: "el hilo se pega en cada llamada",
    hint: "roles · ventana · bucle agente",
    roles: "roles",
    window: "ventana",
    agent: "agente",
    system: "system",
    user: "user",
    assistant: "assistant",
    tool: "tool",
    budget: "presupuesto",
    response: "respuesta",
    chat: "chat",
    loop: "bucle",
    rolesNote: "una cadena, no un cajón",
    windowNote: "lo que sale por la izquierda se pierde",
    agentNote: "el modelo escribe la petición · el código la corre",
  },
};

/* Roles as beads threaded on one string — concatenated, not stored apart. */
function RolesScene({ t }: { t: (typeof COPY)["es"] }) {
  const beads: { label: string; color: string; tone: "teal" | "violet" | "amber" | "rose"; x: number; y: number }[] = [
    { label: t.system, color: P.teal, tone: "teal", x: -2.1, y: 0.34 },
    { label: t.user, color: P.violet, tone: "violet", x: -0.7, y: 0.08 },
    { label: t.assistant, color: P.amber, tone: "amber", x: 0.7, y: 0.34 },
    { label: t.tool, color: P.rose, tone: "rose", x: 2.1, y: 0.08 },
  ];
  const thread = beads.map((b) => [b.x, b.y, 0] as [number, number, number]);
  return (
    <>
      <Ribbon points={thread} color={P.inkSoft} radius={0.022} opacity={0.55} />
      <Flow points={thread} color={P.teal} count={5} speed={0.14} size={0.04} lineOpacity={0} />
      {beads.map((b) => (
        <group key={b.label} position={[b.x, b.y, 0]}>
          <mesh>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshStandardMaterial color={b.color} roughness={0.32} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
            <meshStandardMaterial color={P.paper} roughness={0.6} />
          </mesh>
          <Tag position={[0, 0.52, 0.15]} tone={b.tone} size="xs" center>
            {b.label}
          </Tag>
        </group>
      ))}
    </>
  );
}

/* The window as a physical container; old messages slide off the left edge. */
function WindowScene({ t }: { t: (typeof COPY)["es"] }) {
  return (
    <>
      <Slab position={[0.3, 0.05, 0]} size={[4.4, 1.0, 0.1]} color={P.violet} fill={0.08} rim={0.8} />
      <Slab position={[-0.85, 0.05, 0.09]} size={[1.7, 0.72, 0.1]} color={P.teal} fill={0.3} />
      <Slab position={[1.25, 0.05, 0.09]} size={[1.9, 0.72, 0.1]} color={P.amber} fill={0.3} />
      <group position={[-2.85, 0.05, 0]}>
        <Slab position={[0, 0, 0]} size={[0.9, 0.72, 0.1]} color={P.rose} fill={0.12} rim={0.35} />
        <Flow points={[[0.55, 0, 0], [-0.75, 0, 0]]} color={P.rose} count={3} speed={0.2} />
      </group>
      <Tag position={[-0.85, 0.78, 0.15]} tone="teal" size="xs" center>
        {t.system} + hilo
      </Tag>
      <Tag position={[1.25, 0.78, 0.15]} tone="amber" size="xs" center>
        {t.response}
      </Tag>
      <Tag position={[0.3, -0.72, 0.15]} tone="violet" size="xs" center>
        {t.budget}: 4k · 32k · 128k
      </Tag>
    </>
  );
}

/* Chat and tool on a real circuit: the loop is drawn, not implied. */
function AgentScene({ t }: { t: (typeof COPY)["es"] }) {
  return (
    <>
      <group position={[-1.75, 0.1, 0]}>
        <Node3D position={[0, 0, 0]} color={P.violet} radius={0.22} pulse={0.3} />
        <Halo position={[0, 0, 0]} radius={0.4} color={P.violet} opacity={0.4} spin={0.14} />
        <Tag position={[0, 0.82, 0.15]} tone="violet" size="xs" center>
          {t.chat}
        </Tag>
      </group>
      <Flow points={[[-1.4, 0.3, 0], [-0.5, 0.62, 0], [0.5, 0.62, 0], [1.4, 0.3, 0]]} color={P.amber} count={4} speed={0.22} />
      <group position={[1.75, 0.1, 0]}>
        <RoundedBox args={[0.6, 0.6, 0.3]} radius={0.1} smoothness={4}>
          <meshStandardMaterial color={P.amber} roughness={0.32} metalness={0.1} />
        </RoundedBox>
        <Wire points={[[-0.44, 0.16, 0], [-0.3, 0.16, 0]]} color={P.amberDeep} width={2} />
        <Wire points={[[0.3, -0.16, 0], [0.44, -0.16, 0]]} color={P.amberDeep} width={2} />
        <Halo position={[0, 0, 0]} radius={0.52} color={P.amber} opacity={0.35} spin={-0.16} />
        <Tag position={[0, 0.82, 0.15]} tone="amber" size="xs" center>
          {t.tool}
        </Tag>
      </group>
      <Flow points={[[1.4, -0.15, 0], [0.5, -0.5, 0], [-0.5, -0.5, 0], [-1.4, -0.15, 0]]} color={P.rose} count={4} speed={0.22} />
      <Tag position={[0, -0.95, 0.15]} tone="muted" size="xs" center>
        {t.loop}
      </Tag>
    </>
  );
}

export default function Visual4() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("roles");
  const note = mode === "roles" ? t.rolesNote : mode === "window" ? t.windowNote : t.agentNote;
  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.system },
        { color: P.violet, label: t.assistant },
        { color: P.amber, label: t.tool },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "roles", label: t.roles, tone: P.teal },
            { value: "window", label: t.window, tone: P.violet },
            { value: "agent", label: t.agent, tone: P.amber },
          ]}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }} background={P.paper}>
        <Motes count={110} radius={7} color={P.lineStrong} size={0.024} opacity={0.22} />
        <PointerTilt amount={0.08}>
          {mode === "roles" && <RolesScene t={t} />}
          {mode === "window" && <WindowScene t={t} />}
          {mode === "agent" && <AgentScene t={t} />}
          <ShadowBlob position={[0, -1.02, 0]} scale={4.2} opacity={0.07} />
          <Tag position={[0, -1.28, 0.15]} tone="muted" size="xs" center>
            {note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * «Ventana»: el arnés concatena system, tools, historial, lo pegado y la
 * reserva de salida en UNA cadena; la canaleta mide esa cadena contra el
 * tamaño de la ventana. Si no cabe, el arnés recorta lo más viejo del
 * historial (y, si aun así no cabe, el documento no entra).
 * «Bucle»: un agente es un bucle: el modelo escribe la petición como
 * texto, el arnés la parsea, la ejecuta y pega el resultado.
 */

type VMode = "window" | "loop";
const WINDOWS = [4_000, 32_000, 128_000] as const;
const SEG = { system: 600, tools: 1_400, turn: 350, pdf: 60_000, output: 800 };
const NW = new Intl.NumberFormat("es-ES");

function windowModel(win: number, turns: number, pdf: boolean) {
  const fixed = SEG.system + SEG.tools + SEG.output;
  const pdfTok = pdf ? SEG.pdf : 0;
  const room = win - fixed - pdfTok;
  const pdfFits = room >= 0;
  const roomForHistory = pdfFits ? room : win - fixed;
  const keptTurns = Math.max(0, Math.min(turns, Math.floor(roomForHistory / SEG.turn)));
  const dropped = turns - keptTurns;
  const used = fixed + keptTurns * SEG.turn + (pdfFits ? pdfTok : 0);
  const wanted = fixed + turns * SEG.turn + pdfTok;
  return { keptTurns, dropped, pdfFits: pdf ? pdfFits : null, used, wanted, fixed };
}

type LoopStep = { who: "modelo" | "arnés" | "herramienta"; role: string; text: string };
const LOOP: LoopStep[] = [
  { who: "arnés", role: "user", text: "¿Qué tiempo hace en Santander?" },
  { who: "modelo", role: "assistant", text: 'get_weather(ciudad="Santander")' },
  { who: "arnés", role: "—", text: "parsea la petición y llama a la función" },
  { who: "herramienta", role: "tool", text: '{"temp": 14, "cielo": "nubes"}' },
  { who: "modelo", role: "assistant", text: "En Santander hay 14 °C y nubes." },
];

function VMat({ color, rough = 0.45, coat = 0.45, metal = 0, opacity = 1 }: { color: string; rough?: number; coat?: number; metal?: number; opacity?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} transparent={opacity < 1} opacity={opacity} />;
}

function Plinth4() {
  return (
    <group>
      <ShadowBlob position={[0, -1.46, 0.3]} scale={9.6} opacity={0.12} />
      <RoundedBox args={[9.4, 0.3, 3.8]} position={[0, -1.25, 0.2]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <VMat color="#3a3f44" rough={0.6} coat={0.2} />
      </RoundedBox>
      <RoundedBox args={[9.1, 0.06, 3.5]} position={[0, -1.07, 0.2]} radius={0.03} smoothness={2} receiveShadow>
        <VMat color="#50565c" rough={0.55} coat={0.25} />
      </RoundedBox>
    </group>
  );
}

const TROUGH = { x0: -3.8, L: 7.6, y: -0.82, d: 1.3 };

function BudgetScene({ win, turns, pdf }: { win: number; turns: number; pdf: boolean }) {
  const m = useMemo(() => windowModel(win, turns, pdf), [win, turns, pdf]);
  const k = TROUGH.L / win;
  const segs: { len: number; color: string; key: string; label?: string; tone?: "teal" | "violet" | "muted" | "amber" | "rose" }[] = [
    { len: SEG.system * k, color: P.teal, key: "sys", label: "system", tone: "teal" },
    { len: SEG.tools * k, color: P.violet, key: "tools", label: "tools", tone: "violet" },
    ...Array.from({ length: m.keptTurns }, (_, i) => ({ len: SEG.turn * k, color: i % 2 ? mixHex(P.paper, P.inkSoft, 0.5) : mixHex(P.paper, P.inkSoft, 0.3), key: `t${i}` })),
    ...(m.pdfFits ? [{ len: SEG.pdf * k, color: P.amber, key: "pdf", label: "PDF", tone: "amber" as const }] : []),
  ];
  let x = TROUGH.x0;
  const placed = segs.map((s) => {
    const cx = x + s.len / 2;
    x += s.len;
    return { ...s, cx };
  });
  const histStart = TROUGH.x0 + (SEG.system + SEG.tools) * k;
  const histLen = m.keptTurns * SEG.turn * k;
  return (
    <PointerTilt amount={0.04}>
      <group>
        <Plinth4 />
        {/* trough: its length IS the window */}
        <RoundedBox args={[TROUGH.L + 0.2, 0.08, TROUGH.d + 0.2]} position={[0, -1.0, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <VMat color="#b68442" metal={0.55} rough={0.3} coat={0.2} />
        </RoundedBox>
        {[-1, 1].map((sz) => (
          <mesh key={sz} position={[0, -0.78, (sz * TROUGH.d) / 2 + sz * 0.05]}>
            <boxGeometry args={[TROUGH.L + 0.2, 0.4, 0.04]} />
            <VMat color={P.paper} rough={0.1} coat={1} opacity={0.22} />
          </mesh>
        ))}
        {placed.map((s) => (
          <mesh key={s.key} position={[s.cx, -0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(0.004, s.len - 0.006), 0.32, TROUGH.d - 0.06]} />
            <VMat color={s.color} rough={0.4} />
          </mesh>
        ))}
        {/* output reservation at the far end */}
        <mesh position={[TROUGH.x0 + TROUGH.L - (SEG.output * k) / 2, -0.8, 0]}>
          <boxGeometry args={[Math.max(0.004, SEG.output * k - 0.006), 0.32, TROUGH.d - 0.06]} />
          <VMat color={P.rose} rough={0.4} opacity={0.45} />
        </mesh>
        {placed.filter((s) => s.label && s.len > 0.12).map((s, i) => (
          <Tag key={`l-${s.key}`} position={[s.cx, -0.5, i % 2 ? -0.75 : 0.85]} tone={s.tone ?? "ink"} size="xs" center>{s.label}</Tag>
        ))}
        {histLen > 0.5 ? <Tag position={[histStart + histLen / 2, -0.35, 0.1]} tone="muted" size="xs" center>{`historial · ${m.keptTurns}`}</Tag> : null}
        {TROUGH.x0 + TROUGH.L - SEG.output * k - x > 1 ? <Tag position={[(x + TROUGH.x0 + TROUGH.L - SEG.output * k) / 2, -0.5, 0.1]} tone="muted" size="xs" center>libre</Tag> : null}
        {SEG.output * k > 0.25 ? <Tag position={[TROUGH.x0 + TROUGH.L - (SEG.output * k) / 2, -0.4, 0.2]} tone="rose" size="xs" center>salida</Tag> : null}
        <Tag position={[0, -0.05, -0.2]} tone="ink" center>{`ventana ${NW.format(win)} tokens`}</Tag>
        {/* what the harness had to cut */}
        {m.dropped > 0 ? (
          <group position={[-3.2, -1.0, 1.35]}>
            {Array.from({ length: Math.min(12, m.dropped) }, (_, i) => (
              <mesh key={i} position={[(i % 4) * 0.22 - 0.33, 0.06 + Math.floor(i / 4) * 0.1, 0]} rotation={[0, i * 0.3, 0]} castShadow>
                <boxGeometry args={[0.18, 0.08, 0.3]} />
                <VMat color={mixHex(P.paper, P.inkSoft, 0.3)} rough={0.6} />
              </mesh>
            ))}
            <Tag position={[0.9, 0.12, 0.1]} tone="muted" size="xs" center>{`recortados ${m.dropped}`}</Tag>
          </group>
        ) : null}
        {pdf && !m.pdfFits ? (
          <group position={[2.6, -0.9, 1.35]}>
            <RoundedBox args={[1.4, 0.25, 0.8]} radius={0.04} smoothness={2} castShadow>
              <VMat color={mixHex(P.paper, P.amber, 0.5)} rough={0.5} />
            </RoundedBox>
            <Tag position={[0, 0.35, 0]} tone="rose" size="xs" center>PDF no cabe</Tag>
          </group>
        ) : null}
      </group>
    </PointerTilt>
  );
}

const STATION_POS: Record<LoopStep["who"], V3> = { modelo: [0, -0.7, -2.05], arnés: [-2.0, -0.7, 0.9], herramienta: [2.0, -0.7, 0.9] };
const ROLE_COLOR: Record<string, string> = { user: P.amber, assistant: P.violet, tool: P.teal, "—": P.lineStrong };

function Bead({ to }: { to: V3 }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    (["x", "z"] as const).forEach((a, i) => {
      const target = to[i === 0 ? 0 : 2];
      g.position[a] = still ? target : MathUtils.damp(g.position[a], target, 3.5, dt);
    });
  });
  return (
    <group ref={ref} position={[to[0], 0.05, to[2]]}>
      <mesh castShadow>
        <sphereGeometry args={[0.16, 24, 16]} />
        <VMat color={P.rose} rough={0.3} coat={0.7} />
      </mesh>
    </group>
  );
}

function LoopTrack({ step }: { step: number }) {
  const cur = LOOP[step];
  return (
    <PointerTilt amount={0.04}>
      <group>
        <Plinth4 />
        <mesh position={[0, -0.95, -0.35]} rotation={[Math.PI / 2, 0, 0]} receiveShadow castShadow>
          <torusGeometry args={[2.15, 0.06, 14, 96]} />
          <VMat color="#b68442" metal={0.6} rough={0.3} coat={0.1} />
        </mesh>
        {(Object.keys(STATION_POS) as LoopStep["who"][]).map((who) => {
          const p = STATION_POS[who];
          const on = cur.who === who;
          const color = who === "modelo" ? P.violet : who === "arnés" ? P.amber : P.teal;
          return (
            <group key={who} position={p}>
              <RoundedBox args={[1.1, 0.7, 0.9]} radius={0.08} smoothness={3} castShadow receiveShadow>
                <VMat color={on ? color : mixHex(P.paper, color, 0.3)} rough={0.4} coat={0.55} />
              </RoundedBox>
              <Tag position={[0, 0.65, 0]} tone={on ? "ink" : "muted"} center>{who}</Tag>
            </group>
          );
        })}
        <Bead to={[STATION_POS[cur.who][0], 0, STATION_POS[cur.who][2] + 0.7]} />
        {/* the single string the model reads: one card per message so far */}
        {LOOP.slice(0, step + 1).filter((s) => s.role !== "—").map((s, i) => (
          <group key={i} position={[0.0, -0.95 + 0.1 + i * 0.16, 0.45]}>
            <RoundedBox args={[1.6, 0.13, 0.9]} radius={0.03} smoothness={2} castShadow>
              <VMat color={mixHex(P.paper, ROLE_COLOR[s.role], 0.55)} rough={0.5} />
            </RoundedBox>
          </group>
        ))}
        <Tag position={[0, -0.6 + LOOP.slice(0, step + 1).filter((s) => s.role !== "—").length * 0.16, 0.45]} tone="ink" size="xs" center>una cadena</Tag>
        {cur.who === "modelo" ? <Arrow from={[0, -0.25, -1.55]} to={[0, -0.3, -0.1]} color={P.violet} head={0.1} /> : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<VMode>("window");
  const [win, setWin] = useState<number>(32_000);
  const [turns, setTurns] = useState(30);
  const [pdf, setPdf] = useState(false);
  const [step] = useCycle(LOOP.length, 2.4);
  const m = windowModel(win, turns, pdf);
  const cur = LOOP[step];
  const note =
    mode === "window" ? (
      <div className="space-y-2">
        <p><strong>La ventana es un presupuesto.</strong> Antes de cada llamada el arnés concatena system, tools, historial y lo pegado, y reserva sitio para la respuesta. {m.dropped > 0 ? `No cabe todo: el arnés recorta los ${m.dropped} turnos más viejos.` : "Todo cabe."} {m.pdfFits === false ? "El PDF de 60 000 tokens no entra en esta ventana ni vaciando el historial." : ""} El modelo no «olvida»: se le acaba el sitio.</p>
        <Readout items={[
          { label: "pedido", value: `${NW.format(m.wanted)} tokens`, tone: "var(--ink)" },
          { label: "en la ventana", value: `${NW.format(m.used)} / ${NW.format(win)}`, tone: "var(--teal)" },
          { label: "turnos que quedan", value: `${m.keptTurns} de ${turns}`, tone: m.dropped ? "var(--rose)" : "var(--ink)" },
          { label: "fijo por llamada", value: `${NW.format(m.fixed)} tokens`, tone: "var(--violet)" },
        ]} />
        <p className="text-xs text-muted">Tamaños didácticos: system {NW.format(SEG.system)}, esquemas de tools {NW.format(SEG.tools)}, {SEG.turn} tokens por turno, PDF {NW.format(SEG.pdf)}, reserva de salida {NW.format(SEG.output)}. La longitud de la canaleta representa siempre la ventana entera.</p>
      </div>
    ) : (
      <div className="space-y-2">
        <p><strong>Paso {step + 1}/{LOOP.length} · {cur.who}.</strong> {step === 1 ? "El modelo no ejecuta nada: escribe tokens con forma de llamada." : step === 2 ? "El arnés parsea ese texto y corre un programa normal." : step === 3 ? "El resultado vuelve como un mensaje con rol tool, pegado en la misma cadena." : step === 4 ? "Con el resultado en el contexto, el modelo continúa." : "El arnés arma la cadena con el mensaje del usuario."} Sin ese bucle tendrías un párrafo bonito, no un agente.</p>
        <ol className="list-decimal space-y-0.5 pl-5 font-mono text-[0.72rem]">
          {LOOP.slice(0, step + 1).map((s, i) => <li key={i} className={i === step ? "text-ink" : "text-muted"}>{s.role === "—" ? `(${s.text})` : `${s.role}: ${s.text}`}</li>)}
        </ol>
      </div>
    );
  return (
    <Figure
      label={mode === "window" ? "Canaleta del contexto · roles en una cadena" : "Un agente es un bucle"}
      hint={mode === "window" ? "lo que cabe en esta llamada" : "el modelo escribe; el código ejecuta"}
      legend={mode === "window"
        ? [{ color: P.teal, label: "system" }, { color: P.violet, label: "tools" }, { color: P.inkSoft, label: "historial" }, { color: P.amber, label: "documento" }, { color: P.rose, label: "reserva de salida" }]
        : [{ color: P.amber, label: "user / arnés" }, { color: P.violet, label: "assistant / modelo" }, { color: P.teal, label: "tool" }]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} options={[{ value: "window", label: "Ventana", tone: P.teal }, { value: "loop", label: "Bucle", tone: P.violet }]} ariaLabel="Vista" />
          {mode === "window" ? (
            <>
              <Switcher value={String(win)} onChange={(v) => setWin(Number(v))} options={WINDOWS.map((w) => ({ value: String(w), label: `${w / 1000}k`, tone: P.teal }))} ariaLabel="Tamaño de ventana" />
              <Knob label="turnos" min={0} max={80} value={turns} onChange={setTurns} tone={P.inkSoft} />
              <Switcher value={pdf ? "si" : "no"} onChange={(v) => setPdf(v === "si")} options={[{ value: "no", label: "Sin PDF", tone: P.inkSoft }, { value: "si", label: "Pegar PDF", tone: P.amber }]} ariaLabel="Documento pegado" />
            </>
          ) : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.8, 3.8, 10.5], fov: 34 }} fit={1.05}>
        {mode === "window" ? <BudgetScene win={win} turns={turns} pdf={pdf} /> : <LoopTrack step={step} />}
      </Stage>
    </Figure>
  );
}

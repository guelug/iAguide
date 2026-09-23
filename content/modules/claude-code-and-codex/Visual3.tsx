"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useRef } from "react";
import { Group } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Arrow, PointerTilt, ShadowBlob } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  Duct,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Agent View is a supervisor table, not a chat.
 *
 * Enter on the dispatch plate starts a NEW session. Peek looks without
 * attaching. Attach enters the row; detach returns to the table. The
 * intro slideshow already names Agent View; this scene sits on the
 * section that walks states and keys.
 */

type Mode = "dispatch" | "states" | "peek";

const COPY = {
  en: {
    title: "Agent View: dispatch, do not chat",
    hint: "Enter starts a new session · peek is not attach · the table survives sleep",
    dispatch: "dispatch",
    states: "states",
    peek: "peek / attach",
    legendNew: "new session",
    legendLive: "working",
    legendWait: "needs input",
    input: "dispatch",
    table: "Agent View",
    working: "Working",
    needs: "Needs input",
    idle: "Idle",
    done: "Completed",
    notes: {
      dispatch:
        "The input is not a chat. Each Enter starts a new background session. It is not a follow-up to the selected row. To continue a task, attach to that session and type there.",
      states:
        "Each row has a documented state: Working, Needs input, Idle, Completed, Failed, Stopped. Ten agents in parallel cost on the order of ten times one. Leaving the TUI does not kill them.",
      peek: "Space peeks without attaching. Enter or right-arrow attaches. Left-arrow detaches: you return to the table and the session keeps running. A host shutdown stops them; attach, peek, or a reply restarts.",
    },
  },
  es: {
    title: "Agent View: despachar, no conversar",
    hint: "Enter arranca una sesión nueva · peek no es attach · la tabla sobrevive al sleep",
    dispatch: "despacho",
    states: "estados",
    peek: "peek / attach",
    legendNew: "sesión nueva",
    legendLive: "trabajando",
    legendWait: "pide input",
    input: "despacho",
    table: "Agent View",
    working: "Working",
    needs: "Needs input",
    idle: "Idle",
    done: "Completed",
    notes: {
      dispatch:
        "El input no es un chat. Cada Enter arranca una sesión nueva en segundo plano. No es un follow-up a la fila seleccionada. Para continuar una tarea, adjunta a esa sesión y escribe allí.",
      states:
        "Cada fila tiene un estado documentado: Working, Needs input, Idle, Completed, Failed, Stopped. Diez agentes en paralelo cuestan del orden de diez veces uno. Salir de la TUI no las mata.",
      peek: "Space mira sin adjuntarte. Enter o flecha derecha adjunta. Flecha izquierda desadjunta: vuelves a la tabla y la sesión sigue. Un shutdown del host las para; attach, peek o una respuesta las reinicia.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("dispatch");

  const rows = [
    { label: t.working, color: P.teal, wash: P.tealWash, tone: "teal" as const },
    { label: t.needs, color: P.amber, wash: P.amberWash, tone: "amber" as const },
    { label: t.idle, color: P.violet, wash: P.violetWash, tone: "violet" as const },
    { label: t.done, color: P.teal, wash: P.tealWash, tone: "muted" as const },
  ];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.violet, label: t.legendNew },
        { color: P.teal, label: t.legendLive },
        { color: P.amber, label: t.legendWait },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "dispatch", label: t.dispatch, tone: P.violet },
            { value: "states", label: t.states, tone: P.teal },
            { value: "peek", label: t.peek, tone: P.amber },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[mode]}</strong>
          {" — "}
          {t.notes[mode]}
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={13.3} depth={11.5} y={-0.04} />
        <PlanTrace
          points={[[-5.5, 3.3], [-2.2, 3.3], [-2.2, 0.4]]}
          y={-0.03}
          color={mode === "dispatch" ? P.violet : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.7, 0, 2.2]} to={[4.8, 0, 2.2]} />
        <IsoDust count={42} center={[0, 0.5, 0]} spread={[5.0, 0.9, 3.5]} />

        <GlassPanel
          position={[-3.15, 1.15, 1.45]}
          rotation={ISO}
          size={[2.25, 1.7]}
          color={P.violet}
          opacity={mode === "dispatch" ? 0.3 : 0.12}
        />
        <Tag position={[-3.15, 2.2, 1.45]} tone="violet" size="xs">
          {t.input}
        </Tag>
        <Sheet
          position={[-3.05, 0.06, 1.5]}
          size={[1.35, 0.9]}
          color={P.violetWash}
          fill={mode === "dispatch" ? 0.9 : 0.35}
          marks={2}
          markColor={P.violet}
        />

        <GlassPanel
          position={[1.55, 1.55, -0.15]}
          rotation={ISO}
          size={[5.4, 2.55]}
          color={P.teal}
          opacity={0.1}
        />
        <Tag position={[1.55, 3.05, -0.15]} tone="teal">
          {t.table}
        </Tag>
        {rows.map((r, i) => (
          <group key={r.label}>
            <Sheet
              position={[-0.55 + (i % 2) * 2.35, 0.06, 0.85 - Math.floor(i / 2) * 1.35]}
              size={[1.85, 0.95]}
              color={r.wash}
              fill={mode === "peek" && i === 1 ? 0.95 : 0.8}
              marks={mode === "states" || (mode === "peek" && i === 1) ? 4 : 2}
              markColor={r.color}
            />
            <Tag
              position={[-0.55 + (i % 2) * 2.35, 1.2, 0.85 - Math.floor(i / 2) * 1.35]}
              tone={r.tone}
              size="xs"
            >
              {r.label}
            </Tag>
          </group>
        ))}

        {mode === "dispatch" ? (
          <>
            <Duct from={[-2.15, 0.28, 1.25]} to={[-0.15, 0.22, 0.9]} color={P.violet} radius={0.1} bend={0.45} />
            <Flow
              points={[
                [-2.0, 0.3, 1.2],
                [0.0, 0.22, 0.9],
              ]}
              color={P.violet}
              count={3}
            />
          </>
        ) : null}
        {mode === "peek" ? (
          <Duct from={[1.7, 1.4, 0.2]} to={[1.8, 0.35, 0.2]} color={P.amber} radius={0.08} bend={0.2} />
        ) : null}
      </Stage>
    </Figure>
  );
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Agent View como supervisor: cada Enter crea una fila nueva (una sesión
   de primer nivel con su cuota), Space mira sin adjuntar, Enter/→ adjunta,
   ← desadjunta. Salir o suspender no mata las sesiones; un shutdown del
   host sí las para. Estados documentados por Anthropic. */

type AvState = "working" | "needs" | "idle" | "completed" | "failed" | "stopped";
type AvKey = "table" | "peek" | "attach";
type Host = "on" | "sleep" | "shutdown";

const AV_STATE: Record<AvState, { label: string; product: string; color: string; live: boolean }> = {
  working: { label: "trabajando", product: "Working", color: P.teal, live: true },
  needs: { label: "pide respuesta", product: "Needs input", color: P.amber, live: true },
  idle: { label: "en espera", product: "Idle", color: P.violet, live: true },
  completed: { label: "completada", product: "Completed", color: mixHex(P.teal, P.paper, 0.45), live: false },
  failed: { label: "fallida", product: "Failed", color: P.rose, live: false },
  stopped: { label: "parada", product: "Stopped", color: P.faint, live: false },
};
const INITIAL: AvState[] = ["working", "needs", "completed"];
const TASKS = ["informe de cobertura", "arreglar flaky test", "renombrar auth", "subir cobertura", "limpiar imports", "docs del parser", "migrar lint", "bump de deps"];
const SELECTED = 1;

function sessionsFor(count: number, host: Host) {
  return Array.from({ length: count }, (_, i) => {
    const base: AvState = i < INITIAL.length ? INITIAL[i] : "working";
    /* Un shutdown para los procesos vivos; sleep los conserva. */
    const state: AvState = host === "shutdown" && AV_STATE[base].live ? "stopped" : base;
    return { id: i, task: TASKS[i], state, base };
  });
}

const AV = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};
const ROW_PITCH = 0.55;

function Lamp({ state, position }: { state: AvState; position: V3 }) {
  const s = AV_STATE[state];
  /* La forma distingue proceso vivo (esfera) de proceso que ya salió (disco). */
  return s.live ? (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.09, 20, 16]} />
      <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={0.45} roughness={0.3} />
    </mesh>
  ) : (
    <mesh position={[position[0], position[1] - 0.05, position[2]]} castShadow>
      <cylinderGeometry args={[0.09, 0.09, 0.03, 20]} />
      <meshStandardMaterial color={s.color} roughness={0.5} />
    </mesh>
  );
}

function SessionRow({ index, state, selected, attached, peek }: { index: number; state: AvState; selected: boolean; attached: boolean; peek: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const home: V3 = [0, 0.32, -1.3 + index * ROW_PITCH];
  const out: V3 = [3.35, 0.55, 1.1];
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const goal = attached ? out : home;
    const k = still ? 1 : Math.min(1, dt * 4);
    g.position.x += (goal[0] - g.position.x) * k;
    g.position.y += (goal[1] - g.position.y) * k;
    g.position.z += (goal[2] - g.position.z) * k;
  });
  const s = AV_STATE[state];
  return (
    <group ref={ref} position={home}>
      <RoundedBox args={[3.0, 0.14, 0.44]} radius={0.04} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={selected ? mixHex(AV.deck, P.amber, 0.18) : AV.deck} roughness={0.5} clearcoat={0.35} />
      </RoundedBox>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[0.06, 0.15, 0.4]} />
        <meshStandardMaterial color={s.color} roughness={0.4} />
      </mesh>
      {[0, 1, 2].map((l) => (
        <mesh key={l} position={[-0.55 + l * 0.35, 0.075, 0]}>
          <boxGeometry args={[0.28 - (l === 2 ? 0.1 : 0), 0.01, 0.07]} />
          <meshStandardMaterial color={s.live ? AV.charcoal : AV.steel} roughness={0.5} />
        </mesh>
      ))}
      <Lamp state={state} position={[1.25, 0.16, 0]} />
      {peek ? (
        <group position={[0, 1.05, 0.1]} rotation={[-0.35, 0, 0]}>
          <mesh>
            <boxGeometry args={[2.6, 0.8, 0.02]} />
            <meshPhysicalMaterial color={P.amberWash} roughness={0.1} transmission={0.3} transparent opacity={0.8} depthWrite={false} />
          </mesh>
          {[0, 1, 2].map((l) => (
            <mesh key={l} position={[-0.3 + l * 0.1, 0.18 - l * 0.16, 0.02]}>
              <boxGeometry args={[1.4 - l * 0.3, 0.04, 0.01]} />
              <meshStandardMaterial color={P.amber} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
}

function SupervisorTable({ rows }: { rows: number }) {
  const depth = Math.max(3, rows * ROW_PITCH + 0.6);
  return (
    <group>
      <RoundedBox args={[3.6, 0.2, depth]} position={[0, 0.12, -1.3 + (rows - 1) * ROW_PITCH / 2]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={AV.charcoal} roughness={0.4} metalness={0.3} clearcoat={0.3} />
      </RoundedBox>
      {[-1.72, 1.72].map((x) => (
        <mesh key={x} position={[x, 0.26, -1.3 + (rows - 1) * ROW_PITCH / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, depth - 0.1, 10]} />
          <meshStandardMaterial color={AV.brass} roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function rowsFor(count: number, host: Host, key: AvKey) {
  return sessionsFor(count, host).map((row) =>
    /* attach, peek o una respuesta reinician una sesión parada por el host */
    host === "shutdown" && key !== "table" && row.id === SELECTED ? { ...row, state: row.base } : row,
  );
}

function AgentViewScene({ count, avKey, host, pulse }: { count: number; avKey: AvKey; host: Host; pulse: number }) {
  const rows = rowsFor(count, host, avKey);
  const newest = count - 1;
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -0.28, 0.4]} scale={10} opacity={0.12} />
        <RoundedBox args={[9.6, 0.3, 5.6]} position={[0, -0.13, 0.5]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={AV.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[9.25, 0.06, 5.25]} position={[0, 0.05, 0.5]} radius={0.03} smoothness={3} receiveShadow>
          <meshStandardMaterial color={AV.baseTop} roughness={0.45} metalness={0.22} />
        </RoundedBox>
        <SupervisorTable rows={count} />
        {rows.map((row) => (
          <SessionRow key={row.id} index={row.id} state={row.state} selected={row.id === SELECTED} attached={avKey === "attach" && row.id === SELECTED} peek={avKey === "peek" && row.id === SELECTED} />
        ))}
        {/* placa de despacho: cada Enter crea una fila, no responde a la seleccionada */}
        <group position={[-3.4, 0.08, 1.9]}>
          <RoundedBox args={[1.9, 0.14, 1.1]} position={[0, 0.07, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
            <meshStandardMaterial color={AV.charcoal} roughness={0.4} metalness={0.3} />
          </RoundedBox>
          <RoundedBox args={[1.2, 0.08, 0.36]} position={[-0.2, 0.18, -0.2]} radius={0.03} smoothness={2} castShadow>
            <meshStandardMaterial color={P.violetWash} roughness={0.5} />
          </RoundedBox>
          <RoundedBox key={pulse} args={[0.46, 0.16, 0.42]} position={[0.55, 0.22, 0.22]} radius={0.05} smoothness={3} castShadow>
            <meshPhysicalMaterial color={P.violet} roughness={0.35} clearcoat={0.6} />
          </RoundedBox>
          <Tag position={[0, 0.65, -0.1]} tone="violet" size="xs" center>despacho</Tag>
        </group>
        <Arrow from={[-2.45, 0.45, 1.8]} to={[-1.65, 0.45, -1.3 + newest * ROW_PITCH]} color={P.violet} head={0.09} bow={0.2} />
        {/* terminal donde se adjunta una sesión */}
        <group position={[3.35, 0.08, 1.1]}>
          <RoundedBox args={[3.3, 0.12, 1.0]} position={[0, 0.06, 0]} radius={0.04} smoothness={3} castShadow receiveShadow>
            <meshStandardMaterial color={AV.deck} roughness={0.5} />
          </RoundedBox>
          <RoundedBox args={[3.0, 1.2, 0.12]} position={[0, 0.9, -0.5]} radius={0.05} smoothness={3} castShadow receiveShadow>
            <meshPhysicalMaterial color={AV.charcoal} roughness={0.35} clearcoat={0.5} />
          </RoundedBox>
          <mesh position={[0, 0.92, -0.43]}>
            <boxGeometry args={[2.75, 0.98, 0.01]} />
            <meshStandardMaterial color={avKey === "attach" ? "#10302D" : "#14181B"} emissive={avKey === "attach" ? P.teal : "#000"} emissiveIntensity={avKey === "attach" ? 0.15 : 0} />
          </mesh>
          <Tag position={[0, 1.75, -0.5]} tone={avKey === "attach" ? "teal" : "muted"} size="xs" center>{avKey === "attach" ? "sesión adjunta" : "terminal"}</Tag>
        </group>
        <Tag position={[-2.3, 0.55, -1.7]} tone="teal" center>Agent View</Tag>
        <Tag position={avKey === "attach" ? [3.35, 0.95, 1.55] : [2.35, 0.55, -1.3 + SELECTED * ROW_PITCH]} tone={AV_STATE[rows[SELECTED]?.state ?? "needs"].live ? "amber" : "muted"} size="xs" center>{AV_STATE[rows[SELECTED]?.state ?? "needs"].label}</Tag>
        {host !== "on" ? <Tag position={[-3.4, 1.5, -1.0]} tone={host === "sleep" ? "violet" : "rose"} size="xs" center>{host === "sleep" ? "portátil en sleep" : "host apagado"}</Tag> : null}
      </group>
    </PointerTilt>
  );
}

const KEY_TEXT: Record<AvKey, string> = {
  table: "Estás en la tabla. ← desadjunta y vuelve aquí: la sesión sigue trabajando bajo el supervisor por usuario. Esc cierra la TUI sin matar ninguna sesión.",
  peek: "Space hace peek: miras la salida de la fila seleccionada sin adjuntarte. La fila no sale de la tabla.",
  attach: "Enter o → adjunta: la fila sale al terminal y lo que escribas va a esa sesión. Es la única forma de continuar una tarea; escribir en el despacho crea otra.",
};
const HOST_TEXT: Record<Host, string> = {
  on: "",
  sleep: "Sleep del portátil: el supervisor conserva todas las sesiones y sus estados.",
  shutdown: "Shutdown del host: los procesos vivos se paran. Attach, peek o una respuesta reinician la sesión.",
};

function AgentViewNote({ count, avKey, host }: { count: number; avKey: AvKey; host: Host }) {
  const rows = rowsFor(count, host, avKey);
  const live = rows.filter((r) => AV_STATE[r.state].live).length;
  return (
    <div className="space-y-3">
      <p><strong>El despacho no es un chat.</strong> Cada Enter en la placa violeta arranca una sesión nueva en segundo plano; no es un follow-up a la fila seleccionada. {KEY_TEXT[avKey]} {HOST_TEXT[host]}</p>
      <Readout items={[
        { label: "sesiones", value: String(count), tone: "var(--violet)" },
        { label: "procesos vivos", value: String(live), tone: "var(--teal)" },
        { label: "cuota", value: `≈ ${count} × una sesión`, tone: "var(--amber)" },
      ]} />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {rows.map((r) => <li key={r.id}><span className="font-mono">{r.task}</span> · {AV_STATE[r.state].label} <span className="text-muted">({AV_STATE[r.state].product})</span></li>)}
      </ul>
      <p className="text-xs text-muted">Esfera = proceso vivo; disco = proceso que ya salió. Cada sesión consume la suscripción por separado: diez en paralelo cuestan del orden de diez veces una (multiplicador documentado, sin precios inventados). Agent View es research preview; <code>/agents</code> no es <code>claude agents</code>.</p>
    </div>
  );
}

function SpanishVisual() {
  const [count, setCount] = useState(INITIAL.length);
  const [avKey, setAvKey] = useState<AvKey>("table");
  const [host, setHost] = useState<Host>("on");
  return (
    <Figure
      label="Agent View · despachar, no conversar"
      hint="Enter crea una sesión · Space mira · → adjunta · ← vuelve"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.violet, label: "despacho / sesión nueva" },
        { color: P.teal, label: "trabajando" },
        { color: P.amber, label: "pide respuesta" },
        { color: P.faint, label: "parada" },
      ]}
      note={<AgentViewNote count={count} avKey={avKey} host={host} />}
      controls={
        <>
          <button type="button" className="chip" disabled={count >= TASKS.length} onClick={() => { setCount((c) => Math.min(TASKS.length, c + 1)); setAvKey("table"); }}>Enter · despachar</button>
          <Switcher value={avKey} onChange={setAvKey} ariaLabel="Tecla sobre la fila seleccionada" options={[
            { value: "table", label: "← en la tabla", tone: P.inkSoft },
            { value: "peek", label: "Space · peek", tone: P.amber },
            { value: "attach", label: "→ attach", tone: P.teal },
          ]} />
          <Switcher value={host} onChange={setHost} ariaLabel="Estado del host" options={[
            { value: "on", label: "Host activo", tone: P.teal },
            { value: "sleep", label: "Sleep", tone: P.violet },
            { value: "shutdown", label: "Shutdown", tone: P.rose },
          ]} />
          <Knob label="sesiones" value={count} min={1} max={TASKS.length} onChange={setCount} tone="var(--violet)" />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 6.5, 9.5], fov: 34 }} fit={1.08}>
        <AgentViewScene count={count} avKey={avKey} host={host} pulse={count} />
      </Stage>
    </Figure>
  );
}

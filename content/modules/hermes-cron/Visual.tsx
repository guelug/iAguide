"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useRef } from "react";
import { Group } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { PointerTilt, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "a" | "b" | "c" | "d" | "e";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "fresh_agent": "fresh agent",
      "deliver": "deliver",
      "guard": "guard",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "fresh_agent": "agente fresco",
      "deliver": "entrega",
      "guard": "guard",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: "jobs.json", tone: "var(--teal)" },
    { value: "b" as const, label: "tick", tone: "var(--teal)" },
    { value: "c" as const, label: t.fresh_agent, tone: "var(--amber)" },
    { value: "d" as const, label: t.deliver, tone: "var(--violet)" },
    { value: "e" as const, label: t.guard, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="Hermes: cron jobs.json"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="hermes-cron diagram steps"
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
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        jobs.json
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        tick
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.fresh_agent}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.deliver}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.guard}</Tag>
    </group>
  );
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Simulación del ciclo de tick de Hermes (Cron Internals): cada 60 s se
   adquiere el lock, se cargan los jobs de jobs.json, se filtran los due
   (next_run <= now y state == scheduled), cada uno corre en un AIAgent
   fresco, se entrega, se recalcula next_run y se escribe el fichero. Los
   jobs y horas son didácticos; las reglas, las documentadas. */

type JobState = "scheduled" | "paused" | "completed" | "running";
type Job = { id: string; name: string; schedule: string; deliver: string; kind: "cron" | "every" | "once"; at: number; every?: number; times?: number; paused?: boolean };

const hm = (h: number, m: number) => h * 60 + m;
const JOBS: Job[] = [
  { id: "a", name: "briefing diario", schedule: "0 9 * * *", deliver: "telegram:chat_id", kind: "cron", at: hm(9, 0) },
  { id: "b", name: "revisar precios", schedule: "every 30m", deliver: "local", kind: "every", at: hm(9, 10), every: 30, times: 2 },
  { id: "c", name: "recordatorio", schedule: "30m", deliver: "origin", kind: "once", at: hm(9, 20) },
  { id: "d", name: "diff competidores", schedule: "every 2h", deliver: "slack:#eng", kind: "every", at: hm(9, 30), every: 120, paused: true },
];
const START = hm(8, 55);
const SPAN = 70;

function fmtClock(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* Recorre los ticks de minuto en minuto hasta `now`, aplicando las reglas. */
function simulate(now: number) {
  const rows = JOBS.map((job) => ({ job, next: job.at as number | null, runs: 0, last: null as number | null, state: (job.paused ? "paused" : "scheduled") as JobState }));
  let dueNow: string[] = [];
  for (let t = START; t <= now; t++) {
    const due = rows.filter((r) => r.state === "scheduled" && r.next !== null && r.next <= t);
    if (t === now) dueNow = due.map((r) => r.job.id);
    for (const r of due) {
      r.runs += 1;
      r.last = t;
      if (r.job.kind === "once") { r.next = null; r.state = "completed"; }
      else if (r.job.kind === "cron") r.next = r.next! + 24 * 60;
      else {
        r.next = r.next! + (r.job.every ?? 60);
        if (r.job.times && r.runs >= r.job.times) { r.state = "completed"; r.next = null; }
      }
    }
  }
  /* Durante el tick en que disparan, se ven como running (transitorio). */
  const view = rows.map((r) => ({ ...r, shown: dueNow.includes(r.job.id) ? ("running" as JobState) : r.state }));
  return { rows: view, dueNow, total: rows.reduce((s, r) => s + r.runs, 0) };
}

const CR = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};
const STATE_COLOR: Record<JobState, string> = { scheduled: P.teal, paused: P.faint, completed: mixHex(P.teal, P.paper, 0.55), running: P.amber };
const STATE_ES: Record<JobState, string> = { scheduled: "programado", paused: "en pausa", completed: "completado", running: "ejecutándose" };

function TickDial({ position, active, blocked = false, scale = 1 }: { position: V3; active: boolean; blocked?: boolean; scale?: number }) {
  const hand = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (hand.current && !still && !blocked) hand.current.rotation.z -= dt * 1.05;
  });
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[1.5, 0.16, 0.9]} position={[0, 0.08, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={CR.charcoal} roughness={0.4} metalness={0.3} />
      </RoundedBox>
      <group position={[0, 1.12, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.82, 0.82, 0.14, 64]} />
          <meshPhysicalMaterial color={CR.brass} roughness={0.3} metalness={0.7} clearcoat={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.075]}>
          <circleGeometry args={[0.72, 64]} />
          <meshStandardMaterial color={blocked ? P.roseWash : CR.deck} roughness={0.6} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.6, Math.cos((i / 12) * Math.PI * 2) * 0.6, 0.08]} rotation={[0, 0, -(i / 12) * Math.PI * 2]}>
            <boxGeometry args={[0.03, i % 3 === 0 ? 0.14 : 0.07, 0.01]} />
            <meshStandardMaterial color={CR.charcoal} />
          </mesh>
        ))}
        <group ref={hand} position={[0, 0, 0.1]}>
          <mesh position={[0, 0.27, 0]}>
            <boxGeometry args={[0.04, 0.56, 0.02]} />
            <meshStandardMaterial color={blocked ? P.rose : P.amber} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.11]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial color={CR.charcoal} />
        </mesh>
      </group>
      {/* soportes */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.35, -0.05]} castShadow>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color={CR.steel} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* lock del scheduler */}
      <group position={[0.55, 0.3, 0.45]}>
        <RoundedBox args={[0.3, 0.26, 0.14]} radius={0.04} smoothness={2} castShadow>
          <meshStandardMaterial color={active && !blocked ? P.amber : blocked ? P.rose : CR.steel} metalness={0.5} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, active && !blocked ? 0.16 : 0.22, 0]}>
          <torusGeometry args={[0.09, 0.025, 10, 24, Math.PI]} />
          <meshStandardMaterial color={CR.steel} metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function JobCard({ index, name, state, lifted }: { index: number; name: string; state: JobState; lifted: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const baseY = 0.62;
  useFrame((_, dt) => {
    if (!ref.current) return;
    const goal = lifted ? baseY + 0.35 : baseY;
    ref.current.position.y += (goal - ref.current.position.y) * (still ? 1 : Math.min(1, dt * 4));
  });
  const color = STATE_COLOR[state];
  return (
    <group ref={ref} position={[-0.9 + index * 0.6, baseY, 0]}>
      <RoundedBox args={[0.46, 0.9, 0.1]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={state === "paused" ? mixHex(CR.deck, P.ink, 0.12) : CR.deck} roughness={0.55} clearcoat={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.38, 0.055]}>
        <boxGeometry args={[0.46, 0.1, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={state === "running" ? 0.5 : 0.1} />
      </mesh>
      {[0, 1, 2, 3].map((l) => (
        <mesh key={l} position={[-0.04, 0.18 - l * 0.13, 0.055]}>
          <boxGeometry args={[0.3 - (l % 2) * 0.08, 0.025, 0.005]} />
          <meshStandardMaterial color={CR.steel} />
        </mesh>
      ))}
      <mesh position={[0, -0.34, 0.06]}>
        <sphereGeometry args={[0.05, 14, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {lifted ? <Tag position={[0, 0.7, 0]} tone="amber" size="xs" center>{name}</Tag> : null}
    </group>
  );
}

const DESTS = [
  { key: "telegram", label: "telegram", color: P.teal },
  { key: "local", label: "local", color: P.inkSoft },
  { key: "origin", label: "origin", color: P.violet },
];
const destIndex = (deliver: string) => Math.max(0, DESTS.findIndex((d) => deliver.startsWith(d.key)));

function AgentBay({ running }: { running: boolean }) {
  return (
    <group position={[1.9, 0.08, 0]}>
      <RoundedBox args={[2.0, 0.14, 1.7]} position={[0, 0.07, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={CR.deck} roughness={0.5} />
      </RoundedBox>
      {running ? (
        <RoundedBox args={[1.0, 0.8, 0.8]} position={[0, 0.56, -0.15]} radius={0.1} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color={CR.charcoal} roughness={0.35} clearcoat={0.6} />
        </RoundedBox>
      ) : (
        <mesh position={[0, 0.16, -0.15]}>
          <boxGeometry args={[1.0, 0.02, 0.8]} />
          <meshStandardMaterial color={mixHex(CR.deck, P.ink, 0.15)} />
        </mesh>
      )}
      {/* toolset: cronjob sacado de su ranura (guardia de recursión) */}
      <RoundedBox args={[1.6, 0.1, 0.36]} position={[0, 0.19, 0.55]} radius={0.03} smoothness={2} castShadow>
        <meshStandardMaterial color={CR.charcoal} roughness={0.4} metalness={0.3} />
      </RoundedBox>
      {["web", "ficheros", "cronjob"].map((tool, i) => {
        const guard = tool === "cronjob";
        return (
          <group key={tool} position={[-0.5 + i * 0.5, guard ? 0.5 : 0.36, guard ? 0.9 : 0.55]} rotation={[guard ? 0.5 : 0, 0, 0]}>
            <RoundedBox args={[0.3, 0.3, 0.24]} radius={0.04} smoothness={2} castShadow>
              <meshPhysicalMaterial color={guard ? P.roseWash : P.tealWash} roughness={0.45} clearcoat={0.4} />
            </RoundedBox>
            <mesh position={[0, 0.08, 0.125]}>
              <boxGeometry args={[0.18, 0.04, 0.01]} />
              <meshStandardMaterial color={guard ? P.rose : P.teal} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[1.05, 0.55, 1.25]} tone="rose" size="xs" center>cronjob off</Tag>
      <Tag position={[0, 1.25, -0.15]} tone={running ? "violet" : "muted"} size="xs" center>{running ? "AIAgent fresco" : "sin corrida"}</Tag>
    </group>
  );
}

function CronScene({ now, second }: { now: number; second: boolean }) {
  const sim = simulate(now);
  const running = sim.dueNow.length > 0;
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -0.28, 0]} scale={11} opacity={0.12} />
        <RoundedBox args={[10.8, 0.3, 4.2]} position={[0, -0.13, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={CR.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[10.45, 0.06, 3.85]} position={[0, 0.05, 0]} radius={0.03} smoothness={3} receiveShadow>
          <meshStandardMaterial color={CR.baseTop} roughness={0.45} metalness={0.22} />
        </RoundedBox>
        <TickDial position={[-4.2, 0.08, 0.2]} active={running} />
        {second ? <TickDial position={[-2.85, 0.08, 1.35]} active={false} blocked scale={0.5} /> : null}
        <Tag position={[-4.2, 2.2, 0.2]} tone="amber" size="xs" center>{`tick ${fmtClock(now)}`}</Tag>
        {second ? <Tag position={[-2.85, 1.2, 1.35]} tone="rose" size="xs" center>tick() → 0</Tag> : null}
        {/* jobs.json: bandeja con una ficha por job */}
        <group position={[-1.3, 0.08, 0]}>
          <RoundedBox args={[2.6, 0.18, 1.2]} position={[0, 0.09, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
            <meshPhysicalMaterial color={CR.charcoal} roughness={0.4} metalness={0.3} clearcoat={0.3} />
          </RoundedBox>
          {sim.rows.map((r, i) => <JobCard key={r.job.id} index={i} name={r.job.name} state={r.shown} lifted={r.shown === "running"} />)}
          <Tag position={[0, 0.25, 0.85]} tone="teal" size="xs" center>jobs.json</Tag>
        </group>
        <AgentBay running={running} />
        {running ? <Flow points={[[-0.6, 1.1, 0], [0.4, 1.3, 0], [1.4, 0.8, -0.1]]} color={P.amber} count={3} speed={0.45} /> : null}
        {/* destinos de entrega */}
        {DESTS.map((d, i) => (
          <group key={d.key} position={[4.35, 0.08, -1.05 + i * 1.05]}>
            <RoundedBox args={[0.9, 0.45, 0.7]} position={[0, 0.28, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
              <meshPhysicalMaterial color={mixHex(CR.deck, d.color, 0.15)} roughness={0.5} clearcoat={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.51, 0]}>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color={CR.charcoal} />
            </mesh>
            <Tag position={[0.85, 0.3, 0]} tone="muted" size="xs" center>{d.label}</Tag>
          </group>
        ))}
        {sim.rows.filter((r) => r.shown === "running").map((r) => {
          const z = -1.05 + destIndex(r.job.deliver) * 1.05;
          return <Flow key={r.job.id} points={[[2.5, 0.9, -0.1], [3.4, 1.0, z * 0.6], [4.35, 0.6, z]]} color={P.violet} count={3} speed={0.45} />;
        })}
      </group>
    </PointerTilt>
  );
}

function CronNote({ now, second }: { now: number; second: boolean }) {
  const sim = simulate(now);
  const due = sim.rows.filter((r) => r.shown === "running");
  return (
    <div className="space-y-3">
      <p>
        <strong>Tick de las {fmtClock(now)}.</strong>{" "}
        {due.length
          ? `Lock adquirido; ${due.map((r) => r.job.name).join(" y ")} ${due.length > 1 ? "están" : "está"} due. Cada uno pasa a running, corre en un AIAgent fresco (sin historial de corridas previas y con el toolset cronjob desactivado), entrega en ${due.map((r) => r.job.deliver).join(", ")} y recalcula next_run.`
          : "Lock adquirido, jobs cargados, ningún job cumple next_run <= now con state == scheduled. Se escribe jobs.json y se libera el lock."}{" "}
        {second ? "Un hermes cron manual intenta el mismo tick: no consigue el lock y tick() devuelve 0, así que nada se entrega dos veces." : null}
      </p>
      <Readout items={[
        { label: "due en este tick", value: String(due.length), tone: "var(--amber)" },
        { label: "corridas acumuladas", value: String(sim.total), tone: "var(--violet)" },
        { label: "tick", value: "60 s", tone: "var(--teal)" },
      ]} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-left text-xs">
          <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">job</th><th className="border-b border-line px-2 py-1">schedule</th><th className="border-b border-line px-2 py-1">state</th><th className="border-b border-line px-2 py-1">corridas</th><th className="border-b border-line px-2 py-1">next_run_at</th></tr></thead>
          <tbody>{sim.rows.map((r) => (
            <tr key={r.job.id}>
              <td className="border-b border-line/60 px-2 py-1">{r.job.name}</td>
              <td className="border-b border-line/60 px-2 py-1 font-mono">{r.job.schedule}{r.job.times ? ` · repeat ${r.job.times}` : ""}</td>
              <td className="border-b border-line/60 px-2 py-1 font-mono" style={{ color: STATE_COLOR[r.shown] }}>{r.shown} <span className="text-muted">({STATE_ES[r.shown]})</span></td>
              <td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">{r.runs}</td>
              <td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">{r.next === null ? "—" : r.next >= 24 * 60 ? `mañana ${fmtClock(r.next)}` : fmtClock(r.next)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Jobs y horas didácticos; reglas de Cron Internals (Nous Research): tick cada 60 s, filtro due, cuatro estados cerrados, repeat.times agotado → completed, one-shot relativo completa tras un fuego. La aguja gira más rápido que un reloj real. En modo CLI no hay daemon: los jobs solo disparan mientras corre hermes cron o una sesión CLI.</p>
    </div>
  );
}

function SpanishVisual() {
  const [offset, setOffset] = useState(5);
  const [second, setSecond] = useState(false);
  const now = START + offset;
  return (
    <Figure
      label="Cron de Hermes · un tick por minuto"
      hint="lock → jobs.json → due → AIAgent fresco → entrega"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "scheduled" },
        { color: P.amber, label: "running / lock" },
        { color: P.violet, label: "entrega" },
        { color: P.rose, label: "guardia y lock ocupado" },
      ]}
      note={<CronNote now={now} second={second} />}
      controls={
        <>
          <Knob label="hora" value={offset} min={0} max={SPAN} onChange={setOffset} format={(v) => fmtClock(START + v)} tone="var(--amber)" />
          <button type="button" className="chip" onClick={() => setOffset((v) => Math.min(SPAN, v + 1))}>Siguiente tick</button>
          <Switcher value={second ? "two" : "one"} onChange={(v) => setSecond(v === "two")} ariaLabel="Procesos que hacen tick" options={[
            { value: "one", label: "Solo gateway", tone: P.teal },
            { value: "two", label: "+ hermes cron manual", tone: P.rose },
          ]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 6, 10], fov: 34 }} fit={1.08}>
        <CronScene now={now} second={second} />
      </Stage>
    </Figure>
  );
}

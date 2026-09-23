"use client";

import { useState, useMemo, useRef } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire, ShadowBlob, Arrow } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type Group } from "three";
import { useLocale } from "next-intl";

/* The dummy loop: Action until Final Answer, Observation appended by hand,
   max_steps as the seatbelt. */
type Mode = "action" | "final" | "cap";

const COPY = {
  en: {
    the_loop_in_twenty_lines: "the loop in twenty lines",
    action_observation_final_answer: "action, observation, final answer",
    action: "action",
    final: "final answer",
    cap: "max_steps",
    thought: "thought",
    parse: "parses",
    tool_runs: "tool runs",
    append_obs: "append observation",
    exit: "exit",
    no_more_calls: "no more calls",
    third_action: "3rd action",
    would_exceed: "would exceed",
    halt: "halt",
  },
  es: {
    the_loop_in_twenty_lines: "el bucle en veinte líneas",
    action_observation_final_answer: "acción, observación, final answer",
    action: "acción",
    final: "final answer",
    cap: "max_steps",
    thought: "pensamiento",
    parse: "parsea",
    tool_runs: "corre la tool",
    append_obs: "añade observación",
    exit: "sale",
    no_more_calls: "no más llamadas",
    third_action: "3ª acción",
    would_exceed: "se pasaría",
    halt: "alto",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("action");

  return (
    <Figure
      label={t.the_loop_in_twenty_lines}
      hint={t.action_observation_final_answer}
      legend={[
        { color: P.teal, label: "harness" },
        { color: P.amber, label: "tool" },
        { color: P.rose, label: t.cap },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "action", label: t.action, tone: P.teal },
            { value: "final", label: t.final, tone: P.violet },
            { value: "cap", label: t.cap, tone: P.rose },
          ]}
          ariaLabel={t.the_loop_in_twenty_lines}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "action" && (
          <>
            {/* model emits a Thought + Action JSON */}
            <Slab position={[-2.4, 0.85, 0]} size={[1.9, 1.0, 0.12]} color={P.teal} fill={0.16} />
            <Tag position={[-2.4, 1.55, 0.15]} tone="teal">{t.thought}</Tag>
            <Tag position={[-2.4, 0.85, 0.15]} tone="teal" size="xs">{"{ name: search, args: … }"}</Tag>
            {/* harness parses */}
            <Node3D position={[-0.2, 0.85, 0]} color={P.violet} radius={0.15} pulse={0.3} />
            <Tag position={[-0.2, 1.3, 0.15]} tone="violet" size="xs">{t.parse}</Tag>
            {/* tool runs */}
            <Slab position={[2.2, 0.85, 0]} size={[1.6, 0.8, 0.14]} color={P.amber} fill={0.24} />
            <Tag position={[2.2, 1.5, 0.15]} tone="amber">{t.tool_runs}</Tag>
            <Flow points={[[-1.45, 0.85, 0], [-0.45, 0.85, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[0.05, 0.85, 0], [1.35, 0.85, 0]]} color={P.violet} count={3} />
            {/* observation written back into the transcript */}
            <Flow points={[[2.2, 0.45, 0], [0.5, -0.8, 0], [-1.6, -0.6, 0], [-2.4, 0.3, 0]]} color={P.rose} count={4} />
            <Tag position={[0.4, -1.2, 0.15]} tone="rose" size="xs">{t.append_obs}</Tag>
          </>
        )}

        {mode === "final" && (
          <>
            <Slab position={[-2.2, 0.6, 0]} size={[1.9, 1.0, 0.12]} color={P.teal} fill={0.16} />
            <Tag position={[-2.2, 1.3, 0.15]} tone="teal">{t.thought}</Tag>
            <Flow points={[[-1.25, 0.6, 0], [0.2, 0.6, 0]]} color={P.teal} count={3} />
            {/* the Final Answer gate */}
            <Halo position={[0.9, 0.6, 0]} radius={0.55} color={P.violet} opacity={0.7} spin={0.25} />
            <Node3D position={[0.9, 0.6, 0]} color={P.violet} radius={0.16} pulse={0.4} />
            <Tag position={[0.9, 1.35, 0.15]} tone="violet">{t.final}</Tag>
            <Flow points={[[1.5, 0.6, 0], [2.8, 0.6, 0]]} color={P.violet} count={2} />
            <Tag position={[3.0, 0.6, 0.15]} tone="violet" size="xs">{t.exit}</Tag>
            {/* loop rail becomes quiet */}
            <Wire points={[[2.0, -0.4, 0], [0, -1.1, 0], [-2.0, -0.4, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Tag position={[0, -1.5, 0.15]} tone="muted" size="xs">{t.no_more_calls}</Tag>
          </>
        )}

        {mode === "cap" && (
          <>
            {/* steps 1, 2 ok — 3rd would exceed */}
            {[1, 2, 3].map((n) => (
              <group key={n}>
                <Slab
                  position={[-1.8 + (n - 1) * 1.7, 0.5, 0]}
                  size={[1.4, 0.55, 0.12]}
                  color={n < 3 ? P.teal : P.rose}
                  fill={n < 3 ? 0.22 : 0.1}
                />
                <Tag position={[-1.8 + (n - 1) * 1.7, 1.05, 0.15]} tone={n < 3 ? "teal" : "rose"} size="xs">
                  step {n}
                </Tag>
              </group>
            ))}
            <Flow points={[[-1.1, 0.5, 0], [-0.45, 0.5, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[0.6, 0.5, 0], [1.3, 0.5, 0]]} color={P.rose} count={2} size={0.05} />
            <Halo position={[1.9, 0.5, 0]} radius={0.55} color={P.rose} opacity={0.6} spin={0.3} />
            <Tag position={[1.9, 1.25, 0.15]} tone="rose">{t.halt}</Tag>
            <Wire points={[[-2.9, -0.5, 0], [2.9, -0.5, 0]]} color={P.lineStrong} opacity={0.7} />
            <Tag position={[-2.9, -0.95, 0.15]} tone="muted" size="xs">{t.cap} = 2</Tag>
            <Tag position={[1.9, -0.95, 0.15]} tone="rose" size="xs">{t.would_exceed}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * El bucle dummy como pista circular con cuatro estaciones (muestrear,
 * parsear, ejecutar, añadir) y, al lado, la lista de mensajes que crece.
 * Cada vuelta del bucle apila la completion y la Observation sobre la
 * pila; la siguiente llamada hace prefill de TODA la pila. El grosor de
 * cada placa es proporcional a sus caracteres, que se cuentan aquí de
 * las cadenas de ejemplo. max_steps es el tope de llamadas a `chat`.
 */

type Role = "system" | "user" | "assistant" | "observation" | "final";
type Msg = { role: Role; text: string };

const ES_SYSTEM =
  "Responde lo mejor que puedas. Tienes una herramienta: get_weather(location: str), el tiempo actual en un lugar. " +
  "Emite UNA acción cada vez como JSON con las claves action y action_input. Formato: Question, Thought, Action, " +
  "Observation, repetir. Termina con «Thought: I now know the final answer» y «Final Answer:».";
const ES_USER = "¿Qué tiempo hace en Londres y en París?";

type Turn = { thought: string; city?: string; obs?: string; final?: string };
const ES_SCRIPT: Turn[] = [
  { thought: "Thought: primero Londres", city: "London", obs: "Observation: soleado y frío" },
  { thought: "Thought: ahora París", city: "Paris", obs: "Observation: nublado, 14 °C" },
  { thought: "Thought: I now know the final answer", final: "Final Answer: Londres soleado y frío; París nublado, 14 °C." },
];

function actionText(city: string) {
  return 'Action: {"action": "get_weather", "action_input": {"location": "' + city + '"}}';
}

type Phase = "sample" | "parse" | "tool" | "append" | "final" | "halt";
type Ev = { phase: Phase; call: number; stack: Msg[]; pending?: Msg; prefill: number };

function chars(stack: Msg[]) {
  return stack.reduce((sum, m) => sum + m.text.length, 0);
}

/** Runs the scripted loop under a max_steps cap and records every phase. */
function simulate(maxSteps: number): Ev[] {
  const events: Ev[] = [];
  const stack: Msg[] = [
    { role: "system", text: ES_SYSTEM },
    { role: "user", text: ES_USER },
  ];
  for (let i = 0; ; i++) {
    if (i >= maxSteps) {
      events.push({ phase: "halt", call: i, stack: [...stack], prefill: chars(stack) });
      break;
    }
    const turn = ES_SCRIPT[i];
    const prefill = chars(stack);
    if (turn.final) {
      const msg: Msg = { role: "final", text: turn.thought + "\n" + turn.final };
      events.push({ phase: "sample", call: i + 1, stack: [...stack], pending: msg, prefill });
      stack.push(msg);
      events.push({ phase: "final", call: i + 1, stack: [...stack], prefill });
      break;
    }
    const completion: Msg = { role: "assistant", text: turn.thought + "\n" + actionText(turn.city ?? "") };
    events.push({ phase: "sample", call: i + 1, stack: [...stack], pending: completion, prefill });
    events.push({ phase: "parse", call: i + 1, stack: [...stack], pending: completion, prefill });
    events.push({ phase: "tool", call: i + 1, stack: [...stack], pending: completion, prefill });
    stack.push(completion, { role: "observation", text: turn.obs ?? "" });
    events.push({ phase: "append", call: i + 1, stack: [...stack], prefill });
  }
  return events;
}

const DM = {
  base: "#2d3336",
  baseTop: "#41484c",
  rail: "#a3aaad",
  brass: "#b68442",
  ceramic: "#f1ede4",
};

const ROLE_COLOR: Record<Role, string> = {
  system: "#8d9398",
  user: P.amber,
  assistant: P.violet,
  observation: P.teal,
  final: P.violetDeep,
};

const STATIONS: { phase: Phase; label: string; angle: number }[] = [
  { phase: "sample", label: "muestrear", angle: Math.PI / 2 },
  { phase: "parse", label: "parsear", angle: 0 },
  { phase: "tool", label: "get_weather", angle: -Math.PI / 2 },
  { phase: "append", label: "añadir", angle: Math.PI },
];

const RING_R = 1.75;
const RING_C: [number, number] = [-2.3, 0.1];

function ringPoint(angle: number, r = RING_R, y = 0): [number, number, number] {
  return [RING_C[0] + Math.cos(angle) * r, y, RING_C[1] - Math.sin(angle) * r];
}

function phaseAngle(phase: Phase) {
  const st = STATIONS.find((s) => s.phase === phase);
  if (st) return st.angle;
  return Math.PI / 2; // final and halt happen at the sampler
}

function Pod({ label, angle, active, visited, tone }: { label: string; angle: number; active: boolean; visited: boolean; tone: string }) {
  const [x, , z] = ringPoint(angle, RING_R + 0.02);
  const body = active ? mixHex(P.paper, tone, 0.35) : visited ? mixHex(P.paper, tone, 0.14) : "#e2dfd6";
  return (
    <group position={[x, 0, z]} rotation={[0, angle - Math.PI / 2, 0]}>
      <RoundedBox args={[0.95, 0.46, 0.7]} position={[0, 0.23, 0]} radius={0.09} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={body} roughness={0.4} clearcoat={0.45} clearcoatRoughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 24]} />
        <meshStandardMaterial color={active ? tone : DM.rail} metalness={0.5} roughness={0.3} emissive={active ? tone : "#000000"} emissiveIntensity={active ? 0.35 : 0} />
      </mesh>
      <Tag position={[0, 0.82, 0]} tone={active ? "ink" : "muted"} size="xs" center>
        <span className="normal-case">{label}</span>
      </Tag>
    </group>
  );
}

function Shuttle({ angle }: { angle: number }) {
  const ref = useRef<Group>(null);
  const current = useRef(angle);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    // Travel clockwise (decreasing angle) round the loop to the goal.
    let diff = angle - current.current;
    while (diff > 0.0001) diff -= Math.PI * 2;
    while (diff < -Math.PI * 2) diff += Math.PI * 2;
    current.current = still ? angle : current.current + diff * Math.min(1, dt * 3.2);
    const [x, , z] = ringPoint(current.current);
    g.position.set(x, 0.12, z);
    g.rotation.y = current.current;
  });
  const [x0, , z0] = ringPoint(angle);
  return (
    <group ref={ref} position={[x0, 0.12, z0]}>
      <RoundedBox args={[0.3, 0.16, 0.42]} radius={0.05} smoothness={2} castShadow>
        <meshPhysicalMaterial color={P.inkSoft} metalness={0.4} roughness={0.3} clearcoat={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color={P.amber} emissive={P.amber} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Loop({ ev, visited }: { ev: Ev; visited: Set<Phase> }) {
  const railPts = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 64; i++) pts.push(ringPoint((i / 64) * Math.PI * 2, RING_R, 0.05));
    return pts;
  }, []);
  const ended = ev.phase === "final" || ev.phase === "halt";
  return (
    <group>
      {/* The track: a torus rail on a round plinth. */}
      <mesh position={[RING_C[0], -0.01, RING_C[1]]} receiveShadow>
        <cylinderGeometry args={[RING_R + 0.72, RING_R + 0.78, 0.08, 64]} />
        <meshStandardMaterial color={DM.ceramic} roughness={0.62} />
      </mesh>
      <mesh position={[RING_C[0], 0.05, RING_C[1]]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[RING_R, 0.045, 12, 96]} />
        <meshStandardMaterial color={DM.brass} metalness={0.75} roughness={0.28} />
      </mesh>
      {!ended ? <Flow points={railPts.slice(0).reverse()} color={P.violet} count={4} size={0.04} speed={0.12} lineOpacity={0} /> : null}
      {STATIONS.map((s) => (
        <Pod key={s.phase} label={s.label} angle={s.angle} active={ev.phase === s.phase} visited={visited.has(s.phase)} tone={s.phase === "tool" || s.phase === "append" ? P.teal : P.violet} />
      ))}
      <Shuttle angle={phaseAngle(ev.phase)} />
      {/* Two exits from the sampler: Final Answer, or the max_steps brake. */}
      {(() => {
        const [x, , z] = ringPoint(Math.PI / 2, RING_R + 0.9);
        return (
          <group position={[x, 0, z - 0.25]}>
            <Arrow from={[0, 0.3, 0.55]} to={[0, 0.3, -0.35]} color={ev.phase === "final" ? P.violet : ev.phase === "halt" ? P.rose : P.lineStrong} width={2} head={0.12} />
            <Tag position={[0.95, 0.3, -0.2]} tone={ev.phase === "final" ? "violet" : ev.phase === "halt" ? "rose" : "muted"} size="xs" center>
              {ev.phase === "halt" ? "alto: max_steps" : "Final Answer"}
            </Tag>
          </group>
        );
      })()}
    </group>
  );
}

function thickness(text: string) {
  return 0.05 + text.length * 0.0024;
}

function stackPlates(stack: Msg[]) {
  let y = 0.12;
  const plates = stack.map((m, i) => {
    const h = thickness(m.text);
    const plate = { m, y: y + h / 2, h, i };
    y += h + 0.025;
    return plate;
  });
  return { plates, top: y };
}

function Stack({ ev }: { ev: Ev }) {
  const x = 2.55;
  const z = 0.15;
  const { plates, top } = stackPlates(ev.stack);
  return (
    <group position={[x, 0, z]}>
      {/* Tray and spindle posts. */}
      <RoundedBox args={[2.5, 0.12, 1.9]} position={[0, 0.06, 0]} radius={0.05} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={DM.ceramic} roughness={0.6} />
      </RoundedBox>
      {[-1.05, 1.05].map((dx) => (
        <mesh key={dx} position={[dx, 1.05, -0.7]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 2.0, 12]} />
          <meshStandardMaterial color={DM.rail} metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
      {plates.map(({ m, y: py, h, i }) => (
        <RoundedBox key={i + m.role} args={[2.0, h, 1.4]} position={[0, py, 0]} radius={Math.min(0.04, h / 2.2)} smoothness={2} castShadow receiveShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, ROLE_COLOR[m.role], m.role === "system" ? 0.35 : 0.42)} roughness={0.45} clearcoat={0.35} />
        </RoundedBox>
      ))}
      {ev.pending ? (
        <group position={[0, top + 0.35 + thickness(ev.pending.text) / 2, 0]}>
          <RoundedBox args={[2.0, thickness(ev.pending.text), 1.4]} radius={0.03} smoothness={2}>
            <meshStandardMaterial color={mixHex(P.paper, ROLE_COLOR[ev.pending.role], 0.4)} transparent opacity={0.45} roughness={0.5} />
          </RoundedBox>
          <Tag position={[1.35, 0, 0]} tone="violet" size="xs">en vuelo</Tag>
        </group>
      ) : null}
      <Tag position={[-1.3, plates[0].y, 0.75]} tone="muted" size="xs">system</Tag>
      <Tag position={[1.3, top - 0.05, 0.4]} tone="ink" size="xs">{ev.stack.length + " mensajes"}</Tag>
      <Tag position={[0, -0.05, 1.15]} tone="muted" size="xs" center>lista de mensajes</Tag>
    </group>
  );
}

function Lamps({ maxSteps, ev }: { maxSteps: number; ev: Ev }) {
  const made = ev.phase === "halt" ? ev.call : ev.call;
  return (
    <group position={[-2.3, 0, 3.05]}>
      {Array.from({ length: maxSteps }, (_, i) => {
        const on = i < made;
        const x = (i - (maxSteps - 1) / 2) * 0.55;
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0.05, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.2, 0.1, 24]} />
              <meshStandardMaterial color={DM.rail} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <sphereGeometry args={[0.12, 20, 14]} />
              <meshStandardMaterial color={on ? P.amber : "#5a6063"} emissive={on ? P.amber : "#000000"} emissiveIntensity={on ? 0.6 : 0} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[(maxSteps - 1) * 0.275 + 0.55, 0.15, 0]} tone={ev.phase === "halt" ? "rose" : "amber"} size="xs">
        {"llamadas " + made + " / " + maxSteps}
      </Tag>
    </group>
  );
}

function LoopScene({ ev, maxSteps, visited }: { ev: Ev; maxSteps: number; visited: Set<Phase> }) {
  return (
    <group>
      <ShadowBlob position={[0, -0.42, 0.6]} scale={11} opacity={0.12} />
      <RoundedBox args={[10.2, 0.34, 7.2]} position={[0, -0.22, 0.55]} radius={0.16} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={DM.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[9.8, 0.08, 6.8]} position={[0, -0.03, 0.55]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={DM.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <Loop ev={ev} visited={visited} />
      <Stack ev={ev} />
      <Lamps maxSteps={maxSteps} ev={ev} />
      {ev.phase === "append" || ev.phase === "sample" ? (
        <Flow
          points={ev.phase === "append" ? [ringPoint(Math.PI, RING_R + 0.5, 0.5), [-0.3, 1.4, -0.9], [1.4, 1.3, 0.1]] : [[1.4, 0.9, 0.1], [0.2, 1.3, -0.9], ringPoint(Math.PI / 2, RING_R, 0.55)]}
          color={ev.phase === "append" ? P.teal : P.violet}
          count={3}
          size={0.05}
          speed={0.35}
        />
      ) : null}
    </group>
  );
}

const PHASE_TEXT: Record<Phase, string> = {
  sample: "chat() hace prefill de toda la lista y genera hasta la cadena de stop.",
  parse: "Tu código lee el JSON tras «Action:» y comprueba que la herramienta existe.",
  tool: "Tu código ejecuta get_weather con el location del JSON.",
  append: "Añades completion + «Observation:» + resultado a la lista. Otra vuelta.",
  final: "El modelo emite «Final Answer:». El bucle sale sin más llamadas.",
  halt: "Se agotó max_steps antes del Final Answer. El bucle para sin respuesta.",
};

const PHASE_NAME: Record<Phase, string> = {
  sample: "muestrear",
  parse: "parsear",
  tool: "ejecutar",
  append: "añadir",
  final: "Final Answer",
  halt: "alto",
};

function SpanishVisual() {
  const [maxSteps, setMaxSteps] = useState(3);
  const [step, setStep] = useState(0);
  const events = useMemo(() => simulate(maxSteps), [maxSteps]);
  const index = Math.min(step, events.length - 1);
  const ev = events[index];
  const visited = new Set<Phase>(events.slice(0, index + 1).filter((e) => e.call === ev.call).map((e) => e.phase));
  const calls = events.filter((e) => e.phase === "sample");
  const totalPrefill = calls.slice(0, calls.filter((c) => events.indexOf(c) <= index).length).reduce((s, c) => s + c.prefill, 0);
  const last = events.length - 1;
  const ended = events[last].phase;
  return (
    <Figure
      label="El bucle en veinte líneas"
      hint="muestrear · parsear · ejecutar · añadir"
      height="h-[460px] md:h-[560px]"
      legend={[
        { color: P.violet, label: "completion del modelo" },
        { color: P.teal, label: "Observation real" },
        { color: P.amber, label: "mensaje de usuario" },
        { color: P.rose, label: "tope max_steps" },
      ]}
      controls={
        <>
          <div className="flex items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Fases del bucle">
            <button type="button" className="chip min-w-8 px-2" disabled={index <= 0} aria-label="Fase anterior" onClick={() => setStep(Math.max(0, index - 1))}>←</button>
            <span className="px-1 font-mono text-[0.6rem] tabular-nums text-muted">fase {index + 1}/{events.length}</span>
            <button type="button" className="chip min-w-8 px-2" disabled={index >= last} aria-label="Fase siguiente" onClick={() => setStep(Math.min(last, index + 1))}>→</button>
          </div>
          <Knob label="max_steps" value={maxSteps} min={1} max={4} onChange={(v) => { setMaxSteps(v); setStep(0); }} tone="var(--rose)" />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            <strong>Llamada {Math.max(1, ev.call)} · {PHASE_NAME[ev.phase]}.</strong> {PHASE_TEXT[ev.phase]}{" "}
            La pregunta necesita dos consultas (Londres y París) y una tercera llamada para el Final Answer.{" "}
            {ended === "halt"
              ? `Con max_steps = ${maxSteps} el bucle se detiene antes de responder: el tope protege la factura, pero la respuesta queda sin dar.`
              : `Con max_steps = ${maxSteps} caben las tres llamadas${maxSteps > 3 ? " y sobra margen" : ""}.`}
          </p>
          <Readout
            items={[
              { label: "mensajes en la lista", value: String(ev.stack.length), tone: "var(--ink)" },
              { label: "prefill de esta llamada", value: ev.prefill + " caracteres", tone: "var(--violet)" },
              { label: "prefill acumulado", value: totalPrefill + " caracteres", tone: "var(--amber)" },
              { label: "final del recorrido", value: ended === "final" ? "Final Answer" : "alto por max_steps", tone: ended === "final" ? "var(--violet)" : "var(--rose)" },
            ]}
          />
          <p className="text-xs text-muted">
            Caracteres contados de las cadenas de ejemplo (system abreviado, pregunta, completions y Observations); no son tokens de un tokenizer real. Cada llamada reenvía la lista completa: la memoria del dummy es la lista que crece, sin resúmenes ni vector store.
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.6, 7.2, 8.4], fov: 33 }} fit={1.02}>
        <LoopScene ev={ev} maxSteps={maxSteps} visited={visited} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

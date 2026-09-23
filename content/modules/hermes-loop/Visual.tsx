"use client";

import { useState, useMemo } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire, Arrow, ShadowBlob } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";

type Step = "turn" | "http" | "tools" | "intercept" | "budget";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "http_thread": "HTTP thread",
      "seq_vs_pool": "seq vs pool",
      "agent_tools": "agent tools",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "http_thread": "hilo HTTP",
      "seq_vs_pool": "seq vs pool",
      "agent_tools": "tools del agente",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "turn" as const, label: "turn steps", tone: "var(--teal)" },
    { value: "http" as const, label: t.http_thread, tone: "var(--amber)" },
    { value: "tools" as const, label: t.seq_vs_pool, tone: "var(--violet)" },
    { value: "intercept" as const, label: t.agent_tools, tone: "var(--teal)" },
    { value: "budget" as const, label: "500 / 50", tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("turn");

  return (
    <Figure
      label="Hermes: loop internals"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="hermes-loop diagram steps"
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
        color={active === "turn" ? P.teal : P.lineStrong}
        fill={active === "turn" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        turn steps
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "http" ? P.amber : P.lineStrong}
        fill={active === "http" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.http_thread}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "tools" ? P.violet : P.lineStrong}
        fill={active === "tools" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.seq_vs_pool}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "intercept" ? P.teal : P.lineStrong}
        fill={active === "intercept" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.agent_tools}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "budget" ? P.amber : P.lineStrong}
        fill={active === "budget" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        500 / 50
      </Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * El interior de run_conversation en cinco bancos sobre la misma base.
 * Todo lo que se cuenta sale de la guía «Agent Loop Internals» de Nous
 * Research tal como la resume la lección: los nueve pasos del turno, la
 * vuelta al paso 5 cuando hay tool_calls, la espera del hilo principal
 * (respuesta, interrupción, timeout), una tool en el hilo principal frente
 * a varias en ThreadPoolExecutor (clarify fuerza secuencial, resultados
 * en el orden original), las cuatro tools interceptadas y los
 * presupuestos 500 / 50. Las duraciones de las tools son didácticas.
 */

type HlMode = "turn" | "http" | "tools" | "intercept" | "budget";

const HL_STEPS = [
  "task_id",
  "añadir user",
  "system prompt",
  "compresión 50 %",
  "mensajes API",
  "capas efímeras",
  "caché Anthropic",
  "llamada API",
  "parsear",
];

/** Order in which the nine steps run for a turn with `rounds` tool rounds. */
function turnSequence(rounds: number) {
  const seq = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let r = 0; r < rounds; r++) seq.push(4, 5, 6, 7, 8);
  return seq;
}

const HM = {
  base: "#2d3336",
  baseTop: "#42494d",
  brass: "#b68442",
  steel: "#a3aaad",
  ceramic: "#efebe2",
  dark: "#3a4145",
};

function HlBench({ w = 9.4, d = 6 }: { w?: number; d?: number }) {
  return (
    <group>
      <ShadowBlob position={[0, -0.38, 0]} scale={w + 1} opacity={0.12} />
      <RoundedBox args={[w, 0.3, d]} position={[0, -0.2, 0]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={HM.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[w - 0.4, 0.07, d - 0.4]} position={[0, -0.02, 0]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={HM.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={sx + ":" + sz} position={[sx * (w / 2 - 0.35), 0.02, sz * (d / 2 - 0.35)]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
          <meshStandardMaterial color={HM.brass} metalness={0.8} roughness={0.25} />
        </mesh>
      )))}
    </group>
  );
}

/** A small beveled block with a lamp: the unit piece of every bench. */
function Block({ position, size = [0.9, 0.4, 0.6], color, lit = false, label, tone = "muted", labelY = 0.62 }: {
  position: [number, number, number];
  size?: [number, number, number];
  color: string;
  lit?: boolean;
  label?: string;
  tone?: "teal" | "amber" | "violet" | "ink" | "rose" | "muted";
  labelY?: number;
}) {
  return (
    <group position={position}>
      <RoundedBox args={size} position={[0, size[1] / 2, 0]} radius={0.07} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={lit ? mixHex(P.paper, color, 0.4) : "#dedad1"} roughness={0.42} clearcoat={0.45} clearcoatRoughness={0.3} />
      </RoundedBox>
      <mesh position={[0, size[1] + 0.012, 0]}>
        <boxGeometry args={[size[0] - 0.16, 0.02, size[2] - 0.16]} />
        <meshStandardMaterial color={lit ? color : HM.steel} roughness={0.35} metalness={0.3} emissive={lit ? color : "#000000"} emissiveIntensity={lit ? 0.25 : 0} />
      </mesh>
      {label ? (
        <Tag position={[0, labelY, 0]} tone={lit ? tone : "muted"} size="xs" center>
          <span className="normal-case">{label}</span>
        </Tag>
      ) : null}
    </group>
  );
}

const TURN_R = 2.35;

function turnPoint(i: number, r = TURN_R, y = 0): [number, number, number] {
  const a = Math.PI / 2 - (i / HL_STEPS.length) * Math.PI * 2;
  return [Math.cos(a) * r, y, -Math.sin(a) * r * 0.8];
}

function TurnScene({ rounds, at }: { rounds: number; at: number }) {
  const seq = turnSequence(rounds);
  const current = seq[Math.min(at, seq.length - 1)];
  const loopsDone = Math.max(0, Math.floor((at - 4) / 5));
  const ringPts = useMemo(() => Array.from({ length: 73 }, (_, k) => turnPoint((k / 72) * HL_STEPS.length, TURN_R, 0.1)), []);
  return (
    <group>
      <mesh position={[0, 0.04, 0]} scale={[1, 1, 0.8]} receiveShadow>
        <cylinderGeometry args={[TURN_R + 0.75, TURN_R + 0.8, 0.06, 72]} />
        <meshStandardMaterial color={HM.ceramic} roughness={0.62} />
      </mesh>
      <Wire points={ringPts} color={HM.brass} opacity={0.9} width={2} />
      {HL_STEPS.map((name, i) => {
        const [x, , z] = turnPoint(i);
        const active = i === current;
        const passed = seq.slice(0, at + 1).includes(i);
        const tone = i >= 4 ? "teal" : "violet";
        return (
          <group key={name}>
            <Block position={[x, 0, z]} size={[0.62, 0.34, 0.5]} color={i >= 4 ? P.teal : P.violet} lit={active || passed} label={i + 1 + " · " + name} tone={active ? "ink" : tone} labelY={active ? 0.78 : 0.55} />
            {active ? (
              <mesh position={[x, 0.55, z]}>
                <sphereGeometry args={[0.09, 16, 12]} />
                <meshStandardMaterial color={P.amber} emissive={P.amber} emissiveIntensity={0.5} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      {/* The tool_calls return arc: from step 9 back to step 5. */}
      <Arrow from={[turnPoint(8)[0] + 0.1, 0.2, turnPoint(8)[2] + 0.35]} to={[turnPoint(4)[0] - 0.1, 0.2, turnPoint(4)[2] - 0.35]} color={rounds > 0 ? P.amber : P.lineStrong} width={2} head={0.12} bow={-0.6} dashed={rounds === 0} />
      <Tag position={[0, 0.3, 0.35]} tone={rounds > 0 ? "amber" : "muted"} size="xs" center>{rounds > 0 ? "tool_calls → paso 5" : "texto → devolver"}</Tag>
      <Tag position={[0, 0.3, -0.45]} tone="ink" size="xs" center>{"vueltas " + Math.min(loopsDone, rounds) + " / " + rounds}</Tag>
    </group>
  );
}

function HistoryStack({ rows, position }: { rows: { label: string; color: string }[]; position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.7, 0.1, 1.2]} position={[0, 0.05, 0]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={HM.ceramic} roughness={0.6} />
      </RoundedBox>
      {rows.map((r, i) => (
        <group key={i + r.label}>
          <RoundedBox args={[1.45, 0.18, 0.95]} position={[0, 0.19 + i * 0.26, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
            <meshPhysicalMaterial color={mixHex(P.paper, r.color, 0.4)} roughness={0.45} clearcoat={0.35} />
          </RoundedBox>
          <Tag position={[0.85, 0.19 + i * 0.26, 0.3]} tone="muted" size="xs">{r.label}</Tag>
        </group>
      ))}
      <Tag position={[0, -0.02, 0.8]} tone="ink" size="xs" center>historial</Tag>
    </group>
  );
}

function Lamp({ position, on, color, label }: { position: [number, number, number]; on: boolean; color: string; label: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.2, 0.12, 24]} />
        <meshStandardMaterial color={HM.steel} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <sphereGeometry args={[0.11, 20, 14]} />
        <meshStandardMaterial color={on ? color : "#5b6164"} emissive={on ? color : "#000000"} emissiveIntensity={on ? 0.6 : 0} roughness={0.3} />
      </mesh>
      <Tag position={[0, -0.05, 0.36]} tone={on ? "ink" : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function HttpScene({ interrupted }: { interrupted: boolean }) {
  const zMain = -1.1;
  const zWork = 0.7;
  const rows = [
    { label: "system", color: "#8d9398" },
    { label: "user", color: P.amber },
    interrupted ? { label: "user nuevo", color: P.amber } : { label: "assistant", color: P.violet },
  ];
  return (
    <group>
      {[zMain, zWork].map((z) => (
        <mesh key={z} position={[-0.6, 0.04, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 6.2, 12]} />
          <meshStandardMaterial color={HM.brass} metalness={0.75} roughness={0.28} />
        </mesh>
      ))}
      <Tag position={[-3.95, 0.25, zMain]} tone="teal" size="xs" center>hilo principal</Tag>
      <Tag position={[-3.95, 0.25, zWork]} tone="violet" size="xs" center>hilo HTTP</Tag>
      {/* The main thread waits on exactly three things. */}
      <Block position={[-1.6, 0, zMain]} size={[1.2, 0.36, 0.7]} color={P.teal} lit label="espera" tone="teal" />
      <Lamp position={[-0.3, 0, zMain]} on={!interrupted} color={P.teal} label="respuesta" />
      <Lamp position={[0.85, 0, zMain]} on={interrupted} color={P.rose} label="interrupción" />
      <Lamp position={[2.0, 0, zMain]} on={false} color={P.amber} label="timeout" />
      {/* The worker carries the POST; partial tokens pile up as it streams. */}
      <Block position={[-2.3, 0, zWork]} size={[0.9, 0.36, 0.6]} color={P.violet} lit label="POST" tone="violet" />
      {Array.from({ length: 7 }, (_, i) => (
        <RoundedBox key={i} args={[0.22, 0.18, 0.3]} position={[-1.3 + i * 0.3, 0.12, zWork]} radius={0.04} smoothness={2} castShadow>
          <meshPhysicalMaterial color={interrupted ? mixHex(P.paper, P.rose, 0.35) : mixHex(P.paper, P.violet, 0.45)} roughness={0.4} clearcoat={0.4} />
        </RoundedBox>
      ))}
      <Tag position={[-0.4, 0.5, zWork]} tone={interrupted ? "rose" : "violet"} size="xs" center>{interrupted ? "parcial" : "respuesta"}</Tag>
      {interrupted ? (
        <>
          {/* Discard bin: the abandoned response never reaches the history. */}
          <group position={[1.6, 0, zWork + 0.2]}>
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.34, 0.6, 28, 1, true]} />
              <meshStandardMaterial color={P.rose} roughness={0.45} metalness={0.2} side={2} />
            </mesh>
            <Tag position={[0, 0.85, 0]} tone="rose" size="xs" center>descartada</Tag>
          </group>
          <Flow points={[[0.7, 0.2, zWork], [1.2, 0.6, zWork + 0.1], [1.6, 0.45, zWork + 0.2]]} color={P.rose} count={3} size={0.05} speed={0.5} />
        </>
      ) : (
        <Flow points={[[0.8, 0.2, zWork], [1.9, 0.5, 0.0], [2.8, 0.55, -0.35]]} color={P.violet} count={3} size={0.05} speed={0.4} />
      )}
      <HistoryStack rows={rows} position={[3.2, 0, -0.4]} />
    </group>
  );
}

type ToolRun = { name: string; dur: number; interactive?: boolean };

function toolPlan(kind: "one" | "many" | "clarify") {
  const calls: ToolRun[] =
    kind === "one"
      ? [{ name: "read_file", dur: 1.2 }]
      : kind === "many"
        ? [{ name: "read_file", dur: 1.2 }, { name: "web_search", dur: 0.9 }, { name: "terminal", dur: 0.6 }]
        : [{ name: "clarify", dur: 1.6, interactive: true }, { name: "web_search", dur: 0.9 }, { name: "terminal", dur: 0.6 }];
  const sequential = kind !== "many";
  let t = 0;
  const bars = calls.map((c, i) => {
    const start = sequential ? t : 0;
    t += c.dur;
    return { ...c, start, lane: sequential ? 0 : i, index: i };
  });
  const total = sequential ? calls.reduce((s, c) => s + c.dur, 0) : Math.max(...calls.map((c) => c.dur));
  const finishOrder = [...bars].sort((a, b) => a.start + a.dur - (b.start + b.dur)).map((b) => b.index + 1);
  return { bars, total, sequential, finishOrder };
}

const SEC = 1.7; // world units per didactic second on the timeline

function ToolsScene({ kind }: { kind: "one" | "many" | "clarify" }) {
  const plan = toolPlan(kind);
  const x0 = -2.6;
  const laneZ = (lane: number) => -1.2 + lane * 0.85;
  return (
    <group>
      {/* Timeline plate with second ticks. */}
      <RoundedBox args={[5.6, 0.08, 3.0]} position={[x0 + 2.4, 0.04, -0.35]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={HM.ceramic} roughness={0.6} />
      </RoundedBox>
      {[0, 1, 2, 3].map((s) => (
        <group key={s}>
          <mesh position={[x0 + s * SEC, 0.09, -0.35]}>
            <boxGeometry args={[0.015, 0.01, 2.8]} />
            <meshStandardMaterial color={P.lineStrong} />
          </mesh>
          <Tag position={[x0 + s * SEC, 0.1, 1.3]} tone="muted" size="xs" center>{s + " s"}</Tag>
        </group>
      ))}
      <Tag position={[x0 - 0.75, 0.2, laneZ(0)]} tone="teal" size="xs" center>{plan.sequential ? "principal" : "pool 1"}</Tag>
      {!plan.sequential ? [1, 2].map((l) => <Tag key={l} position={[x0 - 0.75, 0.2, laneZ(l)]} tone="violet" size="xs" center>{"pool " + (l + 1)}</Tag>) : null}
      {plan.bars.map((b) => {
        const w = b.dur * SEC;
        const color = b.interactive ? P.amber : plan.sequential ? P.teal : P.violet;
        return (
          <group key={b.name} position={[x0 + b.start * SEC + w / 2, 0.08, laneZ(b.lane)]}>
            <RoundedBox args={[w - 0.05, 0.32, 0.55]} position={[0, 0.16, 0]} radius={0.07} smoothness={3} castShadow receiveShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, color, 0.45)} roughness={0.4} clearcoat={0.45} />
            </RoundedBox>
            <Tag position={[0, 0.34, 0.3]} tone={b.interactive ? "amber" : plan.sequential ? "teal" : "violet"} size="xs" center>
              <span className="normal-case">{b.index + 1 + " " + b.name}</span>
            </Tag>
          </group>
        );
      })}
      {/* End-of-batch marker. */}
      <mesh position={[x0 + plan.total * SEC, 0.35, -0.35]}>
        <boxGeometry args={[0.04, 0.6, 2.8]} />
        <meshStandardMaterial color={P.rose} transparent opacity={0.6} />
      </mesh>
      {/* Results tray: always in the original tool_call order. */}
      <group position={[3.4, 0, -0.35]}>
        <RoundedBox args={[1.3, 0.1, 2.4]} position={[0, 0.05, 0]} radius={0.04} smoothness={2} receiveShadow>
          <meshStandardMaterial color={HM.ceramic} roughness={0.6} />
        </RoundedBox>
        {plan.bars.map((b) => (
          <group key={b.name} position={[0, 0.1, -0.8 + b.index * 0.8]}>
            <RoundedBox args={[1.0, 0.16, 0.55]} position={[0, 0.08, 0]} radius={0.04} smoothness={2} castShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.3)} roughness={0.45} clearcoat={0.3} />
            </RoundedBox>
            <Tag position={[0, 0.25, 0.2]} tone="teal" size="xs" center>{"tool " + (b.index + 1)}</Tag>
          </group>
        ))}
        <Tag position={[0, -0.02, 1.45]} tone="ink" size="xs" center>orden original</Tag>
      </group>
    </group>
  );
}

const INTERCEPTED = ["todo", "memory", "session_search", "delegate_task"];
const REGISTERED = ["terminal", "read_file", "web_search"];

function InterceptScene() {
  return (
    <group>
      {/* run_agent.py gate in front, registry behind it. */}
      <Block position={[1.9, 0, -1.4]} size={[3.4, 0.5, 0.9]} color={P.teal} lit label="registro · handle_function_call()" tone="teal" labelY={0.85} />
      <Block position={[0, 0, 0.3]} size={[7.0, 0.3, 0.5]} color={P.violet} lit label="run_agent.py" tone="violet" labelY={0.55} />
      {INTERCEPTED.map((name, i) => {
        const x = -2.9 + i * 0.95;
        return (
          <group key={name}>
            <Block position={[x - 0.4, 0, 2.0]} size={[0.8, 0.28, 0.45]} color={P.violet} lit label={name} tone="violet" labelY={0.48} />
            <Arrow from={[x - 0.52, 0.2, 1.7]} to={[x - 0.52, 0.35, 0.62]} color={P.violet} width={1.6} head={0.09} />
            <Arrow from={[x - 0.28, 0.35, 0.62]} to={[x - 0.28, 0.2, 1.7]} color={P.violet} width={1.2} head={0.07} dashed />
          </group>
        );
      })}
      {REGISTERED.map((name, i) => {
        const x = 1.3 + i * 0.95;
        return (
          <group key={name}>
            <Block position={[x, 0, 2.0]} size={[0.85, 0.28, 0.45]} color={P.teal} lit label={name} tone="teal" labelY={0.48} />
            <Arrow from={[x, 0.2, 1.7]} to={[x, 0.4, -0.9]} color={P.teal} width={1.4} head={0.09} />
          </group>
        );
      })}
      <Tag position={[-2.0, 0.6, 1.25]} tone="violet" size="xs" center>resultado sintético</Tag>
    </group>
  );
}

function BudgetScene({ subagents }: { subagents: number }) {
  const unit = 2.6 / 500; // world height per iteration
  const bars = [{ label: "padre", cap: 500, color: P.amber }, ...Array.from({ length: subagents }, (_, i) => ({ label: "sub " + (i + 1), cap: 50, color: P.violet }))];
  return (
    <group>
      {bars.map((b, i) => {
        const x = -2.8 + i * 1.25;
        const h = b.cap * unit;
        return (
          <group key={b.label} position={[x, 0, 0]}>
            <RoundedBox args={[0.9, 0.12, 0.9]} position={[0, 0.06, 0]} radius={0.04} smoothness={2} receiveShadow>
              <meshStandardMaterial color={HM.ceramic} roughness={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.62, h, 0.62]} position={[0, 0.12 + h / 2, 0]} radius={Math.min(0.06, h / 2.2)} smoothness={3} castShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, b.color, 0.55)} roughness={0.38} clearcoat={0.5} />
            </RoundedBox>
            <Tag position={[0, 0.3 + h, 0]} tone={b.color === P.amber ? "amber" : "violet"} size="xs" center>{String(b.cap)}</Tag>
            <Tag position={[0, -0.02, 0.62]} tone="muted" size="xs" center>{b.label}</Tag>
          </group>
        );
      })}
      {/* Total tower: parent plus every child, stacked. */}
      <group position={[3.3, 0, 0]}>
        {bars.map((b, i) => {
          const h = b.cap * unit;
          const y0 = 0.12 + bars.slice(0, i).reduce((s, c) => s + c.cap * unit, 0);
          return (
            <RoundedBox key={b.label} args={[0.7, h - 0.01, 0.7]} position={[0, y0 + h / 2, 0]} radius={Math.min(0.05, h / 2.5)} smoothness={2} castShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, b.color, 0.55)} roughness={0.38} clearcoat={0.5} />
            </RoundedBox>
          );
        })}
        <Tag position={[0, 0.35 + bars.reduce((s, c) => s + c.cap * unit, 0), 0]} tone="ink" size="xs" center>{"suma " + bars.reduce((s, c) => s + c.cap, 0)}</Tag>
        <Tag position={[0, -0.02, 0.62]} tone="ink" size="xs" center>pared</Tag>
      </group>
      {/* Reference line at the parent's cap: the children sum above it. */}
      <mesh position={[0, 0.12 + 500 * unit, -0.6]}>
        <boxGeometry args={[7, 0.02, 0.02]} />
        <meshStandardMaterial color={P.rose} />
      </mesh>
      <Tag position={[-3.3, 0.25 + 500 * unit, -0.6]} tone="rose" size="xs" center>tope padre</Tag>
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<HlMode>("turn");
  const [rounds, setRounds] = useState(1);
  const [at, setAt] = useState(0);
  const [interrupted, setInterrupted] = useState(false);
  const [kind, setKind] = useState<"one" | "many" | "clarify">("many");
  const [subs, setSubs] = useState(2);
  const seq = turnSequence(rounds);
  const idx = Math.min(at, seq.length - 1);
  const plan = toolPlan(kind);
  const seqTotal = plan.bars.reduce((s, b) => s + b.dur, 0);
  const note = {
    turn: (
      <div className="space-y-3">
        <p><strong>Paso {seq[idx] + 1} de 9 · {HL_STEPS[seq[idx]]}.</strong> Un turno recorre los nueve pasos en orden. Si el paso 9 encuentra <code>tool_calls</code>, ejecuta las tools, añade los resultados y vuelve al paso 5; sólo con texto persiste la sesión y devuelve. El paso 4 comprime antes de llamar si la conversación supera el 50 % de la ventana.</p>
        <Readout items={[
          { label: "rondas de tools", value: String(rounds), tone: "var(--amber)" },
          { label: "pasos recorridos", value: idx + 1 + " / " + seq.length, tone: "var(--teal)" },
          { label: "llamadas API del turno", value: String(rounds + 1), tone: "var(--violet)" },
        ]} />
        <p className="text-xs text-muted">Secuencia de <em>Agent Loop Internals</em> (Nous Research). Pasos 1–4 una vez por turno; 5–9 una vez por llamada al modelo.</p>
      </div>
    ),
    http: (
      <div className="space-y-3">
        <p><strong>{interrupted ? "Interrupción: se abandona el hilo HTTP." : "Respuesta lista: el assistant entra en el historial."}</strong> El POST corre en un hilo de trabajo; el principal sólo espera respuesta, interrupción o timeout. {interrupted ? "Con /stop o un mensaje nuevo, la respuesta en vuelo se descarta entera: ninguna fila assistant parcial llega al historial, y la siguiente fila es el user nuevo." : "Sólo una respuesta completa se añade como assistant."}</p>
        <Readout items={[
          { label: "filas assistant parciales", value: "0", tone: "var(--rose)" },
          { label: "último rol del historial", value: interrupted ? "user" : "assistant", tone: "var(--teal)" },
        ]} />
        <p className="text-xs text-muted">Guardar el parcial «para reanudar» deja dos assistant seguidos o tool_calls sin filas tool, y el proveedor devuelve 400 por alternancia.</p>
      </div>
    ),
    tools: (
      <div className="space-y-3">
        <p><strong>{kind === "one" ? "Una tool call corre en el hilo principal." : kind === "many" ? "Varias tool calls corren a la vez en ThreadPoolExecutor." : "clarify es interactiva: todo el lote pasa a secuencial."}</strong> En cualquier caso los resultados se reinsertan en el orden original de las tool calls{kind === "many" ? ", aunque terminen en orden " + plan.finishOrder.join(", ") : ""}.</p>
        <Readout items={[
          { label: "tiempo del lote", value: plan.total.toFixed(1).replace(".", ",") + " s", tone: "var(--violet)" },
          { label: "si fuera secuencial", value: seqTotal.toFixed(1).replace(".", ",") + " s", tone: "var(--teal)" },
          { label: "orden de reinserción", value: plan.bars.map((b) => b.index + 1).join(", "), tone: "var(--teal)" },
        ]} />
        <p className="text-xs text-muted">Duraciones didácticas. El total del pool es la tool más lenta; el secuencial, la suma. clarify fuerza secuencial para que la pregunta humana posea el terminal.</p>
      </div>
    ),
    intercept: (
      <div className="space-y-3">
        <p><strong>Cuatro tools nunca llegan al registro.</strong> run_agent.py intercepta todo, memory, session_search y delegate_task porque tocan estado local del agente, y devuelve resultados sintéticos. El resto pasa por handle_function_call().</p>
        <Readout items={[{ label: "interceptadas", value: "4", tone: "var(--violet)" }, { label: "schemas anunciados", value: "sí, siguen en el registro", tone: "var(--teal)" }]} />
      </div>
    ),
    budget: (
      <div className="space-y-3">
        <p><strong>Cada agente tiene su propio presupuesto.</strong> El padre, 500 iteraciones (<code>agent.max_turns</code>); cada subagente, hasta 50 (<code>delegation.max_iterations</code>). Juntos pueden superar el tope del padre: la torre de la derecha es el trabajo total posible.</p>
        <Readout items={[
          { label: "subagentes", value: String(subs), tone: "var(--violet)" },
          { label: "turnos de modelo posibles", value: 500 + 50 * subs + " = 500 + " + subs + " × 50", tone: "var(--amber)" },
        ]} />
        <p className="text-xs text-muted">El tope no es una cartera global de tokens. Al 100 % cada agente para y devuelve un resumen.</p>
      </div>
    ),
  }[mode];
  return (
    <Figure
      label="Hermes: el interior del bucle"
      hint="run_conversation, paso a paso"
      height="h-[460px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "ruta núcleo" },
        { color: P.violet, label: "modelo / pool" },
        { color: P.amber, label: "vuelta y presupuesto" },
        { color: P.rose, label: "descarte y topes" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Vista del bucle de Hermes" options={[
            { value: "turn", label: "Turno", tone: P.teal },
            { value: "http", label: "Hilo HTTP", tone: P.violet },
            { value: "tools", label: "Tools", tone: P.violet },
            { value: "intercept", label: "Intercepts", tone: P.teal },
            { value: "budget", label: "500 / 50", tone: P.amber },
          ]} />
          {mode === "turn" ? (
            <>
              <div className="flex items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Pasos del turno">
                <button type="button" className="chip min-w-8 px-2" disabled={idx <= 0} aria-label="Paso anterior" onClick={() => setAt(Math.max(0, idx - 1))}>←</button>
                <span className="px-1 font-mono text-[0.6rem] tabular-nums text-muted">{idx + 1}/{seq.length}</span>
                <button type="button" className="chip min-w-8 px-2" disabled={idx >= seq.length - 1} aria-label="Paso siguiente" onClick={() => setAt(Math.min(seq.length - 1, idx + 1))}>→</button>
              </div>
              <Knob label="rondas de tools" value={rounds} min={0} max={3} onChange={(v) => { setRounds(v); setAt(0); }} tone="var(--amber)" />
            </>
          ) : null}
          {mode === "http" ? <Switcher value={interrupted ? "stop" : "ok"} onChange={(v) => setInterrupted(v === "stop")} ariaLabel="Resultado de la espera" options={[{ value: "ok", label: "Respuesta", tone: P.teal }, { value: "stop", label: "/stop", tone: P.rose }]} /> : null}
          {mode === "tools" ? <Switcher value={kind} onChange={setKind} ariaLabel="Lote de tool calls" options={[{ value: "one", label: "Una", tone: P.teal }, { value: "many", label: "Tres", tone: P.violet }, { value: "clarify", label: "Con clarify", tone: P.amber }]} /> : null}
          {mode === "budget" ? <Knob label="subagentes" value={subs} min={0} max={4} onChange={setSubs} tone="var(--violet)" /> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3.2, 6.6, 8.6], fov: 32 }} fit={1.04}>
        <HlBench />
        {mode === "turn" ? <TurnScene rounds={rounds} at={idx} /> : mode === "http" ? <HttpScene interrupted={interrupted} /> : mode === "tools" ? <ToolsScene kind={kind} /> : mode === "intercept" ? <InterceptScene /> : <BudgetScene subagents={subs} />}
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

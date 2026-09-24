"use client";

import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, ShadowBlob, Slab, Tag, useCycle, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* smolagents: CodeAgent writes Python; ToolCallingAgent writes JSON. Both
   ride the same MultiStepAgent loop. */
type Mode = "code" | "json" | "steps";

const COPY = {
  en: {
    two_dialects_one_loop: "two dialects, one loop",
    codeagent_writes_python_toolcallingagent_writes_json: "CodeAgent writes python; ToolCallingAgent writes JSON",
    code: "code agent",
    json: "tool calling",
    steps: "action steps",
    python_block: "python block",
    json_call: "json call",
    runs: "runs",
    parses: "parses",
    same_loop: "same loop",
    allowlist: "allowlist",
    step: "step",
  },
  es: {
    two_dialects_one_loop: "dos dialectos, un bucle",
    codeagent_writes_python_toolcallingagent_writes_json: "CodeAgent escribe python; ToolCallingAgent escribe JSON",
    code: "code agent",
    json: "tool calling",
    steps: "action steps",
    python_block: "bloque python",
    json_call: "llamada json",
    runs: "ejecuta",
    parses: "parsea",
    same_loop: "mismo bucle",
    allowlist: "allowlist",
    step: "paso",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("code");

  const stepCells = Array.from({ length: 4 }, (_, i) => ({
    position: [-2.0 + i * 1.3, 0.6, 0] as [number, number, number],
    color: i < 3 ? P.teal : P.violet,
  }));

  return (
    <Figure
      label={t.two_dialects_one_loop}
      hint={t.codeagent_writes_python_toolcallingagent_writes_json}
      legend={[
        { color: P.teal, label: t.code },
        { color: P.amber, label: t.json },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "code", label: t.code, tone: P.teal },
            { value: "json", label: t.json, tone: P.amber },
            { value: "steps", label: t.steps, tone: P.violet },
          ]}
          ariaLabel={t.two_dialects_one_loop}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "code" && (
          <>
            <Node3D position={[-2.5, 0.6, 0]} color={P.violet} radius={0.18} pulse={0.2} />
            <Tag position={[-2.5, 1.05, 0.15]} tone="violet" size="xs">model</Tag>
            <Flow points={[[-2.3, 0.6, 0], [-0.9, 0.6, 0]]} color={P.violet} count={2} size={0.05} />
            {/* a python block */}
            <Slab position={[0.2, 0.6, 0]} size={[2.1, 1.1, 0.12]} color={P.teal} fill={0.16} />
            <Tag position={[0.2, 1.4, 0.15]} tone="teal">{t.python_block}</Tag>
            <Tag position={[0.2, 0.6, 0.15]} tone="teal" size="xs">{"result = search(q)\nprint(result[:200])"}</Tag>
            <Flow points={[[1.25, 0.6, 0], [2.4, 0.6, 0]]} color={P.teal} count={2} />
            {/* interpreter with an allowlist halo */}
            <Halo position={[2.7, 0.6, 0]} radius={0.55} color={P.amber} opacity={0.55} spin={0.2} />
            <Node3D position={[2.7, 0.6, 0]} color={P.amber} radius={0.15} />
            <Tag position={[2.7, 1.25, 0.15]} tone="amber" size="xs">{t.runs}</Tag>
            <Tag position={[2.7, -0.1, 0.15]} tone="muted" size="xs">{t.allowlist}</Tag>
          </>
        )}

        {mode === "json" && (
          <>
            <Node3D position={[-2.5, 0.6, 0]} color={P.violet} radius={0.18} pulse={0.2} />
            <Tag position={[-2.5, 1.05, 0.15]} tone="violet" size="xs">model</Tag>
            <Flow points={[[-2.3, 0.6, 0], [-0.9, 0.6, 0]]} color={P.violet} count={2} size={0.05} />
            {/* a JSON call */}
            <Slab position={[0.2, 0.6, 0]} size={[2.1, 1.1, 0.12]} color={P.amber} fill={0.16} />
            <Tag position={[0.2, 1.4, 0.15]} tone="amber">{t.json_call}</Tag>
            <Tag position={[0.2, 0.6, 0.15]} tone="amber" size="xs">{'{ "name": "search",\n  "arguments": {…} }'}</Tag>
            <Flow points={[[1.25, 0.6, 0], [2.4, 0.6, 0]]} color={P.amber} count={2} />
            {/* harness parses + dispatches */}
            <Node3D position={[2.7, 0.6, 0]} color={P.teal} radius={0.15} pulse={0.4} />
            <Tag position={[2.7, 1.15, 0.15]} tone="teal" size="xs">{t.parses}</Tag>
            <Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.same_loop}</Tag>
          </>
        )}

        {mode === "steps" && (
          <>
            {/* ActionStep log stack */}
            {stepCells.map((c, i) => (
              <group key={i}>
                <Slab
                  position={[c.position[0], c.position[1], 0]}
                  size={[1.1, 1.1, 0.14]}
                  color={c.color}
                  fill={0.18}
                />
                <Tag position={[c.position[0], c.position[1] + 0.7, 0.15]} tone="muted" size="xs">
                  {t.step} {i + 1}
                </Tag>
                <Tag position={[c.position[0], c.position[1], 0.15]} tone={c.color === P.teal ? "teal" : "violet"} size="xs">
                  {i === 3 ? "final" : "action"}
                </Tag>
              </group>
            ))}
            <Flow points={[[-1.4, 0.6, 0], [-0.95, 0.6, 0]]} color={P.teal} count={1} size={0.05} />
            <Flow points={[[-0.1, 0.6, 0], [0.35, 0.6, 0]]} color={P.teal} count={1} size={0.05} />
            <Flow points={[[1.2, 0.6, 0], [1.65, 0.6, 0]]} color={P.violet} count={1} size={0.05} />
            <Tag position={[0, -0.55, 0.15]} tone="muted" size="xs">ActionStep · log</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * MultiStepAgent: el mismo while para los dos dialectos. Cinco estaciones
 * por vuelta (memoria → modelo → parseo → ejecución → ActionStep) y una
 * pila de memoria que crece un escalón por paso. Tarea didáctica: dos
 * búsquedas web y un menú. CodeAgent lo hace en un paso de código y cierra
 * con final_answer en el segundo; ToolCallingAgent necesita una llamada
 * JSON por herramienta más final_answer. max_steps corta el bucle.
 */

type Dialect = "code" | "json";
const STATIONS = ["memoria", "modelo", "parseo", "ejecución", "ActionStep"];
const PLAN: Record<Dialect, string[]> = {
  code: ["web_search ×2 + suggest_menu en un bloque", "final_answer(...)"],
  json: ["web_search (fiesta)", "web_search (playlist)", "suggest_menu (formal)", "final_answer"],
};
const TRACE: Record<Dialect, string> = {
  code: "Executing parsed code:",
  json: "Calling tool: 'web_search' with arguments: …",
};

function runLoop(dialect: Dialect, maxSteps: number) {
  const needed = PLAN[dialect].length;
  const executed = Math.min(needed, maxSteps);
  const finished = executed === needed;
  return { needed, executed, finished, steps: PLAN[dialect].slice(0, executed) };
}

const MS = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };
const LOOP_R = 2.1;
const stationPos = (i: number): V3 => {
  const a = Math.PI / 2 + (i / STATIONS.length) * Math.PI * 2; // la estación 0 al frente
  return [Math.cos(a) * LOOP_R * 1.25, 0, Math.sin(a) * LOOP_R * 0.8];
};

function MMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

const STATION_COLOR = [P.teal, P.violet, P.amber, P.amber, P.violet];

function LoopStations({ active, dialect }: { active: number; dialect: Dialect }) {
  return (
    <>
      {STATIONS.map((name, i) => {
        const [x, , z] = stationPos(i);
        const on = i === active;
        const c = STATION_COLOR[i];
        const label = i === 2 ? (dialect === "code" ? "parseo ```py" : "parseo {json}") : i === 3 ? (dialect === "code" ? "intérprete" : "despacho") : name;
        return (
          <group key={name} position={[x, 0, z]}>
            <RoundedBox position={[0, -0.45, 0]} args={[1.0, 0.12, 0.8]} radius={0.04} smoothness={2} castShadow receiveShadow>
              <MMat color={MS.ceramic} rough={0.55} />
            </RoundedBox>
            <RoundedBox position={[0, on ? -0.1 : -0.15, 0]} args={[0.72, on ? 0.6 : 0.5, 0.55]} radius={0.08} smoothness={3} castShadow receiveShadow>
              <MMat color={on ? mixHex(P.paper, c, 0.6) : mixHex(P.paper, c, 0.18)} clear={on ? 0.7 : 0.3} />
            </RoundedBox>
            <Tag position={[0, 0.4, 0]} tone={on ? (c === P.teal ? "teal" : c === P.violet ? "violet" : "amber") : "muted"} size="xs" center>{label}</Tag>
          </group>
        );
      })}
    </>
  );
}

/* Pila de memoria: SystemPromptStep, TaskStep y un ActionStep por paso. */
function MemoryStack({ actions, finished, stopped }: { actions: number; finished: boolean; stopped: boolean }) {
  const layers = [
    { key: "sys", color: P.teal },
    { key: "task", color: P.amber },
    ...Array.from({ length: actions }, (_, i) => ({ key: "a" + i, color: P.violet })),
  ];
  return (
    <group position={[0, -0.45, 0]}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.85, 0.08, 40]} />
        <MMat color={MS.graphite} metal={0.3} />
      </mesh>
      {layers.map((l, i) => (
        <RoundedBox key={l.key} position={[0, 0.13 + i * 0.15, 0]} args={[1.0, 0.12, 0.7]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <MMat color={i === layers.length - 1 && finished && actions > 0 ? P.tealDeep : mixHex(P.paper, l.color, 0.5)} />
        </RoundedBox>
      ))}
      <Tag position={[0, 0.35 + layers.length * 0.15, 0]} tone={stopped ? "rose" : finished && actions > 0 ? "teal" : "violet"} size="xs" center>
        {stopped ? "max_steps" : finished && actions > 0 ? "final_answer" : "pila de pasos"}
      </Tag>
    </group>
  );
}

function LoopBench({ dialect, maxSteps }: { dialect: Dialect; maxSteps: number }) {
  const run = runLoop(dialect, maxSteps);
  const { still } = useStage();
  const frames = run.executed * STATIONS.length + 3;
  const [f] = useCycle(frames, 0.55);
  const frame = still ? frames - 1 : f;
  const lap = Math.floor(frame / STATIONS.length);
  const station = frame < run.executed * STATIONS.length ? frame % STATIONS.length : -1;
  const doneActions = Math.min(run.executed, station === 4 ? lap + 1 : lap);
  const complete = doneActions === run.executed;
  const ring = Array.from({ length: 41 }, (_, k) => {
    const a = (k / 40) * Math.PI * 2;
    return [Math.cos(a) * LOOP_R * 1.25, -0.36, Math.sin(a) * LOOP_R * 0.8] as V3;
  });
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.2, 0]}>
        <ShadowBlob position={[0, -0.95, 0]} scale={8} opacity={0.12} />
        <RoundedBox position={[0, -0.75, 0]} args={[7.6, 0.34, 5.0]} radius={0.2} smoothness={4} castShadow receiveShadow>
          <MMat color={MS.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.55, 0]} args={[7.3, 0.06, 4.7]} radius={0.04} smoothness={3} receiveShadow>
          <MMat color={MS.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        <Flow points={ring} color={dialect === "code" ? P.teal : P.amber} count={still ? 0 : 1} size={0.06} speed={0.36} lineOpacity={0.45} width={1.6} tension={0.5} />
        <LoopStations active={station} dialect={dialect} />
        <MemoryStack actions={doneActions} finished={run.finished && complete} stopped={!run.finished && complete} />
        <Tag position={[-3.3, 0.9, -1.6]} tone="muted" size="xs">{"paso " + Math.min(run.executed, lap + (station >= 0 ? 1 : 0)) + " / " + maxSteps}</Tag>
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [dialect, setDialect] = useState<Dialect>("json");
  const [maxSteps, setMaxSteps] = useState(3);
  const run = runLoop(dialect, maxSteps);
  return (
    <Figure
      label="MultiStepAgent · un bucle, dos dialectos"
      hint="memoria → modelo → parseo → ejecución → ActionStep"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "SystemPromptStep / memoria" },
        { color: P.amber, label: "TaskStep / parseo y ejecución" },
        { color: P.violet, label: "modelo / ActionStep" },
        { color: P.rose, label: "corte por max_steps" },
      ]}
      controls={
        <>
          <Switcher value={dialect} onChange={setDialect} ariaLabel="Tipo de agente" options={[{ value: "code", label: "CodeAgent", tone: P.teal }, { value: "json", label: "ToolCallingAgent", tone: P.amber }]} />
          <Knob label="max_steps" value={maxSteps} min={1} max={6} onChange={setMaxSteps} tone={run.finished ? "var(--teal)" : "var(--rose)"} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            <strong>{dialect === "code" ? "CodeAgent" : "ToolCallingAgent"} necesita {run.needed} {run.needed === 1 ? "paso" : "pasos"}.</strong>{" "}
            {dialect === "code"
              ? "El bloque Python llama dos veces a web_search y a suggest_menu y guarda las variables en el intérprete; el segundo paso solo llama a final_answer."
              : "Cada herramienta es una llamada JSON aparte y cada una es una vuelta completa del bucle; final_answer también."}{" "}
            {run.finished
              ? `Con max_steps = ${maxSteps} el agente termina con final_answer.`
              : `Con max_steps = ${maxSteps} el bucle se corta tras ${run.executed} pasos sin respuesta final: el contador de saltos manda.`}
          </p>
          <Readout items={[
            { label: "pasos ejecutados", value: `${run.executed} / ${run.needed}`, tone: run.finished ? "var(--teal)" : "var(--rose)" },
            { label: "pila de memoria", value: `2 + ${run.executed} ActionStep`, tone: "var(--violet)" },
            { label: "traza", value: TRACE[dialect], tone: "var(--ink)" },
          ]} />
          <ol className="list-decimal pl-5 font-mono text-xs">
            {PLAN[dialect].map((st, i) => <li key={st} className={i < run.executed ? "" : "text-rose line-through"}>{st}</li>)}
          </ol>
          <p className="text-xs text-muted">Plan de pasos didáctico para la tarea de la fiesta. En cada vuelta write_memory_to_messages() convierte la pila en mensajes; el parser busca un bloque cercado (CodeAgent) o un objeto JSON (ToolCallingAgent); el resultado cae en un ActionStep. Es el bucle dummy de la Unidad 1, con nombres.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 5.6, 8.4], fov: 34 }} fit={1.08}>
        <LoopBench dialect={dialect} maxSteps={maxSteps} />
      </Stage>
    </Figure>
  );
}

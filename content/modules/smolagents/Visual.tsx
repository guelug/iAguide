"use client";

import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Flow, Node3D, PointerTilt, ShadowBlob, Slab, Tag, useCycle, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "json" | "code" | "exec";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "code_as_action_vs_json": "code-as-action vs JSON",
      "same_loop_different_payload": "same loop, different payload",
      "json_blob": "json blob",
      "python_code": "python code",
      "json_blob_2": "JSON blob",
      "python_code_2": "Python code"
    },
    es: {
      "code_as_action_vs_json": "código-como-acción vs JSON",
      "same_loop_different_payload": "mismo bucle, payload distinto",
      "json_blob": "blob json",
      "python_code": "código python",
      "json_blob_2": "blob JSON",
      "python_code_2": "código Python"
    },
  });
  const [mode, setMode] = useState<Mode>("json");
  return (
    <Figure
      label={t.code_as_action_vs_json}
      hint={t.same_loop_different_payload}
      legend={[
          { color: P.amber, label: t.json_blob },
          { color: P.teal, label: t.python_code },
          { color: P.violet, label: "sandbox" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "json", label: t.json_blob_2, tone: P.amber },
            { value: "code", label: t.python_code_2, tone: P.teal },
            { value: "exec", label: "Sandbox", tone: P.violet }
          ]}
          ariaLabel={t.same_loop_different_payload}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.1, 0.25, 0]} size={[2.2, 1.9, 0.12]} color={P.amber} fill={mode === "json" ? 0.32 : 0.12} />
        <Tag position={[-2.1, 1.35, 0.2]} tone="amber">{"{"}name, args{"}"}</Tag>
        <Slab position={[2.1, 0.25, 0]} size={[2.2, 1.9, 0.12]} color={P.teal} fill={mode !== "json" ? 0.32 : 0.12} />
        <Tag position={[2.1, 1.35, 0.2]} tone="teal">results = tool()</Tag>
        <Node3D position={[0, 0.25, 0]} color={mode === "exec" ? P.violet : P.lineStrong} radius={0.2} pulse={mode === "exec" ? 0.4 : 0} />
        <Tag position={[0, -0.35, 0.2]} tone="violet">{mode === "exec" ? "interpreter" : "parser"}</Tag>
        <Flow points={[[-0.95, 0.25, 0], [-0.25, 0.25, 0]]} color={P.amber} count={2} />
        <Flow points={[[0.25, 0.25, 0], [0.95, 0.25, 0]]} color={P.teal} count={2} />
    
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * Mismo ciclo ReAct, distinto payload. Tarea de la lección: la fiesta
 * empieza a las 19:00 y hay que sumar 30, 60, 45 y 45 minutos.
 * ToolCallingAgent: una llamada JSON por suma (herramienta didáctica
 * add_minutes) y luego final_answer, cada una con su vuelta al modelo.
 * CodeAgent: un solo fragmento Python con datetime que suma e imprime.
 * El intérprete solo deja importar lo que está en la allowlist.
 */

type AgentKind = "json" | "code";
type Allow = "safe" | "unsafe";

const START_MIN = 19 * 60;
const STEPS_MIN = [30, 60, 45, 45];
const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const END_MIN = STEPS_MIN.reduce((a, b) => a + b, START_MIN);

function runPlan(kind: AgentKind, allow: Allow) {
  const imports = allow === "safe" ? ["datetime"] : ["datetime", "os", "subprocess"];
  const modelCalls = kind === "json" ? STEPS_MIN.length + 1 : 1;
  const leak = kind === "code" && allow === "unsafe";
  const partials = STEPS_MIN.reduce<number[]>((acc, m) => [...acc, (acc[acc.length - 1] ?? START_MIN) + m], []);
  return { imports, modelCalls, leak, partials, result: clock(END_MIN) };
}

const SM = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };

function SMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

function Pad({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <RoundedBox position={[x, -0.52, z]} args={[w, 0.14, d]} radius={0.05} smoothness={3} castShadow receiveShadow>
      <SMat color={SM.ceramic} rough={0.55} clear={0.3} />
    </RoundedBox>
  );
}

/* Izquierda: una tarjeta JSON por llamada; se apilan según avanzan los pasos. */
function JsonStack({ active, shown }: { active: boolean; shown: number }) {
  return (
    <group position={[-3.3, 0, 0.3]}>
      <Pad x={0} z={0} w={1.7} d={1.5} />
      {Array.from({ length: STEPS_MIN.length + 1 }, (_, i) => (
        <group key={i} position={[0, -0.4 + i * 0.13, 0]} visible={!active || i < shown}>
          <RoundedBox args={[1.2, 0.09, 0.85]} radius={0.03} smoothness={2} castShadow receiveShadow>
            <SMat color={active ? mixHex(P.paper, P.amber, i === STEPS_MIN.length ? 0.6 : 0.35) : "#D9D5CC"} />
          </RoundedBox>
        </group>
      ))}
      <Tag position={[0, 0.55, 0]} tone={active ? "amber" : "muted"} center>JSON × 5</Tag>
    </group>
  );
}

/* Derecha: un único bloque de código con cuatro líneas. */
function CodeBlock({ active }: { active: boolean }) {
  return (
    <group position={[3.3, 0, 0.3]}>
      <Pad x={0} z={0} w={1.7} d={1.5} />
      <group position={[0, 0.0, -0.1]} rotation={[-0.35, 0, 0]}>
        <RoundedBox args={[1.35, 0.95, 0.08]} radius={0.04} smoothness={2} castShadow receiveShadow>
          <SMat color={active ? SM.graphite : "#9A9A96"} metal={0.2} />
        </RoundedBox>
        {[0.28, 0.1, -0.08, -0.26].map((y, i) => (
          <mesh key={y} position={[-0.1 + (i % 2) * 0.12, y, 0.05]}>
            <boxGeometry args={[0.8 - (i % 2) * 0.24, 0.05, 0.01]} />
            <meshStandardMaterial color={active ? (i === 0 ? P.violet : P.teal) : "#BDBAB2"} emissive={active ? P.teal : "#000"} emissiveIntensity={active ? 0.2 : 0} />
          </mesh>
        ))}
      </group>
      <Tag position={[0, 0.75, 0]} tone={active ? "teal" : "muted"} center>Python × 1</Tag>
    </group>
  );
}

/* Centro: el intérprete en su caja, con la puerta de imports delante. */
function Sandbox({ kind, allow }: { kind: AgentKind; allow: Allow }) {
  const on = kind === "code";
  const slots: { name: string; allowed: boolean; risky: boolean }[] = [
    { name: "datetime", allowed: true, risky: false },
    { name: "os", allowed: allow === "unsafe", risky: true },
    { name: "subprocess", allowed: allow === "unsafe", risky: true },
  ];
  return (
    <group position={[0, 0, 0]}>
      <Pad x={0} z={0} w={3.0} d={2.0} />
      <mesh position={[0, 0.2, -0.1]}>
        <boxGeometry args={[2.6, 1.3, 1.5]} />
        <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.13} roughness={0.05} depthWrite={false} />
      </mesh>
      {[-1.3, 1.3].flatMap((x) => [-0.85, 0.65].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
          <boxGeometry args={[0.05, 1.3, 0.05]} />
          <meshStandardMaterial color={SM.steel} metalness={0.8} roughness={0.3} />
        </mesh>
      )))}
      <mesh position={[0, -0.05, -0.2]} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.8, 36]} />
        <SMat color={on ? mixHex(P.paper, P.violet, 0.45) : "#D5D1C8"} clear={0.6} />
      </mesh>
      {slots.map((sl, i) => {
        const x = -0.85 + i * 0.85;
        const lit = on && sl.allowed;
        const color = lit ? (sl.risky ? P.rose : P.teal) : SM.graphite;
        return (
          <group key={sl.name} position={[x, -0.2, 0.72]}>
            <RoundedBox args={[0.5, 0.32, 0.1]} radius={0.03} smoothness={2} castShadow>
              <SMat color={lit ? mixHex(P.paper, color, 0.45) : sl.allowed ? "#B9B5AC" : SM.graphite} metal={lit ? 0.05 : 0.3} />
            </RoundedBox>
            <Tag position={[0, -0.36, 0.1]} tone={lit ? (sl.risky ? "rose" : "teal") : "muted"} size="xs" center>{sl.name}</Tag>
          </group>
        );
      })}
      <Tag position={[-1.3, 0.95, 0.65]} tone={on ? "violet" : "muted"} center>sandbox</Tag>
    </group>
  );
}

function ReactBench({ kind, allow }: { kind: AgentKind; allow: Allow }) {
  const plan = runPlan(kind, allow);
  const { still } = useStage();
  const [tick] = useCycle(STEPS_MIN.length + 3, 0.9);
  const shown = still ? STEPS_MIN.length + 1 : Math.min(STEPS_MIN.length + 1, tick + 1);
  const model: V3 = [0, 0.35, -2.2];
  const json = kind === "json";
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.1, 0]}>
        <ShadowBlob position={[0, -0.95, 0]} scale={10.5} opacity={0.12} />
        <RoundedBox position={[0, -0.78, -0.3]} args={[9.8, 0.36, 4.3]} radius={0.17} smoothness={4} castShadow receiveShadow>
          <SMat color={SM.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.56, -0.3]} args={[9.45, 0.08, 4.0]} radius={0.04} smoothness={3} receiveShadow>
          <SMat color={SM.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        {/* el modelo: el mismo en los dos agentes */}
        <group position={model}>
          <RoundedBox position={[0, 0, 0]} args={[1.3, 0.9, 0.8]} radius={0.16} smoothness={4} castShadow receiveShadow>
            <SMat color={mixHex(P.paper, P.violet, 0.3)} clear={0.6} />
          </RoundedBox>
          <Tag position={[0, 0.7, 0]} tone="violet" center>modelo</Tag>
        </group>
        <JsonStack active={json} shown={shown} />
        <Sandbox kind={kind} allow={allow} />
        <CodeBlock active={!json} />
        {/* vueltas al modelo: cinco en JSON, una en código */}
        {json ? (
          <>
            <Flow points={[[-0.7, 0.2, -1.9], [-2.4, 0.4, -1.2], [-3.3, 0.3, -0.3]]} color={P.amber} count={shown} size={0.045} speed={0.45} lineOpacity={0.5} />
            <Flow points={[[-3.0, 0.1, 0.9], [-1.9, 0.1, 1.2], [-1.0, 0.1, 1.0]]} color={P.amber} count={2} size={0.035} speed={0.3} lineOpacity={0.3} />
            <Tag position={[-1.9, 0.2, 1.45]} tone="amber" size="xs" center>el arnés parsea</Tag>
          </>
        ) : (
          <>
            <Flow points={[[0.7, 0.2, -1.9], [2.4, 0.4, -1.2], [3.3, 0.4, -0.3]]} color={P.teal} count={1} size={0.05} speed={0.35} lineOpacity={0.5} />
            <Flow points={[[2.6, 0.1, 0.4], [1.6, 0.15, 0.2], [0.5, 0.1, -0.1]]} color={P.teal} count={2} size={0.04} speed={0.35} lineOpacity={0.5} />
          </>
        )}
        <Tag position={[json ? -1.5 : 1.5, 0.95, -1.4]} tone={json ? "amber" : "teal"} size="xs" center>{plan.modelCalls + (plan.modelCalls === 1 ? " vuelta" : " vueltas")}</Tag>
        {/* página inyectada que pide variables de entorno */}
        <group position={[1.5, -0.2, 1.75]}>
          <RoundedBox args={[0.6, 0.4, 0.08]} radius={0.03} smoothness={2} castShadow>
            <SMat color={mixHex(P.paper, P.rose, 0.4)} />
          </RoundedBox>
          <Tag position={[0.4, -0.3, 0.2]} tone="rose" size="xs">página inyectada</Tag>
        </group>
        <Arrow from={[1.3, -0.15, 1.6]} to={[0.4, -0.15, 0.95]} color={P.rose} width={1.4} head={0.08} dashed={!plan.leak} opacity={0.8} />
        {plan.leak ? (
          <>
            <Flow points={[[-0.2, 0.0, 0.3], [-1.2, 0.2, 1.3], [-2.2, -0.1, 1.8]]} color={P.rose} count={4} size={0.045} speed={0.5} lineOpacity={0.6} />
            <RoundedBox position={[-2.4, -0.25, 1.85]} args={[0.6, 0.4, 0.4]} radius={0.05} smoothness={2} castShadow>
              <SMat color={P.rose} />
            </RoundedBox>
            <Tag position={[-2.4, 0.2, 1.85]} tone="rose" size="xs" center>env filtrado</Tag>
          </>
        ) : (
          <Tag position={[1.25, 0.3, 1.55]} tone="teal" size="xs" center>{json ? "sin intérprete" : "bloqueado"}</Tag>
        )}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [kind, setKind] = useState<AgentKind>("code");
  const [allow, setAllow] = useState<Allow>("safe");
  const plan = runPlan(kind, allow);
  return (
    <Figure
      label="Código como acción frente a JSON · mismo bucle, otro payload"
      hint="fiesta a las 19:00 + 30 + 60 + 45 + 45 min"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.amber, label: "llamadas JSON (ToolCallingAgent)" },
        { color: P.teal, label: "fragmento Python (CodeAgent)" },
        { color: P.violet, label: "modelo / intérprete" },
        { color: P.rose, label: "import peligroso" },
      ]}
      controls={
        <>
          <Switcher value={kind} onChange={setKind} ariaLabel="Tipo de agente" options={[{ value: "json", label: "ToolCallingAgent", tone: P.amber }, { value: "code", label: "CodeAgent", tone: P.teal }]} />
          <Switcher value={allow} onChange={setAllow} ariaLabel="additional_authorized_imports" options={[{ value: "safe", label: "['datetime']", tone: P.teal }, { value: "unsafe", label: "+ os, subprocess", tone: P.rose }]} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            {kind === "json"
              ? <><strong>ToolCallingAgent:</strong> cada suma es una llamada JSON con nombre y argumentos; el arnés la parsea, la despacha y devuelve la observación al modelo. Cuatro sumas y final_answer son {plan.modelCalls} vueltas al modelo. No hay intérprete: los imports no le afectan y la página inyectada no tiene dónde ejecutar nada.</>
              : <><strong>CodeAgent:</strong> un solo fragmento Python suma los cuatro tramos con datetime e imprime el reloj: {plan.modelCalls} vuelta. {plan.leak ? "Con os y subprocess autorizados, la página inyectada que pide variables de entorno las obtiene: eso ya es un shell." : "Con la allowlist en datetime, un import os de la página inyectada falla dentro del sandbox."}</>}
          </p>
          <Readout items={[
            { label: "resultado", value: plan.result, tone: "var(--teal)" },
            { label: "vueltas al modelo", value: String(plan.modelCalls), tone: kind === "json" ? "var(--amber)" : "var(--teal)" },
            { label: "imports", value: "[" + plan.imports.map((i) => `'${i}'`).join(", ") + "]", tone: allow === "unsafe" ? "var(--rose)" : "var(--teal)" },
          ]} />
          <p className="whitespace-pre-wrap rounded border border-line bg-paper p-2 font-mono text-xs">
            {kind === "code"
              ? "t = datetime(2026,1,1,19,0)\nfor m in [30, 60, 45, 45]: t += timedelta(minutes=m)\nfinal_answer(t.strftime('%H:%M'))"
              : plan.partials.map((m, i) => `{"name": "add_minutes", "arguments": {"time": "${clock(i === 0 ? START_MIN : plan.partials[i - 1])}", "minutes": ${STEPS_MIN[i]}}}`).join("\n") + `\n{"name": "final_answer", "arguments": {"answer": "${plan.result}"}}`}
          </p>
          <p className="text-xs text-muted">add_minutes es una herramienta inventada para el contraste; el agente de tiempos del curso no usa herramientas, solo additional_authorized_imports=[&apos;datetime&apos;]. Recuento de vueltas didáctico: en ambos casos smolagents sigue haciendo stop-and-parse.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.8, 5.0, 9.6], fov: 34 }} fit={1.06}>
        <ReactBench kind={kind} allow={allow} />
      </Stage>
    </Figure>
  );
}

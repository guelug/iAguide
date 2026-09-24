"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, type MeshPhysicalMaterial } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Arrow, Node3D, PointerTilt, ShadowBlob, Wire } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

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
 * The five boxes, in situ on one desk.
 *
 * Schema is what the model sees. Registry maps name to handler.
 * Dispatch is the pulse. Policy is the gate — if it hides a schema,
 * the tool does not exist for the model. Backend is where it actually
 * runs. The nearby intro visual already names the chain; this one
 * sits on the section that walks each box.
 */

type Mode = "chain" | "gate" | "backend";

const COPY = {
  en: {
    title: "five boxes between the model and the host",
    hint: "schema · registry · dispatch · policy · backend",
    chain: "the chain",
    gate: "policy gate",
    backend: "backends",
    legendCore: "core path",
    legendGate: "policy",
    legendHost: "backend",
    model: "model",
    host: "host",
    schema: "schema",
    registry: "registry",
    dispatch: "dispatch",
    policy: "policy",
    notes: {
      chain:
        "Five boxes, one desk. The model emits a tool_call. Schema is what it saw this turn. Registry looks up the name. Dispatch parses, validates, calls. Policy sits between model and host. Backend is where the callable actually runs.",
      gate: "If policy removes a tool, the model does not see its schema. That is the door — not a please in the system prompt. A failure in any of the five looks like a dumb model. It is not.",
      backend:
        "Terminal and browser are backends behind tools, not second brains. Hermes names local, Docker, SSH, Daytona, Modal. OpenClaw browser can target sandbox, host, or a paired node.",
    },
  },
  es: {
    title: "cinco cajas entre el modelo y el host",
    hint: "esquema · registro · despacho · política · backend",
    chain: "la cadena",
    gate: "puerta",
    backend: "backends",
    legendCore: "ruta núcleo",
    legendGate: "política",
    legendHost: "backend",
    model: "modelo",
    host: "host",
    schema: "esquema",
    registry: "registro",
    dispatch: "despacho",
    policy: "política",
    notes: {
      chain:
        "Cinco cajas, un escritorio. El modelo emite un tool_call. El esquema es lo que vio este turno. El registro busca el nombre. El despacho parsea, valida, llama. La política está entre el modelo y el host. El backend es donde el callable corre de verdad.",
      gate: "Si la política quita una tool, el modelo no ve su esquema. Esa es la puerta — no un por favor en el system prompt. Un fallo en cualquiera de las cinco se parece a un modelo tonto. No lo es.",
      backend:
        "Terminal y browser son backends detrás de tools, no segundos cerebros. Hermes nombra local, Docker, SSH, Daytona, Modal. OpenClaw browser puede apuntar a sandbox, host o un node emparejado.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

const BOXES: { key: "schema" | "registry" | "dispatch" | "policy"; color: string; wash: string }[] = [
  { key: "schema", color: P.teal, wash: P.tealWash },
  { key: "registry", color: P.teal, wash: P.tealWash },
  { key: "dispatch", color: P.amber, wash: P.amberWash },
  { key: "policy", color: P.violet, wash: P.violetWash },
];

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("chain");
  const hideSchema = mode === "gate";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendCore },
        { color: P.violet, label: t.legendGate },
        { color: P.amber, label: t.legendHost },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "chain", label: t.chain, tone: P.teal },
            { value: "gate", label: t.gate, tone: P.violet },
            { value: "backend", label: t.backend, tone: P.amber },
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
        <IsoFrame width={13.4} depth={11.4} y={-0.04} />
        <PlanTrace
          points={[[-5.6, 3.3], [-2.6, 3.3], [-2.6, 0.4]]}
          y={-0.03}
          color={mode === "gate" ? P.violet : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.8, 0, 2.2]} to={[4.8, 0, 2.2]} />
        <IsoDust count={40} center={[0, 0.5, 0]} spread={[5.2, 0.9, 3.4]} />

        <GlassPanel position={[-4.05, 1.15, 1.35]} rotation={ISO} size={[1.7, 1.7]} color={P.teal} opacity={0.22} />
        <Tag position={[-4.05, 2.2, 1.35]} tone="teal" size="xs">
          {t.model}
        </Tag>

        {BOXES.map((b, i) => {
          const hidden = hideSchema && b.key === "schema";
          return (
            <group key={b.key}>
              <GlassPanel
                position={[-1.85 + i * 1.35, 1.05, 0.15]}
                rotation={ISO}
                size={[1.15, 1.55]}
                color={hidden ? P.rose : b.color}
                opacity={hidden ? 0.08 : 0.28}
              />
              <Sheet
                position={[-1.85 + i * 1.35, 0.05, 0.2]}
                size={[0.85, 0.7]}
                color={hidden ? P.roseWash : b.wash}
                fill={hidden ? 0.12 : 0.85}
                marks={hidden ? 0 : 3}
                markColor={hidden ? P.rose : b.color}
              />
              <Tag
                position={[-1.85 + i * 1.35, 2.05, 0.15]}
                tone={hidden ? "rose" : b.color === P.teal ? "teal" : b.color === P.amber ? "amber" : "violet"}
                size="xs"
              >
                {t[b.key]}
              </Tag>
            </group>
          );
        })}

        <GlassPanel
          position={[3.85, 1.2, -0.85]}
          rotation={ISO}
          size={[1.85, 1.85]}
          color={P.amber}
          opacity={mode === "backend" ? 0.32 : 0.18}
        />
        <Tag position={[3.85, 2.35, -0.85]} tone="amber" size="xs">
          {t.host}
        </Tag>
        {mode === "backend"
          ? [0, 1, 2].map((i) => (
              <Sheet
                key={i}
                position={[3.55 + i * 0.22, 0.05, -0.55 - i * 0.18]}
                size={[0.7, 0.55]}
                color={P.amberWash}
                fill={0.85}
                marks={2}
                markColor={P.amber}
              />
            ))
          : (
            <Sheet
              position={[3.9, 0.05, -0.75]}
              size={[1.05, 0.8]}
              color={P.amberWash}
              fill={0.8}
              marks={3}
              markColor={P.amber}
            />
          )}

        <Duct
          from={[-3.3, 0.28, 1.05]}
          to={hideSchema ? [-1.9, 0.45, 0.2] : [3.05, 0.4, -0.55]}
          color={hideSchema ? P.rose : P.teal}
          radius={0.09}
          bend={0.45}
        />
        <Flow
          points={[
            [-3.15, 0.3, 1.0],
            hideSchema ? [-1.75, 0.42, 0.2] : [2.9, 0.42, -0.5],
          ]}
          color={hideSchema ? P.rose : P.teal}
          count={4}
        />
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Case5 = "ok" | "oculta" | "inventada" | "args" | "backend";
const CASES5 = ["esquema", "registro", "despacho", "política", "backend"] as const;

type Run = {
  /** index of the box where the call stops; 5 = went all the way through */
  stop: number;
  emitted: boolean;
  call: string;
  args: string;
  result: string;
  ok: boolean;
  text: string;
};

const RUNS: Record<Case5, Run> = {
  ok: {
    stop: 5, emitted: true, call: "get_weather", args: '{"location": "Madrid"}', ok: true,
    result: '{"tool_call_id": "call_abc123", "content": "{\\"temp_c\\": 21}"}',
    text: "El esquema estaba visible, el nombre existe en el registro, los argumentos validan contra el esquema, la política lo permite y el backend responde. El resultado vuelve con el mismo id para que el modelo lo correlacione.",
  },
  oculta: {
    stop: -1, emitted: false, call: "—", args: "—", ok: false,
    result: "(no hay tool_call: el modelo responde sin la tool)",
    text: "La política quita get_weather antes de construir el prompt: su esquema no se muestra y para el modelo la tool no existe. No hay nada que denegar después; esa es la puerta, no un «por favor» en el system prompt.",
  },
  inventada: {
    stop: 1, emitted: true, call: "get_wether", args: '{"location": "Madrid"}', ok: false,
    result: '{"tool_call_id": "call_abc123", "content": "{\\"error\\": \\"tool desconocida: get_wether\\"}"}',
    text: "El modelo pide un nombre que no está en el registro. Aunque lo pida con toda seguridad, no se ejecuta nada: el arnés devuelve un error con el mismo id.",
  },
  args: {
    stop: 2, emitted: true, call: "get_weather", args: '{"location": Madrid}', ok: false,
    result: '{"tool_call_id": "call_abc123", "content": "{\\"error\\": \\"arguments no es JSON válido\\"}"}',
    text: "El JSON de arguments viene roto (Madrid sin comillas). El despacho rechaza antes de llamar al handler: es más seguro devolver un error de parseo que ejecutar con argumentos basura.",
  },
  backend: {
    stop: 4, emitted: true, call: "get_weather", args: '{"location": "Madrid"}', ok: false,
    result: '{"tool_call_id": "call_abc123", "content": "{\\"error\\": \\"timeout tras 10 s\\"}"}',
    text: "Todo el arnés dio paso, pero el backend (la API del tiempo) no respondió. El fallo se convierte en un resultado de error con el mismo id; el bucle sigue y el modelo puede reintentar o explicarlo.",
  },
};

function SpanishVisual() {
  const [c, setC] = useState<Case5>("args");
  const run = RUNS[c];
  const passed = run.stop < 0 ? 0 : Math.min(run.stop, 5);
  const note = (
    <div className="space-y-3">
      <p><strong>{run.stop === 5 ? "Pasa las cinco cajas." : run.stop < 0 ? "Se decide antes de la llamada." : `Se detiene en «${CASES5[run.stop]}».`}</strong> {run.text}</p>
      <Readout
        items={[
          { label: "function.name", value: run.call, tone: "var(--ink)" },
          { label: "function.arguments", value: run.args, tone: c === "args" ? "var(--rose)" : "var(--ink)" },
          { label: "cajas superadas", value: `${passed} de 5`, tone: "var(--teal)" },
          { label: "¿handler ejecutado?", value: run.stop >= 4 ? "sí" : "no", tone: run.stop >= 4 ? "var(--teal)" : "var(--rose)" },
        ]}
      />
      <pre className="overflow-x-auto rounded border border-line bg-paper p-2 font-mono text-xs">{run.result}</pre>
      <p className="text-xs text-muted">Ejemplo con los campos de la tabla de la lección (<code>id</code> call_abc123, <code>type</code> function). El orden de comprobación varía entre arneses; lo que no varía es que la política decide qué esquemas ve el modelo.</p>
    </div>
  );
  return (
    <Figure
      label="Las cinco cajas del runtime · dónde se para un tool_call"
      hint="esquema · registro · despacho · política · backend"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.violet, label: "tool_call" },
        { color: P.teal, label: "caja superada" },
        { color: P.rose, label: "rechazo" },
        { color: P.amber, label: "política → esquema" },
      ]}
      note={note}
      controls={
        <Switcher value={c} onChange={setC} ariaLabel="Caso" options={[
          { value: "ok", label: "Correcto", tone: P.teal },
          { value: "oculta", label: "Política la oculta", tone: P.amber },
          { value: "inventada", label: "Nombre inventado", tone: P.rose },
          { value: "args", label: "Args rotos", tone: P.rose },
          { value: "backend", label: "Backend falla", tone: P.rose },
        ]} />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1, 2.6, 11.5], fov: 35 }} fit={1.02}>
        <DeskScene run={run} kase={c} />
      </Stage>
    </Figure>
  );
}

const bx = (i: number) => -2.55 + i * 1.45;
const DESK_Y = -0.8;
const MODEL_X = -4.3;

function boxColor(i: number, run: Run, kase: Case5) {
  if (kase === "oculta") return i === 3 ? P.amber : i === 0 ? P.amber : "#B9B5A9";
  if (i < run.stop) return P.teal;
  if (i === run.stop) return P.rose;
  return "#B9B5A9";
}

function Contents({ i, kase }: { i: number; kase: Case5 }) {
  const card = (x: number, color: string, ghost = false) => (
    <RoundedBox key={x} position={[x, 0.32, 0]} args={[0.26, 0.4, 0.04]} radius={0.02} smoothness={2} castShadow={!ghost}>
      <meshPhysicalMaterial color={color} roughness={0.45} clearcoat={0.4} transparent={ghost} opacity={ghost ? 0.12 : 1} />
    </RoundedBox>
  );
  if (i === 0)
    return <group>{card(-0.32, mixHex(P.paper, P.teal, 0.35), kase === "oculta")}{card(0, mixHex(P.paper, P.violet, 0.3))}{card(0.32, mixHex(P.paper, P.amber, 0.3))}</group>;
  if (i === 1)
    return (
      <group>
        {[-0.3, 0, 0.3].map((x, k) => (
          <RoundedBox key={x} position={[x, 0.2, 0]} args={[0.26, 0.2, 0.7]} radius={0.02} smoothness={2} castShadow>
            <meshPhysicalMaterial color={k === 0 && kase === "inventada" ? "#D9D2D0" : "#E8E3D6"} roughness={0.5} clearcoat={0.3} />
          </RoundedBox>
        ))}
      </group>
    );
  if (i === 2)
    return (
      <group position={[0, 0.3, 0]}>
        {[-1, 1].map((sgn) => (
          <group key={sgn} position={[sgn * 0.28, 0, 0]}>
            <mesh castShadow><boxGeometry args={[0.05, 0.42, 0.05]} /><meshStandardMaterial color={P.inkSoft} /></mesh>
            <mesh position={[-sgn * 0.06, 0.19, 0]} castShadow><boxGeometry args={[0.12, 0.05, 0.05]} /><meshStandardMaterial color={P.inkSoft} /></mesh>
            <mesh position={[-sgn * 0.06, -0.19, 0]} castShadow><boxGeometry args={[0.12, 0.05, 0.05]} /><meshStandardMaterial color={P.inkSoft} /></mesh>
          </group>
        ))}
        <mesh><sphereGeometry args={[0.07, 16, 12]} /><meshStandardMaterial color={kase === "args" ? P.rose : P.teal} emissive={kase === "args" ? P.rose : P.teal} emissiveIntensity={0.3} /></mesh>
      </group>
    );
  if (i === 3)
    return (
      <group position={[0, 0.32, 0]}>
        <mesh castShadow rotation={[0, 0, 0]}><cylinderGeometry args={[0.28, 0.2, 0.08, 6]} /><meshPhysicalMaterial color={P.amber} roughness={0.4} clearcoat={0.5} /></mesh>
        <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.06, 0.18, 0.06]} /><meshStandardMaterial color="#B7833E" metalness={0.6} roughness={0.3} /></mesh>
      </group>
    );
  return (
    <group>
      <RoundedBox position={[0, 0.3, -0.05]} args={[0.6, 0.42, 0.42]} radius={0.04} smoothness={2} castShadow>
        <meshPhysicalMaterial color="#1F2528" roughness={0.35} clearcoat={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.32, 0.17]}><planeGeometry args={[0.46, 0.28]} /><meshBasicMaterial color={kase === "backend" ? P.rose : P.teal} /></mesh>
    </group>
  );
}

function CaseBox({ i, run, kase }: { i: number; run: Run; kase: Case5 }) {
  const col = boxColor(i, run, kase);
  return (
    <group position={[bx(i), DESK_Y, 0]}>
      <RoundedBox position={[0, 0.12, 0]} args={[1.2, 0.26, 1.1]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD7C9" roughness={0.5} clearcoat={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.05, 0.95]} /><meshStandardMaterial color="#3B4548" roughness={0.6} /></mesh>
      {/* lid, hinged at the back and propped open */}
      <group position={[0, 0.26, -0.55]} rotation={[-1.25, 0, 0]}>
        <RoundedBox position={[0, 0, 0.55]} args={[1.2, 0.06, 1.1]} radius={0.03} smoothness={2} castShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, col, 0.3)} roughness={0.45} clearcoat={0.4} />
        </RoundedBox>
      </group>
      <mesh position={[0, 0.2, 0.56]}><boxGeometry args={[1.0, 0.07, 0.02]} /><meshBasicMaterial color={col} /></mesh>
      <group position={[0, 0.26, 0.05]}><Contents i={i} kase={kase} /></group>
      <Tag position={[0, -0.22, 0.75]} tone={col === P.teal ? "teal" : col === P.rose ? "rose" : col === P.amber ? "amber" : "muted"} size="xs" center>{i + 1 + " · " + CASES5[i]}</Tag>
    </group>
  );
}

function Packet({ run }: { run: Run }) {
  const ref = useRef<Group>(null);
  const mat = useRef<MeshPhysicalMaterial>(null);
  const { still } = useStage();
  const endX = run.stop >= 5 ? bx(4) : bx(Math.max(0, run.stop)) - 0.2;
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (!run.emitted) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const t = still ? 0.75 : (clock.elapsedTime / 5) % 1;
    const y = DESK_Y + 0.95;
    let x: number;
    let z: number;
    let back = false;
    if (t < 0.45) { x = MODEL_X + 0.4 + (endX - MODEL_X - 0.4) * (t / 0.45); z = 0; }
    else if (t < 0.55) { x = endX; z = 0; }
    else { back = true; x = endX + (MODEL_X + 0.4 - endX) * ((t - 0.55) / 0.45); z = 0.9; }
    g.position.set(x, back ? y - 0.35 : y, z);
    mat.current?.color.set(back ? (run.ok ? P.teal : P.rose) : P.violet);
  });
  return (
    <group ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[0.12, 24, 16]} />
        <meshPhysicalMaterial ref={mat} color={P.violet} roughness={0.3} clearcoat={0.7} />
      </mesh>
    </group>
  );
}

function DeskScene({ run, kase }: { run: Run; kase: Case5 }) {
  const endX = run.stop >= 5 ? bx(4) : bx(Math.max(0, run.stop)) - 0.2;
  const lane = useMemo(() => ({ out: [[MODEL_X + 0.4, DESK_Y + 0.95, 0], [endX, DESK_Y + 0.95, 0]] as [number, number, number][], back: [[endX, DESK_Y + 0.6, 0.9], [MODEL_X + 0.4, DESK_Y + 0.6, 0.9]] as [number, number, number][] }), [endX]);
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[-0.4, DESK_Y - 0.36, 0.1]} scale={10} opacity={0.1} />
        <RoundedBox position={[-0.4, DESK_Y - 0.14, 0.1]} args={[9.8, 0.2, 2.5]} radius={0.08} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#6B513A" roughness={0.6} metalness={0.03} />
        </RoundedBox>
        {[-4.9, 4.1].flatMap((x) => [-0.95, 1.15].map((z) => (
          <mesh key={x + ":" + z} position={[x, DESK_Y - 0.62, z]} castShadow><cylinderGeometry args={[0.07, 0.06, 0.8, 12]} /><meshStandardMaterial color="#40362D" roughness={0.6} /></mesh>
        )))}
        <group position={[MODEL_X, DESK_Y, 0]}>
          <mesh position={[0, 0.08, 0]} castShadow><cylinderGeometry args={[0.36, 0.42, 0.16, 32]} /><meshStandardMaterial color="#4E5A59" metalness={0.5} roughness={0.35} /></mesh>
          <Node3D position={[0, 0.55, 0]} color={P.violet} radius={0.34} />
          <Tag position={[0, 1.2, 0]} tone="violet" size="xs" center>{run.emitted ? "modelo" : "sin tool_call"}</Tag>
        </group>
        {CASES5.map((_, i) => <CaseBox key={i} i={i} run={run} kase={kase} />)}
        {run.emitted ? (
          <>
            <Wire points={lane.out} color={P.violet} opacity={0.35} dashed />
            <Wire points={lane.back} color={run.ok ? P.teal : P.rose} opacity={0.45} dashed />
            <Tag position={[(MODEL_X + endX) / 2, DESK_Y + 0.35, 1.1]} tone={run.ok ? "teal" : "rose"} size="xs" center>id call_abc123</Tag>
          </>
        ) : (
          <>
            <Tag position={[bx(0), DESK_Y + 0.95, 0.35]} tone="amber" size="xs" center>get_weather oculta</Tag>
            <Arrow from={[bx(3), DESK_Y + 1.1, -0.2]} to={[bx(0) + 0.3, DESK_Y + 1.1, -0.2]} color={P.amber} bow={0.5} width={2.2} />
          </>
        )}
        <Packet run={run} />
      </group>
    </PointerTilt>
  );
}

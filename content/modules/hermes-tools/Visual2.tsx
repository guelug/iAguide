"use client";
import { Edges, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
type Mode = "belt" | "loop" | "sandbox";
const COPY = { en: { label: "tools turn intent into side effects", hint: "toolbelt · loop · sandbox", belt: "toolbelt", loop: "loop", sandbox: "sandbox", search: "search", files: "files", terminal: "terminal", patch: "patch", call: "call", result: "result", deny: "deny", allow: "allow" }, es: { label: "las tools convierten intención en efectos", hint: "cinturón · bucle · sandbox", belt: "cinturón", loop: "bucle", sandbox: "sandbox", search: "busca", files: "ficheros", terminal: "terminal", patch: "patch", call: "llamada", result: "resultado", deny: "deniega", allow: "permite" } };
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("belt");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.allow},{color:P.rose,label:t.deny},{color:P.violet,label:t.result}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"belt",label:t.belt,tone:P.teal},{value:"loop",label:t.loop,tone:P.violet},{value:"sandbox",label:t.sandbox,tone:P.rose}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="belt"&&<>{[[t.search,P.teal,-2],[t.files,P.violet,0],[t.terminal,P.amber,2]].map(([lab,col,x],i)=><group key={lab as string}><Node3D position={[x as number,.6,0]} color={col as string} radius={.2} pulse={.2}/><Tag position={[x as number,1.1,.15]} tone={(["teal","violet","amber"] as const)[i]}>{lab as string}</Tag><Ribbon points={[[x as number,.2,0],[0,-.7,0]]} color={col as string} radius={.03} opacity={.7}/></group>)}<Slab position={[0,-1.1,0]} size={[2.2,.45,.1]} color={P.muted} fill={.15}/><Tag position={[0,-1.5,.15]} tone="muted" size="xs">agent chooses one</Tag></>}
{mode==="loop"&&<><Node3D position={[0,.7,0]} color={P.violet} radius={.22} pulse={.3}/><Tag position={[0,1.25,.15]} tone="violet">{t.call}</Tag><Ribbon points={[[0,.35,0],[0,-.25,0]]} color={P.teal} radius={.05} opacity={.85}/><Slab position={[0,-.7,0]} size={[1.8,.7,.12]} color={P.teal} fill={.25}/><Tag position={[0,-.2,.15]} tone="teal">{t.result}</Tag><Ribbon points={[[.8,-.7,0],[2,-.2,0],[2,.8,0],[.5,1.3,0]]} color={P.lineStrong} radius={.03} opacity={.7}/><Halo position={[0,.2,0]} radius={1.55} color={P.violet} opacity={.25} spin={.1}/></>}
{mode==="sandbox"&&<><Halo position={[0,.3,0]} radius={1.7} color={P.rose} opacity={.42} spin={.1}/><Slab position={[0,.3,0]} size={[2.7,1.8,.14]} color={P.teal} fill={.16} rim={.7}/><Tag position={[0,1.45,.15]} tone="teal">exec root</Tag><Node3D position={[0,.3,.2]} color={P.amber} radius={.2} pulse={.3}/><Tag position={[0,-.85,.15]} tone="rose" size="xs">{t.deny} fuera del root</Tag></>}
</PointerTilt></Stage></Figure>}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Case = "ok" | "raise" | "dict" | "todo" | "danger";
type Verdict = "aprobar" | "denegar";
type StationId = "loop" | "intercept" | "pre" | "approval" | "handler" | "post";

const OUT_Y = 0.42;
const BACK_Y = -0.46;
const Z_OUT = -0.32;
const Z_BACK = 0.34;
const X = { model: -4.55, loop: -3.25, intercept: -2.1, pre: -0.85, approval: 0.95, handler: 2.35, post: -0.85 };

const STATIONS: { id: StationId; label: string; x: number; y: number }[] = [
  { id: "loop", label: "run_agent", x: X.loop, y: OUT_Y },
  { id: "intercept", label: "intercepción", x: X.intercept, y: OUT_Y },
  { id: "pre", label: "pre_tool_call", x: X.pre, y: OUT_Y },
  { id: "approval", label: "approval.py", x: X.approval, y: OUT_Y },
  { id: "post", label: "post_tool_call", x: X.post, y: BACK_Y },
];

type Outcome = {
  label: string;
  color: string;
  tool: string;
  call: string;
  receives: string;
  /** Where the call turns round, and the gates it touches on the way. */
  turnX: number;
  visits: StationId[];
  caughtBy: "none" | "inner" | "gate" | "loop";
  wellFormed: boolean;
  text: string;
};

function outcomeFor(c: Case, verdict: Verdict): Outcome {
  switch (c) {
    case "ok":
      return {
        label: "JSON válido", color: P.teal, tool: "weather", call: "weather(location=\"Madrid\")",
        receives: '{"location": "Madrid", "temp_c": 21, "units": "metric"}',
        turnX: X.handler, visits: ["loop", "intercept", "pre", "handler", "post"], caughtBy: "none", wellFormed: true,
        text: "El handler devuelve json.dumps(...). La cadena vuelve por post_tool_call y el bucle la añade al historial.",
      };
    case "raise":
      return {
        label: "error JSON", color: P.rose, tool: "weather", call: "weather(location=\"Madrid\")",
        receives: '{"error": "Tool execution failed: TimeoutError"}',
        turnX: X.handler, visits: ["loop", "intercept", "pre", "handler", "post"], caughtBy: "inner", wellFormed: true,
        text: "El handler lanza una excepción. registry.dispatch() la captura y devuelve un objeto JSON con campo error; handle_function_call() tiene un segundo try/except por si algo escapa. El modelo recibe una cadena que puede parsear y puede recuperarse.",
      };
    case "dict":
      return {
        label: "repr, no JSON", color: P.amber, tool: "weather", call: "weather(location=\"Madrid\")",
        receives: "{'location': 'Madrid', 'temp_c': 21}",
        turnX: X.handler, visits: ["loop", "intercept", "pre", "handler", "post"], caughtBy: "none", wellFormed: false,
        text: "No hay excepción que capturar: el handler devolvió un dict de Python. Lo que llega al modelo es su repr (comillas simples), no campos JSON. Es el caso de la lección: el modelo no lo interpreta e inventa una segunda llamada.",
      };
    case "todo":
      return {
        label: "estado del agente", color: P.violet, tool: "todo", call: "todo(action=\"add\", ...)",
        receives: '{"todos": [{"id": 1, "status": "pending"}]}',
        turnX: X.intercept, visits: ["loop", "intercept"], caughtBy: "loop", wellFormed: true,
        text: "todo, memory, session_search y delegate_task se interceptan antes del registro porque necesitan estado del agente (TodoStore, MemoryStore). Sus schemas siguen en el registro para anunciarse; si el dispatch llegara a ellos, el handler sería un error stub.",
      };
    case "danger":
      return verdict === "aprobar"
        ? {
            label: "aprobado", color: P.teal, tool: "terminal", call: "terminal(command=\"rm -rf build/\")",
            receives: '{"output": "", "exit_code": 0}',
            turnX: X.handler, visits: ["loop", "intercept", "pre", "approval", "handler", "post"], caughtBy: "gate", wellFormed: true,
            text: "detect_dangerous_command() coincide con «recursive delete». En CLI se pregunta al usuario; en gateway, un callback lleva la petición a la plataforma. Con la aprobación, el comando corre en el backend configurado y el resultado vuelve como JSON.",
          }
        : {
            label: "denegado", color: P.rose, tool: "terminal", call: "terminal(command=\"rm -rf build/\")",
            receives: '{"error": "Command denied by user"}',
            turnX: X.approval, visits: ["loop", "intercept", "pre", "approval", "post"], caughtBy: "gate", wellFormed: true,
            text: "La coincidencia con DANGEROUS_PATTERNS detiene el comando antes del backend. No se ejecuta nada y el modelo recibe un objeto de error, no un fallo de transporte.",
          };
  }
}

/** Constant-speed walk along a polyline. */
function samplePath(points: V3[], t: number): V3 {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    lens.push(l);
    total += l;
  }
  let d = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(1, d / lens[i]) : 0;
      const a = points[i];
      const b = points[i + 1];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    d -= lens[i];
  }
  return points[points.length - 1];
}

const MAT = { base: "#2A2F33", baseTop: "#3A4247", steel: "#8C9895", steelDark: "#4E5A59", brass: "#B7833E", rail: "#6E7472" };

function Gate({ x, y, label, visited, flash, below = y < 0 }: { x: number; y: number; label: string; visited: boolean; flash?: string; below?: boolean }) {
  const lamp = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    if (!lamp.current) return;
    const c = flash ?? (visited ? "#39B37A" : "#8B939C");
    lamp.current.color.set(c);
    lamp.current.emissive.set(flash || visited ? c : "#000000");
  });
  return (
    <group position={[x, y, y < 0 ? Z_BACK : Z_OUT]}>
      {[-0.3, 0.3].map((dz) => (
        <mesh key={dz} position={[0, 0.02, dz]} castShadow>
          <boxGeometry args={[0.13, 0.5, 0.13]} />
          <meshStandardMaterial color={visited ? MAT.steel : "#B7B9B3"} metalness={0.55} roughness={0.35} />
        </mesh>
      ))}
      <RoundedBox position={[0, 0.3, 0]} args={[0.24, 0.13, 0.82]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color={visited ? MAT.brass : "#C9C3B5"} metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.3, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
        <meshStandardMaterial ref={lamp} color="#8B939C" emissiveIntensity={0.7} roughness={0.3} />
      </mesh>
      <Tag position={[0, below ? -0.34 : 0.66, 0.3]} tone={visited ? "ink" : "muted"} size="xs" center>
        <span className="normal-case">{label}</span>
      </Tag>
    </group>
  );
}

function Shell({ x0, x1, y0, y1, depth, zc = 0, color, label, labelX, labelBelow = false, flashRef }: { x0: number; x1: number; y0: number; y1: number; depth: number; zc?: number; color: string; label: string; labelX: number; labelBelow?: boolean; flashRef?: React.RefObject<MeshBasicMaterial | null> }) {
  const w = x1 - x0;
  const h = y1 - y0;
  return (
    <group position={[(x0 + x1) / 2, (y0 + y1) / 2, zc]}>
      <mesh>
        <boxGeometry args={[w, h, depth]} />
        <meshBasicMaterial ref={flashRef ?? undefined} color={color} transparent opacity={0.07} depthWrite={false} />
        <Edges color={color} lineWidth={1.3} transparent opacity={0.75} />
      </mesh>
      <Tag position={[labelX - (x0 + x1) / 2, labelBelow ? -h / 2 + 0.12 : h / 2 + 0.16, depth / 2]} tone={color === P.rose ? "rose" : "violet"} size="xs" center>
        <span className="normal-case">{label}</span>
      </Tag>
    </group>
  );
}

function Handler({ tool, hot }: { tool: string; hot: boolean }) {
  return (
    <group position={[X.handler, 0, Z_OUT]}>
      <RoundedBox position={[0, OUT_Y - 0.02, 0]} args={[0.95, 0.62, 0.9]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color={hot ? mixHex(P.paper, P.amber, 0.35) : "#E8E3D6"} roughness={0.42} clearcoat={0.5} />
      </RoundedBox>
      <mesh position={[0, OUT_Y + 0.12, 0.46]}>
        <boxGeometry args={[0.7, 0.05, 0.02]} />
        <meshStandardMaterial color={MAT.steelDark} metalness={0.6} roughness={0.3} />
      </mesh>
      {[-0.28, 0, 0.28].map((dx) => (
        <mesh key={dx} position={[dx, OUT_Y - 0.14, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial color={MAT.brass} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <Tag position={[0.1, OUT_Y - 0.5, 0.5]} tone="amber" size="xs" center>
        <span className="normal-case">{tool === "todo" ? "stub de error" : "handler " + tool}</span>
      </Tag>
    </group>
  );
}

function Carriage({ outcome, verdictKey }: { outcome: Outcome; verdictKey: string }) {
  const ref = useRef<Group>(null);
  const mat = useRef<MeshStandardMaterial>(null);
  const cube = useRef<Mesh>(null);
  const ball = useRef<Mesh>(null);
  const { still } = useStage();
  const start = useRef<number | null>(null);
  const path = useMemo<{ out: V3[]; back: V3[] }>(() => {
    const atHandler = outcome.turnX === X.handler;
    const stopX = atHandler ? X.handler - 0.55 : outcome.turnX;
    const out: V3[] = [[X.model + 0.35, OUT_Y, Z_OUT], [stopX, OUT_Y, Z_OUT]];
    const turnX = atHandler ? X.handler + 0.75 : outcome.turnX + 0.3;
    const back: V3[] = atHandler
      ? [[stopX, OUT_Y, Z_OUT], [turnX, OUT_Y, Z_OUT], [turnX, BACK_Y, Z_BACK], [X.model + 0.35, BACK_Y, Z_BACK]]
      : [[stopX, OUT_Y, Z_OUT], [turnX, OUT_Y - 0.3, 0], [turnX, BACK_Y, Z_BACK], [X.model + 0.35, BACK_Y, Z_BACK]];
    return { out, back };
  }, [outcome.turnX]);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (start.current === null) start.current = clock.elapsedTime;
    const period = outcome.caughtBy === "gate" ? 7 : 5.5;
    const t = still ? 0.8 : ((clock.elapsedTime - start.current) / period) % 1;
    const dwell = outcome.caughtBy === "gate" ? [0.38, 0.6] : [0.42, 0.52];
    let p: V3;
    let returned = false;
    if (t < dwell[0]) p = samplePath(path.out, t / dwell[0]);
    else if (t < dwell[1]) p = path.out[path.out.length - 1];
    else {
      p = samplePath(path.back, (t - dwell[1]) / (1 - dwell[1]));
      returned = true;
    }
    g.position.set(p[0], p[1] + 0.02, p[2]);
    mat.current?.color.set(returned ? outcome.color : P.inkSoft);
    // A malformed payload is drawn as a cube: same data, wrong shape.
    const malformed = returned && !outcome.wellFormed;
    if (cube.current) cube.current.visible = malformed;
    if (ball.current) ball.current.visible = !malformed;
    if (cube.current) cube.current.material = mat.current!;
  });
  return (
    <group ref={ref} key={verdictKey}>
      <mesh ref={ball} castShadow>
        <sphereGeometry args={[0.13, 24, 16]} />
        <meshStandardMaterial ref={mat} color={P.inkSoft} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh ref={cube} castShadow visible={false} rotation={[0.5, 0.6, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
      </mesh>
    </group>
  );
}

function DispatchScene({ outcome, scenario }: { outcome: Outcome; scenario: string }) {
  const inner = useRef<MeshBasicMaterial>(null);
  const { still } = useStage();
  useFrame(({ clock }) => {
    if (!inner.current) return;
    const pulse = outcome.caughtBy === "inner" && !still ? 0.07 + 0.12 * Math.max(0, Math.sin(clock.elapsedTime * 3)) : outcome.caughtBy === "inner" ? 0.16 : 0.07;
    inner.current.opacity = pulse;
  });
  const visited = (id: StationId) => outcome.visits.includes(id);
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[0, -1.46, 0.1]} scale={9.6} opacity={0.1} />
        <RoundedBox position={[-0.2, -1.3, 0]} args={[10.2, 0.28, 2.0]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={MAT.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox position={[-0.2, -1.13, 0]} args={[9.9, 0.06, 1.72]} radius={0.03} smoothness={2} receiveShadow>
          <meshStandardMaterial color={MAT.baseTop} roughness={0.45} metalness={0.2} />
        </RoundedBox>
        {/* two rails: call out (back row), result back (front row) */}
        {([[OUT_Y, Z_OUT, X.handler + 0.75], [BACK_Y, Z_BACK, X.handler + 0.75]] as const).map(([y, z, x1], i) => {
          const x0 = X.model + 0.3;
          const legs = 10;
          return (
            <group key={i}>
              <mesh position={[(x0 + x1) / 2, y - 0.19, z]} castShadow receiveShadow>
                <boxGeometry args={[x1 - x0, 0.06, 0.24]} />
                <meshStandardMaterial color={MAT.rail} metalness={0.6} roughness={0.32} />
              </mesh>
              {Array.from({ length: legs }, (_, k) => {
                const top = y - 0.22;
                const h = top + 1.1;
                return (
                  <mesh key={k} position={[x0 + 0.25 + k * ((x1 - x0 - 0.5) / (legs - 1)), top - h / 2, z]} castShadow>
                    <boxGeometry args={[0.05, h, 0.05]} />
                    <meshStandardMaterial color={MAT.steelDark} metalness={0.5} roughness={0.4} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
        <mesh position={[X.handler + 0.75, (OUT_Y + BACK_Y) / 2 - 0.19, (Z_OUT + Z_BACK) / 2]} rotation={[Math.atan2(Z_BACK - Z_OUT, OUT_Y - BACK_Y), 0, 0]} castShadow>
          <boxGeometry args={[0.24, Math.hypot(OUT_Y - BACK_Y, Z_BACK - Z_OUT), 0.06]} />
          <meshStandardMaterial color={MAT.rail} metalness={0.6} roughness={0.32} />
        </mesh>
        {/* the model */}
        <group position={[X.model, 0, 0]}>
          <mesh position={[0, -0.95, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.5, 0.3, 32]} />
            <meshStandardMaterial color={MAT.steelDark} metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.25, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.1, 16]} />
            <meshStandardMaterial color={MAT.steel} metalness={0.6} roughness={0.3} />
          </mesh>
          <Node3D position={[0, 0.1, 0]} color={P.violet} radius={0.34} />
          <Tag position={[0, 0.72, 0.2]} tone="violet" size="xs" center>modelo</Tag>
        </group>
        <Shell x0={-1.45} x1={3.45} y0={-1.02} y1={1.22} depth={1.5} color={P.violet} label="try · handle_function_call" labelX={1.2} labelBelow />
        <Shell x0={0.35} x1={3.3} y0={-0.02} y1={1.06} depth={0.95} zc={Z_OUT} color={P.rose} label="try · registry.dispatch" labelX={1.65} flashRef={inner} />
        {STATIONS.map((s) => (
          <Gate key={s.id} x={s.x} y={s.y} label={s.label} below={s.y < 0 || s.id === "approval"} visited={visited(s.id)} flash={s.id === "approval" && outcome.caughtBy === "gate" ? outcome.color : undefined} />
        ))}
        <Handler tool={outcome.tool} hot={visited("handler")} />
        <Carriage key={scenario} outcome={outcome} verdictKey={scenario} />
        <Tag position={[X.model + 1.1, BACK_Y - 0.42, Z_BACK + 0.35]} tone={outcome.color === P.rose ? "rose" : outcome.color === P.amber ? "amber" : outcome.color === P.violet ? "violet" : "teal"} size="xs" center>
          {outcome.label}
        </Tag>
      </group>
    </PointerTilt>
  );
}

const CASES: { value: Case; label: string }[] = [
  { value: "ok", label: "Correcto" },
  { value: "raise", label: "Lanza" },
  { value: "dict", label: "Devuelve dict" },
  { value: "todo", label: "todo" },
  { value: "danger", label: "rm -rf" },
];

function SpanishVisual() {
  const [c, setC] = useState<Case>("raise");
  const [verdict, setVerdict] = useState<Verdict>("denegar");
  const outcome = useMemo(() => outcomeFor(c, verdict), [c, verdict]);
  const tries = outcome.visits.includes("pre") ? 2 : 0;
  const note = (
    <div className="space-y-3">
      <p><strong>{outcome.label[0].toUpperCase() + outcome.label.slice(1)}.</strong> {outcome.text}</p>
      <Readout
        items={[
          { label: "llamada", value: outcome.call, tone: "var(--ink)" },
          { label: "puertas cruzadas", value: `${outcome.visits.length} de 6`, tone: "var(--teal)" },
          { label: "capas try/except", value: String(tries), tone: "var(--violet)" },
          { label: "¿JSON parseable?", value: outcome.wellFormed ? "sí" : "no", tone: outcome.wellFormed ? "var(--teal)" : "var(--amber)" },
        ]}
      />
      <div>
        <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">lo que recibe el modelo</p>
        <pre className="overflow-x-auto rounded border border-line bg-paper p-2 font-mono text-xs">{outcome.receives}</pre>
      </div>
      <p className="text-xs text-muted">
        Recorrido según <em>Tools Runtime</em>: bucle → intercepciones → <code>handle_function_call</code> → <code>pre_tool_call</code> → <code>registry.dispatch</code> → handler → <code>post_tool_call</code>. Las cadenas de ejemplo son didácticas; el texto exacto del error depende de la versión de Hermes.
      </p>
    </div>
  );
  return (
    <Figure
      label="Dispatch de Hermes · los errores son datos"
      hint="dos try/except entre el handler y el modelo"
      height="h-[420px] md:h-[500px]"
      legend={[
        { color: P.inkSoft, label: "tool_call" },
        { color: P.teal, label: "resultado JSON" },
        { color: P.rose, label: "error JSON" },
        { color: P.amber, label: "repr (mal contrato)" },
        { color: P.violet, label: "interceptada" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={c} onChange={setC} options={CASES.map((o) => ({ ...o, tone: o.value === "raise" ? P.rose : o.value === "dict" ? P.amber : o.value === "todo" ? P.violet : P.teal }))} ariaLabel="Caso de dispatch" />
          {c === "danger" ? (
            <Switcher value={verdict} onChange={setVerdict} ariaLabel="Respuesta a la aprobación" options={[{ value: "aprobar", label: "Aprobar", tone: P.teal }, { value: "denegar", label: "Denegar", tone: P.rose }]} />
          ) : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.8, 2.0, 11], fov: 35 }} fit={0.96}>
        <DispatchScene outcome={outcome} scenario={c + verdict} />
      </Stage>
    </Figure>
  );
}

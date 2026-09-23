"use client";

import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Ribbon, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Step = "a" | "b" | "c" | "d" | "e";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "session": "session",
      "events": "events",
      "permissions": "permissions",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "session": "sesión",
      "events": "eventos",
      "permissions": "permisos",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: "stdio", tone: "var(--teal)" },
    { value: "b" as const, label: t.session, tone: "var(--teal)" },
    { value: "c" as const, label: t.events, tone: "var(--violet)" },
    { value: "d" as const, label: t.permissions, tone: "var(--amber)" },
    { value: "e" as const, label: "fork", tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="Hermes: ACP adapter"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="hermes-acp diagram steps"
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
        stdio
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.session}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.events}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.permissions}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        fork
      </Tag>
    </group>
  );
}

/* ======================================================================
 * Versión española: anatomía del adaptador `hermes acp`.
 *
 * Un proceso con dos salidas (stdout para JSON-RPC, stderr para logs),
 * dos hilos (event loop de ACP y worker con AIAgent), un puente de
 * eventos con colas FIFO por nombre de tool, un mapa de permisos
 * fail-closed y un fork que copia el historial. Cada modo simula una
 * secuencia pequeña y cuenta el resultado.
 * ==================================================================== */

type AcpMode = "stdio" | "events" | "perms" | "fork";
type Answer = "allow_once" | "allow_always" | "reject" | "timeout";

/** Six writes the process makes during a prompt, in order. */
const WRITES: ("rpc" | "log")[] = ["rpc", "log", "rpc", "rpc", "log", "rpc"];

function stdioModel(leak: boolean) {
  const stdout = WRITES.filter((w) => leak || w === "rpc");
  const broken = stdout.filter((w) => w === "log").length;
  return { stdout: stdout.length, stderr: leak ? 0 : WRITES.length - stdout.length, broken };
}

/** Two parallel `terminal` calls; completions arrive in start order. */
function fifoModel(fifo: boolean) {
  const starts = ["call_a", "call_b"];
  if (fifo) {
    const queue = [...starts];
    return starts.map((id) => ({ real: id, bound: queue.shift()! }));
  }
  // One id per tool name: the second start overwrote the first.
  const slot = starts[starts.length - 1];
  return starts.map((id) => ({ real: id, bound: slot }));
}

const PERMISSION: Record<Answer, { hermes: string; runs: boolean; label: string }> = {
  allow_once: { hermes: "once", runs: true, label: "allow_once" },
  allow_always: { hermes: "always", runs: true, label: "allow_always" },
  reject: { hermes: "deny", runs: false, label: "reject" },
  timeout: { hermes: "deny", runs: false, label: "timeout" },
};

const PARENT_HISTORY = 5;

function SpanishVisual() {
  const [mode, setMode] = useState<AcpMode>("stdio");
  const [leak, setLeak] = useState(false);
  const [fifo, setFifo] = useState(true);
  const [answer, setAnswer] = useState<Answer>("allow_once");
  const [edits, setEdits] = useState(0);
  const io = stdioModel(leak);
  const matches = fifoModel(fifo);
  const wrong = matches.filter((m) => m.real !== m.bound).length;
  const perm = PERMISSION[answer];

  const notes: Record<AcpMode, string> = {
    stdio: leak
      ? `Un log escrito en stdout viaja por el canal de JSON-RPC. El editor recibe ${io.stdout} líneas y ${io.broken} no son frames válidos: las lee como RPC roto.`
      : `stdout queda reservado al transporte JSON-RPC: ${io.stdout} frames. Los ${io.stderr} logs legibles salen por stderr, que el editor no parsea. El arranque ya lo configura así en acp_adapter.entry.main().`,
    events: fifo
      ? "AIAgent corre en un hilo worker; sus callbacks saltan al event loop con asyncio.run_coroutine_threadsafe y salen como session_update. Dos llamadas terminal en el mismo paso: la cola FIFO por nombre engancha cada completion a su propia llamada."
      : `Con un solo id por nombre, la segunda llamada terminal pisa a la primera. ${wrong} de 2 completions se enganchan a la invocación equivocada. La corrección documentada es una cola FIFO por nombre, no prohibir tools en paralelo.`,
    perms: perm.runs
      ? `El editor responde ${perm.label}; el puente lo traduce a «${perm.hermes}» y el comando peligroso se ejecuta.`
      : answer === "timeout"
        ? "Nadie responde a tiempo. El puente es fail-closed: timeout o fallo del puente equivalen a deny y el comando no se ejecuta."
        : "Cualquier opción reject se traduce a deny. El comando no se ejecuta.",
    fork: edits === 0
      ? `fork_session() copia en profundidad los ${PARENT_HISTORY} mensajes del padre a una sesión viva nueva, con su propio session_id y su propio cwd.`
      : `El fork ha recibido ${edits} ${edits === 1 ? "mensaje nuevo" : "mensajes nuevos"}: tiene ${PARENT_HISTORY + edits}. El padre sigue con ${PARENT_HISTORY}. Un fork es una copia, no un puntero al historial padre.`,
  };

  const controls: Record<AcpMode, React.ReactNode> = {
    stdio: <button type="button" className="chip" aria-pressed={leak} onClick={() => setLeak(!leak)}>{leak ? "Separar stderr" : "Escribir log en stdout"}</button>,
    events: <Switcher ariaLabel="Seguimiento de ids" value={fifo ? "fifo" : "single"} onChange={(v) => setFifo(v === "fifo")} options={[{ value: "fifo", label: "Cola FIFO por nombre", tone: P.teal }, { value: "single", label: "Un id por nombre", tone: P.rose }]} />,
    perms: <Switcher ariaLabel="Respuesta del editor" value={answer} onChange={setAnswer} options={(Object.keys(PERMISSION) as Answer[]).map((v) => ({ value: v, label: v === "timeout" ? "sin respuesta" : v, tone: PERMISSION[v].runs ? P.teal : P.rose }))} />,
    fork: (
      <>
        <button type="button" className="chip" disabled={edits >= 4} onClick={() => setEdits(edits + 1)}>Escribir en el fork +</button>
        <button type="button" className="chip" onClick={() => setEdits(0)}>Repetir fork</button>
      </>
    ),
  };

  return (
    <Figure
      label="Hermes sobre ACP: un proceso, dos canales, dos hilos"
      hint="hermes acp · JSON-RPC por stdio"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "JSON-RPC (stdout)" },
        { color: P.faint, label: "Logs (stderr)" },
        { color: P.violet, label: "Hilo worker" },
        { color: P.rose, label: "Error o denegación" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="Parte del adaptador" value={mode} onChange={setMode} options={[{ value: "stdio", label: "stdio", tone: P.teal }, { value: "events", label: "Eventos", tone: P.violet }, { value: "perms", label: "Permisos", tone: P.amber }, { value: "fork", label: "Fork", tone: P.inkSoft }]} />
          {controls[mode]}
        </>
      }
      note={
        <div className="space-y-2">
          <p>{notes[mode]}</p>
          <p className="text-xs text-muted">
            Secuencias de ejemplo, no una traza real. Ficheros: entry.py (arranque), server.py (HermesACPAgent), session.py (SessionManager), events.py (puente de eventos), permissions.py (mapa de permisos). Fuente: Nous Research, ACP Internals.
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [4, 6, 10.5], fov: 34 }} fit={1.06}>
        <AcpBench mode={mode} leak={leak} fifo={fifo} answer={answer} edits={edits} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
const CH_X = 0.3;
const LOOP_Z = 0.75;
const WORK_Z = -0.75;
const STDOUT: V3[] = [[CH_X - 2.35, 0.45, LOOP_Z], [-3.1, 0.7, 0.6], [-3.75, 0.95, 0.25]];
const STDERR: V3[] = [[CH_X + 2.35, 0.35, WORK_Z], [3.3, 0.35, -0.95], [3.85, 0.3, -1.05]];

function Block({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

function AcpBench({ mode, leak, fifo, answer, edits }: { mode: AcpMode; leak: boolean; fifo: boolean; answer: Answer; edits: number }) {
  const io = stdioModel(leak);
  const broken = mode === "stdio" && io.broken > 0;
  return (
    <group>
      <ShadowBlob position={[0, -0.25, 0]} scale={11} opacity={0.08} />
      <Block p={[0, -0.13, -0.1]} s={[10.6, 0.22, 4]} color="#40362D" rough={0.6} coat={0.3} />
      <Block p={[0, 0.0, -0.1]} s={[10.3, 0.05, 3.7]} color="#6B513A" rough={0.55} coat={0} />

      {/* The ACP client: an editor screen that parses every stdout line. */}
      <group position={[-4.3, 0, 0.1]} rotation={[0, 0.55, 0]}>
        <Block p={[0, 0.06, 0]} s={[0.9, 0.08, 0.6]} color="#2E3438" metal={0.3} />
        <mesh position={[0, 0.45, -0.1]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.75, 12]} />
          <meshStandardMaterial color="#8C9296" metalness={0.7} roughness={0.3} />
        </mesh>
        <Block p={[0, 1.15, 0]} s={[1.7, 1.1, 0.1]} color="#23282C" metal={0.2} coat={0.6} />
        <mesh position={[0, 1.15, 0.056]}>
          <planeGeometry args={[1.55, 0.95]} />
          <meshStandardMaterial color={broken ? mixHex("#1B2124", P.rose, 0.25) : "#1B2124"} roughness={0.35} />
        </mesh>
        {(mode === "stdio" ? WRITES.filter((w) => leak || w === "rpc") : ["rpc", "rpc", "rpc", "rpc"]).map((w, k) => (
          <mesh key={k} position={[-0.45 + (k % 2) * 0.1, 1.5 - k * 0.13, 0.06]}>
            <planeGeometry args={[w === "log" ? 0.95 : 0.7, 0.06]} />
            <meshBasicMaterial color={w === "log" ? P.rose : "#5FB3A9"} />
          </mesh>
        ))}
        <Tag position={[0, 1.95, 0]} tone={broken ? "rose" : "ink"} size="xs" center>{broken ? "Frame roto" : "Editor ACP"}</Tag>
      </group>

      {/* The hermes acp process: a chassis with two thread lanes. */}
      <group position={[CH_X, 0, 0]}>
        <Block p={[0, 0.1, 0]} s={[4.8, 0.14, 3.1]} color="#263532" metal={0.3} coat={0.35} />
        {[-1.52, 1.52].map((z) => <Block key={z} p={[0, 0.35, z]} s={[4.8, 0.4, 0.07]} color="#31423F" metal={0.3} />)}
        {[-2.37, 2.37].map((x) => <Block key={x} p={[x, 0.35, 0]} s={[0.07, 0.4, 3.1]} color="#31423F" metal={0.3} />)}
        {[-2.2, 2.2].flatMap((x) => [-1.35, 1.35].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.18, z]}>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 10]} />
            <meshStandardMaterial color="#A1A6A4" metalness={0.8} roughness={0.27} />
          </mesh>
        )))}
        <mesh position={[0, 0.2, LOOP_Z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 4.4, 14]} />
          <meshStandardMaterial color={P.teal} roughness={0.35} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.2, WORK_Z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 4.4, 14]} />
          <meshStandardMaterial color={P.violet} roughness={0.35} metalness={0.3} />
        </mesh>
        <Tag position={[-1.75, 0.34, LOOP_Z + 0.32]} tone="teal" size="xs">event loop</Tag>
        <Tag position={[-1.75, 0.34, WORK_Z - 0.32]} tone="violet" size="xs">hilo worker</Tag>
        <Tag position={[0, 0.9, -1.6]} tone="ink" center>hermes acp</Tag>
        {mode === "stdio" ? <StdioInsert leak={leak} /> : null}
        {mode === "events" ? <EventsInsert fifo={fifo} /> : null}
        {mode === "perms" ? <PermsInsert answer={answer} /> : null}
        {mode === "fork" ? <ForkInsert edits={edits} /> : null}
      </group>

      {/* The two exits. */}
      <Ribbon points={STDOUT} color={P.teal} radius={0.07} opacity={0.35} />
      <Ribbon points={STDERR} color={P.faint} radius={0.07} opacity={0.35} />
      <Tag position={[-3.1, 1.05, 0.6]} tone="teal" size="xs" center>stdout</Tag>
      <group position={[4.3, 0, -1.1]}>
        <Block p={[0, 0.1, 0]} s={[0.95, 0.12, 1.1]} color="#D9D3C6" rough={0.6} coat={0.1} />
        {Array.from({ length: mode === "stdio" ? io.stderr + 2 : 3 }, (_, k) => (
          <mesh key={k} position={[0, 0.18 + k * 0.035, 0]} rotation={[0, (k - 1) * 0.06, 0]} castShadow>
            <boxGeometry args={[0.72, 0.02, 0.88]} />
            <meshStandardMaterial color={k % 2 ? "#F4F0E6" : "#ECE7DA"} roughness={0.7} />
          </mesh>
        ))}
        <Tag position={[0, 0.65, 0]} tone="muted" size="xs" center>stderr · logs</Tag>
      </group>
    </group>
  );
}

/* INSERTS */
function StdioInsert({ leak }: { leak: boolean }) {
  return (
    <group>
      <Block p={[0, 0.42, 0]} s={[0.9, 0.5, 0.7]} color="#E6E0D2" coat={0.5} />
      {WRITES.map((w, k) => (
        <mesh key={k} position={[-0.3 + k * 0.12, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.22, 4, 10]} />
          <meshStandardMaterial color={w === "rpc" ? P.teal : leak ? P.rose : P.faint} roughness={0.4} />
        </mesh>
      ))}
      <Tag position={[0, 1.05, 0]} tone="ink" size="xs" center>6 escrituras</Tag>
      <Flow points={[[-0.45, 0.4, 0.2], [-1.4, 0.35, LOOP_Z], [-2.35, 0.45, LOOP_Z]]} color={P.teal} count={3} size={0.045} speed={0.4} />
      {leak ? (
        <Flow points={[[-0.45, 0.5, -0.1], [-1.3, 0.5, 0.4], [-2.35, 0.5, LOOP_Z]]} color={P.rose} count={2} size={0.045} speed={0.4} offset={0.5} />
      ) : (
        <Flow points={[[0.45, 0.4, -0.2], [1.4, 0.35, WORK_Z], [2.35, 0.35, WORK_Z]]} color={P.faint} count={2} size={0.045} speed={0.4} />
      )}
    </group>
  );
}

function EventsInsert({ fifo }: { fifo: boolean }) {
  const matches = fifoModel(fifo);
  const callX = (id: string) => (id === "call_a" ? -1.1 : -0.3);
  return (
    <group>
      {["call_a", "call_b"].map((id) => (
        <group key={id} position={[callX(id), 0, WORK_Z]}>
          <Block p={[0, 0.38, 0]} s={[0.6, 0.36, 0.5]} color={mixHex(P.paper, P.violet, 0.35)} />
          <Tag position={[0, 0.78, 0]} tone="violet" size="xs" center>{id === "call_a" ? "terminal a" : "terminal b"}</Tag>
        </group>
      ))}
      {/* Thread-safe hop from the worker to the event loop. */}
      <Flow points={[[0.5, 0.45, WORK_Z], [0.75, 1.35, 0], [1.0, 0.45, LOOP_Z]]} color={P.violet} count={3} size={0.045} speed={0.4} />
      <Tag position={[0.75, 1.55, 0]} tone="violet" size="xs" center>salto entre hilos</Tag>
      <group position={[1.55, 0, LOOP_Z]}>
        <Block p={[0, 0.3, 0]} s={[1.2, 0.2, 0.55]} color={fifo ? mixHex(P.paper, P.teal, 0.3) : mixHex(P.paper, P.rose, 0.3)} />
        {matches.map((m, k) => (
          <mesh key={k} position={[-0.3 + k * 0.6, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.14, 20]} />
            <meshStandardMaterial color={m.real === m.bound ? P.teal : P.rose} roughness={0.4} />
          </mesh>
        ))}
        <Tag position={[0, 0.85, 0.35]} tone={fifo ? "teal" : "rose"} size="xs" center>{fifo ? "cola FIFO" : "un id"}</Tag>
      </group>
      {matches.map((m, k) => (
        <Wire key={k} points={[[1.25 + k * 0.6, 0.55, LOOP_Z], [(1.25 + k * 0.6 + callX(m.bound)) / 2, 1.0, 0], [callX(m.bound), 0.6, WORK_Z]]} color={m.real === m.bound ? P.teal : P.rose} width={1.6} opacity={0.85} />
      ))}
    </group>
  );
}

function PermsInsert({ answer }: { answer: Answer }) {
  const perm = PERMISSION[answer];
  const keys = Object.keys(PERMISSION) as Answer[];
  return (
    <group>
      <Block p={[-1.0, 0.3, LOOP_Z - 0.1]} s={[1.9, 0.22, 0.7]} color="#E6E0D2" />
      {keys.map((k, i) => {
        const on = k === answer;
        return (
          <group key={k} position={[-1.7 + i * 0.46, 0.42, LOOP_Z - 0.1]} rotation={[on ? -0.6 : 0.35, 0, 0]}>
            <mesh position={[0, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.4, 10]} />
              <meshStandardMaterial color="#8C9296" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.42, 0]} castShadow>
              <sphereGeometry args={[0.07, 16, 12]} />
              <meshStandardMaterial color={on ? (PERMISSION[k].runs ? P.teal : P.rose) : "#B9B5A9"} roughness={0.35} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[-1.0, 1.15, LOOP_Z]} tone="amber" size="xs" center>{`${perm.label} → ${perm.hermes}`}</Tag>
      <Flow points={[[-0.1, 0.45, LOOP_Z - 0.1], [0.4, 0.6, 0], [0.8, 0.45, WORK_Z]]} color={perm.runs ? P.teal : P.rose} count={2} size={0.045} speed={0.4} />
      {/* The gate in front of the dangerous terminal command. */}
      <group position={[1.1, 0, WORK_Z]}>
        {[-0.3, 0.3].map((z) => <Block key={z} p={[0, 0.35, z]} s={[0.1, 0.5, 0.1]} color="#8E6632" metal={0.6} />)}
        <mesh position={[0, perm.runs ? 0.85 : 0.52, 0]} rotation={[perm.runs ? 0 : 0, 0, perm.runs ? Math.PI / 2.4 : 0]} castShadow>
          <boxGeometry args={[0.08, 0.08, 0.75]} />
          <meshStandardMaterial color={perm.runs ? P.teal : P.rose} roughness={0.4} />
        </mesh>
        <Block p={[0.75, 0.38, 0]} s={[0.6, 0.36, 0.5]} color={mixHex(P.paper, P.violet, perm.runs ? 0.45 : 0.12)} />
        <Tag position={[0.75, 0.8, 0]} tone={perm.runs ? "violet" : "rose"} size="xs" center>{perm.runs ? "se ejecuta" : "denegado"}</Tag>
      </group>
    </group>
  );
}

function ForkInsert({ edits }: { edits: number }) {
  const stack = (n: number, extra: number) =>
    Array.from({ length: n + extra }, (_, k) => (
      <mesh key={k} position={[0, 0.3 + k * 0.07, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, 0.55]} />
        <meshStandardMaterial color={k < n ? mixHex(P.paper, P.teal, 0.3 + (k % 2) * 0.15) : P.amber} roughness={0.5} />
      </mesh>
    ));
  return (
    <group>
      <group position={[-1.1, 0, 0]}>
        <Block p={[0, 0.22, 0]} s={[1.1, 0.12, 0.85]} color="#3A4745" metal={0.3} />
        {stack(PARENT_HISTORY, 0)}
        <Tag position={[0, 0.25 + PARENT_HISTORY * 0.07 + 0.35, 0]} tone="teal" size="xs" center>{`s1 · ${PARENT_HISTORY} mensajes`}</Tag>
      </group>
      <group position={[1.1, 0, 0]}>
        <Block p={[0, 0.22, 0]} s={[1.1, 0.12, 0.85]} color="#3A4745" metal={0.3} />
        {stack(PARENT_HISTORY, edits)}
        <Tag position={[0, 0.25 + (PARENT_HISTORY + edits) * 0.07 + 0.35, 0]} tone={edits ? "amber" : "teal"} size="xs" center>{`s2 · ${PARENT_HISTORY + edits} mensajes`}</Tag>
      </group>
      <Flow points={[[-0.6, 0.55, 0], [0, 1.2, 0], [0.6, 0.55, 0]]} color={P.teal} count={3} size={0.045} speed={0.4} />
      <Tag position={[0, 1.35, 0.35]} tone="muted" size="xs" center>copia profunda</Tag>
    </group>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Node3D, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Step = "key" | "row" | "transcript" | "compact" | "search";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "sessions_and_durable_threads": "Sessions and durable threads",
      "step_the_diagram": "step the diagram",
      "session_key": "session key",
      "sqlite_row": "SQLite row",
      "compact": "compact",
      "search": "search",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "sessions_and_durable_threads": "Sesiones e hilos duraderos",
      "step_the_diagram": "recorre el diagrama",
      "session_key": "clave de sesión",
      "sqlite_row": "fila SQLite",
      "compact": "compacta",
      "search": "busca",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "key" as const, label: t.session_key, tone: "var(--teal)" },
    { value: "row" as const, label: t.sqlite_row, tone: "var(--teal)" },
    { value: "transcript" as const, label: "transcript", tone: "var(--amber)" },
    { value: "compact" as const, label: t.compact, tone: "var(--violet)" },
    { value: "search" as const, label: t.search, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("key");

  return (
    <Figure
      label={t.sessions_and_durable_threads}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="sessions diagram steps"
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
        color={active === "key" ? P.teal : P.lineStrong}
        fill={active === "key" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.session_key}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "row" ? P.amber : P.lineStrong}
        fill={active === "row" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.sqlite_row}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "transcript" ? P.violet : P.lineStrong}
        fill={active === "transcript" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        transcript
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "compact" ? P.teal : P.lineStrong}
        fill={active === "compact" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.compact}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "search" ? P.amber : P.lineStrong}
        fill={active === "search" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.search}</Tag>
    </group>
  );
}

/* ======================================================================
 * Versión española: claves de enrutado → filas → transcript.
 *
 * Cada mensaje entrante lleva una superficie. El gateway calcula su
 * clave y la clave elige una fila de SQLite: un hilo. `dmScope` decide
 * si los DM de varios humanos comparten la fila `main` o tienen la suya.
 * Todo lo que se cuenta (hilos, mensajes por hilo, remitentes mezclados)
 * sale de la tabla de abajo.
 * ==================================================================== */

type Scope = "main" | "isolated";
type Surface = "dm" | "group" | "cron" | "webhook" | "browser";
type Source = { id: string; surface: Surface; label: string; color: string; messages: number; sender: string };
type Thread = { key: string; label: string; surface: Surface; color: string; sources: Source[] };

const HUMANS = [
  { name: "Ana", color: P.teal },
  { name: "Bruno", color: P.amber },
  { name: "Carla", color: P.violet },
  { name: "David", color: P.rose },
  { name: "Elena", color: "#2E6E9E" },
  { name: "Fran", color: "#6B7F2A" },
];
const SURFACE_COLOR: Record<Exclude<Surface, "dm">, string> = {
  group: "#4F5B66",
  cron: P.violetDeep,
  webhook: P.amberDeep,
  browser: "#8B939C",
};
const ROW = 0.44;

function sourcesFor(humans: number): Source[] {
  return [
    ...HUMANS.slice(0, humans).map((h, k) => ({ id: `dm-${k}`, surface: "dm" as const, label: `DM · ${h.name}`, color: h.color, messages: 3, sender: h.name })),
    { id: "group", surface: "group", label: "Grupo", color: SURFACE_COLOR.group, messages: 4, sender: "grupo" },
    { id: "cron", surface: "cron", label: "Cron", color: SURFACE_COLOR.cron, messages: 1, sender: "cron" },
    { id: "webhook", surface: "webhook", label: "Webhook", color: SURFACE_COLOR.webhook, messages: 2, sender: "webhook" },
    { id: "browser", surface: "browser", label: "Navegador", color: SURFACE_COLOR.browser, messages: 2, sender: "navegador" },
  ];
}

/** The routing function the lesson describes: one key per surface, dmScope for DMs. */
function keyFor(source: Source, scope: Scope) {
  switch (source.surface) {
    case "dm":
      return scope === "main" ? "agent:main:main" : `agent:main:telegram:dm:${source.sender.toLowerCase()}`;
    case "group":
      return "agent:main:telegram:group:g42";
    case "cron":
      return "cron:informe-diario";
    case "webhook":
      return "webhook:wh_7f3";
    case "browser":
      return "browser:efimero-01";
  }
}

function threadsFor(sources: Source[], scope: Scope): Thread[] {
  const map = new Map<string, Thread>();
  for (const src of sources) {
    const key = keyFor(src, scope);
    const found = map.get(key);
    if (found) found.sources.push(src);
    else
      map.set(key, {
        key,
        surface: src.surface,
        color: src.surface === "dm" && scope === "main" ? P.inkSoft : src.color,
        label: src.surface === "dm" ? (scope === "main" ? "Hilo main" : `Hilo ${src.sender}`) : `Hilo ${src.label.toLowerCase()}`,
        sources: [src],
      });
  }
  return [...map.values()];
}

function SpanishVisual() {
  const [scope, setScope] = useState<Scope>("main");
  const [humans, setHumans] = useState(3);
  const [traced, setTraced] = useState("dm-0");
  const sources = useMemo(() => sourcesFor(humans), [humans]);
  const threads = useMemo(() => threadsFor(sources, scope), [sources, scope]);
  const tracedSource = sources.find((s) => s.id === traced) ?? sources[0];
  const tracedKey = keyFor(tracedSource, scope);
  const tracedThread = threads.find((t) => t.key === tracedKey)!;
  const senders = tracedThread.sources.filter((s) => s.surface === "dm").length;
  const mixed = scope === "main" && senders > 1;
  const messages = tracedThread.sources.reduce((a, s) => a + s.messages, 0);

  const traceOptions = [
    { value: "dm-0", label: "DM de Ana", tone: P.teal },
    ...(humans > 1 ? [{ value: "dm-1", label: "DM de Bruno", tone: P.amber }] : []),
    { value: "group", label: "Grupo", tone: SURFACE_COLOR.group },
    { value: "cron", label: "Cron", tone: SURFACE_COLOR.cron },
    { value: "webhook", label: "Webhook", tone: SURFACE_COLOR.webhook },
  ];

  const surfaceNote: Record<Surface, string> = {
    dm: mixed
      ? `Con dmScope=main los ${senders} humanos escriben en la misma fila. El transcript mezcla ${messages} mensajes de ${senders} personas: el contexto de una se filtra a la siguiente.`
      : scope === "main"
        ? "Con un solo humano, main no mezcla a nadie todavía. El riesgo aparece en cuanto un segundo usuario escribe por DM."
        : `Con dmScope aislado cada humano tiene su propia fila. ${humans} humanos por DM son ${humans} hilos; el de ${tracedSource.sender} solo contiene sus ${messages} mensajes.`,
    group: "El grupo tiene su propia clave, distinta de cualquier DM. DM y grupo nunca comparten hilo: es una cuestión de privacidad.",
    cron: "El cron recibe un hilo propio con su clave de job. Empieza vacío y no escribe en el chat vivo: si su clave colisionara con la del chat, cada ejecución ensuciaría la conversación.",
    webhook: "Un hilo por webhook_id, no por dirección IP. Dos fuentes de webhooks son dos hilos aunque lleguen desde la misma máquina.",
    browser: "La herramienta de navegador abre un hilo efímero por sesión, separado del chat principal.",
  };

  return (
    <Figure
      label="Una clave por superficie, una fila por hilo"
      hint={`dmScope=${scope === "main" ? "main" : "isolated"} · ${threads.length} hilos en SQLite`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Humanos por DM" },
        { color: SURFACE_COLOR.group, label: "Grupo" },
        { color: SURFACE_COLOR.cron, label: "Cron" },
        { color: SURFACE_COLOR.webhook, label: "Webhook" },
        { color: P.rose, label: "Contexto mezclado" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="dmScope" value={scope} onChange={setScope} options={[{ value: "main", label: "dmScope main", tone: P.inkSoft }, { value: "isolated", label: "dmScope aislado", tone: P.teal }]} />
          <Knob label="Humanos en DM" value={humans} min={1} max={6} onChange={(v) => { setHumans(v); if (v < 2 && traced === "dm-1") setTraced("dm-0"); }} />
          <Switcher ariaLabel="Mensaje que se sigue" value={traced} onChange={setTraced} options={traceOptions} />
        </>
      }
      note={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
            {[
              ["Hilos en SQLite", String(threads.length)],
              ["Mensajes en esta fila", String(messages)],
              ["Personas en esta fila", String(Math.max(senders, tracedSource.surface === "dm" ? 1 : 0))],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className={`mt-1 block font-display text-2xl ${label.startsWith("Personas") && mixed ? "text-rose" : "text-ink"}`}>{value}</strong>
              </div>
            ))}
          </div>
          <p className="rounded border border-line bg-paper p-3 font-mono text-xs">{tracedSource.label} → clave <strong>{tracedKey}</strong> → fila «{tracedThread.label}»</p>
          <p>{surfaceNote[tracedSource.surface]}</p>
          <p className="text-xs text-muted">
            Una sesión es el proceso vivo; el hilo es la fila durable que sobrevive a la sesión. Claves ilustrativas con el formato de Hermes (agent:main:plataforma:tipo:id); cada humano envía 3 mensajes de ejemplo. Compactar y buscar se ven en la última figura de la lección.
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [4.5, 4.2, 11], fov: 34 }} fit={1.06}>
        <RoutingBench sources={sources} threads={threads} scope={scope} traced={tracedSource} tracedKey={tracedKey} mixed={mixed} />
      </Stage>
    </Figure>
  );
}

function RoutingBench({ sources, threads, scope, traced, tracedKey, mixed }: { sources: Source[]; threads: Thread[]; scope: Scope; traced: Source; tracedKey: string; mixed: boolean }) {
  const srcY = (k: number) => (sources.length - 1 - k) * ROW + 0.35;
  const cabinetRows = Math.max(threads.length, 5);
  const drawerY = (k: number) => (cabinetRows - 1 - k) * ROW * 1.05 + 0.35;
  const cabH = cabinetRows * ROW * 1.05 + 0.3;
  const CAB_X = 2.6;
  const RES_X = -0.7;
  const topY = Math.max(srcY(0), drawerY(0));
  return (
    <group position={[0, 0, 0]}>
      <ShadowBlob position={[0, -0.02, 0.3]} scale={11} opacity={0.08} />
      {/* Plinth under the whole bench. */}
      <RoundedBox args={[9.8, 0.22, 3]} position={[-0.3, -0.12, 0.2]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#40362D" roughness={0.6} clearcoat={0.3} />
      </RoundedBox>
      <RoundedBox args={[9.5, 0.06, 2.7]} position={[-0.3, 0.02, 0.2]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#6B513A" roughness={0.55} />
      </RoundedBox>

      {/* Incoming messages: one chip per source, people as pucks. */}
      <group position={[-4, 0, 0]}>
        <RoundedBox args={[0.12, topY + 0.4, 0.8]} position={[-0.62, (topY + 0.4) / 2, 0]} radius={0.04} smoothness={2} castShadow>
          <meshStandardMaterial color="#B68442" metalness={0.65} roughness={0.3} />
        </RoundedBox>
        {sources.map((src, k) => {
          const on = src.id === traced.id;
          return (
            <group key={src.id} position={[0, srcY(k), 0]}>
              <RoundedBox args={[1.05, 0.28, 0.62]} radius={0.07} smoothness={3} castShadow receiveShadow>
                <meshPhysicalMaterial color={mixHex(P.paper, src.color, on ? 0.55 : 0.22)} roughness={0.45} clearcoat={0.5} />
              </RoundedBox>
              <mesh position={[-0.33, 0.17, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.07, 20]} />
                <meshStandardMaterial color={src.color} roughness={0.4} />
              </mesh>
              <Tag position={[-0.15, 0.02, 0.36]} tone={on ? "ink" : "muted"} size="xs">{src.label}</Tag>
            </group>
          );
        })}
      </group>

      {/* The resolver: a brass frame that stamps the key. */}
      <group position={[RES_X, 0, 0]}>
        {[-0.42, 0.42].map((z) => (
          <mesh key={z} position={[0, (topY + 0.5) / 2, z]} castShadow>
            <boxGeometry args={[0.12, topY + 0.5, 0.1]} />
            <meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.28} />
          </mesh>
        ))}
        <mesh position={[0, topY + 0.55, 0]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.98]} />
          <meshStandardMaterial color="#8E6632" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, (topY + 0.5) / 2, 0]}>
          <boxGeometry args={[0.03, topY + 0.3, 0.74]} />
          <meshPhysicalMaterial color={P.tealWash} transparent opacity={0.35} roughness={0.1} transmission={0.2} depthWrite={false} />
        </mesh>
        <Tag position={[0, topY + 0.9, 0]} tone="ink" size="xs" center>clave → fila</Tag>
      </group>

      {/* Routes: each source to the drawer its key selects. */}
      {sources.map((src, k) => {
        const key = keyFor(src, scope);
        const d = threads.findIndex((t) => t.key === key);
        const on = key === tracedKey;
        const pts: V3[] = [[-3.45, srcY(k), 0.05], [RES_X, (srcY(k) + drawerY(d)) / 2, 0.05], [CAB_X - 1.05, drawerY(d), 0.05]];
        const color = on && mixed ? P.rose : src.color;
        return on ? (
          <Flow key={src.id} points={pts} color={color} count={3} size={0.045} speed={0.32} lineOpacity={0.55} width={1.6} offset={k * 0.17} />
        ) : (
          <Wire key={src.id} points={pts} color={src.color} opacity={0.28} width={1} />
        );
      })}

      {/* SQLite cabinet: one drawer per thread. */}
      <group position={[CAB_X, 0, 0]}>
        <RoundedBox args={[2.1, cabH, 1.7]} position={[0, cabH / 2 + 0.05, -0.1]} radius={0.08} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial color="#2C3A38" roughness={0.42} metalness={0.25} clearcoat={0.35} />
        </RoundedBox>
        {Array.from({ length: cabinetRows }, (_, k) => {
          const thread = threads[k];
          return <Drawer key={k} y={drawerY(k)} thread={thread} open={thread?.key === tracedKey} mixed={mixed && thread?.key === tracedKey} />;
        })}
        <Tag position={[0, cabH + 0.35, -0.1]} tone="teal" center>SQLite · WAL</Tag>
        {/* FTS5 index module bolted to the side. */}
        <RoundedBox args={[0.5, 0.9, 1.2]} position={[1.32, 0.55, -0.1]} radius={0.05} smoothness={2} castShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.35)} roughness={0.4} clearcoat={0.4} />
        </RoundedBox>
        {Array.from({ length: 5 }, (_, k) => (
          <mesh key={k} position={[1.58, 0.25 + k * 0.15, -0.1]}>
            <boxGeometry args={[0.02, 0.06, 0.9]} />
            <meshStandardMaterial color={P.violetDeep} roughness={0.5} />
          </mesh>
        ))}
        <Tag position={[1.35, 1.25, -0.1]} tone="violet" size="xs" center>FTS5</Tag>
      </group>
    </group>
  );
}

function Drawer({ y, thread, open, mixed }: { y: number; thread?: Thread; open: boolean; mixed: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const target = open ? 1.05 : 0.8;
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.z = still ? target : MathUtils.damp(g.position.z, target, 5, dt);
  });
  const cards = thread ? thread.sources.flatMap((s) => Array.from({ length: s.messages }, (_, k) => ({ color: s.color, key: `${s.id}-${k}` }))) : [];
  const front = thread ? mixHex(P.paper, thread.color, 0.18) : "#3A4745";
  return (
    <group ref={ref} position={[0, y, 0.8]}>
      <RoundedBox args={[1.86, ROW * 0.86, 0.14]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixed ? mixHex(P.roseWash, P.rose, 0.25) : front} roughness={0.45} clearcoat={0.4} />
      </RoundedBox>
      {thread ? (
        <>
          <mesh position={[-0.62, 0, 0.075]}>
            <boxGeometry args={[0.36, 0.13, 0.01]} />
            <meshStandardMaterial color={thread.color} roughness={0.5} />
          </mesh>
          <mesh position={[0.35, 0, 0.09]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.42, 12]} />
            <meshStandardMaterial color="#B68442" metalness={0.75} roughness={0.25} />
          </mesh>
        </>
      ) : null}
      {open && thread ? (
        <group position={[0, 0.02, -0.55]}>
          <mesh position={[0, -0.03, 0]} receiveShadow>
            <boxGeometry args={[1.7, 0.03, 0.95]} />
            <meshStandardMaterial color="#D8D2C4" roughness={0.6} />
          </mesh>
          {cards.slice(0, 20).map((c, k) => (
            <mesh key={c.key} position={[-0.7 + (k % 10) * 0.155, 0.08, -0.22 + Math.floor(k / 10) * 0.4]} rotation={[-0.35, 0, 0]} castShadow>
              <boxGeometry args={[0.12, 0.2, 0.02]} />
              <meshStandardMaterial color={c.color} roughness={0.5} />
            </mesh>
          ))}
          <Tag position={[1.05, 0.12, 0.3]} tone={mixed ? "rose" : "ink"} size="xs">{mixed ? "Contexto mezclado" : thread.label}</Tag>
        </group>
      ) : null}
    </group>
  );
}

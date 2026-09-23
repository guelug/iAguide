"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, ShadowBlob, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "a" | "b" | "c" | "d" | "e";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "sqlite_path": "sqlite path",
      "incognito": "incognito",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "sqlite_path": "ruta sqlite",
      "incognito": "incógnito",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: t.sqlite_path, tone: "var(--teal)" },
    { value: "b" as const, label: "dmScope", tone: "var(--amber)" },
    { value: "c" as const, label: "groupScope", tone: "var(--violet)" },
    { value: "d" as const, label: "main", tone: "var(--teal)" },
    { value: "e" as const, label: t.incognito, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: sqlite sessions and scope"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-sessions diagram steps"
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
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.sqlite_path}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        dmScope
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        groupScope
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        main
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.incognito}</Tag>
    </group>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: el gateway enruta cada mensaje a una fila de sesión en la
 * SQLite por agente. Las claves se calculan con session.dmScope y
 * session.groupScope sobre siete mensajes de ejemplo; incógnito vive en
 * memoria de proceso, fuera del armario SQLite. Formato de clave
 * ilustrativo: lo que importa es qué mensajes comparten fila.
 */

type DmScope = "main" | "per-peer" | "per-channel-peer" | "per-account-channel-peer";
type GroupScope = "per-group" | "main";
type Kind = "dm" | "group" | "cron" | "hook";

type Msg = { id: string; label: string; kind: Kind; peer?: string; channel: string; account?: string; target?: string };

const MESSAGES: Msg[] = [
  { id: "a1", label: "Alice · Telegram", kind: "dm", peer: "alice", channel: "telegram", account: "bot1" },
  { id: "a2", label: "Alice · Slack", kind: "dm", peer: "alice", channel: "slack", account: "bot1" },
  { id: "b1", label: "Bob · Telegram", kind: "dm", peer: "bob", channel: "telegram", account: "bot1" },
  { id: "b2", label: "Bob · 2.º bot", kind: "dm", peer: "bob", channel: "telegram", account: "bot2" },
  { id: "g1", label: "#equipo (Slack)", kind: "group", channel: "slack", target: "equipo" },
  { id: "c1", label: "cron diario", kind: "cron", channel: "cron", target: "informe" },
  { id: "h1", label: "webhook CI", kind: "hook", channel: "hook", target: "ci" },
];

function sessionKey(m: Msg, dm: DmScope, group: GroupScope) {
  if (m.kind === "dm") {
    if (dm === "main") return "main";
    if (dm === "per-peer") return `dm:${m.peer}`;
    if (dm === "per-channel-peer") return `dm:${m.channel}:${m.peer}`;
    return `dm:${m.account}:${m.channel}:${m.peer}`;
  }
  if (m.kind === "group") return group === "main" ? "main" : `group:${m.channel}:${m.target}`;
  if (m.kind === "cron") return `cron:${m.target}:run-7`;
  return `hook:${m.target}`;
}

const KIND_TONE: Record<Kind, string> = { dm: P.teal, group: P.violet, cron: P.amber, hook: P.inkSoft };

const SRC_X = -3.9;
const GW_X = -0.9;
const CAB_X = 2.5;
const srcZ = (i: number, n: number) => (i - (n - 1) / 2) * 0.55;
const drawerY = (d: number) => 0.55 + d * 0.38;

function owners(keys: string[]) {
  const map = new Map<string, Set<string>>();
  keys.forEach((k, i) => {
    const m = MESSAGES[i];
    const who = m.peer ?? m.target ?? m.id;
    if (!map.has(k)) map.set(k, new Set());
    map.get(k)!.add(who);
  });
  return map;
}

function Router({ dm, group, incognito }: { dm: DmScope; group: GroupScope; incognito: boolean }) {
  const keys = MESSAGES.map((m) => sessionKey(m, dm, group));
  const unique = Array.from(new Set(keys));
  const own = owners(keys);
  const n = MESSAGES.length;
  const cabH = drawerY(Math.max(unique.length, 4)) + 0.1;
  return (
    <group>
      <ShadowBlob position={[-0.6, 0.004, 0]} scale={9.5} opacity={0.1} />
      <RoundedBox args={[9.4, 0.24, 4.6]} position={[-0.6, 0.12, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      {MESSAGES.map((m, i) => (
        <group key={m.id} position={[SRC_X, 0.3, srcZ(i, n)]}>
          <RoundedBox args={[0.5, 0.16, 0.36]} position={[0, 0.08, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
            <meshPhysicalMaterial color={mixHex(P.paper, KIND_TONE[m.kind], 0.75)} roughness={0.4} clearcoat={0.4} />
          </RoundedBox>
          <Tag position={[-1.05, 0.1, 0]} tone={m.kind === "dm" ? "teal" : m.kind === "group" ? "violet" : m.kind === "cron" ? "amber" : "muted"} size="xs" center>
            {m.label}
          </Tag>
        </group>
      ))}

      {/* gateway: dueño del estado de sesión */}
      <RoundedBox args={[1.1, 0.7, 1.6]} position={[GW_X, 0.6, 0]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#2C3332" roughness={0.4} metalness={0.2} clearcoat={0.4} />
      </RoundedBox>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[GW_X - 0.56, 0.6, srcZ(i, n) * 0.4]}>
          <boxGeometry args={[0.02, 0.1, 0.12]} />
          <meshStandardMaterial color="#B7833E" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <Tag position={[GW_X, 1.2, 0]} tone="ink" size="xs" center>
        gateway
      </Tag>

      {/* armario SQLite por agente: una fila por clave de sesión */}
      <RoundedBox args={[1.5, cabH, 1.4]} position={[CAB_X, 0.24 + cabH / 2, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#8C9895" roughness={0.35} metalness={0.45} clearcoat={0.3} />
      </RoundedBox>
      {unique.map((k, d) => {
        const shared = (own.get(k)?.size ?? 0) > 1;
        return (
          <group key={k} position={[CAB_X, drawerY(d), 0.72]}>
            <RoundedBox args={[1.3, 0.3, 0.12]} radius={0.03} smoothness={2} castShadow>
              <meshPhysicalMaterial color={shared ? mixHex(P.paper, P.rose, 0.7) : "#EFEAE0"} roughness={0.4} clearcoat={0.4} />
            </RoundedBox>
            <mesh position={[0, 0, 0.07]}>
              <boxGeometry args={[0.3, 0.05, 0.03]} />
              <meshStandardMaterial color="#4E5A59" metalness={0.6} roughness={0.3} />
            </mesh>
            <Tag position={[0.8, 0, 0.05]} tone={shared ? "rose" : "ink"} size="xs">
              {k}
            </Tag>
          </group>
        );
      })}
      <Tag position={[CAB_X, 0.34 + cabH, 0]} tone="muted" size="xs" center>
        openclaw-agent.sqlite
      </Tag>

      {MESSAGES.map((m, i) => {
        const d = unique.indexOf(keys[i]);
        const z = srcZ(i, n);
        return (
          <Flow
            key={m.id}
            points={[[SRC_X + 0.3, 0.42, z], [GW_X - 0.9, 0.62, z * 0.6], [GW_X + 0.6, 0.62, z * 0.2], [CAB_X - 0.8, drawerY(d), 0.72]]}
            color={KIND_TONE[m.kind]}
            count={1}
            size={0.045}
            speed={0.28}
            offset={i * 0.14}
            lineOpacity={0.3}
          />
        );
      })}

      {incognito ? (
        <group>
          <group position={[GW_X, 2.05, -0.2]}>
            <RoundedBox args={[1.2, 0.3, 0.9]} radius={0.05} smoothness={2}>
              <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.3)} transparent opacity={0.45} roughness={0.15} clearcoat={1} depthWrite={false} />
            </RoundedBox>
            <Tag position={[0, 0.34, 0]} tone="violet" size="xs" center>
              incógnito · RAM
            </Tag>
          </group>
          <group position={[SRC_X, 0.3, -2.05]}>
            <RoundedBox args={[0.5, 0.16, 0.3]} position={[0, 0.08, 0]} radius={0.04} smoothness={2} castShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.6)} roughness={0.4} clearcoat={0.4} />
            </RoundedBox>
          </group>
          <Flow points={[[SRC_X + 0.3, 0.42, -2.05], [GW_X - 0.9, 1.5, -1.2], [GW_X, 1.9, -0.2]]} color={P.violet} count={2} size={0.045} speed={0.35} lineOpacity={0.35} />
        </group>
      ) : null}
    </group>
  );
}

function SpanishVisual() {
  const [dm, setDm] = useState<DmScope>("main");
  const [group, setGroup] = useState<GroupScope>("per-group");
  const [incognito, setIncognito] = useState(false);
  const keys = MESSAGES.map((m) => sessionKey(m, dm, group));
  const unique = new Set(keys);
  const own = owners(keys);
  const mainOwners = own.get("main");
  const leak = (mainOwners?.size ?? 0) > 1;
  const groupInMain = group === "main";
  const dmPeers = mainOwners ? Array.from(mainOwners) : [];

  const scopeText: Record<DmScope, string> = {
    main: "dmScope main (default): todos los DMs comparten la sesión main. Bien para un solo usuario; con dos personas, Bob ve el contexto privado de Alice.",
    "per-peer": "per-peer: una sesión por remitente a través de canales. Alice por Telegram y por Slack comparten fila; Bob tiene la suya.",
    "per-channel-peer": "per-channel-peer (recomendado): canal más remitente. Alice en Telegram y en Slack son dos filas; usa identityLinks si quieres unirlas.",
    "per-account-channel-peer": "per-account-channel-peer: además separa por cuenta del bot. Bob por el segundo bot abre otra fila.",
  };

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
        {[
          ["Mensajes", String(MESSAGES.length)],
          ["Filas de sesión", String(unique.size)],
          ["Contexto compartido", leak ? `main: ${dmPeers.join(", ")}` : "ninguno"],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className={`mt-1 block font-display text-xl ${leak && label === "Contexto compartido" ? "text-rose" : "text-ink"}`}>{value}</strong>
          </div>
        ))}
      </div>
      <p>{scopeText[dm]}</p>
      <p>
        {groupInMain
          ? "groupScope main: el room #equipo se enruta a la sesión main del agente. Solo cambia la clave: las respuestas siguen yendo al room de origen."
          : "groupScope per-group (default): cada grupo o room guarda su propia sesión, separada de los DMs."}{" "}
        El cron recibe una sesión nueva por run y el webhook, una aislada por hook.{" "}
        {incognito
          ? "Incógnito (solo desde New thread del Control UI) guarda sesión, transcripción y compaction en memoria de proceso: no entra en el armario SQLite y desaparece al reiniciar el gateway."
          : ""}
      </p>
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        ~/.openclaw/agents/&lt;agentId&gt;/agent/openclaw-agent.sqlite · session.dmScope = &quot;{dm}&quot; · session.groupScope = &quot;{group}&quot;
      </p>
      <p className="text-xs text-muted">
        Formato de las claves ilustrativo; la agrupación (qué mensajes comparten fila) sigue las tablas de la documentación de OpenClaw.
      </p>
    </div>
  );

  return (
    <Figure
      label="El gateway enruta cada mensaje a una fila SQLite"
      hint="dmScope · groupScope · main · incógnito"
      height="h-[540px] md:h-[620px]"
      legend={[
        { color: P.teal, label: "mensaje directo" },
        { color: P.violet, label: "grupo / incógnito" },
        { color: P.amber, label: "cron" },
        { color: P.rose, label: "fila compartida" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="session.dmScope"
            value={dm}
            onChange={setDm}
            options={[
              { value: "main", label: "main", tone: P.rose },
              { value: "per-peer", label: "per-peer", tone: P.teal },
              { value: "per-channel-peer", label: "per-channel-peer", tone: P.teal },
              { value: "per-account-channel-peer", label: "per-account…", tone: P.teal },
            ]}
          />
          <Switcher
            ariaLabel="session.groupScope"
            value={group}
            onChange={setGroup}
            options={[
              { value: "per-group", label: "grupo aparte", tone: P.violet },
              { value: "main", label: "grupo → main", tone: P.rose },
            ]}
          />
          <button type="button" className="chip" aria-pressed={incognito} onClick={() => setIncognito((v) => !v)}>
            {incognito ? "Quitar incógnito" : "Hilo incógnito"}
          </button>
          <Readout items={[{ label: "filas", value: String(unique.size), tone: P.ink }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-2.8, 6, 10], fov: 34 }} fit={1.06}>
        <Router dm={dm} group={group} incognito={incognito} />
      </Stage>
    </Figure>
  );
}

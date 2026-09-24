"use client";

import { useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
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
      "create": "create",
      "isolated": "isolated",
      "announce": "announce",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "create": "crea",
      "isolated": "aislado",
      "announce": "anuncia",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: t.create, tone: "var(--teal)" },
    { value: "b" as const, label: t.isolated, tone: "var(--teal)" },
    { value: "c" as const, label: t.announce, tone: "var(--amber)" },
    { value: "d" as const, label: "webhook", tone: "var(--violet)" },
    { value: "e" as const, label: "admin", tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: Gateway automations"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-cron diagram steps"
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
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.create}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.isolated}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.announce}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        webhook
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        admin
      </Tag>
    </group>
  );
}

/* ======================================================================
 * Versión española: el scheduler vive dentro del Gateway.
 *
 * Un job entra por `openclaw automations create` (los payloads command
 * exigen operator.admin), se guarda en SQLite y el reloj del Gateway lo
 * dispara. Cada ejecución deja un registro de background task. main
 * acumula eventos en la sesión principal; isolated abre una sesión
 * nueva cron:<jobId> por ejecución. La entrega es aparte del horario.
 * ==================================================================== */

type SessionStyle = "main" | "isolated";
type Delivery = "announce" | "webhook" | "none";
type Payload = "message" | "commandAgent" | "commandAdmin";

const JOB = "informe-diario";

function schedulerModel(on: boolean, style: SessionStyle, delivery: Delivery, payload: Payload, days: number) {
  const created = payload !== "commandAgent";
  const runs = created && on ? days : 0;
  return {
    created,
    runs,
    tasks: runs,
    sessions: style === "main" ? (runs ? 1 : 0) : runs,
    deliveries: delivery === "none" ? 0 : runs,
  };
}

function SpanishVisual() {
  const [on, setOn] = useState(true);
  const [style, setStyle] = useState<SessionStyle>("isolated");
  const [delivery, setDelivery] = useState<Delivery>("announce");
  const [payload, setPayload] = useState<Payload>("message");
  const [days, setDays] = useState(3);
  const m = schedulerModel(on, style, delivery, payload, days);

  const parts: string[] = [];
  if (!m.created) parts.push("Un agente intenta crear un job con payload command. Se rechaza al crear: los payloads command son una superficie de operator-admin del Gateway, no una llamada tools.exec, y la política exec del agente no los gobierna. Para tareas escritas por el agente, --message.");
  else if (!on) parts.push(`El Gateway está apagado: el job sigue guardado en SQLite, pero nada dispara. Las automations corren dentro del proceso Gateway, no dentro del modelo. Al volver a arrancar, el horario sigue ahí.`);
  else {
    parts.push(`En ${days} ${days === 1 ? "día" : "días"} el reloj dispara ${m.runs} ${m.runs === 1 ? "vez" : "veces"} y cada ejecución deja un registro de background task (${m.tasks}).`);
    parts.push(style === "main" ? "Con --session main los eventos llegan a la sesión principal: una sola sesión acumula los recordatorios." : `Con --session isolated cada ejecución abre una sesión nueva con clave cron:${JOB} y transcript propio: ${m.sessions} sesiones que no heredan contexto de las anteriores.`);
    parts.push(delivery === "announce" ? "announce entrega el texto final al canal de chat si el agente no lo envió." : delivery === "webhook" ? "webhook hace POST del evento terminado al receptor, con webhookToken como Authorization: Bearer y el guard SSRF estricto." : "none: el runner no entrega nada; el agente aún puede enviar con la tool message si hay ruta.");
  }

  return (
    <Figure
      label="El scheduler vive en el Gateway, no en el modelo"
      hint={`openclaw automations · job ${JOB}`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Ejecución" },
        { color: P.violet, label: "Sesión" },
        { color: P.amber, label: "Entrega" },
        { color: P.rose, label: "Rechazo o parada" },
      ]}
      controls={
        <>
          <button type="button" className="chip" aria-pressed={on} onClick={() => setOn(!on)}>{on ? "Gateway: encendido" : "Gateway: apagado"}</button>
          <Switcher ariaLabel="Payload" value={payload} onChange={setPayload} options={[{ value: "message", label: "--message", tone: P.teal }, { value: "commandAgent", label: "command · agente", tone: P.rose }, { value: "commandAdmin", label: "command · admin", tone: P.inkSoft }]} />
          <Switcher ariaLabel="Estilo de sesión" value={style} onChange={setStyle} options={[{ value: "main", label: "main", tone: P.violet }, { value: "isolated", label: "isolated", tone: P.violet }]} />
          <Switcher ariaLabel="Entrega" value={delivery} onChange={setDelivery} options={[{ value: "announce", label: "announce", tone: P.amber }, { value: "webhook", label: "webhook", tone: P.amber }, { value: "none", label: "none", tone: P.inkSoft }]} />
          <Knob label="Días" value={days} min={1} max={5} onChange={setDays} />
        </>
      }
      note={
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3 border-b border-line pb-3">
            {[
              ["Job en SQLite", m.created ? "sí" : "no"],
              ["Ejecuciones", String(m.runs)],
              ["Sesiones", String(m.sessions)],
              ["Entregas", String(m.deliveries)],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className={`mt-1 block font-display text-2xl ${value === "no" || (value === "0" && label === "Ejecuciones") ? "text-rose" : "text-ink"}`}>{value}</strong>
              </div>
            ))}
          </div>
          <p>{parts.join(" ")}</p>
          <p className="text-xs text-muted">Job de ejemplo con una ejecución diaria. openclaw cron es alias de openclaw automations. Crear, editar o lanzar a mano jobs exige operator.admin. Fuente: OpenClaw, Automations.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.5, 8, 9.5], fov: 34 }} fit={1.04}>
        <GatewayBench on={on} style={style} delivery={delivery} created={m.created} runs={m.runs} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
function Kit({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

function ClockHand({ running }: { running: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (ref.current && running && !still) ref.current.rotation.y -= dt * 1.2;
  });
  return (
    <group ref={ref} position={[0, 0.3, 0]}>
      <mesh position={[0, 0, -0.22]} castShadow>
        <boxGeometry args={[0.05, 0.04, 0.44]} />
        <meshStandardMaterial color={running ? P.teal : P.faint} />
      </mesh>
    </group>
  );
}

const GW_X = -1.0;
const SESS_X = 2.1;
const DELIV_X = 4.35;

function GatewayBench({ on, style, delivery, created, runs }: { on: boolean; style: SessionStyle; delivery: Delivery; created: boolean; runs: number }) {
  const running = on && created;
  return (
    <group>
      <Kit p={[0, -0.13, 0]} s={[10.6, 0.22, 4.2]} color="#40362D" rough={0.6} coat={0.3} />
      <Kit p={[0, 0.0, 0]} s={[10.3, 0.05, 3.9]} color="#6B513A" rough={0.55} coat={0} />

      {/* automations create: the admin check at the door. */}
      <group position={[-4.3, 0, 0]}>
        <Kit p={[0, 0.1, 0]} s={[1.0, 0.1, 1.2]} color="#2E3438" metal={0.3} />
        <Kit p={[created ? 0.25 : -0.1, 0.25, 0]} s={[0.5, 0.06, 0.7]} color={created ? "#F2EEE4" : mixHex("#F2EEE4", P.rose, 0.4)} rough={0.6} coat={0} />
        <mesh position={[0.45, 0.45, 0]} rotation={[created ? -1.1 : 0, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.07, 1.1]} />
          <meshStandardMaterial color={created ? P.teal : P.rose} />
        </mesh>
        <Tag position={[0, 0.9, 0]} tone={created ? "ink" : "rose"} size="xs" center>{created ? "create" : "falta admin"}</Tag>
      </group>
      {created ? <Flow points={[[-3.8, 0.35, 0], [GW_X - 1.9, 0.5, -0.4], [GW_X - 1.2, 0.6, -0.6]]} color={P.inkSoft} count={2} size={0.04} speed={0.3} lineOpacity={0.3} /> : null}

      {/* The Gateway process: SQLite store, clock, task ledger. */}
      <group position={[GW_X, 0, 0]}>
        <Kit p={[0, 0.12, 0]} s={[3.8, 0.16, 3.2]} color="#263532" metal={0.3} />
        {[-1.57, 1.57].map((z) => <Kit key={z} p={[0, 0.34, z]} s={[3.8, 0.3, 0.06]} color="#31423F" metal={0.3} />)}
        <mesh position={[1.7, 0.42, 1.6]}>
          <sphereGeometry args={[0.07, 14, 10]} />
          <meshStandardMaterial color={on ? P.teal : P.rose} emissive={on ? P.teal : P.rose} emissiveIntensity={0.4} />
        </mesh>
        <group position={[-1.1, 0, -0.6]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.7, 32]} />
            <meshPhysicalMaterial color={created ? mixHex(P.paper, P.teal, 0.3) : "#CFCAC0"} roughness={0.35} clearcoat={0.5} />
          </mesh>
          {[0.3, 0.55, 0.8].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.455, 0.02, 8, 36]} />
              <meshStandardMaterial color={P.tealDeep} />
            </mesh>
          ))}
          <Tag position={[0, 1.2, 0]} tone="teal" size="xs" center>SQLite</Tag>
        </group>
        <group position={[0.7, 0.2, -0.6]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.12, 40]} />
            <meshPhysicalMaterial color="#F2EEE4" roughness={0.4} clearcoat={0.5} />
          </mesh>
          {Array.from({ length: 12 }, (_, k) => (
            <mesh key={k} position={[Math.sin((k / 12) * Math.PI * 2) * 0.45, 0.07, Math.cos((k / 12) * Math.PI * 2) * 0.45]}>
              <boxGeometry args={[0.04, 0.02, 0.04]} />
              <meshStandardMaterial color={P.inkSoft} />
            </mesh>
          ))}
          <ClockHand running={running} />
          <Tag position={[0, 0.65, 0]} tone={running ? "teal" : "muted"} size="xs" center>{running ? "reloj" : "sin disparos"}</Tag>
        </group>
        <group position={[-0.2, 0, 0.8]}>
          {Array.from({ length: runs }, (_, k) => (
            <mesh key={k} position={[0, 0.25 + k * 0.06, 0]} castShadow>
              <boxGeometry args={[0.9, 0.04, 0.5]} />
              <meshStandardMaterial color={k % 2 ? "#E9E3D5" : "#F4F0E6"} roughness={0.6} />
            </mesh>
          ))}
          <Tag position={[0.95, 0.3, 0.2]} tone="muted" size="xs">{`tareas · ${runs}`}</Tag>
        </group>
        <Tag position={[0, 0.7, -1.7]} tone="ink" center>Gateway</Tag>
      </group>

      {/* Where runs land. */}
      {runs > 0 ? <Flow points={[[GW_X + 1.25, 0.5, -0.6], [SESS_X - 1.0, 0.8, -0.3], [SESS_X - 0.6, 0.45, 0]]} color={P.teal} count={3} size={0.05} speed={0.35} lineOpacity={0.4} /> : null}
      <group position={[SESS_X, 0, 0]}>
        {style === "main" ? (
          <group>
            <Kit p={[0, 0.15, 0]} s={[1.3, 0.14, 1.6]} color={mixHex(P.paper, P.violet, 0.3)} />
            {Array.from({ length: runs }, (_, k) => (
              <mesh key={k} position={[0, 0.27 + k * 0.06, 0]} castShadow>
                <boxGeometry args={[0.9, 0.04, 1.1]} />
                <meshStandardMaterial color={mixHex(P.paper, P.violet, 0.45 + (k % 2) * 0.15)} roughness={0.5} />
              </mesh>
            ))}
            <Tag position={[0, 0.3, 1.05]} tone="violet" size="xs" center>sesión main</Tag>
          </group>
        ) : (
          <group>
            {Array.from({ length: Math.max(runs, 1) }, (_, k) => (
              <group key={k} position={[0, 0, (k - (Math.max(runs, 1) - 1) / 2) * 0.62]}>
                <Kit p={[0, 0.15, 0]} s={[1.2, 0.12, 0.5]} color={k < runs ? mixHex(P.paper, P.violet, 0.3) : "#D9D3C6"} />
                {k < runs ? <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.8, 0.05, 0.3]} /><meshStandardMaterial color={P.violet} roughness={0.5} /></mesh> : null}
              </group>
            ))}
            <Tag position={[0, 0.3, Math.max(runs, 1) * 0.31 + 0.3]} tone="violet" size="xs" center>{`cron:${JOB} ×${runs}`}</Tag>
          </group>
        )}
      </group>

      {/* Delivery is separate from the schedule. */}
      {runs > 0 && delivery !== "none" ? <Flow points={[[SESS_X + 0.65, 0.4, 0], [DELIV_X - 0.8, 0.8, 0], [DELIV_X - 0.4, 0.5, 0]]} color={P.amber} count={2} size={0.05} speed={0.35} lineOpacity={0.4} /> : null}
      <group position={[DELIV_X, 0, 0]}>
        <Kit p={[0, 0.1, 0]} s={[1.1, 0.1, 1.4]} color="#2E3438" metal={0.3} />
        {delivery === "announce" ? (
          <group position={[0, 0.55, 0]}>
            <Kit p={[0, 0, 0]} s={[0.8, 0.5, 0.25]} color={P.amberWash} />
            <mesh position={[-0.2, -0.3, 0]} rotation={[0, 0, 0.5]}>
              <coneGeometry args={[0.1, 0.2, 3]} />
              <meshStandardMaterial color={P.amberWash} />
            </mesh>
          </group>
        ) : delivery === "webhook" ? (
          <group position={[0, 0.4, 0]}>
            <Kit p={[0, 0, 0]} s={[0.7, 0.45, 0.7]} color={mixHex(P.paper, P.amber, 0.4)} metal={0.2} />
            <mesh position={[0.2, 0.45, 0]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.5, 8]} /><meshStandardMaterial color={P.amberDeep} /></mesh>
          </group>
        ) : (
          <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.8, 0.02, 1.0]} /><meshBasicMaterial color="#5A6166" wireframe /></mesh>
        )}
        <Tag position={[0, 1.15, 0]} tone={delivery === "none" ? "muted" : "amber"} size="xs" center>{delivery === "announce" ? "canal de chat" : delivery === "webhook" ? "POST webhook" : "sin entrega"}</Tag>
      </group>
    </group>
  );
}

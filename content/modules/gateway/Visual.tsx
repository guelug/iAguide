"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useRef, type ReactNode } from "react";
import type { Group, Mesh } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Arrow, PointerTilt, ShadowBlob, useCycle, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

type Step = "adapter" | "event" | "auth" | "agent" | "deliver";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "the_gateway_process": "The gateway process",
      "step_the_diagram": "step the diagram",
      "adapter": "adapter",
      "event": "event",
      "agent_run": "agent run",
      "deliver": "deliver",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "the_gateway_process": "El proceso gateway",
      "step_the_diagram": "recorre el diagrama",
      "adapter": "adaptador",
      "event": "evento",
      "agent_run": "run del agente",
      "deliver": "entrega",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "adapter" as const, label: t.adapter, tone: "var(--teal)" },
    { value: "event" as const, label: t.event, tone: "var(--teal)" },
    { value: "auth" as const, label: "auth / pair", tone: "var(--amber)" },
    { value: "agent" as const, label: t.agent_run, tone: "var(--violet)" },
    { value: "deliver" as const, label: t.deliver, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("adapter");

  return (
    <Figure
      label={t.the_gateway_process}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="gateway diagram steps"
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
        color={active === "adapter" ? P.teal : P.lineStrong}
        fill={active === "adapter" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.adapter}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "event" ? P.amber : P.lineStrong}
        fill={active === "event" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.event}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "auth" ? P.violet : P.lineStrong}
        fill={active === "auth" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        auth / pair
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "agent" ? P.teal : P.lineStrong}
        fill={active === "agent" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.agent_run}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "deliver" ? P.amber : P.lineStrong}
        fill={active === "deliver" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.deliver}</Tag>
    </group>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * Banco del gateway. Un evento de plataforma entra por su adaptador, se
 * normaliza a la forma interna, cruza la puerta de auth (deny por defecto),
 * resuelve su fila de sesión en SQLite, ejecuta el bucle y sale por el
 * mismo adaptador como entrega saliente. La decisión de auth y la clave de
 * sesión se calculan abajo; nada es telemetría decorativa.
 */

type Platform = "telegram" | "discord" | "slack" | "whatsapp";
type AuthMode = "allowlist" | "pairing" | "open";
type Sender = "listed" | "unknown" | "code";

const GW = {
  wood: "#3B2D27",
  woodTop: "#5E4533",
  graphite: "#2A2F31",
  steel: "#8C9895",
  brass: "#B7833E",
  brassLight: "#E1BD7E",
  ceramic: "#EEE9DF",
};

const PLATFORMS: { id: Platform; label: string; color: string; chatId: string }[] = [
  { id: "telegram", label: "Telegram", color: P.teal, chatId: "12345" },
  { id: "discord", label: "Discord", color: P.violet, chatId: "88017" },
  { id: "slack", label: "Slack", color: P.amber, chatId: "C0420" },
  { id: "whatsapp", label: "WhatsApp", color: P.rose, chatId: "34600" },
];

const AUTH_LABEL: Record<AuthMode, string> = { allowlist: "Allowlist", pairing: "Pairing", open: "Abierto" };
const SENDER_LABEL: Record<Sender, string> = { listed: "En la lista", unknown: "Desconocido", code: "Con código" };

function decide(mode: AuthMode, sender: Sender) {
  if (mode === "open") return { pass: true, reason: "El modo abierto acepta a cualquiera. Solo vale en un sandbox de pruebas." };
  if (sender === "listed") return { pass: true, reason: "El chat_id ya está en la allowlist." };
  if (sender === "code" && mode === "pairing")
    return { pass: true, reason: "El primer mensaje trae el código one-shot: pasa y el chat_id queda en la allowlist." };
  if (sender === "code") return { pass: false, reason: "En modo allowlist estricta un código no abre la puerta: solo cuentan los chat_id listados." };
  return { pass: false, reason: "Deny por defecto: un chat_id desconocido no llega al agente." };
}

/* Estaciones del recorrido, de izquierda a derecha. */
const X = { adapter: -3.95, normal: -2.2, auth: -0.45, route: 1.3, agent: 3.1 };
const LANE_Y = -0.18;

function GwMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.32} />;
}

function GwBench() {
  return (
    <group>
      <ShadowBlob position={[0, -1.36, 0.2]} scale={10.5} opacity={0.12} />
      <RoundedBox position={[0, -1.14, 0]} args={[10.4, 0.4, 3.1]} radius={0.18} smoothness={4} castShadow receiveShadow>
        <GwMat color={GW.wood} clear={0.2} rough={0.62} />
      </RoundedBox>
      <RoundedBox position={[0, -0.9, 0]} args={[10.05, 0.1, 2.8]} radius={0.05} smoothness={3} receiveShadow>
        <GwMat color={GW.woodTop} clear={0.3} rough={0.5} />
      </RoundedBox>
      {/* carril de ida (fondo) y de vuelta (frente) */}
      {[-0.05, 1.05].map((z) => (
        <mesh key={z} position={[-0.3, -0.8, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 8.6, 14]} />
          <meshStandardMaterial color={GW.brass} roughness={0.28} metalness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function Pedestal({ x, w = 1.35, d = 1.5, children }: { x: number; w?: number; d?: number; children?: ReactNode }) {
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox position={[0, -0.78, 0]} args={[w, 0.16, d]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <GwMat color={GW.ceramic} rough={0.55} clear={0.25} />
      </RoundedBox>
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.12), -0.69, sz * (d / 2 - 0.12)]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
          <meshStandardMaterial color={GW.steel} metalness={0.8} roughness={0.3} />
        </mesh>
      )))}
      {children}
    </group>
  );
}

/* Cartucho de adaptador: uno por plataforma, apilados en un bastidor. */
function AdapterRack({ platform }: { platform: Platform }) {
  return (
    <Pedestal x={X.adapter} w={1.45} d={1.6}>
      <RoundedBox position={[-0.5, 0.05, -0.1]} args={[0.12, 1.55, 1.1]} radius={0.04} smoothness={2} castShadow>
        <GwMat color={GW.graphite} metal={0.3} />
      </RoundedBox>
      {PLATFORMS.map((p, i) => {
        const on = p.id === platform;
        const y = 0.6 - i * 0.38;
        return (
          <group key={p.id} position={[on ? 0.12 : -0.05, y, -0.1]}>
            <RoundedBox args={[0.8, 0.28, 0.95]} radius={0.05} smoothness={3} castShadow receiveShadow>
              <GwMat color={on ? mixHex(P.paper, p.color, 0.35) : mixHex(P.paper, p.color, 0.1)} />
            </RoundedBox>
            <mesh position={[0.41, 0, 0]}>
              <boxGeometry args={[0.02, 0.16, 0.7]} />
              <meshStandardMaterial color={p.color} roughness={0.4} emissive={p.color} emissiveIntensity={on ? 0.35 : 0} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[-0.1, 1.15, 0.2]} tone="ink" center>adaptadores</Tag>
      <Tag position={[0, -0.62, 0.95]} tone={toneOf(PLATFORMS.find((p) => p.id === platform)!.color)} size="xs" center>{PLATFORMS.find((p) => p.id === platform)!.label}</Tag>
    </Pedestal>
  );
}

function toneOf(color: string): "teal" | "violet" | "amber" | "rose" {
  return color === P.violet ? "violet" : color === P.amber ? "amber" : color === P.rose ? "rose" : "teal";
}

/* Plantilla de la forma interna: cuatro campos que siempre existen. */
function Normalizer({ active }: { active: boolean }) {
  const fields = ["chat_id", "user_id", "text", "metadata"];
  return (
    <Pedestal x={X.normal} w={1.4} d={1.5}>
      <RoundedBox position={[0, 0.25, -0.45]} args={[1.1, 1.3, 0.1]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <GwMat color={mixHex(P.paper, P.teal, active ? 0.2 : 0.08)} />
      </RoundedBox>
      {fields.map((f, i) => (
        <mesh key={f} position={[0, 0.72 - i * 0.28, -0.39]} castShadow>
          <boxGeometry args={[0.86, 0.12, 0.03]} />
          <meshStandardMaterial color={active ? P.teal : GW.steel} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      <Tag position={[0, 1.15, -0.4]} tone="teal" center>normalizar</Tag>
    </Pedestal>
  );
}

/* Barrera: se levanta solo si la decisión calculada lo permite. */
function AuthGate({ pass, mode, engaged }: { pass: boolean; mode: AuthMode; engaged: boolean }) {
  const bar = useRef<Group>(null);
  const { still } = useStage();
  const target = pass && engaged ? 1.0 : 0;
  useFrame((_, dt) => {
    if (!bar.current) return;
    const k = still ? 1 : Math.min(1, dt * 5);
    bar.current.rotation.z += (target - bar.current.rotation.z) * k;
  });
  const lamp = engaged ? (pass ? P.teal : P.rose) : GW.steel;
  return (
    <Pedestal x={X.auth} w={1.3} d={1.5}>
      {[-0.5, 0.5].map((x) => (
        <RoundedBox key={x} position={[x, 0.05, 0]} args={[0.16, 1.5, 0.16]} radius={0.04} smoothness={2} castShadow>
          <GwMat color={GW.graphite} metal={0.35} />
        </RoundedBox>
      ))}
      <group ref={bar} position={[-0.5, 0.35, 0.14]}>
        <RoundedBox position={[0.5, 0, 0]} args={[1.08, 0.1, 0.08]} radius={0.03} smoothness={2} castShadow>
          <GwMat color={mode === "open" ? P.amber : P.rose} />
        </RoundedBox>
      </group>
      <mesh position={[0.5, 0.88, 0]}>
        <sphereGeometry args={[0.09, 20, 16]} />
        <meshStandardMaterial color={lamp} emissive={lamp} emissiveIntensity={engaged ? 0.6 : 0} roughness={0.3} />
      </mesh>
      <Tag position={[0, 1.5, 0]} tone={mode === "open" ? "amber" : "rose"} center>{"auth · " + AUTH_LABEL[mode].toLowerCase()}</Tag>
    </Pedestal>
  );
}

/* Armario de filas: cada plataforma resuelve su propia fila de sesión. */
function SessionCabinet({ platform, engaged }: { platform: Platform; engaged: boolean }) {
  return (
    <Pedestal x={X.route} w={1.45} d={1.6}>
      <RoundedBox position={[0, 0.12, -0.25]} args={[1.15, 1.45, 0.9]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <GwMat color={GW.graphite} metal={0.25} />
      </RoundedBox>
      {PLATFORMS.map((p, i) => {
        const on = p.id === platform;
        return (
          <group key={p.id} position={[0, 0.63 - i * 0.33, -0.25 + (on && engaged ? 0.5 : 0.05)]}>
            <RoundedBox args={[1.0, 0.26, 0.85]} radius={0.04} smoothness={2} castShadow receiveShadow>
              <GwMat color={on ? mixHex(P.paper, P.violet, 0.28) : GW.ceramic} />
            </RoundedBox>
            <mesh position={[0, 0, 0.43]}>
              <boxGeometry args={[0.3, 0.05, 0.03]} />
              <meshStandardMaterial color={GW.brass} metalness={0.75} roughness={0.28} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[0, 1.15, -0.25]} tone="violet" center>fila SQLite</Tag>
    </Pedestal>
  );
}

function AgentLoop({ running }: { running: boolean }) {
  const ring = useRef<Mesh>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (ring.current && running && !still) ring.current.rotation.z -= dt * 1.6;
  });
  return (
    <Pedestal x={X.agent} w={1.4} d={1.5}>
      <RoundedBox position={[0, 0.05, -0.1]} args={[1.05, 0.95, 0.85]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <GwMat color={mixHex(P.paper, P.teal, running ? 0.45 : 0.18)} clear={0.6} />
      </RoundedBox>
      <mesh ref={ring} position={[0, 0.05, 0.34]}>
        <torusGeometry args={[0.27, 0.035, 12, 40, Math.PI * 1.6]} />
        <meshStandardMaterial color={running ? P.tealDeep : GW.steel} roughness={0.35} metalness={0.3} />
      </mesh>
      <Tag position={[0, 1.0, -0.1]} tone="teal" center>bucle del agente</Tag>
    </Pedestal>
  );
}

/* El evento: forma propia de la plataforma hasta que se normaliza. */
function EventPacket({ target, platformColor, normalized, denied }: { target: V3; platformColor: string; normalized: boolean; denied: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : Math.min(1, dt * 4.2);
    const jump = Math.abs(g.position.x - target[0]) > 5;
    if (jump) g.position.set(...target);
    else {
      g.position.x += (target[0] - g.position.x) * k;
      g.position.y += (target[1] - g.position.y) * k;
      g.position.z += (target[2] - g.position.z) * k;
    }
  });
  const color = denied ? P.rose : normalized ? GW.ceramic : platformColor;
  return (
    <group ref={ref} position={target}>
      {normalized ? (
        <>
          <RoundedBox args={[0.5, 0.36, 0.06]} radius={0.025} smoothness={2} castShadow>
            <GwMat color={color} clear={0.5} />
          </RoundedBox>
          {[0.09, 0, -0.09].map((y) => (
            <mesh key={y} position={[0, y, 0.035]}>
              <boxGeometry args={[0.36, 0.035, 0.01]} />
              <meshStandardMaterial color={denied ? P.roseDeep : P.teal} />
            </mesh>
          ))}
        </>
      ) : (
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.08, 6]} />
          <GwMat color={color} clear={0.5} />
        </mesh>
      )}
    </group>
  );
}

const PHASES = 6; // entrada, normalizar, auth, sesión, agente, entrega

function GatewayBench({ platform, mode, sender }: { platform: Platform; mode: AuthMode; sender: Sender }) {
  const { still } = useStage();
  const [tick] = useCycle(PHASES, 1.35);
  const verdict = decide(mode, sender);
  const p = PLATFORMS.find((q) => q.id === platform)!;
  const phase = still ? (verdict.pass ? 4 : 2) : verdict.pass ? tick : Math.min(tick, 2);
  const lastPhase = verdict.pass ? phase : Math.min(phase, 2);
  const adapterY = 0.6 - PLATFORMS.indexOf(p) * 0.38;
  const targets: V3[] = [
    [X.adapter + 0.75, adapterY, 0.4],
    [X.normal, 0.3, 0.1],
    [X.auth - 0.1, LANE_Y + 0.2, 0.2],
    [X.route, 0.4, 0.62],
    [X.agent, 0.05, 0.48],
    [X.adapter + 0.75, adapterY, 0.9],
  ];
  const deniedTarget: V3 = [X.auth - 0.35, -0.55, 0.55];
  const target = !verdict.pass && lastPhase === 2 ? deniedTarget : targets[lastPhase];
  return (
    <PointerTilt amount={0.05}>
      <group position={[0.2, 0.2, 0]}>
        <GwBench />
        <AdapterRack platform={platform} />
        <Normalizer active={lastPhase >= 1} />
        <AuthGate pass={verdict.pass} mode={mode} engaged={lastPhase >= 2} />
        <SessionCabinet platform={platform} engaged={verdict.pass && lastPhase >= 3} />
        <AgentLoop running={verdict.pass && lastPhase === 4} />
        <EventPacket target={target} platformColor={p.color} normalized={lastPhase >= 1 && lastPhase < 5} denied={!verdict.pass && lastPhase === 2} />
        {/* ida: el recorrido del evento hasta donde llega */}
        <Flow points={targets.slice(0, verdict.pass ? 5 : 3).map((t) => [t[0], t[1] - 0.05, t[2] + 0.02] as V3)} color={P.teal} count={3} size={0.035} speed={0.22} lineOpacity={0.35} width={1.2} />
        {/* vuelta: entrega saliente por el mismo adaptador, sin espejo */}
        <Arrow from={[X.agent - 0.1, -0.5, 1.2]} to={[X.adapter + 0.85, -0.5, 1.2]} color={P.amber} width={verdict.pass ? 2.4 : 1.2} head={0.13} opacity={verdict.pass ? 0.9 : 0.3} dashed={!verdict.pass} />
        <Tag position={[X.normal + 0.9, -0.62, 1.4]} tone="amber" center>entrega saliente</Tag>
        {!verdict.pass ? <Tag position={[X.auth - 0.35, -0.2, 0.95]} tone="rose" center>denegado</Tag> : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [platform, setPlatform] = useState<Platform>("telegram");
  const [mode, setMode] = useState<AuthMode>("pairing");
  const [sender, setSender] = useState<Sender>("code");
  const verdict = decide(mode, sender);
  const p = PLATFORMS.find((q) => q.id === platform)!;
  const key = `agent:main:${platform}:dm:${p.chatId}`;
  return (
    <Figure
      label="Banco del gateway · de evento a entrega"
      hint="adaptador → forma interna → auth → sesión → bucle → entrega"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "entrada normalizada" },
        { color: P.rose, label: "deny por defecto" },
        { color: P.violet, label: "fila de sesión" },
        { color: P.amber, label: "entrega saliente" },
      ]}
      controls={
        <>
          <Switcher value={platform} onChange={setPlatform} ariaLabel="Plataforma de origen" options={PLATFORMS.map((q) => ({ value: q.id, label: q.label, tone: q.color }))} />
          <Switcher value={mode} onChange={setMode} ariaLabel="Modo de auth" options={(["allowlist", "pairing", "open"] as AuthMode[]).map((m) => ({ value: m, label: AUTH_LABEL[m], tone: m === "open" ? P.amber : P.rose }))} />
          <Switcher value={sender} onChange={setSender} ariaLabel="Remitente" options={(["listed", "unknown", "code"] as Sender[]).map((s) => ({ value: s, label: SENDER_LABEL[s], tone: P.inkSoft }))} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            <strong>{verdict.pass ? "Pasa." : "Se queda en la puerta."}</strong> {verdict.reason}{" "}
            {verdict.pass
              ? "El gateway resuelve la clave en SQLite en cada mensaje (sin estado en memoria), ejecuta el bucle y devuelve la respuesta por el mismo adaptador, como entrega saliente: no se espeja en el transcript."
              : "El evento ya está normalizado, pero no llega a la fila de sesión ni al bucle: no hay prefill que pagar ni respuesta que entregar."}
          </p>
          <Readout
            items={[
              { label: "plataforma", value: p.label, tone: p.color },
              { label: "auth", value: AUTH_LABEL[mode] + " · " + SENDER_LABEL[sender].toLowerCase(), tone: "var(--rose)" },
              { label: "resultado", value: verdict.pass ? "entra" : "deny", tone: verdict.pass ? "var(--teal)" : "var(--rose)" },
            ]}
          />
          <p className="rounded border border-line bg-paper p-2 font-mono text-xs">
            evento → {"{ chat_id: " + p.chatId + ", user_id, text, metadata }"}
            <br />
            clave de sesión → {verdict.pass ? key : "— (no se resuelve)"}
          </p>
          <p className="text-xs text-muted">
            Formato de clave de Hermes: <code>agent:main:{"{platform}:{chat_type}:{chat_id}"}</code>; aquí el chat es un DM y los chat_id son de ejemplo. Un grupo tendría otra clave y, por tanto, otro hilo. {mode === "open" ? "Modo abierto: apropiado para pruebas, nunca para producción." : ""}
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.2, 3.4, 10.6], fov: 34 }} fit={1.08}>
        <GatewayBench platform={platform} mode={mode} sender={sender} />
      </Stage>
    </Figure>
  );
}

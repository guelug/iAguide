"use client";

import { useState, useRef } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, ShadowBlob, Flow } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type Group } from "three";
import { useLocale } from "next-intl";

type Mode = "bills" | "turn" | "limits";
const COPY = {
  en: { title: "an agent turn can create three bills", hint: "subscription · tokens · electricity", bills: "bills", turn: "agent turn", limits: "limits", subscription: "subscription", tokens: "API tokens", power: "electricity", tools: "N tool calls", quota: "quota", 429: "429", 402: "402", cache: "prompt cache" },
  es: { title: "un turno de agente puede crear tres facturas", hint: "suscripción · tokens · electricidad", bills: "facturas", turn: "turno agente", limits: "límites", subscription: "suscripción", tokens: "tokens API", power: "electricidad", tools: "N llamadas tool", quota: "cuota", 429: "429", 402: "402", cache: "caché prompt" },
};
function LegacyVisual() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("bills");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.subscription }, { color: P.violet, label: t.tokens }, { color: P.amber, label: t.power }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "bills", label: t.bills, tone: P.teal }, { value: "turn", label: t.turn, tone: P.violet }, { value: "limits", label: t.limits, tone: P.rose }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "bills" && <>{[[t.subscription, P.teal, -1.7], [t.tokens, P.violet, 0], [t.power, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">cuota ≠ API ≠ vatios</Tag></>}
    {mode === "turn" && <><Node3D position={[-1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">1 prompt</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.tools}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">coste = prompt + N × tools</Tag></>}
    {mode === "limits" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.rose} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="rose">{t.quota}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.4} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t[429]} ↔ {t[402]}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.cache} muerta cambia la factura</Tag></>}
  </PointerTilt></Stage></Figure>;
}

/* ------------------------------------------------------------------ ES */

/*
 * Tres contadores distintos en el mismo tablero. Un turno de usuario se
 * convierte en calls_per_turn = 1 + N_rondas_de_tools + N_auxiliares
 * llamadas al modelo (la identidad de la lección). El camino activo decide
 * qué contador se mueve: la ventana de una suscripción OAuth, la cuenta de
 * una clave API de pago por token, o la GPU local (vatios y tiempo). La
 * lámina cuenta llamadas; no inventa precios, topes de ventana ni kWh.
 */

type QPath = "sub" | "api" | "local";

const Q3 = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2", face: "#f6f2e8" };

const METER_X: Record<QPath, number> = { sub: -2.6, api: 0, local: 2.6 };
const METER_TONE: Record<QPath, string> = { sub: P.teal, api: P.violet, local: P.amber };

function MeterHousing({ path, active, label, children }: { path: QPath; active: boolean; label: string; children: React.ReactNode }) {
  const tone = METER_TONE[path];
  return (
    <group position={[METER_X[path], 0, -0.4]}>
      <RoundedBox args={[2.1, 2.0, 0.7]} position={[0, 1.0, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color={active ? mixHex(P.paper, tone, 0.22) : "#d9d5cb"} roughness={0.42} clearcoat={0.5} />
      </RoundedBox>
      <RoundedBox args={[1.8, 1.55, 0.06]} position={[0, 1.05, 0.36]} radius={0.06} smoothness={3}>
        <meshStandardMaterial color={Q3.face} roughness={0.5} />
      </RoundedBox>
      {[-0.85, 0.85].flatMap((x) => [0.2, 1.85].map((y) => (
        <mesh key={x + ":" + y} position={[x, y, 0.37]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
          <meshStandardMaterial color={Q3.brass} metalness={0.8} roughness={0.25} />
        </mesh>
      )))}
      <mesh position={[0, 1.95, 0.2]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshStandardMaterial color={active ? tone : "#62686b"} emissive={active ? tone : "#000"} emissiveIntensity={active ? 0.6 : 0} />
      </mesh>
      <group position={[0, 0, 0.4]}>{children}</group>
      <Tag position={[0, 2.35, 0]} tone={active ? (path === "sub" ? "teal" : path === "api" ? "violet" : "amber") : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

/** Subscription: calls stack inside a usage window whose cap is not published. */
function WindowGauge({ calls, active }: { calls: number; active: boolean }) {
  const shown = active ? calls : 0;
  return (
    <group>
      <mesh position={[0, 1.05, 0.02]}>
        <boxGeometry args={[0.9, 1.3, 0.04]} />
        <meshStandardMaterial color={P.tealWash} transparent opacity={0.6} />
      </mesh>
      {Array.from({ length: Math.min(shown, 13) }, (_, i) => (
        <RoundedBox key={i} args={[0.8, 0.08, 0.1]} position={[0, 0.46 + i * 0.095, 0.08]} radius={0.02} smoothness={2}>
          <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.6)} roughness={0.35} clearcoat={0.5} />
        </RoundedBox>
      ))}
      <mesh position={[0, 1.78, 0.06]}>
        <boxGeometry args={[1.0, 0.02, 0.06]} />
        <meshStandardMaterial color={P.lineStrong} />
      </mesh>
    </group>
  );
}

/** API key: a four-drum odometer counting calls billed to the org. */
function Odometer({ calls, active }: { calls: number; active: boolean }) {
  const digits = String(active ? calls : 0).padStart(4, "0").split("");
  return (
    <group position={[0, 1.05, 0.05]}>
      <RoundedBox args={[1.6, 0.56, 0.12]} radius={0.04} smoothness={2}>
        <meshStandardMaterial color="#2a2f33" roughness={0.4} />
      </RoundedBox>
      {digits.map((d, i) => (
        <group key={i} position={[-0.57 + i * 0.38, 0, 0.1]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.32, 24]} />
            <meshStandardMaterial color={Q3.face} roughness={0.45} />
          </mesh>
          <Tag position={[0, 0, 0.22]} tone={active ? "violet" : "muted"} size="sm" center plate={false}>{d}</Tag>
        </group>
      ))}
    </group>
  );
}

/** Local: an induction-style disc that spins while the GPU works. */
function PowerDisc({ active, calls }: { active: boolean; calls: number }) {
  const disc = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!disc.current || still || !active) return;
    disc.current.rotation.y += dt * (0.6 + calls * 0.25);
  });
  return (
    <group position={[0, 1.0, 0.05]}>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 40]} />
        <meshStandardMaterial color={P.amberWash} roughness={0.5} />
      </mesh>
      <group ref={disc} position={[0, -0.2, 0.08]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.03, 48]} />
          <meshStandardMaterial color="#c9ccce" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0.42, 0.02, 0]}>
          <boxGeometry args={[0.12, 0.02, 0.05]} />
          <meshStandardMaterial color={P.amber} />
        </mesh>
      </group>
    </group>
  );
}

function TurnBoard({ path, rounds, aux }: { path: QPath; rounds: number; aux: number }) {
  const calls = 1 + rounds + aux;
  const tone = METER_TONE[path];
  const chips = Array.from({ length: calls }, (_, i) => (i === 0 ? "main" : i <= rounds ? "tool" : "aux"));
  return (
    <group>
      <ShadowBlob position={[0, -0.38, 0.4]} scale={10} opacity={0.12} />
      <RoundedBox args={[9.2, 0.3, 4.8]} position={[0, -0.2, 0.4]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={Q3.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[8.8, 0.07, 4.4]} position={[0, -0.02, 0.4]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={Q3.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <MeterHousing path="sub" active={path === "sub"} label="cuota de suscripción"><WindowGauge calls={calls} active={path === "sub"} /></MeterHousing>
      <MeterHousing path="api" active={path === "api"} label="clave API"><Odometer calls={calls} active={path === "api"} /></MeterHousing>
      <MeterHousing path="local" active={path === "local"} label="GPU local"><PowerDisc calls={calls} active={path === "local"} /></MeterHousing>
      {/* One user turn fans out into calls on the tray in front. */}
      <group position={[0, 0, 1.9]}>
        <RoundedBox args={[7.4, 0.08, 0.8]} position={[0, 0.04, 0]} radius={0.03} smoothness={2} receiveShadow>
          <meshStandardMaterial color={Q3.ceramic} roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.7, 0.34, 0.5]} position={[-3.3, 0.25, 0]} radius={0.07} smoothness={3} castShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, P.amber, 0.45)} roughness={0.4} clearcoat={0.45} />
        </RoundedBox>
        <Tag position={[-3.3, 0.65, 0]} tone="amber" size="xs" center>1 turno</Tag>
        {chips.map((k, i) => (
          <RoundedBox key={i} args={[0.34, 0.22, 0.4]} position={[-2.55 + i * 0.44, 0.19, 0]} radius={0.05} smoothness={2} castShadow>
            <meshPhysicalMaterial color={k === "main" ? mixHex(P.paper, tone, 0.6) : k === "tool" ? mixHex(P.paper, tone, 0.4) : mixHex(P.paper, P.rose, 0.35)} roughness={0.4} clearcoat={0.45} />
          </RoundedBox>
        ))}
        <Tag position={[-2.55 + (calls - 1) * 0.22, 0.6, 0]} tone="ink" size="xs" center>{calls + " llamadas"}</Tag>
      </group>
      <Flow points={[[-2.55 + (calls - 1) * 0.44, 0.35, 1.9], [METER_X[path] * 0.6, 0.9, 1.0], [METER_X[path], 0.9, 0.05]]} color={tone} count={Math.min(6, calls)} size={0.055} speed={0.45} lineOpacity={0.15} />
    </group>
  );
}

const PATH_TEXT: Record<QPath, string> = {
  sub: "El turno consume la ventana de uso del plan (por ejemplo, créditos extra de Claude Max vía OAuth). La clave API y la GPU no se mueven. El tope de la ventana depende del plan y a menudo no está documentado.",
  api: "El turno factura a la organización de la clave API a la tarifa del proveedor. La suscripción de chat no se toca: Plus o Pro no pagan este contador.",
  local: "El turno corre en tu GPU: no hay 429 ni factura por token, pero sí tiempo, VRAM y vatios. Sin contexto suficiente, los reintentos también se pagan aquí.",
};

function SpanishVisual() {
  const [path, setPath] = useState<QPath>("api");
  const [rounds, setRounds] = useState(4);
  const [aux, setAux] = useState(1);
  const calls = 1 + rounds + aux;
  return (
    <Figure
      label="Tres contadores, un turno"
      hint="cuota · tokens de API · electricidad"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.teal, label: "suscripción" },
        { color: P.violet, label: "clave API" },
        { color: P.amber, label: "local" },
        { color: P.rose, label: "llamadas auxiliares" },
      ]}
      note={
        <div className="space-y-3">
          <p><strong>Un turno de usuario son {calls} llamadas al modelo, y sólo se mueve un contador.</strong> {PATH_TEXT[path]}</p>
          <Readout items={[
            { label: "calls_per_turn", value: `1 + ${rounds} + ${aux} = ${calls}`, tone: "var(--ink)" },
            { label: "contador activo", value: path === "sub" ? "cuota" : path === "api" ? "clave API" : "GPU local", tone: path === "sub" ? "var(--teal)" : path === "api" ? "var(--violet)" : "var(--amber)" },
            { label: "multiplicador frente a 1 llamada", value: "× " + calls, tone: "var(--rose)" },
          ]} />
          <p className="text-xs text-muted">Identidad de la lección: calls_per_turn = 1 + N_rondas_de_tools + N_auxiliares (compresión, título, visión, extracto web). La lámina cuenta llamadas; no imprime precios por token, topes de ventana ni kWh, porque la lección se niega a inventarlos.</p>
        </div>
      }
      controls={
        <>
          <Switcher value={path} onChange={setPath} ariaLabel="Camino que paga el turno" options={[{ value: "sub", label: "Suscripción", tone: P.teal }, { value: "api", label: "Clave API", tone: P.violet }, { value: "local", label: "Local", tone: P.amber }]} />
          <Knob label="rondas de tools" value={rounds} min={0} max={8} onChange={setRounds} tone="var(--violet)" />
          <Knob label="auxiliares" value={aux} min={0} max={3} onChange={setAux} tone="var(--rose)" />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.6, 4.4, 9.6], fov: 32 }} fit={1.04}>
        <TurnBoard path={path} rounds={rounds} aux={aux} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

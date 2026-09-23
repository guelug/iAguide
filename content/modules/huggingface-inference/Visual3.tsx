"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Group } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, ShadowBlob, Tag, type V3 } from "@/components/three/atoms";
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
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * El router, la factura y los diez céntimos.
 *
 * Un HF_TOKEN entra por la izquierda, el router elige partner según el
 * sufijo y la factura cae en una de dos bandejas. El depósito de cristal es
 * el crédito gratuito de 0,10 USD/mes (Hermes y HF, sujeto a cambio): cada
 * completion del bucle de agente baja su nivel. Los partners A/B/C y sus
 * velocidades son didácticos; el coste por completion es un supuesto que
 * el lector fija, no una tarifa publicada.
 */

type RouterMode = "router" | "bill" | "free";
type Suffix = "fastest" | "cheapest" | "preferred" | "forced";

type Partner = { id: string; name: string; tps: number; price: number };
const PARTNERS: Partner[] = [
  { id: "a", name: "partner A", tps: 180, price: 0.9 },
  { id: "b", name: "partner B", tps: 420, price: 1.6 },
  { id: "c", name: "partner C", tps: 90, price: 0.4 },
];
const PREFERRED = ["c", "a", "b"]; // the reader's order in Inference Provider settings (didáctico)
const CREDIT = 0.1;

function pick(suffix: Suffix): number {
  if (suffix === "fastest") return PARTNERS.reduce((b, p, i) => (p.tps > PARTNERS[b].tps ? i : b), 0);
  if (suffix === "cheapest") return PARTNERS.reduce((b, p, i) => (p.price < PARTNERS[b].price ? i : b), 0);
  if (suffix === "preferred") return PARTNERS.findIndex((p) => p.id === PREFERRED[0]);
  return 1;
}

const SUFFIX_LABEL: Record<Suffix, string> = { fastest: ":fastest", cheapest: ":cheapest", preferred: ":preferred", forced: ":partner-b" };
const usd = (n: number, d = 3) => `${n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d })} USD`;

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

const ROUTER_AT: V3 = [0, 0, 0];
const partnerAt = (i: number): V3 => [3.1, 0, (i - 1) * 1.7];

/** Router turret: its arm eases towards the partner the suffix selects. */
function RouterTurret({ target }: { target: V3 }) {
  const arm = useRef<Group>(null);
  const placed = useRef(false);
  const { still } = useStage();
  const invalidate = useThree((s) => s.invalidate);
  const angle = Math.atan2(-(target[2] - ROUTER_AT[2]), target[0] - ROUTER_AT[0]);
  useLayoutEffect(() => {
    if (!arm.current) return;
    if (!placed.current || still) { arm.current.rotation.y = angle; placed.current = true; invalidate(); }
  }, [angle, still, invalidate]);
  useFrame((_, dt) => {
    if (!arm.current || still) return;
    arm.current.rotation.y += (angle - arm.current.rotation.y) * Math.min(1, dt * 4);
  });
  return (
    <group position={ROUTER_AT}>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow><cylinderGeometry args={[0.85, 0.95, 0.3, 44]} /><Physical color="#263532" metal={0.3} coat={0.35} /></mesh>
      <mesh position={[0, 0.36, 0]} castShadow><cylinderGeometry args={[0.6, 0.62, 0.14, 40]} /><Physical color={P.teal} coat={0.55} /></mesh>
      <group ref={arm} position={[0, 0.5, 0]}>
        <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.05, 0.05, 1.4, 14]} /><meshStandardMaterial color="#B68442" metalness={0.75} roughness={0.28} /></mesh>
        <mesh position={[1.55, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow><coneGeometry args={[0.12, 0.26, 18]} /><meshStandardMaterial color={P.teal} /></mesh>
      </group>
      <Tag position={[0, -0.05, 1.25]} tone="teal" size="xs" center>router HF</Tag>
    </group>
  );
}

function PartnerPad({ i, active }: { i: number; active: boolean }) {
  const p = PARTNERS[i];
  const at = partnerAt(i);
  const speed = 0.2 + (p.tps / 420) * 0.9;
  const price = 0.2 + (p.price / 1.6) * 0.9;
  return (
    <group position={at}>
      <RoundedBox args={[1.9, 0.14, 1.3]} position={[0, 0.02, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <Physical color={active ? mixHex("#E9E3D5", P.amber, 0.25) : "#D2CCBE"} rough={0.55} coat={0.25} />
      </RoundedBox>
      <RoundedBox args={[0.85, 0.22, 0.55]} position={[-0.35, 0.2, 0]} radius={0.04} smoothness={2} castShadow><Physical color={active ? "#2E3B38" : "#9EA39F"} metal={0.35} coat={0.4} /></RoundedBox>
      {[-0.57, -0.13].map((x) => <mesh key={x} position={[x, 0.315, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.15, 0.15, 0.02, 22]} /><meshStandardMaterial color="#525E5A" metalness={0.4} roughness={0.4} /></mesh>)}
      {/* didactic columns: teal = tokens/s, amber = price per token */}
      <RoundedBox args={[0.18, speed, 0.18]} position={[0.4, 0.09 + speed / 2, -0.15]} radius={0.03} smoothness={2} castShadow><Physical color={P.teal} coat={0.5} /></RoundedBox>
      <RoundedBox args={[0.18, price, 0.18]} position={[0.68, 0.09 + price / 2, -0.15]} radius={0.03} smoothness={2} castShadow><Physical color={P.amber} coat={0.5} /></RoundedBox>
      <Tag position={[0, -0.05, 0.85]} tone={active ? "amber" : "muted"} size="xs" center>{p.name}</Tag>
    </group>
  );
}

function Reservoir({ fraction, draining }: { fraction: number; draining: boolean }) {
  const level = Math.max(0.001, fraction);
  const h = 1.5;
  return (
    <group position={[-3.0, 0, 1.3]}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow><cylinderGeometry args={[0.62, 0.66, 0.12, 36]} /><Physical color="#263532" metal={0.3} /></mesh>
      <mesh position={[0, 0.12 + (h * level) / 2, 0]}><cylinderGeometry args={[0.45, 0.45, h * level, 32]} /><Physical color={fraction < 0.25 ? P.rose : P.teal} coat={0.6} rough={0.2} /></mesh>
      <mesh position={[0, 0.12 + h / 2, 0]}><cylinderGeometry args={[0.5, 0.5, h, 32, 1, true]} /><meshPhysicalMaterial color="#E9F1F0" transparent opacity={0.28} roughness={0.05} depthWrite={false} side={2} /></mesh>
      <mesh position={[0, 0.16 + h, 0]}><cylinderGeometry args={[0.54, 0.54, 0.06, 32]} /><meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.3} /></mesh>
      {[0.25, 0.5, 0.75].map((f) => <mesh key={f} position={[0, 0.12 + h * f, 0.5]}><boxGeometry args={[0.16, 0.012, 0.01]} /><meshBasicMaterial color={P.inkSoft} /></mesh>)}
      <Tag position={[0, -0.05, 0.85]} tone={draining ? (fraction < 0.25 ? "rose" : "teal") : "muted"} size="xs" center>crédito 0,10 USD</Tag>
    </group>
  );
}

function InvoiceTray({ position, label, active }: { position: V3; label: string; active: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.2, 0.1, 0.8]} radius={0.03} smoothness={2} castShadow receiveShadow><Physical color={active ? P.amberWash : "#D2CCBE"} coat={0.3} /></RoundedBox>
      {active && [0, 1, 2].map((k) => (
        <RoundedBox key={k} args={[0.7, 0.02, 0.5]} position={[0.03 * k, 0.07 + k * 0.03, -0.02 * k]} radius={0.005} smoothness={1} castShadow><Physical color="#F4EFE4" rough={0.8} coat={0.05} /></RoundedBox>
      ))}
      <Tag position={[0, -0.05, 0.6]} tone={active ? "amber" : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function AgentBox({ calls }: { calls: number }) {
  return (
    <group position={[-3.0, 0, -0.6]}>
      <RoundedBox args={[1.4, 0.7, 1.0]} position={[0, 0.37, 0]} radius={0.08} smoothness={3} castShadow receiveShadow><Physical color={P.violet} coat={0.5} /></RoundedBox>
      {Array.from({ length: calls }, (_, k) => (
        <mesh key={k} position={[-0.45 + k * (0.9 / Math.max(1, calls - 1)), 0.76, 0.3]}><sphereGeometry args={[0.06, 14, 10]} /><meshStandardMaterial color={P.paper} emissive={P.violet} emissiveIntensity={0.25} /></mesh>
      ))}
      <Tag position={[0, 1.05, 0]} tone="violet" size="xs" center>bucle de agente</Tag>
    </group>
  );
}

function RouterScene({ mode, suffix, customKey, calls, fraction }: { mode: RouterMode; suffix: Suffix; customKey: boolean; calls: number; fraction: number }) {
  const chosen = pick(suffix);
  const target = partnerAt(chosen);
  const hubBill = !(mode === "bill" && customKey);
  const draining = mode === "free" || (mode === "bill" && !customKey);
  return (
    <group>
      <ShadowBlob position={[0, -0.12, 0.3]} scale={10} opacity={0.08} />
      <RoundedBox args={[9.4, 0.16, 6.4]} position={[0.1, -0.1, 0.35]} radius={0.06} smoothness={3} receiveShadow>
        <Physical color="#6E5440" rough={0.6} coat={0.15} />
      </RoundedBox>
      <AgentBox calls={mode === "free" ? calls : 1} />
      <Reservoir fraction={customKey && mode === "bill" ? 1 : fraction} draining={draining} />
      <RouterTurret target={target} />
      {PARTNERS.map((_, i) => <PartnerPad key={i} i={i} active={i === chosen} />)}
      <InvoiceTray position={[-0.9, 0.02, 2.55]} label="factura del Hub" active={hubBill} />
      <InvoiceTray position={[1.4, 0.02, 2.55]} label="factura del partner" active={!hubBill} />
      <Flow points={[[-2.3, 0.7, -0.6], [-1.2, 0.95, -0.4], [-0.6, 0.6, 0]]} color={P.violet} count={Math.max(2, calls)} size={0.045} speed={0.45} lineOpacity={0.4} />
      <Tag position={[-1.3, 1.25, -0.45]} tone="violet" size="xs" center>{SUFFIX_LABEL[suffix]}</Tag>
      <Flow points={[[0.9, 0.6, 0], [(target[0] + 0.9) / 2, 0.95, target[2] / 2], [target[0] - 0.8, 0.5, target[2]]]} color={P.amber} count={3} size={0.045} speed={0.45} lineOpacity={0.4} />
      {/* money path: which tray the charge lands in, and whether the credit pays it */}
      <Flow points={hubBill ? [[target[0] - 0.9, 0.3, target[2] + 0.6], [0.2, 0.5, 2.0], [-0.9, 0.3, 2.5]] : [[target[0] - 0.4, 0.3, target[2] + 0.6], [2.2, 0.5, 2.2], [1.4, 0.3, 2.5]]} color={P.amber} count={2} size={0.04} speed={0.3} lineOpacity={0.25} />
      {draining && <Flow points={[[-3.0, 1.75, 1.3], [-2.0, 1.6, 2.0], [-1.1, 0.4, 2.5]]} color={fraction < 0.25 ? P.rose : P.teal} count={2} size={0.045} speed={0.35} lineOpacity={0.3} />}
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<RouterMode>("router");
  const [suffix, setSuffix] = useState<Suffix>("fastest");
  const [customKey, setCustomKey] = useState(false);
  const [calls, setCalls] = useState(4);
  const [cost, setCost] = useState(0.005);
  const [turns, setTurns] = useState(3);
  const perTurn = calls * cost;
  const spent = Math.min(CREDIT, turns * perTurn);
  const fraction = mode === "free" ? (CREDIT - spent) / CREDIT : 1;
  const lasts = Math.floor(CREDIT / perTurn + 1e-9);
  const chosen = PARTNERS[pick(suffix)];
  const why = useMemo(() => ({
    fastest: "mayor rendimiento en tokens por segundo entre los partners que sirven el modelo",
    cheapest: "menor precio por token de salida",
    preferred: "el primero de tu orden en los ajustes de Inference Providers",
    forced: "fuerzas un backend concreto con su nombre",
  }), []);
  let body;
  if (mode === "router") body = <p><strong>{SUFFIX_LABEL[suffix]}</strong>: {why[suffix]}. El router elige <strong>{chosen.name}</strong> ({chosen.tps} tokens/s, precio {chosen.price.toLocaleString("es-ES")} en unidades didácticas). El id del modelo es un repo del Hub más ese sufijo; no se descargan shards.</p>;
  else if (mode === "bill") body = customKey
    ? <p><strong>Clave custom del partner.</strong> Hugging Face sigue enrutando, pero te factura el partner: la bandeja de la derecha recibe el cargo y el crédito mensual del Hub no se toca.</p>
    : <p><strong>Enrutado por Hugging Face.</strong> Un solo <code>HF_TOKEN</code>. HF cobra la misma tarifa que el partner, sin recargo, en la factura del Hub; primero gasta el crédito mensual y después es pago por uso.</p>;
  else body = <p><strong>La clave gratuita y el agente que habla de más.</strong> Cada turno del usuario dispara {calls} completions (respuesta, seguimiento de tool, compresión, título…). Con un coste supuesto de {usd(cost)} por completion, un turno cuesta {usd(perTurn)} y el crédito de 0,10 USD dura {lasts} {lasts === 1 ? "turno" : "turnos"}. Tras {turns} {turns === 1 ? "turno" : "turnos"} queda {usd(Math.max(0, CREDIT - spent))}{spent >= CREDIT ? ": el siguiente POST devuelve error hasta comprar créditos, usar una clave de partner o pasar a local" : ""}.</p>;
  return (
    <Figure
      label="El router, la factura y los diez céntimos"
      hint="un token · un sufijo · un crédito"
      height="h-[460px] md:h-[560px]"
      legend={[{ color: P.teal, label: "router / crédito" }, { color: P.amber, label: "partner y cargo" }, { color: P.violet, label: "peticiones del agente" }, { color: P.rose, label: "crédito agotándose" }]}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Vista" options={[{ value: "router", label: "Router", tone: P.teal }, { value: "bill", label: "Factura", tone: P.amber }, { value: "free", label: "Clave gratis", tone: P.rose }]} />
          {mode === "router" && <Switcher value={suffix} onChange={setSuffix} ariaLabel="Sufijo de routing" options={(Object.keys(SUFFIX_LABEL) as Suffix[]).map((s) => ({ value: s, label: SUFFIX_LABEL[s], tone: P.violet }))} />}
          {mode === "bill" && <Switcher value={customKey ? "key" : "hf"} onChange={(v) => setCustomKey(v === "key")} ariaLabel="Quién factura" options={[{ value: "hf", label: "Enrutado por HF", tone: P.teal }, { value: "key", label: "Clave del partner", tone: P.amber }]} />}
          {mode === "free" && <>
            <Knob label="completions / turno" value={calls} min={1} max={6} onChange={setCalls} tone="var(--violet)" />
            <Knob label="coste supuesto" value={cost} min={0.001} max={0.02} step={0.001} onChange={setCost} format={(v) => `${v.toLocaleString("es-ES", { minimumFractionDigits: 3 })} $`} tone="var(--amber)" />
            <Knob label="turnos" value={turns} min={0} max={10} onChange={setTurns} tone="var(--rose)" />
          </>}
        </>
      }
      note={
        <div className="space-y-3">
          {body}
          <Readout items={[
            { label: "partner elegido", value: chosen.name, tone: "var(--amber)" },
            { label: "crédito restante", value: usd(mode === "free" ? Math.max(0, CREDIT - spent) : CREDIT), tone: fraction < 0.25 ? "var(--rose)" : "var(--teal)" },
            { label: "turnos que aguanta", value: mode === "free" ? String(lasts) : "—" },
          ]} />
          <p className="text-xs text-muted">Partners A, B y C, sus tokens/s y precios son didácticos. El coste por completion es un supuesto que eliges tú, no una tarifa de ningún partner: consulta la página de precios de HF el día que gastes. El crédito de 0,10 USD/mes para usuarios Free está documentado por Hermes y por Hugging Face (agosto de 2026, sujeto a cambio).</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.0, 6.2, 8.8], fov: 34 }} fit={1.05}>
        <RouterScene mode={mode} suffix={suffix} customKey={customKey} calls={calls} fraction={fraction} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

/*
 * Inference Providers as a router, plus the free-key arithmetic.
 *
 * One HF_TOKEN hits the router. Partners sit behind it. Hugging Face
 * charges partner rates with no surcharge. A $0.10 free credit is a
 * classroom budget, and an agent loop spends many completions per turn.
 */

type Mode = "router" | "bill" | "free";

const COPY = {
  en: {
    title: "the router, the bill, the ten cents",
    hint: "no shards change hands · partner rates · a free key dies in a few agent turns",
    router: "router",
    bill: "pricing",
    free: "free key",
    legendRouter: "HF router",
    legendPartner: "partner backend",
    legendCredit: "monthly credit",
    routerPlate: "router",
    partners: "partners",
    credit: "free credit",
    agent: "agent loop",
    notes: {
      router:
        "Inference Providers is a unified OpenAI-shaped API in front of partner backends. You send a Hub repo id plus a routing suffix (:fastest, :cheapest, :preferred, or a provider name). No shards download.",
      bill: "Hugging Face charges the same rates as the partner, with no extra fee. Custom partner keys in Hub settings are billed by the partner and do not spend the monthly Hub credits.",
      free: "Hermes and Hugging Face both document $0.10 per month of free credit, subject to change. An agent loop makes many completions per user turn. A handful of 397B turns can spend the month.",
    },
  },
  es: {
    title: "el router, la factura, los diez céntimos",
    hint: "no cambian de manos shards · tarifas del partner · una clave gratis muere en pocos turnos de agente",
    router: "router",
    bill: "precios",
    free: "clave gratis",
    legendRouter: "router HF",
    legendPartner: "backend partner",
    legendCredit: "crédito mensual",
    routerPlate: "router",
    partners: "partners",
    credit: "crédito gratis",
    agent: "bucle agente",
    notes: {
      router:
        "Inference Providers es una API unificada con forma OpenAI delante de backends partner. Envías un id de repo del Hub más un sufijo de routing (:fastest, :cheapest, :preferred o un nombre de provider). No se descargan shards.",
      bill: "Hugging Face cobra las mismas tarifas que el partner, sin recargo. Las claves custom de provider en settings las factura el partner y no gastan los créditos mensuales del Hub.",
      free: "Hermes y Hugging Face documentan 0,10 dólares al mes de crédito gratuito, sujeto a cambio. Un bucle de agente hace muchas completions por turno de usuario. Un puñado de turnos 397B puede gastar el mes.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("router");
  const drain = mode === "free";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendRouter },
        { color: P.amber, label: t.legendPartner },
        { color: P.rose, label: t.legendCredit },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "router", label: t.router, tone: P.teal },
            { value: "bill", label: t.bill, tone: P.amber },
            { value: "free", label: t.free, tone: P.rose },
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
        <IsoFrame width={13.3} depth={11.6} y={-0.04} />
        <PlanTrace
          points={[[-5.5, 3.4], [0.1, 3.4], [0.1, 0.3]]}
          y={-0.03}
          color={drain ? P.rose : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.7, 0, 2.3]} to={[4.8, 0, 2.3]} />
        <IsoDust count={46} center={[0, 0.55, 0]} spread={[5.1, 1.0, 3.6]} />

        <GlassPanel
          position={[0.05, 1.45, 0.15]}
          rotation={ISO}
          size={[2.55, 2.35]}
          color={P.teal}
          opacity={0.3}
        />
        <Tag position={[0.05, 2.85, 0.15]} tone="teal">
          {t.routerPlate}
        </Tag>
        <Sheet
          position={[0.15, 0.08, 0.25]}
          size={[1.45, 1.05]}
          color={P.tealWash}
          fill={0.85}
          marks={4}
          markColor={P.teal}
        />

        {[
          { x: 3.35, z: 1.55 },
          { x: 3.55, z: 0.05 },
          { x: 3.25, z: -1.45 },
        ].map((p, i) => (
          <group key={i}>
            <GlassPanel
              position={[p.x, 0.95, p.z]}
              rotation={ISO}
              size={[1.7, 1.45]}
              color={P.amber}
              opacity={mode === "bill" ? 0.3 : 0.18}
            />
            <Sheet
              position={[p.x + 0.08, 0.06, p.z]}
              size={[1.05, 0.8]}
              color={P.amberWash}
              fill={0.8}
              marks={2}
              markColor={P.amber}
            />
            {i === 0 ? (
              <Tag position={[p.x, 1.85, p.z]} tone="amber" size="xs">
                {t.partners}
              </Tag>
            ) : null}
          </group>
        ))}

        <Duct from={[1.15, 0.35, 0.2]} to={[2.55, 0.35, 0.4]} color={P.amber} radius={0.09} bend={0.4} />
        <Flow
          points={[
            [1.0, 0.38, 0.2],
            [2.4, 0.38, 0.35],
          ]}
          color={P.amber}
          count={3}
        />

        {drain ? (
          <>
            <GlassPanel
              position={[-3.25, 1.15, 1.15]}
              rotation={ISO}
              size={[2.15, 1.7]}
              color={P.rose}
              opacity={0.28}
            />
            <Tag position={[-3.25, 2.2, 1.15]} tone="rose" size="xs">
              {t.credit}
            </Tag>
            <Sheet
              position={[-3.15, 0.06, 1.2]}
              size={[1.15, 0.75]}
              color={P.roseWash}
              fill={0.25}
              marks={1}
              markColor={P.rose}
            />
            <Tag position={[-3.25, 1.45, -0.55]} tone="muted" size="xs">
              {t.agent}
            </Tag>
            {[0, 1, 2, 3].map((i) => (
              <Sheet
                key={i}
                position={[-3.55 + i * 0.35, 0.05, -0.75]}
                size={[0.42, 0.65]}
                color={P.violetWash}
                fill={0.8}
                marks={1}
                markColor={P.violet}
              />
            ))}
            <Duct from={[-2.3, 0.22, 0.9]} to={[-1.05, 0.4, 0.25]} color={P.rose} radius={0.09} bend={0.45} />
          </>
        ) : (
          <Sheet
            position={[-3.35, 0.06, 1.05]}
            size={[1.35, 0.95]}
            color={P.tealWash}
            fill={0.8}
            marks={3}
            markColor={P.teal}
          />
        )}
      </Stage>
    </Figure>
  );
}

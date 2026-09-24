"use client";

import { useState } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire, ShadowBlob, Arrow } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";

type Step = "three" | "turn" | "hf" | "rotate" | "myth";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "what_a_harness_spends": "What a harness spends",
      "step_the_diagram": "step the diagram",
      "one_turn": "one turn",
      "hf_credit": "HF credit",
      "plus_myth": "Plus myth",
      "local_credit": "local / credit",
      "api_token": "API token",
      "electricity": "electricity"
    },
    es: {
      "what_a_harness_spends": "qué gasta un harness",
      "step_the_diagram": "recorre el diagrama",
      "one_turn": "un turno",
      "hf_credit": "crédito de HF",
      "plus_myth": "mito del Plus",
      "local_credit": "local / crédito",
      "api_token": "token de API",
      "electricity": "electricidad"
    },
  });

  const OPTIONS = [
    { value: "three" as const, label: "three bills", tone: "var(--teal)" },
    { value: "turn" as const, label: t.one_turn, tone: "var(--amber)" },
    { value: "hf" as const, label: t.hf_credit, tone: "var(--violet)" },
    { value: "rotate" as const, label: "429 / 402", tone: "var(--amber)" },
    { value: "myth" as const, label: t.plus_myth, tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("three");

  return (
    <Figure
      label={t.what_a_harness_spends}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: "subscription quota" },
        { color: P.amber, label: "pay-per-token" },
        { color: P.violet, label: t.local_credit },
      ]}
      controls={
        <Switcher
          ariaLabel="quotas-and-pricing diagram steps"
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
      {active === "three" ? <ThreeScene t={t} /> : null}
      {active === "turn" ? <TurnScene t={t} /> : null}
      {active === "hf" ? <HfScene /> : null}
      {active === "rotate" ? <RotateScene /> : null}
      {active === "myth" ? <MythScene /> : null}
    </group>
  );
}

function ThreeScene({ t }: { t: Record<string, string> }) {
  const cols = [
    { x: -2.15, h: 1.1, label: "sub quota", color: P.teal, tone: "teal" as const },
    { x: 0.0, h: 1.55, label: t.api_token, color: P.amber, tone: "amber" as const },
    { x: 2.15, h: 0.85, label: t.electricity, color: P.violet, tone: "violet" as const },
  ];
  return (
    <group>
      <Wire points={[[-2.8, -0.95, 0], [2.8, -0.95, 0]]} color={P.line} opacity={0.45} />
      {cols.map((c) => (
        <group key={c.label}>
          <Slab position={[c.x, -0.95 + c.h / 2, 0]} size={[1.5, c.h, 0.14]} color={c.color} fill={0.5} />
          <Tag position={[c.x, -0.95 + c.h + 0.38, 0]} tone={c.tone} center>
            {c.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}

function TurnScene({ t }: { t: Record<string, string> }) {
  return (
    <group>
      <Wire points={[[-2.5, 0.2, 0], [2.5, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, 0.2, 0], [2.5, 0.2, 0]]} color={P.amber} count={4} speed={0.35} />
      <Slab position={[-2.2, 0.95, 0]} size={[1.3, 0.6, 0.12]} color={P.teal} fill={0.5} />
      <Tag position={[-2.2, 1.5, 0]} tone="teal" center>
        user
      </Tag>
      <Slab position={[0, 0.95, 0]} size={[1.3, 0.6, 0.12]} color={P.amber} fill={0.5} />
      <Tag position={[0, 1.5, 0]} tone="amber" center>
        N tools
      </Tag>
      <Slab position={[2.2, 0.95, 0]} size={[1.3, 0.6, 0.12]} color={P.violet} fill={0.5} />
      <Tag position={[2.2, 1.5, 0]} tone="violet" center>
        N calls
      </Tag>
      <Tag position={[0, -0.85, 0]} tone="amber" center>{t.one_turn}</Tag>
    </group>
  );
}

function HfScene() {
  return (
    <group>
      <Slab position={[0, 0.7, 0]} size={[2.6, 0.9, 0.14]} color={P.violet} fill={0.5} />
      <Tag position={[0, 1.4, 0]} tone="violet" center>
        0.10 USD / mo
      </Tag>
      <Tag position={[0, -0.85, 0]} tone="teal" center>
        HF routed credit
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.violet} radius={0.14} pulse={0.35} />
    </group>
  );
}

function RotateScene() {
  return (
    <group>
      <Slab position={[-1.6, 0.7, 0]} size={[2.0, 0.85, 0.14]} color={P.amber} fill={0.52} />
      <Tag position={[-1.6, 1.4, 0]} tone="amber" center>
        429 rate
      </Tag>
      <Slab position={[1.6, 0.7, 0]} size={[2.0, 0.85, 0.14]} color={P.violet} fill={0.52} />
      <Tag position={[1.6, 1.4, 0]} tone="violet" center>
        402 bill
      </Tag>
      <Wire points={[[-1.6, 0.15, 0], [1.6, 0.15, 0]]} color={P.line} opacity={0.5} />
      <Tag position={[0, -0.95, 0]} tone="teal" center>
        cache dies
      </Tag>
    </group>
  );
}

function MythScene() {
  return (
    <group>
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.1, 0.14]} color={P.teal} fill={0.45} />
      <Tag position={[-1.7, 1.35, 0]} tone="teal" center>
        Plus fee
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.1, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="amber" center>
        harness spend
      </Tag>
      <Wire points={[[-0.5, 0.55, 0], [0.5, 0.55, 0]]} color={P.line} opacity={0.4} />
      <Tag position={[0, -0.95, 0]} tone="amber" center>
        not the same bill
      </Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * El banco de las tres facturas. Tres bandejas al fondo: cuota de
 * suscripción, clave API y electricidad local. Delante, cinco diapositivas
 * que depositan el gasto en la bandeja que toca:
 *  - un turno de usuario son 1 + N llamadas (identidad de la lección);
 *  - el crédito de Hugging Face: 0,10 USD/mes Free, 2,00 USD PRO, sólo en
 *    modo «Routed by Hugging Face»; con clave propia del proveedor no
 *    aplica. Días hasta agotarlo = crédito / gasto diario, con el gasto
 *    diario como entrada (8 céntimos es el lunes del caso de la lección);
 *  - 429 frente a 402 en el pool de Hermes (detalle en otra lámina);
 *  - el mito del Plus: qué contador mueve cada plan según la tabla de
 *    Hermes que copia la lección. Ningún $/MTok aparece: no se inventa.
 */

type QbMode = "bills" | "turn" | "hf" | "rotate" | "myth";
type Tray = "sub" | "api" | "power";
type Plan = "plus" | "pro" | "max" | "gemini";

const QB = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2" };
const TRAY_X: Record<Tray, number> = { sub: -2.8, api: 0, power: 2.8 };
const TRAY_TONE: Record<Tray, string> = { sub: P.teal, api: P.amber, power: P.violet };
const TRAY_LABEL: Record<Tray, string> = { sub: "cuota", api: "token de API", power: "electricidad" };

const PLANS: Record<Plan, { label: string; tray: Tray | null; usable: string; moves: string }> = {
  plus: { label: "ChatGPT Plus", tray: null, usable: "OAuth de plan ChatGPT (Codex)", moves: "No documentado ahora: la semántica de cuota del plan no está escrita." },
  pro: { label: "Claude Pro", tray: "api", usable: "No: Pro no tiene camino OAuth", moves: "Hace falta ANTHROPIC_API_KEY: pago por token, independiente de la suscripción." },
  max: { label: "Claude Max + extra", tray: "sub", usable: "Sí, vía Anthropic OAuth", moves: "Consume créditos extra comprados; el cupo base de Max queda intacto." },
  gemini: { label: "Gemini gratis", tray: "api", usable: "Sólo clave API (sin OAuth de plan)", moves: "La cuota de la clave gratis muere tras un puñado de turnos de agente." },
};

function BillTray({ tray, lit, count }: { tray: Tray; lit: boolean; count: number }) {
  const tone = TRAY_TONE[tray];
  return (
    <group position={[TRAY_X[tray], 0, -1.3]}>
      <RoundedBox args={[2.3, 0.16, 1.5]} position={[0, 0.08, 0]} radius={0.05} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={lit ? mixHex(P.paper, tone, 0.25) : "#d8d4ca"} roughness={0.45} clearcoat={0.35} />
      </RoundedBox>
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 0.24, 0]}>
          <boxGeometry args={[0.06, 0.18, 1.5]} />
          <meshStandardMaterial color={QB.brass} metalness={0.75} roughness={0.28} />
        </mesh>
      ))}
      {/* Receipts stacked in the tray: one per call billed here. */}
      {Array.from({ length: Math.min(count, 12) }, (_, i) => (
        <RoundedBox key={i} args={[1.4, 0.05, 0.9]} position={[0, 0.2 + i * 0.065, 0]} radius={0.02} smoothness={2} castShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, tone, 0.5)} roughness={0.45} clearcoat={0.3} />
        </RoundedBox>
      ))}
      <Tag position={[0, 0.35 + Math.min(count, 12) * 0.065 + 0.25, 0]} tone={lit ? (tray === "sub" ? "teal" : tray === "api" ? "amber" : "violet") : "muted"} size="xs" center>{TRAY_LABEL[tray]}</Tag>
    </group>
  );
}

function QbBench() {
  return (
    <group>
      <ShadowBlob position={[0, -0.38, 0.2]} scale={10.5} opacity={0.12} />
      <RoundedBox args={[9.4, 0.3, 5.4]} position={[0, -0.2, 0.2]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={QB.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[9.0, 0.07, 5.0]} position={[0, -0.02, 0.2]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={QB.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

/** HF credit as a tank: its level is the share of the monthly credit left after `days`. */
function CreditTank({ credit, spendPerDay, days, applies }: { credit: number; spendPerDay: number; days: number; applies: boolean }) {
  const left = applies ? Math.max(0, credit - spendPerDay * days) : 0;
  const frac = applies ? left / credit : 0;
  const h = 1.0;
  return (
    <group position={[-2.3, 0, 1.6]}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.75, 0.16, 40]} />
        <meshStandardMaterial color={QB.ceramic} roughness={0.55} />
      </mesh>
      {frac > 0 ? (
        <mesh position={[0, 0.16 + (h * frac) / 2, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, h * frac, 40]} />
          <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.5)} roughness={0.3} clearcoat={0.6} />
        </mesh>
      ) : null}
      <mesh position={[0, 0.16 + h / 2, 0]}>
        <cylinderGeometry args={[0.56, 0.56, h, 40, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.18} roughness={0.05} clearcoat={1} side={2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.18 + h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.57, 0.025, 10, 40]} />
        <meshStandardMaterial color={QB.brass} metalness={0.8} roughness={0.25} />
      </mesh>
      <Tag position={[0, 0.5 + h, 0]} tone={applies ? "violet" : "rose"} size="xs" center>{applies ? "crédito HF" : "crédito no aplica"}</Tag>
    </group>
  );
}

type QbState = { mode: QbMode; n: number; pro: boolean; routed: boolean; spend: number; days: number; code: "429" | "402"; plan: Plan };

function hfCredit(pro: boolean) {
  return pro ? 2.0 : 0.1;
}

function Lamp2({ position, on, color, label }: { position: [number, number, number]; on: boolean; color: string; label: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.12, 24]} />
        <meshStandardMaterial color={QB.steel} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.14, 20, 14]} />
        <meshStandardMaterial color={on ? color : "#5b6164"} emissive={on ? color : "#000"} emissiveIntensity={on ? 0.6 : 0} roughness={0.3} />
      </mesh>
      <Tag position={[0, 0.55, 0]} tone={on ? "ink" : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function QbScene({ s }: { s: QbState }) {
  const calls = 1 + s.n;
  const plan = PLANS[s.plan];
  const credit = hfCredit(s.pro);
  const empty = s.routed && s.spend * s.days >= credit;
  const counts: Record<Tray, number> = {
    sub: s.mode === "bills" ? 1 : s.mode === "myth" && plan.tray === "sub" ? 3 : 0,
    api: s.mode === "bills" ? 1 : s.mode === "turn" ? calls : s.mode === "hf" && !s.routed ? 3 : s.mode === "myth" && plan.tray === "api" ? 3 : s.mode === "rotate" ? 2 : 0,
    power: s.mode === "bills" ? 1 : 0,
  };
  const litTray = (t: Tray) => counts[t] > 0;
  return (
    <group>
      <QbBench />
      {(Object.keys(TRAY_X) as Tray[]).map((t) => <BillTray key={t} tray={t} lit={litTray(t)} count={counts[t]} />)}
      {s.mode === "turn" ? (
        <group position={[0, 0, 1.3]}>
          <RoundedBox args={[0.8, 0.36, 0.55]} position={[-2.6, 0.2, 0]} radius={0.07} smoothness={3} castShadow>
            <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.45)} roughness={0.4} clearcoat={0.45} />
          </RoundedBox>
          <Tag position={[-2.6, 0.62, 0]} tone="teal" size="xs" center>1 turno</Tag>
          {Array.from({ length: calls }, (_, i) => (
            <RoundedBox key={i} args={[0.36, 0.24, 0.42]} position={[-1.8 + i * 0.44, 0.14, 0]} radius={0.05} smoothness={2} castShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, P.amber, i === 0 ? 0.6 : 0.4)} roughness={0.4} clearcoat={0.45} />
            </RoundedBox>
          ))}
          <Tag position={[-1.8 + (calls - 1) * 0.22, 0.55, 0]} tone="amber" size="xs" center>{calls + " llamadas"}</Tag>
          <Arrow from={[-1.8 + (calls - 1) * 0.44 + 0.3, 0.3, 0]} to={[0, 0.5, -0.6]} color={P.amber} width={2} head={0.1} bow={0.3} />
        </group>
      ) : null}
      {s.mode === "hf" ? (
        <group>
          <CreditTank credit={credit} spendPerDay={s.spend} days={s.days} applies={s.routed} />
          <Lamp2 position={[0.4, 0, 1.6]} on={empty} color={P.rose} label="402" />
          <Arrow from={[-1.6, 0.7, 1.5]} to={[-0.2, 0.5, -0.5]} color={s.routed ? P.violet : P.lineStrong} width={1.6} head={0.09} dashed={!s.routed} />
          {!s.routed ? <Tag position={[1.9, 0.4, 1.3]} tone="amber" size="xs" center>factura el proveedor</Tag> : null}
        </group>
      ) : null}
      {s.mode === "rotate" ? (
        <group>
          <Lamp2 position={[-1.2, 0, 1.3]} on={s.code === "429"} color={P.amber} label="429" />
          <Lamp2 position={[0, 0, 1.3]} on={s.code === "402"} color={P.rose} label="402" />
          <RoundedBox args={[1.4, 0.26, 0.7]} position={[1.7, 0.14, 1.3]} radius={0.05} smoothness={2} castShadow>
            <meshPhysicalMaterial color={mixHex(P.paper, P.rose, 0.35)} roughness={0.4} clearcoat={0.4} />
          </RoundedBox>
          <Tag position={[1.7, 0.55, 1.3]} tone="rose" size="xs" center>caché muerta</Tag>
        </group>
      ) : null}
      {s.mode === "myth" ? (
        <group position={[0, 0, 1.3]}>
          <RoundedBox args={[1.6, 0.4, 0.8]} position={[-2.6, 0.2, 0]} radius={0.08} smoothness={3} castShadow>
            <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.3)} roughness={0.4} clearcoat={0.45} />
          </RoundedBox>
          <Tag position={[-2.6, 0.65, 0]} tone="teal" size="xs" center>{plan.label}</Tag>
          {plan.tray ? (
            <Arrow from={[-1.7, 0.3, 0]} to={[TRAY_X[plan.tray], 0.5, -0.55]} color={TRAY_TONE[plan.tray]} width={2.2} head={0.12} bow={0.4} />
          ) : (
            <Tag position={[0, 0.3, 0]} tone="rose" size="xs" center>no documentado</Tag>
          )}
        </group>
      ) : null}
    </group>
  );
}

const usd = (v: number) => v.toFixed(2).replace(".", ",") + " USD";

function SpanishVisual() {
  const [mode, setMode] = useState<QbMode>("bills");
  const [n, setN] = useState(7);
  const [pro, setPro] = useState(false);
  const [routed, setRouted] = useState(true);
  const [cents, setCents] = useState(8);
  const [days, setDays] = useState(1);
  const [code, setCode] = useState<"429" | "402">("429");
  const [plan, setPlan] = useState<Plan>("plus");
  const spend = cents / 100;
  const credit = hfCredit(pro);
  const daysToEmpty = credit / spend;
  const left = Math.max(0, credit - spend * days);
  const s: QbState = { mode, n, pro, routed, spend, days, code, plan };
  const p = PLANS[plan];
  const note = {
    bills: (
      <div className="space-y-3">
        <p><strong>Tres monedas que se suelen aplastar en una frase.</strong> La cuota de una suscripción (ChatGPT, créditos extra de Claude Max, Copilot…), la clave API de pago por token y la electricidad de una GPU local son contadores distintos; cada camino mueve sólo el suyo.</p>
        <Readout items={[{ label: "cuota", value: "ventana del plan", tone: "var(--teal)" }, { label: "API", value: "factura de la organización", tone: "var(--amber)" }, { label: "local", value: "julios y VRAM", tone: "var(--violet)" }]} />
      </div>
    ),
    turn: (
      <div className="space-y-3">
        <p><strong>Un turno de usuario no es una llamada.</strong> Con {n} rondas de herramientas son {1 + n} llamadas al modelo, y cada una se factura por separado en el camino activo (aquí, la clave API).</p>
        <Readout items={[{ label: "llamadas por turno", value: `1 + ${n} = ${1 + n}`, tone: "var(--amber)" }]} />
        <p className="text-xs text-muted">La lámina de al lado añade las llamadas auxiliares y compara los tres contadores.</p>
      </div>
    ),
    hf: (
      <div className="space-y-3">
        <p><strong>{routed ? `Crédito ${pro ? "PRO de 2,00" : "Free de 0,10"} USD al mes, enrutado por Hugging Face.` : "Con una clave propia del proveedor, el crédito de HF no aplica."}</strong> {routed ? `A ${cents} céntimos al día se agota en ${daysToEmpty.toLocaleString("es-ES", { maximumFractionDigits: 2 })} días; después las llamadas devuelven 402 hasta comprar créditos.` : "Te factura el proveedor directamente; la bandeja que se llena es la de pago por token."} {routed && !pro && cents === 8 ? "Es el caso de la lección: 0,08 USD el lunes y 402 el martes." : ""}</p>
        <Readout items={[
          { label: "crédito", value: routed ? usd(credit) : "no aplica", tone: "var(--violet)" },
          { label: "gasto diario", value: usd(spend), tone: "var(--amber)" },
          { label: "queda tras " + days + (days === 1 ? " día" : " días"), value: routed ? usd(left) : "—", tone: left > 0 ? "var(--teal)" : "var(--rose)" },
        ]} />
        <p className="text-xs text-muted">Cifras de crédito de la página de precios de Hugging Face citada en la lección (sujetas a cambio). El gasto diario es una entrada tuya, no un precio: la lección no imprime tarifas por token.</p>
      </div>
    ),
    rotate: (
      <div className="space-y-3">
        <p><strong>{code === "429" ? "429: límite de ritmo." : "402: billing."}</strong> {code === "429" ? "El pool de Hermes reintenta la misma clave una vez y rota al segundo 429 seguido." : "El pool rota al momento, con enfriamiento de 1 h."} Rotar mata la caché de prompt, que es por clave: el siguiente turno paga el prefijo completo.</p>
        <Readout items={[{ label: "rotación", value: code === "429" ? "al segundo 429" : "inmediata", tone: "var(--rose)" }, { label: "caché de prompt", value: "fría tras rotar", tone: "var(--violet)" }]} />
      </div>
    ),
    myth: (
      <div className="space-y-3">
        <p><strong>{p.label}: {p.usable}.</strong> {p.moves} Una cuota mensual de consumo no es un contrato para que el harness acuñe tokens ilimitados.</p>
        <Readout items={[{ label: "contador que se mueve", value: p.tray ? TRAY_LABEL[p.tray] : "no documentado", tone: p.tray ? "var(--amber)" : "var(--rose)" }]} />
        <p className="text-xs text-muted">Resumen de la tabla de planes de Hermes que copia la lección (Nous Research, «LLM and Model Providers»).</p>
      </div>
    ),
  }[mode];
  return (
    <Figure
      label="Qué gasta un harness"
      hint="tres facturas · un turno · crédito HF · 429/402 · mito del Plus"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.teal, label: "cuota de suscripción" },
        { color: P.amber, label: "pago por token" },
        { color: P.violet, label: "local / crédito HF" },
        { color: P.rose, label: "402 / caché muerta" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Diapositiva" options={[
            { value: "bills", label: "Tres facturas", tone: P.teal },
            { value: "turn", label: "Un turno", tone: P.amber },
            { value: "hf", label: "Crédito HF", tone: P.violet },
            { value: "rotate", label: "429 / 402", tone: P.rose },
            { value: "myth", label: "Mito del Plus", tone: P.teal },
          ]} />
          {mode === "turn" ? <Knob label="rondas de tools" value={n} min={0} max={10} onChange={setN} tone="var(--amber)" /> : null}
          {mode === "hf" ? (
            <>
              <Switcher value={routed ? "routed" : "key"} onChange={(v) => setRouted(v === "routed")} ariaLabel="Modo de facturación" options={[{ value: "routed", label: "Enrutado", tone: P.violet }, { value: "key", label: "Clave propia", tone: P.amber }]} />
              <Switcher value={pro ? "pro" : "free"} onChange={(v) => setPro(v === "pro")} ariaLabel="Cuenta de Hugging Face" options={[{ value: "free", label: "Free", tone: P.violet }, { value: "pro", label: "PRO", tone: P.violet }]} />
              <Knob label="gasto/día" value={cents} min={1} max={50} onChange={setCents} format={(v) => v + " ¢"} tone="var(--amber)" />
              <Knob label="días" value={days} min={0} max={30} onChange={setDays} tone="var(--teal)" />
            </>
          ) : null}
          {mode === "rotate" ? <Switcher value={code} onChange={setCode} ariaLabel="Código" options={[{ value: "429", label: "429", tone: P.amber }, { value: "402", label: "402", tone: P.rose }]} /> : null}
          {mode === "myth" ? <Switcher value={plan} onChange={setPlan} ariaLabel="Plan" options={(Object.keys(PLANS) as Plan[]).map((k) => ({ value: k, label: PLANS[k].label, tone: P.teal }))} /> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.4, 5.6, 9.0], fov: 32 }} fit={1.04}>
        <QbScene s={s} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

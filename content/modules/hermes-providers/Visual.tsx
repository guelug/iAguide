"use client";

import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Arrow, Flow, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "resolve" | "modes" | "keys" | "fallback" | "sub";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "resolve" as const, label: "resolve", tone: "var(--teal)" },
    { value: "modes" as const, label: "3 api_modes", tone: "var(--amber)" },
    { value: "keys" as const, label: "key scope", tone: "var(--violet)" },
    { value: "fallback" as const, label: "fallback", tone: "var(--amber)" },
    { value: "sub" as const, label: "no sub inherit", tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("resolve");

  return (
    <Figure
      label="Hermes: provider runtime"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="hermes-providers diagram steps"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.4], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active }: { active: Step }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "resolve" ? P.teal : P.lineStrong}
        fill={active === "resolve" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        resolve
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "modes" ? P.amber : P.lineStrong}
        fill={active === "modes" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        3 api_modes
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "keys" ? P.violet : P.lineStrong}
        fill={active === "keys" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        key scope
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "fallback" ? P.teal : P.lineStrong}
        fill={active === "fallback" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        fallback
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "sub" ? P.amber : P.lineStrong}
        fill={active === "sub" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        no sub inherit
      </Tag>
    </group>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * El resolvedor de proveedores como banco: a la izquierda la pila de
 * precedencia (CLI > config.yaml > entorno > defaults); en el centro la
 * elección de api_mode por su cadena de reglas; a la derecha el registro de
 * cinco campos; delante, el llavero con el alcance de cada clave. Todo sale
 * de resolve(); los endpoints de ejemplo están en la nota.
 */

type Prov = "anthropic" | "openrouter" | "custom" | "codex";
type Origin = "config" | "cli";
type Mode = "chat_completions" | "codex_responses" | "anthropic_messages";
type KeyId = "openrouter" | "aigateway" | "openai" | "claude";

const HP = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };

const PROV_LABEL: Record<Prov, string> = { anthropic: "anthropic", openrouter: "openrouter", custom: "custom local", codex: "openai-codex" };
const MODES: Mode[] = ["chat_completions", "codex_responses", "anthropic_messages"];
const MODE_COLOR: Record<Mode, string> = { chat_completions: P.teal, codex_responses: P.violet, anthropic_messages: P.amber };
const KEYS: { id: KeyId; label: string; scope: string }[] = [
  { id: "openrouter", label: "OpenRouter", scope: "solo openrouter.ai" },
  { id: "aigateway", label: "AI Gateway", scope: "solo ai-gateway.vercel.sh" },
  { id: "openai", label: "OpenAI", scope: "custom y fallback" },
  { id: "claude", label: "Claude Code", scope: "credencial refrescable" },
];

function resolve(prov: Prov) {
  switch (prov) {
    case "anthropic":
      return { mode: "anthropic_messages" as Mode, rule: "detección por proveedor (anthropic)", url: "https://api.anthropic.com", key: "claude" as KeyId, keyName: "credencial de Claude Code", source: "almacén de Claude Code" };
    case "openrouter":
      return { mode: "chat_completions" as Mode, rule: "default", url: "https://openrouter.ai/api/v1", key: "openrouter" as KeyId, keyName: "OPENROUTER_API_KEY", source: "~/.hermes/.env" };
    case "custom":
      return { mode: "chat_completions" as Mode, rule: "default (sin transport explícito)", url: "http://localhost:8000/v1", key: "openai" as KeyId, keyName: "OPENAI_API_KEY", source: "~/.hermes/.env" };
    case "codex":
      return { mode: "codex_responses" as Mode, rule: "detección por proveedor (openai-codex)", url: "endpoint del perfil Codex", key: null, keyName: "token OAuth de Codex", source: "~/.hermes/auth.json" };
  }
}

function HMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

const LAYERS = [
  { id: "cli", label: "1 · CLI" },
  { id: "config", label: "2 · config.yaml" },
  { id: "env", label: "3 · entorno" },
  { id: "defaults", label: "4 · defaults" },
];

function PrecedenceTower({ origin, stale }: { origin: Origin; stale: boolean }) {
  return (
    <group position={[-3.55, 0, 0]}>
      <RoundedBox position={[0, 0.05, -0.1]} args={[1.55, 1.95, 1.2]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <HMat color={HP.graphite} metal={0.25} />
      </RoundedBox>
      {LAYERS.map((layer, i) => {
        const win = (origin === "cli" && layer.id === "cli") || (origin === "config" && layer.id === "config");
        const ignored = layer.id === "env" && stale;
        const present = layer.id !== "cli" || origin === "cli";
        const color = win ? mixHex(P.paper, P.teal, 0.5) : ignored ? mixHex(P.paper, P.rose, 0.3) : present ? HP.ceramic : "#C9C6BD";
        return (
          <group key={layer.id} position={[0, 0.72 - i * 0.44, win ? 0.42 : 0.1]}>
            <RoundedBox args={[1.38, 0.34, 1.05]} radius={0.04} smoothness={2} castShadow receiveShadow>
              <HMat color={color} />
            </RoundedBox>
            <mesh position={[0, 0, 0.53]}>
              <boxGeometry args={[0.36, 0.06, 0.03]} />
              <meshStandardMaterial color={HP.brass} metalness={0.75} roughness={0.28} />
            </mesh>
            <Tag position={[-0.95, 0, 0.35]} tone={win ? "teal" : ignored ? "rose" : "muted"} size="xs">{layer.label}</Tag>
          </group>
        );
      })}
      {stale ? <Tag position={[0.95, -0.16, 0.6]} tone="rose" size="xs">ignorado</Tag> : null}
      <Tag position={[0, 1.35, 0]} tone="ink" center>precedencia</Tag>
    </group>
  );
}

function ResolverBody({ mode, rule }: { mode: Mode; rule: number }) {
  return (
    <group position={[-0.7, 0, 0]}>
      <RoundedBox position={[0, 0.05, -0.1]} args={[1.5, 1.5, 1.3]} radius={0.16} smoothness={4} castShadow receiveShadow>
        <HMat color={mixHex(P.paper, P.teal, 0.22)} clear={0.6} />
      </RoundedBox>
      {/* cadena de reglas del api_mode: cuatro muescas, la que decide se enciende */}
      {["explícito", "proveedor", "URL", "default"].map((r, i) => (
        <mesh key={r} position={[-0.45 + i * 0.3, 0.55, 0.56]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 18]} />
          <meshStandardMaterial color={i === rule ? MODE_COLOR[mode] : HP.steel} emissive={i === rule ? MODE_COLOR[mode] : "#000"} emissiveIntensity={i === rule ? 0.4 : 0} metalness={i === rule ? 0.2 : 0.7} roughness={0.3} />
        </mesh>
      ))}
      {MODES.map((m, i) => {
        const on = m === mode;
        const y = 0.3 - i * 0.38;
        return (
          <group key={m}>
            <mesh position={[1.2, y, 0.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 1.0, 16]} />
              <meshPhysicalMaterial color={on ? MODE_COLOR[m] : "#CFCBC1"} roughness={0.35} clearcoat={0.5} metalness={0.1} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[0, 1.08, -0.1]} tone="teal" center>resolvedor</Tag>
    </group>
  );
}

function ModeLamps({ mode }: { mode: Mode }) {
  const idx = MODES.indexOf(mode);
  return (
    <>
      {MODES.map((m, i) => (i === idx ? <Tag key={m} position={[0.62, 0.3 - i * 0.38 + 0.2, 0.3]} tone={m === "chat_completions" ? "teal" : m === "codex_responses" ? "violet" : "amber"} size="xs">{m}</Tag> : null))}
    </>
  );
}

function RecordTray({ mode }: { mode: Mode }) {
  const fields = ["provider", "api_mode", "base_url", "api_key", "source"];
  return (
    <group position={[2.85, 0, 0]}>
      <RoundedBox position={[0, -0.62, 0]} args={[1.9, 0.14, 1.6]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <HMat color={HP.ceramic} rough={0.55} />
      </RoundedBox>
      {fields.map((f, i) => (
        <group key={f} position={[0, -0.42 + i * 0.26, -0.05]}>
          <RoundedBox args={[1.55, 0.2, 1.0]} radius={0.04} smoothness={2} castShadow receiveShadow>
            <HMat color={f === "api_mode" ? mixHex(P.paper, MODE_COLOR[mode], 0.45) : f === "api_key" ? mixHex(P.paper, P.amber, 0.3) : mixHex(P.paper, P.teal, 0.12 + i * 0.03)} />
          </RoundedBox>
          <mesh position={[-0.78, 0, 0.3]}>
            <boxGeometry args={[0.03, 0.12, 0.3]} />
            <meshStandardMaterial color={HP.graphite} />
          </mesh>
        </group>
      ))}
      <Tag position={[0, 0.95, 0]} tone="ink" center>5 campos</Tag>
    </group>
  );
}

function KeyRing({ sent, prov }: { sent: KeyId | null; prov: Prov }) {
  return (
    <group position={[0.4, -0.55, 1.35]}>
      <RoundedBox position={[0, -0.1, 0]} args={[5.2, 0.12, 0.5]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={HP.brass} metalness={0.7} roughness={0.32} />
      </RoundedBox>
      {KEYS.map((k, i) => {
        const on = k.id === sent;
        const blocked = !on && ((prov === "custom" && k.id === "openrouter") || (prov === "custom" && k.id === "aigateway"));
        const x = -1.95 + i * 1.3;
        const color = on ? P.amber : blocked ? P.rose : HP.steel;
        return (
          <group key={k.id} position={[x, on ? 0.18 : 0.08, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.13, 0.04, 12, 28]} />
              <meshStandardMaterial color={color} metalness={on ? 0.5 : 0.7} roughness={0.3} emissive={on ? P.amber : "#000"} emissiveIntensity={on ? 0.25 : 0} />
            </mesh>
            <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.34, 10]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
            </mesh>
            <Tag position={[0.15, -0.32, 0.2]} tone={on ? "amber" : blocked ? "rose" : "muted"} size="xs" center>{k.label}</Tag>
          </group>
        );
      })}
    </group>
  );
}

function ResolverBench({ prov, origin, stale }: { prov: Prov; origin: Origin; stale: boolean }) {
  const r = resolve(prov);
  const idx = MODES.indexOf(r.mode);
  const y = 0.3 - idx * 0.38;
  const flowPts: V3[] = [[-2.8, origin === "cli" ? 0.77 : 0.28, 0.5], [-1.5, 0.2, 0.5], [0.0, y, 0.2], [1.9, y, 0.1]];
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.15, 0]}>
        <ShadowBlob position={[0, -1.12, 0.3]} scale={10} opacity={0.12} />
        <RoundedBox position={[0, -0.92, 0.2]} args={[9.8, 0.38, 3.3]} radius={0.17} smoothness={4} castShadow receiveShadow>
          <HMat color={HP.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.69, 0.2]} args={[9.45, 0.1, 3.0]} radius={0.05} smoothness={3} receiveShadow>
          <HMat color={HP.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        <PrecedenceTower origin={origin} stale={stale} />
        <ResolverBody mode={r.mode} rule={r.rule.startsWith("detección") ? 1 : 3} />
        <ModeLamps mode={r.mode} />
        <RecordTray mode={r.mode} />
        <KeyRing sent={r.key} prov={prov} />
        <Flow points={flowPts} color={MODE_COLOR[r.mode]} count={3} size={0.04} speed={0.28} lineOpacity={0.4} />
        {r.key ? <Arrow from={[-1.55 + KEYS.findIndex((k) => k.id === r.key) * 1.3 + 0.4, -0.2, 1.3]} to={[2.1, -0.2, 0.55]} color={P.amber} width={1.3} head={0.08} bow={0.25} dashed /> : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [prov, setProv] = useState<Prov>("custom");
  const [origin, setOrigin] = useState<Origin>("config");
  const [stale, setStale] = useState(true);
  const r = resolve(prov);
  const rows: [string, string][] = [
    ["provider", prov === "custom" ? "custom" : prov],
    ["api_mode", r.mode],
    ["base_url", r.url],
    ["api_key", r.keyName],
    ["source", r.source],
  ];
  return (
    <Figure
      label="Resolvedor de proveedores · de un id a un cliente vivo"
      hint="precedencia · api_mode · alcance de clave"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "capa que gana" },
        { color: MODE_COLOR[r.mode], label: "api_mode elegido" },
        { color: P.amber, label: "clave enviada" },
        { color: P.rose, label: "ignorado / fuera de alcance" },
      ]}
      controls={
        <>
          <Switcher value={prov} onChange={setProv} ariaLabel="Proveedor guardado" options={(["anthropic", "openrouter", "custom", "codex"] as Prov[]).map((v) => ({ value: v, label: PROV_LABEL[v], tone: MODE_COLOR[resolve(v).mode] }))} />
          <Switcher value={origin} onChange={setOrigin} ariaLabel="Origen de la elección" options={[{ value: "config", label: "config.yaml", tone: P.teal }, { value: "cli", label: "--provider", tone: P.teal }]} />
          <button type="button" className="chip" aria-pressed={stale} onClick={() => setStale(!stale)} style={stale ? { background: "var(--rose-wash)", borderColor: "var(--rose)" } : undefined}>
            OPENAI_BASE_URL rancio {stale ? "exportado" : "ausente"}
          </button>
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            <strong>Gana la capa {origin === "cli" ? "1 (petición explícita en la CLI)" : "2 (config.yaml, lo que guardó hermes model)"}.</strong>{" "}
            {stale
              ? `El OPENAI_BASE_URL del shell queda en la capa 3 y no pisa esa elección; solo se honra para el proveedor openai-api.`
              : "Sin exports sobrantes, la capa 3 no aporta nada para este proveedor."}{" "}
            El api_mode sale de la cadena explícito → proveedor → URL → default; aquí decide: <em>{r.rule}</em>.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-left text-xs">
              <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">campo</th><th className="border-b border-line px-2 py-1">valor resuelto</th></tr></thead>
              <tbody>{rows.map(([k, v]) => <tr key={k}><td className="border-b border-line/60 px-2 py-1 font-mono">{k}</td><td className="border-b border-line/60 px-2 py-1 font-mono">{v}</td></tr>)}</tbody>
            </table>
          </div>
          <Readout items={[{ label: "clave", value: r.keyName, tone: "var(--amber)" }, { label: "alcance", value: prov === "custom" ? "OpenRouter y AI Gateway bloqueadas" : "clave de su propio host", tone: "var(--rose)" }]} />
          <p className="text-xs text-muted">
            {prov === "custom" ? "Con OPENROUTER_API_KEY y OPENAI_API_KEY en .env, un endpoint local recibe OPENAI_API_KEY: la clave de OpenRouter solo viaja a openrouter.ai. " : ""}
            La URL local y los orígenes son ejemplos de la lección. El resolvedor devuelve además metadatos del proveedor (caducidad, refresh) que no se dibujan.
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.0, 3.6, 10.4], fov: 34 }} fit={1.08}>
        <ResolverBench prov={prov} origin={origin} stale={stale} />
      </Stage>
    </Figure>
  );
}

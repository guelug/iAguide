"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Halo, ShadowBlob, Tag, Wire, type V3 } from "@/components/three/atoms";
import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Cada clave tiene dueño.
 *
 * Cuatro peanas: el sandboxing del bucle Hermes y, del lado OpenClaw, los
 * backends de sandbox del Gateway, la tool policy y el hatch elevated. Cada
 * clave de configuración vive en una sola peana. Al elegir una, la llave
 * viaja a su peana; en el modo «pegada en tools.deny» viaja siempre a la
 * tool policy y, si no es suya, queda rechazada: es el error de pegar un
 * flag de Docker en tools.deny.
 */

type LayerId = "hermes" | "sandbox" | "policy" | "elevated";
type KeyId = "docker" | "mode" | "browser" | "deny" | "alsoAllow" | "elevated";

const LAYERS: { id: LayerId; label: string; color: string; tone: "violet" | "teal" | "amber" | "rose"; question: string }[] = [
  { id: "hermes", label: "bucle Hermes", color: P.violet, tone: "violet", question: "asunto del bucle de Hermes, no del Gateway de OpenClaw" },
  { id: "sandbox", label: "sandbox", color: P.teal, tone: "teal", question: "dónde corren las tools (backend sandbox o host)" },
  { id: "policy", label: "tool policy", color: P.amber, tone: "amber", question: "qué tools existen; deny gana" },
  { id: "elevated", label: "elevated", color: P.rose, tone: "rose", question: "escape solo para exec" },
];

const KEYS: { id: KeyId; name: string; layer: LayerId; what: string }[] = [
  { id: "docker", name: "flag de Docker", layer: "hermes", what: "configura el sandboxing del bucle Hermes cuando existe" },
  { id: "mode", name: "sandbox.mode", layer: "sandbox", what: "off, non-main o all: qué sesiones corren en el backend sandbox" },
  { id: "browser", name: "allowHostControl", layer: "sandbox", what: "agents.defaults.sandbox.browser.allowHostControl: un browser target host desde una sesión sandboxed; tools.alsoAllow no lo implica" },
  { id: "deny", name: "tools.deny", layer: "policy", what: "quita tools por nombre o grupo; deny siempre gana" },
  { id: "alsoAllow", name: "alsoAllow", layer: "policy", what: "tools.sandbox.tools.alsoAllow: segundo gate de allow para tools (por ejemplo MCP) dentro del sandbox" },
  { id: "elevated", name: "elevated.enabled", layer: "elevated", what: "tools.elevated.enabled y allowFrom: habilitan el hatch solo-exec" },
];

const layerAt = (i: number): V3 => [-3.3 + i * 2.2, 0, -0.7];

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

function Ease({ to, from, speed = 2.4, children }: { to: V3; from?: V3; speed?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const placed = useRef(false);
  const { still } = useStage();
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    if (!placed.current || still) { g.position.set(...(still || !from ? to : from)); placed.current = true; invalidate(); }
  }, [to, from, still, invalidate]);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g || still) return;
    const k = Math.min(1, dt * speed);
    g.position.x += (to[0] - g.position.x) * k;
    g.position.y += (to[1] - g.position.y) * k;
    g.position.z += (to[2] - g.position.z) * k;
  });
  return <group ref={ref}>{children}</group>;
}

function KeyToken({ color, big = false }: { color: string; big?: boolean }) {
  const s = big ? 1.4 : 1;
  return (
    <group scale={s}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.11, 0.04, 10, 24]} /><meshStandardMaterial color="#B68442" metalness={0.75} roughness={0.28} /></mesh>
      <mesh position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.34, 10]} /><meshStandardMaterial color="#B68442" metalness={0.75} roughness={0.28} /></mesh>
      <mesh position={[0.38, -0.05, 0]} castShadow><boxGeometry args={[0.05, 0.1, 0.05]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
}

function Plinth({ i, active, wrong }: { i: number; active: boolean; wrong: boolean }) {
  const layer = LAYERS[i];
  const keys = KEYS.filter((k) => k.layer === layer.id);
  return (
    <group position={layerAt(i)}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow><cylinderGeometry args={[0.85, 0.95, 0.36, 44]} /><Physical color={active ? mixHex(P.paper, layer.color, 0.35) : "#D2CCBE"} coat={0.35} /></mesh>
      <mesh position={[0, 0.39, 0]}><cylinderGeometry args={[0.7, 0.7, 0.06, 40]} /><Physical color={layer.color} coat={0.55} /></mesh>
      {/* key board */}
      <RoundedBox args={[1.2, 1.1, 0.12]} position={[0, 1.0, -0.35]} radius={0.04} smoothness={3} castShadow receiveShadow><Physical color="#4A3A2C" rough={0.6} coat={0.2} /></RoundedBox>
      {keys.map((k, j) => (
        <group key={k.id} position={[-0.25, 1.25 - j * 0.35, -0.24]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.12, 8]} /><meshStandardMaterial color="#9C9C94" metalness={0.8} roughness={0.25} /></mesh>
          <group position={[0, -0.02, 0.1]}><KeyToken color={layer.color} /></group>
        </group>
      ))}
      {wrong && <Halo position={[0, 0.45, 0]} radius={1.0} color={P.rose} opacity={0.55} spin={0.3} />}
      <Tag position={[0, -0.05, 1.15]} tone={active ? layer.tone : "muted"} size="xs" center>{layer.label}</Tag>
    </group>
  );
}

function KeysScene({ keyId, pasted }: { keyId: KeyId; pasted: boolean }) {
  const key = KEYS.find((k) => k.id === keyId)!;
  const owner = LAYERS.findIndex((l) => l.id === key.layer);
  const target = pasted ? LAYERS.findIndex((l) => l.id === "policy") : owner;
  const wrong = pasted && key.layer !== "policy";
  const at = layerAt(target);
  const dest: V3 = [at[0] + 0.1, 0.62, at[2] + 0.35];
  return (
    <group>
      <ShadowBlob position={[0, -0.14, 0.2]} scale={10} opacity={0.07} />
      <RoundedBox args={[10.4, 0.16, 5.2]} position={[0, -0.12, 0.3]} radius={0.06} smoothness={3} receiveShadow><Physical color="#6E5440" rough={0.6} coat={0.15} /></RoundedBox>
      {/* the product boundary: Hermes on the left, the OpenClaw Gateway on the right */}
      <Wire points={[[-2.2, 0.0, -2.0], [-2.2, 0.0, 2.6]]} color={P.inkSoft} dashed opacity={0.8} width={1.4} />
      <Tag position={[-4.3, 0.05, 2.5]} tone="violet" size="xs" center>Hermes</Tag>
      <Tag position={[3.9, 0.05, 2.5]} tone="teal" size="xs" center>OpenClaw</Tag>
      {LAYERS.map((_, i) => <Plinth key={i} i={i} active={i === target} wrong={wrong && i === target} />)}
      {/* the tray the reader picks keys from */}
      <RoundedBox args={[2.0, 0.1, 0.8]} position={[0, 0.02, 2.1]} radius={0.03} smoothness={2} castShadow receiveShadow><Physical color="#D2CCBE" coat={0.3} /></RoundedBox>
      <Ease key={`${keyId}-${pasted}`} to={dest} from={[0, 0.3, 2.1]}>
        <KeyToken color={wrong ? P.rose : LAYERS[owner].color} big />
        <Tag position={[0.3, 0.42, 0]} tone={wrong ? "rose" : LAYERS[owner].tone} size="xs" center>{key.name}</Tag>
      </Ease>
      {wrong && <Tag position={[at[0], 2.0, at[2]]} tone="rose" size="xs" center>no es su capa</Tag>}
    </group>
  );
}

function SpanishVisual() {
  const [keyId, setKeyId] = useState<KeyId>("mode");
  const [pasted, setPasted] = useState(false);
  const key = KEYS.find((k) => k.id === keyId)!;
  const owner = LAYERS.find((l) => l.id === key.layer)!;
  const wrong = pasted && key.layer !== "policy";
  return (
    <Figure
      label="Cada clave tiene dueño · no mezcles knobs"
      hint="Hermes · sandbox · tool policy · elevated"
      height="h-[440px] md:h-[540px]"
      legend={LAYERS.map((l) => ({ color: l.color, label: l.label }))}
      controls={
        <>
          <Switcher value={keyId} onChange={setKeyId} ariaLabel="Clave de configuración" options={KEYS.map((k) => ({ value: k.id, label: k.name, tone: LAYERS.find((l) => l.id === k.layer)!.color }))} />
          <Switcher value={pasted ? "deny" : "ok"} onChange={(v) => setPasted(v === "deny")} ariaLabel="Colocación" options={[{ value: "ok", label: "En su capa", tone: P.teal }, { value: "deny", label: "Pegada en tools.deny", tone: P.rose }]} />
        </>
      }
      note={
        <div className="space-y-3">
          <p><strong><code>{key.name}</code> pertenece a «{owner.label}»</strong>: {key.what}. Esa capa responde a una sola pregunta: {owner.question}.</p>
          {pasted && <p>{wrong ? <>Pegarla en <code>tools.deny</code> no hace nada útil: la tool policy filtra nombres de tools y no entiende flags de otra capa. Cuando una tool se bloquea, <code>openclaw logs</code> nombra la capa en la entrada <code>agents/tool-policy</code>; léela antes de tocar tres capas a ciegas.</> : <>Esta sí es una clave de la tool policy: no hay mezcla.</>}</p>}
          <Readout items={[
            { label: "capa", value: owner.label, tone: `var(--${owner.tone})` },
            { label: "producto", value: key.layer === "hermes" ? "Hermes" : "OpenClaw Gateway" },
            { label: "colocación", value: wrong ? "incorrecta" : "correcta", tone: wrong ? "var(--rose)" : "var(--teal)" },
          ]} />
          <p className="text-xs text-muted">Rutas completas abreviadas en las etiquetas; la lección cita la página de comparación de OpenClaw para cada clave. La sección Tools de AGENTS.md no controla ninguna de estas capas.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.4, 5.6, 9.0], fov: 34 }} fit={1.06}>
        <KeysScene keyId={keyId} pasted={pasted} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

/*
 * Three layers that all feel like "the sandbox" and are not the same
 * thing. The section says it in nine hundred words; the plinths say which
 * layer owns which key, which is the part people actually get wrong.
 */

const EN: Surface[] = [
  {
    name: "Hermes sandboxing",
    role: "server",
    note: "a concern of the Hermes loop, not of the Gateway",
    knobs: ["Docker flag"],
    color: P.violet,
  },
  {
    name: "Sandbox backends",
    role: "server",
    note: "provisioned by the Gateway; creator-role required sandboxes are not overridden by mode=off",
    knobs: ["sandbox.mode", "sandbox.browser.allowHostControl"],
    color: P.teal,
  },
  {
    name: "Tool policy",
    role: "client",
    note: "a separate layer where deny wins; the workspace AGENTS.md Tools section does not control it",
    knobs: ["tools.deny", "tools.alsoAllow", "sessionToolsVisibility"],
    color: P.amber,
  },
];

const ES: Surface[] = [
  {
    name: "Sandboxing de Hermes",
    role: "server",
    note: "asunto del bucle Hermes, no del Gateway",
    knobs: ["flag de Docker"],
    color: P.violet,
  },
  {
    name: "Backends de sandbox",
    role: "server",
    note: "los provisiona el Gateway; un sandbox required por creator role no lo tumba mode=off",
    knobs: ["sandbox.mode", "sandbox.browser.allowHostControl"],
    color: P.teal,
  },
  {
    name: "Tool policy",
    role: "client",
    note: "capa aparte donde deny gana; la sección Tools de AGENTS.md no la controla",
    knobs: ["tools.deny", "tools.alsoAllow", "sessionToolsVisibility"],
    color: P.amber,
  },
];

function LegacyVisual() {
  const t = useCopy({
    en: {
      surfaces: EN,
      copy: {
        title: "three layers that all feel like the sandbox",
        hint: "click a plinth · the arrow is the direction calls travel",
        note: "Deny wins across the layers, and elevated is exec-only. When a tool is blocked, openclaw logs names the layer in the agents/tool-policy entry.",
        roles: { server: "provisioned", client: "policy", bridge: "bridge" },
        knobsLabel: "keys",
        hazard: { text: "no Docker flag in tools.deny", from: 0, to: 2 },
      },
    },
    es: {
      surfaces: ES,
      copy: {
        title: "tres capas que parecen el sandbox",
        hint: "pulsa una peana · la flecha es la dirección de las llamadas",
        note: "Deny gana entre capas, y elevated es solo exec. Cuando una tool se bloquea, openclaw logs nombra la capa en la entrada agents/tool-policy.",
        roles: { server: "provisionado", client: "política", bridge: "puente" },
        knobsLabel: "claves",
        hazard: { text: "no pegar flag de Docker en tools.deny", from: 0, to: 2 },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}

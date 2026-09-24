"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Node3D, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * La jaula de tres capas de OpenClaw, resuelta de verdad.
 *
 * Una llamada a una tool sale del agente y pasa por tres preguntas, en el
 * orden en que OpenClaw las responde: ¿existe? (tool policy: deny gana y un
 * allow no vacío bloquea el resto), ¿dónde corre? (sandbox.mode y la clave
 * de sesión) y ¿hay escape? (elevated, solo para exec). La ficha de la tool
 * termina donde el resolvedor dice: rebotada en la puerta, dentro del
 * contenedor o sobre el host. Grupos y claves de sesión son ilustrativos.
 */

type ToolName = "exec" | "write" | "read" | "browser";
type DenyPreset = "none" | "exec" | "group:fs" | "group:runtime";
type SandboxMode = "off" | "non-main" | "all";
type SessionKind = "main" | "group";

const GROUPS: Record<string, ToolName[]> = {
  "group:fs": ["read", "write"],
  "group:runtime": ["exec"],
};

type Verdict = { stage: "policy" | "container" | "host"; reason: string; sandboxed: boolean; elevatedUsed: boolean; elevatedNote: string };

function resolve(tool: ToolName, deny: DenyPreset, allowOnlyRead: boolean, mode: SandboxMode, session: SessionKind, elevated: boolean): Verdict {
  const denied = deny === "none" ? [] : GROUPS[deny] ?? [deny as ToolName];
  const sandboxed = mode === "all" || (mode === "non-main" && session === "group");
  const elevatedNote = !elevated ? "elevated apagado" : tool !== "exec" ? "elevated solo afecta a exec: no cambia nada" : !sandboxed ? "ya corre directo: elevated es un no-op" : "exec sale del sandbox (las approvals pueden seguir aplicando)";
  if (denied.includes(tool)) return { stage: "policy", reason: `deny contiene ${deny === tool ? tool : `${deny} → ${tool}`}: deny siempre gana`, sandboxed, elevatedUsed: false, elevatedNote: elevated ? "elevated no restaura una tool denegada" : elevatedNote };
  if (allowOnlyRead && tool !== "read") return { stage: "policy", reason: "allow no está vacío (solo read): todo lo demás queda bloqueado", sandboxed, elevatedUsed: false, elevatedNote: elevated ? "elevated no otorga tools" : elevatedNote };
  const elevatedUsed = elevated && tool === "exec" && sandboxed;
  if (elevatedUsed) return { stage: "host", reason: "permitida; sesión sandboxed, pero /elevated on saca exec al host", sandboxed, elevatedUsed, elevatedNote };
  return { stage: sandboxed ? "container" : "host", reason: sandboxed ? `permitida; la sesión está sandboxed (mode ${mode}${mode === "non-main" ? ", clave de grupo" : ""})` : `permitida; mode ${mode}${mode === "non-main" ? " y sesión main" : ""}: corre en el host`, sandboxed, elevatedUsed, elevatedNote };
}

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

function Ease({ to, from, speed = 3, children }: { to: V3; from?: V3; speed?: number; children: ReactNode }) {
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

const TOOL_COLOR: Record<ToolName, string> = { exec: P.rose, write: P.amber, read: P.teal, browser: P.violet };

const AGENT: V3 = [-4.0, 0, 0.2];
const GATE_X = -1.9;
const BOX: V3 = [1.7, 0, -0.9];
const HOST_SPOT: V3 = [1.7, 0, 1.75];

function PolicyGate({ deny, allowOnlyRead, blocked }: { deny: DenyPreset; allowOnlyRead: boolean; blocked: boolean }) {
  return (
    <group position={[GATE_X, 0, 0.2]}>
      <RoundedBox args={[0.9, 0.14, 2.2]} position={[0, 0.05, 0]} radius={0.04} smoothness={2} castShadow receiveShadow><Physical color="#263532" metal={0.3} coat={0.3} /></RoundedBox>
      {[-0.9, 0.9].map((z) => <mesh key={z} position={[0, 0.75, z]} castShadow><boxGeometry args={[0.16, 1.4, 0.16]} /><Physical color={P.violet} coat={0.5} /></mesh>)}
      <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[0.2, 0.16, 2.0]} /><Physical color={P.violet} coat={0.5} /></mesh>
      {/* the bar: down when this call is blocked */}
      <mesh position={[0.12, blocked ? 0.55 : 1.2, 0]} rotation={[0, 0, 0]} castShadow><boxGeometry args={[0.06, 0.08, 1.64]} /><meshStandardMaterial color={blocked ? P.rose : "#B68442"} metalness={0.6} roughness={0.3} /></mesh>
      <RoundedBox args={[0.05, 0.42, 1.2]} position={[-0.12, 1.1, 0]} radius={0.02} smoothness={2}><Physical color="#F1EBDD" rough={0.7} coat={0.1} /></RoundedBox>
      <Tag position={[0, 1.95, 0]} tone="violet" size="xs" center>tool policy</Tag>
      <Tag position={[0.75, 0.3, 1.3]} tone={deny === "none" && !allowOnlyRead ? "muted" : "rose"} size="xs" center>{allowOnlyRead ? "allow: read" : deny === "none" ? "deny: —" : `deny: ${deny}`}</Tag>
    </group>
  );
}

function Container({ sandboxed, hatch }: { sandboxed: boolean; hatch: boolean }) {
  const [w, h, d] = [2.8, 1.3, 1.9];
  const frame = sandboxed ? P.teal : "#A9B1AE";
  return (
    <group position={BOX}>
      <RoundedBox args={[w + 0.2, 0.12, d + 0.2]} position={[0, 0.06, 0]} radius={0.04} smoothness={2} castShadow receiveShadow><Physical color={sandboxed ? mixHex(P.paper, P.teal, 0.25) : "#CFCABD"} coat={0.3} /></RoundedBox>
      <mesh position={[0, 0.12 + h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshPhysicalMaterial color={sandboxed ? P.tealWash : "#EEECE6"} transparent opacity={sandboxed ? 0.3 : 0.14} roughness={0.08} depthWrite={false} /></mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} position={[(sx * w) / 2, 0.12 + h / 2, (sz * d) / 2]} castShadow><boxGeometry args={[0.06, h, 0.06]} /><meshStandardMaterial color={frame} metalness={0.4} roughness={0.35} /></mesh>))}
      {[0.12, 0.12 + h].map((y) => <Wire key={y} points={[[-w / 2, y, -d / 2], [w / 2, y, -d / 2], [w / 2, y, d / 2], [-w / 2, y, d / 2], [-w / 2, y, -d / 2]]} color={frame} opacity={0.9} width={1.4} />)}
      {/* the elevated hatch on the front wall: opens only for exec */}
      <group position={[0.7, 0.12, d / 2]} rotation={[0, hatch ? -1.1 : 0, 0]}>
        <mesh position={[0.3, 0.45, 0]} castShadow><boxGeometry args={[0.6, 0.9, 0.04]} /><Physical color={hatch ? P.rose : mixHex(P.paper, P.rose, 0.3)} coat={0.4} /></mesh>
      </group>
      <Tag position={[-0.6, h + 0.45, 0]} tone={sandboxed ? "teal" : "muted"} size="xs" center>{sandboxed ? "sandbox activo" : "sandbox sin uso"}</Tag>
      {hatch && <Tag position={[1.3, 1.25, d / 2 + 0.2]} tone="rose" size="xs" center>elevated</Tag>}
    </group>
  );
}

function AgentPost({ session }: { session: SessionKind }) {
  return (
    <group position={AGENT}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.62, 0.6, 36]} /><Physical color={P.violet} coat={0.5} /></mesh>
      <mesh position={[0, 0.66, 0]}><cylinderGeometry args={[0.36, 0.36, 0.1, 30]} /><meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.3} /></mesh>
      <Tag position={[0, -0.05, 0.95]} tone="violet" size="xs" center>{session === "main" ? "sesión main" : "sesión de grupo"}</Tag>
    </group>
  );
}

function ToolChip({ tool, to, id }: { tool: ToolName; to: V3; id: string }) {
  return (
    <Ease key={id} to={to} from={[AGENT[0], 1.0, AGENT[2]]} speed={2.2}>
      <RoundedBox args={[0.6, 0.3, 0.45]} radius={0.06} smoothness={3} castShadow><Physical color={TOOL_COLOR[tool]} coat={0.6} /></RoundedBox>
      <Tag position={[0, 0.45, 0]} tone={tool === "exec" ? "rose" : tool === "write" ? "amber" : tool === "read" ? "teal" : "violet"} size="xs" center>{tool}</Tag>
    </Ease>
  );
}

function CageScene({ tool, deny, allowOnlyRead, mode, session, elevated, v }: { tool: ToolName; deny: DenyPreset; allowOnlyRead: boolean; mode: SandboxMode; session: SessionKind; elevated: boolean; v: Verdict }) {
  const end: V3 = v.stage === "policy" ? [GATE_X - 0.75, 0.3, 0.2] : v.stage === "container" ? [BOX[0] - 0.5, 0.33, BOX[2]] : [HOST_SPOT[0], 0.28, HOST_SPOT[2]];
  const id = [tool, deny, allowOnlyRead, mode, session, elevated].join("-");
  const color = TOOL_COLOR[tool];
  const path: V3[] = v.stage === "policy"
    ? [[AGENT[0] + 0.6, 0.8, 0.2], [GATE_X - 0.6, 0.8, 0.2]]
    : v.stage === "container"
      ? [[AGENT[0] + 0.6, 0.8, 0.2], [GATE_X, 0.9, 0.2], [BOX[0] - 1.6, 0.8, BOX[2] + 0.2], [BOX[0] - 0.6, 0.6, BOX[2]]]
      : v.elevatedUsed
        ? [[AGENT[0] + 0.6, 0.8, 0.2], [GATE_X, 0.9, 0.2], [BOX[0] - 0.6, 0.7, BOX[2]], [BOX[0] + 1.0, 0.6, BOX[2] + 1.3], [HOST_SPOT[0], 0.5, HOST_SPOT[2]]]
        : [[AGENT[0] + 0.6, 0.8, 0.2], [GATE_X, 0.9, 0.2], [0.2, 0.7, 1.4], [HOST_SPOT[0], 0.5, HOST_SPOT[2]]];
  return (
    <group>
      <ShadowBlob position={[-0.6, -0.2, 0.3]} scale={9} opacity={0.06} />
      {/* the host: everything that is not inside the container */}
      <RoundedBox args={[9.8, 0.2, 5.6]} position={[-0.6, -0.12, 0.3]} radius={0.06} smoothness={3} receiveShadow>
        <Physical color="#6E5440" rough={0.6} coat={0.15} />
      </RoundedBox>
      <Tag position={[3.6, 0.05, 2.9]} tone="ink" size="xs" center>host</Tag>
      <mesh position={[HOST_SPOT[0], 0.0, HOST_SPOT[2]]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.52, 40]} /><meshBasicMaterial color={v.stage === "host" ? P.rose : "#A48C74"} /></mesh>
      <AgentPost session={session} />
      <PolicyGate deny={deny} allowOnlyRead={allowOnlyRead} blocked={v.stage === "policy"} />
      <Container sandboxed={v.sandboxed} hatch={v.elevatedUsed} />
      <Flow key={id} points={path} color={color} count={3} size={0.045} speed={0.4} lineOpacity={0.35} />
      <ToolChip tool={tool} to={end} id={id} />
      {v.stage === "policy" && <Tag position={[GATE_X - 0.9, 0.05, 0.95]} tone="rose" size="xs" center>bloqueada</Tag>}
      {mode === "non-main" && session === "group" && <Tag position={[AGENT[0], 1.25, AGENT[2]]} tone="amber" size="xs" center>no es main</Tag>}
    </group>
  );
}

function SpanishVisual() {
  const [tool, setTool] = useState<ToolName>("exec");
  const [deny, setDeny] = useState<DenyPreset>("none");
  const [allowOnlyRead, setAllowOnlyRead] = useState(false);
  const [mode, setMode] = useState<SandboxMode>("non-main");
  const [session, setSession] = useState<SessionKind>("group");
  const [elevated, setElevated] = useState(false);
  const v = resolve(tool, deny, allowOnlyRead, mode, session, elevated);
  const key = session === "main" ? "agent:main:main" : "agent:main:slack-grupo";
  const outcome = v.stage === "policy" ? "bloqueada por la política" : v.stage === "container" ? "corre en el contenedor" : v.elevatedUsed ? "corre en el host (elevated)" : "corre en el host";
  const deniedList = deny === "none" ? "—" : deny.startsWith("group") ? `${deny} (${(GROUPS[deny] ?? []).join(", ")})` : deny;
  return (
    <Figure
      label="La jaula de tres capas · ¿existe, dónde corre, hay escape?"
      hint="tool policy → sandbox → elevated"
      height="h-[480px] md:h-[580px]"
      legend={[{ color: P.violet, label: "tool policy" }, { color: P.teal, label: "sandbox" }, { color: P.rose, label: "exec / elevated" }, { color: "#6E5440", label: "host" }]}
      controls={
        <>
          <Switcher value={tool} onChange={setTool} ariaLabel="Tool llamada" options={(["exec", "write", "read", "browser"] as ToolName[]).map((t) => ({ value: t, label: t, tone: TOOL_COLOR[t] }))} />
          <Switcher value={deny} onChange={setDeny} ariaLabel="tools.deny" options={[{ value: "none", label: "deny vacío", tone: P.muted }, { value: "exec", label: "deny exec", tone: P.rose }, { value: "group:fs", label: "deny group:fs", tone: P.rose }, { value: "group:runtime", label: "deny group:runtime", tone: P.rose }]} />
          <Switcher value={allowOnlyRead ? "read" : "empty"} onChange={(x) => setAllowOnlyRead(x === "read")} ariaLabel="tools.allow" options={[{ value: "empty", label: "allow vacío", tone: P.muted }, { value: "read", label: "allow: read", tone: P.violet }]} />
          <Switcher value={mode} onChange={setMode} ariaLabel="sandbox.mode" options={[{ value: "off", label: "mode off", tone: P.muted }, { value: "non-main", label: "mode non-main", tone: P.teal }, { value: "all", label: "mode all", tone: P.teal }]} />
          <Switcher value={session} onChange={setSession} ariaLabel="Sesión" options={[{ value: "main", label: "sesión main", tone: P.violet }, { value: "group", label: "grupo Slack", tone: P.amber }]} />
          <Switcher value={elevated ? "on" : "off"} onChange={(x) => setElevated(x === "on")} ariaLabel="elevated" options={[{ value: "off", label: "elevated off", tone: P.muted }, { value: "on", label: "/elevated on", tone: P.rose }]} />
        </>
      }
      note={
        <div className="space-y-3">
          <p><strong>{tool}: {outcome}.</strong> {v.reason}. {v.elevatedNote.charAt(0).toUpperCase() + v.elevatedNote.slice(1)}.{mode === "non-main" && session === "group" ? " Sorpresa habitual: la clave de un grupo nunca es agent:<id>:main, así que non-main la mete en el sandbox aunque sea «tu» bot." : ""}</p>
          <Readout items={[
            { label: "¿existe?", value: v.stage === "policy" ? "no" : "sí", tone: v.stage === "policy" ? "var(--rose)" : "var(--violet)" },
            { label: "¿sandboxed?", value: v.sandboxed ? "sí" : "no", tone: "var(--teal)" },
            { label: "¿dónde corre?", value: v.stage === "policy" ? "en ningún sitio" : v.stage === "container" ? "contenedor" : "host", tone: "var(--ink)" },
          ]} />
          <pre className="overflow-x-auto rounded border border-line bg-paper p-3 font-mono text-[0.7rem] leading-relaxed">{`$ openclaw sandbox explain   (resumen ilustrativo)
session   ${key}
sandbox   mode=${mode}  sandboxed=${v.sandboxed ? "sí" : "no"}
tools     deny=${deniedList}  allow=${allowOnlyRead ? "read" : "—"}
          ${tool} → ${v.stage === "policy" ? "bloqueada (agents/tool-policy)" : "disponible"}
elevated  ${elevated ? "on" : "off"} · ${v.elevatedNote}`}</pre>
          <p className="text-xs text-muted">Resolvedor didáctico con las reglas de la página «Sandbox vs tool policy vs elevated»: deny siempre gana, un allow no vacío bloquea el resto, elevated solo afecta a exec y no puede saltarse un sandbox required de creator role (no dibujado). Los grupos se reducen a las tools de esta lámina; la salida del inspector es un resumen, no su formato literal.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 6.4, 8.8], fov: 34 }} fit={1.05}>
        <CageScene tool={tool} deny={deny} allowOnlyRead={allowOnlyRead} mode={mode} session={session} elevated={elevated} v={v} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Step = "a" | "b" | "c" | "d" | "e";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "elevated": "elevated",
      "groups": "groups",
      "explain": "explain",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "elevated": "elevado",
      "groups": "grupos",
      "explain": "explica",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: "sandbox", tone: "var(--teal)" },
    { value: "b" as const, label: "tool policy", tone: "var(--amber)" },
    { value: "c" as const, label: t.elevated, tone: "var(--violet)" },
    { value: "d" as const, label: t.groups, tone: "var(--teal)" },
    { value: "e" as const, label: t.explain, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: sandbox vs tool policy vs elevated"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-sandbox diagram steps"
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
        sandbox
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        tool policy
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.elevated}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.groups}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.explain}</Tag>
    </group>
  );
}

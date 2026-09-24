"use client";

import { useState } from "react";
import { Figure, Switcher, Readout } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire, ShadowBlob, Arrow } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";

type Step = "a" | "b" | "c" | "d" | "e";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "openclaw_workspace_files": "OpenClaw: workspace files",
      "step_the_diagram": "step the diagram",
      "daily_notes": "daily notes",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "openclaw_workspace_files": "OpenClaw: archivos del workspace",
      "step_the_diagram": "recorre el diagrama",
      "daily_notes": "notas diarias",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: "SOUL.md", tone: "var(--teal)" },
    { value: "b" as const, label: "IDENTITY", tone: "var(--teal)" },
    { value: "c" as const, label: "BOOTSTRAP", tone: "var(--violet)" },
    { value: "d" as const, label: "MEMORY", tone: "var(--amber)" },
    { value: "e" as const, label: t.daily_notes, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label={t.openclaw_workspace_files}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-workspace diagram steps"
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
        SOUL.md
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        IDENTITY
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        BOOTSTRAP
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        MEMORY
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.daily_notes}</Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * El workspace es el cwd por defecto, no un sandbox duro. La maqueta es
 * el sistema de ficheros del host visto como terrazas: el workspace
 * (~/.openclaw/workspace), el estado (~/.openclaw: config, credenciales,
 * sandboxes) y el resto del host (/etc). resolve() aplica las reglas de la
 * lección: rutas relativas contra el cwd; absolutas alcanzan el host si
 * no hay sandbox; con sandbox y workspaceAccess ≠ "rw" las tools trabajan
 * en un workspace sandbox bajo ~/.openclaw/sandboxes; con "rw" se monta el
 * workspace del host.
 */

type PathKey = "rel" | "abs" | "state";
type Sandbox = "off" | "ro" | "rw";

const PATHS: Record<PathKey, { label: string; text: string }> = {
  rel: { label: "Relativa", text: "memory/hoy.md" },
  abs: { label: "Absoluta", text: "/etc/hosts" },
  state: { label: "Estado", text: "~/.openclaw/openclaw.json" },
};

type Region = "workspace" | "sandboxWs" | "etc" | "config" | "blocked";
type Resolution = { region: Region; resolved: string; verdict: "ok" | "risk" | "blocked"; why: string };

function resolve(path: PathKey, sandbox: Sandbox): Resolution {
  if (sandbox === "off") {
    if (path === "rel") return { region: "workspace", resolved: "~/.openclaw/workspace/memory/hoy.md", verdict: "ok", why: "La relativa se resuelve contra el workspace, que es el cwd." };
    if (path === "abs") return { region: "etc", resolved: "/etc/hosts", verdict: "risk", why: "Sin sandbox, una absoluta alcanza el resto del host: el workspace no es una jaula." };
    return { region: "config", resolved: "~/.openclaw/openclaw.json", verdict: "risk", why: "Sin sandbox también alcanza config y credenciales, que viven fuera del workspace." };
  }
  if (path === "rel") {
    return sandbox === "rw"
      ? { region: "workspace", resolved: "~/.openclaw/workspace/memory/hoy.md (montado rw)", verdict: "ok", why: "Con workspaceAccess \"rw\" el sandbox monta el workspace del host." }
      : { region: "sandboxWs", resolved: "~/.openclaw/sandboxes/<sesión>/memory/hoy.md", verdict: "ok", why: "Con sandbox y workspaceAccess distinto de \"rw\", las tools trabajan en una copia bajo ~/.openclaw/sandboxes." };
  }
  return { region: "blocked", resolved: "— (fuera del contenedor)", verdict: "blocked", why: "Dentro del sandbox, las rutas absolutas del host dejan de alcanzarse." };
}

const W1 = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2" };

/** Anchor points for each region, in world space. */
const SPOT: Record<Region, [number, number, number]> = {
  workspace: [-2.2, 0.55, 1.4],
  sandboxWs: [3.0, 0.45, 1.3],
  etc: [-2.4, 0.35, -1.7],
  config: [1.3, 0.35, -1.4],
  blocked: [0.6, 0.5, 0.3],
};

function Terrace({ position, size, color, label, tone, lift = 0.2 }: { position: [number, number, number]; size: [number, number]; color: string; label: string; tone: "teal" | "amber" | "muted" | "violet"; lift?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={[size[0], lift, size[1]]} position={[0, lift / 2, 0]} radius={0.05} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={color} roughness={0.5} clearcoat={0.3} />
      </RoundedBox>
      <Tag position={[-size[0] / 2 + 0.1, lift + 0.08, size[1] / 2 - 0.1]} tone={tone} size="xs">{label}</Tag>
    </group>
  );
}

function FileBlock({ position, name, color, lit = false }: { position: [number, number, number]; name: string; color: string; lit?: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.62, 0.42, 0.08]} position={[0, 0.21, 0]} radius={0.03} smoothness={2} castShadow>
        <meshPhysicalMaterial color={lit ? mixHex(P.paper, color, 0.45) : mixHex(P.paper, color, 0.18)} roughness={0.45} clearcoat={0.35} />
      </RoundedBox>
      {[0.08, 0.0, -0.08].map((dy) => (
        <mesh key={dy} position={[0, 0.24 + dy, 0.045]}>
          <boxGeometry args={[0.4, 0.018, 0.005]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      <Tag position={[0, 0.58, 0]} tone={lit ? "ink" : "muted"} size="xs" center>
        <span className="normal-case">{name}</span>
      </Tag>
    </group>
  );
}

function HouseScene({ path, sandbox }: { path: PathKey; sandbox: Sandbox }) {
  const r = resolve(path, sandbox);
  const boxed = sandbox !== "off";
  const agentAt: [number, number, number] = boxed ? [2.6, 0.45, 0.4] : [-1.0, 0.45, 0.3];
  const target = SPOT[r.region];
  const color = r.verdict === "ok" ? P.teal : r.verdict === "risk" ? P.rose : P.inkSoft;
  return (
    <group>
      <ShadowBlob position={[0, -0.38, 0]} scale={10} opacity={0.12} />
      <RoundedBox args={[8.6, 0.3, 5.6]} position={[0, -0.2, 0]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={W1.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <Terrace position={[0, 0, 0]} size={[8.2, 5.2]} color="#565e62" label="host /" tone="muted" lift={0.06} />
      <Terrace position={[-2.4, 0.06, -1.6]} size={[2.6, 1.4]} color="#6d7478" label="/etc" tone="muted" lift={0.12} />
      <Terrace position={[2.0, 0.06, -0.5]} size={[3.6, 3.6]} color={mixHex(P.paper, P.amber, 0.12)} label="~/.openclaw" tone="amber" lift={0.14} />
      <Terrace position={[-1.9, 0.06, 0.9]} size={[3.4, 2.4]} color={mixHex(P.paper, P.teal, 0.25)} label="workspace" tone="teal" lift={0.3} />
      <Terrace position={[2.6, 0.2, 1.0]} size={[1.8, 1.6]} color={mixHex(P.paper, P.violet, 0.14)} label="sandboxes" tone="violet" lift={0.08} />

      <FileBlock position={[-2.6, 0.36, 0.5]} name="SOUL.md" color={P.teal} />
      <FileBlock position={[-1.8, 0.36, 0.5]} name="AGENTS.md" color={P.teal} />
      <FileBlock position={[-2.2, 0.36, 1.4]} name="memory/" color={P.teal} lit={r.region === "workspace"} />
      <FileBlock position={[-2.4, 0.18, -1.7]} name="hosts" color={P.inkSoft} lit={r.region === "etc"} />
      <FileBlock position={[1.3, 0.2, -1.4]} name="openclaw.json" color={P.amber} lit={r.region === "config"} />
      <FileBlock position={[2.5, 0.2, -1.4]} name="credentials/" color={P.amber} />
      {sandbox === "ro" ? <FileBlock position={[3.0, 0.28, 1.3]} name="copia ws" color={P.violet} lit={r.region === "sandboxWs"} /> : null}

      {/* Sandbox: a glass container around the sandbox terrace. */}
      {boxed ? (
        <group position={[2.6, 0.28, 1.0]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[1.9, 1.1, 1.7]} />
            <meshPhysicalMaterial color={P.violetWash} transparent opacity={0.2} roughness={0.08} clearcoat={1} depthWrite={false} />
          </mesh>
          {[[-0.95, -0.85], [0.95, -0.85], [-0.95, 0.85], [0.95, 0.85]].map(([x, z]) => (
            <mesh key={x + ":" + z} position={[x, 0.55, z]}>
              <boxGeometry args={[0.04, 1.1, 0.04]} />
              <meshStandardMaterial color={W1.brass} metalness={0.75} roughness={0.28} />
            </mesh>
          ))}
          <Tag position={[0, 1.3, 0]} tone="violet" size="xs" center>{sandbox === "rw" ? "sandbox · rw" : "sandbox"}</Tag>
        </group>
      ) : null}
      {sandbox === "rw" ? <Arrow from={[1.7, 0.7, 1.0]} to={[-0.25, 0.7, 1.0]} color={P.violet} width={1.4} head={0.08} dashed /> : null}

      {/* The agent: its cwd pin and the probe towards the resolved path. */}
      <group position={agentAt}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <coneGeometry args={[0.16, 0.5, 20]} />
          <meshPhysicalMaterial color={P.inkSoft} metalness={0.4} roughness={0.3} clearcoat={0.6} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <sphereGeometry args={[0.13, 20, 14]} />
          <meshStandardMaterial color={P.amber} emissive={P.amber} emissiveIntensity={0.35} />
        </mesh>
        <Tag position={[0, 0.95, 0]} tone="ink" size="xs" center>cwd</Tag>
      </group>
      {r.verdict === "blocked" ? (
        <group>
          <Arrow from={[agentAt[0] - 0.2, 0.75, agentAt[2]]} to={[1.75, 0.75, 0.55]} color={P.rose} width={3} head={0.12} />
          <Tag position={[1.2, 1.0, 0.4]} tone="muted" size="xs" center>no alcanza</Tag>
        </group>
      ) : (
        <group>
          <Arrow from={[agentAt[0], 0.85, agentAt[2]]} to={[target[0], target[1] + 0.35, target[2]]} color={color} width={3.2} head={0.14} bow={0.6} />
          <Flow points={[[agentAt[0], 0.85, agentAt[2]], [(agentAt[0] + target[0]) / 2, 1.3, (agentAt[2] + target[2]) / 2], [target[0], target[1] + 0.35, target[2]]]} color={color} count={3} size={0.06} speed={0.45} lineOpacity={0} />
        </group>
      )}
    </group>
  );
}

function SpanishVisual() {
  const [path, setPath] = useState<PathKey>("rel");
  const [sandbox, setSandbox] = useState<Sandbox>("off");
  const r = resolve(path, sandbox);
  return (
    <Figure
      label="El workspace es la casa, no una jaula"
      hint="cwd por defecto · rutas relativas y absolutas · sandbox"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.teal, label: "workspace (cwd)" },
        { color: P.amber, label: "~/.openclaw: config y estado" },
        { color: P.violet, label: "sandbox" },
        { color: P.rose, label: "alcanza el host" },
      ]}
      note={
        <div className="space-y-3">
          <p><strong>{r.why}</strong> Por eso el workspace se trata como memoria privada, y el aislamiento real se pide con <code>agents.defaults.sandbox</code>.</p>
          <Readout items={[
            { label: "ruta pedida", value: PATHS[path].text, tone: "var(--ink)" },
            { label: "se resuelve en", value: r.resolved, tone: r.verdict === "ok" ? "var(--teal)" : r.verdict === "risk" ? "var(--rose)" : "var(--muted)" },
            { label: "sandbox", value: sandbox === "off" ? "apagado" : sandbox === "rw" ? "workspaceAccess rw" : "workspaceAccess ≠ rw", tone: "var(--violet)" },
          ]} />
          <p className="text-xs text-muted">Resolución según OpenClaw, «Agent workspace» y «Sandboxing», tal como los resume la lección. La geometría es un mapa de directorios, no una medida de disco.</p>
        </div>
      }
      controls={
        <>
          <Switcher value={path} onChange={setPath} ariaLabel="Ruta que pide la tool" options={(Object.keys(PATHS) as PathKey[]).map((k) => ({ value: k, label: PATHS[k].label, tone: k === "rel" ? P.teal : P.rose }))} />
          <Switcher value={sandbox} onChange={setSandbox} ariaLabel="Sandbox" options={[{ value: "off", label: "Sin sandbox", tone: P.rose }, { value: "ro", label: "Sandbox", tone: P.violet }, { value: "rw", label: "Sandbox rw", tone: P.violet }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.6, 6.8, 8.4], fov: 32 }} fit={1.03}>
        <HouseScene path={path} sandbox={sandbox} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

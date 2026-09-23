"use client";

import { useState, type ReactNode } from "react";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Arrow, Flow, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "a" | "b" | "c" | "d" | "e";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "spawn": "spawn",
      "bind_here": "bind here",
      "no_sandbox": "no sandbox",
      "bridge": "bridge",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "spawn": "spawn",
      "bind_here": "bindea aquí",
      "no_sandbox": "sin sandbox",
      "bridge": "puente",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: "acpx", tone: "var(--teal)" },
    { value: "b" as const, label: t.spawn, tone: "var(--teal)" },
    { value: "c" as const, label: t.bind_here, tone: "var(--amber)" },
    { value: "d" as const, label: t.no_sandbox, tone: "var(--violet)" },
    { value: "e" as const, label: t.bridge, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: ACP harness spawn"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-acp diagram steps"
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
        acpx
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.spawn}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.bind_here}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.no_sandbox}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.bridge}</Tag>
    </group>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * Dos flechas ACP sobre el mismo host. Puente: un editor habla ACP por
 * stdio con `openclaw acp`, que reenvía por WebSocket al Gateway (OpenClaw
 * es servidor). Spawn: el Gateway, vía el plugin acpx, arranca un harness
 * externo (OpenClaw es cliente). El harness corre en el runtime del host,
 * fuera del sandbox; si la sesión solicitante está en sandbox, el spawn se
 * bloquea. plan() decide qué se enciende y qué clave de sesión resulta.
 */

type Direction = "bridge" | "spawn";
type Binding = "here" | "thread";

function plan(dir: Direction, binding: Binding, sandboxed: boolean) {
  if (dir === "bridge") {
    return { ok: true, role: "servidor ACP", key: "acp-bridge:<id>", blocked: false, text: "El editor lanza openclaw acp; el puente habla ACP por stdio y reenvía cada prompt al Gateway por WebSocket, sobre una clave aislada con prefijo acp-bridge:." };
  }
  if (sandboxed) {
    return { ok: false, role: "cliente ACP", key: "—", blocked: true, text: "La sesión solicitante está en sandbox: los spawns ACP se bloquean, porque el harness correría en el host. Usa runtime: \"subagent\" o lanza desde una sesión main sin sandbox." };
  }
  return {
    ok: true,
    role: "cliente ACP",
    key: "agent::main:acp:<id>",
    blocked: false,
    text: binding === "here"
      ? "/acp spawn claude --bind here fija esta conversación a la sesión ACP: sin hilo hijo; /new y /reset reinician la misma clave in situ."
      : "/acp spawn claude --thread auto crea un hilo hijo (Discord) o un topic (Telegram) atado a la sesión ACP; necesita threadBindings.spawnSessions=true.",
  };
}

const OC = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };
const AX = { editor: -4.3, bridge: -2.2, gateway: 0, acpx: 2.15, harness: 4.3 };

function OMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

function Unit({ x, z = 0, size, color, lit, label, tone, children }: { x: number; z?: number; size: V3; color: string; lit: boolean; label: string; tone: "teal" | "amber" | "violet" | "ink" | "rose" | "muted"; children?: ReactNode }) {
  return (
    <group position={[x, 0, z]}>
      <RoundedBox position={[0, -0.55, 0]} args={[size[0] + 0.35, 0.14, size[2] + 0.35]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <OMat color={OC.ceramic} rough={0.55} clear={0.3} />
      </RoundedBox>
      <RoundedBox position={[0, -0.48 + size[1] / 2, 0]} args={size} radius={0.1} smoothness={4} castShadow receiveShadow>
        <OMat color={lit ? mixHex(P.paper, color, 0.5) : mixHex(P.paper, color, 0.12)} clear={lit ? 0.6 : 0.25} />
      </RoundedBox>
      {children}
      <Tag position={[0, size[1] - 0.2, 0]} tone={lit ? tone : "muted"} center>{label}</Tag>
    </group>
  );
}

/* Jaula del sandbox de OpenClaw: vidrio con marco. El harness ACP no entra. */
function SandboxCage({ occupied }: { occupied: boolean }) {
  const w = 2.6, h = 0.95, d = 1.0;
  return (
    <group position={[-3.2, -0.48 + h / 2, 1.3]}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.12} roughness={0.05} depthWrite={false} />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[(sx * w) / 2, 0, (sz * d) / 2]}>
          <boxGeometry args={[0.05, h, 0.05]} />
          <meshStandardMaterial color={OC.steel} metalness={0.8} roughness={0.3} />
        </mesh>
      )))}
      {[-1, 1].map((sy) => (
        <mesh key={sy} position={[0, (sy * h) / 2, d / 2]}>
          <boxGeometry args={[w, 0.05, 0.05]} />
          <meshStandardMaterial color={OC.steel} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <RoundedBox position={[-0.7, -0.2, 0]} args={[0.6, 0.45, 0.5]} radius={0.08} smoothness={3} castShadow>
        <OMat color={mixHex(P.paper, P.violet, 0.3)} />
      </RoundedBox>
      <Tag position={[-0.7, 0.2, 0.1]} tone="violet" size="xs" center>subagent</Tag>
      <Tag position={[0.0, -h / 2 - 0.05, d / 2 + 0.25]} tone={occupied ? "rose" : "muted"} center>sandbox</Tag>
    </group>
  );
}

function AcpBench({ dir, binding, sandboxed }: { dir: Direction; binding: Binding; sandboxed: boolean }) {
  const pl = plan(dir, binding, sandboxed);
  const bridge = dir === "bridge";
  const spawnLive = !bridge && !pl.blocked;
  const reqPos: V3 = sandboxed ? [-2.6, -0.2, 1.3] : [0.9, -0.15, 1.35];
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.15, 0]}>
        <ShadowBlob position={[0, -1.0, 0]} scale={11} opacity={0.12} />
        <RoundedBox position={[0, -0.8, -0.1]} args={[10.6, 0.36, 4.4]} radius={0.17} smoothness={4} castShadow receiveShadow>
          <OMat color={OC.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.58, -0.1]} args={[10.25, 0.08, 4.1]} radius={0.04} smoothness={3} receiveShadow>
          <OMat color={OC.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        <Tag position={[4.3, -0.5, 1.5]} tone="muted" size="xs" center>runtime del host</Tag>
        <Unit x={AX.editor} size={[1.0, 0.9, 0.9]} color={P.teal} lit={bridge} label="editor" tone="teal">
          <mesh position={[0, 0.0, 0.46]}><boxGeometry args={[0.7, 0.45, 0.02]} /><meshStandardMaterial color={OC.graphite} /></mesh>
        </Unit>
        <Unit x={AX.bridge} size={[0.9, 0.7, 0.8]} color={P.teal} lit={bridge} label="openclaw acp" tone="teal" />
        <Unit x={AX.gateway} size={[1.3, 1.25, 1.1]} color={P.violet} lit label="Gateway" tone="violet" />
        <Unit x={AX.acpx} size={[0.8, 0.6, 0.8]} color={P.amber} lit={spawnLive} label="acpx" tone="amber" />
        <Unit x={AX.harness} size={[1.1, 1.0, 0.95]} color={P.amber} lit={spawnLive} label="Claude Code" tone="amber" />
        <SandboxCage occupied={sandboxed} />
        {/* la conversación que pide el spawn */}
        {!bridge ? <RoundedBox position={reqPos} args={[0.6, 0.45, 0.5]} radius={0.08} smoothness={3} castShadow>
          <OMat color={sandboxed ? mixHex(P.paper, P.rose, 0.35) : mixHex(P.paper, P.teal, 0.3)} />
        </RoundedBox> : null}
        {!sandboxed && !bridge ? <Tag position={[reqPos[0], 0.35, reqPos[2]]} tone="ink" size="xs" center>conversación</Tag> : null}
        {spawnLive && binding === "thread" ? (
          <>
            <RoundedBox position={[2.3, -0.2, 1.75]} args={[0.6, 0.4, 0.45]} radius={0.07} smoothness={3} castShadow>
              <OMat color={mixHex(P.paper, P.amber, 0.35)} />
            </RoundedBox>
            <Tag position={[2.3, 0.25, 1.75]} tone="amber" size="xs" center>hilo hijo</Tag>
            <Arrow from={[1.3, -0.15, 1.45]} to={[1.95, -0.15, 1.7]} color={P.amber} width={1.3} head={0.07} />
            <Arrow from={[2.65, -0.1, 1.6]} to={[4.0, 0.0, 0.6]} color={P.amber} width={1.3} head={0.08} bow={0.2} dashed />
          </>
        ) : null}
        {spawnLive && binding === "here" ? <Arrow from={[1.3, -0.1, 1.3]} to={[3.95, 0.0, 0.55]} color={P.amber} width={1.5} head={0.09} bow={0.3} dashed /> : null}
        {/* puente: editor → openclaw acp (stdio) → Gateway (WebSocket) */}
        <Flow points={[[AX.editor + 0.55, 0.05, 0.1], [AX.bridge - 0.5, 0.05, 0.1]]} color={P.teal} count={bridge ? 3 : 0} size={0.04} speed={0.4} lineOpacity={bridge ? 0.6 : 0.12} />
        <Flow points={[[AX.bridge + 0.5, 0.05, 0.1], [AX.gateway - 0.7, 0.2, 0.1]]} color={P.teal} count={bridge ? 3 : 0} size={0.04} speed={0.4} lineOpacity={bridge ? 0.6 : 0.12} />
        {bridge ? <><Tag position={[(AX.editor + AX.bridge) / 2, -0.3, 0.55]} tone="teal" size="xs" center>stdio</Tag><Tag position={[(AX.bridge + AX.gateway) / 2 + 0.1, -0.3, 0.55]} tone="teal" size="xs" center>WebSocket</Tag></> : null}
        {/* spawn: Gateway → acpx → harness */}
        <Flow points={[[AX.gateway + 0.7, 0.2, 0.1], [AX.acpx - 0.45, 0.05, 0.1]]} color={pl.blocked ? P.rose : P.amber} count={spawnLive ? 3 : 0} size={0.04} speed={0.4} lineOpacity={!bridge ? 0.6 : 0.12} />
        <Flow points={[[AX.acpx + 0.45, 0.05, 0.1], [AX.harness - 0.6, 0.05, 0.1]]} color={P.amber} count={spawnLive ? 3 : 0} size={0.04} speed={0.4} lineOpacity={spawnLive ? 0.6 : 0.12} />
        {pl.blocked ? (
          <>
            <mesh position={[AX.acpx - 0.75, 0.1, 0.1]}><boxGeometry args={[0.08, 0.8, 0.8]} /><OMat color={P.rose} /></mesh>
            <Tag position={[AX.acpx - 0.75, 0.75, 0.1]} tone="rose" size="xs" center>bloqueado</Tag>
          </>
        ) : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [dir, setDir] = useState<Direction>("spawn");
  const [binding, setBinding] = useState<Binding>("here");
  const [sandboxed, setSandboxed] = useState(false);
  const pl = plan(dir, binding, sandboxed);
  return (
    <Figure
      label="ACP en OpenClaw · dos flechas inversas en el mismo host"
      hint="puente: OpenClaw servidor · spawn: OpenClaw cliente"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "puente (openclaw acp)" },
        { color: P.violet, label: "Gateway" },
        { color: P.amber, label: "spawn (acpx)" },
        { color: P.rose, label: "bloqueo por sandbox" },
      ]}
      controls={
        <>
          <Switcher value={dir} onChange={setDir} ariaLabel="Dirección ACP" options={[{ value: "bridge", label: "Puente", tone: P.teal }, { value: "spawn", label: "Spawn", tone: P.amber }]} />
          {dir === "spawn" ? (
            <>
              <Switcher value={binding} onChange={setBinding} ariaLabel="Binding del spawn" options={[{ value: "here", label: "--bind here", tone: P.amber }, { value: "thread", label: "--thread auto", tone: P.amber }]} />
              <button type="button" className="chip" aria-pressed={sandboxed} onClick={() => setSandboxed(!sandboxed)} style={sandboxed ? { background: "var(--rose-wash)", borderColor: "var(--rose)" } : undefined}>
                Solicitante {sandboxed ? "en sandbox" : "sin sandbox"}
              </button>
            </>
          ) : null}
        </>
      }
      note={
        <div className="space-y-3">
          <p><strong>{dir === "bridge" ? "Puente: un editor habla hacia OpenClaw." : pl.blocked ? "Spawn bloqueado." : "Spawn: OpenClaw arranca un harness."}</strong> {pl.text}</p>
          <Readout
            items={[
              { label: "OpenClaw es", value: pl.role, tone: dir === "bridge" ? "var(--teal)" : "var(--amber)" },
              { label: "clave de sesión", value: pl.key, tone: "var(--violet)" },
              { label: "dónde corre", value: dir === "bridge" ? "bucle en la sesión del Gateway" : pl.blocked ? "no arranca" : "host, fuera del sandbox", tone: pl.blocked ? "var(--rose)" : "var(--ink)" },
            ]}
          />
          <p className="rounded border border-line bg-paper p-2 font-mono text-xs">
            {dir === "bridge" ? "openclaw acp --token-file ~/.openclaw/gateway.token" : `openclaw plugins install @openclaw/acpx\n/acp spawn claude ${binding === "here" ? "--bind here" : "--thread auto"}`}
          </p>
          <p className="text-xs text-muted">
            {dir === "bridge"
              ? "En modo puente no hay mcpServers por sesión ni métodos de filesystem o terminal del cliente. Pasa --session para reutilizar una clave conocida."
              : "--bind here y --thread son excluyentes. El harness conserva su propio login de proveedor; las tools de OpenClaw no se le exponen por defecto. Codex nativo (/codex …) no es ACP."}
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.8, 4.6, 10.2], fov: 34 }} fit={1.06}>
        <AcpBench dir={dir} binding={binding} sandboxed={sandboxed} />
      </Stage>
    </Figure>
  );
}

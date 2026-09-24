"use client";

import { useState, useRef } from "react";
import { Figure, Switcher, Readout } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, ShadowBlob } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type Group as ThreeGroup } from "three";
import { useLocale } from "next-intl";

type Mode = "topology" | "pairing" | "approval";
const COPY = {
  en: { title: "nodes are peripherals, not gateways", hint: "topology · pairing · approval", topology: "topology", pairing: "pairing", approval: "approval", gateway: "gateway", node: "node", channel: "channel", request: "pair request", paired: "paired", run: "system.run", pending: "pending", reject: "reject" },
  es: { title: "los nodos son periféricos, no gateways", hint: "topología · pairing · aprobación", topology: "topología", pairing: "pairing", approval: "aprobación", gateway: "gateway", node: "nodo", channel: "canal", request: "petición pairing", paired: "paired", run: "system.run", pending: "pendiente", reject: "rechaza" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("topology");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.gateway }, { color: P.violet, label: t.node }, { color: P.amber, label: t.approval }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "topology", label: t.topology, tone: P.teal }, { value: "pairing", label: t.pairing, tone: P.violet }, { value: "approval", label: t.approval, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "topology" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.teal} opacity={0.3} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.22} pulse={0.3} /><Tag position={[0, 0.8, 0.15]} tone="teal">{t.gateway}</Tag>{[[t.channel, P.amber, -1.9, 0.2], [t.node, P.violet, 1.9, 0.2]].map(([label, color, x, y]) => <group key={label as string}><Slab position={[x as number, y as number, 0]} size={[1.45, 0.8, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, (y as number) + 0.52, 0.15]} tone={color === P.violet ? "violet" : "amber"} size="xs">{label as string}</Tag><Ribbon points={[[x as number * 0.55, y as number, 0], [x as number * 0.88, y as number, 0]]} color={color as string} radius={0.04} opacity={0.8} /></group>)}</>}
        {mode === "pairing" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.violet} fill={0.24} /><Tag position={[-1.7, 0.75, 0.15]} tone="violet">{t.node}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.45} /><Tag position={[1.7, 0.75, 0.15]} tone="amber">{t.request}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">requestId único · caduca · approve</Tag></>}
        {mode === "approval" && <><Slab position={[-1.75, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.75, 0.78, 0.15]} tone="teal">{t.paired}</Tag><Ribbon points={[[-0.8, 0.2, 0], [0.8, 0.2, 0]]} color={P.amber} radius={0.055} opacity={0.9} /><Slab position={[1.75, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.rose} fill={0.25} /><Tag position={[1.75, 0.78, 0.15]} tone="rose">{t.run}</Tag><Tag position={[0, -0.75, 0.15]} tone="amber" size="xs">{t.approval} separada del pairing</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ------------------------------------------------------------------ ES */

/*
 * La política de commands de un nodo OpenClaw como una fila de puertas.
 * Un command sólo llega a node.invoke si pasa todas, en este orden:
 *  0. versión: el Gateway v4 acepta nodos v3 (ventana N-1); más viejos no;
 *  1. pairing de nodo aprobado (desde 2026.3.31 sin él no hay commands);
 *  2. declarado por el nodo en connect.commands;
 *  3. allowlist del Gateway: techo por plataforma, commands de host de
 *     escritorio aprobados en el pairing, o gateway.nodes.commands.allow;
 *     los peligrosos (camera.snap, sms.send…) exigen siempre allow;
 *  4. gateway.nodes.commands.deny siempre gana.
 * Las tablas de abajo son un extracto de las de la lección.
 */

type Platform = "ios" | "android" | "macos" | "linux" | "watchos";
type Cmd = "camera.list" | "location.get" | "computer.act" | "camera.snap" | "sms.send" | "system.run";
type Version = "v4" | "v3" | "v2";

const PLATFORM_LABEL: Record<Platform, string> = { ios: "iOS", android: "Android", macos: "macOS", linux: "Linux", watchos: "watchOS" };

const PLATFORM_ALLOW: Record<Platform, Cmd[]> = {
  ios: ["camera.list", "location.get"],
  android: ["camera.list", "location.get"],
  macos: ["camera.list", "location.get", "computer.act"],
  linux: ["computer.act"],
  watchos: [],
};
const DANGEROUS: Cmd[] = ["camera.snap", "sms.send"];
const DESKTOP: Platform[] = ["macos", "linux"];

type Policy = { platform: Platform; cmd: Cmd; version: Version; paired: boolean; declared: boolean; allow: boolean; deny: boolean };

type Gate = { key: string; label: string; open: boolean; why: string };

function evaluate(p: Policy): Gate[] {
  const hostCmd = p.cmd === "system.run";
  const ceiling = PLATFORM_ALLOW[p.platform].includes(p.cmd) || (hostCmd && DESKTOP.includes(p.platform));
  const dangerous = DANGEROUS.includes(p.cmd);
  const allowlisted = dangerous ? p.allow : ceiling || p.allow;
  return [
    { key: "version", label: "versión", open: p.version !== "v2", why: p.version === "v2" ? "más viejo que N-1: upgrade fuera de banda" : p.version === "v3" ? "v3 aceptado (N-1); plugins ocultos" : "protocolo vigente" },
    { key: "pairing", label: "pairing", open: p.paired, why: p.paired ? "pairing de nodo aprobado" : "sin pairing aprobado no hay commands" },
    { key: "declared", label: "declarado", open: p.declared, why: p.declared ? "en connect.commands" : "el nodo no lo declara" },
    {
      key: "allow",
      label: "allowlist",
      open: allowlisted,
      why: dangerous
        ? p.allow ? "peligroso con opt-in en commands.allow" : "peligroso: exige commands.allow"
        : ceiling ? (hostCmd ? "host de escritorio aprobado en pairing" : "en el techo de " + PLATFORM_LABEL[p.platform]) : p.allow ? "añadido en commands.allow" : "fuera del techo de " + PLATFORM_LABEL[p.platform],
    },
    { key: "deny", label: "deny", open: !p.deny, why: p.deny ? "commands.deny siempre gana" : "no está en deny" },
  ];
}

const O2 = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2" };
const GATE_PITCH = 1.45;
const GX0 = -3.0;

function GateArch({ index, gate, reached }: { index: number; gate: Gate; reached: boolean }) {
  const bar = useRef<ThreeGroup>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const b = bar.current;
    if (!b) return;
    const goal = gate.open ? -Math.PI / 2.2 : 0;
    b.rotation.z += (goal - b.rotation.z) * (still ? 1 : Math.min(1, dt * 4));
  });
  const x = GX0 + index * GATE_PITCH;
  const color = !reached ? O2.steel : gate.open ? P.teal : P.rose;
  return (
    <group position={[x, 0, 0]}>
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} position={[0, 0.5, z]} castShadow>
          <boxGeometry args={[0.14, 1.0, 0.14]} />
          <meshPhysicalMaterial color={mixHex(P.paper, color, 0.55)} roughness={0.38} clearcoat={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 1.04, 0]} castShadow>
        <boxGeometry args={[0.2, 0.1, 1.3]} />
        <meshStandardMaterial color={O2.brass} metalness={0.75} roughness={0.28} />
      </mesh>
      {/* Barrier arm pivoting on the near post. */}
      <group position={[0, 0.42, 0.55]}>
        <group ref={bar} rotation={[0, 0, gate.open ? -Math.PI / 2.2 : 0]}>
          <mesh position={[0, 0, -0.55]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
            <meshStandardMaterial color={gate.open ? P.teal : P.rose} roughness={0.4} />
          </mesh>
        </group>
      </group>
      <Tag position={[0, 1.35, 0]} tone={!reached ? "muted" : gate.open ? "teal" : "rose"} size="xs" center>{gate.label}</Tag>
    </group>
  );
}

function CommandToken({ x, label, blocked }: { x: number; label: string; blocked: boolean }) {
  const ref = useRef<ThreeGroup>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.x += (x - g.position.x) * (still ? 1 : Math.min(1, dt * 2.5));
  });
  return (
    <group ref={ref} position={[x, 0, 0]}>
      <RoundedBox args={[0.62, 0.34, 0.5]} position={[0, 0.27, 0]} radius={0.08} smoothness={3} castShadow>
        <meshPhysicalMaterial color={blocked ? mixHex(P.paper, P.rose, 0.45) : mixHex(P.paper, P.violet, 0.5)} roughness={0.35} clearcoat={0.6} />
      </RoundedBox>
      <Tag position={[0, 0.72, 0]} tone={blocked ? "rose" : "violet"} size="xs" center>
        <span className="normal-case">{label}</span>
      </Tag>
    </group>
  );
}

function GatesScene({ policy }: { policy: Policy }) {
  const gates = evaluate(policy);
  const firstClosed = gates.findIndex((g) => !g.open);
  const passed = firstClosed < 0;
  const tokenX = passed ? GX0 + gates.length * GATE_PITCH + 0.4 : GX0 + firstClosed * GATE_PITCH - 0.62;
  const endX = GX0 + gates.length * GATE_PITCH + 0.4;
  return (
    <group>
      <ShadowBlob position={[0.4, -0.38, 0]} scale={11} opacity={0.12} />
      <RoundedBox args={[10.4, 0.3, 3.6]} position={[0.4, -0.2, 0.2]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={O2.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[10.0, 0.07, 3.2]} position={[0.4, -0.02, 0.2]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={O2.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {/* Track from the node to node.invoke. */}
      <RoundedBox args={[9.4, 0.06, 0.8]} position={[0.4, 0.03, 0]} radius={0.02} smoothness={2} receiveShadow>
        <meshStandardMaterial color={O2.ceramic} roughness={0.6} />
      </RoundedBox>
      {[-0.36, 0.36].map((z) => (
        <mesh key={z} position={[0.4, 0.08, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 9.4, 10]} />
          <meshStandardMaterial color={O2.brass} metalness={0.75} roughness={0.28} />
        </mesh>
      ))}
      <group position={[GX0 - 1.2, 0, 0]}>
        <RoundedBox args={[0.9, 0.5, 0.9]} position={[0, 0.25, 0]} radius={0.08} smoothness={3} castShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.3)} roughness={0.4} clearcoat={0.45} />
        </RoundedBox>
        <Tag position={[0, 0.8, 0]} tone="violet" size="xs" center>{"nodo " + PLATFORM_LABEL[policy.platform] + " " + policy.version}</Tag>
      </group>
      {gates.map((g, i) => (
        <GateArch key={g.key} index={i} gate={g} reached={firstClosed < 0 || i <= firstClosed} />
      ))}
      <CommandToken x={tokenX} label={policy.cmd} blocked={!passed} />
      <group position={[endX + 0.9, 0, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.5, 0.6, 32]} />
          <meshPhysicalMaterial color={passed ? mixHex(P.paper, P.teal, 0.5) : "#d6d2c8"} roughness={0.38} clearcoat={0.5} />
        </mesh>
        <Tag position={[0, 0.9, 0]} tone={passed ? "teal" : "muted"} size="xs" center>node.invoke</Tag>
      </group>
      {!passed ? <Tag position={[GX0 + firstClosed * GATE_PITCH, 0.1, 1.2]} tone="rose" size="xs" center>{gates[firstClosed].why}</Tag> : null}
    </group>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => onChange(!on)} className={`rounded-full border px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] ${on ? "border-teal text-teal" : "border-line text-muted"}`}>
      {(on ? "✓ " : "✗ ") + label}
    </button>
  );
}

function SpanishVisual() {
  const [platform, setPlatform] = useState<Platform>("android");
  const [cmd, setCmd] = useState<Cmd>("sms.send");
  const [version, setVersion] = useState<Version>("v4");
  const [paired, setPaired] = useState(true);
  const [declared, setDeclared] = useState(true);
  const [allow, setAllow] = useState(false);
  const [deny, setDeny] = useState(false);
  const policy: Policy = { platform, cmd, version, paired, declared, allow, deny };
  const gates = evaluate(policy);
  const firstClosed = gates.findIndex((g) => !g.open);
  const passed = firstClosed < 0;
  return (
    <Figure
      label="Dos puertas y un pairing: qué command llega al nodo"
      hint="versión · pairing · declarado · allowlist · deny"
      height="h-[420px] md:h-[500px]"
      legend={[
        { color: P.violet, label: "command" },
        { color: P.teal, label: "puerta abierta" },
        { color: P.rose, label: "puerta cerrada" },
      ]}
      note={
        <div className="space-y-3">
          <p>
            <strong>{passed ? `${cmd} llega a node.invoke.` : `${cmd} se detiene en la puerta «${gates[firstClosed].label}».`}</strong>{" "}
            {passed ? "Ha pasado versión, pairing, declaración, allowlist y deny." : gates[firstClosed].why.charAt(0).toUpperCase() + gates[firstClosed].why.slice(1) + "."}{" "}
            {cmd === "sms.send" && platform === "android" && !allow ? "Es el caso de la lección: el permiso del teléfono está concedido, pero la autorización del Gateway es independiente." : ""}
          </p>
          <Readout items={gates.map((g) => ({ label: g.label, value: g.open ? "abierta" : "cerrada", tone: g.open ? "var(--teal)" : "var(--rose)" }))} />
          <p className="text-xs text-muted">Techo por plataforma (extracto): iOS y Android camera.list y location.get; macOS además computer.act; Linux computer.act; watchOS ninguno de estos. system.run sólo como command de host de escritorio aprobado en el pairing. camera.snap y sms.send son peligrosos: siempre exigen gateway.nodes.commands.allow. Un nodo v3 sigue gestionable, pero oculta caps de plugins.</p>
        </div>
      }
      controls={
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Switcher value={platform} onChange={setPlatform} ariaLabel="Plataforma del nodo" options={(Object.keys(PLATFORM_LABEL) as Platform[]).map((k) => ({ value: k, label: PLATFORM_LABEL[k], tone: P.violet }))} />
            <Switcher value={version} onChange={setVersion} ariaLabel="Versión del protocolo del nodo" options={[{ value: "v4", label: "v4", tone: P.teal }, { value: "v3", label: "v3", tone: P.amber }, { value: "v2", label: "v2", tone: P.rose }]} />
          </div>
          <Switcher value={cmd} onChange={setCmd} ariaLabel="Command" options={(["camera.list", "location.get", "computer.act", "camera.snap", "sms.send", "system.run"] as Cmd[]).map((c) => ({ value: c, label: c, tone: DANGEROUS.includes(c) ? P.rose : P.violet }))} />
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Toggle on={paired} onChange={setPaired} label="pairing aprobado" />
            <Toggle on={declared} onChange={setDeclared} label="declarado" />
            <Toggle on={allow} onChange={setAllow} label="commands.allow" />
            <Toggle on={deny} onChange={setDeny} label="commands.deny" />
          </div>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.2, 5.0, 8.6], fov: 32 }} fit={1.03}>
        <GatesScene policy={policy} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

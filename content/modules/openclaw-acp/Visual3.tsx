"use client";

import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import type { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, PointerTilt, ShadowBlob, Tag, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * "Comparar, sin mezclar knobs" is the longest unillustrated stretch in
 * the course — around 1,700 words asking the reader to hold three
 * surfaces, two products and one protocol name in their head at once.
 *
 * All the facts here come from that section: which side runs the loop,
 * which way each surface points, and the specific paste the docs warn
 * against.
 */

const SURFACES_EN: Surface[] = [
  {
    name: "hermes acp",
    role: "server",
    note: "an ACP server that wraps AIAgent over stdio and runs the loop in-process",
    knobs: ["use_unstable_protocol"],
    color: P.violet,
  },
  {
    name: "openclaw acp",
    role: "server",
    note: "also an ACP server, but it forwards to a Gateway session instead of running the loop itself",
    knobs: ["acp.backend", "acp.dispatch.enabled"],
    color: P.teal,
  },
  {
    name: "/acp spawn",
    role: "client",
    note: "the other direction: OpenClaw is the client, starting an external harness on the host",
    knobs: ["runtime", "mode", "cwd", "resumeSessionId"],
    color: P.amber,
  },
];

const SURFACES_ES: Surface[] = [
  {
    name: "hermes acp",
    role: "server",
    note: "un servidor ACP que envuelve AIAgent por stdio y corre el bucle in-process",
    knobs: ["use_unstable_protocol"],
    color: P.violet,
  },
  {
    name: "openclaw acp",
    role: "server",
    note: "también servidor ACP, pero reenvía a una sesión del Gateway en vez de correr el bucle",
    knobs: ["acp.backend", "acp.dispatch.enabled"],
    color: P.teal,
  },
  {
    name: "/acp spawn",
    role: "client",
    note: "la otra dirección: OpenClaw es el cliente y arranca un harness externo en el host",
    knobs: ["runtime", "mode", "cwd", "resumeSessionId"],
    color: P.amber,
  },
];

function LegacyVisual() {
  const t = useCopy({
    en: {
      surfaces: SURFACES_EN,
      copy: {
        title: "three shapes, two products, one protocol name",
        hint: "click a plinth · the arrow is the direction calls travel",
        note: "The name ACP is the only thing all three share. Each plinth owns its own knobs, and a knob only means something on the surface it belongs to.",
        roles: { server: "server", client: "client", bridge: "bridge" },
        knobsLabel: "knobs",
        hazard: { text: "do not paste across", from: 0, to: 1 },
      },
    },
    es: {
      surfaces: SURFACES_ES,
      copy: {
        title: "tres formas, dos productos, un nombre de protocolo",
        hint: "pulsa una peana · la flecha es la dirección de las llamadas",
        note: "El nombre ACP es lo único que comparten las tres. Cada peana tiene sus propios mandos, y un mando solo significa algo en la superficie a la que pertenece.",
        roles: { server: "servidor", client: "cliente", bridge: "puente" },
        knobsLabel: "mandos",
        hazard: { text: "no pegar de una a otra", from: 0, to: 1 },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * Tres superficies con el mismo nombre de protocolo. Cada peana lleva sus
 * propios mandos; un mando elegido solo encaja en la peana que lo posee.
 * La flecha dice quién llama a quién y el anillo, dónde corre el bucle.
 * Asignación de mandos tomada de la lección (puente: flags de openclaw acp;
 * spawn: acp.backend, dispatch, runtime acp; Hermes: use_unstable_protocol).
 */

type SurfaceId = "hermes" | "bridge" | "spawn";
type KnobId = "unstable" | "tokenfile" | "session" | "backend" | "dispatch" | "runtime";

const SURF: Record<SurfaceId, { name: string; role: string; color: string; loop: string; dir: string }> = {
  hermes: { name: "hermes acp", role: "servidor", color: P.violet, loop: "en el proceso (AIAgent)", dir: "editor → Hermes" },
  bridge: { name: "openclaw acp", role: "servidor", color: P.teal, loop: "en la sesión del Gateway", dir: "editor → puente → Gateway" },
  spawn: { name: "/acp spawn", role: "cliente", color: P.amber, loop: "en el harness externo", dir: "OpenClaw → harness" },
};
const KNOBS: Record<KnobId, { label: string; owner: SurfaceId }> = {
  unstable: { label: "use_unstable_protocol", owner: "hermes" },
  tokenfile: { label: "--token-file", owner: "bridge" },
  session: { label: "--session", owner: "bridge" },
  backend: { label: "acp.backend", owner: "spawn" },
  dispatch: { label: "acp.dispatch.enabled", owner: "spawn" },
  runtime: { label: "runtime: \"acp\"", owner: "spawn" },
};
const SURF_X: Record<SurfaceId, number> = { hermes: -3.3, bridge: 0, spawn: 3.3 };

function check(surface: SurfaceId, knob: KnobId) {
  const owner = KNOBS[knob].owner;
  return { owner, fits: owner === surface };
}

const K3 = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };

function KMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}
const toneFor = (c: string) => (c === P.violet ? "violet" : c === P.teal ? "teal" : "amber") as "violet" | "teal" | "amber";

function LoopRing({ position, color }: { position: V3; color: string }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (ref.current && !still) ref.current.rotation.z -= dt * 1.4;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <torusGeometry args={[0.2, 0.035, 10, 36, Math.PI * 1.6]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
    </group>
  );
}

function SmallBox({ position, color, label }: { position: V3; color: string; label: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.7, 0.5, 0.55]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <KMat color={mixHex(P.paper, color, 0.25)} />
      </RoundedBox>
      <Tag position={[0, -0.05, 0.4]} tone="muted" size="xs" center>{label}</Tag>
    </group>
  );
}

/* Peana: columna con panel frontal y un zócalo por cada mando que posee. */
function Plinth({ id, selected }: { id: SurfaceId; selected: boolean }) {
  const s = SURF[id];
  const x = SURF_X[id];
  const owned = (Object.keys(KNOBS) as KnobId[]).filter((k) => KNOBS[k].owner === id);
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox position={[0, -0.52, 0]} args={[1.9, 0.18, 1.7]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <KMat color={K3.ceramic} rough={0.55} clear={0.3} />
      </RoundedBox>
      <RoundedBox position={[0, 0.05, -0.15]} args={[1.35, 1.0, 1.0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <KMat color={mixHex(P.paper, s.color, selected ? 0.5 : 0.2)} clear={selected ? 0.6 : 0.3} />
      </RoundedBox>
      {owned.map((k, i) => {
        const kx = (i - (owned.length - 1) / 2) * 0.4;
        return (
          <group key={k} position={[kx, -0.2, 0.37]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
              <meshStandardMaterial color={K3.graphite} metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.1, 0.1, 24]} />
              <meshStandardMaterial color={K3.brass} metalness={0.75} roughness={0.28} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[0, 0.22, 0.42]} tone={selected ? toneFor(s.color) : "muted"} center>{s.name}</Tag>
    </group>
  );
}

/* Mando suelto: baja a su zócalo si la peana es la suya; si no, flota. */
function ProbeKnob({ surface, knob }: { surface: SurfaceId; knob: KnobId }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const { fits } = check(surface, knob);
  const target: V3 = [SURF_X[surface], fits ? 0.72 : 1.55, 0.25];
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : Math.min(1, dt * 3);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.y += (target[1] - g.position.y) * k;
  });
  const color = fits ? P.teal : P.rose;
  return (
    <group ref={ref} position={target}>
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.2, 32]} />
        <KMat color={mixHex(P.paper, color, 0.55)} clear={0.7} />
      </mesh>
      <mesh position={[0, 0.12, 0.12]}>
        <boxGeometry args={[0.05, 0.04, 0.18]} />
        <meshStandardMaterial color={K3.graphite} />
      </mesh>
      <Tag position={[0, 0.4, 0]} tone={fits ? "teal" : "rose"} size="xs" center>{fits ? "encaja" : "no aplica"}</Tag>
    </group>
  );
}

function CompareBench({ surface, knob }: { surface: SurfaceId; knob: KnobId }) {
  const hx = SURF_X.hermes, bx = SURF_X.bridge, sx = SURF_X.spawn;
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.1, 0]}>
        <ShadowBlob position={[0, -0.98, 0]} scale={11} opacity={0.12} />
        <RoundedBox position={[0, -0.8, 0.4]} args={[10.6, 0.36, 3.6]} radius={0.17} smoothness={4} castShadow receiveShadow>
          <KMat color={K3.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.58, 0.4]} args={[10.25, 0.08, 3.3]} radius={0.04} smoothness={3} receiveShadow>
          <KMat color={K3.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        {(Object.keys(SURF) as SurfaceId[]).map((id) => <Plinth key={id} id={id} selected={id === surface} />)}
        {/* Hermes: el editor llama y el bucle corre dentro */}
        <SmallBox position={[hx - 1.0, -0.3, 1.6]} color={P.inkSoft} label="editor" />
        <Arrow from={[hx - 0.65, -0.1, 1.35]} to={[hx - 0.35, -0.1, 0.6]} color={P.violet} width={1.5} head={0.08} />
        <LoopRing position={[hx + 0.55, 0.62, 0.0]} color={P.violet} />
        {/* puente: editor → openclaw acp → Gateway, donde corre el bucle */}
        <SmallBox position={[bx - 1.0, -0.3, 1.6]} color={P.inkSoft} label="editor" />
        <SmallBox position={[bx + 1.0, -0.3, 1.6]} color={P.violet} label="Gateway" />
        <Arrow from={[bx - 0.65, -0.1, 1.35]} to={[bx - 0.35, -0.1, 0.6]} color={P.teal} width={1.5} head={0.08} />
        <Arrow from={[bx + 0.35, -0.1, 0.6]} to={[bx + 0.65, -0.1, 1.35]} color={P.teal} width={1.5} head={0.08} />
        <LoopRing position={[bx + 1.0, 0.25, 1.6]} color={P.violet} />
        {/* spawn: OpenClaw arranca el harness, que lleva su bucle */}
        <SmallBox position={[sx + 1.0, -0.3, 1.6]} color={P.amber} label="harness" />
        <Arrow from={[sx + 0.35, -0.1, 0.6]} to={[sx + 0.65, -0.1, 1.35]} color={P.amber} width={1.5} head={0.08} />
        <LoopRing position={[sx + 1.0, 0.25, 1.6]} color={P.amber} />
        <ProbeKnob surface={surface} knob={knob} />
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [surface, setSurface] = useState<SurfaceId>("spawn");
  const [knob, setKnob] = useState<KnobId>("unstable");
  const c = check(surface, knob);
  const s = SURF[surface];
  const owner = SURF[c.owner];
  return (
    <Figure
      label="Tres formas, dos productos, un nombre de protocolo"
      hint="elige peana y mando · la flecha es la dirección de las llamadas"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.violet, label: "hermes acp · bucle" },
        { color: P.teal, label: "openclaw acp (puente)" },
        { color: P.amber, label: "/acp spawn" },
        { color: P.rose, label: "mando fuera de su peana" },
      ]}
      controls={
        <>
          <Switcher value={surface} onChange={setSurface} ariaLabel="Superficie ACP" options={(Object.keys(SURF) as SurfaceId[]).map((id) => ({ value: id, label: SURF[id].name, tone: SURF[id].color }))} />
          <Switcher value={knob} onChange={setKnob} ariaLabel="Mando a probar" options={(Object.keys(KNOBS) as KnobId[]).map((id) => ({ value: id, label: KNOBS[id].label, tone: SURF[KNOBS[id].owner].color }))} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            <strong>{s.name}</strong> es {s.role} ACP ({s.dir}); el bucle corre {s.loop}.{" "}
            {c.fits
              ? <>El mando <code>{KNOBS[knob].label}</code> es suyo y encaja.</>
              : <>El mando <code>{KNOBS[knob].label}</code> pertenece a <strong>{owner.name}</strong>: aquí no significa nada. {knob === "unstable" && surface === "spawn" ? "Es justo el pegado que la lección prohíbe: use_unstable_protocol de Hermes no va en acp.backend." : ""}</>}
          </p>
          <Readout items={[{ label: "rol", value: s.role, tone: "var(--ink)" }, { label: "bucle", value: s.loop, tone: "var(--violet)" }, { label: "dueño del mando", value: owner.name, tone: c.fits ? "var(--teal)" : "var(--rose)" }]} />
          <p className="text-xs text-muted">Hermes es solo la flecha servidor. OpenClaw es servidor hacia editores (openclaw acp) y cliente hacia harnesses (/acp spawn con acpx). Cita <em>ACP</em> para el puente y <em>ACP agents</em> para el spawn.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 4.6, 10.0], fov: 34 }} fit={1.06}>
        <CompareBench surface={surface} knob={knob} />
      </Stage>
    </Figure>
  );
}

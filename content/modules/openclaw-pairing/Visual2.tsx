"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Flow, Lattice, ShadowBlob, Wire, hash, type Cell, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "doors" | "dm" | "node";
const COPY = {
  en: { title: "pairing means two explicit doors", hint: "DM access · node access · stores", doors: "two doors", dm: "DM", node: "node", person: "person", device: "device", approve: "approve", group: "groups stay separate", store: "SQLite store", code: "short code" },
  es: { title: "pairing significa dos puertas explícitas", hint: "acceso DM · acceso nodo · stores", doors: "dos puertas", dm: "DM", node: "nodo", person: "persona", device: "dispositivo", approve: "aprueba", group: "grupos van aparte", store: "store SQLite", code: "código corto" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("doors");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.dm }, { color: P.violet, label: t.node }, { color: P.amber, label: t.approve }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "doors", label: t.doors, tone: P.teal }, { value: "dm", label: t.dm, tone: P.violet }, { value: "node", label: t.node, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "doors" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.dm}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.node}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.person} ≠ {t.device}</Tag></>}
        {mode === "dm" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.76, 0.15]} tone="teal">{t.person}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.4} /><Tag position={[1.7, 0.76, 0.15]} tone="amber">{t.code}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">aprobar DM no abre grupos</Tag></>}
        {mode === "node" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="violet">{t.store}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">request</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">{t.approve}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">pairing ≠ approval de commands</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type NodeGate = "pendiente" | "aprobado";
type Meta = "iguales" | "cambian";

const BOOTSTRAP_TTL = 10;
const QUEUED = 3;
const STEPS = [
  { id: "setup", label: "setup code" },
  { id: "challenge", label: "connect.challenge" },
  { id: "device", label: "dispositivo" },
  { id: "node", label: "pairing de nodo" },
  { id: "commands", label: "commands" },
] as const;

function pairingModel(scan: number, gate: NodeGate, meta: Meta) {
  const tokenLeft = BOOTSTRAP_TTL - scan;
  const expired = tokenLeft <= 0;
  // reached = index of the last step the device gets through (inclusive)
  let reached = 4;
  let blockedAt: number | null = null;
  let why = "";
  if (expired) {
    reached = 0; blockedAt = 0;
    why = `El bootstrapToken caduca a los ${BOOTSTRAP_TTL} min y se escaneó en el min ${scan}: el setup code ya no vale. Es el caso de la lección: generar uno nuevo y escanearlo a tiempo; /pair cleanup invalida los que sobran.`;
  } else if (meta === "cambian") {
    reached = 1; blockedAt = 2;
    why = "La firma v3 del nonce ata platform y deviceFamily. En el reconnect no coinciden con los metadatos emparejados: el Gateway exige repair pairing en lugar de dar acceso más amplio en silencio.";
  } else if (gate === "pendiente") {
    reached = 2; blockedAt = 3;
    why = `El dispositivo está emparejado y tiene device token, pero desde 2026.3.31 los commands de nodo siguen deshabilitados hasta aprobar el pairing de nodo. Los ${QUEUED} invokes en cola se descartan, no se aplazan.`;
  } else {
    why = "Las dos puertas están abiertas: dispositivo emparejado y pairing de nodo aprobado. Los commands vivos son los que el nodo declaró en connect, filtrados por gateway.nodes.commands.allow/deny; system.run sigue su propia política en el nodo.";
  }
  return { tokenLeft, expired, reached, blockedAt, why, discarded: gate === "pendiente" && !expired && meta === "iguales" ? QUEUED : 0 };
}

function SpanishVisual() {
  const [scan, setScan] = useState(4);
  const [gate, setGate] = useState<NodeGate>("pendiente");
  const [meta, setMeta] = useState<Meta>("iguales");
  const m = useMemo(() => pairingModel(scan, gate, meta), [scan, gate, meta]);
  return (
    <Figure
      label="Pairing de nodo · la escalera de confianza"
      hint="setup code → challenge → dispositivo → nodo"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.teal, label: "superado" },
        { color: P.rose, label: "bloqueo" },
        { color: P.violet, label: "firma / token" },
        { color: "#B9B5A9", label: "sin alcanzar" },
      ]}
      note={<PairNote m={m} scan={scan} />}
      controls={
        <>
          <Knob label="escaneo (min)" value={scan} min={0} max={15} onChange={setScan} tone="var(--violet)" />
          <Switcher value={meta} onChange={setMeta} ariaLabel="Metadatos en el reconnect" options={[{ value: "iguales", label: "metadatos iguales", tone: P.teal }, { value: "cambian", label: "platform cambia", tone: P.rose }]} />
          <Switcher value={gate} onChange={setGate} ariaLabel="Pairing de nodo" options={[{ value: "pendiente", label: "nodo pendiente", tone: P.amber }, { value: "aprobado", label: "nodo aprobado", tone: P.teal }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1, 2.4, 11.5], fov: 35 }} fit={1.0}>
        <StairScene m={m} />
      </Stage>
    </Figure>
  );
}

type Model = ReturnType<typeof pairingModel>;

function PairNote({ m, scan }: { m: Model; scan: number }) {
  return (
    <div className="space-y-3">
      <p><strong>{m.blockedAt === null ? "Nodo operativo." : `Se detiene en «${STEPS[m.blockedAt].label}».`}</strong> {m.why}</p>
      <Readout
        items={[
          { label: "escaneo", value: `min ${scan}`, tone: "var(--violet)" },
          { label: "bootstrapToken", value: m.expired ? "caducado" : `quedan ${m.tokenLeft} min`, tone: m.expired ? "var(--rose)" : "var(--teal)" },
          { label: "peldaños superados", value: `${m.blockedAt === null ? 5 : m.blockedAt} de 5`, tone: "var(--ink)" },
          { label: "invokes descartados", value: String(m.discarded), tone: "var(--amber)" },
        ]}
      />
      <p className="text-xs text-muted">Cifras de <em>Pairing</em> y <em>Node pairing</em>: bootstrapToken de un solo uso, 10 min; peticiones de dispositivo pendientes caducan a los 5 min; commands de nodo deshabilitados hasta el pairing de nodo desde 2026.3.31. El patrón del QR es decorativo, no un payload real.</p>
    </div>
  );
}

const K = { base: "#2D3436", baseTop: "#3B4548", steel: "#8C9895", steelDark: "#4E5A59", brass: "#B7833E", grey: "#B9B5A9" };
const stepX = (i: number) => -3.7 + i * 1.85;
const stepY = (i: number) => -1.05 + i * 0.34;

function stepColor(i: number, m: Model) {
  if (m.blockedAt === null || i < m.blockedAt) return P.teal;
  if (i === m.blockedAt) return P.rose;
  return K.grey;
}

const QR: Cell[] = (() => {
  const cells: Cell[] = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const finder = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      if (finder || hash(r * 9 + c, 3) > 0.52) cells.push({ position: [(c - 4) * 0.1, 0, (r - 4) * 0.1], color: finder ? P.ink : P.inkSoft });
    }
  return cells;
})();

function Platform({ i, m, label }: { i: number; m: Model; label: string }) {
  const col = stepColor(i, m);
  const y = stepY(i);
  const h = y + 1.55;
  return (
    <group position={[stepX(i), 0, 0]}>
      <mesh position={[0, y - h / 2 - 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, h, 1.2]} />
        <meshStandardMaterial color={K.steelDark} metalness={0.35} roughness={0.5} />
      </mesh>
      <RoundedBox position={[0, y, 0]} args={[1.6, 0.18, 1.6]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(P.paper, col, 0.28)} roughness={0.45} clearcoat={0.45} />
      </RoundedBox>
      <mesh position={[0, y + 0.02, 0.81]}>
        <boxGeometry args={[1.3, 0.06, 0.02]} />
        <meshBasicMaterial color={col} />
      </mesh>
      <Tag position={[0, y - 0.42, 0.9]} tone={col === P.teal ? "teal" : col === P.rose ? "rose" : "muted"} size="xs" center>
        <span className="normal-case">{i + 1 + " · " + label}</span>
      </Tag>
    </group>
  );
}

function TokenRing({ frac, y }: { frac: number; y: number }) {
  return (
    <group position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.66, 0.025, 8, 64]} />
        <meshBasicMaterial color="#D8D2C4" />
      </mesh>
      {frac > 0 ? (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.66, 0.045, 8, 64, Math.PI * 2 * frac]} />
          <meshBasicMaterial color={frac < 0.3 ? P.rose : P.violet} />
        </mesh>
      ) : null}
    </group>
  );
}

function Pieces({ m }: { m: Model }) {
  const y = (i: number) => stepY(i) + 0.09;
  const reached = (i: number) => m.blockedAt === null || i < m.blockedAt;
  const gateOpen = m.blockedAt === null;
  return (
    <group>
      {/* 1 · setup code: QR payload on a stand, ring = bootstrapToken left */}
      <group position={[stepX(0), y(0), 0]}>
        <group position={[0, 0.5, 0]} rotation={[-0.9, 0, 0]}>
          <RoundedBox args={[1.05, 1.05, 0.06]} radius={0.03} smoothness={2} castShadow>
            <meshPhysicalMaterial color={m.expired ? "#D9D2D0" : "#F3EEE2"} roughness={0.5} clearcoat={0.3} />
          </RoundedBox>
          <group position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <Lattice cells={QR} size={0.085} />
          </group>
        </group>
        <TokenRing frac={Math.max(0, m.tokenLeft) / BOOTSTRAP_TTL} y={0.03} />
      </group>
      {/* 2 · connect.challenge: nonce coin signed by the device key */}
      <group position={[stepX(1), y(1), 0]}>
        <mesh position={[-0.25, 0.28, 0]} rotation={[Math.PI / 2, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.07, 40]} />
          <meshPhysicalMaterial color={K.brass} metalness={0.7} roughness={0.28} clearcoat={0.5} />
        </mesh>
        <group position={[0.32, 0.22, 0.1]} rotation={[0, 0, -0.5]}>
          <mesh castShadow><torusGeometry args={[0.1, 0.035, 10, 24]} /><meshStandardMaterial color={P.violet} metalness={0.3} roughness={0.35} /></mesh>
          <mesh position={[0, -0.24, 0]} castShadow><boxGeometry args={[0.05, 0.3, 0.05]} /><meshStandardMaterial color={P.violet} metalness={0.3} roughness={0.35} /></mesh>
        </group>
        <Tag position={[-0.25, 0.72, 0.2]} tone="violet" size="xs" center>firma v3</Tag>
      </group>
      {/* 3 · device approval: the phone and the device token it receives */}
      <group position={[stepX(2), y(2), 0]}>
        <RoundedBox position={[-0.25, 0.42, -0.1]} args={[0.42, 0.76, 0.07]} radius={0.05} smoothness={3} castShadow>
          <meshPhysicalMaterial color={K.base} roughness={0.35} clearcoat={0.6} />
        </RoundedBox>
        <mesh position={[-0.25, 0.44, -0.06]}><planeGeometry args={[0.34, 0.6]} /><meshBasicMaterial color={reached(2) ? mixHex(P.paper, P.teal, 0.4) : "#6B7275"} /></mesh>
        <RoundedBox position={[0.35, 0.12, 0.2]} args={[0.5, 0.05, 0.32]} radius={0.02} smoothness={2} castShadow visible={reached(2)}>
          <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.35)} roughness={0.4} clearcoat={0.5} />
        </RoundedBox>
      </group>
      {/* 4 · node pairing gate (2026.3.31): a barrier that lifts on approval */}
      <NodeBarrier open={gateOpen} x={stepX(3)} y={y(3)} blocked={m.blockedAt === 3} />
      {/* 5 · declared commands: lit only once both doors are open */}
      <group position={[stepX(4), y(4), 0]}>
        <RoundedBox position={[0, 0.42, -0.3]} args={[1.2, 0.72, 0.1]} radius={0.04} smoothness={2} castShadow>
          <meshPhysicalMaterial color="#E8E3D6" roughness={0.45} clearcoat={0.4} />
        </RoundedBox>
        {["camera", "screen", "system.run"].map((c, k) => (
          <group key={c} position={[-0.38 + k * 0.38, 0.42, -0.23]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.11, 0.11, 0.06, 24]} /><meshStandardMaterial color={gateOpen ? (k === 2 ? P.amber : P.teal) : "#9AA0A3"} emissive={gateOpen ? (k === 2 ? P.amber : P.teal) : "#000"} emissiveIntensity={0.25} /></mesh>
          </group>
        ))}
        <Tag position={[0, 0.98, -0.2]} tone={gateOpen ? "teal" : "muted"} size="xs" center>camera · screen · run</Tag>
      </group>
    </group>
  );
}

function NodeBarrier({ open, x, y, blocked }: { open: boolean; x: number; y: number; blocked: boolean }) {
  const arm = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!arm.current) return;
    const target = open ? 1.25 : 0;
    arm.current.rotation.z = still ? target : MathUtils.damp(arm.current.rotation.z, target, 4, dt);
  });
  const col = blocked ? P.rose : open ? P.teal : K.grey;
  return (
    <group position={[x, y, 0]}>
      <RoundedBox position={[-0.58, 0.35, 0.2]} args={[0.2, 0.7, 0.2]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color={K.steel} metalness={0.55} roughness={0.34} />
      </RoundedBox>
      <group ref={arm} position={[-0.58, 0.62, 0.32]}>
        <mesh position={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[1.2, 0.09, 0.07]} />
          <meshStandardMaterial color={col} roughness={0.4} />
        </mesh>
      </group>
      {/* padlock body + shackle */}
      <group position={[0.3, 0.25, -0.2]}>
        <RoundedBox args={[0.34, 0.28, 0.16]} radius={0.04} smoothness={2} castShadow>
          <meshPhysicalMaterial color={K.brass} metalness={0.7} roughness={0.28} clearcoat={0.4} />
        </RoundedBox>
        <mesh position={[0, open ? 0.26 : 0.17, 0]}><torusGeometry args={[0.1, 0.028, 10, 24, Math.PI]} /><meshStandardMaterial color={K.steel} metalness={0.7} roughness={0.3} /></mesh>
      </group>
      <Tag position={[0.3, 0.86, -0.2]} tone={blocked ? "rose" : open ? "teal" : "muted"} size="xs" center>desde 2026.3.31</Tag>
    </group>
  );
}

/** The device's request walking up the stairs until it is stopped. */
function Walker({ m }: { m: Model }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const path = useMemo<V3[]>(() => {
    const end = m.blockedAt === null ? 4 : m.blockedAt;
    const pts: V3[] = [[stepX(0) - 1.1, stepY(0) + 0.3, 0.55]];
    for (let i = 0; i <= end; i++) pts.push([stepX(i) - (i === m.blockedAt ? 0.62 : 0), stepY(i) + 0.3, 0.55]);
    return pts;
  }, [m.blockedAt]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = still ? 1 : Math.min(1, ((clock.elapsedTime * 0.22) % 1.25));
    const f = t * (path.length - 1);
    const i = Math.min(path.length - 2, Math.floor(f));
    const k = f - i;
    const a = path[i];
    const b = path[i + 1];
    ref.current.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * 0.18, a[2]);
  });
  return (
    <group ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[0.12, 24, 16]} />
        <meshPhysicalMaterial color={m.blockedAt === null ? P.teal : P.violet} roughness={0.3} clearcoat={0.7} />
      </mesh>
    </group>
  );
}

function StairScene({ m }: { m: Model }) {
  return (
    <group>
      <ShadowBlob position={[0, -1.72, 0.1]} scale={10} opacity={0.1} />
      <RoundedBox position={[0, -1.6, 0]} args={[10.4, 0.24, 2.3]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={K.base} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {STEPS.map((st, i) => <Platform key={st.id} i={i} m={m} label={st.label} />)}
      <Pieces m={m} />
      <Walker m={m} />
      {m.blockedAt !== null ? (
        <Wire points={[[stepX(m.blockedAt) - 0.8, stepY(m.blockedAt) + 0.12, 0.82], [stepX(m.blockedAt) - 0.8, stepY(m.blockedAt) + 0.75, 0.82]]} color={P.rose} width={3} />
      ) : (
        <Flow points={[[stepX(0), stepY(0) + 0.3, 0.55], [stepX(4), stepY(4) + 0.3, 0.55]]} color={P.teal} count={3} size={0.03} speed={0.25} lineOpacity={0.3} />
      )}
    </group>
  );
}

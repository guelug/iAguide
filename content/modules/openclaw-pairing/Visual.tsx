"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { PointerTilt, ShadowBlob, hash } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "a" | "b" | "c" | "d" | "e";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "dm_code": "DM code",
      "device": "device",
      "challenge": "challenge",
      "setup_qr": "setup QR",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "dm_code": "código DM",
      "device": "dispositivo",
      "challenge": "reto",
      "setup_qr": "QR de setup",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: t.dm_code, tone: "var(--teal)" },
    { value: "b" as const, label: t.device, tone: "var(--teal)" },
    { value: "c" as const, label: t.challenge, tone: "var(--amber)" },
    { value: "d" as const, label: t.setup_qr, tone: "var(--violet)" },
    { value: "e" as const, label: "sqlite", tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: DM pairing and devices"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-pairing diagram steps"
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
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.dm_code}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.device}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.challenge}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.setup_qr}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        sqlite
      </Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Status = "espera" | "pendiente" | "ignorado" | "caducado" | "aprobado";

const TTL = 60;
const CAP = 3;
const APPROVE_AT = 25;
/* Arrival minutes are teaching data chosen so the three-request cap and the
   one-hour expiry both bite inside the slider's range. */
const SENDERS = [
  { id: "A", at: 0 },
  { id: "B", at: 10 },
  { id: "C", at: 20 },
  { id: "D", at: 30 },
  { id: "E", at: 45 },
  { id: "F", at: 75 },
];
// Eight characters, upper case, no 0/O/1/I: the rule from the pairing page.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codeFor = (i: number) => Array.from({ length: 8 }, (_, k) => ALPHABET[Math.floor(hash(i * 8 + k, 7) * ALPHABET.length)]).join("");
const CODES = SENDERS.map((_, i) => codeFor(i));

type SenderState = { id: string; at: number; status: Status; created?: number; remaining?: number; slot?: number; code: string };

function simulate(t: number, count: number, approveA: boolean) {
  const senders = SENDERS.slice(0, count);
  const state: SenderState[] = senders.map((s, i) => ({ ...s, status: "espera", code: CODES[i] }));
  const slots: (number | null)[] = Array.from({ length: CAP }, () => null);
  const log: string[] = [];
  for (let m = 0; m <= t; m++) {
    state.forEach((s, i) => {
      if (s.status === "pendiente" && s.created !== undefined && s.created + TTL <= m) {
        s.status = "caducado";
        slots[s.slot!] = null;
        log.push(`min ${m}: caduca ${s.id}`);
      }
      void i;
    });
    if (approveA && m === APPROVE_AT && state[0]?.status === "pendiente") {
      state[0].status = "aprobado";
      slots[state[0].slot!] = null;
      log.push(`min ${m}: se aprueba A`);
    }
    state.forEach((s, i) => {
      if (s.at !== m) return;
      const free = slots.findIndex((x) => x === null);
      if (free < 0) {
        s.status = "ignorado";
        log.push(`min ${m}: ${s.id} ignorado (3 pendientes)`);
      } else {
        s.status = "pendiente";
        s.created = m;
        s.slot = free;
        slots[free] = i;
        log.push(`min ${m}: ${s.id} recibe código`);
      }
    });
  }
  state.forEach((s) => {
    if (s.status === "pendiente" && s.created !== undefined) s.remaining = s.created + TTL - t;
  });
  return { state, slots, log };
}

const STATUS_COLOR: Record<Status, string> = {
  espera: "#B9B5A9",
  pendiente: P.amber,
  ignorado: P.rose,
  caducado: "#7B8189",
  aprobado: P.teal,
};
const STATUS_TONE: Record<Status, "muted" | "amber" | "rose" | "ink" | "teal"> = {
  espera: "muted",
  pendiente: "amber",
  ignorado: "rose",
  caducado: "muted",
  aprobado: "teal",
};

const W = { base: "#2D3436", baseTop: "#3B4548", steel: "#8C9895", steelDark: "#4E5A59", brass: "#B7833E", cabinet: "#DDD7C9", card: "#F3EEE2" };
const SENDER_X = -4.0;
const DOOR_X = -1.75;
const SLOT_X = (k: number) => 0.55 + k * 0.95;
const PENDING_Y = 0.62;
const ALLOW_Y = -0.72;
const senderY = (i: number) => 1.4 - i * 0.54;

function SenderPod({ s, index }: { s: SenderState; index: number }) {
  const y = senderY(index);
  const col = STATUS_COLOR[s.status];
  return (
    <group position={[SENDER_X, y, 0]}>
      <mesh position={[0, -0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.08, 24]} />
        <meshStandardMaterial color={W.steelDark} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <sphereGeometry args={[0.15, 28, 18]} />
        <meshPhysicalMaterial color={col} roughness={0.35} clearcoat={0.6} />
      </mesh>
      <Tag position={[0.3, 0.02, 0.1]} tone={STATUS_TONE[s.status]} size="xs">
        {s.id + " · " + s.status}
      </Tag>
    </group>
  );
}

function PendingCard({ s, slot }: { s: SenderState; slot: number }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const frac = Math.max(0, Math.min(1, (s.remaining ?? 0) / TTL));
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.y = still ? PENDING_Y : MathUtils.damp(ref.current.position.y, PENDING_Y, 7, dt);
  });
  return (
    <group ref={ref} position={[SLOT_X(slot), PENDING_Y + 0.6, 0.05]}>
      <RoundedBox args={[0.8, 0.5, 0.07]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(P.paper, P.amber, 0.16)} roughness={0.5} clearcoat={0.35} />
      </RoundedBox>
      <Tag position={[0, 0.07, 0.06]} tone="amber" size="xs" center>{s.code}</Tag>
      {/* remaining TTL, drawn to scale: the full bar is one hour */}
      <mesh position={[-0.33 + (0.66 * frac) / 2, -0.17, 0.045]}>
        <boxGeometry args={[Math.max(0.001, 0.66 * frac), 0.05, 0.015]} />
        <meshBasicMaterial color={frac < 0.25 ? P.rose : P.amber} />
      </mesh>
      <mesh position={[0, -0.17, 0.04]}>
        <boxGeometry args={[0.68, 0.06, 0.01]} />
        <meshBasicMaterial color="#D8D2C4" />
      </mesh>
    </group>
  );
}

function Door({ open }: { open: boolean }) {
  const leaf = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!leaf.current) return;
    const target = open ? -1.1 : 0;
    leaf.current.rotation.y = still ? target : MathUtils.damp(leaf.current.rotation.y, target, 4, dt);
  });
  return (
    <group position={[DOOR_X, 0, 0]}>
      {[-0.55, 0.55].map((z) => (
        <RoundedBox key={z} position={[0, 0.1, z]} args={[0.16, 2.6, 0.16]} radius={0.04} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={W.steel} metalness={0.55} roughness={0.34} />
        </RoundedBox>
      ))}
      <RoundedBox position={[0, 1.45, 0]} args={[0.22, 0.16, 1.32]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color={W.brass} metalness={0.65} roughness={0.3} />
      </RoundedBox>
      <group ref={leaf} position={[0, 0, -0.47]}>
        <RoundedBox position={[0, 0.1, 0.47]} args={[0.06, 2.3, 0.9]} radius={0.02} smoothness={2} castShadow receiveShadow>
          <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.22)} roughness={0.45} clearcoat={0.4} transparent opacity={0.9} />
        </RoundedBox>
      </group>
      <Tag position={[0, 1.78, 0]} tone="teal" size="xs" center>puerta DM</Tag>
    </group>
  );
}

function GroupGate() {
  return (
    <group position={[4.35, 0, -0.1]}>
      {[-0.4, 0.4].map((z) => (
        <mesh key={z} position={[0, -0.45, z]} castShadow>
          <boxGeometry args={[0.1, 1.9, 0.1]} />
          <meshStandardMaterial color={W.steelDark} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {[-0.95, -0.45, 0.05].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.07, 0.07, 0.8]} />
          <meshStandardMaterial color={P.rose} roughness={0.4} />
        </mesh>
      ))}
      <Tag position={[0, 0.78, 0]} tone="rose" size="xs" center>grupos: aparte</Tag>
    </group>
  );
}

function Cabinet() {
  const x0 = SLOT_X(0) - 0.62;
  const x1 = SLOT_X(CAP - 1) + 0.62;
  const cx = (x0 + x1) / 2;
  return (
    <group>
      <RoundedBox position={[cx, -0.05, -0.34]} args={[x1 - x0 + 0.2, 2.75, 0.12]} radius={0.05} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={W.cabinet} roughness={0.5} clearcoat={0.3} />
      </RoundedBox>
      {/* the store's drum cap, so the cabinet reads as one sqlite file */}
      <mesh position={[cx, 1.42, -0.05]} castShadow>
        <cylinderGeometry args={[(x1 - x0) / 2 - 0.1, (x1 - x0) / 2 - 0.1, 0.18, 48]} />
        <meshPhysicalMaterial color={W.steel} metalness={0.4} roughness={0.35} clearcoat={0.4} />
      </mesh>
      <Tag position={[cx, 1.78, 0.2]} tone="ink" size="xs" center>openclaw.sqlite</Tag>
      {[PENDING_Y - 0.3, ALLOW_Y - 0.3].map((y) => (
        <RoundedBox key={y} position={[cx, y, 0]} args={[x1 - x0, 0.08, 0.7]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={W.steelDark} metalness={0.5} roughness={0.35} />
        </RoundedBox>
      ))}
      {/* three physical slots: the cap on pending requests per channel account */}
      {Array.from({ length: CAP }, (_, k) => (
        <group key={k} position={[SLOT_X(k), PENDING_Y - 0.24, 0.05]}>
          {[-0.43, 0.43].map((dx) => (
            <mesh key={dx} position={[dx, 0.04, 0]}>
              <boxGeometry args={[0.04, 0.1, 0.36]} />
              <meshStandardMaterial color={W.brass} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
      <Tag position={[x0 - 0.05, PENDING_Y + 0.42, 0.3]} tone="amber" size="xs">peticiones · máx. 3</Tag>
      <Tag position={[x0 - 0.05, ALLOW_Y + 0.42, 0.3]} tone="teal" size="xs">permitidos · solo DM</Tag>
    </group>
  );
}

function PairingScene({ sim, t }: { sim: ReturnType<typeof simulate>; t: number }) {
  const approved = sim.state.filter((s) => s.status === "aprobado");
  const anyPending = sim.state.some((s) => s.status === "pendiente");
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[0, -2.02, 0.1]} scale={9.6} opacity={0.1} />
        <RoundedBox position={[0, -1.88, 0]} args={[10.2, 0.28, 2.2]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={W.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox position={[0, -1.71, 0]} args={[9.9, 0.06, 1.9]} radius={0.03} smoothness={2} receiveShadow>
          <meshStandardMaterial color={W.baseTop} roughness={0.45} metalness={0.2} />
        </RoundedBox>
        <mesh position={[SENDER_X, -0.3, -0.25]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 3.4, 0.08]} />
          <meshStandardMaterial color={W.steelDark} metalness={0.4} roughness={0.45} />
        </mesh>
        <Tag position={[SENDER_X, 1.95, 0]} tone="muted" size="xs" center>{"min " + t}</Tag>
        {sim.state.map((s, i) => (
          <SenderPod key={s.id} s={s} index={i} />
        ))}
        {sim.state.map((s, i) =>
          s.status === "pendiente" && s.slot !== undefined ? (
            <Flow key={"f" + s.id} points={[[SENDER_X + 0.2, senderY(i), 0.1], [DOOR_X - 0.3, (senderY(i) + PENDING_Y) / 2, 0.3], [DOOR_X + 0.3, PENDING_Y, 0.3], [SLOT_X(s.slot) - 0.35, PENDING_Y, 0.2]]} color={P.amber} count={2} size={0.035} speed={0.22} offset={i * 0.2} lineOpacity={0.45} />
          ) : s.status === "ignorado" ? (
            <Wire key={"f" + s.id} points={[[SENDER_X + 0.2, senderY(i), 0.1], [DOOR_X - 0.25, senderY(i), 0.1]]} color={P.rose} dashed opacity={0.6} />
          ) : null,
        )}
        <Door open={anyPending} />
        <Cabinet />
        {sim.state.map((s) => (s.status === "pendiente" && s.slot !== undefined ? <PendingCard key={s.id + s.created} s={s} slot={s.slot} /> : null))}
        {approved.map((s, k) => (
          <group key={s.id} position={[SLOT_X(k), ALLOW_Y, 0.05]}>
            <RoundedBox args={[0.8, 0.5, 0.07]} radius={0.03} smoothness={2} castShadow receiveShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.2)} roughness={0.5} clearcoat={0.35} />
            </RoundedBox>
            <Tag position={[0, 0, 0.06]} tone="teal" size="xs" center>{"remitente " + s.id}</Tag>
          </group>
        ))}
        {approved.length ? <Wire points={[[SLOT_X(CAP - 1) + 0.5, ALLOW_Y, 0.1], [4.25, -0.45, 0.1]]} color={P.rose} dashed opacity={0.55} /> : null}
        <GroupGate />
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [t, setT] = useState(40);
  const [count, setCount] = useState(6);
  const [approveA, setApproveA] = useState(false);
  const sim = useMemo(() => simulate(t, count, approveA), [t, count, approveA]);
  const by = (st: Status) => sim.state.filter((s) => s.status === st);
  const pending = by("pendiente");
  const ignored = by("ignorado");
  const expired = by("caducado");
  const approved = by("aprobado");
  const combos = new Intl.NumberFormat("es-ES").format(ALPHABET.length ** 8);
  const note = (
    <div className="space-y-3">
      <p>
        <strong>Minuto {t}.</strong>{" "}
        {pending.length
          ? `Hay ${pending.length} ${pending.length === 1 ? "petición pendiente" : "peticiones pendientes"} (${pending.map((s) => `${s.id}: quedan ${s.remaining} min`).join(", ")}). Sus mensajes no se procesan hasta que alguien apruebe el código.`
          : "No hay peticiones pendientes."}{" "}
        {ignored.length ? `${ignored.map((s) => s.id).join(", ")} llegó con las tres ranuras ocupadas: se ignora hasta que una caduque o se apruebe; puede volver a escribir.` : ""}{" "}
        {expired.length ? `${expired.map((s) => s.id).join(", ")} ya caducó a los 60 min.` : ""}{" "}
        {approved.length ? "La aprobación de A abre solo el acceso DM: los grupos siguen sus propias allowlists." : ""}
      </p>
      <Readout
        items={[
          { label: "pendientes", value: `${pending.length} / ${CAP}`, tone: "var(--amber)" },
          { label: "ignorados", value: String(ignored.length), tone: "var(--rose)" },
          { label: "caducados", value: String(expired.length), tone: "var(--muted)" },
          { label: "permitidos", value: String(approved.length), tone: "var(--teal)" },
        ]}
      />
      <details className="text-xs">
        <summary className="cursor-pointer font-mono text-[0.6rem] uppercase tracking-widest text-muted">registro de eventos</summary>
        <ul className="mt-1 list-disc pl-5 font-mono">{sim.log.map((l) => <li key={l}>{l}</li>)}</ul>
      </details>
      <p className="text-xs text-muted">
        Reglas de <em>Pairing</em>: código de 8 caracteres de un alfabeto de {ALPHABET.length} símbolos sin 0, O, 1 ni I ({combos} combinaciones), caducidad de 1 hora, máximo 3 pendientes por cuenta de canal. Filas en <code>channel_pairing_requests</code> y <code>channel_pairing_allow_entries</code>. Las horas de llegada y los códigos son didácticos.
      </p>
    </div>
  );
  return (
    <Figure
      label="Pairing DM · código, caducidad y tope"
      hint="dos puertas: esta es la de personas"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.amber, label: "pendiente" },
        { color: P.rose, label: "ignorado / grupos" },
        { color: "#7B8189", label: "caducado" },
        { color: P.teal, label: "aprobado (solo DM)" },
      ]}
      note={note}
      controls={
        <>
          <Knob label="minuto" value={t} min={0} max={130} step={5} onChange={setT} tone="var(--amber)" />
          <Knob label="remitentes" value={count} min={1} max={6} onChange={setCount} tone="var(--ink)" />
          <button type="button" className="chip" aria-pressed={approveA} style={approveA ? { background: "var(--teal-wash)", borderColor: "var(--teal)" } : undefined} onClick={() => setApproveA(!approveA)}>
            {approveA ? "A aprobado en min 25" : "Aprobar A en min 25"}
          </button>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1, 2.2, 11.5], fov: 35 }} fit={1.0}>
        <PairingScene sim={sim} t={t} />
      </Stage>
    </Figure>
  );
}

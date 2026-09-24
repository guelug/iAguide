"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { PointerTilt, ShadowBlob, Tag, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * "Comparar, sin mezclar palancas", drawn.
 *
 * The section's argument is that two schedulers answer the same human
 * need — run this later — out of different stores, with different
 * isolation and different fallback wiring, and that the knobs are not
 * interchangeable even though the need is. Side by side that is one
 * glance instead of five hundred words.
 *
 * Every knob below is named in the section. The hazard is the paste it
 * warns about in as many words: do not replace jobs.json with a database
 * because OpenClaw uses SQLite. Cite the page you implement.
 */

const EN: Surface[] = [
  {
    name: "Hermes cron",
    role: "server",
    note: "a jobs.json file store plus a lock plus a fresh AIAgent, written atomically so a crash mid-tick leaves the previous file whole, never broken JSON",
    knobs: ["jobs.json", "skills[]", "schedule.kind", "deliver", "Chronos", "recursion guard"],
    color: P.violet,
  },
  {
    name: "OpenClaw cron",
    role: "server",
    note: "jobs in the Gateway's SQLite, driven over cron.* RPC, so a Control UI can poll a run by its runId",
    knobs: ["cron.*", "cron.runs", "announce", "webhook", "isolated / main"],
    color: P.teal,
  },
];

const ES: Surface[] = [
  {
    name: "Cron de Hermes",
    role: "server",
    note: "un almacén de fichero jobs.json más un lock más un AIAgent fresco, escrito de forma atómica para que un crash a mitad de tick deje el fichero anterior entero y nunca un JSON roto",
    knobs: ["jobs.json", "skills[]", "schedule.kind", "deliver", "Chronos", "guardia de recursión"],
    color: P.violet,
  },
  {
    name: "Cron de OpenClaw",
    role: "server",
    note: "jobs en la SQLite del Gateway, manejados por RPC cron.*, de modo que una Control UI pueda sondear una corrida por su runId",
    knobs: ["cron.*", "cron.runs", "announce", "webhook", "isolated / main"],
    color: P.teal,
  },
];

function LegacyVisual() {
  const t = useCopy({
    en: {
      surfaces: EN,
      copy: {
        title: "same need, different stores",
        hint: "pick a scheduler · the knobs under it belong to it alone",
        note: "Run this later is one human need and two products. Different stores, different isolation, different fallback wiring. Choose the product, then cite its page — a briefing that must land in Telegram without poisoning a live chat transcript is already an isolation decision Hermes made, and a briefing that must be an RPC a Control UI can poll by runId is OpenClaw's cron.runs.",
        roles: { server: "owns the jobs", client: "calls in", bridge: "bridge" },
        knobsLabel: "its own knobs",
        hazard: {
          text: "do not swap jobs.json for a database because OpenClaw uses SQLite",
          from: 1,
          to: 0,
        },
      },
    },
    es: {
      surfaces: ES,
      copy: {
        title: "la misma necesidad, distintos almacenes",
        hint: "elige un scheduler · las palancas de debajo son solo suyas",
        note: "Correr esto luego es una necesidad humana y dos productos. Distintos almacenes, distinto aislamiento, distinto cableado de fallback. Elige el producto y cita su página: un briefing que debe aterrizar en Telegram sin envenenar un transcript de chat vivo ya es una decisión de aislamiento que tomó Hermes, y un briefing que debe ser un RPC que una Control UI pueda sondear por runId es cron.runs de OpenClaw.",
        roles: { server: "posee los jobs", client: "llama", bridge: "puente" },
        knobsLabel: "sus propias palancas",
        hazard: {
          text: "no cambies jobs.json por una base de datos porque OpenClaw use SQLite",
          from: 1,
          to: 0,
        },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Misma necesidad (correr esto luego), dos productos. Cada palanca se
   ilumina en los dos lados a la vez para comparar sin mezclar: lo que vive
   en Hermes no se pega en OpenClaw ni al revés. Todo lo nombrado sale de la
   sección de la lección (Cron Internals y Gateway protocol). */

type Lever = "store" | "isolation" | "delivery" | "control";
const LEVERS: Record<Lever, { label: string; hermes: string; openclaw: string; hTag: string; oTag: string }> = {
  store: {
    label: "Almacén",
    hermes: "~/.hermes/cron/jobs.json, escrito de forma atómica: primero un temporal, luego rename. Un crash a mitad de tick deja el fichero anterior entero, nunca un JSON roto.",
    openclaw: "Jobs en la SQLite del Gateway.",
    hTag: "jobs.json atómico",
    oTag: "SQLite del Gateway",
  },
  isolation: {
    label: "Aislamiento",
    hermes: "Cada corrida es un AIAgent fresco, sin historial de corridas previas. Las entregas no se espejan en el historial del gateway.",
    openclaw: "Cada automatización elige sesión isolated o main.",
    hTag: "AIAgent fresco",
    oTag: "isolated / main",
  },
  delivery: {
    label: "Entrega",
    hermes: "Campo deliver: telegram, telegram:chat_id, origin, local… resuelto en el momento del fuego. [SILENT] suprime la entrega.",
    openclaw: "Modos announce o webhook.",
    hTag: "deliver",
    oTag: "announce / webhook",
  },
  control: {
    label: "Control",
    hermes: "CLI hermes cron (list, create, edit, pause, resume, run, remove) y la tool cronjob, desactivada dentro de las corridas.",
    openclaw: "RPC cron.* (get, list, status, add, update, remove, run, runs). cron.run encola; cron.runs acepta un filtro runId.",
    hTag: "hermes cron",
    oTag: "RPC cron.*",
  },
};
type Need = "telegram" | "poll";

const Q = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};

function Block({ position, size, color, glow, clear = 0.4 }: { position: V3; size: V3; color: string; glow?: string; clear?: number }) {
  return (
    <RoundedBox args={size} position={position} radius={Math.min(0.07, size[1] / 3)} smoothness={3} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.42} clearcoat={clear} emissive={glow ?? "#000"} emissiveIntensity={glow ? 0.18 : 0} />
    </RoundedBox>
  );
}

function Sheet({ position, color, lines = 4, broken = false, rotation = [0, 0, 0] }: { position: V3; color: string; lines?: number; broken?: boolean; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.8, 0.05, 1.0]} radius={0.02} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={broken ? P.roseWash : P.paper} roughness={0.6} />
      </RoundedBox>
      {Array.from({ length: lines }, (_, l) => (
        <mesh key={l} position={[-0.05, 0.03, -0.35 + l * 0.18]}>
          <boxGeometry args={[broken && l >= lines / 2 ? 0.2 : 0.55 - (l % 2) * 0.15, 0.006, 0.05]} />
          <meshStandardMaterial color={broken && l >= lines / 2 ? P.rose : color} />
        </mesh>
      ))}
    </group>
  );
}

const SLOT: Record<Lever, V3> = { store: [-0.85, 0, -0.75], isolation: [0.85, 0, -0.75], delivery: [0.85, 0, 0.75], control: [-0.85, 0, 0.75] };

function Pad({ x, chosen, color }: { x: number; chosen: boolean; color: string }) {
  return (
    <group position={[x, 0.08, 0]}>
      <Block position={[0, 0.07, 0]} size={[3.7, 0.14, 3.3]} color={chosen ? mixHex(Q.deck, color, 0.22) : Q.deck} clear={0.35} />
      {Object.values(SLOT).map((p, i) => (
        <mesh key={i} position={[p[0], 0.15, p[2]]}>
          <boxGeometry args={[1.5, 0.02, 1.35]} />
          <meshStandardMaterial color={mixHex(Q.deck, Q.charcoal, 0.12)} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function HermesSide({ lever, crash }: { lever: Lever; crash: boolean }) {
  const on = (l: Lever) => lever === l;
  const at = (l: Lever, y = 0): V3 => [SLOT[l][0], 0.24 + y + (on(l) ? 0.12 : 0), SLOT[l][2]];
  return (
    <group position={[-2.3, 0.08, 0]}>
      {/* almacén: jobs.json y su temporal */}
      <group position={at("store")}>
        <Sheet position={[-0.25, 0, 0]} color={P.violet} />
        <Sheet position={[-0.25, 0.06, 0]} color={P.violet} />
        {on("store") ? <Sheet position={[0.35, 0.25, 0.1]} rotation={[0, 0, -0.15]} color={P.amber} broken={crash} /> : null}
      </group>
      {/* aislamiento: AIAgent fresco, historial vacío */}
      <group position={at("isolation")}>
        <Block position={[0, 0.3, 0]} size={[0.9, 0.6, 0.7]} color={Q.charcoal} glow={on("isolation") ? P.violet : undefined} clear={0.6} />
        <mesh position={[0, 0.35, 0.36]}>
          <boxGeometry args={[0.6, 0.18, 0.01]} />
          <meshStandardMaterial color={mixHex(Q.deck, P.ink, 0.1)} />
        </mesh>
      </group>
      {/* entrega */}
      <group position={at("delivery")}>
        <Block position={[0, 0.2, 0]} size={[0.9, 0.4, 0.7]} color={mixHex(Q.deck, P.violet, 0.2)} glow={on("delivery") ? P.violet : undefined} />
        <mesh position={[0, 0.41, 0]}>
          <boxGeometry args={[0.55, 0.02, 0.1]} />
          <meshStandardMaterial color={Q.charcoal} />
        </mesh>
      </group>
      {/* control: CLI y tool cronjob apagada */}
      <group position={at("control")}>
        <Block position={[-0.15, 0.22, 0]} size={[0.8, 0.44, 0.6]} color={Q.charcoal} glow={on("control") ? P.violet : undefined} clear={0.6} />
        <Block position={[0.45, 0.16, 0.2]} size={[0.28, 0.28, 0.24]} color={P.roseWash} />
      </group>
      <Tag position={[0, 0.3, 1.95]} tone="violet" center>Cron de Hermes</Tag>
      <Tag position={[at(lever)[0], at(lever)[1] + 0.95, at(lever)[2]]} tone="violet" size="xs" center>{LEVERS[lever].hTag}</Tag>
      {on("store") && crash ? <Tag position={[at("store")[0] + 0.4, at("store")[1] + 0.55, at("store")[2] + 0.5]} tone="rose" size="xs" center>temporal a medias</Tag> : null}
    </group>
  );
}

function OpenClawSide({ lever }: { lever: Lever }) {
  const on = (l: Lever) => lever === l;
  const at = (l: Lever, y = 0): V3 => [SLOT[l][0], 0.24 + y + (on(l) ? 0.12 : 0), SLOT[l][2]];
  return (
    <group position={[2.3, 0.08, 0]}>
      {/* almacén: SQLite del Gateway */}
      <group position={at("store")}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.1 + i * 0.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.17, 40]} />
            <meshPhysicalMaterial color={mixHex(Q.deck, P.teal, 0.25 + i * 0.1)} roughness={0.4} clearcoat={0.5} emissive={on("store") ? P.teal : "#000"} emissiveIntensity={on("store") ? 0.12 : 0} />
          </mesh>
        ))}
      </group>
      {/* aislamiento: sesión isolated o main */}
      <group position={at("isolation")}>
        <Block position={[-0.28, 0.12, 0]} size={[0.5, 0.24, 0.9]} color={P.tealWash} glow={on("isolation") ? P.teal : undefined} />
        <Block position={[0.32, 0.12, 0]} size={[0.5, 0.24, 0.9]} color={Q.deck} />
      </group>
      {/* entrega: announce y webhook */}
      <group position={at("delivery")}>
        <Block position={[0, 0.2, 0]} size={[0.9, 0.4, 0.7]} color={mixHex(Q.deck, P.teal, 0.2)} glow={on("delivery") ? P.teal : undefined} />
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.2, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
            <meshStandardMaterial color={Q.brass} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* control: panel RPC con ocho métodos y tabla de runs */}
      <group position={at("control")}>
        <Block position={[0, 0.25, -0.15]} size={[1.1, 0.5, 0.3]} color={Q.charcoal} glow={on("control") ? P.teal : undefined} clear={0.6} />
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[-0.42 + (i % 4) * 0.28, 0.36 - Math.floor(i / 4) * 0.2, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
            <meshStandardMaterial color={i === 7 ? P.teal : Q.brass} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {[0, 1, 2].map((r) => (
          <mesh key={r} position={[0, 0.03, 0.2 + r * 0.14]}>
            <boxGeometry args={[1.0, 0.03, 0.1]} />
            <meshStandardMaterial color={r === 0 ? P.teal : mixHex(Q.deck, P.ink, 0.15)} />
          </mesh>
        ))}
      </group>
      <Tag position={[0, 0.3, 1.95]} tone="teal" center>Cron de OpenClaw</Tag>
      <Tag position={[at(lever)[0], at(lever)[1] + 0.95, at(lever)[2]]} tone="teal" size="xs" center>{LEVERS[lever].oTag}</Tag>
    </group>
  );
}

function CompareScene({ lever, need, crash }: { lever: Lever; need: Need; crash: boolean }) {
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -0.28, 0]} scale={10.5} opacity={0.12} />
        <RoundedBox args={[9.8, 0.3, 4.2]} position={[0, -0.13, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={Q.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[9.45, 0.06, 3.85]} position={[0, 0.05, 0]} radius={0.03} smoothness={3} receiveShadow>
          <meshStandardMaterial color={Q.baseTop} roughness={0.45} metalness={0.22} />
        </RoundedBox>
        <Pad x={-2.3} chosen={need === "telegram"} color={P.violet} />
        <Pad x={2.3} chosen={need === "poll"} color={P.teal} />
        {/* separador: las palancas no se cruzan */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.08, 0.8, 3.4]} />
          <meshPhysicalMaterial color={P.roseWash} roughness={0.3} transmission={0.3} transparent opacity={0.7} />
        </mesh>
        <Tag position={[0, 1.15, -1.3]} tone="rose" size="xs" center>no mezclar palancas</Tag>
        <HermesSide lever={lever} crash={crash} />
        <OpenClawSide lever={lever} />
      </group>
    </PointerTilt>
  );
}

function CompareNote({ lever, need, crash }: { lever: Lever; need: Need; crash: boolean }) {
  const l = LEVERS[lever];
  return (
    <div className="space-y-3">
      <p><strong>{l.label}.</strong> La misma pregunta tiene dos respuestas que no se intercambian.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <p className="rounded border border-line bg-paper p-3 text-xs"><strong className="text-violet">Hermes · </strong>{l.hermes}{lever === "store" ? (crash ? " Simulación: el temporal quedó a medias; jobs.json sigue siendo la versión anterior completa y el rename nunca ocurrió." : " Activa «crash» para ver qué queda en disco.") : ""}</p>
        <p className="rounded border border-line bg-paper p-3 text-xs"><strong className="text-teal">OpenClaw · </strong>{l.openclaw}</p>
      </div>
      <Readout items={[
        { label: "requisito", value: need === "telegram" ? "briefing a Telegram sin tocar el chat vivo" : "RPC que una Control UI sondea por runId", tone: "var(--amber)" },
        { label: "producto", value: need === "telegram" ? "Hermes (aislamiento ya decidido)" : "OpenClaw (cron.runs)", tone: need === "telegram" ? "var(--violet)" : "var(--teal)" },
      ]} />
      <p className="text-xs text-muted">No cambies jobs.json por una base de datos porque OpenClaw use SQLite, ni pegues cron.runs en un jobs.json. Elige el producto y cita su página.</p>
    </div>
  );
}

function SpanishVisual() {
  const [lever, setLever] = useState<Lever>("store");
  const [need, setNeed] = useState<Need>("telegram");
  const [crash, setCrash] = useState(false);
  return (
    <Figure
      label="La misma necesidad, distintos almacenes"
      hint="Hermes y OpenClaw · compara una palanca a la vez"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.violet, label: "Hermes" },
        { color: P.teal, label: "OpenClaw" },
        { color: P.rose, label: "frontera / crash" },
      ]}
      note={<CompareNote lever={lever} need={need} crash={crash} />}
      controls={
        <>
          <Switcher value={lever} onChange={setLever} ariaLabel="Palanca" options={(Object.keys(LEVERS) as Lever[]).map((k) => ({ value: k, label: LEVERS[k].label, tone: P.inkSoft }))} />
          <Switcher value={need} onChange={setNeed} ariaLabel="Requisito" options={[
            { value: "telegram", label: "Briefing a Telegram", tone: P.violet },
            { value: "poll", label: "Sondeo por runId", tone: P.teal },
          ]} />
          {lever === "store" ? <button type="button" className="chip" aria-pressed={crash} onClick={() => setCrash(!crash)}>{crash ? "Quitar crash" : "Crash a mitad de escritura"}</button> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.5, 6.5, 9], fov: 34 }} fit={1.08}>
        <CompareScene lever={lever} need={need} crash={crash} />
      </Stage>
    </Figure>
  );
}

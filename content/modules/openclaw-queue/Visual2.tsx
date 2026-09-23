"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type Group } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type Cell, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* openclaw-queue: FIFO, backpressure alarm, priority jump. */
type Mode = "fifo" | "back" | "vip";

const COPY = {
  en: {
    queues_do_the_pacing: "queues do the pacing",
    fifo_backpressure_vip: "fifo · backpressure · vip",
    fifo: "fifo",
    backpressure: "backpressure",
    vip: "vip",
    job: "job",
    worker: "worker",
    full: "full",
    jumps: "jumps",
  },
  es: {
    queues_do_the_pacing: "las colas marcan el ritmo",
    fifo_backpressure_vip: "fifo · backpressure · vip",
    fifo: "fifo",
    backpressure: "backpressure",
    vip: "vip",
    job: "trabajo",
    worker: "worker",
    full: "lleno",
    jumps: "salta",
  },
};

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("fifo");

  return (
    <Figure
      label={t.queues_do_the_pacing}
      hint={t.fifo_backpressure_vip}
      legend={[
        { color: P.teal, label: t.job },
        { color: P.rose, label: t.backpressure },
        { color: P.amber, label: t.vip },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "fifo", label: t.fifo, tone: P.teal },
            { value: "back", label: t.backpressure, tone: P.rose },
            { value: "vip", label: t.vip, tone: P.amber },
          ]}
          ariaLabel={t.queues_do_the_pacing}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "fifo" && (
          <>
            {/* producer pushing jobs 1..4 into a queue slab, workers pulling on the right */}
            <Slab position={[-2.5, 0.4, 0]} size={[1.6, 0.7, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[-2.5, 0.95, 0.15]} tone="teal" size="xs">producer</Tag>
            <Ribbon points={[[-1.6, 0.4, 0], [-0.6, 0.4, 0]]} color={P.teal} radius={0.04} opacity={0.85} />
            {/* the queue */}
            <Slab position={[0.3, 0.4, 0]} size={[2.4, 1.0, 0.14]} color={P.violet} fill={0.16} rim={0.7} />
            <Tag position={[0.3, 1.45, 0.15]} tone="violet">queue</Tag>
            {/* job squares inside */}
            {[0, 1, 2, 3].map((i) => (
              <Node3D
                key={i}
                position={[-0.6 + i * 0.55, 0.4, 0.12]}
                color={P.teal}
                radius={0.13}
                matte
              />
            ))}
            <Tag position={[0.3, -0.0, 0.15]} tone="muted" size="xs">{t.job} 1..4</Tag>
            <Ribbon points={[[1.6, 0.4, 0], [2.5, 0.4, 0]]} color={P.amber} radius={0.04} opacity={0.85} />
            <Slab position={[2.7, 0.4, 0]} size={[1.4, 1.0, 0.12]} color={P.amber} fill={0.26} />
            <Tag position={[2.7, 0.95, 0.15]} tone="amber" size="xs">{t.worker}</Tag>
          </>
        )}

        {mode === "back" && (
          <>
            {/* queue slab filling red, producers backing off */}
            <Slab position={[0, 0.5, -0.05]} size={[2.6, 1.5, 0.14]} color={P.rose} fill={0.14} rim={0.9} />
            <Lattice
              cells={Array.from({ length: 14 }, (_, i) => ({
                position: [-1.1 + (i % 7) * 0.38, 0.95 - Math.floor(i / 7) * 0.4, 0] as [number, number, number],
                color: P.rose,
              }))}
              size={0.16}
              opacity={0.9}
              matte
            />
            <Tag position={[0, 1.8, 0.15]} tone="rose">{t.full}</Tag>
            {/* producer halted */}
            <Slab position={[-2.4, 0.6, 0]} size={[1.4, 0.55, 0.12]} color={P.muted} fill={0.18} />
            <Tag position={[-2.4, 1.05, 0.15]} tone="muted" size="xs">producer</Tag>
            {/* hold ribbon */}
            <Wire points={[[-1.7, 0.6, 0], [-0.9, 0.6, 0]]} color={P.rose} dashed width={2.5} opacity={0.9} />
            <Tag position={[-1.3, 0.15, 0.15]} tone="rose" size="xs">{t.backpressure}</Tag>
            {/* worker still draining */}
            <Ribbon points={[[1.3, 0.3, 0], [2.4, -0.4, 0]]} color={P.teal} radius={0.04} opacity={0.7} />
            <Slab position={[2.6, -0.6, 0]} size={[1.3, 0.6, 0.1]} color={P.teal} fill={0.26} />
            <Tag position={[2.6, -0.1, 0.15]} tone="teal" size="xs">{t.worker}</Tag>
          </>
        )}

        {mode === "vip" && (
          <>
            {/* the queue with a VIP slab hopping in */}
            <Slab position={[0.3, 0.5, 0]} size={[2.6, 1.0, 0.14]} color={P.violet} fill={0.18} rim={0.7} />
            {[0, 1, 2, 3].map((i) => (
              <Node3D key={i} position={[-0.5 + i * 0.55, 0.5, 0.12]} color={P.teal} radius={0.12} matte />
            ))}
            {/* vip job arrives from above */}
            <Ribbon points={[[-1.6, 1.8, 0], [-0.2, 1.4, 0], [0.3, 1.0, 0]]} color={P.amber} radius={0.05} opacity={0.95} />
            <Node3D position={[0.3, 0.95, 0.2]} color={P.amber} radius={0.2} pulse={0.5} faceted />
            <Tag position={[0.3, 1.45, 0.15]} tone="amber">{t.vip}</Tag>
            <Tag position={[-0.5, -0.15, 0.15]} tone="muted" size="xs">job 1..3</Tag>
            <Tag position={[1.0, 0.1, 0.15]} tone="amber" size="xs">{t.jumps}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Dos reglas de la cola que se pueden calcular.
 * «Cap y drop»: llega una ráfaga mientras la sesión tiene una corrida
 * activa; la cola guarda como mucho `cap` entradas y `drop` decide qué
 * pasa con el resto (summarize / old / new).
 * «Precedencia»: el modo se resuelve de arriba abajo; gana la primera capa
 * definida (override de sesión → byChannel → messages.queue.mode → steer).
 */

type View = "cap" | "prec";
type Drop = "summarize" | "old" | "new";
type Channel = "discord" | "telegram";
type SessionOverride = "none" | "interrupt" | "followup";

function capModel(burst: number, cap: number, drop: Drop) {
  const effectiveCap = cap < 1 ? 20 : cap; // values below 1 are ignored
  const overflow = Math.max(0, burst - effectiveCap);
  const ids = Array.from({ length: burst }, (_, i) => i + 1);
  let kept: number[];
  let lost: number[];
  if (overflow === 0) {
    kept = ids;
    lost = [];
  } else if (drop === "new") {
    kept = ids.slice(0, effectiveCap);
    lost = ids.slice(effectiveCap);
  } else {
    kept = ids.slice(overflow);
    lost = ids.slice(0, overflow);
  }
  return { effectiveCap, overflow, kept, lost, summarized: drop === "summarize" ? lost.length : 0 };
}

/* The lesson's example config: mode "steer", byChannel.discord = "collect". */
const CONFIG = { mode: "steer", byChannel: { discord: "collect" } as Partial<Record<Channel, string>> };

function resolveMode(channel: Channel, session: SessionOverride) {
  const layers = [
    { key: "session", label: "/queue de sesión", value: session === "none" ? null : session },
    { key: "channel", label: `byChannel.${channel}`, value: CONFIG.byChannel[channel] ?? null },
    { key: "global", label: "messages.queue.mode", value: CONFIG.mode },
    { key: "default", label: "default integrado", value: "steer" },
  ];
  const winner = layers.findIndex((l) => l.value !== null);
  return { layers, winner, mode: layers[winner].value as string };
}

const NQ = new Intl.NumberFormat("es-ES");

function QMat({ color, rough = 0.45, coat = 0.4, metal = 0, opacity = 1 }: { color: string; rough?: number; coat?: number; metal?: number; opacity?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} transparent={opacity < 1} opacity={opacity} />;
}

function Bench({ w = 10, d = 3.6 }: { w?: number; d?: number }) {
  return (
    <group>
      <ShadowBlob position={[0, -1.5, 0.1]} scale={w} opacity={0.12} />
      <RoundedBox args={[w, 0.34, d]} position={[0, -1.3, 0.1]} radius={0.16} smoothness={4} castShadow receiveShadow>
        <QMat color="#3a3f44" rough={0.6} coat={0.2} />
      </RoundedBox>
      <RoundedBox args={[w - 0.3, 0.06, d - 0.3]} position={[0, -1.11, 0.1]} radius={0.03} smoothness={2} receiveShadow>
        <QMat color="#50565c" rough={0.55} coat={0.25} />
      </RoundedBox>
    </group>
  );
}

const RACK = { x0: -3.0, pitch: 0.38, cols: 15, z: [-0.25, 0.3] };
const slotPos = (i: number): V3 => [RACK.x0 + (i % RACK.cols) * RACK.pitch, -0.92, RACK.z[Math.floor(i / RACK.cols)]];
const msgColor = (id: number, total: number) => mixHex(P.amberWash, P.amberDeep, 0.2 + 0.8 * (id / Math.max(1, total)));

function CapScene({ burst, cap, drop }: { burst: number; cap: number; drop: Drop }) {
  const m = useMemo(() => capModel(burst, cap, drop), [burst, cap, drop]);
  const slots = useMemo<Cell[]>(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        position: [slotPos(i)[0], -1.02, slotPos(i)[2]] as V3,
        scale: [0.32, 0.04, 0.44] as V3,
        color: i < m.effectiveCap ? mixHex(P.paper, P.teal, 0.25) : "#2a2e33",
      })),
    [m.effectiveCap],
  );
  const tiles = useMemo<Cell[]>(
    () => m.kept.map((id, i) => ({ position: [slotPos(i)[0], -0.86, slotPos(i)[2]] as V3, scale: [0.28, 0.24, 0.36] as V3, color: msgColor(id, burst) })),
    [m.kept, burst],
  );
  const lostTiles = useMemo<Cell[]>(() => {
    if (drop === "summarize") return [];
    const base: V3 = drop === "new" ? [3.55, -0.95, -0.45] : [3.45, -0.95, 1.1];
    return m.lost.map((id, i) => ({
      position: [base[0] + ((i % 3) - 1) * 0.2, base[1] + Math.floor(i / 3) * 0.14, base[2] + ((i * 7) % 3 - 1) * 0.12] as V3,
      scale: [0.22, 0.1, 0.28] as V3,
      color: mixHex(msgColor(id, burst), P.rose, 0.35),
    }));
  }, [m.lost, drop, burst]);
  return (
    <PointerTilt amount={0.045}>
      <group>
        <Bench />
        {/* active run the queue waits for */}
        <group position={[-4.2, -0.62, 0]}>
          <RoundedBox args={[0.9, 0.9, 1.1]} radius={0.08} smoothness={3} castShadow receiveShadow>
            <QMat color={P.violet} rough={0.4} coat={0.55} />
          </RoundedBox>
          <Tag position={[0, 0.72, 0]} tone="violet" size="xs" center>corrida activa</Tag>
        </group>
        <RoundedBox args={[RACK.cols * RACK.pitch + 0.3, 0.1, 1.25]} position={[RACK.x0 + ((RACK.cols - 1) * RACK.pitch) / 2, -1.08, 0.02]} radius={0.04} smoothness={2} receiveShadow castShadow>
          <QMat color={mixHex(P.paper, P.inkSoft, 0.2)} rough={0.5} />
        </RoundedBox>
        <Lattice cells={slots} size={1} />
        <Lattice cells={tiles} size={1} />
        {lostTiles.length ? <Lattice cells={lostTiles} size={1} /> : null}
        {drop === "summarize" && m.summarized > 0 ? (
          <group position={[-3.45, -0.8, 0.02]}>
            <RoundedBox args={[0.3, 0.3 + Math.min(0.5, m.summarized * 0.04), 0.9]} radius={0.04} smoothness={2} castShadow>
              <QMat color={P.violetWash} rough={0.45} />
            </RoundedBox>
            <Tag position={[0, 0.55, 0]} tone="violet" size="xs" center>{`resumen de ${m.summarized}`}</Tag>
          </group>
        ) : null}
        {/* entrance hopper */}
        <group position={[3.2, -0.55, -0.1]}>
          <mesh rotation={[0, 0, Math.PI]} castShadow>
            <coneGeometry args={[0.42, 0.6, 28, 1, true]} />
            <meshPhysicalMaterial color={mixHex(P.paper, P.amber, 0.35)} roughness={0.4} clearcoat={0.5} side={2} />
          </mesh>
          <Tag position={[0, 0.6, 0]} tone="amber" size="xs" center>{`ráfaga de ${burst}`}</Tag>
        </group>
        {drop !== "summarize" && m.lost.length ? (
          <Tag position={drop === "new" ? [3.55, -0.35, -0.9] : [3.45, -0.45, 1.5]} tone="rose" size="xs" center>{drop === "new" ? `rechazados ${m.lost.length}` : `tirados ${m.lost.length}`}</Tag>
        ) : null}
        <Flow points={[[3.2, 0.3, -0.1], [3.2, -0.3, -0.1], [2.6, -0.7, 0.0]]} color={P.amber} count={3} speed={0.5} size={0.045} lineOpacity={0.3} />
        <Flow points={[[RACK.x0 - 0.2, -0.75, 0.02], [-3.7, -0.6, 0.02]]} color={P.teal} count={2} speed={0.3} size={0.04} lineOpacity={0.3} />
        <Tag position={[RACK.x0 + ((m.effectiveCap - 1) % RACK.cols) * RACK.pitch, -0.45, RACK.z[Math.floor((m.effectiveCap - 1) / RACK.cols)]]} tone="teal" size="xs" center>{`cap ${m.effectiveCap}`}</Tag>
      </group>
    </PointerTilt>
  );
}

const LAYER_Y = [1.15, 0.45, -0.25, -0.95];

function Probe({ toY }: { toY: number }) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  const { still } = useStage();
  const top = 2.0;
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (still) {
      g.position.y = toY + 0.25;
      return;
    }
    t.current = (t.current + dt) % 3.2;
    const k = Math.min(1, t.current / 1.6);
    g.position.y = MathUtils.lerp(top, toY + 0.25, 1 - (1 - k) * (1 - k));
  });
  return (
    <group ref={ref} position={[0.9, top, 0.1]}>
      <RoundedBox args={[0.46, 0.3, 0.12]} radius={0.03} smoothness={2} castShadow>
        <QMat color={P.surface} rough={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.02, 0.065]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color={P.amber} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <coneGeometry args={[0.08, 0.18, 16]} />
        <QMat color={P.amber} />
      </mesh>
    </group>
  );
}

function PrecScene({ channel, session }: { channel: Channel; session: SessionOverride }) {
  const r = useMemo(() => resolveMode(channel, session), [channel, session]);
  return (
    <PointerTilt amount={0.045}>
      <group>
        <Bench w={7.2} d={3.2} />
        {/* four columns hold the override stack */}
        {[[-2.2, -0.9], [2.2, -0.9], [-2.2, 1.1], [2.2, 1.1]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.15, z]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2.5, 14]} />
            <QMat color="#9aa3ab" metal={0.6} rough={0.3} coat={0} />
          </mesh>
        ))}
        {r.layers.map((l, i) => {
          const win = i === r.winner;
          const below = i > r.winner;
          const color = i === 0 ? P.rose : i === 1 ? P.amber : i === 2 ? P.violet : P.teal;
          return (
            <group key={l.key} position={[0, LAYER_Y[i], 0.1]}>
              <RoundedBox args={[4.6, 0.12, 2.1]} radius={0.04} smoothness={2} castShadow receiveShadow>
                <QMat color={win ? mixHex(P.paper, color, 0.55) : mixHex(P.paper, color, below ? 0.06 : 0.18)} rough={0.4} coat={0.5} opacity={below ? 0.45 : 0.9} />
              </RoundedBox>
              {l.value !== null ? (
                <RoundedBox args={[0.9, 0.14, 0.4]} position={[0.9, 0.12, 0.2]} radius={0.04} smoothness={2} castShadow>
                  <QMat color={win ? color : mixHex(P.paper, color, 0.35)} rough={0.4} />
                </RoundedBox>
              ) : (
                <mesh position={[0.9, 0.07, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.16, 0.2, 32]} />
                  <meshBasicMaterial color={P.lineStrong} />
                </mesh>
              )}
              <Tag position={[-1.3, 0.12, 0.9]} tone={win ? "ink" : "muted"} size="xs" center><span className="normal-case">{l.label}</span></Tag>
              <Tag position={[1.9, 0.12, 0.9]} tone={win ? (i === 0 ? "rose" : i === 1 ? "amber" : i === 2 ? "violet" : "teal") : "muted"} size="xs" center>{l.value ?? "sin definir"}</Tag>
              {win ? <Halo position={[0.9, 0.08, 0.2]} radius={0.6} color={color} opacity={0.8} spin={0.4} /> : null}
            </group>
          );
        })}
        <Probe key={`${channel}-${session}`} toY={LAYER_Y[r.winner]} />
        <Tag position={[0.9, 2.55, 0.1]} tone="amber" center>{`mensaje de ${channel}`}</Tag>
      </group>
    </PointerTilt>
  );
}

const DROP_TEXT: Record<Drop, string> = {
  summarize: "Descarta las entradas más viejas pero deja resúmenes compactos que se inyectan como prompt followup sintético: el modelo sigue sabiendo que llegaron.",
  old: "Descarta las entradas más viejas sin conservar resumen.",
  new: "Rechaza los mensajes más nuevos cuando la cola ya está llena.",
};

function SpanishVisual() {
  const [view, setView] = useState<View>("cap");
  const [burst, setBurst] = useState(26);
  const [cap, setCap] = useState(20);
  const [drop, setDrop] = useState<Drop>("summarize");
  const [channel, setChannel] = useState<Channel>("discord");
  const [session, setSession] = useState<SessionOverride>("none");
  const m = capModel(burst, cap, drop);
  const r = resolveMode(channel, session);
  const note =
    view === "cap" ? (
      <div className="space-y-2">
        <p><strong>drop: {drop}.</strong> {m.overflow > 0 ? DROP_TEXT[drop] : `La ráfaga (${burst}) cabe en el cap (${m.effectiveCap}): no se descarta nada.`}</p>
        <Readout items={[
          { label: "en cola", value: `${m.kept.length} / ${m.effectiveCap}`, tone: "var(--teal)" },
          { label: "sobrantes", value: String(m.overflow), tone: "var(--rose)" },
          { label: "conservados", value: m.kept.length ? `#${m.kept[0]}–#${m.kept[m.kept.length - 1]}` : "—", tone: "var(--amber)" },
          { label: "resumidos", value: String(m.summarized), tone: "var(--violet)" },
        ]} />
        <p className="text-xs text-muted">Defaults de OpenClaw: <code>cap: 20</code>, <code>drop: &quot;summarize&quot;</code>; valores de cap bajo 1 se ignoran. Los mensajes van numerados por orden de llegada; la ráfaga es didáctica. Override combinado legal: <code>/queue collect debounce:0.5s cap:25 drop:summarize</code>.</p>
      </div>
    ) : (
      <div className="space-y-2">
        <p><strong>Modo efectivo: {r.mode}</strong>, decidido por <code>{r.layers[r.winner].label}</code>. La resolución baja capa a capa y se detiene en la primera definida; las de debajo no se consultan.</p>
        <Readout items={r.layers.map((l, i) => ({ label: l.label, value: l.value ?? "—", tone: i === r.winner ? "var(--ink)" : "var(--muted)" }))} />
        <p className="text-xs text-muted">Configuración del ejemplo de la lección: <code>mode: &quot;steer&quot;</code> y <code>byChannel: {"{"} discord: &quot;collect&quot; {"}"}</code>. <code>/queue default</code> o <code>/queue reset</code> borran el override de sesión.</p>
      </div>
    );
  return (
    <Figure
      label={view === "cap" ? "Cola de sesión · cap y política de descarte" : "Precedencia del modo de cola"}
      hint={view === "cap" ? "qué se queda cuando la ráfaga no cabe" : "gana la primera capa definida"}
      legend={view === "cap"
        ? [{ color: P.amber, label: "mensaje (más oscuro = más nuevo)" }, { color: P.teal, label: "hueco del cap" }, { color: P.violet, label: "resumen" }, { color: P.rose, label: "descartado" }]
        : [{ color: P.rose, label: "sesión" }, { color: P.amber, label: "canal" }, { color: P.violet, label: "global" }, { color: P.teal, label: "default" }]}
      note={note}
      controls={
        <>
          <Switcher value={view} onChange={setView} options={[{ value: "cap", label: "Cap y drop", tone: P.amber }, { value: "prec", label: "Precedencia", tone: P.violet }]} ariaLabel="Vista" />
          {view === "cap" ? (
            <>
              <Knob label="ráfaga" min={1} max={40} value={burst} onChange={setBurst} tone={P.amber} />
              <Knob label="cap" min={1} max={30} value={cap} onChange={setCap} tone={P.teal} />
              <Switcher value={drop} onChange={setDrop} options={[{ value: "summarize", label: "summarize", tone: P.violet }, { value: "old", label: "old", tone: P.rose }, { value: "new", label: "new", tone: P.rose }]} ariaLabel="Política drop" />
            </>
          ) : (
            <>
              <Switcher value={channel} onChange={setChannel} options={[{ value: "discord", label: "Discord", tone: P.amber }, { value: "telegram", label: "Telegram", tone: P.amber }]} ariaLabel="Canal" />
              <Switcher value={session} onChange={setSession} options={[{ value: "none", label: "Sin /queue", tone: P.inkSoft }, { value: "interrupt", label: "/queue interrupt", tone: P.rose }, { value: "followup", label: "/queue followup", tone: P.rose }]} ariaLabel="Override de sesión" />
            </>
          )}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.8, 3.4, 10.5], fov: 34 }} fit={1.05}>
        {view === "cap" ? <CapScene burst={burst} cap={cap} drop={drop} /> : <PrecScene channel={channel} session={session} />}
      </Stage>
    </Figure>
  );
}

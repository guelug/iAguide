"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type V3 } from "@/components/three/atoms";
import { RoundedBox } from "@react-three/drei";
import { Color, InstancedMesh, Object3D } from "three";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* sessions: durable, isolated, stateful. */
type Mode = "durable" | "isolation" | "state";

const COPY = {
  en: {
    a_session_is_state_that_survives: "a session is state that survives",
    durability_isolation_and_the_cursor: "durability · isolation · the cursor",
    durable: "durable",
    isolation: "isolation",
    state: "state",
    process_dies: "process dies",
    session_lives: "session lives",
    your_thread: "your thread",
    other_thread: "other thread",
    messages: "messages",
    cursor: "cursor",
  },
  es: {
    a_session_is_state_that_survives: "una sesión es estado que sobrevive",
    durability_isolation_and_the_cursor: "durabilidad · aislamiento · el cursor",
    durable: "durable",
    isolation: "aislamiento",
    state: "estado",
    process_dies: "el proceso muere",
    session_lives: "la sesión vive",
    your_thread: "tu hilo",
    other_thread: "otro hilo",
    messages: "mensajes",
    cursor: "cursor",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("durable");

  return (
    <Figure
      label={t.a_session_is_state_that_survives}
      hint={t.durability_isolation_and_the_cursor}
      legend={[
        { color: P.teal, label: t.durable },
        { color: P.violet, label: t.isolation },
        { color: P.amber, label: t.state },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "durable", label: t.durable, tone: P.teal },
            { value: "isolation", label: t.isolation, tone: P.violet },
            { value: "state", label: t.state, tone: P.amber },
          ]}
          ariaLabel={t.a_session_is_state_that_survives}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "durable" && (
          <>
            {/* process on surface; session written to disk underneath */}
            <Node3D position={[0, 1.2, 0]} color={P.teal} radius={0.2} pulse={0.4} />
            <Tag position={[0, 1.6, 0.15]} tone="teal">{t.process_dies}</Tag>
            <Ribbon
              points={[[0, 1.0, 0], [0, 0.4, 0], [0, -0.2, 0]]}
              color={P.teal}
              radius={0.03}
              opacity={0.7}
            />
            <Slab position={[0, -0.7, 0]} size={[3.4, 0.85, 0.2]} color={P.violet} fill={0.24} />
            <Tag position={[0, -1.3, 0.15]} tone="violet">{t.session_lives}</Tag>
            <Ribbon
              points={[[-1.5, -0.3, 0], [-1.5, 0.6, 0]]}
              color={P.amber}
              radius={0.03}
              opacity={0.7}
            />
            <Ribbon
              points={[[1.5, -0.3, 0], [1.5, 0.6, 0]]}
              color={P.amber}
              radius={0.03}
              opacity={0.7}
            />
            <Tag position={[2.0, 0.4, 0.15]} tone="amber" size="xs">disk</Tag>
          </>
        )}

        {mode === "isolation" && (
          <>
            <Halo position={[-1.5, 0.4, 0]} radius={1.05} color={P.teal} opacity={0.55} spin={0.2} />
            <Slab position={[-1.5, 0.4, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.2} />
            <Tag position={[-1.5, 1.05, 0.15]} tone="teal" size="xs">{t.your_thread}</Tag>
            <Halo position={[1.5, 0.4, 0]} radius={1.05} color={P.violet} opacity={0.55} spin={-0.2} />
            <Slab position={[1.5, 0.4, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.2} />
            <Tag position={[1.5, 1.05, 0.15]} tone="violet" size="xs">{t.other_thread}</Tag>
            <Wire points={[[-0.4, 0.4, 0], [0.4, 0.4, 0]]} color={P.rose} dashed opacity={0.7} />
            <Tag position={[0, 0.75, 0.15]} tone="rose" size="xs">no cruzar</Tag>
            {/* no shared KV or messages */}
            <Lattice
              cells={Array.from({ length: 4 }, (_, i) => ({
                position: [-2.0 + i * 0.3, 0.25, 0.15] as [number, number, number],
                color: P.teal,
              }))}
              size={0.1}
              opacity={0.9}
              matte
            />
            <Lattice
              cells={Array.from({ length: 4 }, (_, i) => ({
                position: [1.0 + i * 0.3, 0.25, 0.15] as [number, number, number],
                color: P.violet,
              }))}
              size={0.1}
              opacity={0.9}
              matte
            />
          </>
        )}

        {mode === "state" && (
          <>
            {/* messages as stack of slabs */}
            {Array.from({ length: 4 }, (_, i) => (
              <Slab
                key={i}
                position={[0, 1.0 - i * 0.45, 0]}
                size={[3.0, 0.3, 0.14]}
                color={i % 2 === 0 ? P.teal : P.violet}
                fill={0.22}
              />
            ))}
            <Tag position={[-2.3, 1.0, 0.15]} tone="teal" size="xs">{t.messages}</Tag>
            {/* cursor line above the stack */}
            <Node3D position={[1.8, 1.0, 0]} color={P.amber} radius={0.16} pulse={0.3} />
            <Tag position={[1.8, 1.45, 0.15]} tone="amber" size="xs">{t.cursor}</Tag>
            <Ribbon points={[[1.8, 0.85, 0], [1.7, 0.4, 0]]} color={P.amber} radius={0.02} opacity={0.8} />
            <Tag position={[0, -1.05, 0.15]} tone="muted" size="xs">state = messages + cursor + tools</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ======================================================================
 * Versión española: compactar con linaje frente a compactar y olvidar.
 *
 * Modelo explícito: cada turno pesa 5 000 tokens, la ventana admite
 * 128 000. Al compactar, el contexto queda en un resumen de 30 000 más
 * la cola de los tres últimos turnos (con sus tool_call/tool_result).
 * La tabla `messages` y el índice FTS guardan el transcript completo
 * solo en la estrategia con linaje. El turno 7 contiene «id 12345».
 * ==================================================================== */

type Keep = "search" | "forget";
type Phase = "before" | "after";

const TURN_TOKENS = 5000;
const WINDOW = 128000;
const SUMMARY = 30000;
const TAIL = 3;
const NEEDLE_TURN = 7;
const kTok = (n: number) => `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(n / 1000)} k`;

function compaction(turns: number, keep: Keep, phase: Phase) {
  const transcript = turns * TURN_TOKENS;
  const compacted = phase === "after";
  const context = compacted ? SUMMARY + TAIL * TURN_TOKENS : transcript;
  const stored = keep === "search" ? transcript : compacted ? 0 : transcript;
  const indexed = keep === "search" ? turns : compacted ? 0 : turns;
  return { transcript, context, overflow: context > WINDOW, stored, indexed, compacted };
}

function SpanishVisual() {
  const [keep, setKeep] = useState<Keep>("search");
  const [phase, setPhase] = useState<Phase>("after");
  const [turns, setTurns] = useState(40);
  const [query, setQuery] = useState(true);
  const m = compaction(turns, keep, phase);
  const inContext = !m.compacted || NEEDLE_TURN > turns - TAIL;
  const found = inContext || m.indexed > 0;

  let story: string;
  if (!m.compacted)
    story = m.overflow
      ? `Sin compactar, ${turns} turnos son ${kTok(m.transcript)} tokens y la ventana admite ${kTok(WINDOW)}. El siguiente turno revienta por contexto: es el caso del grupo de Telegram que alguien dejó sin compactación «para no perder nada».`
      : `Sin compactar, ${turns} turnos ocupan ${kTok(m.transcript)} de ${kTok(WINDOW)}. Todo el verbatim sigue en el contexto; aún cabe, pero crece con cada turno.`;
  else if (keep === "search")
    story = `Compactado con linaje: el modelo ve ${kTok(m.context)} (resumen de ${kTok(SUMMARY)} más los ${TAIL} últimos turnos), pero la tabla messages conserva los ${kTok(m.stored)} originales y FTS5 indexa ${m.indexed} turnos. La búsqueda de «id 12345» encuentra el turno ${NEEDLE_TURN} y devuelve su verbatim.`;
  else
    story = `Compactado y olvidado: el contexto también queda en ${kTok(m.context)}, pero messages está vacía y el FTS no tiene nada. «id 12345» vivía en el turno ${NEEDLE_TURN}; ya solo existe lo que diga el resumen. No hay vuelta atrás.`;

  return (
    <Figure
      label="Compactar cambia el texto, no la identidad del hilo"
      hint={`thread_id t_81 · ${turns} turnos · ${kTok(TURN_TOKENS)} por turno`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Turnos verbatim" },
        { color: P.violet, label: "Resumen" },
        { color: P.amber, label: "Turno con «id 12345»" },
        { color: P.rose, label: "Desbordado o perdido" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="Estrategia de compactación" value={keep} onChange={setKeep} options={[{ value: "search", label: "Compactar y buscar", tone: P.teal }, { value: "forget", label: "Compactar y olvidar", tone: P.rose }]} />
          <Switcher ariaLabel="Momento" value={phase} onChange={setPhase} options={[{ value: "before", label: "Antes", tone: P.inkSoft }, { value: "after", label: "Después", tone: P.violet }]} />
          <Knob label="Turnos" value={turns} min={12} max={40} onChange={setTurns} />
          <button type="button" className="chip" aria-pressed={query} onClick={() => setQuery(!query)}>{query ? "Ocultar búsqueda" : "Buscar «id 12345»"}</button>
        </>
      }
      note={
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3 border-b border-line pb-3">
            {[
              ["Contexto del modelo", `${kTok(m.context)} / ${kTok(WINDOW)}`, m.overflow],
              ["Tabla messages", kTok(m.stored), m.compacted && m.stored === 0],
              ["Turnos en FTS5", String(m.indexed), m.compacted && m.indexed === 0],
              ["«id 12345»", query ? (found ? (inContext ? "en contexto" : `turno ${NEEDLE_TURN}`) : "sin resultado") : "—", query && !found],
            ].map(([label, value, bad]) => (
              <div key={label as string}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className={`mt-1 block font-display text-xl ${bad ? "text-rose" : "text-ink"}`}>{value}</strong>
              </div>
            ))}
          </div>
          <p>{story}</p>
          <p className="text-xs text-muted">
            En las dos estrategias el thread_id sigue siendo t_81: para reproducir un bug usa thread_id y turn_id, no el texto. Tamaños didácticos, no medidos en un arnés concreto.
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [5, 6.5, 10], fov: 34 }} fit={1.06}>
        <CompactionBench turns={turns} keep={keep} phase={phase} query={query} inContext={inContext} found={found} overflow={m.overflow} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
const L = 6;
const X0 = -3;
const unit = (tokens: number) => (tokens / WINDOW) * L;
const CARD = 0.145;

function Box({ p, s, color, rough = 0.45, coat = 0.4 }: { p: V3; s: V3; color: string; rough?: number; coat?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.03, s[1] / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} clearcoat={coat} />
    </RoundedBox>
  );
}

function CompactionBench({ turns, keep, phase, query, inContext, found, overflow }: { turns: number; keep: Keep; phase: Phase; query: boolean; inContext: boolean; found: boolean; overflow: boolean }) {
  const after = phase === "after";
  const kept = keep === "search" || !after;
  const w = unit(TURN_TOKENS);
  const blocks: { x: number; color: string; width: number; spill: boolean }[] = [];
  if (!after) {
    for (let t = 0; t < turns; t++) {
      const x = X0 + t * w;
      blocks.push({ x, width: w, spill: x + w > X0 + L + 1e-6, color: t + 1 === NEEDLE_TURN ? P.amber : P.teal });
    }
  } else {
    blocks.push({ x: X0, width: unit(SUMMARY), spill: false, color: P.violet });
    for (let t = 0; t < TAIL; t++) blocks.push({ x: X0 + unit(SUMMARY) + t * w, width: w, spill: false, color: turns - TAIL + t + 1 === NEEDLE_TURN ? P.amber : P.teal });
  }
  const cardX = (t: number) => X0 + 0.1 + t * CARD;
  const needleX = cardX(NEEDLE_TURN - 1);
  const landX = after ? X0 + unit(SUMMARY + TAIL * TURN_TOKENS) + 0.25 : X0;
  const searching = query && !inContext;
  return (
    <group>
      <ShadowBlob position={[0, -0.25, 0]} scale={10} opacity={0.08} />
      <Box p={[0, -0.14, -0.35]} s={[8.2, 0.24, 4.6]} color="#263532" rough={0.4} coat={0.35} />
      <Box p={[0, 0.0, -0.35]} s={[7.9, 0.05, 4.3]} color={mixHex(P.paper, P.sunken, 0.7)} rough={0.6} coat={0} />

      {/* Context window: a glass trough exactly 128 k long. */}
      <group position={[0, 0, 1.1]}>
        <Box p={[0, 0.06, 0]} s={[L + 0.16, 0.08, 0.8]} color="#D6D0C2" rough={0.5} coat={0.2} />
        {[-0.4, 0.4].map((z) => (
          <mesh key={z} position={[0, 0.3, z]}>
            <boxGeometry args={[L + 0.16, 0.42, 0.03]} />
            <meshPhysicalMaterial color={P.tealWash} transparent opacity={0.3} roughness={0.1} depthWrite={false} />
          </mesh>
        ))}
        {[X0 - 0.08, X0 + L + 0.08].map((x) => (
          <mesh key={x} position={[x, 0.3, 0]} castShadow>
            <boxGeometry args={[0.06, 0.5, 0.86]} />
            <meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.28} />
          </mesh>
        ))}
        {blocks.map((b, k) => (
          <Box key={k} p={[b.x + b.width / 2, b.spill ? 0.62 + (k % 3) * 0.05 : 0.28, b.spill ? 0.15 - (k % 2) * 0.3 : 0]} s={[b.width * 0.92, 0.34, 0.6]} color={b.spill ? P.rose : b.color} />
        ))}
        <Tag position={[X0 + L / 2, 0.85, -0.45]} tone={overflow ? "rose" : "teal"} size="xs" center>{overflow ? "Ventana desbordada" : "Ventana 128 k"}</Tag>
        {after ? <Tag position={[X0 + unit(SUMMARY) / 2, 0.75, 0.3]} tone="violet" size="xs" center>Resumen</Tag> : null}
      </group>

      {/* The messages table: one card per original turn. */}
      <group position={[0, 0, -0.6]}>
        <Box p={[0, 0.07, 0]} s={[L + 0.3, 0.1, 0.9]} color="#3A4745" rough={0.45} coat={0.3} />
        {Array.from({ length: turns }, (_, t) =>
          kept ? (
            <mesh key={t} position={[cardX(t), 0.3, 0]} rotation={[-0.2, 0, 0]} castShadow>
              <boxGeometry args={[CARD * 0.8, 0.36, 0.5]} />
              <meshStandardMaterial color={t + 1 === NEEDLE_TURN ? P.amber : mixHex(P.paper, P.teal, 0.45)} roughness={0.5} />
            </mesh>
          ) : (
            <mesh key={t} position={[cardX(t), 0.125, 0]}>
              <boxGeometry args={[CARD * 0.8, 0.01, 0.5]} />
              <meshBasicMaterial color={P.roseWash} />
            </mesh>
          ),
        )}
        <Tag position={[X0 + L + 0.35, 0.3, 0]} tone={kept ? "teal" : "rose"} size="xs">{kept ? "messages" : "messages vacía"}</Tag>
      </group>

      {/* FTS5: a comb, one tooth per indexed turn. */}
      <group position={[0, 0, -1.85]}>
        <Box p={[0, 0.12, 0]} s={[L + 0.3, 0.2, 0.55]} color={mixHex(P.paper, P.violet, 0.3)} rough={0.4} coat={0.4} />
        {kept
          ? Array.from({ length: turns }, (_, t) => (
              <mesh key={t} position={[cardX(t), 0.3 + (searching && t + 1 === NEEDLE_TURN ? 0.12 : 0), 0]} castShadow>
                <boxGeometry args={[0.035, searching && t + 1 === NEEDLE_TURN ? 0.4 : 0.16, 0.3]} />
                <meshStandardMaterial color={searching && t + 1 === NEEDLE_TURN ? P.amber : P.violetDeep} roughness={0.45} />
              </mesh>
            ))
          : null}
        <Tag position={[X0 + L + 0.35, 0.3, 0]} tone="violet" size="xs">FTS5</Tag>
      </group>

      {searching && found ? (
        <Flow points={[[needleX, 0.6, -1.85], [needleX, 0.9, -0.6], [(needleX + landX) / 2, 1.1, 0.3], [landX, 0.55, 1.1]]} color={P.amber} count={3} size={0.045} speed={0.35} lineOpacity={0.5} />
      ) : null}
      {searching && !found ? (
        <>
          <Flow points={[[X0 + L + 0.6, 1.2, -1.85], [needleX + 1.5, 0.9, -1.85], [needleX, 0.5, -1.85]]} color={P.rose} count={2} size={0.04} speed={0.3} lineOpacity={0.4} />
          <Tag position={[needleX, 0.75, -1.85]} tone="rose" size="xs" center>Sin resultado</Tag>
        </>
      ) : null}
      {searching && found ? <Tag position={[needleX, 1.05, -1.2]} tone="amber" size="xs" center>Turno 7</Tag> : null}

      {/* The thread identity never changes. */}
      <group position={[0, 0, 1.75]}>
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[1.4, 0.05, 0.22]} />
          <meshStandardMaterial color="#B68442" metalness={0.75} roughness={0.25} />
        </mesh>
        <Tag position={[0, 0.2, 0.05]} tone="ink" size="xs" center>thread_id t_81</Tag>
      </group>
    </group>
  );
}

"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Why two lanes beat one lock, shown by letting the wrong answers run.
 *
 * With no lock at all, two inbound messages on the same DM both reach
 * runEmbeddedAgent against the same SQLite session row and their
 * transcript commits interleave — the model ends up reading a history
 * that never happened. With one global lock nothing interleaves and
 * nothing overlaps either, so twenty group chats queue behind one. The
 * lanes are the middle: a writer lock per session row, a process budget
 * on main, and separate lanes for subagent and cron work.
 */

type Mode = "lanes" | "global" | "none";

/** The lanes the runtime actually has, with their documented budgets. */
const LANES = [
  { id: "session", color: P.teal, slots: 1 },
  { id: "main", color: P.violet, slots: 3 },
  { id: "subagent", color: P.amber, slots: 8 },
  { id: "cron", color: P.rose, slots: 2 },
] as const;

const COPY = {
  en: {
    title: "two lanes, not one lock",
    hint: "watch what the wrong answers do to the transcript",
    lanes: "Lanes",
    global: "One global lock",
    none: "No lock",
    legendRun: "running",
    legendWait: "waiting",
    legendCorrupt: "interleaved",
    session: "session · writer lock",
    main: "main · process budget",
    subagent: "subagent",
    cron: "cron-nested",
    inflight: "running at once",
    waiting: "waiting",
    survives: "survives a Gateway restart",
    survivesYes: "session rows in SQLite",
    survivesNo: "the queue itself does not",
    slots: "slots",
    lanesNote:
      "the session lane is a writer lock, so two messages on the same DM can never commit transcript at the same time. main is the process budget — a Gateway hosting twenty group chats still runs several sessions in parallel without opening twenty provider calls at once. Subagent work gets its own lane so a swarm cannot starve inbound replies.",
    globalNote:
      "nothing interleaves, and nothing overlaps either. One lock across the whole process means twenty group chats queue behind whichever one arrived first, and a slow background turn blocks every reply in the building.",
    noneNote:
      "two inbound messages on the same DM both call runEmbeddedAgent against the same session row. The transcript commits race, tool results interleave, and the model reads a history that never happened. This is what the session lane exists to prevent.",
  },
  es: {
    title: "dos lanes, no un lock",
    hint: "mira lo que las respuestas equivocadas le hacen al transcript",
    lanes: "Lanes",
    global: "Un lock global",
    none: "Sin lock",
    legendRun: "corriendo",
    legendWait: "esperando",
    legendCorrupt: "entremezclado",
    session: "sesión · lock de escritor",
    main: "main · presupuesto de proceso",
    subagent: "subagente",
    cron: "cron-nested",
    inflight: "a la vez",
    waiting: "esperando",
    survives: "sobrevive a un reinicio del Gateway",
    survivesYes: "las filas de sesión en SQLite",
    survivesNo: "la cola misma no",
    slots: "slots",
    lanesNote:
      "la lane de sesión es un lock de escritor, así que dos mensajes del mismo DM nunca pueden comprometer transcript a la vez. main es el presupuesto de proceso — un Gateway con veinte grupos sigue corriendo varias sesiones en paralelo sin abrir veinte llamadas de proveedor de golpe. El trabajo subagent tiene su propia lane para que un enjambre no deje sin aire a los replies.",
    globalNote:
      "nada se entremezcla, y nada se solapa tampoco. Un lock para todo el proceso significa que veinte grupos hacen cola detrás del que llegó primero, y un turno lento de fondo bloquea todas las respuestas del edificio.",
    noneNote:
      "dos mensajes del mismo DM llaman los dos a runEmbeddedAgent contra la misma fila de sesión. Los commits de transcript compiten, los resultados de tools se entremezclan, y el modelo lee una historia que nunca ocurrió. Esto es lo que la lane de sesión existe para evitar.",
  },
};

/** A job riding a lane, or stuck at its head. */
function Job({
  lane,
  index,
  running,
  color,
  corrupt,
}: {
  lane: number;
  index: number;
  running: boolean;
  color: string;
  corrupt: boolean;
}) {
  const ref = useRef<Group>(null);
  const z = -2.4 + lane * 1.6;
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    if (running) {
      // Running work moves along its lane and loops.
      const t = ((clock.elapsedTime * 0.35 + index * 0.27) % 1) * 6 - 3;
      g.position.x = t;
    } else {
      // Waiting work stacks up behind the head of the lane.
      g.position.x = MathUtils.damp(g.position.x, -3.4 - index * 0.42, 6, dt);
    }
    g.position.z = MathUtils.damp(g.position.z, corrupt ? z + Math.sin(index * 2.3) * 0.28 : z, 5, dt);
  });
  return (
    <group ref={ref} position={[-3.4, 0.34, z]}>
      <RoundedBox args={[0.42, 0.2, 0.42]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial
          color={corrupt ? P.rose : running ? color : P.line}
          roughness={0.36}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("lanes");

  /* How many lanes exist, and how much each may run at once. */
  const active =
    mode === "lanes"
      ? LANES.map((l) => ({ ...l, slots: l.slots }))
      : mode === "global"
        ? [{ id: "main" as const, color: P.violet, slots: 1 }]
        : LANES.slice(0, 1).map((l) => ({ ...l, slots: 4 }));

  const arriving = 6;
  const inflight = active.reduce((n, l) => n + Math.min(l.slots, arriving), 0);
  const waiting = Math.max(0, active.length * arriving - inflight);
  const corrupt = mode === "none";

  const note = mode === "lanes" ? t.lanesNote : mode === "global" ? t.globalNote : t.noneNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendRun },
        { color: P.line, label: t.legendWait },
        { color: P.rose, label: t.legendCorrupt },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "lanes", label: t.lanes, tone: P.teal },
            { value: "global", label: t.global, tone: P.violet },
            { value: "none", label: t.none, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                { label: t.inflight, value: String(inflight), tone: "var(--teal)" },
                { label: t.waiting, value: String(waiting), tone: "var(--muted)" },
                {
                  label: t.survives,
                  value: `${t.survivesYes} · ${t.survivesNo}`,
                  tone: "var(--amber)",
                },
              ]}
            />
          </div>
        </>
      }
      height="h-[390px] md:h-[480px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={13} depth={10} y={-0.05} />

        {active.map((lane, li) => {
          const z = -2.4 + li * 1.6;
          return (
            <group key={lane.id}>
              {/* The lane itself, as long as the work it carries. */}
              <RoundedBox
                args={[7.2, 0.14, 0.8]}
                radius={0.05}
                smoothness={3}
                position={[0, 0.07, z]}
                receiveShadow
              >
                <meshStandardMaterial color={P.sunken} roughness={0.5} metalness={0.03} />
              </RoundedBox>
              <Tag position={[-4.6, 0.2, z]} tone="ink" size="xs" center>
                {t[lane.id as keyof typeof t] as string}
              </Tag>
              <Tag position={[4.5, 0.2, z]} tone="muted" size="xs" center>
                {lane.slots} {t.slots}
              </Tag>

              {/* Slot markers: the budget, drawn rather than stated. */}
              {Array.from({ length: Math.min(lane.slots, 8) }, (_, i) => (
                <mesh key={i} position={[-2.6 + i * 0.7, 0.15, z]}>
                  <cylinderGeometry args={[0.1, 0.1, 0.03, 12]} />
                  <meshBasicMaterial color={lane.color} transparent opacity={0.5} />
                </mesh>
              ))}

              {Array.from({ length: arriving }, (_, i) => (
                <Job
                  key={i}
                  lane={li}
                  index={i}
                  running={i < lane.slots}
                  color={lane.color}
                  corrupt={corrupt && i < 2}
                />
              ))}
            </group>
          );
        })}

        {/* Where the damage lands when nothing is holding the row. */}
        {corrupt ? (
          <group position={[1.6, 0.9, -2.4]}>
            <Node3D position={[0, 0, 0]} color={P.rose} radius={0.16} />
            <Halo radius={0.5} color={P.rose} opacity={0.8} spin={0.6} />
            <Tag position={[0, 0.55, 0]} tone="rose" size="xs" center>
              {t.legendCorrupt}
            </Tag>
          </group>
        ) : null}

        {/* One lock means one queue, so the tail is the whole point. */}
        {mode === "global" ? (
          <AxisLine
            from={[-3.6, 0.5, -2.4]}
            to={[-3.6, 0.5, 2.6]}
            overrun={0.3}
            color={P.violet}
            opacity={0.5}
          />
        ) : null}

        <IsoDust count={22} center={[0, 1, 0]} spread={[3.6, 0.6, 2.6]} />
      </Stage>
    </Figure>
  );
}

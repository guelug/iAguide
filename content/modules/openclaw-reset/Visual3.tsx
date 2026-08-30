"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Which clock each reset mode is actually watching.
 *
 * The section runs about 1,700 words on three modes, two clocks and one
 * tie-break rule, and the reader has to simulate it in their head. Here
 * the rail is wall-clock time, the ribbon is one session id, and the cut
 * is computed: idle fires at lastInteraction + idleMinutes, daily fires
 * at atHour, and whichever comes first mints the new id.
 *
 * The automation tick is the point of the whole drawing. It sits on the
 * rail like the others and does not move the idle clock, because only
 * visible user activity updates session freshness.
 */

type Mode = "none" | "idle" | "daily" | "both";

/** Hours on the plate. The window is one night into the morning. */
const H0 = 0;
const H1 = 8;
const SPAN = 8.6;
const x = (h: number) => -SPAN / 2 + ((h - H0) / (H1 - H0)) * SPAN;

type Tick = { h: number; user: boolean };

/** A fixed evening: three real messages and one automation turn. */
const TICKS: Tick[] = [
  { h: 0.35, user: true },
  { h: 1.15, user: true },
  { h: 2.1, user: false },
  { h: 3.5, user: true },
];

const LAST_USER = TICKS.filter((t) => t.user).at(-1)!.h;
/** The automation turn is later than the last message, and irrelevant. */
const LAST_ANY = TICKS.at(-1)!.h;

const COPY = {
  en: {
    title: "which clock the reset is watching",
    hint: "the rail is wall-clock time · the ribbon is one session id",
    none: "none",
    idle: "idle",
    daily: "daily",
    both: "both",
    legendThread: "session id",
    legendNew: "new id",
    legendUser: "user message",
    legendAuto: "automation turn",
    idleMinutes: "idle",
    atHour: "atHour",
    user: "message",
    auto: "automation",
    noCount: "does not extend freshness",
    newId: "new id",
    fires: "fires",
    never: "never rolls",
    winner: "first to expire",
    noneNote:
      "the default. A main personal session is meant to be one continuous conversation, so compaction — not reset — is how a months-long DM stays inside the window.",
    idleNote:
      "the group-chat knife. Idle minutes are wall-clock silence measured against the last real inbound, so a long agent run that finishes while the human is quiet does not count as interaction.",
    dailyNote:
      "the new-morning knife. atHour is an integer 0-23 in the Gateway host's local time — there is no cron expression in session.reset.",
    bothNote:
      "with both set, the first predicate to expire mints the new id and discards the system-event notices queued for the old one.",
  },
  es: {
    title: "qué reloj está mirando el reset",
    hint: "el raíl es la hora de pared · la cinta es un id de sesión",
    none: "none",
    idle: "idle",
    daily: "daily",
    both: "ambos",
    legendThread: "id de sesión",
    legendNew: "id nuevo",
    legendUser: "mensaje del usuario",
    legendAuto: "turno de automatización",
    idleMinutes: "idle",
    atHour: "atHour",
    user: "mensaje",
    auto: "automatización",
    noCount: "no alarga la frescura",
    newId: "id nuevo",
    fires: "dispara",
    never: "no rueda",
    winner: "expira primero",
    noneNote:
      "el default. Una sesión main personal es una conversación continua, así que la compactación —no el reset— es como un DM de meses se queda dentro de la ventana.",
    idleNote:
      "el cuchillo del chat de grupo. Los minutos idle son silencio de reloj de pared contra el último inbound real: un run largo de agente que acaba mientras el humano calla no cuenta como interacción.",
    dailyNote:
      "el cuchillo de mañana nueva. atHour es un entero 0-23 en hora local del host del Gateway — no hay expresión cron en session.reset.",
    bothNote:
      "con los dos puestos, el primer predicado que expira acuña el id nuevo y descarta los avisos de system-event en cola para el viejo.",
  },
};

/** The rail: hours, ticks, and a printed scale. */
function Rail({ atHourLabel }: { atHourLabel: (h: number) => string }) {
  const hours = useMemo(() => Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i), []);
  return (
    <group>
      <RoundedBox
        args={[SPAN + 0.6, 0.16, 0.9]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.08, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={P.sunken} roughness={0.5} metalness={0.03} />
      </RoundedBox>
      {hours.map((h) => (
        <group key={h} position={[x(h), 0.17, 0]}>
          <mesh position={[0, 0.01, 0.38]}>
            <boxGeometry args={[0.03, 0.02, h % 2 === 0 ? 0.2 : 0.1]} />
            <meshStandardMaterial color={P.lineStrong} roughness={0.6} />
          </mesh>
          {h % 2 === 0 ? (
            <Tag position={[0, 0.02, 0.85]} tone="muted" size="xs" center>
              {atHourLabel(h)}
            </Tag>
          ) : null}
        </group>
      ))}
    </group>
  );
}

/** One session id, drawn as a bar that stops where it is cut. */
function Thread({
  from,
  to,
  color,
  y = 0.42,
}: {
  from: number;
  to: number;
  color: string;
  y?: number;
}) {
  const ref = useRef<Group>(null);
  const w = Math.max(0.02, x(to) - x(from));
  const cx = (x(from) + x(to)) / 2;
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.scale.x = MathUtils.damp(g.scale.x, w, 7, dt);
    g.position.x = MathUtils.damp(g.position.x, cx, 7, dt);
  });
  return (
    <group ref={ref} position={[cx, y, 0]} scale={[w, 1, 1]}>
      <RoundedBox args={[1, 0.22, 0.5]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.32}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>
    </group>
  );
}

/** A post standing on the rail where something happened. */
function Post({
  h,
  height,
  color,
  label,
  tone,
  ghost = false,
}: {
  h: number;
  height: number;
  color: string;
  label?: string;
  tone?: "teal" | "amber" | "violet" | "ink" | "rose" | "muted";
  ghost?: boolean;
}) {
  return (
    <group position={[x(h), 0.16, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[ghost ? 0.04 : 0.08, height, ghost ? 0.04 : 0.08]} />
        <meshStandardMaterial
          color={color}
          transparent={ghost}
          opacity={ghost ? 0.45 : 1}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
      {label ? (
        <Tag position={[0, height + 0.26, 0]} tone={tone ?? "muted"} size="xs" center>
          {label}
        </Tag>
      ) : null}
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("none");
  const [idleMin, setIdleMin] = useState(30);
  const [atHour, setAtHour] = useState(4);

  /* The rule, computed rather than described: idle counts from the last
     *user* message, daily is a fixed hour, and the earlier one wins. */
  const idleFire = mode === "idle" || mode === "both" ? LAST_USER + idleMin / 60 : null;
  const dailyFire = mode === "daily" || mode === "both" ? atHour : null;
  const candidates = [idleFire, dailyFire].filter(
    (v): v is number => v !== null && v <= H1,
  );
  const fire = candidates.length ? Math.min(...candidates) : null;
  const winner =
    fire === null ? null : fire === idleFire && (dailyFire === null || idleFire <= dailyFire)
      ? "idle"
      : "daily";

  const label = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:00`;
  const hhmm = (h: number) =>
    `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

  const note =
    mode === "none"
      ? t.noneNote
      : mode === "idle"
        ? t.idleNote
        : mode === "daily"
          ? t.dailyNote
          : t.bothNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendThread },
        { color: P.violet, label: t.legendNew },
        { color: P.ink, label: t.legendUser },
        { color: P.rose, label: t.legendAuto },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "none", label: t.none, tone: P.teal },
              { value: "idle", label: t.idle, tone: P.amber },
              { value: "daily", label: t.daily, tone: P.violet },
              { value: "both", label: t.both, tone: P.rose },
            ]}
            ariaLabel={t.title}
          />
          <Knob
            label={t.idleMinutes}
            value={idleMin}
            min={15}
            max={180}
            step={5}
            onChange={setIdleMin}
            format={(v) => `${v}m`}
            tone={P.amber}
          />
          <Knob
            label={t.atHour}
            value={atHour}
            min={1}
            max={7}
            step={1}
            onChange={setAtHour}
            format={(v) => `${v}h`}
            tone={P.violet}
          />
        </>
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                {
                  label: t.winner,
                  value: fire === null ? t.never : `${winner} · ${hhmm(fire)}`,
                  tone: winner === "idle" ? "var(--amber)" : winner === "daily" ? "var(--violet)" : "var(--teal)",
                },
                { label: t.auto, value: t.noCount, tone: "var(--rose)" },
              ]}
            />
          </div>
        </>
      }
      height="h-[380px] md:h-[460px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.18}
      >
        <IsoFrame width={12} depth={7} y={-0.03} />
        <PlanTrace
          points={[
            [-5.4, 2.2],
            [-5.4, -2.2],
            [5.4, -2.2],
          ]}
          y={-0.02}
          color={P.line}
          opacity={0.7}
        />

        <Rail atHourLabel={label} />

        {/* The session id, cut where the predicate fires. */}
        <Thread from={H0} to={fire ?? H1} color={P.teal} />
        {fire !== null ? <Thread from={fire} to={H1} color={P.violet} y={0.42} /> : null}

        {/* What actually happened on the rail. */}
        {TICKS.map((tick, i) => (
          <Post
            key={i}
            h={tick.h}
            height={tick.user ? 0.75 : 0.5}
            color={tick.user ? P.ink : P.rose}
            label={tick.user ? t.user : t.auto}
            tone={tick.user ? "ink" : "rose"}
          />
        ))}

        {/* The idle window, drawn from the last real message. */}
        {idleFire !== null ? (
          <group>
            <AxisLine
              from={[x(LAST_USER), 0.95, -0.55]}
              to={[x(Math.min(idleFire, H1)), 0.95, -0.55]}
              overrun={0}
              color={P.amber}
              opacity={0.75}
              dashed={false}
            />
            <Tag position={[x((LAST_USER + Math.min(idleFire, H1)) / 2), 1.25, -0.55]} tone="amber" size="xs" center>
              {t.idleMinutes} {idleMin}m
            </Tag>
            <Post
              h={Math.min(idleFire, H1)}
              height={1.15}
              color={P.amber}
              ghost={winner !== "idle"}
            />
          </group>
        ) : null}

        {/* The daily gate: a fixed hour, whatever anyone did. */}
        {dailyFire !== null ? (
          <group>
            <Post h={dailyFire} height={1.15} color={P.violet} ghost={winner !== "daily"} />
            <Tag position={[x(dailyFire), 1.55, 0.35]} tone="violet" size="xs" center>
              {t.atHour} {atHour}
            </Tag>
          </group>
        ) : null}

        {/* Where the new id starts. */}
        {fire !== null ? (
          <group position={[x(fire), 0.42, 0]}>
            <Node3D position={[0, 0, 0]} color={P.violet} radius={0.14} />
            <Halo radius={0.4} color={P.violet} opacity={0.7} spin={0.5} />
            <Tag position={[0, 0.75, 0.55]} tone="violet" size="xs" center>
              {t.newId} · {hhmm(fire)}
            </Tag>
          </group>
        ) : null}

        {/* The automation turn is on the rail and moves nothing. */}
        <AxisLine
          from={[x(LAST_ANY), 0.5, 0]}
          to={[x(LAST_ANY), 1.5, 0]}
          overrun={0}
          color={P.rose}
          opacity={0.4}
        />
        <Tag position={[x(LAST_ANY), 1.75, 0]} tone="rose" size="xs" center>
          {t.noCount}
        </Tag>

        <IsoDust count={28} center={[0, 1.1, 0]} spread={[4.6, 0.7, 0.9]} />
      </Stage>
    </Figure>
  );
}

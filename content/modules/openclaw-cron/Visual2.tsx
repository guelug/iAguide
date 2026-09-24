"use client";

import { useMemo, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, PointerTilt, Ribbon, Slab, Tag, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Mode = "schedule" | "sessions" | "delivery";
const COPY = {
  en: { title: "OpenClaw cron lives in the Gateway", hint: "schedule · session style · delivery", schedule: "schedule", sessions: "sessions", delivery: "delivery", at: "at", every: "every", cron: "cron", main: "main", isolated: "isolated", current: "current", chat: "chat", webhook: "webhook", none: "nowhere" },
  es: { title: "el cron de OpenClaw vive en Gateway", hint: "horario · estilo sesión · entrega", schedule: "horario", sessions: "sesiones", delivery: "entrega", at: "at", every: "every", cron: "cron", main: "main", isolated: "aislada", current: "actual", chat: "chat", webhook: "webhook", none: "ningún sitio" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("schedule");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.schedule }, { color: P.violet, label: t.sessions }, { color: P.amber, label: t.delivery }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "schedule", label: t.schedule, tone: P.teal }, { value: "sessions", label: t.sessions, tone: P.violet }, { value: "delivery", label: t.delivery, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "schedule" && <>{[[t.at, P.teal, -1.7], [t.every, P.violet, 0], [t.cron, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.85, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.76, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">Gateway encendido → tick → run</Tag></>}
        {mode === "sessions" && <>{[[t.main, P.teal, -1.7], [t.isolated, P.violet, 0], [t.current, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.85, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.76, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">cron · job-id para chores sin historial</Tag></>}
        {mode === "delivery" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.76, 0.15]} tone="teal">{t.chat}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.76, 0.15]} tone="amber">{t.webhook}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.none} también es una opción</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ======================================================================
 * Versión española: a qué hora dispara de verdad un job.
 *
 * Reglas de la lección: un --at sin zona se lee en UTC; una expresión
 * cron sin --tz usa la zona del host del Gateway; --tz fija una zona
 * IANA. Día del mes y día de la semana se combinan con OR. Las
 * expresiones recurrentes en punto se escalonan hasta 5 minutos salvo
 * --exact. El equipo trabaja en Madrid en septiembre de 2027 (UTC+2).
 * ==================================================================== */

type Kind = "at" | "cron";
type HostTz = "utc" | "madrid";
type Days = "daily" | "or";

const TEAM_OFFSET = 2;
const WANT_HOUR = 9;
const YEAR = 2027;
const MONTH = 8; // September, zero-based
const DAYS_IN_MONTH = 30;

function fireModel(kind: Kind, tz: boolean, host: HostTz, days: Days, exact: boolean) {
  const readAsUtc = tz ? false : kind === "at" ? true : host === "utc";
  const utcHour = readAsUtc ? WANT_HOUR : WANT_HOUR - TEAM_OFFSET;
  const localHour = utcHour + TEAM_OFFSET;
  const zone = tz ? "Europe/Madrid (--tz)" : kind === "at" ? "UTC (at sin zona)" : host === "utc" ? "UTC (zona del host)" : "Europe/Madrid (zona del host)";
  const firstWeekday = new Date(Date.UTC(YEAR, MONTH, 1)).getUTCDay();
  const fires: number[] = [];
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    const weekday = (firstWeekday + d - 1) % 7;
    if (kind === "at") {
      if (d === 1) fires.push(d);
    } else if (days === "daily" || d === 15 || weekday === 1) fires.push(d);
  }
  const stagger = kind === "cron" && !exact ? 5 : 0;
  return { utcHour, localHour, late: localHour - WANT_HOUR, zone, fires, firstWeekday, stagger };
}

const hh = (h: number, m = 0) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

function SpanishVisual() {
  const [kind, setKind] = useState<Kind>("cron");
  const [tz, setTz] = useState(false);
  const [host, setHost] = useState<HostTz>("utc");
  const [days, setDays] = useState<Days>("daily");
  const [exact, setExact] = useState(false);
  const f = useMemo(() => fireModel(kind, tz, host, days, exact), [kind, tz, host, days, exact]);
  const expr = kind === "at" ? `--at "2027-09-01T09:00"${tz ? " --tz Europe/Madrid" : ""}` : `--cron "0 9 ${days === "or" ? "15 * 1" : "* * *"}"${tz ? " --tz Europe/Madrid" : ""}${exact ? " --exact" : ""}`;

  const timeNote = f.late
    ? `Se lee en ${f.zone}: dispara a las ${hh(f.utcHour)} UTC, que en Madrid son las ${hh(f.localHour)}. El informe llega ${f.late} horas tarde: es el caso del job que disparaba en la zona equivocada.`
    : `Se lee en ${f.zone}: dispara a las ${hh(f.localHour)} en Madrid (${hh(f.utcHour)} UTC), la hora que el equipo quería.`;
  const dayNote =
    kind === "at"
      ? "Un --at es un disparo único: una sola casilla en el calendario."
      : days === "or"
        ? `«0 9 15 * 1» no significa «el día 15 si es lunes». Día del mes y día de la semana se combinan con OR: dispara el 15 y todos los lunes, ${f.fires.length} veces en septiembre de 2027. Para exigir ambos, el modificador + de croner o un guard en el prompt.`
        : `Cada día: ${f.fires.length} disparos en septiembre.`;
  const staggerNote = kind === "cron" ? (exact ? "--exact fuerza el minuto exacto." : "Al ser recurrente y en punto, el scheduler lo escalona hasta 5 minutos; --exact lo evita.") : "";

  return (
    <Figure
      label="La zona horaria decide a qué hora llega el informe"
      hint={`equipo en Madrid · UTC+${TEAM_OFFSET} en septiembre de ${YEAR}`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Disparo a tiempo" },
        { color: P.rose, label: "Disparo desplazado" },
        { color: P.amber, label: "Hora deseada 09:00" },
        { color: P.violet, label: "Lunes y día 15" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="Tipo de horario" value={kind} onChange={setKind} options={[{ value: "at", label: "--at", tone: P.teal }, { value: "cron", label: "--cron", tone: P.teal }]} />
          <button type="button" className="chip" aria-pressed={tz} onClick={() => setTz(!tz)}>{tz ? "--tz Europe/Madrid" : "Sin --tz"}</button>
          <Switcher ariaLabel="Zona del host del Gateway" value={host} onChange={setHost} options={[{ value: "utc", label: "Host en UTC", tone: P.inkSoft }, { value: "madrid", label: "Host en Madrid", tone: P.inkSoft }]} />
          {kind === "cron" ? <Switcher ariaLabel="Días" value={days} onChange={setDays} options={[{ value: "daily", label: "* * *", tone: P.teal }, { value: "or", label: "15 * 1", tone: P.violet }]} /> : null}
          {kind === "cron" ? <button type="button" className="chip" aria-pressed={exact} onClick={() => setExact(!exact)}>{exact ? "Con --exact" : "Sin --exact"}</button> : null}
        </>
      }
      note={
        <div className="space-y-3">
          <p className="rounded border border-line bg-paper p-3 font-mono text-xs">openclaw automations create {expr}</p>
          <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
            {[
              ["Hora en Madrid", f.stagger ? `${hh(f.localHour)}–${hh(f.localHour, f.stagger)}` : hh(f.localHour)],
              ["Retraso", f.late ? `+${f.late} h` : "0"],
              ["Disparos en septiembre", String(f.fires.length)],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className={`mt-1 block font-display text-2xl ${label === "Retraso" && f.late ? "text-rose" : "text-ink"}`}>{value}</strong>
              </div>
            ))}
          </div>
          <p>{timeNote} {dayNote} {staggerNote}</p>
          <p className="text-xs text-muted">--tz no es válido con --every ni con --on-exit. Offset fijo de UTC+2 porque septiembre cae en horario de verano. Fuente: OpenClaw, Automations y Timezone.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2, 7.5, 9.5], fov: 34 }} fit={1.04}>
        <TimeBench f={f} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
function Tile({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

const ang = (h: number) => (h / 24) * Math.PI * 2;

function Dial24({ position, hour, want, label, late }: { position: V3; hour: number; want?: number; label: string; late: boolean }) {
  const R = 0.95;
  const handColor = late ? P.rose : P.teal;
  const arc: V3[] = [];
  if (want !== undefined && late) for (let k = 0; k <= 16; k++) {
    const a = ang(want + ((hour - want) * k) / 16);
    arc.push([Math.sin(a) * (R + 0.12), 0.1, -Math.cos(a) * (R + 0.12)]);
  }
  return (
    <group position={position}>
      <Tile p={[0, 0.12, 0.2]} s={[2.4, 0.14, 2.4]} color="#2E3438" metal={0.3} />
      <group position={[0, 0.75, 0]} rotation={[0.75, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[R + 0.2, R + 0.2, 0.14, 48]} />
          <meshPhysicalMaterial color="#B68442" metalness={0.7} roughness={0.28} clearcoat={0.4} />
        </mesh>
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[R + 0.06, R + 0.06, 0.02, 48]} />
          <meshStandardMaterial color="#F4F0E6" roughness={0.5} />
        </mesh>
        {Array.from({ length: 24 }, (_, h) => (
          <mesh key={h} position={[Math.sin(ang(h)) * R * 0.88, 0.095, -Math.cos(ang(h)) * R * 0.88]} rotation={[0, -ang(h), 0]}>
            <boxGeometry args={[0.03, 0.02, h % 6 === 0 ? 0.18 : 0.08]} />
            <meshStandardMaterial color={P.inkSoft} />
          </mesh>
        ))}
        {want !== undefined ? (
          <mesh position={[Math.sin(ang(want)) * R * 0.95, 0.12, -Math.cos(ang(want)) * R * 0.95]}>
            <sphereGeometry args={[0.07, 14, 10]} />
            <meshStandardMaterial color={P.amber} />
          </mesh>
        ) : null}
        <group rotation={[0, -ang(hour), 0]}>
          <mesh position={[0, 0.13, -R * 0.4]} castShadow>
            <boxGeometry args={[0.06, 0.04, R * 0.8]} />
            <meshStandardMaterial color={handColor} />
          </mesh>
        </group>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
          <meshStandardMaterial color={handColor} />
        </mesh>
        {arc.length ? <Wire points={arc} color={P.rose} width={3} opacity={0.9} /> : null}
      </group>
      <Tag position={[0, 1.95, -0.4]} tone={late ? "rose" : "ink"} size="xs" center>{`${label} · ${hh(hour)}`}</Tag>
    </group>
  );
}

function TimeBench({ f }: { f: ReturnType<typeof fireModel> }) {
  const late = f.late !== 0;
  const offset = (f.firstWeekday + 6) % 7; // Monday-first column of day 1
  const cell = (d: number) => {
    const idx = offset + d - 1;
    return { col: idx % 7, row: Math.floor(idx / 7) };
  };
  const CAL_X = 2.4;
  const PITCH = 0.5;
  const rows = Math.ceil((offset + DAYS_IN_MONTH) / 7);
  const cx = (col: number) => CAL_X + (col - 3) * PITCH;
  const cz = (row: number) => (row - (rows - 1) / 2) * PITCH;
  return (
    <group>
      <Tile p={[0, -0.13, 0]} s={[10, 0.22, 4.2]} color="#40362D" rough={0.6} coat={0.3} />
      <Tile p={[0, 0.0, 0]} s={[9.7, 0.05, 3.9]} color="#6B513A" rough={0.55} coat={0} />
      <Dial24 position={[-3.5, 0, -0.1]} hour={f.utcHour} label="UTC" late={false} />
      <Dial24 position={[-0.9, 0, -0.1]} hour={f.localHour} want={WANT_HOUR} label="Madrid" late={late} />

      {/* September 2027, Monday first. */}
      <Tile p={[CAL_X, 0.1, 0]} s={[7 * PITCH + 0.3, 0.12, rows * PITCH + 0.3]} color="#E6E0D2" rough={0.55} coat={0.2} />
      <mesh position={[cx(0), 0.17, 0]}>
        <boxGeometry args={[PITCH * 0.95, 0.01, rows * PITCH + 0.1]} />
        <meshStandardMaterial color={P.violetWash} />
      </mesh>
      {Array.from({ length: DAYS_IN_MONTH }, (_, k) => {
        const d = k + 1;
        const { col, row } = cell(d);
        const fire = f.fires.includes(d);
        const h = fire ? 0.28 : 0.08;
        return <Tile key={d} p={[cx(col), 0.18 + h / 2, cz(row)]} s={[PITCH * 0.82, h, PITCH * 0.82]} color={fire ? (late ? P.rose : P.teal) : d === 15 ? mixHex(P.paper, P.violet, 0.3) : "#F4F0E6"} />;
      })}
      <Tag position={[cx(0), 0.3, cz(0) - 0.55]} tone="violet" size="xs" center>lunes</Tag>
      <Tag position={[cx(cell(15).col), 0.75, cz(cell(15).row)]} tone="violet" size="xs" center>día 15</Tag>
      <Tag position={[CAL_X, 0.3, cz(rows - 1) + 0.6]} tone="ink" size="xs" center>{`septiembre · ${f.fires.length} disparos`}</Tag>
    </group>
  );
}

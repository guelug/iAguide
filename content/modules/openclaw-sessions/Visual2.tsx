"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, hash, type Cell } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* openclaw-sessions: lifecycle, last-message cursor, reload of an old session. */
type Mode = "life" | "cursor" | "reload";

const COPY = {
  en: {
    a_session_is_state_that_survives_restarts: "a session is state that survives restarts",
    lifecycle_cursor_reload: "lifecycle · cursor · reload",
    life: "lifecycle",
    cursor: "cursor",
    reload: "reload",
    created: "created",
    active: "active",
    idle: "idle",
    archived: "archived",
    last_message: "last message",
    resume: "resume",
  },
  es: {
    a_session_is_state_that_survives_restarts: "una sesión es estado que sobrevive restarts",
    lifecycle_cursor_reload: "ciclo · cursor · recarga",
    life: "ciclo",
    cursor: "cursor",
    reload: "recarga",
    created: "creada",
    active: "activa",
    idle: "ociosa",
    archived: "archivada",
    last_message: "último mensaje",
    resume: "reanuda",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("life");

  return (
    <Figure
      label={t.a_session_is_state_that_survives_restarts}
      hint={t.lifecycle_cursor_reload}
      legend={[
        { color: P.teal, label: t.active },
        { color: P.muted, label: t.idle },
        { color: P.violet, label: t.archived },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "life", label: t.life, tone: P.teal },
            { value: "cursor", label: t.cursor, tone: P.amber },
            { value: "reload", label: t.reload, tone: P.violet },
          ]}
          ariaLabel={t.a_session_is_state_that_survives_restarts}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "life" && (
          <>
            {(
              [
                [t.created, P.teal, -2.4, 0.5],
                [t.active, P.violet, -0.6, 0.5],
                [t.idle, P.amber, 1.2, 0.5],
                [t.archived, P.muted, 3.0, 0.5],
              ] as const
            ).map(([lab, col, x, y]) => (
              <group key={lab}>
                <Slab position={[x, y, 0]} size={[1.5, 0.9, 0.12]} color={col} fill={0.22} />
                <Tag position={[x, y + 0.5, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : col === P.amber ? "amber" : "muted"} size="xs">
                  {lab}
                </Tag>
              </group>
            ))}
            {[0, 1, 2].map((i) => (
              <Ribbon
                key={i}
                points={[[-1.6 + i * 1.8, 0.5, 0], [-0.7 + i * 1.8, 0.5, 0]]}
                color={P.lineStrong}
                radius={0.03}
                opacity={0.6}
              />
            ))}
            <Wire points={[[-2.4, -0.2, 0], [3.5, -0.2, 0]]} color={P.lineStrong} opacity={0.5} />
          </>
        )}

        {mode === "cursor" && (
          <>
            {/* messages stack with an amber cursor at the last one */}
            {[0, 1, 2, 3, 4].map((i) => (
              <Slab
                key={i}
                position={[0, 0.4 - i * 0.45, 0]}
                size={[3.0, 0.3, 0.12]}
                color={i === 4 ? P.teal : P.violet}
                fill={0.2}
              />
            ))}
            <Ribbon
              points={[[1.4, -1.25, 0], [1.9, -1.25, 0]]}
              color={P.amber}
              radius={0.04}
              opacity={0.85}
            />
            <Node3D position={[2.0, -1.25, 0]} color={P.amber} radius={0.14} pulse={0.3} />
            <Tag position={[2.0, -1.7, 0.15]} tone="amber" size="xs">{t.last_message}</Tag>
            <Tag position={[0, 1.05, 0.15]} tone="violet" size="xs">messages</Tag>
          </>
        )}

        {mode === "reload" && (
          <>
            {/* an old session being pulled back from archive into active */}
            <Slab position={[-1.9, 0.9, 0]} size={[1.5, 0.85, 0.12]} color={P.muted} fill={0.12} />
            <Tag position={[-1.9, 1.45, 0.15]} tone="muted" size="xs">{t.archived}</Tag>
            <Ribbon points={[[-1.1, 0.9, 0], [-0.3, 0.5, 0]]} color={P.violet} radius={0.04} opacity={0.85} />
            {/* active ring */}
            <Halo position={[0.4, 0.5, 0]} radius={0.7} color={P.violet} opacity={0.55} spin={0.2} />
            <Node3D position={[0.4, 0.5, 0]} color={P.violet} radius={0.2} pulse={0.3} />
            <Tag position={[0.4, 1.2, 0.15]} tone="violet">{t.active}</Tag>
            {/* cursor jumps to where we left off */}
            <Ribbon points={[[-0.7, 0.4, 0], [1.5, -0.4, 0]]} color={P.amber} radius={0.035} opacity={0.85} />
            <Node3D position={[1.7, -0.45, 0]} color={P.amber} radius={0.14} pulse={0.5} />
            <Tag position={[1.7, -0.85, 0.15]} tone="amber" size="xs">{t.resume}</Tag>
            <Ribbon points={[[-2.4, 0.05, 0], [2.5, 0.05, 0]]} color={P.lineStrong} radius={0.02} opacity={0.45} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: session.maintenance sobre un store de 600 filas de ejemplo.
 * Cada cubo es una fila de sesión, apilada por su edad en días. Paso 1:
 * pruneAfter retira las filas desprotegidas más viejas que el umbral. Paso 2:
 * si siguen sobrando, maxEntries retira las desprotegidas más viejas hasta
 * llegar al tope o quedarse sin víctimas. Pineadas y archivadas (violeta)
 * no se tocan, pero cuentan para el tope.
 */

type Run = "dry" | "apply";
type Fate = "kept" | "protected" | "aged" | "capped";

const ROWS = 600;
const MAX_AGE = 45;
const SESSIONS = Array.from({ length: ROWS }, (_, i) => ({
  age: Math.min(MAX_AGE, Math.floor(Math.pow(hash(i, 1), 1.5) * (MAX_AGE + 1))),
  protected: hash(i, 2) < 0.06,
  tie: hash(i, 3),
}));

function maintain(maxEntries: number, pruneAfter: number) {
  const fate: Fate[] = SESSIONS.map((s) => (s.protected ? "protected" : s.age > pruneAfter ? "aged" : "kept"));
  let alive = fate.filter((f) => f === "kept" || f === "protected").length;
  const victims = SESSIONS.map((s, i) => ({ ...s, i }))
    .filter((s) => fate[s.i] === "kept")
    .sort((a, b) => b.age - a.age || b.tie - a.tie);
  for (const v of victims) {
    if (alive <= maxEntries) break;
    fate[v.i] = "capped";
    alive -= 1;
  }
  const count = (f: Fate) => fate.filter((x) => x === f).length;
  return { fate, alive, aged: count("aged"), capped: count("capped"), protectedCount: count("protected") };
}

const COL = 0.17;
const CUBE = 0.11;
const colX = (age: number) => (age - MAX_AGE / 2) * COL;
const FATE_COLOR: Record<Fate, string> = { kept: P.teal, protected: P.violet, aged: P.rose, capped: P.amber };

function Store({ maxEntries, pruneAfter, run }: { maxEntries: number; pruneAfter: number; run: Run }) {
  const m = useMemo(() => maintain(maxEntries, pruneAfter), [maxEntries, pruneAfter]);
  const { solid, ghost, tallest } = useMemo(() => {
    const heights = Array(MAX_AGE + 1).fill(0);
    const s: Cell[] = [];
    const g: Cell[] = [];
    // protegidas abajo, luego el resto: así el tope se lee de arriba abajo
    const order = SESSIONS.map((x, i) => i).sort((a, b) => Number(SESSIONS[b].protected) - Number(SESSIONS[a].protected) || SESSIONS[a].tie - SESSIONS[b].tie);
    for (const i of order) {
      const row = SESSIONS[i];
      const f = m.fate[i];
      const h = heights[row.age]++;
      const z = (h % 4) * CUBE * 1.15 - 0.2;
      const y = 0.4 + Math.floor(h / 4) * CUBE * 1.15;
      const cell: Cell = {
        position: [colX(row.age), y, z],
        scale: [CUBE, CUBE, CUBE],
        color: f === "kept" ? mixHex(P.paper, P.teal, 0.45 + (1 - row.age / MAX_AGE) * 0.4) : FATE_COLOR[f],
      };
      if (run === "apply" && (f === "aged" || f === "capped")) g.push(cell);
      else s.push(cell);
    }
    return { solid: s, ghost: g, tallest: Math.ceil(Math.max(...heights) / 4) };
  }, [m, run]);
  const wallH = tallest * CUBE * 1.15 + 0.5;
  const px = colX(pruneAfter) + COL / 2;
  return (
    <group>
      <ShadowBlob position={[0, 0.004, 0]} scale={9.5} opacity={0.1} />
      <RoundedBox args={[(MAX_AGE + 1) * COL + 1.4, 0.24, 2.0]} position={[0, 0.12, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[(MAX_AGE + 1) * COL + 0.2, 0.06, 0.8]} position={[0, 0.3, -0.03]} radius={0.02} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.45} roughness={0.4} />
      </RoundedBox>
      <Lattice cells={solid} size={1} />
      {ghost.length ? <Lattice cells={ghost} size={1} opacity={0.12} /> : null}
      {/* umbral pruneAfter */}
      <mesh position={[px, 0.33 + wallH / 2, -0.03]}>
        <boxGeometry args={[0.015, wallH, 0.9]} />
        <meshPhysicalMaterial color={P.rose} transparent opacity={0.28} roughness={0.2} depthWrite={false} />
      </mesh>
      <Tag position={[px, 0.45 + wallH, -0.03]} tone="rose" size="xs" center>
        {`pruneAfter ${pruneAfter}d`}
      </Tag>
      {[0, 7, 14, 21, 30, 45].map((d) => (
        <group key={d}>
          <mesh position={[colX(d), 0.31, 0.55]}>
            <boxGeometry args={[0.02, 0.01, 0.12]} />
            <meshStandardMaterial color={P.inkSoft} />
          </mesh>
          <Tag position={[colX(d), 0.26, 0.78]} tone="muted" size="xs" center plate={false}>
            {`${d}d`}
          </Tag>
        </group>
      ))}
      <Tag position={[colX(0) - 0.65, 0.5, -0.03]} tone="ink" size="xs" center>
        edad →
      </Tag>
    </group>
  );
}

function SpanishVisual() {
  const [maxEntries, setMaxEntries] = useState(500);
  const [pruneAfter, setPruneAfter] = useState(30);
  const [run, setRun] = useState<Run>("dry");
  const m = maintain(maxEntries, pruneAfter);
  const blocked = m.alive > maxEntries;

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 border-b border-line pb-3 sm:grid-cols-4">
        {[
          ["Filas antes", String(ROWS)],
          ["Por edad (> pruneAfter)", String(m.aged)],
          ["Por tope (maxEntries)", String(m.capped)],
          ["Filas después", `${m.alive} / ${maxEntries}`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>
        Paso 1: las filas desprotegidas con más de {pruneAfter} días salen ({m.aged}, rosa). Paso 2:{" "}
        {m.capped
          ? `quedaban más de ${maxEntries}, así que se retiran las ${m.capped} desprotegidas más viejas (ámbar).`
          : `quedan ${m.alive} filas, dentro del tope de ${maxEntries}: no hace falta retirar más.`}{" "}
        Las {m.protectedCount} pineadas o archivadas (violeta) están exentas pero consumen el tope.
        {blocked ? ` Ni así se llega: no quedan víctimas elegibles y el store se queda en ${m.alive}.` : ""}
      </p>
      <p>
        {run === "dry"
          ? "Con --dry-run solo se marca lo que se retiraría: nada cambia en la SQLite."
          : "Aplicado: las filas retiradas quedan como siluetas. Las transcripciones archivadas no son filas vivas."}
      </p>
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        session.maintenance = {"{"} mode: &quot;enforce&quot;, pruneAfter: &quot;{pruneAfter}d&quot;, maxEntries: {maxEntries} {"}"} · openclaw sessions cleanup
        {run === "dry" ? " --dry-run" : ""}
      </p>
      <p className="text-xs text-muted">
        Store de ejemplo: 600 filas con edades y un 6 % de protegidas generadas de forma determinista. Defaults reales: pruneAfter 30d, maxEntries 500.
      </p>
    </div>
  );

  return (
    <Figure
      label="Mantenimiento de sesiones: edad primero, tope después"
      hint="600 filas · cada cubo es una sesión"
      height="h-[500px] md:h-[580px]"
      legend={[
        { color: P.teal, label: "se conserva" },
        { color: P.violet, label: "pineada / archivada" },
        { color: P.rose, label: "retirada por edad" },
        { color: P.amber, label: "retirada por tope" },
      ]}
      note={note}
      controls={
        <>
          <Knob label="pruneAfter" min={7} max={45} value={pruneAfter} onChange={setPruneAfter} format={(v) => `${v}d`} tone={P.rose} />
          <Knob label="maxEntries" min={50} max={600} step={25} value={maxEntries} onChange={setMaxEntries} tone={P.amber} />
          <Switcher
            ariaLabel="Modo de ejecución"
            value={run}
            onChange={setRun}
            options={[
              { value: "dry", label: "--dry-run", tone: P.inkSoft },
              { value: "apply", label: "Aplicar", tone: P.rose },
            ]}
          />
          <Readout items={[{ label: "vivas", value: String(m.alive), tone: P.ink }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3, 5.5, 9], fov: 34 }} fit={1.05}>
        <Store maxEntries={maxEntries} pruneAfter={pruneAfter} run={run} />
      </Stage>
    </Figure>
  );
}

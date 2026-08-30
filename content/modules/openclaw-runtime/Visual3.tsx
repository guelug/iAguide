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
 * The compatibility contract is a table of eight questions, and every one
 * of them is really the same question: which side owns this?
 *
 * Ownership is a position, so the scene puts the two owners on plinths
 * and lets each surface sit on one of them. Switch the runtime and watch
 * the chips slide across — the consequences underneath change with them,
 * which is the part the table states in a column nobody reads twice.
 */

type Runtime = "openclaw" | "external" | "partial";

type Surface = {
  id: string;
  /** Does OpenClaw own this under the selected runtime? */
  owner: (r: Runtime) => "openclaw" | "runtime";
};

const SURFACES: Surface[] = [
  { id: "loop", owner: (r) => (r === "openclaw" ? "openclaw" : "runtime") },
  { id: "history", owner: (r) => (r === "openclaw" ? "openclaw" : "runtime") },
  { id: "dynamicTools", owner: (r) => (r === "external" ? "runtime" : "openclaw") },
  { id: "dynamicHooks", owner: (r) => (r === "external" ? "runtime" : "openclaw") },
  { id: "nativeHooks", owner: (r) => (r === "openclaw" ? "openclaw" : "runtime") },
  { id: "contextEngine", owner: (r) => (r === "external" ? "runtime" : "openclaw") },
  { id: "compactionData", owner: (r) => (r === "external" ? "runtime" : "openclaw") },
];

const COPY = {
  en: {
    title: "which side owns this",
    hint: "switch the runtime · the chips move and the consequences follow",
    openclaw: "OpenClaw runtime",
    partial: "documented v1 contract",
    external: "undeclared runtime",
    legendOpenClaw: "OpenClaw owns it",
    legendRuntime: "the runtime owns it",
    legendLost: "capability lost",
    owners: { openclaw: "OpenClaw", runtime: "the runtime" },
    surfaces: {
      loop: "model loop",
      history: "canonical thread history",
      dynamicTools: "dynamic OpenClaw tools",
      dynamicHooks: "dynamic tool hooks",
      nativeHooks: "native tool hooks",
      contextEngine: "context engine lifecycle",
      compactionData: "compaction metadata",
    },
    consequences: {
      loop: "retries, tool continuation and the final-response decision happen here",
      history: "edit history, or only mirror it",
      dynamicTools: "messaging, sessions and cron depend on this",
      dynamicHooks: "before_tool_call and after_tool_call fire for plugins",
      nativeHooks: "shell and patch get policy and observation",
      contextEngine: "assemble, ingest, after-turn and compaction run",
      compactionData: "kept/dropped metadata, not just a notification",
    },
    ownedBy: "surfaces OpenClaw owns",
    canEdit: "thread history",
    edit: "can edit",
    mirror: "can only mirror",
    openclawNote:
      "the embedded runtime owns every surface, so nothing in the contract needs stating. Session rows live in the per-agent SQLite base and the session id is stable and chosen by OpenClaw.",
    partialNote:
      "a runtime that publishes a support contract — the Codex harness documents a v1 one — keeps the OpenClaw-owned surfaces working even though the loop and the native tools belong to it. This is the case worth aiming for.",
    externalNote:
      "when a runtime says nothing about which surfaces it supports, assume none of them. The loop, the history and the tools are all its own, so OpenClaw can mirror the thread but not edit it, and the plugins that expected hooks get no events at all.",
  },
  es: {
    title: "de qué lado es esto",
    hint: "cambia el runtime · las fichas se mueven y las consecuencias detrás",
    openclaw: "Runtime OpenClaw",
    partial: "contrato v1 documentado",
    external: "runtime sin declarar",
    legendOpenClaw: "lo posee OpenClaw",
    legendRuntime: "lo posee el runtime",
    legendLost: "capacidad perdida",
    owners: { openclaw: "OpenClaw", runtime: "el runtime" },
    surfaces: {
      loop: "loop de modelo",
      history: "historia canónica del hilo",
      dynamicTools: "tools dinámicas de OpenClaw",
      dynamicHooks: "hooks de tools dinámicas",
      nativeHooks: "hooks de tools nativas",
      contextEngine: "ciclo del context engine",
      compactionData: "metadata de compaction",
    },
    consequences: {
      loop: "aquí ocurren retries, continuación de tools y la respuesta final",
      history: "editar la historia, o solo espejarla",
      dynamicTools: "messaging, sesiones y cron dependen de esto",
      dynamicHooks: "before_tool_call y after_tool_call disparan para plugins",
      nativeHooks: "shell y patch tienen política y observación",
      contextEngine: "corren assemble, ingest, after-turn y compaction",
      compactionData: "metadata de kept/dropped, no solo un aviso",
    },
    ownedBy: "superficies de OpenClaw",
    canEdit: "historia del hilo",
    edit: "puede editar",
    mirror: "solo puede espejar",
    openclawNote:
      "el runtime embebido posee todas las superficies, así que no hay nada que declarar en el contrato. Las filas de sesión viven en la base SQLite por agente y el session id es estable y lo elige OpenClaw.",
    partialNote:
      "un runtime que publica un contrato de soporte — el harness de Codex documenta uno v1 — mantiene funcionando las superficies de OpenClaw aunque el loop y las tools nativas sean suyos. Este es el caso al que apuntar.",
    externalNote:
      "cuando un runtime no dice nada sobre qué superficies soporta, asume que ninguna. El loop, la historia y las tools son suyos, así que OpenClaw puede espejar el hilo pero no editarlo, y los plugins que esperaban hooks no reciben eventos.",
  },
};

/** A surface chip that slides to whichever plinth owns it. */
function Chip({
  index,
  ownedByOpenClaw,
  label,
}: {
  index: number;
  ownedByOpenClaw: boolean;
  label: string;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.x = MathUtils.damp(g.position.x, ownedByOpenClaw ? -2.7 : 2.7, 5, dt);
  });
  const z = -2.7 + index * 0.9;
  return (
    <group ref={ref} position={[ownedByOpenClaw ? -2.7 : 2.7, 0.42, z]}>
      <RoundedBox args={[2.5, 0.22, 0.62]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial
          color={ownedByOpenClaw ? P.teal : P.sunken}
          roughness={0.36}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>
      <Tag position={[0, 0.3, 0]} tone={ownedByOpenClaw ? "ink" : "muted"} size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [runtime, setRuntime] = useState<Runtime>("openclaw");

  const owned = SURFACES.filter((s) => s.owner(runtime) === "openclaw");
  const canEditHistory = SURFACES[1].owner(runtime) === "openclaw";
  const note =
    runtime === "openclaw"
      ? t.openclawNote
      : runtime === "partial"
        ? t.partialNote
        : t.externalNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendOpenClaw },
        { color: P.line, label: t.legendRuntime },
        { color: P.rose, label: t.legendLost },
      ]}
      controls={
        <Switcher
          value={runtime}
          onChange={setRuntime}
          options={[
            { value: "openclaw", label: t.openclaw, tone: P.teal },
            { value: "partial", label: t.partial, tone: P.amber },
            { value: "external", label: t.external, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          {note}
          <ol className="mt-2 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            {SURFACES.map((s) => {
              const mine = s.owner(runtime) === "openclaw";
              return (
                <li
                  key={s.id}
                  className={`font-mono text-[0.72rem] ${mine ? "text-ink-soft" : "text-rose"}`}
                >
                  {t.surfaces[s.id as keyof typeof t.surfaces]} —{" "}
                  {t.consequences[s.id as keyof typeof t.consequences]}
                </li>
              );
            })}
          </ol>
          <div className="mt-2">
            <Readout
              items={[
                {
                  label: t.ownedBy,
                  value: `${owned.length} / ${SURFACES.length}`,
                  tone: owned.length === SURFACES.length ? "var(--teal)" : "var(--rose)",
                },
                {
                  label: t.canEdit,
                  value: canEditHistory ? t.edit : t.mirror,
                  tone: canEditHistory ? "var(--teal)" : "var(--rose)",
                },
              ]}
            />
          </div>
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={13} depth={10} y={-0.05} />

        {/* The two owners. Everything on the plate belongs to one of them. */}
        {([
          { x: -2.7, key: "openclaw" as const, color: P.teal },
          { x: 2.7, key: "runtime" as const, color: P.inkSoft },
        ]).map((side) => (
          <group key={side.key} position={[side.x, 0, 0]}>
            <RoundedBox args={[3.1, 0.26, 6.2]} radius={0.07} smoothness={3} position={[0, 0.13, 0]} castShadow receiveShadow>
              <meshStandardMaterial
                color={side.color}
                transparent
                opacity={0.35}
                roughness={0.45}
                envMapIntensity={0.9}
              />
            </RoundedBox>
            <Tag position={[0, 0.35, -3.6]} tone="ink" size="sm" center>
              {t.owners[side.key]}
            </Tag>
          </group>
        ))}

        <AxisLine from={[0, 0.1, -3.4]} to={[0, 0.1, 3.4]} overrun={0.3} color={P.lineStrong} opacity={0.5} />

        {SURFACES.map((s, i) => (
          <Chip
            key={s.id}
            index={i}
            ownedByOpenClaw={s.owner(runtime) === "openclaw"}
            label={t.surfaces[s.id as keyof typeof t.surfaces]}
          />
        ))}

        {/* The single consequence the table exists to deliver. */}
        <group position={[0, 1.6, 3.6]}>
          <Node3D
            position={[0, 0, 0]}
            color={canEditHistory ? P.teal : P.rose}
            radius={0.17}
            faceted
            pulse={canEditHistory ? 0.2 : 0}
          />
          {!canEditHistory ? <Halo radius={0.48} color={P.rose} opacity={0.75} spin={0.5} /> : null}
          <Tag position={[0, 0.55, 0]} tone={canEditHistory ? "teal" : "rose"} size="xs" center>
            {canEditHistory ? t.edit : t.mirror}
          </Tag>
        </group>

        <IsoDust count={20} center={[0, 1.1, 0]} spread={[3.4, 0.6, 2.8]} />
      </Stage>
    </Figure>
  );
}

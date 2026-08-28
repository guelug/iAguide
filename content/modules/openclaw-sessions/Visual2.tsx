"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
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

export default function Visual() {
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

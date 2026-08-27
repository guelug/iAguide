"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

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

export default function Visual() {
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

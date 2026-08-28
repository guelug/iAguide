"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Threads, turns, sessions; three caches; subagents as nested threads. */
type Mode = "threads" | "caches" | "nested";

const COPY = {
  en: {
    threads_turns_sessions: "threads, turns, sessions",
    three_caches_nested_loops: "three caches · nested loops",
    threads: "threads",
    caches: "caches",
    nested: "nested",
    thread_a: "thread a",
    thread_b: "thread b",
    session: "session",
    prefix_cache: "prefix cache",
    exact_cache: "exact cache",
    semantic_cache: "semantic cache",
    parent: "parent",
    child: "child",
    isolation: "isolation",
    kv_per_thread: "kv per thread",
  },
  es: {
    threads_turns_sessions: "hilos, turnos, sesiones",
    three_caches_nested_loops: "tres cachés · bucles anidados",
    threads: "hilos",
    caches: "cachés",
    nested: "anidados",
    thread_a: "hilo a",
    thread_b: "hilo b",
    session: "sesión",
    prefix_cache: "caché de prefijo",
    exact_cache: "caché exacta",
    semantic_cache: "caché semántica",
    parent: "padre",
    child: "hijo",
    isolation: "aislamiento",
    kv_per_thread: "kv por hilo",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("threads");

  return (
    <Figure
      label={t.threads_turns_sessions}
      hint={t.three_caches_nested_loops}
      legend={[
        { color: P.teal, label: t.threads },
        { color: P.violet, label: t.caches },
        { color: P.amber, label: t.nested },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "threads", label: t.threads, tone: P.teal },
            { value: "caches", label: t.caches, tone: P.violet },
            { value: "nested", label: t.nested, tone: P.amber },
          ]}
          ariaLabel={t.threads_turns_sessions}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "threads" && (
          <>
            {/* two parallel threads as horizontal ribbons, a session envelope around */}
            <Slab position={[0, 0.3, -0.1]} size={[5.4, 2.6, 0.1]} color={P.muted} fill={0.05} rim={0.4} />
            <Tag position={[0, 1.85, 0.15]} tone="muted">{t.session}</Tag>
            <Wire
              points={Array.from({ length: 13 }, (_, i) => [-2.4 + i * 0.4, 0.85 + Math.sin(i * 0.6) * 0.1, 0] as [number, number, number])}
              color={P.teal}
              width={2.6}
              opacity={0.9}
            />
            <Tag position={[-2.4, 1.15, 0.15]} tone="teal" size="xs">{t.thread_a}</Tag>
            <Wire
              points={Array.from({ length: 13 }, (_, i) => [-2.4 + i * 0.4, -0.5 - Math.sin(i * 0.5) * 0.1, 0] as [number, number, number])}
              color={P.violet}
              width={2.6}
              opacity={0.9}
            />
            <Tag position={[-2.4, -0.8, 0.15]} tone="violet" size="xs">{t.thread_b}</Tag>
            {/* KV nodes under each thread */}
            <Lattice
              cells={Array.from({ length: 8 }, (_, i) => ({
                position: [-2.3 + i * 0.62, 0.4, 0] as [number, number, number],
                color: P.teal,
              }))}
              size={0.08}
              opacity={0.7}
              matte
            />
            <Lattice
              cells={Array.from({ length: 8 }, (_, i) => ({
                position: [-2.3 + i * 0.62, -0.85, 0] as [number, number, number],
                color: P.violet,
              }))}
              size={0.08}
              opacity={0.7}
              matte
            />
            <Tag position={[2.5, -0.2, 0.15]} tone="muted" size="xs">{t.kv_per_thread}</Tag>
          </>
        )}

        {mode === "caches" && (
          <>
            {(
              [
                [t.prefix_cache, P.teal, -2.2, "long prefix · stable"],
                [t.exact_cache, P.violet, 0, "byte-exact"],
                [t.semantic_cache, P.amber, 2.2, "embeddings"],
              ] as const
            ).map(([lab, col, x, sub]) => (
              <group key={lab}>
                <Slab position={[x, 0.55, 0]} size={[1.9, 1.2, 0.14]} color={col} fill={0.2} />
                <Tag position={[x, 1.35, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"} size="xs">
                  {lab}
                </Tag>
                <Tag position={[x, -0.15, 0.15]} tone="muted" size="xs">{sub}</Tag>
              </group>
            ))}
            {/* the same prompt hitting each */}
            <Flow points={[[-2.4, -0.9, 0], [2.4, -0.9, 0]]} color={P.lineStrong} count={3} size={0.045} />
            <Tag position={[0, -1.4, 0.15]} tone="muted" size="xs">prompt →</Tag>
          </>
        )}

        {mode === "nested" && (
          <>
            {/* parent thread, child loop nested inside */}
            <Slab position={[0, 0.4, -0.1]} size={[5.2, 2.2, 0.1]} color={P.teal} fill={0.08} rim={0.6} />
            <Tag position={[-2.3, 1.5, 0.15]} tone="teal" size="xs">{t.parent}</Tag>
            <Node3D position={[-1.6, 0.6, 0.1]} color={P.teal} radius={0.13} />
            <Node3D position={[-0.5, 0.6, 0.1]} color={P.teal} radius={0.13} />
            {/* child */}
            <Slab position={[1.5, 0.3, 0.1]} size={[1.9, 1.5, 0.1]} color={P.amber} fill={0.14} />
            <Tag position={[1.5, 1.25, 0.15]} tone="amber" size="xs">{t.child}</Tag>
            <Node3D position={[1.1, 0.55, 0.2]} color={P.amber} radius={0.1} />
            <Node3D position={[1.9, 0.55, 0.2]} color={P.amber} radius={0.1} />
            <Flow points={[[-0.3, 0.55, 0], [0.5, 0.45, 0]]} color={P.amber} count={2} size={0.05} />
            <Flow points={[[1.9, -0.45, 0.2], [0.4, -0.8, 0]]} color={P.violet} count={2} size={0.045} />
            <Tag position={[0.9, -1.15, 0.15]} tone="violet" size="xs">summary</Tag>
            <Tag position={[2.7, -0.3, 0.15]} tone="muted" size="xs">{t.isolation}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

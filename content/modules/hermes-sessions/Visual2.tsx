"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* hermes-sessions: sqlite + FTS5 + WAL; write retry; parent/child lineage. */
type Mode = "sqlite" | "retry" | "lineage";

const COPY = {
  en: {
    the_database_is_the_thread: "the database is the thread",
    sqlite_fts5_and_retry: "sqlite · fts5 · retry · lineage",
    sqlite: "sqlite",
    retry: "retry",
    lineage: "lineage",
    wal: "wal",
    fts5: "fts5",
    write: "write",
    fail: "fail",
    backoff: "backoff",
    parent: "parent",
    child: "child",
  },
  es: {
    the_database_is_the_thread: "la base de datos es el hilo",
    sqlite_fts5_and_retry: "sqlite · fts5 · retry · linaje",
    sqlite: "sqlite",
    retry: "reintentar",
    lineage: "linaje",
    wal: "wal",
    fts5: "fts5",
    write: "escribe",
    fail: "falla",
    backoff: "backoff",
    parent: "padre",
    child: "hijo",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("sqlite");

  return (
    <Figure
      label={t.the_database_is_the_thread}
      hint={t.sqlite_fts5_and_retry}
      legend={[
        { color: P.teal, label: t.sqlite },
        { color: P.rose, label: t.retry },
        { color: P.violet, label: t.lineage },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "sqlite", label: t.sqlite, tone: P.teal },
            { value: "retry", label: t.retry, tone: P.rose },
            { value: "lineage", label: t.lineage, tone: P.violet },
          ]}
          ariaLabel={t.the_database_is_the_thread}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "sqlite" && (
          <>
            <Slab position={[0, 0.4, 0]} size={[4.0, 1.8, 0.18]} color={P.teal} fill={0.18} />
            <Tag position={[0, 1.55, 0.15]} tone="teal">state.db</Tag>
            {/* fts5 + wal as sub-slabs */}
            <Slab position={[-1.0, 0.4, 0.12]} size={[1.5, 0.7, 0.08]} color={P.violet} fill={0.3} />
            <Tag position={[-1.0, 0.4, 0.22]} tone="violet" size="xs">{t.fts5}</Tag>
            <Slab position={[1.0, 0.4, 0.12]} size={[1.5, 0.7, 0.08]} color={P.amber} fill={0.3} />
            <Tag position={[1.0, 0.4, 0.22]} tone="amber" size="xs">{t.wal}</Tag>
            <Tag position={[0, -0.6, 0.15]} tone="muted" size="xs">one file, one writer</Tag>
            <Flow points={[[-2.3, 0.4, 0], [-1.8, 0.4, 0]]} color={P.teal} count={2} size={0.05} />
          </>
        )}

        {mode === "retry" && (
          <>
            {/* write → crash → backoff → write again */}
            <Slab position={[-2.3, 0.6, 0]} size={[1.4, 0.7, 0.12]} color={P.teal} fill={0.24} />
            <Tag position={[-2.3, 1.15, 0.15]} tone="teal" size="xs">{t.write}</Tag>
            <Ribbon points={[[-1.6, 0.6, 0], [-0.6, 0.6, 0]]} color={P.teal} radius={0.04} opacity={0.85} />
            <Node3D position={[0, 0.6, 0]} color={P.rose} radius={0.18} pulse={0.5} />
            <Tag position={[0, 1.05, 0.15]} tone="rose" size="xs">{t.fail}</Tag>
            {/* backoff loop */}
            <Ribbon points={[[0, 0.3, 0], [-0.8, -0.3, 0], [-2.3, 0.3, 0]]} color={P.amber} radius={0.02} opacity={0.7} />
            <Tag position={[-1.2, -0.65, 0.15]} tone="amber" size="xs">{t.backoff}</Tag>
            {/* successful retry */}
            <Ribbon points={[[0.3, 0.6, 0], [1.6, 0.6, 0]]} color={P.teal} radius={0.04} opacity={0.85} />
            <Slab position={[2.3, 0.6, 0]} size={[1.2, 0.7, 0.12]} color={P.teal} fill={0.32} />
            <Tag position={[2.3, 1.15, 0.15]} tone="teal" size="xs">ok</Tag>
          </>
        )}

        {mode === "lineage" && (
          <>
            <Slab position={[-2.0, 0.5, 0]} size={[1.6, 1.2, 0.14]} color={P.violet} fill={0.22} />
            <Tag position={[-2.0, 1.3, 0.15]} tone="violet" size="xs">{t.parent}</Tag>
            {/* child branched from parent */}
            <Ribbon points={[[-1.2, 0.9, 0], [-0.4, 1.1, 0]]} color={P.violet} radius={0.04} opacity={0.8} />
            <Slab position={[0.4, 1.1, 0]} size={[1.4, 1.0, 0.14]} color={P.teal} fill={0.28} />
            <Tag position={[0.4, 1.85, 0.15]} tone="teal" size="xs">{t.child} 1</Tag>
            <Ribbon points={[[-1.2, 0.1, 0], [-0.4, -0.1, 0]]} color={P.amber} radius={0.04} opacity={0.7} />
            <Slab position={[0.4, -0.3, 0]} size={[1.4, 0.9, 0.14]} color={P.amber} fill={0.28} />
            <Tag position={[0.4, 0.35, 0.15]} tone="amber" size="xs">{t.child} 2</Tag>
            {/* shared prefix */}
            <Ribbon points={[[-2.0, -0.4, 0], [0.4, -0.4, 0]]} color={P.teal} radius={0.02} opacity={0.5} />
            <Tag position={[2.0, 0.4, 0.15]} tone="muted" size="xs">shared prefix · kv reuse</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

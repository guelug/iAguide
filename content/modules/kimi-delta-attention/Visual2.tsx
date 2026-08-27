"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  Halo,
  Lattice,
  Motes,
  Node3D,
  PointerTilt,
  Ribbon,
  Slab,
  Tag,
  Wire,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Softmax attention grows a KV list; linear attention folds the past into a
   matrix; KDA adds a per-channel gate on top of the delta rule. */
type Mode = "softmax" | "linear" | "kda";

const COPY = {
  en: {
    memory_grows_vs_memory_stays: "memory grows vs memory stays",
    a_cache_a_matrix_a_gate: "a cache, a matrix, a gate",
    softmax: "softmax",
    linear: "linear",
    kda: "kda",
    kv_list_grows: "kv list grows",
    reads_every_past_token: "reads every past token",
    state_matrix: "state matrix",
    fixed_size: "fixed size",
    forgets_old_keys: "old keys collide",
    delta_rule: "delta rule",
    per_channel_gate: "per-channel gate",
    erases_then_writes: "erases, then writes",
    token: "token",
    cost_grows: "cost grows",
    cost_stays: "cost stays",
  },
  es: {
    memory_grows_vs_memory_stays: "la memoria crece vs la memora queda",
    a_cache_a_matrix_a_gate: "una caché, una matriz, una puerta",
    softmax: "softmax",
    linear: "lineal",
    kda: "kda",
    kv_list_grows: "la lista kv crece",
    reads_every_past_token: "lee cada token pasado",
    state_matrix: "matriz de estado",
    fixed_size: "tamaño fijo",
    forgets_old_keys: "claves viejas colisionan",
    delta_rule: "regla delta",
    per_channel_gate: "puerta por canal",
    erases_then_writes: "borra, luego escribe",
    token: "token",
    cost_grows: "el coste crece",
    cost_stays: "el coste se queda",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("softmax");

  // growing KV list for softmax (left column, taller every step)
  const kvCells = Array.from({ length: 18 }, (_, i) => ({
    position: [-2.2, 1.3 - i * 0.16, 0] as [number, number, number],
    color: i < 14 ? P.teal : P.amber,
  }));

  // the state matrix for linear (fixed grid)
  const stateCells = Array.from({ length: 36 }, (_, i) => ({
    position: [
      -1.2 + (i % 6) * 0.22,
      0.8 - Math.floor(i / 6) * 0.22,
      0,
    ] as [number, number, number],
    color: i % 7 === 0 ? P.violet : P.teal,
  }));

  // KDA: channel gates
  const channels = Array.from({ length: 6 }, (_, i) => ({
    position: [-1.6 + i * 0.62, -0.4, 0] as [number, number, number],
    color: i % 2 === 0 ? P.violet : P.teal,
  }));

  return (
    <Figure
      label={t.memory_grows_vs_memory_stays}
      hint={t.a_cache_a_matrix_a_gate}
      legend={[
        { color: P.teal, label: t.softmax },
        { color: P.violet, label: t.linear },
        { color: P.amber, label: t.kda },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "softmax", label: t.softmax, tone: P.teal },
            { value: "linear", label: t.linear, tone: P.violet },
            { value: "kda", label: t.kda, tone: P.amber },
          ]}
          ariaLabel={t.memory_grows_vs_memory_stays}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "softmax" && (
          <>
            <Lattice cells={kvCells} size={0.13} opacity={0.9} />
            <Tag position={[-2.2, 1.7, 0.2]} tone="teal">{t.kv_list_grows}</Tag>
            {/* the newest token reads the whole past */}
            <Node3D position={[1.6, 0.3, 0]} color={P.amber} radius={0.2} pulse={0.3} />
            <Tag position={[1.6, 0.85, 0.2]} tone="amber">{t.token} t</Tag>
            {kvCells.slice(0, 8).map((c, i) => (
              <Wire
                key={i}
                points={[c.position, [1.35, 0.3, 0]]}
                color={P.teal}
                opacity={0.35}
              />
            ))}
            <Tag position={[0.2, -0.4, 0.2]} tone="muted" size="xs">{t.reads_every_past_token}</Tag>
            {/* cost curve grows */}
            <Ribbon points={[[-0.4, -1.2, 0], [0.6, -1.0, 0], [1.6, -0.55, 0], [2.6, 0.1, 0]]} color={P.rose} radius={0.02} opacity={0.8} />
            <Tag position={[1.4, -1.35, 0.2]} tone="rose" size="xs">{t.cost_grows}</Tag>
          </>
        )}

        {mode === "linear" && (
          <>
            <Slab position={[0, 0.2, -0.15]} size={[2.0, 1.9, 0.1]} color={P.violet} fill={0.08} />
            <Lattice cells={stateCells} size={0.15} opacity={0.9} />
            <Tag position={[0, 1.7, 0.2]} tone="violet">{t.state_matrix}</Tag>
            <Tag position={[0, -1.0, 0.2]} tone="violet" size="xs">{t.fixed_size}</Tag>
            {/* past tokens pour into the matrix instead of piling up */}
            <Flow points={[[-2.6, 0.9, 0], [-1.35, 0.6, 0]]} color={P.teal} count={3} size={0.05} />
            <Node3D position={[-2.8, 0.95, 0]} color={P.teal} radius={0.13} />
            <Node3D position={[-2.8, 0.45, 0]} color={P.teal} radius={0.11} />
            <Node3D position={[-2.8, -0.05, 0]} color={P.teal} radius={0.09} />
            {/* the collision warning */}
            <Halo position={[0, 0.15, 0]} radius={1.45} color={P.rose} opacity={0.25} spin={0.1} />
            <Tag position={[2.0, -0.7, 0.2]} tone="rose" size="xs">{t.forgets_old_keys}</Tag>
            <Tag position={[2.2, 0.9, 0.2]} tone="teal" size="xs">{t.cost_stays}</Tag>
          </>
        )}

        {mode === "kda" && (
          <>
            {/* state matrix, dimmer (the thing being written into) */}
            <Lattice cells={stateCells} size={0.14} opacity={0.5} />
            <Tag position={[0, 1.7, 0.2]} tone="violet">{t.state_matrix}</Tag>
            {/* per-channel gates */}
            {channels.map((c, i) => (
              <group key={i}>
                <Node3D position={c.position} color={c.color} radius={0.12} faceted pulse={i * 0.3} />
                <Wire points={[[c.position[0], -0.25, 0], [c.position[0], 0.1, 0]]} color={c.color} opacity={0.5} />
              </group>
            ))}
            <Tag position={[0, -0.95, 0.2]} tone="amber">{t.per_channel_gate}</Tag>
            {/* the delta erase-then-write */}
            <Flow points={[[-2.8, -1.3, 0], [-0.3, -1.15, 0], [1.8, -1.15, 0]]} color={P.rose} count={3} size={0.05} />
            <Tag position={[-1.9, -1.65, 0.2]} tone="rose" size="xs">{t.delta_rule}</Tag>
            <Tag position={[1.9, -1.55, 0.2]} tone="amber" size="xs">{t.erases_then_writes}</Tag>
            <Node3D position={[2.5, 0.9, 0]} color={P.amber} radius={0.16} pulse={0.4} />
            <Tag position={[2.5, 1.35, 0.2]} tone="amber" size="xs">{t.token} t</Tag>
            <Flow points={[[2.4, 0.75, 0], [1.3, 0.35, 0]]} color={P.amber} count={2} size={0.045} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

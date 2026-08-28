"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* openclaw-queue: FIFO, backpressure alarm, priority jump. */
type Mode = "fifo" | "back" | "vip";

const COPY = {
  en: {
    queues_do_the_pacing: "queues do the pacing",
    fifo_backpressure_vip: "fifo · backpressure · vip",
    fifo: "fifo",
    backpressure: "backpressure",
    vip: "vip",
    job: "job",
    worker: "worker",
    full: "full",
    jumps: "jumps",
  },
  es: {
    queues_do_the_pacing: "las colas marcan el ritmo",
    fifo_backpressure_vip: "fifo · backpressure · vip",
    fifo: "fifo",
    backpressure: "backpressure",
    vip: "vip",
    job: "trabajo",
    worker: "worker",
    full: "lleno",
    jumps: "salta",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("fifo");

  return (
    <Figure
      label={t.queues_do_the_pacing}
      hint={t.fifo_backpressure_vip}
      legend={[
        { color: P.teal, label: t.job },
        { color: P.rose, label: t.backpressure },
        { color: P.amber, label: t.vip },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "fifo", label: t.fifo, tone: P.teal },
            { value: "back", label: t.backpressure, tone: P.rose },
            { value: "vip", label: t.vip, tone: P.amber },
          ]}
          ariaLabel={t.queues_do_the_pacing}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "fifo" && (
          <>
            {/* producer pushing jobs 1..4 into a queue slab, workers pulling on the right */}
            <Slab position={[-2.5, 0.4, 0]} size={[1.6, 0.7, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[-2.5, 0.95, 0.15]} tone="teal" size="xs">producer</Tag>
            <Ribbon points={[[-1.6, 0.4, 0], [-0.6, 0.4, 0]]} color={P.teal} radius={0.04} opacity={0.85} />
            {/* the queue */}
            <Slab position={[0.3, 0.4, 0]} size={[2.4, 1.0, 0.14]} color={P.violet} fill={0.16} rim={0.7} />
            <Tag position={[0.3, 1.45, 0.15]} tone="violet">queue</Tag>
            {/* job squares inside */}
            {[0, 1, 2, 3].map((i) => (
              <Node3D
                key={i}
                position={[-0.6 + i * 0.55, 0.4, 0.12]}
                color={P.teal}
                radius={0.13}
                matte
              />
            ))}
            <Tag position={[0.3, -0.0, 0.15]} tone="muted" size="xs">{t.job} 1..4</Tag>
            <Ribbon points={[[1.6, 0.4, 0], [2.5, 0.4, 0]]} color={P.amber} radius={0.04} opacity={0.85} />
            <Slab position={[2.7, 0.4, 0]} size={[1.4, 1.0, 0.12]} color={P.amber} fill={0.26} />
            <Tag position={[2.7, 0.95, 0.15]} tone="amber" size="xs">{t.worker}</Tag>
          </>
        )}

        {mode === "back" && (
          <>
            {/* queue slab filling red, producers backing off */}
            <Slab position={[0, 0.5, -0.05]} size={[2.6, 1.5, 0.14]} color={P.rose} fill={0.14} rim={0.9} />
            <Lattice
              cells={Array.from({ length: 14 }, (_, i) => ({
                position: [-1.1 + (i % 7) * 0.38, 0.95 - Math.floor(i / 7) * 0.4, 0] as [number, number, number],
                color: P.rose,
              }))}
              size={0.16}
              opacity={0.9}
              matte
            />
            <Tag position={[0, 1.8, 0.15]} tone="rose">{t.full}</Tag>
            {/* producer halted */}
            <Slab position={[-2.4, 0.6, 0]} size={[1.4, 0.55, 0.12]} color={P.muted} fill={0.18} />
            <Tag position={[-2.4, 1.05, 0.15]} tone="muted" size="xs">producer</Tag>
            {/* hold ribbon */}
            <Wire points={[[-1.7, 0.6, 0], [-0.9, 0.6, 0]]} color={P.rose} dashed width={2.5} opacity={0.9} />
            <Tag position={[-1.3, 0.15, 0.15]} tone="rose" size="xs">{t.backpressure}</Tag>
            {/* worker still draining */}
            <Ribbon points={[[1.3, 0.3, 0], [2.4, -0.4, 0]]} color={P.teal} radius={0.04} opacity={0.7} />
            <Slab position={[2.6, -0.6, 0]} size={[1.3, 0.6, 0.1]} color={P.teal} fill={0.26} />
            <Tag position={[2.6, -0.1, 0.15]} tone="teal" size="xs">{t.worker}</Tag>
          </>
        )}

        {mode === "vip" && (
          <>
            {/* the queue with a VIP slab hopping in */}
            <Slab position={[0.3, 0.5, 0]} size={[2.6, 1.0, 0.14]} color={P.violet} fill={0.18} rim={0.7} />
            {[0, 1, 2, 3].map((i) => (
              <Node3D key={i} position={[-0.5 + i * 0.55, 0.5, 0.12]} color={P.teal} radius={0.12} matte />
            ))}
            {/* vip job arrives from above */}
            <Ribbon points={[[-1.6, 1.8, 0], [-0.2, 1.4, 0], [0.3, 1.0, 0]]} color={P.amber} radius={0.05} opacity={0.95} />
            <Node3D position={[0.3, 0.95, 0.2]} color={P.amber} radius={0.2} pulse={0.5} faceted />
            <Tag position={[0.3, 1.45, 0.15]} tone="amber">{t.vip}</Tag>
            <Tag position={[-0.5, -0.15, 0.15]} tone="muted" size="xs">job 1..3</Tag>
            <Tag position={[1.0, 0.1, 0.15]} tone="amber" size="xs">{t.jumps}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

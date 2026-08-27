"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* memory-hardware: capacity vs bandwidth trade; HBM stacks; unified Apple pool. */
type Mode = "tradeoff" | "hbm" | "unified";

const COPY = {
  en: {
    memory_is_the_wall: "memory is the wall",
    capacity_vs_bandwidth_unified_pool: "capacity vs bandwidth · hbm stacks · unified pool",
    tradeoff: "tradeoff",
    hbm: "hbm",
    unified: "unified",
    hbm3: "hbm3",
    sram: "sram",
    dram: "dram",
    capacity: "capacity",
    bandwidth: "bandwidth",
    cpu_gpu_share: "cpu+gpu share",
    numa: "numa",
  },
  es: {
    memory_is_the_wall: "la memoria es el muro",
    capacity_vs_bandwidth_unified_pool: "capacidad vs ancho de banda · pilas hbm · pool unificado",
    tradeoff: "trade-off",
    hbm: "hbm",
    unified: "unificado",
    hbm3: "hbm3",
    sram: "sram",
    dram: "dram",
    capacity: "capacidad",
    bandwidth: "ancho de banda",
    cpu_gpu_share: "cpu+gpu comparten",
    numa: "numa",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("tradeoff");

  return (
    <Figure
      label={t.memory_is_the_wall}
      hint={t.capacity_vs_bandwidth_unified_pool}
      legend={[
        { color: P.teal, label: t.bandwidth },
        { color: P.violet, label: t.capacity },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "tradeoff", label: t.tradeoff, tone: P.teal },
            { value: "hbm", label: t.hbm, tone: P.violet },
            { value: "unified", label: t.unified, tone: P.amber },
          ]}
          ariaLabel={t.memory_is_the_wall}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "tradeoff" && (
          <>
            {/* two axes, three bubbles */}
            <Wire points={[[-2.6, -1.0, 0], [2.6, -1.0, 0]]} color={P.lineStrong} opacity={0.6} />
            <Wire points={[[-2.6, -1.0, 0], [-2.6, 1.6, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[2.5, -1.3, 0.15]} tone="muted" size="xs">{t.capacity} →</Tag>
            <Tag position={[-3.0, 1.5, 0.15]} tone="muted" size="xs">↑ {t.bandwidth}</Tag>
            {/* sram: fast but tiny */}
            <Node3D position={[-2.1, 1.3, 0]} color={P.teal} radius={0.22} pulse={0.3} />
            <Tag position={[-2.1, 1.75, 0.15]} tone="teal" size="xs">{t.sram}</Tag>
            {/* hbm: the sweet spot */}
            <Node3D position={[0.5, 0.4, 0]} color={P.violet} radius={0.3} pulse={0.2} />
            <Tag position={[0.5, 1.05, 0.15]} tone="violet" size="xs">{t.hbm3}</Tag>
            {/* dram: capacity but slow */}
            <Node3D position={[2.0, -0.6, 0]} color={P.amber} radius={0.3} pulse={0.1} />
            <Tag position={[2.0, 0.0, 0.15]} tone="amber" size="xs">{t.dram}</Tag>
            {/* inference wants top-right */}
            <Ribbon points={[[-1.9, 1.2, 0], [-0.4, 0.7, 0], [1.4, -0.2, 0]]} color={P.rose} radius={0.02} opacity={0.5} />
          </>
        )}

        {mode === "hbm" && (
          <>
            {/* hbm3 stack */}
            {[0, 1, 2, 3, 4].map((i) => (
              <Slab key={i} position={[0, 0.35 + i * 0.3, 0]} size={[2.6, 0.18, 0.16]} color={P.teal} fill={0.22} />
            ))}
            {/* gpu compute die below */}
            <Slab position={[0, -0.15, 0]} size={[3.6, 0.35, 0.18]} color={P.violet} fill={0.26} />
            <Tag position={[0, 1.95, 0.15]} tone="teal" size="xs">{t.hbm3} · 8-16 stacks</Tag>
            <Tag position={[0, -0.55, 0.15]} tone="violet" size="xs">compute</Tag>
            {/* bus wires between */}
            {[0, 1, 2, 3].map((i) => (
              <Wire
                key={i}
                points={[[-1.4 + i * 0.95, 0.05, 0], [-1.4 + i * 0.95, 0.35, 0]]}
                color={P.amber}
                width={3}
                opacity={0.8}
              />
            ))}
            <Tag position={[2.2, 0.4, 0.15]} tone="amber" size="xs">3.35 TB/s</Tag>
          </>
        )}

        {mode === "unified" && (
          <>
            {/* apple m-series single pool */}
            <Slab position={[0, 0.5, 0]} size={[5.0, 1.9, 0.16]} color={P.violet} fill={0.16} />
            {/* cpu block and gpu block share */}
            <Slab position={[-1.5, 0.5, 0.1]} size={[1.4, 1.0, 0.1]} color={P.teal} fill={0.3} />
            <Tag position={[-1.5, 1.05, 0.2]} tone="teal" size="xs">cpu</Tag>
            <Slab position={[1.5, 0.5, 0.1]} size={[1.4, 1.0, 0.1]} color={P.amber} fill={0.3} />
            <Tag position={[1.5, 1.05, 0.2]} tone="amber" size="xs">gpu</Tag>
            <Tag position={[0, 1.95, 0.15]} tone="violet">{t.unified}</Tag>
            <Tag position={[0, -0.4, 0.15]} tone="muted" size="xs">{t.cpu_gpu_share}</Tag>
            {/* no copy between them */}
            <Ribbon points={[[-1.5, 0.0, 0], [0, -0.3, 0], [1.5, 0.0, 0]]} color={P.violet} radius={0.03} opacity={0.6} />
            <Tag position={[0, -1.05, 0.15]} tone="muted" size="xs">zero copy</Tag>
            {/* contrast with numa (2 separate pools) */}
            <Slab position={[0, -1.55, 0]} size={[1.3, 0.4, 0.08]} color={P.muted} fill={0.1} />
            <Tag position={[0, -1.95, 0.15]} tone="muted" size="xs">{t.numa}? no</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

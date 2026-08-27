"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* AttnRes systems: online softmax, two-phase prefill+decode, comm cost. */
type Mode = "online" | "twophase" | "comm";

const COPY = {
  en: {
    the_serving_two_percent: "the serving two percent",
    online_softmax_two_phases_real_comm: "online softmax · two phases · real comm",
    online: "online",
    two_phase: "two phases",
    comm: "comm",
    running_max: "running max",
    running_sum: "running sum",
    blocks_written: "blocks written",
    decode_reads_summaries: "decode reads summaries",
    per_layer: "per-layer",
    block_summaries: "block summaries",
    cost: "cost",
    less_than_2: "< 2%",
  },
  es: {
    the_serving_two_percent: "el 2% de servir",
    online_softmax_two_phases_real_comm: "softmax online · dos fases · comm real",
    online: "online",
    two_phase: "dos fases",
    comm: "comm",
    running_max: "max corriente",
    running_sum: "suma corriente",
    blocks_written: "bloques escritos",
    decode_reads_summaries: "decode lee resúmenes",
    per_layer: "por capa",
    block_summaries: "resúmenes",
    cost: "coste",
    less_than_2: "< 2%",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("online");

  return (
    <Figure
      label={t.the_serving_two_percent}
      hint={t.online_softmax_two_phases_real_comm}
      legend={[
        { color: P.teal, label: t.two_phase },
        { color: P.violet, label: t.online },
        { color: P.amber, label: t.comm },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "online", label: t.online, tone: P.violet },
            { value: "twophase", label: t.two_phase, tone: P.teal },
            { value: "comm", label: t.comm, tone: P.amber },
          ]}
          ariaLabel={t.the_serving_two_percent}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "online" && (
          <>
            {/* keys stream in; a running m and l are kept */}
            {Array.from({ length: 6 }, (_, i) => (
              <Node3D
                key={i}
                position={[-2.6 + i * 0.55, 0.95 - (i % 2) * 0.2, 0]}
                color={P.teal}
                radius={0.11}
                matte
              />
            ))}
            <Flow points={[[-2.4, 0.7, 0], [-0.2, 0.4, 0]]} color={P.teal} count={3} size={0.04} />
            {/* running state */}
            <Halo position={[0.4, 0.3, 0]} radius={0.55} color={P.violet} opacity={0.55} spin={0.25} />
            <Node3D position={[0.4, 0.3, 0]} color={P.violet} radius={0.18} pulse={0.3} />
            <Tag position={[0.4, 0.85, 0.15]} tone="violet" size="xs">{t.running_max}</Tag>
            <Tag position={[0.4, -0.1, 0.15]} tone="violet" size="xs">{t.running_sum}</Tag>
            {/* normalized output */}
            <Flow points={[[0.85, 0.3, 0], [2.4, 0.3, 0]]} color={P.violet} count={2} />
            <Slab position={[2.6, 0.3, 0]} size={[0.9, 0.9, 0.12]} color={P.teal} fill={0.24} />
            <Tag position={[2.6, 0.95, 0.15]} tone="teal" size="xs">α</Tag>
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">rescale on the fly</Tag>
          </>
        )}

        {mode === "twophase" && (
          <>
            {/* prefill writes N block summaries */}
            <Slab position={[-1.9, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.teal} fill={0.16} />
            <Tag position={[-1.9, 1.55, 0.15]} tone="teal">prefill</Tag>
            {Array.from({ length: 9 }, (_, i) => (
              <Node3D
                key={i}
                position={[-2.65 + (i % 3) * 0.55, 0.9 - Math.floor(i / 3) * 0.4, 0.15]}
                color={P.teal}
                radius={0.1}
                matte
              />
            ))}
            <Tag position={[-1.9, -0.4, 0.15]} tone="muted" size="xs">{t.blocks_written}</Tag>
            {/* decode reads them back, plus the running partial */}
            <Slab position={[1.9, 0.5, 0]} size={[2.2, 1.6, 0.14]} color={P.amber} fill={0.16} />
            <Tag position={[1.9, 1.55, 0.15]} tone="amber">decode</Tag>
            <Slab position={[1.9, 0.5, 0.15]} size={[1.7, 0.4, 0.06]} color={P.violet} fill={0.4} />
            <Tag position={[1.9, -0.4, 0.15]} tone="muted" size="xs">{t.decode_reads_summaries}</Tag>
            <Flow points={[[-0.75, 0.5, 0], [0.75, 0.5, 0]]} color={P.violet} count={3} />
          </>
        )}

        {mode === "comm" && (
          <>
            {/* two pipeline stages exchanging either per-layer outputs (fat) or block summaries (thin) */}
            <Slab position={[-2.0, 0.9, 0]} size={[1.9, 0.7, 0.14]} color={P.teal} fill={0.22} />
            <Tag position={[-2.0, 1.45, 0.15]} tone="teal" size="xs">stage k</Tag>
            <Slab position={[2.0, 0.9, 0]} size={[1.9, 0.7, 0.14]} color={P.violet} fill={0.22} />
            <Tag position={[2.0, 1.45, 0.15]} tone="violet" size="xs">stage k+1</Tag>
            {/* fat ribbon: per-layer */}
            <Ribbon points={[[-1.0, 0.75, 0], [0, 0.75, 0], [1.0, 0.75, 0]]} color={P.rose} radius={0.08} opacity={0.6} />
            <Tag position={[0, 1.25, 0.15]} tone="rose" size="xs">{t.per_layer} · O(L)</Tag>
            {/* thin ribbon: block summaries */}
            <Ribbon points={[[-1.0, -0.05, 0], [0, -0.05, 0], [1.0, -0.05, 0]]} color={P.teal} radius={0.025} opacity={0.9} />
            <Tag position={[0, -0.45, 0.15]} tone="teal" size="xs">{t.block_summaries} · O(N)</Tag>
            {/* the bill */}
            <Slab position={[0, -1.2, 0]} size={[2.0, 0.5, 0.12]} color={P.amber} fill={0.28} />
            <Tag position={[0, -1.65, 0.15]} tone="amber" size="xs">{t.cost}: {t.less_than_2}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

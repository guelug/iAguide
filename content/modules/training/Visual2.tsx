"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Training: forward/backward, Adam descending a valley, shuffled batches. */
type Mode = "fb" | "opt" | "data";

const COPY = {
  en: {
    one_step_three_views: "one step, three views",
    forward_backward_optimizer_data: "forward+backward · optimizer · data",
    fb: "fwd+bwd",
    optimizer: "optimizer",
    data: "data",
    forward: "forward",
    backward: "backward",
    adam: "adam",
    loss_valley: "loss valley",
    batch: "batch",
    shuffled: "shuffled",
    epoch: "epoch",
  },
  es: {
    one_step_three_views: "un paso, tres vistas",
    forward_backward_optimizer_data: "forward+backward · optimizador · datos",
    fb: "fwd+bwd",
    optimizer: "optimizador",
    data: "datos",
    forward: "forward",
    backward: "backward",
    adam: "adam",
    loss_valley: "valle de pérdida",
    batch: "lote",
    shuffled: "barajado",
    epoch: "época",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("fb");

  // a loss valley
  const valley = Array.from({ length: 60 }, (_, i) => {
    const x = -2.8 + i * 0.095;
    const y = -1.4 + Math.pow(x / 2.4, 2) * 1.6;
    return [x, y, 0] as [number, number, number];
  });

  const dataset = Array.from({ length: 24 }, (_, i) => ({
    position: [-1.7 + (i % 8) * 0.48, 0.95 - Math.floor(i / 8) * 0.5, 0] as [number, number, number],
    color: i % 4 === 0 ? P.amber : P.teal,
  }));

  return (
    <Figure
      label={t.one_step_three_views}
      hint={t.forward_backward_optimizer_data}
      legend={[
        { color: P.teal, label: t.forward },
        { color: P.rose, label: t.backward },
        { color: P.violet, label: t.adam },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "fb", label: t.fb, tone: P.teal },
            { value: "opt", label: t.optimizer, tone: P.violet },
            { value: "data", label: t.data, tone: P.amber },
          ]}
          ariaLabel={t.one_step_three_views}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "fb" && (
          <>
            {/* layer stack, forward teal, backward rose */}
            {[0, 1, 2, 3].map((i) => (
              <Slab
                key={i}
                position={[0, 1.4 - i * 0.85, 0]}
                size={[4.0, 0.5, 0.14]}
                color={i % 2 === 0 ? P.teal : P.violet}
                fill={0.16}
              />
            ))}
            <Flow points={[[-2.0, 1.6, 0], [0, 1.6, 0], [0, -1.0, 0], [2.0, -1.0, 0]]} color={P.teal} count={5} />
            <Tag position={[-2.2, 1.9, 0.15]} tone="teal" size="xs">{t.forward}</Tag>
            <Flow points={[[2.0, -1.0, 0], [0, -1.0, 0], [0, 1.6, 0], [-2.0, 1.6, 0]]} color={P.rose} count={5} size={0.045} />
            <Tag position={[2.2, -1.25, 0.15]} tone="rose" size="xs">{t.backward}</Tag>
            <Tag position={[2.2, 1.9, 0.15]} tone="muted" size="xs">loss</Tag>
          </>
        )}

        {mode === "opt" && (
          <>
            <Ribbon points={valley} color={P.lineStrong} radius={0.02} opacity={0.9} />
            {/* Adam steps descending */}
            {[
              [-2.2, 0.35],
              [-1.6, -0.35],
              [-1.0, -0.8],
              [-0.55, -1.1],
              [-0.2, -1.3],
              [0.0, -1.4],
            ].map(([x, y], i) => (
              <group key={i}>
                <Node3D position={[x, y, 0]} color={P.violet} radius={0.13} pulse={i * 0.3} />
                {i > 0 && (
                  <Wire
                    points={[[[-2.2, 0.35], [-1.6, -0.35], [-1.0, -0.8], [-0.55, -1.1], [-0.2, -1.3], [0.0, -1.4]][i - 1] as [number, number, number], [x, y, 0]]}
                    color={P.violet}
                    opacity={0.6}
                  />
                )}
              </group>
            ))}
            <Halo position={[0.0, -1.4, 0]} radius={0.45} color={P.violet} opacity={0.5} spin={0.2} />
            <Tag position={[0.9, -1.3, 0.15]} tone="violet" size="xs">min</Tag>
            <Tag position={[0, 2.0, 0.15]} tone="muted">{t.loss_valley} · {t.adam}</Tag>
          </>
        )}

        {mode === "data" && (
          <>
            <Lattice cells={dataset} size={0.22} opacity={0.85} />
            <Tag position={[0, 1.6, 0.15]} tone="teal" size="xs">dataset · {t.shuffled}</Tag>
            {/* batches come out 6 at a time */}
            {[0, 1, 2].map((b) => (
              <group key={b}>
                <Slab
                  position={[-1.7 + b * 1.85, -0.95, 0]}
                  size={[1.6, 0.55, 0.12]}
                  color={P.amber}
                  fill={0.22}
                />
                <Tag position={[-1.7 + b * 1.85, -1.5, 0.15]} tone="amber" size="xs">
                  {t.batch} {b + 1}
                </Tag>
              </group>
            ))}
            {[0, 1, 2].map((b) => (
              <Flow
                key={b}
                points={[[-1.7 + b * 1.85, 0.2, 0], [-1.7 + b * 1.85, -0.6, 0]]}
                color={P.amber}
                count={2}
                size={0.045}
              />
            ))}
            <Tag position={[2.7, 0.4, 0.15]} tone="muted" size="xs">{t.epoch}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

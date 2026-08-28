"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* PreNorm's running sum grows like O(L); depth is time; a softmax over the
   past is the gate the unit-weight residual never had. */
type Mode = "creep" | "duality" | "gate";

const COPY = {
  en: {
    the_sum_that_grows: "the sum that grows",
    prenorm_lets_layer_32_shout_into_1_32: "prenom lets layer 32 shout into 1/32",
    magnitude_creep: "magnitude creep",
    depth_is_time: "depth is time",
    the_gate: "the gate",
    layer: "layer",
    magnitude: "magnitude",
    diluted: "diluted",
    sequence_axis: "sequence axis",
    depth_axis: "depth axis",
    softmax_2017: "softmax · 2017",
    softmax_2026: "softmax · 2026",
    alpha: "alpha",
    competitive: "competitive",
    forced: "forced",
    gate_is_softmax: "the gate is softmax",
  },
  es: {
    the_sum_that_grows: "la suma que crece",
    prenorm_lets_layer_32_shout_into_1_32: "prenorm deja a la capa 32 gritar en 1/32",
    magnitude_creep: "deriva de magnitud",
    depth_is_time: "la profundidad es tiempo",
    the_gate: "la puerta",
    layer: "capa",
    magnitude: "magnitud",
    diluted: "diluida",
    sequence_axis: "eje secuencia",
    depth_axis: "eje profundidad",
    softmax_2017: "softmax · 2017",
    softmax_2026: "softmax · 2026",
    alpha: "alto",
    competitive: "competitiva",
    forced: "obligatoria",
    gate_is_softmax: "la puerta es un softmax",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("creep");

  // magnitude creep: bar chart over 16 layers, radius grows
  const bars = Array.from({ length: 16 }, (_, i) => ({
    position: [-2.6 + i * 0.35, -1.0 + (i + 1) * 0.045, 0] as [number, number, number],
    color: i < 5 ? P.teal : i < 11 ? P.amber : P.rose,
  }));

  return (
    <Figure
      label={t.the_sum_that_grows}
      hint={t.prenorm_lets_layer_32_shout_into_1_32}
      legend={[
        { color: P.teal, label: t.layer },
        { color: P.rose, label: t.diluted },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "creep", label: t.magnitude_creep, tone: P.rose },
            { value: "duality", label: t.depth_is_time, tone: P.violet },
            { value: "gate", label: t.the_gate, tone: P.teal },
          ]}
          ariaLabel={t.the_sum_that_grows}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "creep" && (
          <>
            {/* running-magnitude bars */}
            {bars.map((b, i) => (
              <group key={i}>
                <Wire
                  points={[[b.position[0], -1.0, 0], b.position]}
                  color={b.color}
                  width={4}
                  opacity={0.85}
                />
                <Node3D position={b.position} color={b.color} radius={0.06} matte />
                {(i === 0 || i === 15) && (
                  <Tag position={[b.position[0], b.position[1] + 0.35, 0.15]} tone={i === 15 ? "rose" : "teal"} size="xs">
                    {t.layer} {i + 1}
                  </Tag>
                )}
              </group>
            ))}
            {/* baseline */}
            <Wire points={[[-2.9, -1.0, 0], [3.0, -1.0, 0]]} color={P.lineStrong} opacity={0.7} />
            <Tag position={[3.0, -0.7, 0.15]} tone="muted" size="xs">{t.magnitude}</Tag>
            {/* the early layer sitting on every downstream path */}
            <Halo position={[-2.6, -0.95, 0]} radius={0.22} color={P.teal} opacity={0.6} spin={0.3} />
          </>
        )}

        {mode === "duality" && (
          <>
            {/* two parallel ribbons: sequence axis and depth axis */}
            <Slab position={[0, 0.85, 0]} size={[5.4, 0.9, 0.12]} color={P.teal} fill={0.1} />
            <Tag position={[0, 1.6, 0.15]} tone="teal">{t.sequence_axis}</Tag>
            {Array.from({ length: 7 }, (_, i) => (
              <Node3D key={i} position={[-2.4 + i * 0.85, 0.85, 0.1]} color={P.teal} radius={0.1} matte />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <Flow
                key={i}
                points={[[-2.4 + i * 0.85, 0.85, 0.1], [-1.55 + i * 0.85, 0.85, 0.1]]}
                color={P.teal}
                count={1}
                size={0.04}
                speed={0.25}
              />
            ))}
            <Tag position={[0, 0.2, 0.15]} tone="teal" size="xs">{t.softmax_2017}</Tag>

            <Slab position={[0, -0.85, 0]} size={[5.4, 0.9, 0.12]} color={P.violet} fill={0.1} />
            <Tag position={[0, -1.85, 0.15]} tone="violet">{t.depth_axis}</Tag>
            {Array.from({ length: 7 }, (_, i) => (
              <Node3D key={i} position={[-2.4 + i * 0.85, -0.85, 0.1]} color={P.violet} radius={0.1} matte />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <Flow
                key={i}
                points={[[-2.4 + i * 0.85, -0.85, 0.1], [-1.55 + i * 0.85, -0.85, 0.1]]}
                color={P.violet}
                count={1}
                size={0.04}
                speed={0.25}
              />
            ))}
            <Tag position={[0, -0.15, 0.15]} tone="violet" size="xs">{t.softmax_2026}</Tag>
          </>
        )}

        {mode === "gate" && (
          <>
            {/* sources row: v0 + v1..v4 */}
            {Array.from({ length: 5 }, (_, i) => (
              <group key={i}>
                <Node3D
                  position={[-2.2 + i * 0.95, 1.0, 0]}
                  color={i === 0 ? P.teal : P.muted}
                  radius={0.13}
                  matte
                />
                <Tag position={[-2.2 + i * 0.95, 1.4, 0.15]} tone={i === 0 ? "teal" : "muted"} size="xs">
                  v{i === 0 ? "0 (emb)" : `${i}`}
                </Tag>
              </group>
            ))}
            {/* softmax weights as variable-width flows into h_l */}
            {[0.5, 0.28, 0.12, 0.07, 0.03].map((w, i) => (
              <Flow
                key={i}
                points={[[-2.2 + i * 0.95, 0.85, 0], [0, -0.1, 0]]}
                color={i === 0 ? P.teal : P.violet}
                count={Math.max(1, Math.round(w * 6))}
                width={1 + w * 6}
                size={0.04}
                speed={0.2 + w}
              />
            ))}
            {/* target layer */}
            <Slab position={[0, -0.5, 0]} size={[2.4, 0.5, 0.12]} color={P.violet} fill={0.22} />
            <Tag position={[0, -1.0, 0.15]} tone="violet">h_l</Tag>
            <Tag position={[2.4, 0.45, 0.15]} tone="teal" size="xs">{t.gate_is_softmax}</Tag>
            {/* before: forced unit weights */}
            <Wire points={[[-2.8, -0.5, 0], [-1.4, -0.5, 0]]} color={P.lineStrong} dashed opacity={0.6} />
            <Tag position={[-2.1, -1.1, 0.15]} tone="rose" size="xs">{t.forced} + + +</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

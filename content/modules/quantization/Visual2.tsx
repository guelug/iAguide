"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* quantization: precision bars, calibration histogram, GPTQ vs AWQ packing. */
type Mode = "precision" | "calibration" | "packing";

const COPY = {
  en: {
    quantization_is_lossy_compression: "quantization is lossy compression",
    precision_calibration_packing: "precision · calibration · packing",
    precision: "fp16 vs int4",
    calibration: "calibration",
    packing: "gptq vs awq",
    fp16: "fp16",
    int4: "int4",
    scale: "scale",
    zero: "zero-point",
    gptq: "GPTQ",
    awq: "AWQ",
  },
  es: {
    quantization_is_lossy_compression: "la cuantización es compresión con pérdida",
    precision_calibration_packing: "precisión · calibración · empaquetado",
    precision: "fp16 vs int4",
    calibration: "calibración",
    packing: "gptq vs awq",
    fp16: "fp16",
    int4: "int4",
    scale: "escala",
    zero: "punto cero",
    gptq: "GPTQ",
    awq: "AWQ",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("precision");

  // a weight histogram before quantization
  const histo = [0.3, 0.7, 1.5, 1.0, 0.4, 0.2, 0.1, 0.05];

  return (
    <Figure
      label={t.quantization_is_lossy_compression}
      hint={t.precision_calibration_packing}
      legend={[
        { color: P.teal, label: t.precision },
        { color: P.violet, label: t.calibration },
        { color: P.amber, label: t.packing },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "precision", label: t.precision, tone: P.teal },
            { value: "calibration", label: t.calibration, tone: P.violet },
            { value: "packing", label: t.packing, tone: P.amber },
          ]}
          ariaLabel={t.quantization_is_lossy_compression}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "precision" && (
          <>
            {/* two bars: same weight value, different bit width */}
            <Slab position={[-1.6, 0.4, 0]} size={[1.6, 0.4, 0.1]} color={P.teal} fill={0.32} />
            <Tag position={[-1.6, 0.85, 0.15]} tone="teal">{t.fp16} · 16 bits</Tag>
            {[0, 1, 2, 3].map((i) => (
              <Slab
                key={i}
                position={[0.7 + i * 0.45, 0.4, 0]}
                size={[0.4, 0.4, 0.1]}
                color={P.amber}
                fill={0.32}
              />
            ))}
            <Tag position={[1.35, 0.85, 0.15]} tone="amber">{t.int4} · 4×4 bits</Tag>
            {/* the rounding gap */}
            <Wire points={[[-0.3, 0.05, 0], [0.5, 0.05, 0]]} color={P.rose} dashed opacity={0.7} />
            <Tag position={[0.1, -0.3, 0.15]} tone="rose" size="xs">≈</Tag>
            <Ribbon
              points={[[-1.6, -0.35, 0], [-0.5, -0.35, 0], [1.4, -0.35, 0]]}
              color={P.teal}
              radius={0.03}
              opacity={0.7}
            />
            <Tag position={[0, -0.8, 0.15]} tone="muted" size="xs">peso ≈ 0.3147</Tag>
          </>
        )}

        {mode === "calibration" && (
          <>
            {histo.map((h, i) => (
              <Slab
                key={i}
                position={[-2.6 + i * 0.55, -0.6 + h / 2, 0]}
                size={[0.45, h, 0.08]}
                color={P.teal}
                fill={0.3}
              />
            ))}
            <Wire points={[[-3.1, -0.6, 0], [2.4, -0.6, 0]]} color={P.lineStrong} opacity={0.6} />
            {/* scale+zero-point box */}
            <Slab position={[1.9, 0.9, 0]} size={[1.6, 1.2, 0.12]} color={P.violet} fill={0.2} />
            <Tag position={[1.9, 1.7, 0.15]} tone="violet" size="xs">{t.scale}</Tag>
            <Tag position={[1.9, 0.9, 0.15]} tone="violet" size="xs">{t.zero}</Tag>
            <Wire points={[[1.0, 0.4, 0], [1.1, 0.7, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">clip range</Tag>
          </>
        )}

        {mode === "packing" && (
          <>
            <Slab position={[-1.6, 0.6, 0]} size={[2.0, 1.4, 0.14]} color={P.teal} fill={0.18} />
            <Tag position={[-1.6, 1.5, 0.15]} tone="teal">{t.gptq}</Tag>
            {/* rowwise */}
            {[0, 1, 2].map((i) => (
              <Slab key={i} position={[-1.6, 1.0 - i * 0.4, 0.1]} size={[1.6, 0.25, 0.06]} color={P.teal} fill={0.3} />
            ))}
            <Slab position={[1.6, 0.6, 0]} size={[2.0, 1.4, 0.14]} color={P.amber} fill={0.18} />
            <Tag position={[1.6, 1.5, 0.15]} tone="amber">{t.awq}</Tag>
            <Lattice
              cells={Array.from({ length: 8 }, (_, i) => ({
                position: [1.1 + (i % 2) * 0.5, 1.1 - Math.floor(i / 2) * 0.32, 0.15] as [number, number, number],
                color: P.amber,
              }))}
              size={0.16}
              opacity={0.85}
              matte
            />
            <Tag position={[0, -0.4, 0.15]} tone="muted" size="xs">rowwise vs grouped</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Bars, PointerTilt, ShadowBlob, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "fp16" | "q4" | "nf4";

const COPY = {
  en: {
    title: "what quantization actually throws away",
    hint: "each bar is one weight · the red cap is the error you introduced",
    fp16: "FP16",
    q4: "INT4 (uniform)",
    nf4: "NF4",
    legendWeight: "weight",
    legendLevel: "quantization level",
    legendError: "error",
    bytes: "bytes / weight",
    error: "mean error",
    levels: "levels",
    fp16Note: "16 bits per weight: the grid is so fine you cannot see it",
    q4Note: "16 evenly spaced levels — fine for big weights, brutal for the small ones near zero",
    nf4Note: "16 levels packed near zero, where a trained weight distribution actually lives",
  },
  es: {
    title: "qué tira de verdad la cuantización",
    hint: "cada barra es un peso · la tapa roja es el error que has metido",
    fp16: "FP16",
    q4: "INT4 (uniforme)",
    nf4: "NF4",
    legendWeight: "peso",
    legendLevel: "nivel de cuantización",
    legendError: "error",
    bytes: "bytes / peso",
    error: "error medio",
    levels: "niveles",
    fp16Note: "16 bits por peso: la rejilla es tan fina que no se ve",
    q4Note: "16 niveles equiespaciados — bien para los pesos grandes, brutal para los pequeños",
    nf4Note: "16 niveles apretados cerca de cero, que es donde vive la distribución real",
  },
};

const N = 34;

/** Deterministic pseudo-normal weights: same figure on every render. */
const WEIGHTS = Array.from({ length: N }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233 + 1.7) * 12345.6789;
  const u = (a - Math.floor(a)) || 0.5;
  const v = (b - Math.floor(b)) || 0.5;
  // Box–Muller, clamped: a weight matrix is roughly normal around zero.
  const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * 0.34;
  return Math.max(-0.98, Math.min(0.98, g));
});

/** 16 levels, evenly spaced across [-1, 1]. */
const UNIFORM = Array.from({ length: 16 }, (_, i) => -1 + (2 * i) / 15);

/**
 * 16 levels bunched around zero. Real NF4 derives its levels from the
 * quantiles of a normal distribution; this curve has the same shape and
 * the same lesson — resolution follows where the mass is.
 */
const NORMALISED = UNIFORM.map((u) => Math.sign(u) * Math.pow(Math.abs(u), 1.75));

function snap(value: number, levels: number[]) {
  let best = levels[0];
  let bestD = Math.abs(value - best);
  for (const l of levels) {
    const d = Math.abs(value - l);
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return best;
}

const SCALE = 1.35;
const PITCH = 0.155;
const SPAN = (N - 1) * PITCH;

function WeightBar({
  x,
  value,
  target,
  error,
}: {
  x: number;
  value: number;
  target: number;
  error: number;
}) {
  const bar = useRef<Group>(null);
  const cap = useRef<Group>(null);

  useFrame((_, dt) => {
    if (bar.current) {
      const h = Math.abs(target) * SCALE;
      bar.current.scale.y = MathUtils.damp(bar.current.scale.y, Math.max(0.004, h), 7, dt);
      bar.current.position.y = MathUtils.damp(
        bar.current.position.y,
        (Math.sign(target) * h) / 2,
        7,
        dt,
      );
    }
    if (cap.current) {
      const e = error * SCALE;
      cap.current.scale.y = MathUtils.damp(cap.current.scale.y, Math.max(0.004, e), 7, dt);
      cap.current.position.y = MathUtils.damp(
        cap.current.position.y,
        Math.sign(value) * (Math.abs(target) * SCALE + (e / 2)),
        7,
        dt,
      );
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <group ref={bar}>
        <mesh>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshStandardMaterial
            color={value >= 0 ? P.teal : P.violet}
            roughness={0.42}
            metalness={0.03}
          />
        </mesh>
      </group>
      <group ref={cap}>
        <mesh>
          <boxGeometry args={[0.105, 1, 0.105]} />
          <meshStandardMaterial color={P.rose} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("fp16");

  const levels = mode === "q4" ? UNIFORM : mode === "nf4" ? NORMALISED : null;

  const { snapped, errors, meanError } = useMemo(() => {
    const s = WEIGHTS.map((w) => (levels ? snap(w, levels) : w));
    const e = WEIGHTS.map((w, i) => Math.abs(w - s[i]));
    return {
      snapped: s,
      errors: e,
      meanError: e.reduce((a, b) => a + b, 0) / e.length,
    };
  }, [levels]);

  const bytes = mode === "fp16" ? 2 : 0.5;
  const accent = mode === "q4" ? P.amber : mode === "nf4" ? P.violet : P.teal;
  const note = mode === "q4" ? t.q4Note : mode === "nf4" ? t.nf4Note : t.fp16Note;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendWeight },
        { color: P.lineStrong, label: t.legendLevel },
        { color: P.rose, label: t.legendError },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "fp16", label: t.fp16, tone: P.teal },
            { value: "q4", label: t.q4, tone: P.amber },
            { value: "nf4", label: t.nf4, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      height="h-[370px] md:h-[460px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.5, 6.8], fov: 40 }} background={P.paper} fit={1.12}>
        <PointerTilt amount={0.07}>
          <group position={[0, 0.35, 0]} rotation={[-0.12, 0, 0]}>
            <ShadowBlob position={[0, -1.6, 0]} scale={7} opacity={0.05} />

            {/* The grid you are snapping to. Its spacing is the whole story. */}
            {levels?.map((l, i) => (
              <Wire
                key={i}
                points={[
                  [-SPAN / 2 - 0.2, l * SCALE, 0],
                  [SPAN / 2 + 0.2, l * SCALE, 0],
                ]}
                color={accent}
                opacity={0.3}
                width={0.9}
              />
            ))}

            {/* Zero line: weights live around it, which is why NF4 wins. */}
            <Wire
              points={[
                [-SPAN / 2 - 0.35, 0, 0],
                [SPAN / 2 + 0.35, 0, 0],
              ]}
              color={P.lineStrong}
              opacity={0.9}
              width={1.4}
            />

            {WEIGHTS.map((w, i) => (
              <WeightBar
                key={i}
                x={i * PITCH - SPAN / 2}
                value={w}
                target={snapped[i]}
                error={errors[i]}
              />
            ))}

            <Tag position={[SPAN / 2 + 0.55, 0, 0]} tone="muted" size="xs">
              0
            </Tag>
            {levels ? (
              <Tag position={[-SPAN / 2 - 0.6, SCALE * 0.92, 0]} tone="muted" size="xs">
                {levels.length} {t.levels}
              </Tag>
            ) : null}
          </group>

          {/* The trade, in numbers rather than adjectives. */}
          <group position={[0, -1.95, 0]}>
            <Bars
              bars={[
                { label: t.bytes, value: bytes / 2, color: accent, note: `${bytes}` },
                {
                  label: t.error,
                  value: Math.min(1, meanError / 0.09),
                  color: P.rose,
                  note: meanError.toFixed(3),
                },
              ]}
              height={0.58}
              width={0.46}
              gap={0.9}
              depth={0.28}
            />
          </group>
        </PointerTilt>

        <Tag position={[0, -2.72, 0]} tone={mode === "q4" ? "amber" : mode === "nf4" ? "violet" : "teal"} size="xs" center>
          {note}
        </Tag>
      </Stage>
    </Figure>
  );
}

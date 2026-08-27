"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* maths: cosine similarity halo, softmax logits→probs, X·W=Y ribbon. */
type Mode = "cos" | "soft" | "matmul";

const COPY = {
  en: {
    the_three_sums_you_actually_use: "the three sums you actually use",
    cosine_softmax_matmul: "cosine · softmax · matmul",
    cosine: "cosine",
    softmax: "softmax",
    matmul: "matmul",
    logits: "logits",
    probabilities: "probabilities",
    angle: "angle",
    similar: "similar",
    different: "different",
    rows: "rows",
    cols: "cols",
    dot: "dot",
  },
  es: {
    the_three_sums_you_actually_use: "las tres sumas que de verdad usas",
    cosine_softmax_matmul: "coseno · softmax · matmul",
    cosine: "coseno",
    softmax: "softmax",
    matmul: "matmul",
    logits: "logits",
    probabilities: "probabilidades",
    angle: "ángulo",
    similar: "similar",
    different: "diferente",
    rows: "filas",
    cols: "cols",
    dot: "producto punto",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("cos");

  return (
    <Figure
      label={t.the_three_sums_you_actually_use}
      hint={t.cosine_softmax_matmul}
      legend={[
        { color: P.teal, label: t.cosine },
        { color: P.violet, label: t.softmax },
        { color: P.amber, label: t.matmul },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "cos", label: t.cosine, tone: P.teal },
            { value: "soft", label: t.softmax, tone: P.violet },
            { value: "matmul", label: t.matmul, tone: P.amber },
          ]}
          ariaLabel={t.the_three_sums_you_actually_use}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "cos" && (
          <>
            {/* origin + two vectors */}
            <Node3D position={[-2.5, -1.2, 0]} color={P.muted} radius={0.12} />
            {/* vector a: similar (close to v) */}
            <Ribbon
              points={[[-2.5, -1.2, 0], [-0.3, 0.3, 0]]}
              color={P.teal}
              radius={0.04}
              opacity={0.85}
            />
            <Node3D position={[-0.3, 0.3, 0]} color={P.teal} radius={0.14} pulse={0.2} />
            {/* vector v */}
            <Ribbon
              points={[[-2.5, -1.2, 0], [0.3, 0.6, 0]]}
              color={P.violet}
              radius={0.04}
              opacity={0.85}
            />
            <Node3D position={[0.3, 0.6, 0]} color={P.violet} radius={0.14} pulse={0.2} />
            {/* angle arc */}
            <Halo position={[-2.5, -1.2, 0]} radius={0.8} color={P.amber} opacity={0.5} spin={0.1} />
            <Tag position={[-2.8, -1.55, 0.15]} tone="muted">0</Tag>
            <Tag position={[-1.0, 0.9, 0.15]} tone="amber" size="xs">{t.angle}</Tag>
            {/* similar pair */}
            <Node3D position={[2.3, 0.4, 0]} color={P.teal} radius={0.18} pulse={0.4} />
            <Ribbon
              points={[[2.3, 0.25, 0], [2.3, -0.5, 0]]}
              color={P.teal}
              radius={0.03}
              opacity={0.7}
            />
            <Node3D position={[2.3, -0.65, 0]} color={P.teal} radius={0.14} />
            <Tag position={[2.3, 0.85, 0.15]} tone="teal" size="xs">{t.similar}</Tag>
            {/* dissimilar pair */}
            <Node3D position={[-2.3, -0.6, 0]} color={P.rose} radius={0.14} />
            <Tag position={[-2.3, -1.05, 0.15]} tone="rose" size="xs">{t.different}</Tag>
          </>
        )}

        {mode === "soft" && (
          <>
            {/* logits bars vs probabilities bars */}
            {[-1.4, -0.7, 0.0, 0.7, 1.4].map((x, i) => {
              const h = [1.4, 0.5, 2.0, 0.9, 0.3][i];
              return (
                <group key={i}>
                  <Slab position={[x - 1.6, -0.5 + h / 2, 0]} size={[0.4, h, 0.1]} color={P.violet} fill={0.35} />
                  <Tag position={[x - 1.6, 1.05, 0.15]} tone="violet" size="xs">{h.toFixed(1)}</Tag>
                </group>
              );
            })}
            <Tag position={[-1.6, -1.05, 0.15]} tone="violet">{t.logits}</Tag>

            {[-1.4, -0.7, 0.0, 0.7, 1.4].map((x, i) => {
              const p = [0.34, 0.06, 0.48, 0.10, 0.02][i];
              return (
                <group key={i}>
                  <Slab position={[x + 1.6, -0.5 + p / 2, 0]} size={[0.4, p, 0.1]} color={P.teal} fill={0.4} />
                  <Tag position={[x + 1.6, 0.6 + p / 2, 0.15]} tone="teal" size="xs">{Math.round(p * 100)}%</Tag>
                </group>
              );
            })}
            <Tag position={[1.6, -1.05, 0.15]} tone="teal">{t.probabilities}</Tag>
            <Wire points={[[-2.9, -0.5, 0], [2.9, -0.5, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[0, 1.85, 0.15]} tone="muted" size="xs">softmax(x) ∝ eˣ; suma = 1</Tag>
          </>
        )}

        {mode === "matmul" && (
          <>
            <Slab position={[-2.3, 0.4, 0]} size={[0.9, 1.8, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[-2.3, 1.5, 0.15]} tone="teal" size="xs">X · n×m</Tag>
            <Slab position={[1.6, 0.4, 0]} size={[1.8, 1.8, 0.12]} color={P.violet} fill={0.22} />
            <Tag position={[1.6, 1.5, 0.15]} tone="violet" size="xs">W · m×k</Tag>
            <Wire points={[[-1.5, 0.4, 0], [0.5, 0.4, 0]]} color={P.amber} width={3.5} opacity={0.8} />
            <Tag position={[-0.5, 0.7, 0.15]} tone="amber" size="xs">×</Tag>
            <Ribbon
              points={[[0.7, 0.4, 0], [1.2, 0.4, 0], [1.4, 0.4, 0]]}
              color={P.amber}
              radius={0.04}
              opacity={0.85}
            />
            <Slab position={[2.5, 0.4, 0]} size={[0.7, 1.8, 0.12]} color={P.amber} fill={0.3} />
            <Tag position={[2.5, 1.5, 0.15]} tone="amber" size="xs">Y · n×k</Tag>
            <Tag position={[0, -0.9, 0.15]} tone="muted" size="xs">{t.rows}·{t.cols}·{t.dot}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

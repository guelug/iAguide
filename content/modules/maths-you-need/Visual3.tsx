"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
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

/* Maths you need: vectors and the dot product, softmax as a map on logits,
   and matmul X·W=Y. The diagrams are formula bookmarks: each scene carries
   its equation in Tag text. */
type Mode = "vectors" | "softmax" | "matmul";

const COPY = {
  en: {
    three_operations_in_math: "three operations, three formulas",
    vec_soft_matmul: "vectors · softmax · matmul",
    vectors: "vectors",
    softmax: "softmax",
    matmul: "matmul",
    // vectors
    v_label: "v",
    u_label: "u",
    dot_label: "v·u",
    dot_formula: "v·u = Σ vᵢ uᵢ",
    cos_label: "cos θ",
    cos_formula: "cos = (v·u) / (‖v‖·‖u‖)",
    similar: "similar",
    different: "different",
    angle_label: "θ",
    // softmax
    logit_label: "z",
    exp_label: "e^{z}",
    norm_label: "/Σ e^{z}",
    softmax_formula: "σ(z)ᵢ = e^{zᵢ} / Σⱼ e^{zⱼ}",
    probs: "p",
    sum_one: "Σ pᵢ = 1",
    // matmul
    x_label: "X · n×m",
    w_label: "W · m×k",
    y_label: "Y · n×k",
    mul: "×",
    ops_count: "n·m·k FMAs",
    add: "+",
    accum: "Σ",
  },
  es: {
    three_operations_in_math: "tres operaciones, tres fórmulas",
    vec_soft_matmul: "vectores · softmax · matmul",
    vectors: "vectores",
    softmax: "softmax",
    matmul: "matmul",
    // vectors
    v_label: "v",
    u_label: "u",
    dot_label: "v·u",
    dot_formula: "v·u = Σᵢ vᵢ·uᵢ",
    cos_label: "cos θ",
    cos_formula: "cos = (v·u) / (‖v‖·‖u‖)",
    similar: "similar",
    different: "diferente",
    angle_label: "θ",
    // softmax
    logit_label: "z",
    exp_label: "e^{z}",
    norm_label: "/Σ e^{z}",
    softmax_formula: "σ(z)ᵢ = e^{zᵢ} / Σⱼ e^{zⱼ}",
    probs: "p",
    sum_one: "Σ pᵢ = 1",
    // matmul
    x_label: "X · n×m",
    w_label: "W · m×k",
    y_label: "Y · n×k",
    mul: "×",
    ops_count: "n·m·k FMAs",
    add: "+",
    accum: "Σ",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("vectors");

  // fixed logits for the softmax scene
  const logits = [-1.4, -0.7, 0.0, 0.7, 1.4];
  const rawHeights = [1.4, 0.5, 2.0, 0.9, 0.3];
  const probs = [0.34, 0.06, 0.48, 0.10, 0.02];

  // matmul dims
  const nCols = 3;

  return (
    <Figure
      label={t.three_operations_in_math}
      hint={t.vec_soft_matmul}
      legend={[
        { color: P.teal, label: t.vectors },
        { color: P.violet, label: t.softmax },
        { color: P.amber, label: t.matmul },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "vectors", label: t.vectors, tone: P.teal },
            { value: "softmax", label: t.softmax, tone: P.violet },
            { value: "matmul", label: t.matmul, tone: P.amber },
          ]}
          ariaLabel={t.three_operations_in_math}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "vectors" && (
          <>
            {/* origin + two vectors v and u with a small angle between them */}
            <Node3D position={[-2.4, -1.1, 0]} color={P.muted} radius={0.11} matte />
            <Tag position={[-2.4, -1.45, 0.15]} tone="muted" size="xs">0</Tag>
            <Ribbon
              points={[[-2.4, -1.1, 0], [-0.4, 0.3, 0]]}
              color={P.teal}
              radius={0.045}
              opacity={0.9}
            />
            <Node3D position={[-0.4, 0.3, 0]} color={P.teal} radius={0.16} pulse={0.2} />
            <Tag position={[-0.4, 0.7, 0.15]} tone="teal" size="sm">{t.v_label}</Tag>
            <Ribbon
              points={[[-2.4, -1.1, 0], [0.2, 0.6, 0]]}
              color={P.violet}
              radius={0.045}
              opacity={0.9}
            />
            <Node3D position={[0.2, 0.6, 0]} color={P.violet} radius={0.16} pulse={0.2} />
            <Tag position={[0.2, 1.0, 0.15]} tone="violet" size="sm">{t.u_label}</Tag>

            {/* the angle arc between them */}
            <Halo position={[-2.4, -1.1, 0]} radius={0.7} color={P.amber} opacity={0.55} spin={0.1} />
            <Tag position={[-1.45, -0.5, 0.15]} tone="amber" size="xs">{t.angle_label}</Tag>

            {/* the v·u dot product formula as a chip */}
            <Slab position={[1.6, 0.6, 0]} size={[1.7, 0.55, 0.1]} color={P.teal} fill={0.22} />
            <Tag position={[1.6, 0.6, 0.15]} tone="teal">{t.dot_formula}</Tag>

            {/* the cosine formula as a chip */}
            <Slab position={[1.6, -0.05, 0]} size={[1.9, 0.55, 0.1]} color={P.violet} fill={0.22} />
            <Tag position={[1.6, -0.05, 0.15]} tone="violet" size="xs">{t.cos_formula}</Tag>

            {/* consequence chips: similar pair vs different pair */}
            <Node3D position={[1.9, -1.1, 0]} color={P.teal} radius={0.13} pulse={0.3} />
            <Node3D position={[2.5, -0.85, 0]} color={P.teal} radius={0.13} pulse={0.3} />
            <Wire points={[[1.9, -1.1, 0], [2.5, -0.85, 0]]} color={P.teal} opacity={0.7} />
            <Tag position={[2.2, -1.45, 0.15]} tone="teal" size="xs">{t.similar}</Tag>

            <Node3D position={[-2.0, -0.4, 0]} color={P.rose} radius={0.13} />
            <Node3D position={[-2.6, 0.5, 0]} color={P.rose} radius={0.13} />
            <Wire points={[[-2.0, -0.4, 0], [-2.6, 0.5, 0]]} color={P.rose} opacity={0.7} />
            <Tag position={[-2.3, 0.85, 0.15]} tone="rose" size="xs">{t.different}</Tag>
          </>
        )}

        {mode === "softmax" && (
          <>
            {/* softmax as a three-stage pipeline: z -> e^z -> normalise -> p */}
            <Tag position={[-2.5, 1.78, 0.15]} tone="muted" size="xs">{t.logit_label}</Tag>
            <Tag position={[-0.3, 1.78, 0.15]} tone="violet" size="xs">{t.exp_label}</Tag>
            <Tag position={[2.0, 1.78, 0.15]} tone="teal" size="xs">{t.probs}</Tag>

            {/* stage 1: raw logits as violet bars */}
            {logits.map((z, i) => {
              const h = rawHeights[i];
              const x = -2.5 + i * 0.55;
              return (
                <group key={`z-${i}`}>
                  <Slab
                    position={[x, -0.4 + h / 2, 0]}
                    size={[0.36, h, 0.08]}
                    color={P.violet}
                    fill={0.36}
                  />
                  <Tag position={[x, -0.4 + h + 0.18, 0.15]} tone="violet" size="xs">
                    {z.toFixed(1)}
                  </Tag>
                </group>
              );
            })}

            {/* stage 2: e^{zᵢ} highlighted (one bar in teal, the rest smaller) */}
            {logits.map((z, i) => {
              const ex = Math.exp(z);
              const h = Math.min(1.6, ex * 0.45);
              const x = -0.3 + i * 0.55;
              return (
                <group key={`e-${i}`}>
                  <Slab
                    position={[x, -0.4 + h / 2, 0]}
                    size={[0.36, h, 0.08]}
                    color={P.teal}
                    fill={0.42}
                  />
                  <Tag position={[x, -0.4 + h + 0.18, 0.15]} tone="teal" size="xs">
                    {ex.toFixed(2)}
                  </Tag>
                </group>
              );
            })}

            {/* stage 3: probabilities (divide by sum) */}
            {logits.map((z, i) => {
              const p = probs[i];
              const x = 2.0 + i * 0.55 - (logits.length - 1) * 0.275;
              const h = Math.max(0.05, p * 1.6);
              return (
                <group key={`p-${i}`}>
                  <Slab
                    position={[x, -0.4 + h / 2, 0]}
                    size={[0.36, h, 0.08]}
                    color={P.amber}
                    fill={0.45}
                  />
                  <Tag position={[x, -0.4 + h + 0.18, 0.15]} tone="amber" size="xs">
                    {Math.round(p * 100)}%
                  </Tag>
                </group>
              );
            })}

            {/* flow arrows between stages (no dashed) */}
            {[-1.65, 0.7].map((x) => (
              <Ribbon
                key={x}
                points={[[x, 0.0, 0], [x + 0.55, 0.0, 0]]}
                color={P.lineStrong}
                radius={0.025}
                opacity={0.85}
              />
            ))}

            {/* the headline formula */}
            <Tag position={[0, -1.55, 0.15]} tone="ink" size="xs">
              σ(z)ᵢ = e^zᵢ / Σⱼ e^zⱼ ; {t.sum_one}
            </Tag>
          </>
        )}

        {mode === "matmul" && (
          <>
            {/* X · n×m  W · m×k  Y · n×k  laid out left-to-right */}
            <Slab position={[-2.5, 0.4, 0]} size={[1.4, 1.4, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[-2.5, 1.3, 0.15]} tone="teal">{t.x_label}</Tag>

            <Slab position={[0, 0.4, 0]} size={[1.4, 1.4, 0.12]} color={P.violet} fill={0.22} />
            <Tag position={[0, 1.3, 0.15]} tone="violet">{t.w_label}</Tag>

            <Slab position={[2.5, 0.4, 0]} size={[1.4, 1.4, 0.12]} color={P.amber} fill={0.22} />
            <Tag position={[2.5, 1.3, 0.15]} tone="amber">{t.y_label}</Tag>

            {/* lattice cells inside each slab to give it texture */}
            <Lattice
              cells={Array.from({ length: 9 }, (_, i) => ({
                position: [-2.5 + ((i % 3) - 1) * 0.42, 0.4 + (1 - Math.floor(i / 3)) * 0.42 - 0.42, 0.08],
                color: P.teal,
              }))}
              size={0.18}
              opacity={0.9}
              matte
            />
            <Lattice
              cells={Array.from({ length: 9 }, (_, i) => ({
                position: [0 + ((i % 3) - 1) * 0.42, 0.4 + (1 - Math.floor(i / 3)) * 0.42 - 0.42, 0.08],
                color: P.violet,
              }))}
              size={0.18}
              opacity={0.9}
              matte
            />
            <Lattice
              cells={Array.from({ length: 9 }, (_, i) => ({
                position: [2.5 + ((i % nCols) - 1) * 0.42, 0.4 + (1 - Math.floor(i / nCols)) * 0.42 - 0.42, 0.08],
                color: P.amber,
              }))}
              size={0.18}
              opacity={0.9}
              matte
            />

            {/* × between X and W */}
            <Tag position={[-1.25, 0.4, 0.15]} tone="ink" size="sm">{t.mul}</Tag>
            {/* = between W and Y */}
            <Tag position={[1.25, 0.4, 0.15]} tone="ink" size="sm">=</Tag>

            {/* the sharing dimension marker between X and W */}
            <Wire points={[[-1.75, -0.55, 0], [-0.75, -0.55, 0]]} color={P.lineStrong} opacity={0.7} />
            <Tag position={[-1.25, -0.85, 0.15]} tone="muted" size="xs">m</Tag>
            <Wire points={[[0.75, -0.55, 0], [1.75, -0.55, 0]]} color={P.lineStrong} opacity={0.7} />
            <Tag position={[1.25, -0.85, 0.15]} tone="muted" size="xs">m</Tag>

            {/* the headline formula */}
            <Tag position={[0, -1.55, 0.15]} tone="ink" size="xs">
              Y = X · W ; {t.ops_count}
            </Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

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

/* Training: fwd+bwd through the stack, loss curve + Chinchilla, AdamW step. */
type Mode = "forward_backward" | "loss_curve" | "optimizer";

const COPY = {
  en: {
    three_formulas_one_step: "three formulas, one step",
    fwd_bwd_loss_adamw: "fwd+bwd · loss · adamW",
    forward_backward: "fwd+bwd",
    loss_curve: "loss curve",
    optimizer: "optimizer",
    input: "x",
    hidden: "h_l",
    output_yhat: "ŷ",
    forward: "forward",
    backward: "backward",
    grad_label: "∇_θ L",
    loss: "loss",
    loss_label: "loss · L(θ)",
    target_y: "target y",
    cross_entropy: "CE",
    steep_drop: "steep drop",
    plateau: "plateau",
    spikes: "spikes",
    chinchilla: "L ≈ 20·N",
    tokens: "tokens D",
    adam_m: "m_t",
    adam_v: "v_t",
    beta1: "β₁=0.9",
    beta2: "β₂=0.95",
    lr: "η",
    adamw: "adamW",
    chain_rule: "∂L/∂θ = (∂L/∂ŷ) · (∂ŷ/∂h_l) · … · (∂h_1/∂x)",
    m_update: "m_t = β₁·m_{t-1} + (1-β₁)·g_t",
    v_update: "v_t = β₂·v_{t-1} + (1-β₂)·g_t²",
    theta_update: "θ_t = θ_{t-1} − η · m̂_t / (√v̂_t + ε) − λ·θ_{t-1}",
  },
  es: {
    three_formulas_one_step: "tres fórmulas, un paso",
    fwd_bwd_loss_adamw: "fwd+bwd · pérdida · adamW",
    forward_backward: "fwd+bwd",
    loss_curve: "curva de pérdida",
    optimizer: "optimizador",
    input: "x",
    hidden: "h_l",
    output_yhat: "ŷ",
    forward: "forward",
    backward: "backward",
    grad_label: "∇_θ L",
    loss: "pérdida",
    loss_label: "pérdida · L(θ)",
    target_y: "y real",
    cross_entropy: "CE",
    steep_drop: "caída fuerte",
    plateau: "meseta",
    spikes: "picos",
    chinchilla: "L ≈ 20·N",
    tokens: "tokens D",
    adam_m: "m_t",
    adam_v: "v_t",
    beta1: "β₁=0.9",
    beta2: "β₂=0.95",
    lr: "η",
    adamw: "adamW",
    chain_rule: "∂L/∂θ = (∂L/∂ŷ) · (∂ŷ/∂h_l) · … · (∂h_1/∂x)",
    m_update: "m_t = β₁·m_{t-1} + (1-β₁)·g_t",
    v_update: "v_t = β₂·v_{t-1} + (1-β₂)·g_t²",
    theta_update: "θ_t = θ_{t-1} − η · m̂_t / (√v̂_t + ε) − λ·θ_{t-1}",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("forward_backward");

  /* ---------------- fwd+bwd ---------------- */
  const layerY: number[] = [1.6, 0.85, 0.1, -0.65, -1.4];

  /* ---------------- loss curve ---------------- */
  const loss: [number, number, number][] = Array.from({ length: 22 }, (_, i) => {
    const x = -4.2 + i * 0.4;
    const y = 1.2 - Math.log(i + 1) * 0.55 + (i > 14 ? Math.sin(i * 0.9) * 0.15 : 0);
    return [x, y, 0];
  });

  /* ---------------- adamW ---------------- */
  const valley: [number, number, number][] = Array.from({ length: 60 }, (_, i) => {
    const x = -2.6 + i * 0.09;
    const y = -1.2 + Math.pow(x / 2.2, 2) * 1.4;
    return [x, y, 0];
  });
  const adamSteps: [number, number][] = [
    [-2.0, 0.3],
    [-1.4, -0.4],
    [-0.9, -0.85],
    [-0.45, -1.1],
    [-0.15, -1.2],
    [0.05, -1.22],
  ];

  return (
    <Figure
      label={t.three_formulas_one_step}
      hint={t.fwd_bwd_loss_adamw}
      legend={[
        { color: P.teal, label: t.forward },
        { color: P.rose, label: t.backward },
        { color: P.violet, label: t.adamw },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "forward_backward", label: t.forward_backward, tone: P.teal },
            { value: "loss_curve", label: t.loss_curve, tone: P.rose },
            { value: "optimizer", label: t.optimizer, tone: P.violet },
          ]}
          ariaLabel={t.three_formulas_one_step}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "forward_backward" && (
          <>
            {/* layer stack */}
            {layerY.map((y, i) => (
              <Slab
                key={i}
                position={[0, y, 0]}
                size={[3.8, 0.42, 0.14]}
                color={i % 2 === 0 ? P.teal : P.violet}
                fill={0.16}
              />
            ))}
            {/* forward: input -> logits */}
            <Tag position={[-2.6, 1.78, 0.15]} tone="muted" size="xs">{t.input}</Tag>
            <Node3D position={[-2.4, 1.6, 0]} color={P.teal} radius={0.12} pulse={0.4} />
            <Flow
              points={[
                [-2.2, 1.6, 0],
                [2.4, -1.4, 0],
              ]}
              color={P.teal}
              count={6}
              speed={0.45}
            />
            <Node3D position={[2.4, -1.4, 0]} color={P.teal} radius={0.12} pulse={0.6} />
            <Tag position={[2.6, -1.6, 0.15]} tone="teal" size="xs">{t.output_yhat}</Tag>
            {/* backward: gradient flow */}
            <Flow
              points={[
                [2.0, -1.4, 0],
                [-2.0, 1.6, 0],
              ]}
              color={P.rose}
              count={5}
              speed={0.4}
              size={0.045}
            />
            <Tag position={[2.2, 1.78, 0.15]} tone="rose" size="xs">{t.grad_label}</Tag>
            <Tag position={[-2.6, -1.55, 0.15]} tone="rose" size="xs">{t.target_y}</Tag>
            {/* formula chip */}
            <Slab position={[0, -2.15, 0]} size={[5.6, 0.55, 0.1]} color={P.teal} fill={0.18} />
            <Tag position={[0, -2.15, 0.15]} tone="teal" size="xs">
              {t.chain_rule}
            </Tag>
            <Tag position={[-3.4, 0.85, 0.15]} tone="muted" size="xs">{t.loss}</Tag>
          </>
        )}

        {mode === "loss_curve" && (
          <>
            {/* axes */}
            <Wire
              points={[
                [-4.2, -1.4, 0],
                [4.2, -1.4, 0],
              ]}
              color={P.lineStrong}
              opacity={0.55}
              width={1.4}
            />
            <Wire
              points={[
                [-4.2, 1.6, 0],
                [-4.2, -1.4, 0],
              ]}
              color={P.lineStrong}
              opacity={0.55}
              width={1.4}
            />
            <Tag position={[-4.55, 1.6, 0.15]} tone="muted" size="xs">{t.loss_label}</Tag>
            <Tag position={[4.4, -1.55, 0.15]} tone="muted" size="xs">{t.tokens} →</Tag>
            {/* loss curve */}
            <Ribbon points={loss} color={P.rose} radius={0.035} opacity={0.95} />
            {/* phases */}
            <Slab position={[-3.4, -0.4, 0]} size={[1.5, 0.6, 0.08]} color={P.rose} fill={0.16} />
            <Tag position={[-3.4, -0.95, 0.15]} tone="rose" size="xs">{t.steep_drop}</Tag>
            <Slab position={[0.0, -0.95, 0]} size={[3.0, 0.5, 0.08]} color={P.teal} fill={0.12} />
            <Tag position={[0.0, -1.5, 0.15]} tone="teal" size="xs">{t.plateau}</Tag>
            <Node3D position={[3.4, -0.7, 0]} color={P.rose} radius={0.1} pulse={0.7} />
            <Tag position={[3.4, -0.45, 0.15]} tone="rose" size="xs">{t.spikes}</Tag>
            {/* chinchilla */}
            <Slab position={[0, 1.45, 0]} size={[5.0, 0.5, 0.1]} color={P.violet} fill={0.18} />
            <Tag position={[0, 1.45, 0.15]} tone="violet" size="xs">{t.chinchilla}</Tag>
            <Tag position={[2.85, 1.45, 0.15]} tone="muted" size="xs">{t.cross_entropy}</Tag>
          </>
        )}

        {mode === "optimizer" && (
          <>
            {/* valley */}
            <Ribbon points={valley} color={P.lineStrong} radius={0.02} opacity={0.85} />
            {/* m_t and v_t as two parallel tracks above the valley */}
            {[0.6, 0.3].map((baseY, i) => (
              <group key={i}>
                <Wire
                  points={adamSteps.map(([x, y], j) => [x, baseY + (i === 0 ? -j * 0.06 : j * 0.04), 0] as [number, number, number])}
                  color={i === 0 ? P.teal : P.amber}
                  opacity={0.6}
                  width={1.4}
                />
                <Tag position={[adamSteps[adamSteps.length - 1][0] + 0.25, baseY, 0.15]} tone={i === 0 ? "teal" : "amber"} size="xs">
                  {i === 0 ? t.adam_m : t.adam_v}
                </Tag>
              </group>
            ))}
            {/* adam steps descending */}
            {adamSteps.map(([x, y], i) => (
              <group key={i}>
                <Node3D position={[x, y, 0]} color={P.violet} radius={0.12} pulse={i * 0.3} />
                {i > 0 && (
                  <Wire
                    points={[
                      [adamSteps[i - 1][0], adamSteps[i - 1][1], 0],
                      [x, y, 0],
                    ]}
                    color={P.violet}
                    opacity={0.7}
                    width={1.6}
                  />
                )}
              </group>
            ))}
            <Halo position={[0.05, -1.22, 0]} radius={0.42} color={P.violet} opacity={0.5} spin={0.18} />
            {/* formula chips */}
            <Slab position={[-1.6, 1.6, 0]} size={[4.4, 0.42, 0.1]} color={P.teal} fill={0.16} />
            <Tag position={[-1.6, 1.6, 0.15]} tone="teal" size="xs">
              {t.m_update}
            </Tag>
            <Slab position={[-1.6, 1.1, 0]} size={[4.4, 0.42, 0.1]} color={P.amber} fill={0.16} />
            <Tag position={[-1.6, 1.1, 0.15]} tone="amber" size="xs">
              {t.v_update}
            </Tag>
            <Slab position={[0, -2.05, 0]} size={[6.2, 0.55, 0.1]} color={P.violet} fill={0.22} />
            <Tag position={[0, -2.05, 0.15]} tone="violet" size="xs">
              {t.theta_update}
            </Tag>
            <Tag position={[2.7, 1.6, 0.15]} tone="muted" size="xs">{t.beta1}</Tag>
            <Tag position={[2.7, 1.1, 0.15]} tone="muted" size="xs">{t.beta2}</Tag>
            <Tag position={[-3.0, -2.05, 0.15]} tone="muted" size="xs">{t.lr}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

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
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Attention: Q/K/V decomposition, scaled dot-product, causal mask.
   Formula-focused: the diagrams literally carry the equations as Tag text. */
type Mode = "qkv" | "scaled_dot_product" | "causal_mask";

const COPY = {
  en: {
    the_attention_formula: "the attention formula, piece by piece",
    qkv_sd_causal: "Q · K · V · softmax · √d · causal",
    qkv: "Q·K·V",
    sd: "scaled · softmax",
    causal: "causal mask",
    x_label: "x",
    wq: "W_Q",
    wk: "W_K",
    wv: "W_V",
    q_label: "Q = x·W_Q",
    k_label: "K = x·W_K",
    v_label: "V = x·W_V",
    qkt_formula: "Q · Kᵀ",
    qkt_value: "Q·Kᵀ = z",
    scale_formula: "z / √d",
    scale_note: "÷ √d : escala",
    softmax_formula: "softmax(z/√d)",
    softmax_note: "softmax → αᵢ",
    prob_rows: "α sum = 1",
    mask_label: "M",
    mask_value: "+M (j>i → −∞)",
    mask_note: "future = −∞",
    causal_note: "softmax(+M) = 0",
    final: "α · V",
  },
  es: {
    the_attention_formula: "la fórmula de atención, pieza a pieza",
    qkv_sd_causal: "Q · K · V · softmax · √d · causal",
    qkv: "Q·K·V",
    sd: "escalado · softmax",
    causal: "máscara causal",
    x_label: "x",
    wq: "W_Q",
    wk: "W_K",
    wv: "W_V",
    q_label: "Q = x·W_Q",
    k_label: "K = x·W_K",
    v_label: "V = x·W_V",
    qkt_formula: "Q · Kᵀ",
    qkt_value: "Q·Kᵀ = z",
    scale_formula: "z / √d",
    scale_note: "÷ √d : escala",
    softmax_formula: "softmax(z/√d)",
    softmax_note: "softmax → αᵢ",
    prob_rows: "Σ αᵢ = 1",
    mask_label: "M",
    mask_value: "+M (j>i → −∞)",
    mask_note: "futuro = −∞",
    causal_note: "softmax(+M) = 0",
    final: "α · V",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("qkv");

  // token strip used in the QKV and mask scenes
  const tokens = ["El", "gato", "come", "pescado"];

  return (
    <Figure
      label={t.the_attention_formula}
      hint={t.qkv_sd_causal}
      legend={[
        { color: P.teal, label: t.qkv },
        { color: P.violet, label: t.sd },
        { color: P.rose, label: t.causal },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "qkv", label: t.qkv, tone: P.teal },
            { value: "scaled_dot_product", label: t.sd, tone: P.violet },
            { value: "causal_mask", label: t.causal, tone: P.rose },
          ]}
          ariaLabel={t.the_attention_formula}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "qkv" && (
          <>
            {/* token strip across the top, the same x feeds three linear maps */}
            <Slab position={[0, 1.55, 0]} size={[4.2, 0.32, 0.1]} color={P.lineStrong} fill={0.2} />
            <Tag position={[-2.6, 1.78, 0.15]} tone="muted" size="xs">{t.x_label}</Tag>
            {tokens.map((tk, i) => (
              <group key={tk}>
                <Node3D
                  position={[-2.2 + i * 0.95, 1.55, 0.15]}
                  color={P.muted}
                  radius={0.11}
                  matte
                />
                <Tag position={[-2.2 + i * 0.95, 1.2, 0.2]} tone="muted" size="xs">{tk}</Tag>
              </group>
            ))}

            {/* three parallel linear projections, each labelled with the formula */}
            {[
              { x: -1.95, color: P.teal, W: t.wq, lbl: t.q_label },
              { x: 0, color: P.violet, W: t.wk, lbl: t.k_label },
              { x: 1.95, color: P.amber, W: t.wv, lbl: t.v_label },
            ].map((branch) => (
              <group key={branch.W}>
                {/* W matrix slab */}
                <Slab
                  position={[branch.x, 0.45, 0]}
                  size={[1.1, 1.0, 0.1]}
                  color={branch.color}
                  fill={0.22}
                />
                <Tag position={[branch.x, 1.1, 0.15]} tone={branch.color === P.amber ? "amber" : branch.color === P.violet ? "violet" : "teal"} size="xs">{branch.W}</Tag>
                {/* input flow from x */}
                <Ribbon
                  points={[[-2.4, 1.55, 0], [branch.x, 1.0, 0]]}
                  color={P.lineStrong}
                  radius={0.025}
                  opacity={0.7}
                />
                {/* projected output node */}
                <Node3D
                  position={[branch.x, -0.55, 0.15]}
                  color={branch.color}
                  radius={0.18}
                  pulse={0.3}
                />
                {/* flow from W to output */}
                <Ribbon
                  points={[[branch.x, 0.0, 0], [branch.x, -0.4, 0]]}
                  color={branch.color}
                  radius={0.04}
                  opacity={0.9}
                />
                <Tag
                  position={[branch.x, -0.95, 0.15]}
                  tone={branch.color === P.amber ? "amber" : branch.color === P.violet ? "violet" : "teal"}
                  size="xs"
                >
                  {branch.lbl}
                </Tag>
              </group>
            ))}

            {/* the headline formula */}
            <Tag position={[0, -1.5, 0.15]} tone="ink" size="sm">
              Attention(Q,K,V) = softmax(QKᵀ/√d) V
            </Tag>
          </>
        )}

        {mode === "scaled_dot_product" && (
          <>
            {/* four stages laid out left-to-right: QK^T → scale → softmax → × V */}
            {[
              { x: -2.6, w: 1.1, color: P.teal, head: t.qkt_formula, sub: t.qkt_value, tone: "teal" as const },
              { x: -0.85, w: 1.1, color: P.violet, head: t.scale_formula, sub: t.scale_note, tone: "violet" as const },
              { x: 0.9, w: 1.1, color: P.violet, head: t.softmax_formula, sub: t.softmax_note, tone: "violet" as const },
              { x: 2.65, w: 1.1, color: P.amber, head: t.final, sub: "mezcla", tone: "amber" as const },
            ].map((stage) => (
              <group key={stage.head}>
                <Slab
                  position={[stage.x, 0.4, 0]}
                  size={[stage.w, 1.3, 0.12]}
                  color={stage.color}
                  fill={0.22}
                />
                <Tag position={[stage.x, 1.25, 0.15]} tone={stage.tone}>{stage.head}</Tag>
                <Tag position={[stage.x, -0.55, 0.15]} tone="muted" size="xs">{stage.sub}</Tag>
              </group>
            ))}
            {/* arrows between stages (no dashed) */}
            {[-1.95, -0.2, 1.55].map((x) => (
              <Ribbon
                key={x}
                points={[[x, 0.4, 0], [x + 0.5, 0.4, 0]]}
                color={P.lineStrong}
                radius={0.025}
                opacity={0.85}
              />
            ))}
            {/* small probability row at the bottom, exactly the softmax output */}
            {Array.from({ length: 6 }, (_, i) => {
              const p = [0.34, 0.06, 0.48, 0.10, 0.015, 0.005][i];
              return (
                <Slab
                  key={i}
                  position={[0.9 - 0.7 + i * 0.28, -1.2 + p * 0.6, 0]}
                  size={[0.22, p * 1.2, 0.08]}
                  color={P.violet}
                  fill={0.4}
                />
              );
            })}
            <Tag position={[0.9, -1.55, 0.15]} tone="violet" size="xs">{t.prob_rows}</Tag>
            {/* the headline formula */}
            <Tag position={[0, 1.78, 0.15]} tone="ink" size="xs">
              softmax(QKᵀ/√d) → α ;  salida = α·V
            </Tag>
          </>
        )}

        {mode === "causal_mask" && (
          <>
            {/* 6x6 attention grid; future cells are masked out by the rose fence */}
            <Lattice
              cells={Array.from({ length: 36 }, (_, i) => {
                const r = Math.floor(i / 6);
                const c = i % 6;
                const allowed = c <= r;
                const w = Math.max(0, 1 - Math.abs(r - c) * 0.3) * (allowed ? 1 : 0.05);
                const color = !allowed
                  ? P.rose
                  : w > 0.6 ? P.teal : w > 0.3 ? P.violet : P.muted;
                return {
                  position: [-2.1 + c * 0.5, 1.2 - r * 0.5, 0] as [number, number, number],
                  color,
                  scale: 0.28 + w * 0.3,
                };
              })}
              size={0.4}
              opacity={0.85}
              matte
            />
            {/* the rose fence along the diagonal: future side gets −∞ */}
            <Ribbon
              points={Array.from({ length: 7 }, (_, i) => [
                -2.2 + i * 0.5, 1.3 - i * 0.5 + 0.2, 0,
              ] as [number, number, number])}
              color={P.rose}
              radius={0.04}
              opacity={0.95}
            />
            <Tag position={[-2.5, 1.78, 0.15]} tone="rose">{t.mask_label}</Tag>
            <Tag position={[2.5, -1.1, 0.15]} tone="rose" size="xs">{t.mask_value}</Tag>
            <Tag position={[-2.5, -0.85, 0.15]} tone="rose" size="xs">{t.mask_note}</Tag>
            {/* the masked future cells: a halo emphasizing "they go to zero" */}
            <Halo position={[2.0, -1.05, 0]} radius={0.35} color={P.rose} opacity={0.5} spin={0.2} />
            <Tag position={[2.0, -1.55, 0.15]} tone="rose" size="xs">{t.causal_note}</Tag>
            <Tag position={[0, 1.78, 0.15]} tone="ink" size="xs">
              softmax(z + M) ;  M_ij = −∞ si j {">"} i
            </Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

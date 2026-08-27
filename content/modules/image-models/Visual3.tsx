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

/* Image models: three formula/algorithm scenes — the denoising step
   trajectory, classifier-free guidance as a linear combination, and the
   latent space compression ratio between VAE and RGB. */
type Mode = "diffusion_steps" | "classifier_free_guidance" | "latent_space";

const COPY = {
  en: {
    three_formulas_in_a_diagram: "three formulas in a diagram",
    steps_cfg_and_the_vae_compression: "steps, cfg, and the vae compression",
    diffusion_steps: "diffusion steps",
    classifier_free_guidance: "cfg",
    latent_space: "latent space",
    step: "step",
    trajectory: "x_t -> x_0",
    formula_step: "x_{t-1} = sched(x_t, eps_theta)",
    step_50: "t = 50",
    step_25: "t = 25",
    step_0: "t = 0",
    high_noise: "high noise",
    mid_noise: "mid noise",
    clean: "clean",
    cfg_arrow: "cfg",
    formula_cfg: "eps = u + s · (c - u)",
    uncond: "unconditional u",
    cond: "conditional c",
    scale: "scale s",
    distance: "distance",
    rgb_slab: "rgb 512 x 512",
    latent_slab: "latent 4 x 64 x 64",
    formula_vae: "compression ~ 48x",
    formula_latent: "z = encode(x)",
    rgb_size: "786 432 dims",
    latent_size: "16 384 dims",
  },
  es: {
    three_formulas_in_a_diagram: "tres fórmulas en un diagrama",
    steps_cfg_and_the_vae_compression: "pasos, cfg y la compresión del vae",
    diffusion_steps: "pasos de difusión",
    classifier_free_guidance: "cfg",
    latent_space: "espacio latente",
    step: "paso",
    trajectory: "x_t -> x_0",
    formula_step: "x_{t-1} = sched(x_t, eps_theta)",
    step_50: "t = 50",
    step_25: "t = 25",
    step_0: "t = 0",
    high_noise: "ruido alto",
    mid_noise: "ruido medio",
    clean: "limpio",
    cfg_arrow: "cfg",
    formula_cfg: "epsilon = u + s · (c - u)",
    uncond: "incondicional u",
    cond: "condicional c",
    scale: "escala s",
    distance: "distancia",
    rgb_slab: "rgb 512 x 512",
    latent_slab: "latente 4 x 64 x 64",
    formula_vae: "compresión ~ 48x",
    formula_latent: "z = encode(x)",
    rgb_size: "786 432 dims",
    latent_size: "16 384 dims",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("diffusion_steps");

  return (
    <Figure
      label={t.three_formulas_in_a_diagram}
      hint={t.steps_cfg_and_the_vae_compression}
      legend={[
        { color: P.teal, label: t.cond },
        { color: P.violet, label: t.uncond },
        { color: P.amber, label: t.cfg_arrow },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "diffusion_steps", label: t.diffusion_steps, tone: P.teal },
            { value: "classifier_free_guidance", label: t.classifier_free_guidance, tone: P.amber },
            { value: "latent_space", label: t.latent_space, tone: P.violet },
          ]}
          ariaLabel={t.three_formulas_in_a_diagram}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "diffusion_steps" && (
          <>
            {/* three latents along the trajectory: noisy -> mid -> clean */}
            {[
              { x: -2.4, label: t.step_50, noise: 1.0, color: P.muted, label_kind: t.high_noise },
              { x: 0.0, label: t.step_25, noise: 0.5, color: P.violet, label_kind: t.mid_noise },
              { x: 2.4, label: t.step_0, noise: 0.0, color: P.teal, label_kind: t.clean },
            ].map((p, idx) => (
              <group key={idx} position={[0, 0, 0]}>
                <Slab
                  position={[p.x, 0.4, 0]}
                  size={[1.6, 1.4, 0.14]}
                  color={p.color}
                  fill={0.18}
                />
                <Tag position={[p.x, 1.3, 0.2]} tone={p.color === P.teal ? "teal" : p.color === P.violet ? "violet" : "muted"} size="xs">
                  {p.label}
                </Tag>
                <Tag position={[p.x, -0.55, 0.2]} tone={p.color === P.teal ? "teal" : p.color === P.violet ? "violet" : "muted"} size="xs">
                  {p.label_kind}
                </Tag>
                {/* noise lattice inside each slab, jitter shrinks with progress */}
                <Lattice
                  cells={Array.from({ length: 25 }, (_, i) => {
                    const r = Math.floor(i / 5), c = i % 5;
                    const j = p.noise * 0.18;
                    return {
                      position: [
                        p.x - 0.5 + c * 0.22 + (Math.random() - 0.5) * j,
                        0.4 - 0.35 + r * 0.18 + (Math.random() - 0.5) * j,
                        0.1,
                      ] as [number, number, number],
                      color: p.color,
                    };
                  })}
                  size={0.07}
                  opacity={0.85}
                  matte
                />
              </group>
            ))}

            {/* the scheduler arrows step by step */}
            <Flow points={[[-1.5, 0.4, 0], [-0.8, 0.4, 0]]} color={P.violet} count={3} size={0.045} />
            <Flow points={[[0.8, 0.4, 0], [1.5, 0.4, 0]]} color={P.teal} count={3} size={0.045} />

            {/* formula plate at the bottom */}
            <Slab
              position={[0, -1.25, 0]}
              size={[4.0, 0.45, 0.12]}
              color={P.teal}
              fill={0.14}
            />
            <Tag position={[0, -1.25, 0.2]} tone="teal" size="xs">{t.formula_step}</Tag>
            <Tag position={[0, 1.7, 0.2]} tone="ink" size="xs">{t.trajectory}</Tag>
          </>
        )}

        {mode === "classifier_free_guidance" && (
          <>
            {/* two arrows: uncond (violet) and cond (teal), converging into eps */}
            {/* unconditional branch (longer, lower) */}
            <Slab
              position={[-2.0, -0.4, 0]}
              size={[1.7, 1.4, 0.14]}
              color={P.violet}
              fill={0.2}
            />
            <Tag position={[-2.0, 0.45, 0.2]} tone="violet">{t.uncond}</Tag>

            {/* conditional branch (offset upward) */}
            <Slab
              position={[-2.0, 0.7, 0]}
              size={[1.7, 1.4, 0.14]}
              color={P.teal}
              fill={0.2}
            />
            <Tag position={[-2.0, 1.55, 0.2]} tone="teal">{t.cond}</Tag>

            {/* vector from uncond to cond = direction (c - u) */}
            <Wire
              points={[[-1.0, -0.4, 0], [-1.0, 0.7, 0]]}
              color={P.amber}
              width={2.4}
              opacity={0.85}
            />
            <Tag position={[-1.0, 1.05, 0.2]} tone="amber" size="xs">{t.distance}</Tag>

            {/* arrow from uncond going to result, weighted by scale s */}
            <Flow
              points={[[-1.05, -0.4, 0], [0.9, -0.4, 0]]}
              color={P.violet}
              count={3}
              size={0.05}
              width={2.2}
            />
            <Node3D position={[0.0, -0.4, 0.05]} color={P.amber} radius={0.1} pulse={0.4} />
            <Tag position={[0.5, -0.05, 0.2]} tone="amber" size="xs">{t.scale}</Tag>

            {/* arrow for (c - u) · s added on top */}
            <Flow
              points={[[-1.05, 0.15, 0], [0.9, 0.15, 0]]}
              color={P.amber}
              count={3}
              size={0.05}
              width={2.0}
            />

            {/* the final eps output slab */}
            <Slab
              position={[2.05, -0.05, 0]}
              size={[1.7, 1.7, 0.14]}
              color={P.amber}
              fill={0.18}
            />
            <Tag position={[2.05, 1.0, 0.2]} tone="amber">{t.cfg_arrow}</Tag>
            <Tag position={[2.05, -1.05, 0.2]} tone="ink" size="xs">{t.formula_cfg}</Tag>

            {/* a halo around the formula output */}
            <Halo position={[2.05, -0.05, 0.05]} radius={1.05} color={P.amber} opacity={0.22} spin={0.1} />
          </>
        )}

        {mode === "latent_space" && (
          <>
            {/* big RGB slab */}
            <Slab
              position={[-1.8, 0.4, 0]}
              size={[2.6, 2.1, 0.14]}
              color={P.teal}
              fill={0.16}
            />
            <Tag position={[-1.8, 1.65, 0.2]} tone="teal">{t.rgb_slab}</Tag>
            {/* dense pixel lattice: 12 x 12 x 3 channels */}
            <Lattice
              cells={Array.from({ length: 144 }, (_, i) => ({
                position: [
                  -2.5 + (i % 12) * 0.16,
                  1.25 - Math.floor(i / 12) * 0.14,
                  0.08,
                ] as [number, number, number],
                color: i % 3 === 0 ? P.rose : i % 3 === 1 ? P.amber : P.teal,
              }))}
              size={0.06}
              opacity={0.8}
              matte
            />
            <Tag position={[-1.8, -0.95, 0.2]} tone="muted" size="xs">{t.rgb_size}</Tag>

            {/* encode arrow with the formula */}
            <Flow
              points={[[-0.35, 0.4, 0], [0.4, 0.4, 0]]}
              color={P.violet}
              count={3}
              size={0.05}
              width={2.2}
            />
            <Tag position={[0.05, 0.78, 0.2]} tone="violet" size="xs">{t.formula_latent}</Tag>

            {/* small latent slab */}
            <Slab
              position={[1.8, 0.4, 0]}
              size={[1.0, 1.0, 0.14]}
              color={P.violet}
              fill={0.28}
            />
            <Tag position={[1.8, 1.05, 0.2]} tone="violet">{t.latent_slab}</Tag>
            {/* sparse 4-channel latent lattice */}
            <Lattice
              cells={Array.from({ length: 16 }, (_, i) => ({
                position: [
                  1.4 + (i % 4) * 0.2,
                  0.7 - Math.floor(i / 4) * 0.18,
                  0.08,
                ] as [number, number, number],
                color: P.violet,
              }))}
              size={0.07}
              opacity={0.9}
              matte
            />
            <Tag position={[1.8, -0.95, 0.2]} tone="muted" size="xs">{t.latent_size}</Tag>

            {/* compression ratio badge */}
            <Slab
              position={[0.0, -1.5, 0]}
              size={[2.6, 0.45, 0.12]}
              color={P.amber}
              fill={0.18}
            />
            <Tag position={[0.0, -1.5, 0.2]} tone="amber" size="xs">{t.formula_vae}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

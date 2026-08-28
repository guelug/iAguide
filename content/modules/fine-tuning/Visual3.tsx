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

/* Fine-tuning: SFT vs DPO loss, KL penalty, eval split. */
type Mode = "sft_dpo" | "kl_penalty" | "eval_split";

const COPY = {
  en: {
    three_formulas_one_decision: "three formulas, one decision",
    sft_dpo_kl_eval: "sft · dpo · kl · eval",
    sft_dpo: "sft vs dpo",
    kl_penalty: "kl penalty",
    eval_split: "eval split",
    sft: "SFT",
    dpo: "DPO",
    demo: "demo (x, y)",
    chosen: "chosen y_w",
    rejected: "rejected y_l",
    policy: "π_θ",
    ref: "π_ref",
    ce_loss: "L_SFT = -log π_θ(y | x)",
    dpo_loss: "L_DPO = -log σ ( β·log(π_θ(y_w|x)/π_ref(y_w|x)) - β·log(π_θ(y_l|x)/π_ref(y_l|x)) )",
    push_chosen: "push up chosen",
    push_rejected: "push down rejected",
    reward_gap: "Δr = log(π_θ/π_ref) · β",
    kl_target: "KL(π_θ ‖ π_ref)",
    kl_band: "kl band",
    beta: "β",
    drift_warn: "drift",
    train: "train",
    eval_held_out: "held-out",
    seal: "do not touch",
    check_seal: "check seal",
    eval_after: "eval after",
  },
  es: {
    three_formulas_one_decision: "tres fórmulas, una decisión",
    sft_dpo_kl_eval: "sft · dpo · kl · eval",
    sft_dpo: "sft vs dpo",
    kl_penalty: "kl penalty",
    eval_split: "eval split",
    sft: "SFT",
    dpo: "DPO",
    demo: "demo (x, y)",
    chosen: "elegido y_w",
    rejected: "rechazado y_l",
    policy: "π_θ",
    ref: "π_ref",
    ce_loss: "L_SFT = -log π_θ(y | x)",
    dpo_loss: "L_DPO = -log σ ( β·log(π_θ(y_w|x)/π_ref(y_w|x)) - β·log(π_θ(y_l|x)/π_ref(y_l|x)) )",
    push_chosen: "sube elegido",
    push_rejected: "baja rechazado",
    reward_gap: "Δr = log(π_θ/π_ref) · β",
    kl_target: "KL(π_θ � π_ref)",
    kl_band: "banda kl",
    beta: "β",
    drift_warn: "drift",
    train: "train",
    eval_held_out: "held-out",
    seal: "no tocar",
    check_seal: "verifica el sello",
    eval_after: "eval al final",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("sft_dpo");

  /* ---------------- sft vs dpo ---------------- */
  const policyCurve: [number, number, number][] = Array.from({ length: 32 }, (_, i) => {
    const x = -3.6 + i * 0.22;
    const y = -0.4 + Math.sin(i * 0.45) * 0.55 + (i / 32) * 0.3;
    return [x, y, 0];
  });
  const refCurve: [number, number, number][] = Array.from({ length: 32 }, (_, i) => {
    const x = -3.6 + i * 0.22;
    const y = -0.4 + Math.sin(i * 0.45) * 0.55 + 0.0;
    return [x, y, 0];
  });
  const chosenDot: [number, number, number] = [-1.2, 0.7, 0];
  const rejectedDot: [number, number, number] = [1.5, -0.85, 0];

  /* ---------------- kl penalty ---------------- */
  const drift: [number, number, number][] = Array.from({ length: 28 }, (_, i) => {
    const x = -3.6 + i * 0.26;
    const y = 0.0 + Math.sin(i * 0.4) * 0.4 + (i / 28) * 1.0;
    return [x, y, 0];
  });
  const refLine: [number, number, number][] = Array.from({ length: 28 }, (_, i) => [
    -3.6 + i * 0.26,
    0.0,
    0,
  ]);

  /* ---------------- eval split ---------------- */
  const trainCells = Array.from({ length: 18 }, (_, i) => ({
    position: [-2.0 + (i % 6) * 0.45, 0.4 - Math.floor(i / 6) * 0.42, 0] as [number, number, number],
    color: P.teal,
  }));
  const holdCells = Array.from({ length: 6 }, (_, i) => ({
    position: [1.6 + (i % 3) * 0.45, 0.4 - Math.floor(i / 3) * 0.45, 0] as [number, number, number],
    color: P.violet,
  }));

  return (
    <Figure
      label={t.three_formulas_one_decision}
      hint={t.sft_dpo_kl_eval}
      legend={[
        { color: P.teal, label: t.sft },
        { color: P.amber, label: t.dpo },
        { color: P.rose, label: t.kl_target },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "sft_dpo", label: t.sft_dpo, tone: P.teal },
            { value: "kl_penalty", label: t.kl_penalty, tone: P.rose },
            { value: "eval_split", label: t.eval_split, tone: P.violet },
          ]}
          ariaLabel={t.three_formulas_one_decision}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "sft_dpo" && (
          <>
            {/* SFT side: prompt -> demo -> gradient on policy */}
            <Slab position={[-2.6, 1.55, 0]} size={[1.8, 0.55, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[-2.6, 1.78, 0.15]} tone="teal" size="xs">{t.demo}</Tag>
            <Node3D position={[-2.6, 1.05, 0]} color={P.teal} radius={0.14} pulse={0.4} />
            <Tag position={[-2.6, 0.6, 0.15]} tone="muted" size="xs">{t.policy}</Tag>
            <Slab position={[-2.6, -0.95, 0]} size={[3.6, 0.5, 0.1]} color={P.teal} fill={0.18} />
            <Tag position={[-2.6, -0.95, 0.15]} tone="teal" size="xs">{t.ce_loss}</Tag>

            {/* DPO side: chosen vs rejected, ref policy, Δr */}
            <Slab position={[2.0, 1.55, 0]} size={[1.4, 0.5, 0.1]} color={P.amber} fill={0.22} />
            <Tag position={[2.0, 1.78, 0.15]} tone="amber" size="xs">{t.chosen}</Tag>
            <Slab position={[2.0, 0.7, 0]} size={[1.4, 0.5, 0.1]} color={P.rose} fill={0.18} />
            <Tag position={[2.0, 0.32, 0.15]} tone="rose" size="xs">{t.rejected}</Tag>
            {/* The frozen reference, and the policy that has drifted from
                it — the gap between these two curves is the KL term. */}
            <Wire points={refCurve} color={P.lineStrong} opacity={0.6} width={1.4} dashed />
            <Wire points={policyCurve} color={P.teal} opacity={0.9} width={2} />
            <Tag position={[-3.4, -0.95, 0.15]} tone="muted" size="xs">{t.ref}</Tag>
            <Tag position={[-3.4, 0.05, 0.15]} tone="teal" size="xs">{t.policy}</Tag>
            {/* policy shifts up at chosen, down at rejected */}
            <Node3D position={chosenDot} color={P.amber} radius={0.13} pulse={0.5} />
            <Flow
              points={[
                [1.4, -0.6, 0],
                chosenDot,
              ]}
              color={P.teal}
              count={3}
              speed={0.45}
              size={0.045}
            />
            <Node3D position={rejectedDot} color={P.rose} radius={0.13} pulse={0.6} />
            <Flow
              points={[
                [1.4, -0.6, 0],
                rejectedDot,
              ]}
              color={P.rose}
              count={3}
              speed={0.4}
              size={0.045}
            />
            <Tag position={[3.4, 0.7, 0.15]} tone="teal" size="xs">{t.push_chosen}</Tag>
            <Tag position={[3.4, -0.85, 0.15]} tone="rose" size="xs">{t.push_rejected}</Tag>
            {/* DPO loss chip */}
            <Slab position={[0, -1.85, 0]} size={[6.8, 0.55, 0.1]} color={P.amber} fill={0.22} />
            <Tag position={[0, -1.85, 0.15]} tone="amber" size="xs">{t.dpo_loss}</Tag>
            <Tag position={[0, -2.4, 0.15]} tone="muted" size="xs">{t.reward_gap}</Tag>
          </>
        )}

        {mode === "kl_penalty" && (
          <>
            {/* ref distribution baseline */}
            <Ribbon points={refLine} color={P.lineStrong} radius={0.025} opacity={0.8} />
            <Tag position={[-3.6, 0.18, 0.15]} tone="muted" size="xs">{t.ref}</Tag>
            {/* policy drifting */}
            <Ribbon points={drift} color={P.rose} radius={0.035} opacity={0.95} />
            {/* kl band: vertical slabs at three points */}
            {[
              [-2.4, 0.45],
              [0.0, 0.85],
              [2.4, 1.2],
            ].map(([x, h], i) => (
              <group key={i}>
                <Slab position={[x, h / 2, 0]} size={[0.18, Math.max(0.2, h), 0.08]} color={P.rose} fill={0.18} />
                <Tag position={[x + 0.2, h, 0.15]} tone="rose" size="xs">KL</Tag>
              </group>
            ))}
            {/* β knob chip */}
            <Slab position={[-2.2, 1.7, 0]} size={[3.4, 0.42, 0.1]} color={P.teal} fill={0.18} />
            <Tag position={[-2.2, 1.7, 0.15]} tone="teal" size="xs">
              β ↑ ⇒ {t.drift_warn} ↓
            </Tag>
            <Tag position={[1.6, 1.7, 0.15]} tone="muted" size="xs">{t.beta}</Tag>
            {/* KL formula chip */}
            <Slab position={[0, -1.85, 0]} size={[6.4, 0.55, 0.1]} color={P.violet} fill={0.2} />
            <Tag position={[0, -1.85, 0.15]} tone="violet" size="xs">
              L = L_task − β · KL(π_θ ‖ π_ref)
            </Tag>
            <Tag position={[0, -2.4, 0.15]} tone="muted" size="xs">{t.kl_band}</Tag>
          </>
        )}

        {mode === "eval_split" && (
          <>
            {/* train lattice */}
            <Lattice cells={trainCells} size={0.22} opacity={0.9} />
            <Tag position={[-0.9, 1.18, 0.15]} tone="teal" size="xs">{t.train}</Tag>
            {/* held-out box */}
            <Slab position={[2.05, 0.0, 0]} size={[2.0, 1.6, 0.14]} color={P.violet} fill={0.1} rim={0.9} />
            <Lattice cells={holdCells} size={0.22} opacity={0.95} />
            <Tag position={[2.05, 1.18, 0.15]} tone="violet" size="xs">{t.eval_held_out}</Tag>
            <Halo position={[2.05, 0.0, 0]} radius={1.18} color={P.violet} opacity={0.4} spin={0.15} />
            {/* seal: do not cross */}
            <Wire
              points={[
                [0.4, -0.8, 0],
                [0.4, 1.55, 0],
              ]}
              color={P.rose}
              opacity={0.85}
              width={2}
            />
            <Tag position={[0.4, -1.2, 0.15]} tone="rose" size="xs">{t.seal}</Tag>
            <Tag position={[0.4, 1.78, 0.15]} tone="rose" size="xs">{t.check_seal}</Tag>
            {/* eval arrow out of held-out */}
            <Flow
              points={[
                [2.05, -0.85, 0],
                [2.05, -1.6, 0],
              ]}
              color={P.violet}
              count={2}
              size={0.05}
              speed={0.4}
            />
            <Tag position={[2.05, -1.9, 0.15]} tone="muted" size="xs">{t.eval_after}</Tag>
            {/* split ratio footer */}
            <Slab position={[0, -2.3, 0]} size={[5.6, 0.5, 0.1]} color={P.teal} fill={0.16} />
            <Tag position={[0, -2.3, 0.15]} tone="teal" size="xs">
              train ≈ 80% · held-out ≈ 20% · same template, no leakage
            </Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

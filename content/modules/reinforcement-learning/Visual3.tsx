"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "preference" | "advantage" | "group";
const COPY = {
  en: { title: "preference training changes the gradient", hint: "pair · advantage · group", preference: "pair", advantage: "advantage", group: "group", chosen: "chosen", rejected: "rejected", reward: "reward", policy: "policy", ref: "reference", rollout: "rollout", mean: "group mean", delta: "relative signal" },
  es: { title: "el entrenamiento de preferencias cambia el gradiente", hint: "par · ventaja · grupo", preference: "par", advantage: "ventaja", group: "grupo", chosen: "elegido", rejected: "rechazado", reward: "recompensa", policy: "política", ref: "referencia", rollout: "rollout", mean: "media del grupo", delta: "señal relativa" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("preference");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.chosen }, { color: P.rose, label: t.rejected }, { color: P.violet, label: t.reward }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "preference", label: t.preference, tone: P.teal }, { value: "advantage", label: t.advantage, tone: P.violet }, { value: "group", label: t.group, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "preference" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.chosen}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.rose} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">{t.rejected}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">log π(chosen) − log π(rejected)</Tag></>}
    {mode === "advantage" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.reward}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">A = R − V</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">ventaja = señal menos baseline</Tag></>}
    {mode === "group" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.rollout}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.mean}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">Aᵢ = rᵢ − media(r)</Tag></>}
  </PointerTilt></Stage></Figure>;
}

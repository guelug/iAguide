"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "update" | "rank" | "trigger";
const COPY = {
  en: { title: "LoRA updates a thin low-rank path", hint: "update · rank · trigger", update: "update", rank: "rank", trigger: "trigger", base: "frozen W", delta: "ΔW = B A", output: "W + αΔW", small: "small delta", word: "trigger word", clip: "CLIP" },
  es: { title: "LoRA actualiza una vía de rango bajo", hint: "actualización · rango · trigger", update: "actualización", rank: "rango", trigger: "trigger", base: "W congelada", delta: "ΔW = B A", output: "W + αΔW", small: "delta pequeño", word: "trigger word", clip: "CLIP" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("update");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.base }, { color: P.violet, label: t.delta }, { color: P.amber, label: t.output }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "update", label: t.update, tone: P.teal }, { value: "rank", label: t.rank, tone: P.violet }, { value: "trigger", label: t.trigger, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "update" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.base}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.output}</Tag><Tag position={[0, -0.75, 0.15]} tone="violet" size="xs">{t.delta} · α controla la fuerza</Tag></>}
    {mode === "rank" && <>{[["A", P.teal, -1.7], ["r", P.violet, 0], ["B", P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.35, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]}>{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">r pequeño ⇒ menos parámetros entrenables</Tag></>}
    {mode === "trigger" && <><Node3D position={[-1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.word}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.clip}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">el trigger activa el delta aprendido</Tag></>}
  </PointerTilt></Stage></Figure>;
}

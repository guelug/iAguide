"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "bits" | "reasoning" | "runtime";
const COPY = {
  en: { title: "serve the 27B with a real memory budget", hint: "bits · reasoning · runtime", bits: "bits", reasoning: "reasoning", runtime: "runtime", one: "1-bit", four: "4-bit", bf16: "BF16", context: "262k context", low: "low", xhigh: "xhigh", thinking: "thinking", instruct: "instruct", gguf: "GGUF / llama.cpp", nvfp: "NVFP4 / vLLM", budget: "budget" },
  es: { title: "sirve el 27B con un presupuesto real", hint: "bits · razonamiento · runtime", bits: "bits", reasoning: "razonamiento", runtime: "runtime", one: "1-bit", four: "4-bit", bf16: "BF16", context: "262k contexto", low: "low", xhigh: "xhigh", thinking: "thinking", instruct: "instruct", gguf: "GGUF / llama.cpp", nvfp: "NVFP4 / vLLM", budget: "presupuesto" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("bits");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.four }, { color: P.violet, label: t.context }, { color: P.amber, label: t.runtime }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "bits", label: t.bits, tone: P.teal }, { value: "reasoning", label: t.reasoning, tone: P.violet }, { value: "runtime", label: t.runtime, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "bits" && <>{[[t.one, P.teal, 0.7], [t.four, P.violet, 1.7], [t.bf16, P.rose, 3.0]].map(([label, color, h], i) => <group key={label as string}><Slab position={[-1.6 + i * 1.6, -0.7 + (h as number) / 2, 0]} size={[1.2, h as number, 0.12]} color={color as string} fill={0.22} /><Tag position={[-1.6 + i * 1.6, 0.78, 0.15]} tone={(["teal", "violet", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">16–19GB 4-bit · 56GB BF16</Tag></>}
    {mode === "reasoning" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">{t.thinking}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.instruct}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.low} ↔ {t.xhigh} · preserve thinking cuesta tokens</Tag></>}
    {mode === "runtime" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.gguf}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.nvfp}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.context} no es memoria gratis</Tag></>}
  </PointerTilt></Stage></Figure>;
}

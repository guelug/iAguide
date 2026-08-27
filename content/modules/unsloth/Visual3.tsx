"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "memory" | "kernels" | "export";
const COPY = {
  en: { title: "Unsloth spends kernels to buy memory", hint: "memory · fused kernels · export", memory: "memory", kernels: "kernels", export: "export", standard: "standard", qlora: "QLoRA", lora: "LoRA", dataset: "dataset", trainer: "SFTTrainer", gguf: "GGUF", safe: "safetensors", fuse: "fused", vram: "VRAM" },
  es: { title: "Unsloth intercambia kernels por memoria", hint: "memoria · kernels fusionados · exportación", memory: "memoria", kernels: "kernels", export: "exporta", standard: "estándar", qlora: "QLoRA", lora: "LoRA", dataset: "dataset", trainer: "SFTTrainer", gguf: "GGUF", safe: "safetensors", fuse: "fusionado", vram: "VRAM" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("memory");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.qlora }, { color: P.violet, label: t.fuse }, { color: P.amber, label: t.gguf }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "memory", label: t.memory, tone: P.teal }, { value: "kernels", label: t.kernels, tone: P.violet }, { value: "export", label: t.export, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "memory" && <>{[[t.standard, P.rose, 2.5], [t.lora, P.violet, 1.5], [t.qlora, P.teal, 0.8]].map(([label, color, h], i) => <group key={label as string}><Slab position={[-1.6 + i * 1.6, -0.7 + (h as number) / 2, 0]} size={[1.15, h as number, 0.12]} color={color as string} fill={0.22} /><Tag position={[-1.6 + i * 1.6, 0.78, 0.15]} tone={(["rose", "violet", "teal"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">{t.qlora} reduce {t.vram}, no cambia la tarea</Tag></>}
    {mode === "kernels" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">matmul</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.fuse}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">menos lecturas → más throughput</Tag></>}
    {mode === "export" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.dataset}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.trainer} → {t.gguf}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.safe} de entrada, {t.gguf} de salida</Tag></>}
  </PointerTilt></Stage></Figure>;
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "bits" | "thinking" | "route";
const COPY = {
  en: { title: "serving is memory plus sampling", hint: "bits · thinking · runtime", bits: "bits", thinking: "thinking", route: "runtime", one: "1-bit", four: "4-bit", eight: "8-bit", bf16: "BF16", context: "262k context", effort: "reasoning effort", low: "low", high: "xhigh", gguf: "GGUF / llama.cpp", nvfp: "NVFP4 / vLLM", mac: "Mac 24GB", gpu: "GPU" },
  es: { title: "servir es memoria más muestreo", hint: "bits · thinking · runtime", bits: "bits", thinking: "thinking", route: "runtime", one: "1-bit", four: "4-bit", eight: "8-bit", bf16: "BF16", context: "262k contexto", effort: "esfuerzo razonamiento", low: "low", high: "xhigh", gguf: "GGUF / llama.cpp", nvfp: "NVFP4 / vLLM", mac: "Mac 24GB", gpu: "GPU" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("bits");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.four }, { color: P.violet, label: t.context }, { color: P.amber, label: t.gpu }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "bits", label: t.bits, tone: P.teal }, { value: "thinking", label: t.thinking, tone: P.violet }, { value: "route", label: t.route, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "bits" && <>{[[t.one, P.teal, 0.65], [t.four, P.violet, 1.65], [t.eight, P.amber, 2.55], [t.bf16, P.rose, 3.55]].map(([label, color, h], i) => <group key={label as string}><Slab position={[-1.9 + i * 1.25, -0.65 + (h as number) / 2, 0]} size={[0.9, h as number, 0.12]} color={color as string} fill={0.24} /><Tag position={[-1.9 + i * 1.25, 0.82, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.95, 0.15]} tone="muted" size="xs">16–19GB 4-bit · 56GB BF16</Tag></>}
        {mode === "thinking" && <><Halo position={[0, 0.2, 0]} radius={1.15} color={P.violet} opacity={0.34} spin={0.12} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[0, 0.78, 0.15]} tone="violet">{t.effort}</Tag><Ribbon points={[[-1.9, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-1.9, 0.65, 0.15]} tone="teal" size="xs">{t.low}</Tag><Ribbon points={[[0.45, 0.2, 0], [1.9, 0.2, 0]]} color={P.rose} radius={0.045} opacity={0.9} /><Tag position={[1.9, 0.65, 0.15]} tone="rose" size="xs">{t.high}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">preserve thinking = más tokens</Tag></>}
        {mode === "route" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.gguf}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.nvfp}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.mac} ≠ {t.gpu}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

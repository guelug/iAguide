"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "runtimes" | "phases" | "formats";
const COPY = {
  en: { title: "local inference is a choice of engine", hint: "runtimes · phases · formats", runtimes: "runtimes", phases: "prefill / decode", formats: "formats", llama: "llama.cpp", ollama: "Ollama", vllm: "vLLM", mlx: "MLX", prefill: "prefill", decode: "decode", gguf: "GGUF", safe: "safetensors", unified: "unified", vram: "VRAM" },
  es: { title: "la inferencia local elige motor", hint: "runtimes · fases · formatos", runtimes: "motores", phases: "prefill / decode", formats: "formatos", llama: "llama.cpp", ollama: "Ollama", vllm: "vLLM", mlx: "MLX", prefill: "prefill", decode: "decode", gguf: "GGUF", safe: "safetensors", unified: "unificada", vram: "VRAM" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("runtimes");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.llama }, { color: P.violet, label: t.ollama }, { color: P.amber, label: t.vllm }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "runtimes", label: t.runtimes, tone: P.teal }, { value: "phases", label: t.phases, tone: P.violet }, { value: "formats", label: t.formats, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "runtimes" && <>{[[t.llama, P.teal, -1.8], [t.ollama, P.violet, 0], [t.vllm, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">un usuario · throughput distinto</Tag></>}
        {mode === "phases" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.prefill}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.decode}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">TTFT ↔ tokens/segundo</Tag></>}
        {mode === "formats" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.gguf}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.lineStrong} radius={0.05} opacity={0.8} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.safe}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.unified} ↔ {t.vram}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

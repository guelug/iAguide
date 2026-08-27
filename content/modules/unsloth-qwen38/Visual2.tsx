"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "model" | "vram" | "export";
const COPY = {
  en: { title: "27B dense: train the adapter, not the world", hint: "model · VRAM · export", model: "model", vram: "VRAM", export: "export", dense: "dense 27B", vision: "vision + video", qlora: "QLoRA", lora: "LoRA", full: "full fine-tune", gguf: "GGUF", safe: "safetensors", dynamic: "Dynamic V3.0" },
  es: { title: "27B denso: ajusta el adapter, no el mundo", hint: "modelo · VRAM · exportación", model: "modelo", vram: "VRAM", export: "exporta", dense: "27B denso", vision: "visión + vídeo", qlora: "QLoRA", lora: "LoRA", full: "ajuste completo", gguf: "GGUF", safe: "safetensors", dynamic: "Dynamic V3.0" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("model");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.dense }, { color: P.violet, label: t.qlora }, { color: P.amber, label: t.export }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "model", label: t.model, tone: P.teal }, { value: "vram", label: t.vram, tone: P.violet }, { value: "export", label: t.export, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "model" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.dense}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.vision}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">262k contexto · Gated DeltaNet</Tag></>}
        {mode === "vram" && <>{[[t.qlora, P.teal, 1.0], [t.lora, P.violet, 1.45], [t.full, P.rose, 2.15]].map(([label, color, h], i) => <group key={label as string}><Slab position={[-1.6 + i * 1.6, -0.65 + (h as number) / 2, 0]} size={[1.15, h as number, 0.12]} color={color as string} fill={0.24} /><Tag position={[-1.6 + i * 1.6, 0.82, 0.15]} tone={(["teal", "violet", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.95, 0.15]} tone="muted" size="xs">24GB · &gt;36GB · 4× más</Tag></>}
        {mode === "export" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">adapter</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.gguf}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">→ {t.safe} · {t.dynamic}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

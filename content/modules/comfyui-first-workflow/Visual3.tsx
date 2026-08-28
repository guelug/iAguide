"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "graph" | "sampler" | "save";
const COPY = {
  en: { title: "ComfyUI is a typed latent graph", hint: "graph · sampler · output", graph: "graph", sampler: "sampler", save: "output", checkpoint: "checkpoint", clip: "CLIP", latent: "latent", ksampler: "KSampler", vae: "VAE", image: "image", seed: "seed", steps: "steps", cfg: "CFG" },
  es: { title: "ComfyUI es un grafo tipado de latentes", hint: "grafo · sampler · salida", graph: "grafo", sampler: "sampler", save: "salida", checkpoint: "checkpoint", clip: "CLIP", latent: "latente", ksampler: "KSampler", vae: "VAE", image: "imagen", seed: "seed", steps: "steps", cfg: "CFG" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("graph");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.checkpoint }, { color: P.violet, label: t.latent }, { color: P.amber, label: t.image }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "graph", label: t.graph, tone: P.teal }, { value: "sampler", label: t.sampler, tone: P.violet }, { value: "save", label: t.save, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "graph" && <>{[[t.checkpoint, P.teal, -1.7], [t.clip, P.violet, 0], [t.ksampler, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">checkpoint → CLIP → KSampler</Tag></>}
    {mode === "sampler" && <><Node3D position={[-1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">{t.latent}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.ksampler}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.seed} · {t.steps} · {t.cfg}</Tag></>}
    {mode === "save" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">{t.latent}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.vae} → {t.image}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">decode solo al final</Tag></>}
  </PointerTilt></Stage></Figure>;
}

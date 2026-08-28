"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "data" | "tensor" | "pipeline";
const COPY = {
  en: { title: "parallelism trades memory for communication", hint: "data · tensor · pipeline", data: "data", tensor: "tensor", pipeline: "pipeline", replica: "replica", reduce: "all-reduce", shard: "shard", stage: "stage", micro: "microbatch", bubble: "bubble" },
  es: { title: "el paralelismo cambia memoria por comunicación", hint: "datos · tensor · pipeline", data: "datos", tensor: "tensor", pipeline: "pipeline", replica: "réplica", reduce: "all-reduce", shard: "shard", stage: "etapa", micro: "microbatch", bubble: "burbuja" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("data");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.replica }, { color: P.violet, label: t.reduce }, { color: P.amber, label: t.shard }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "data", label: t.data, tone: P.teal }, { value: "tensor", label: t.tensor, tone: P.violet }, { value: "pipeline", label: t.pipeline, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "data" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.replica}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.reduce}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">gradientes → promedio global</Tag></>}
    {mode === "tensor" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">matmul</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.shard}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">A = [A₁ | A₂] · sync parcial</Tag></>}
    {mode === "pipeline" && <>{[["stage 0", P.teal, -1.7], ["stage 1", P.violet, 0], ["stage 2", P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.35, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.micro} llena el tubo; reduce la {t.bubble}</Tag></>}
  </PointerTilt></Stage></Figure>;
}

"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "comm" | "phases" | "io";
const COPY = {
  en: { title: "Block AttnRes makes depth communication shippable", hint: "cached comm · two phases · I/O", comm: "cached comm", phases: "two phases", io: "I/O", naive: "naive O(PV)", cached: "cache O(P)", phase1: "phase 1", phase2: "phase 2", block: "block cache", online: "online softmax", residual: "residual", cheap: "5.5d", full: "Full 24d" },
  es: { title: "Block AttnRes hace enviable la comunicación de profundidad", hint: "comm cacheada · dos fases · I/O", comm: "comm cacheada", phases: "dos fases", io: "I/O", naive: "ingenua O(PV)", cached: "caché O(P)", phase1: "fase 1", phase2: "fase 2", block: "caché bloques", online: "softmax online", residual: "residual", cheap: "5.5d", full: "Full 24d" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("comm");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.cached }, { color: P.violet, label: t.online }, { color: P.amber, label: t.residual }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "comm", label: t.comm, tone: P.teal }, { value: "phases", label: t.phases, tone: P.violet }, { value: "io", label: t.io, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "comm" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.rose} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="rose">{t.naive}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.cached}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">solo el bloque incremental cruza el rank</Tag></>}
    {mode === "phases" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">{t.phase1}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.phase2}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">batch K/V previos → fusiona parcial</Tag></>}
    {mode === "io" && <><Node3D position={[-1.7, 0.2, 0]} color={P.teal} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.cheap}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.full}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">Block reduce lecturas de profundidad</Tag></>}
  </PointerTilt></Stage></Figure>;
}

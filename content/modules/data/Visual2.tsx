"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "pipeline" | "quality" | "mixture";
const COPY = {
  en: { label: "data is a training ingredient", hint: "pipeline · quality · mixture", pipeline: "pipeline", quality: "quality", mixture: "mixture", scrape: "scrape", clean: "clean", dedup: "dedup", mix: "mix", good: "good", grey: "grey", bad: "bad", code: "code", prose: "prose", math: "math" },
  es: { label: "los datos son un ingrediente de entrenamiento", hint: "pipeline · calidad · mezcla", pipeline: "pipeline", quality: "calidad", mixture: "mezcla", scrape: "extrae", clean: "limpia", dedup: "deduplica", mix: "mezcla", good: "bueno", grey: "gris", bad: "malo", code: "código", prose: "prosa", math: "mates" },
};
export default function Visual() { const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("pipeline"); return <Figure label={t.label} hint={t.hint} legend={[{ color: P.teal, label: t.good }, { color: P.amber, label: t.grey }, { color: P.rose, label: t.bad }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "pipeline", label: t.pipeline, tone: P.teal }, { value: "quality", label: t.quality, tone: P.amber }, { value: "mixture", label: t.mixture, tone: P.violet }]} ariaLabel={t.label} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
{mode === "pipeline" && <>{[t.scrape, t.clean, t.dedup, t.mix].map((lab, i) => <group key={lab}><Slab position={[-2.4 + i * 1.6, 0.4, 0]} size={[1.2, 1.0 - i * 0.1, 0.12]} color={[P.teal, P.violet, P.amber, P.rose][i]} fill={0.22} /><Tag position={[-2.4 + i * 1.6, 1.05, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{lab}</Tag>{i < 3 && <Ribbon points={[[-1.75 + i * 1.6, 0.4, 0], [-1.6 + i * 1.6, 0.4, 0]]} color={P.lineStrong} radius={0.035} opacity={0.7} />}</group>)}</>}
{mode === "quality" && <><Lattice cells={Array.from({ length: 30 }, (_, i) => ({ position: [-2.6 + (i % 10) * 0.5, 0.85 - Math.floor(i / 10) * 0.45, 0] as [number, number, number], color: i < 15 ? P.teal : i < 24 ? P.amber : P.rose }))} size={0.18} opacity={0.9} matte /><Tag position={[-2.2, 1.55, 0.15]} tone="teal">{t.good}</Tag><Tag position={[0, 1.55, 0.15]} tone="amber">{t.grey}</Tag><Tag position={[2.1, 1.55, 0.15]} tone="rose">{t.bad}</Tag></>}
{mode === "mixture" && <>{[[t.code, P.teal, -1.8], [t.prose, P.violet, 0], [t.math, P.amber, 1.8]].map(([lab, col, x]) => <group key={lab as string}><Slab position={[x as number, 0.7, 0]} size={[1.5, 0.7, 0.12]} color={col as string} fill={0.24} /><Tag position={[x as number, 1.2, 0.15]} tone={(col === P.teal ? "teal" : col === P.violet ? "violet" : "amber")} size="xs">{lab as string}</Tag><Ribbon points={[[x as number, 0.25, 0], [0, -0.55, 0]]} color={col as string} radius={0.04} opacity={0.75} /></group>)}<Node3D position={[0, -0.8, 0]} color={P.rose} radius={0.2} pulse={0.35} /><Tag position={[0, -1.35, 0.15]} tone="rose" size="xs">dataset final</Tag></>}
</PointerTilt></Stage></Figure>; }

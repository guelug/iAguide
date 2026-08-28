"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "layer" | "memory" | "route";
const COPY = {
  en: { title: "choose the layer before the tool", hint: "model · harness · metal", layer: "layer", memory: "memory", route: "route", model: "model", harness: "harness", metal: "metal", card: "model card", quant: "quant", local: "local", api: "API", measure: "measure" },
  es: { title: "elige la capa antes que la herramienta", hint: "modelo · arnés · metal", layer: "capa", memory: "memoria", route: "ruta", model: "modelo", harness: "arnés", metal: "metal", card: "ficha", quant: "quant", local: "local", api: "API", measure: "mide" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("layer");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.model }, { color: P.violet, label: t.harness }, { color: P.amber, label: t.metal }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "layer", label: t.layer, tone: P.teal }, { value: "memory", label: t.memory, tone: P.violet }, { value: "route", label: t.route, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "layer" && <>{[[t.model, P.teal, -1.7], [t.harness, P.violet, 0], [t.metal, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">primero diagnostica; después eliges comando</Tag></>}
    {mode === "memory" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.card}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.quant}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">pesos + KV + contexto real</Tag></>}
    {mode === "route" && <><Node3D position={[-1.7, 0.2, 0]} color={P.teal} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.local}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.api}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.measure} antes de cambiar de backend</Tag></>}
  </PointerTilt></Stage></Figure>;
}

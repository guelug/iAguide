"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "open" | "moe" | "card";
const COPY = {
  en: { title: "read the model card, not the slogan", hint: "open · dense / MoE · checklist", open: "open", moe: "dense / MoE", card: "model card", api: "API", weights: "weights", code: "code", dense: "dense", active: "active", total: "total", license: "license", template: "chat template", file: "file" },
  es: { title: "lee la ficha, no el eslogan", hint: "abierto · dense / MoE · checklist", open: "abierto", moe: "dense / MoE", card: "ficha", api: "API", weights: "pesos", code: "código", dense: "dense", active: "activos", total: "totales", license: "licencia", template: "plantilla chat", file: "archivo" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("open");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.weights }, { color: P.violet, label: t.code }, { color: P.amber, label: t.license }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "open", label: t.open, tone: P.teal }, { value: "moe", label: t.moe, tone: P.violet }, { value: "card", label: t.card, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "open" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.weights}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.api}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">abierto no siempre significa open source</Tag></>}
        {mode === "moe" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.total}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.active}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">memoria ↔ FLOPs</Tag></>}
        {mode === "card" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.amber} opacity={0.32} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="amber">{t.card}</Tag>{[[t.license, P.teal, -1.7], [t.template, P.violet, 0], [t.file, P.rose, 1.7]].map(([label, color, x], i) => <group key={label as string}><Node3D position={[x as number, -0.65, 0]} color={color as string} radius={0.13} matte /><Tag position={[x as number, -0.2, 0.15]} tone={(["teal", "violet", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}</>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

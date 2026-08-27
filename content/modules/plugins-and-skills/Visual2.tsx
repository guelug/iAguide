"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "choice" | "load" | "permission";
const COPY = {
  en: { title: "plugins add code; skills add recipes", hint: "choice · load · permissions", choice: "choice", load: "load", permission: "permissions", plugin: "plugin", skill: "skill", code: "code", recipe: "recipe", boot: "boot", demand: "on demand", manifest: "manifest", inherited: "inherited" },
  es: { title: "plugins añaden código; skills recetas", hint: "elección · carga · permisos", choice: "elige", load: "carga", permission: "permisos", plugin: "plugin", skill: "skill", code: "código", recipe: "receta", boot: "boot", demand: "bajo demanda", manifest: "manifiesto", inherited: "heredados" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("choice");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.plugin }, { color: P.violet, label: t.skill }, { color: P.amber, label: t.manifest }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "choice", label: t.choice, tone: P.teal }, { value: "load", label: t.load, tone: P.violet }, { value: "permission", label: t.permission, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "choice" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.plugin}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.skill}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.code} nuevo ↔ {t.recipe} repetible</Tag></>}
        {mode === "load" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.boot}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.demand}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">plugin en arranque · skill cuando se pide</Tag></>}
        {mode === "permission" && <><Node3D position={[-1.7, 0.2, 0]} color={P.teal} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.manifest}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.inherited}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">plugin declara · skill hereda</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

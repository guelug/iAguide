"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "discover" | "register" | "capability";
const COPY = {
  en: { title: "register(ctx) is the plugin waist", hint: "discover · register · consent", discover: "discover", register: "register", capability: "capability", user: "user", project: "project", pip: "pip", tool: "tool", hook: "hook", cli: "CLI", consent: "consent", override: "override", fail: "fail closed", data: "plugin-data" },
  es: { title: "register(ctx) es la cintura del plugin", hint: "descubre · registra · consiente", discover: "descubre", register: "registra", capability: "capability", user: "usuario", project: "proyecto", pip: "pip", tool: "tool", hook: "hook", cli: "CLI", consent: "consentimiento", override: "override", fail: "fail closed", data: "plugin-data" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("discover");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.tool }, { color: P.violet, label: t.hook }, { color: P.amber, label: t.consent }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "discover", label: t.discover, tone: P.teal }, { value: "register", label: t.register, tone: P.violet }, { value: "capability", label: t.capability, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "discover" && <>{[[t.user, P.teal, -1.8], [t.project, P.violet, 0], [t.pip, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.85, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.75, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag>{i < 2 && <Ribbon points={[[x as number + 0.75, 0.2, 0], [x as number + 1.0, 0.2, 0]]} color={P.lineStrong} radius={0.035} opacity={0.75} />}</group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">plugin.yaml + register(ctx)</Tag></>}
        {mode === "register" && <><Slab position={[0, 0.2, 0]} size={[2.1, 1.25, 0.14]} color={P.violet} fill={0.18} rim={0.7} /><Tag position={[0, 0.78, 0.15]} tone="violet">register(ctx)</Tag>{[[t.tool, P.teal, -1.65], [t.hook, P.amber, 0], [t.cli, P.rose, 1.65]].map(([label, color, x], i) => <group key={label as string}><Node3D position={[x as number, -0.85, 0]} color={color as string} radius={0.15} pulse={0.25} /><Tag position={[x as number, -0.4, 0.15]} tone={(["teal", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag><Ribbon points={[[x as number, -0.65, 0], [x as number * 0.45, -0.35, 0]]} color={color as string} radius={0.035} opacity={0.8} /></group>)}</>}
        {mode === "capability" && <><Halo position={[0, 0.2, 0]} radius={1.25} color={P.amber} opacity={0.35} spin={0.12} /><Node3D position={[0, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.4} /><Tag position={[0, 0.78, 0.15]} tone="amber">{t.consent}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Slab position={[-2, 0.2, 0]} size={[1.35, 0.65, 0.1]} color={P.teal} fill={0.24} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">{t.tool}</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Slab position={[2, 0.2, 0]} size={[1.35, 0.65, 0.1]} color={P.rose} fill={0.24} /><Tag position={[2, 0.65, 0.15]} tone="rose" size="xs">{t.fail}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.override} → {t.consent}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

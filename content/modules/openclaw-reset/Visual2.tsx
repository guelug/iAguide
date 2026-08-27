"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "timestamps" | "modes" | "overrides";
const COPY = {
  en: { title: "freshness is not updatedAt", hint: "timestamps · reset modes · overrides", timestamps: "timestamps", modes: "modes", overrides: "overrides", started: "sessionStartedAt", interaction: "lastInteractionAt", updated: "updatedAt", daily: "daily", idle: "idle", manual: "manual", group: "group", channel: "channel", first: "first expiry wins", newSession: "new session" },
  es: { title: "frescura no es updatedAt", hint: "timestamps · modos reset · overrides", timestamps: "timestamps", modes: "modos", overrides: "overrides", started: "sessionStartedAt", interaction: "lastInteractionAt", updated: "updatedAt", daily: "daily", idle: "idle", manual: "manual", group: "grupo", channel: "canal", first: "gana el primero que expire", newSession: "sesión nueva" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("timestamps");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.interaction }, { color: P.violet, label: t.started }, { color: P.amber, label: t.updated }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "timestamps", label: t.timestamps, tone: P.teal }, { value: "modes", label: t.modes, tone: P.violet }, { value: "overrides", label: t.overrides, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "timestamps" && <>{[[t.started, P.violet, -1.8], [t.interaction, P.teal, 0], [t.updated, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.5, 0.8, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.72, 0.15]} tone={(["violet", "teal", "amber"] as const)[i]} size="xs">{label as string}</Tag><Node3D position={[x as number, -0.2, 0]} color={color as string} radius={0.12} matte /></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">heartbeat mueve {t.updated}, no idle</Tag></>}
        {mode === "modes" && <>{[[t.daily, P.violet, -1.7], [t.idle, P.teal, 0], [t.manual, P.rose, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.78, 0.15]} tone={(["violet", "teal", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">/new o /reset acuñan {t.newSession}</Tag></>}
        {mode === "overrides" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">global: daily</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.group}/{t.channel}: idle</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.first}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

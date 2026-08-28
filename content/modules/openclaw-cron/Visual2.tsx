"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "schedule" | "sessions" | "delivery";
const COPY = {
  en: { title: "OpenClaw cron lives in the Gateway", hint: "schedule · session style · delivery", schedule: "schedule", sessions: "sessions", delivery: "delivery", at: "at", every: "every", cron: "cron", main: "main", isolated: "isolated", current: "current", chat: "chat", webhook: "webhook", none: "nowhere" },
  es: { title: "el cron de OpenClaw vive en Gateway", hint: "horario · estilo sesión · entrega", schedule: "horario", sessions: "sesiones", delivery: "entrega", at: "at", every: "every", cron: "cron", main: "main", isolated: "aislada", current: "actual", chat: "chat", webhook: "webhook", none: "ningún sitio" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("schedule");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.schedule }, { color: P.violet, label: t.sessions }, { color: P.amber, label: t.delivery }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "schedule", label: t.schedule, tone: P.teal }, { value: "sessions", label: t.sessions, tone: P.violet }, { value: "delivery", label: t.delivery, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "schedule" && <>{[[t.at, P.teal, -1.7], [t.every, P.violet, 0], [t.cron, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.85, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.76, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">Gateway encendido → tick → run</Tag></>}
        {mode === "sessions" && <>{[[t.main, P.teal, -1.7], [t.isolated, P.violet, 0], [t.current, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.85, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.76, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">cron · job-id para chores sin historial</Tag></>}
        {mode === "delivery" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.76, 0.15]} tone="teal">{t.chat}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.76, 0.15]} tone="amber">{t.webhook}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.none} también es una opción</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

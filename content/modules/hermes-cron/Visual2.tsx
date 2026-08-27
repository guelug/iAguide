"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "tick" | "guard" | "fallback";
const COPY = {
  en: { title: "cron schedules an agent, not shell", hint: "tick · recursion guard · provider fallback", tick: "tick", guard: "recursion guard", fallback: "fallback", jobs: "jobs.json", lock: "lock", agent: "fresh AIAgent", deliver: "deliver", cronTool: "cronjob tool", disabled: "disabled", chronos: "Chronos", builtin: "built-in" },
  es: { title: "cron programa un agente, no shell", hint: "tick · guardia de recursión · fallback", tick: "tick", guard: "guardia recursión", fallback: "fallback", jobs: "jobs.json", lock: "lock", agent: "AIAgent fresco", deliver: "entrega", cronTool: "tool cronjob", disabled: "desactivado", chronos: "Chronos", builtin: "in-process" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("tick");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.jobs }, { color: P.violet, label: t.agent }, { color: P.amber, label: t.deliver }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "tick", label: t.tick, tone: P.teal }, { value: "guard", label: t.guard, tone: P.rose }, { value: "fallback", label: t.fallback, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "tick" && <>{[[t.jobs, P.teal, -2], [t.lock, P.violet, -0.7], [t.agent, P.amber, 0.7], [t.deliver, P.rose, 2]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.25, 0.75, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.7, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag>{i < 3 && <Ribbon points={[[x as number + 0.65, 0.2, 0], [x as number + 0.75, 0.2, 0]]} color={P.lineStrong} radius={0.035} opacity={0.7} />}</group>)}</>}
        {mode === "guard" && <><Halo position={[0, 0.15, 0]} radius={1.35} color={P.rose} opacity={0.4} spin={0.12} /><Node3D position={[0, 0.15, 0]} color={P.rose} radius={0.22} pulse={0.45} /><Tag position={[0, 0.75, 0.15]} tone="rose">{t.cronTool}</Tag><Ribbon points={[[-2, 0.15, 0], [-0.45, 0.15, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">job</Tag><Ribbon points={[[0.45, 0.15, 0], [2, 0.15, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Tag position={[2, 0.65, 0.15]} tone="rose" size="xs">{t.disabled}</Tag><Tag position={[0, -0.8, 0.15]} tone="muted" size="xs">una corrida no puede crear otra</Tag></>}
        {mode === "fallback" && <><Slab position={[-1.7, 0.2, 0]} size={[1.7, 0.9, 0.12]} color={P.amber} fill={0.24} /><Tag position={[-1.7, 0.75, 0.15]} tone="amber">{t.chronos}</Tag><Ribbon points={[[-0.7, 0.2, 0], [0.7, 0.2, 0]]} color={P.lineStrong} radius={0.05} opacity={0.8} /><Slab position={[1.7, 0.2, 0]} size={[1.7, 0.9, 0.12]} color={P.teal} fill={0.24} /><Tag position={[1.7, 0.75, 0.15]} tone="teal">{t.builtin}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">proveedor roto → ticker seguro</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

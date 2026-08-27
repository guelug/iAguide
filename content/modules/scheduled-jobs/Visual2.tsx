"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "phases" | "lock" | "delivery";
const COPY = {
  en: { title: "a scheduled job is an agent turn", hint: "store · tick · fresh agent · deliver", phases: "five phases", lock: "distributed lock", delivery: "delivery", store: "store", tick: "tick", agent: "fresh agent", skills: "skills", deliver: "deliver", lockWord: "lock", duplicate: "duplicate", outbound: "outbound", fresh: "fresh session" },
  es: { title: "un job programado es un turno de agente", hint: "store · tick · agente fresco · entrega", phases: "cinco fases", lock: "lock distribuido", delivery: "entrega", store: "store", tick: "tick", agent: "agente fresco", skills: "skills", deliver: "entrega", lockWord: "lock", duplicate: "duplicado", outbound: "outbound", fresh: "sesión fresca" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("phases");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.store }, { color: P.violet, label: t.agent }, { color: P.amber, label: t.deliver }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "phases", label: t.phases, tone: P.teal }, { value: "lock", label: t.lock, tone: P.rose }, { value: "delivery", label: t.delivery, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "phases" && <>{[[t.store, P.teal, -2], [t.tick, P.violet, -0.7], [t.agent, P.amber, 0.7], [t.skills, P.teal, 2]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.2, 0.78, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.72, 0.15]} tone={(["teal", "violet", "amber", "teal"] as const)[i]} size="xs">{label as string}</Tag>{i < 3 && <Ribbon points={[[x as number + 0.65, 0.2, 0], [x as number + 0.75, 0.2, 0]]} color={P.lineStrong} radius={0.035} opacity={0.7} />}</group>)}<Tag position={[0, -0.75, 0.15]} tone="amber" size="xs">{t.deliver} outbound</Tag></>}
        {mode === "lock" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.rose} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.rose} radius={0.2} pulse={0.4} /><Tag position={[0, 0.78, 0.15]} tone="rose">{t.lockWord}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">worker A</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.rose} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="rose" size="xs">{t.duplicate}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">solo un worker gana</Tag></>}
        {mode === "delivery" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">{t.fresh}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.outbound}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">no se ensucia el chat vivo</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "hosts" | "core" | "session";
const COPY = {
  en: { title: "six hosts, one AIAgent", hint: "entry points · core · durable history", hosts: "hosts", core: "core", session: "session", cli: "CLI", gateway: "gateway", acp: "ACP", batch: "batch", api: "API", python: "Python", prompt: "prompt", provider: "provider", tools: "tools", history: "history", fresh: "fresh" },
  es: { title: "seis hosts, un AIAgent", hint: "puntos de entrada · núcleo · historial durable", hosts: "hosts", core: "núcleo", session: "sesión", cli: "CLI", gateway: "gateway", acp: "ACP", batch: "batch", api: "API", python: "Python", prompt: "prompt", provider: "proveedor", tools: "tools", history: "historial", fresh: "fresco" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("hosts");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.prompt }, { color: P.violet, label: t.provider }, { color: P.amber, label: t.tools }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "hosts", label: t.hosts, tone: P.teal }, { value: "core", label: t.core, tone: P.violet }, { value: "session", label: t.session, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "hosts" && <><Halo position={[0, 0, 0]} radius={1.05} color={P.violet} opacity={0.35} spin={0.1} /><Node3D position={[0, 0, 0]} color={P.violet} radius={0.22} pulse={0.3} /><Tag position={[0, 0.65, 0.15]} tone="violet">AIAgent</Tag>{[[t.cli, P.teal, -2, 0.3], [t.gateway, P.teal, -0.7, 0.85], [t.acp, P.amber, 0.9, 0.85], [t.batch, P.amber, 2, 0.3], [t.api, P.rose, 1.5, -0.8], [t.python, P.rose, -1.5, -0.8]].map(([label, color, x, y]) => <group key={label as string}><Node3D position={[x as number, y as number, 0]} color={color as string} radius={0.13} matte /><Tag position={[x as number, (y as number) + 0.3, 0.15]} tone={color === P.teal ? "teal" : color === P.amber ? "amber" : "rose"} size="xs">{label as string}</Tag><Ribbon points={[[x as number * 0.55, y as number * 0.45, 0], [x as number * 0.88, y as number * 0.88, 0]]} color={color as string} radius={0.025} opacity={0.7} /></group>)}</>}
        {mode === "core" && <><Slab position={[0, 0.35, 0]} size={[2.4, 1.7, 0.14]} color={P.violet} fill={0.16} rim={0.7} /><Tag position={[0, 0.82, 0.15]} tone="violet">AIAgent</Tag>{[[t.prompt, P.teal, -0.7, 0.2], [t.provider, P.amber, 0, -0.2], [t.tools, P.rose, 0.7, 0.2]].map(([label, color, x, y]) => <group key={label as string}><Slab position={[x as number, y as number, 0.12]} size={[0.6, 0.3, 0.06]} color={color as string} fill={0.3} /><Tag position={[x as number, (y as number) + 0.22, 0.2]} tone={color === P.teal ? "teal" : color === P.amber ? "amber" : "rose"} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">chat() → texto · run_conversation() → dict</Tag></>}
        {mode === "session" && <><Slab position={[-1.7, 0.2, 0]} size={[1.8, 1.05, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.8, 0.15]} tone="teal">{t.history}</Tag><Ribbon points={[[-0.65, 0.2, 0], [0.65, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.8, 1.05, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.8, 0.15]} tone="amber">{t.fresh}</Tag><Tag position={[0, -0.7, 0.15]} tone="muted" size="xs">CLI reanuda · cron empieza sin historial</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

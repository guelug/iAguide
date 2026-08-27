"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "route" | "guards" | "pairing";
const COPY = {
  en: { title: "many channels, one agent loop", hint: "route · guards · pairing", route: "route", guards: "guards", pairing: "pairing", platform: "platform", event: "MessageEvent", session: "session key", agent: "AIAgent", reply: "reply", active: "active", queue: "queue", stop: "stop", approve: "approve", code: "code" },
  es: { title: "muchos canales, un bucle de agente", hint: "ruta · guardias · pairing", route: "ruta", guards: "guardias", pairing: "pairing", platform: "plataforma", event: "MessageEvent", session: "clave sesión", agent: "AIAgent", reply: "respuesta", active: "activa", queue: "cola", stop: "stop", approve: "aprueba", code: "código" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("route");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.platform }, { color: P.violet, label: t.agent }, { color: P.amber, label: t.session }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "route", label: t.route, tone: P.teal }, { value: "guards", label: t.guards, tone: P.violet }, { value: "pairing", label: t.pairing, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "route" && <>{[[t.platform, P.teal, -2], [t.event, P.violet, -0.65], [t.session, P.amber, 0.7], [t.agent, P.rose, 2]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.25, 0.78, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.72, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag>{i < 3 && <Ribbon points={[[x as number + 0.65, 0.2, 0], [x as number + 0.7, 0.2, 0]]} color={P.lineStrong} radius={0.035} opacity={0.75} />}</group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.reply} vuelve por el adaptador</Tag></>}
        {mode === "guards" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[0, 0.78, 0.15]} tone="violet">{t.active}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">{t.queue}</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.rose} radius={0.055} opacity={0.95} /><Tag position={[2, 0.65, 0.15]} tone="rose" size="xs">/{t.stop} · /{t.approve}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">dos guardias antes del runner</Tag></>}
        {mode === "pairing" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">admin</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.45} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.code}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">DM: /pair → código → autorizado</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "exposure" | "bind" | "auth";
const COPY = {
  en: { title: "keep loopback; let Tailscale carry HTTPS", hint: "serve · funnel · direct bind", exposure: "exposure", bind: "bind", auth: "auth", loopback: "loopback", serve: "Serve", funnel: "Funnel", tailnet: "tailnet", public: "public", token: "token", password: "password", ui: "Control UI" },
  es: { title: "conserva loopback; Tailscale lleva HTTPS", hint: "serve · funnel · bind directo", exposure: "exposición", bind: "bind", auth: "auth", loopback: "loopback", serve: "Serve", funnel: "Funnel", tailnet: "tailnet", public: "público", token: "token", password: "password", ui: "Control UI" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("exposure");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.loopback }, { color: P.violet, label: t.tailnet }, { color: P.rose, label: t.public }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "exposure", label: t.exposure, tone: P.teal }, { value: "bind", label: t.bind, tone: P.violet }, { value: "auth", label: t.auth, tone: P.rose }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "exposure" && <>{[[t.loopback, P.teal, -1.8], [t.serve, P.violet, 0], [t.funnel, P.rose, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.85, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.76, 0.15]} tone={(["teal", "violet", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">bind local · HTTPS al frente</Tag></>}
        {mode === "bind" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.loopback}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.tailnet}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">WS remoto · no HTTP plano para UI</Tag></>}
        {mode === "auth" && <><Node3D position={[0, 0.2, 0]} color={P.rose} radius={0.2} pulse={0.35} /><Tag position={[0, 0.78, 0.15]} tone="rose">{t.ui}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="amber" size="xs">{t.token}</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">{t.password}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">Serve aporta HTTPS; auth sigue siendo necesaria</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

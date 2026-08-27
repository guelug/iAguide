"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "profiles" | "control" | "routing";
const COPY = {
  en: { title: "one browser, three profiles", hint: "isolated · control plane · node proxy", profiles: "profiles", control: "control plane", routing: "routing", openclaw: "openclaw", user: "user", chrome: "chrome", isolated: "isolated", loopback: "loopback", node: "node", sandbox: "sandbox", host: "host", cdp: "CDP" },
  es: { title: "un navegador, tres perfiles", hint: "aislado · plano de control · proxy nodo", profiles: "perfiles", control: "plano control", routing: "routing", openclaw: "openclaw", user: "user", chrome: "chrome", isolated: "aislado", loopback: "loopback", node: "nodo", sandbox: "sandbox", host: "host", cdp: "CDP" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("profiles");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.isolated }, { color: P.violet, label: t.loopback }, { color: P.amber, label: t.node }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "profiles", label: t.profiles, tone: P.teal }, { value: "control", label: t.control, tone: P.violet }, { value: "routing", label: t.routing, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "profiles" && <>{[[t.openclaw, P.teal, -1.8], [t.user, P.violet, 0], [t.chrome, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.95, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.8, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag><Tag position={[x as number, 0.1, 0.15]} tone="muted" size="xs">{i === 0 ? t.isolated : t.cdp}</Tag></group>)}</>}
        {mode === "control" && <><Halo position={[0, 0.2, 0]} radius={1.15} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[0, 0.8, 0.15]} tone="violet">{t.loopback}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">gateway + 2</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">CDP 9+</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">perfil personal fuera del circuito</Tag></>}
        {mode === "routing" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.sandbox}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.node}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">target: sandbox · host · node</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

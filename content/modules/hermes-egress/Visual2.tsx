"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "swap" | "deny" | "profiles";
const COPY = {
  en: { title: "egress swaps tokens at the edge", hint: "opaque token · deny CIDRs · profile", swap: "token swap", deny: "deny CIDRs", profiles: "profiles", sandbox: "sandbox", proxy: "iron-proxy", upstream: "upstream", opaque: "opaque token", real: "real key", imds: "IMDS", loopback: "loopback", home: "HERMES_HOME" },
  es: { title: "egress cambia tokens en el borde", hint: "token opaco · CIDRs denegados · perfil", swap: "cambia token", deny: "CIDRs deny", profiles: "perfiles", sandbox: "sandbox", proxy: "iron-proxy", upstream: "upstream", opaque: "token opaco", real: "clave real", imds: "IMDS", loopback: "loopback", home: "HERMES_HOME" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("swap");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.opaque }, { color: P.violet, label: t.proxy }, { color: P.rose, label: t.real }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "swap", label: t.swap, tone: P.teal }, { value: "deny", label: t.deny, tone: P.rose }, { value: "profiles", label: t.profiles, tone: P.violet }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "swap" && <><Slab position={[-1.8, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.23} /><Tag position={[-1.8, 0.78, 0.15]} tone="teal">{t.sandbox}</Tag><Tag position={[-1.8, 0.1, 0.15]} tone="teal" size="xs">{t.opaque}</Tag><Ribbon points={[[-0.8, 0.2, 0], [0.8, 0.2, 0]]} color={P.violet} radius={0.055} opacity={0.9} /><Halo position={[0, 0.2, 0]} radius={0.55} color={P.violet} opacity={0.4} spin={0.15} /><Slab position={[1.8, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.rose} fill={0.23} /><Tag position={[1.8, 0.78, 0.15]} tone="rose">{t.upstream}</Tag><Tag position={[1.8, 0.1, 0.15]} tone="rose" size="xs">{t.real}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">CONNECT → TLS termina → reenvía</Tag></>}
        {mode === "deny" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">allowlist</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Node3D position={[1.7, 0.2, 0]} color={P.rose} radius={0.22} pulse={0.45} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">403</Tag><Tag position={[0, -0.75, 0.15]} tone="rose" size="xs">{t.imds} · {t.loopback} · RFC1918 bloqueados</Tag></>}
        {mode === "profiles" && <><Halo position={[0, 0.2, 0]} radius={1.15} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="violet">{t.home}</Tag><Ribbon points={[[-1.9, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-1.9, 0.65, 0.15]} tone="teal" size="xs">CA local</Tag><Ribbon points={[[0.45, 0.2, 0], [1.9, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[1.9, 0.65, 0.15]} tone="amber" size="xs">proxy.yaml</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">credenciales viven en el host</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

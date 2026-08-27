"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "frames" | "handshake" | "errors";
const COPY = {
  en: { title: "frames, not ad hoc JSON", hint: "connect · handshake · errors", frames: "frames", handshake: "handshake", errors: "errors", request: "req", response: "res", event: "event", connect: "connect", hello: "hello-ok", nonce: "nonce", scope: "scope", forbidden: "FORBIDDEN", retry: "retryable" },
  es: { title: "frames, no JSON improvisado", hint: "connect · handshake · errores", frames: "frames", handshake: "handshake", errors: "errores", request: "req", response: "res", event: "event", connect: "connect", hello: "hello-ok", nonce: "nonce", scope: "scope", forbidden: "FORBIDDEN", retry: "reintentable" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("frames");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.request }, { color: P.violet, label: t.response }, { color: P.amber, label: t.event }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "frames", label: t.frames, tone: P.teal }, { value: "handshake", label: t.handshake, tone: P.violet }, { value: "errors", label: t.errors, tone: P.rose }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "frames" && <>{[[t.request, P.teal, -1.8], [t.response, P.violet, 0], [t.event, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.5, 0.85, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.75, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag><Node3D position={[x as number, -0.25, 0]} color={color as string} radius={0.12} matte /></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">type + id + payload</Tag></>}
        {mode === "handshake" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.teal} fill={0.23} /><Tag position={[-1.7, 0.76, 0.15]} tone="teal">{t.nonce}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.9} /><Halo position={[1.7, 0.2, 0]} radius={0.65} color={P.violet} opacity={0.35} spin={0.12} /><Node3D position={[1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[1.7, 0.76, 0.15]} tone="violet">{t.hello}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">primer frame: {t.connect}</Tag></>}
        {mode === "errors" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.rose} fill={0.24} /><Tag position={[-1.7, 0.76, 0.15]} tone="rose">{t.forbidden}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.76, 0.15]} tone="amber">{t.retry}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">scope ausente → 403</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

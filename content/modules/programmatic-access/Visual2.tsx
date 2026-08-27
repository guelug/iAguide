"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "sockets" | "stream" | "cancel";
const COPY = {
  en: { title: "one loop, four sockets", hint: "ACP · HTTP · WebSocket · in-process", sockets: "sockets", stream: "stream", cancel: "cancel", acp: "ACP", http: "HTTP", ws: "WebSocket", direct: "in-process", loop: "run_agent", sse: "SSE", bidirectional: "bidirectional", function: "function" },
  es: { title: "un bucle, cuatro sockets", hint: "ACP · HTTP · WebSocket · in-process", sockets: "sockets", stream: "stream", cancel: "cancela", acp: "ACP", http: "HTTP", ws: "WebSocket", direct: "in-process", loop: "run_agent", sse: "SSE", bidirectional: "bidireccional", function: "función" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("sockets");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.acp }, { color: P.violet, label: t.http }, { color: P.amber, label: t.ws }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "sockets", label: t.sockets, tone: P.teal }, { value: "stream", label: t.stream, tone: P.violet }, { value: "cancel", label: t.cancel, tone: P.rose }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "sockets" && <><Halo position={[0, 0.2, 0]} radius={1.0} color={P.violet} opacity={0.3} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="violet">{t.loop}</Tag>{[[t.acp, P.teal, -1.8], [t.http, P.violet, 0], [t.ws, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Node3D position={[x as number, -0.7, 0]} color={color as string} radius={0.14} matte /><Tag position={[x as number, -0.25, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag><Ribbon points={[[x as number * 0.5, 0.05, 0], [x as number * 0.82, -0.45, 0]]} color={color as string} radius={0.03} opacity={0.75} /></group>)}</>}
        {mode === "stream" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.http}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.sse}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">REST → {t.loop} → JSON/SSE</Tag></>}
        {mode === "cancel" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.ws}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Node3D position={[1.7, 0.2, 0]} color={P.rose} radius={0.2} pulse={0.45} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">{t.cancel}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.bidirectional} · eventos push</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

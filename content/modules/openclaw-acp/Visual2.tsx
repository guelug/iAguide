"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "directions" | "bridge" | "binding";
const COPY = {
  en: { title: "ACP has two inverse directions", hint: "bridge · spawn · binding", directions: "directions", bridge: "bridge", binding: "binding", editor: "editor", openclaw: "OpenClaw", harness: "harness", gateway: "Gateway", prompt: "prompt", spawn: "spawn", here: "bind here", thread: "thread", host: "host", sandbox: "sandbox" },
  es: { title: "ACP tiene dos direcciones inversas", hint: "bridge · spawn · binding", directions: "direcciones", bridge: "bridge", binding: "binding", editor: "editor", openclaw: "OpenClaw", harness: "arnés", gateway: "Gateway", prompt: "prompt", spawn: "spawn", here: "bind here", thread: "thread", host: "host", sandbox: "sandbox" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("directions");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.editor }, { color: P.violet, label: t.gateway }, { color: P.amber, label: t.harness }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "directions", label: t.directions, tone: P.teal }, { value: "bridge", label: t.bridge, tone: P.violet }, { value: "binding", label: t.binding, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "directions" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.editor}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.openclaw}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">editor → servidor · OpenClaw → harness</Tag></>}
        {mode === "bridge" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="violet">{t.gateway}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">stdio ACP</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">WebSocket</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.prompt} → session key</Tag></>}
        {mode === "binding" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.spawn}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.here}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.host} runtime · no {t.sandbox}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

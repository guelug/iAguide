"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "doors" | "dm" | "node";
const COPY = {
  en: { title: "pairing means two explicit doors", hint: "DM access · node access · stores", doors: "two doors", dm: "DM", node: "node", person: "person", device: "device", approve: "approve", group: "groups stay separate", store: "SQLite store", code: "short code" },
  es: { title: "pairing significa dos puertas explícitas", hint: "acceso DM · acceso nodo · stores", doors: "dos puertas", dm: "DM", node: "nodo", person: "persona", device: "dispositivo", approve: "aprueba", group: "grupos van aparte", store: "store SQLite", code: "código corto" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("doors");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.dm }, { color: P.violet, label: t.node }, { color: P.amber, label: t.approve }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "doors", label: t.doors, tone: P.teal }, { value: "dm", label: t.dm, tone: P.violet }, { value: "node", label: t.node, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "doors" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.dm}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.node}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.person} ≠ {t.device}</Tag></>}
        {mode === "dm" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.76, 0.15]} tone="teal">{t.person}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.4} /><Tag position={[1.7, 0.76, 0.15]} tone="amber">{t.code}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">aprobar DM no abre grupos</Tag></>}
        {mode === "node" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="violet">{t.store}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">request</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">{t.approve}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">pairing ≠ approval de commands</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

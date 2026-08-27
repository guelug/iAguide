"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "topology" | "pairing" | "approval";
const COPY = {
  en: { title: "nodes are peripherals, not gateways", hint: "topology · pairing · approval", topology: "topology", pairing: "pairing", approval: "approval", gateway: "gateway", node: "node", channel: "channel", request: "pair request", paired: "paired", run: "system.run", pending: "pending", reject: "reject" },
  es: { title: "los nodos son periféricos, no gateways", hint: "topología · pairing · aprobación", topology: "topología", pairing: "pairing", approval: "aprobación", gateway: "gateway", node: "nodo", channel: "canal", request: "petición pairing", paired: "paired", run: "system.run", pending: "pendiente", reject: "rechaza" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("topology");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.gateway }, { color: P.violet, label: t.node }, { color: P.amber, label: t.approval }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "topology", label: t.topology, tone: P.teal }, { value: "pairing", label: t.pairing, tone: P.violet }, { value: "approval", label: t.approval, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "topology" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.teal} opacity={0.3} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.22} pulse={0.3} /><Tag position={[0, 0.8, 0.15]} tone="teal">{t.gateway}</Tag>{[[t.channel, P.amber, -1.9, 0.2], [t.node, P.violet, 1.9, 0.2]].map(([label, color, x, y]) => <group key={label as string}><Slab position={[x as number, y as number, 0]} size={[1.45, 0.8, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, (y as number) + 0.52, 0.15]} tone={color === P.violet ? "violet" : "amber"} size="xs">{label as string}</Tag><Ribbon points={[[x as number * 0.55, y as number, 0], [x as number * 0.88, y as number, 0]]} color={color as string} radius={0.04} opacity={0.8} /></group>)}</>}
        {mode === "pairing" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.violet} fill={0.24} /><Tag position={[-1.7, 0.75, 0.15]} tone="violet">{t.node}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.45} /><Tag position={[1.7, 0.75, 0.15]} tone="amber">{t.request}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">requestId único · caduca · approve</Tag></>}
        {mode === "approval" && <><Slab position={[-1.75, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.75, 0.78, 0.15]} tone="teal">{t.paired}</Tag><Ribbon points={[[-0.8, 0.2, 0], [0.8, 0.2, 0]]} color={P.amber} radius={0.055} opacity={0.9} /><Slab position={[1.75, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.rose} fill={0.25} /><Tag position={[1.75, 0.78, 0.15]} tone="rose">{t.run}</Tag><Tag position={[0, -0.75, 0.15]} tone="amber" size="xs">{t.approval} separada del pairing</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

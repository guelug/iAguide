"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "layers" | "ownership" | "select";
const COPY = {
  en: { title: "provider, model, runtime, channel", hint: "four layers · owner · selection", layers: "layers", ownership: "owner", select: "selection", provider: "provider", model: "model", runtime: "runtime", channel: "channel", openclaw: "OpenClaw", codex: "Codex", cli: "CLI", auto: "auto", exact: "exact", fallback: "fallback" },
  es: { title: "proveedor, modelo, runtime, canal", hint: "cuatro capas · dueño · selección", layers: "capas", ownership: "dueño", select: "selección", provider: "proveedor", model: "modelo", runtime: "runtime", channel: "canal", openclaw: "OpenClaw", codex: "Codex", cli: "CLI", auto: "auto", exact: "exacto", fallback: "fallback" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("layers");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.provider }, { color: P.violet, label: t.runtime }, { color: P.amber, label: t.channel }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "layers", label: t.layers, tone: P.teal }, { value: "ownership", label: t.ownership, tone: P.violet }, { value: "select", label: t.select, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "layers" && <>{[[t.provider, P.teal, -1.8], [t.model, P.violet, -0.6], [t.runtime, P.amber, 0.6], [t.channel, P.rose, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.2, 0.78, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.72, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag>{i < 3 && <Ribbon points={[[x as number + 0.62, 0.2, 0], [x as number + 0.58, 0.2, 0]]} color={P.lineStrong} radius={0.03} opacity={0.7} />}</group>)}</>}
        {mode === "ownership" && <><Halo position={[0, 0.15, 0]} radius={1.2} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.15, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[0, 0.72, 0.15]} tone="violet">{t.openclaw}</Tag><Ribbon points={[[-1.9, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-1.9, 0.65, 0.15]} tone="teal" size="xs">loop + entrega</Tag><Ribbon points={[[0.45, 0.2, 0], [1.9, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[1.9, 0.65, 0.15]} tone="amber" size="xs">{t.codex} · thread</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">el dueño del estado cambia</Tag></>}
        {mode === "select" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.75, 0.15]} tone="teal">{t.auto}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.85, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.75, 0.15]} tone="amber">{t.exact}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.auto} → {t.openclaw} · plugin reclama → {t.runtime}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "memory" | "routes" | "cost";
const COPY = {
  en: { title: "memory has three tenants", hint: "weights · KV cache · runtime", memory: "tenants", routes: "topology", cost: "bandwidth", weights: "weights", kv: "KV cache", runtime: "runtime", vram: "VRAM", unified: "unified", ram: "RAM", context: "context", fixed: "fixed", grows: "grows" },
  es: { title: "la memoria tiene tres inquilinos", hint: "pesos · caché KV · runtime", memory: "inquilinos", routes: "topología", cost: "ancho banda", weights: "pesos", kv: "caché KV", runtime: "runtime", vram: "VRAM", unified: "unificada", ram: "RAM", context: "contexto", fixed: "fijo", grows: "crece" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("memory");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.weights }, { color: P.violet, label: t.kv }, { color: P.amber, label: t.runtime }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "memory", label: t.memory, tone: P.teal }, { value: "routes", label: t.routes, tone: P.violet }, { value: "cost", label: t.cost, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "memory" && <>{[[t.weights, P.teal, -1.7], [t.kv, P.violet, 0], [t.runtime, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag><Tag position={[x as number, 0.05, 0.15]} tone="muted" size="xs">{i === 0 ? t.fixed : i === 1 ? t.grows : "overhead"}</Tag></group>)}</>}
        {mode === "routes" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.vram}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.unified}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">PCIe copy ↔ pool compartido</Tag></>}
        {mode === "cost" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.context}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.rose} radius={0.05} opacity={0.9} /><Node3D position={[1.7, 0.2, 0]} color={P.rose} radius={0.2} pulse={0.4} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">bandwidth</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">decode relee pesos por token</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "map" | "loop" | "moe";
const COPY = {
  en: { title: "four paths, one harness", hint: "map · loop · active parameters", map: "map", loop: "harness loop", moe: "MoE", foundations: "foundations", harness: "harness", training: "training", metal: "metal", user: "user", thread: "thread", model: "model", tools: "tools", memory: "memory", total: "48B total", active: "3B active" },
  es: { title: "cuatro vías, un arnés", hint: "mapa · bucle · parámetros activos", map: "mapa", loop: "bucle del arnés", moe: "MoE", foundations: "fundamentos", harness: "arnés", training: "entrenamiento", metal: "metal", user: "usuario", thread: "hilo", model: "modelo", tools: "tools", memory: "memoria", total: "48B totales", active: "3B activos" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("map");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.foundations }, { color: P.violet, label: t.harness }, { color: P.amber, label: t.training }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "map", label: t.map, tone: P.teal }, { value: "loop", label: t.loop, tone: P.violet }, { value: "moe", label: t.moe, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "map" && <>{[[t.foundations, P.teal, -1.8], [t.harness, P.violet, 0], [t.training, P.amber, 1.8], [t.metal, P.rose, 0]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, i === 3 ? -0.7 : 0.25, 0]} size={[1.35, i === 3 ? 0.65 : 0.8, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, i === 3 ? -0.25 : 0.8, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag>{i < 3 && <Ribbon points={[[x as number + 0.7, 0.25, 0], [x as number + 1.05, 0.25, 0]]} color={color as string} radius={0.035} opacity={0.75} />}</group>)}</>}
        {mode === "loop" && <><Halo position={[0, 0.1, 0]} radius={1.35} color={P.violet} opacity={0.3} spin={0.12} /><Node3D position={[0, 0.1, 0]} color={P.violet} radius={0.22} pulse={0.35} /><Tag position={[0, 0.7, 0.15]} tone="violet">{t.model}</Tag>{[[t.user, P.teal, -1.7, 0.1], [t.thread, P.amber, 0, -1.0], [t.tools, P.rose, 1.7, 0.1]].map(([label, color, x, y], i) => <group key={label as string}><Node3D position={[x as number, y as number, 0]} color={color as string} radius={0.15} matte /><Tag position={[x as number, (y as number) + 0.35, 0.15]} tone={(["teal", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag><Ribbon points={[[x as number * 0.55, y as number * 0.45, 0], [x as number * 0.9, y as number * 0.9, 0]]} color={color as string} radius={0.035} opacity={0.75} /></group>)}</>}
        {mode === "moe" && <><Slab position={[-1.5, 0.2, 0]} size={[1.8, 1.25, 0.12]} color={P.teal} fill={0.2} /><Tag position={[-1.5, 0.85, 0.15]} tone="teal">{t.memory}</Tag><Ribbon points={[[-0.4, 0.2, 0], [0.4, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.5, 0.2, 0]} size={[1.8, 1.25, 0.12]} color={P.amber} fill={0.24} /><Tag position={[1.5, 0.85, 0.15]} tone="amber">{t.active}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.total} · atención densa</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

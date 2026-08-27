"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "compact" | "safeguard" | "reset";
const COPY = {
  en: { title: "compaction preserves the session", hint: "summary · safeguard · reset", compact: "compact", safeguard: "safeguard", reset: "reset", old: "old turns", recent: "recent", summary: "summary", history: "full history", quality: "quality gate", same: "same session", fresh: "new session", tool: "tool pair" },
  es: { title: "compactar conserva la sesión", hint: "resumen · safeguard · reset", compact: "compacta", safeguard: "safeguard", reset: "reset", old: "turnos viejos", recent: "recientes", summary: "resumen", history: "historial completo", quality: "puerta de calidad", same: "misma sesión", fresh: "sesión nueva", tool: "par tool" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("compact");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.recent }, { color: P.violet, label: t.summary }, { color: P.amber, label: t.history }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "compact", label: t.compact, tone: P.teal }, { value: "safeguard", label: t.safeguard, tone: P.violet }, { value: "reset", label: t.reset, tone: P.rose }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "compact" && <><Slab position={[-1.7, 0.2, 0]} size={[1.75, 1.1, 0.12]} color={P.violet} fill={0.22} /><Tag position={[-1.7, 0.83, 0.15]} tone="violet">{t.old}</Tag><Ribbon points={[[-0.65, 0.2, 0], [0.65, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.75, 1.1, 0.12]} color={P.teal} fill={0.24} /><Tag position={[1.7, 0.83, 0.15]} tone="teal">{t.summary}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.recent} intactos · {t.tool} no se separa</Tag></>}
        {mode === "safeguard" && <><Halo position={[0, 0.2, 0]} radius={1.25} color={P.violet} opacity={0.35} spin={0.12} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[0, 0.8, 0.15]} tone="violet">{t.quality}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">headings</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">pending asks</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">si falla, conserva el original</Tag></>}
        {mode === "reset" && <><Slab position={[-1.7, 0.2, 0]} size={[1.75, 0.9, 0.12]} color={P.teal} fill={0.24} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">/compact</Tag><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.18} pulse={0.3} /><Tag position={[0, 0.72, 0.15]} tone="violet">{t.same}</Tag><Slab position={[1.7, 0.2, 0]} size={[1.75, 0.9, 0.12]} color={P.rose} fill={0.24} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">/new</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">/compact ≠ {t.fresh}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

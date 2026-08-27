"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "ownership" | "tests" | "waist";
const COPY = {
  en: { title: "the narrowest owner wins", hint: "subsystems · mirror tests · narrow waist", ownership: "ownership", tests: "mirror tests", waist: "narrow waist", core: "agent core", plugin: "plugin", testsWord: "tests", docs: "docs", adapter: "adapter", all: "every call", change: "change", local: "local" },
  es: { title: "gana el dueño más estrecho", hint: "subsistemas · tests espejo · cintura estrecha", ownership: "ownership", tests: "tests espejo", waist: "cintura", core: "núcleo agente", plugin: "plugin", testsWord: "tests", docs: "docs", adapter: "adaptador", all: "cada llamada", change: "cambio", local: "local" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("ownership");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.core }, { color: P.violet, label: t.plugin }, { color: P.amber, label: t.testsWord }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "ownership", label: t.ownership, tone: P.teal }, { value: "tests", label: t.tests, tone: P.amber }, { value: "waist", label: t.waist, tone: P.violet }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "ownership" && <><Slab position={[-1.7, 0.2, 0]} size={[1.7, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.core}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.7, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.adapter}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">preferir el plugin al branch global</Tag></>}
        {mode === "tests" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.change}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.testsWord}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">fuente y test viajan juntos</Tag></>}
        {mode === "waist" && <><Halo position={[0, 0.2, 0]} radius={1.15} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.35} /><Tag position={[0, 0.78, 0.15]} tone="violet">AIAgent</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">CLI</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">gateway</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">una rama aquí afecta {t.all}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

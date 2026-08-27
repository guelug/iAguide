"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "bootstrap" | "files" | "scope";
const COPY = {
  en: { title: "the workspace is the agent's house", hint: "bootstrap · files · scope", bootstrap: "bootstrap", files: "files", scope: "scope", soul: "SOUL.md", agents: "AGENTS.md", memory: "MEMORY.md", user: "USER.md", skills: "skills", inject: "inject", host: "host", sandbox: "sandbox", cwd: "cwd", config: "config" },
  es: { title: "el workspace es la casa del agente", hint: "bootstrap · ficheros · alcance", bootstrap: "bootstrap", files: "ficheros", scope: "alcance", soul: "SOUL.md", agents: "AGENTS.md", memory: "MEMORY.md", user: "USER.md", skills: "skills", inject: "inyecta", host: "host", sandbox: "sandbox", cwd: "cwd", config: "config" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("bootstrap");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.soul }, { color: P.violet, label: t.memory }, { color: P.amber, label: t.skills }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "bootstrap", label: t.bootstrap, tone: P.teal }, { value: "files", label: t.files, tone: P.violet }, { value: "scope", label: t.scope, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "bootstrap" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.cwd}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.inject}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">primer turno → bootstrap</Tag></>}
        {mode === "files" && <>{[[t.agents, P.teal, -1.8], [t.soul, P.violet, -0.6], [t.user, P.amber, 0.6], [t.memory, P.rose, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.2, 0.78, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.72, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">cada sesión carga instrucciones; MEMORY es opcional</Tag></>}
        {mode === "scope" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.amber} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="amber">{t.host}</Tag><Ribbon points={[[-1.9, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-1.9, 0.65, 0.15]} tone="teal" size="xs">{t.cwd}</Tag><Ribbon points={[[0.45, 0.2, 0], [1.9, 0.2, 0]]} color={P.rose} radius={0.045} opacity={0.85} /><Tag position={[1.9, 0.65, 0.15]} tone="rose" size="xs">{t.sandbox}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">workspace ≠ sandbox duro</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

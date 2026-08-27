"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "layers" | "explain" | "elevated";
const COPY = {
  en: { title: "three controls, three answers", hint: "where · what · escape hatch", layers: "layers", explain: "explain", elevated: "elevated", sandbox: "sandbox", policy: "tool policy", exec: "exec", where: "where tools run", what: "what exists", deny: "deny wins", host: "host", container: "container", blocked: "blocked" },
  es: { title: "tres controles, tres respuestas", hint: "dónde · qué · escape hatch", layers: "capas", explain: "explica", elevated: "elevated", sandbox: "sandbox", policy: "política tools", exec: "exec", where: "dónde corren", what: "qué existe", deny: "deny gana", host: "host", container: "contenedor", blocked: "bloqueado" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("layers");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.sandbox }, { color: P.violet, label: t.policy }, { color: P.rose, label: t.exec }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "layers", label: t.layers, tone: P.teal }, { value: "explain", label: t.explain, tone: P.violet }, { value: "elevated", label: t.elevated, tone: P.rose }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "layers" && <><Slab position={[0, 0.35, 0]} size={[4.7, 1.65, 0.12]} color={P.teal} fill={0.12} rim={0.7} /><Slab position={[0, 0.35, 0.08]} size={[3.65, 1.12, 0.08]} color={P.violet} fill={0.16} /><Slab position={[0, 0.35, 0.16]} size={[2.55, 0.6, 0.06]} color={P.rose} fill={0.23} /><Tag position={[-1.7, 0.82, 0.2]} tone="teal" size="xs">{t.sandbox} · {t.where}</Tag><Tag position={[0, 0.62, 0.25]} tone="violet" size="xs">{t.policy} · {t.what}</Tag><Tag position={[1.15, 0.42, 0.3]} tone="rose" size="xs">{t.exec}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">deny → hard stop</Tag></>}
        {mode === "explain" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.23} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.where}</Tag><Ribbon points={[[-0.7, 0.2, 0], [0.7, 0.2, 0]]} color={P.lineStrong} radius={0.045} opacity={0.8} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.23} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.what}</Tag><Node3D position={[0, -0.85, 0]} color={P.amber} radius={0.16} pulse={0.3} /><Tag position={[0, -0.42, 0.15]} tone="amber" size="xs">sandbox explain</Tag></>}
        {mode === "elevated" && <><Halo position={[0, 0.2, 0]} radius={1.25} color={P.rose} opacity={0.34} spin={0.12} /><Node3D position={[0, 0.2, 0]} color={P.rose} radius={0.22} pulse={0.45} /><Tag position={[0, 0.8, 0.15]} tone="rose">{t.exec}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Slab position={[-2, 0.2, 0]} size={[1.35, 0.65, 0.1]} color={P.teal} fill={0.24} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">{t.container}</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Slab position={[2, 0.2, 0]} size={[1.35, 0.65, 0.1]} color={P.rose} fill={0.24} /><Tag position={[2, 0.65, 0.15]} tone="rose" size="xs">{t.host}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.deny}: elevated no otorga tools</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

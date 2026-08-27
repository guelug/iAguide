"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "layers" | "groups" | "decision";
const COPY = {
  en: { title: "tools survive a policy funnel", hint: "inventory · groups · deny wins", layers: "funnel", groups: "groups", decision: "decision", builtin: "builtin", profile: "profile", policy: "allow / deny", sandbox: "sandbox", plugin: "plugin", model: "model sees", runtime: "runtime", fs: "group:fs", web: "group:web", deny: "deny", allow: "allow", block: "blocked" },
  es: { title: "las tools pasan por un embudo de política", hint: "inventario · grupos · deny gana", layers: "embudo", groups: "grupos", decision: "decisión", builtin: "builtin", profile: "perfil", policy: "allow / deny", sandbox: "sandbox", plugin: "plugin", model: "modelo ve", runtime: "runtime", fs: "group:fs", web: "group:web", deny: "deny", allow: "allow", block: "bloqueada" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("layers");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.builtin }, { color: P.violet, label: t.policy }, { color: P.rose, label: t.block }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "layers", label: t.layers, tone: P.teal }, { value: "groups", label: t.groups, tone: P.violet }, { value: "decision", label: t.decision, tone: P.rose }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "layers" && <><Slab position={[0, 0.45, 0]} size={[4.5, 0.45, 0.1]} color={P.teal} fill={0.22} /><Slab position={[0, -0.05, 0]} size={[3.45, 0.45, 0.1]} color={P.violet} fill={0.22} /><Slab position={[0, -0.55, 0]} size={[2.25, 0.45, 0.1]} color={P.rose} fill={0.25} /><Tag position={[0, 0.8, 0.15]} tone="teal" size="xs">{t.builtin}</Tag><Tag position={[0, 0.3, 0.15]} tone="violet" size="xs">{t.profile}</Tag><Tag position={[0, -0.2, 0.15]} tone="rose" size="xs">{t.policy}</Tag><Node3D position={[0, -1.0, 0]} color={P.amber} radius={0.16} pulse={0.3} /><Tag position={[0, -0.58, 0.15]} tone="amber" size="xs">{t.model} → tools</Tag></>}
        {mode === "groups" && <>{[[t.runtime, P.teal, -1.8], [t.fs, P.violet, 0], [t.web, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag><Node3D position={[x as number, -0.2, 0]} color={color as string} radius={0.12} matte /></group>)}<Tag position={[0, -0.85, 0.15]} tone="muted" size="xs">group:* = atajo, no permiso extra</Tag></>}
        {mode === "decision" && <><Slab position={[-1.8, 0.25, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.8, 0.82, 0.15]} tone="teal">{t.allow}</Tag><Ribbon points={[[-0.8, 0.25, 0], [0.8, 0.25, 0]]} color={P.rose} radius={0.055} opacity={0.9} /><Slab position={[1.8, 0.25, 0]} size={[1.65, 0.9, 0.12]} color={P.rose} fill={0.28} /><Tag position={[1.8, 0.82, 0.15]} tone="rose">{t.deny}</Tag><Halo position={[1.8, 0.25, 0]} radius={0.65} color={P.rose} opacity={0.25} spin={0.15} /><Tag position={[0, -0.75, 0.15]} tone="rose" size="xs">{t.deny} siempre gana</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "schema" | "roles" | "parser";
const COPY = {
  en: { title: "function calling is a learned protocol", hint: "schema · roles · parser", schema: "schema", roles: "roles", parser: "parser", prompt: "prompt", special: "special tokens", args: "JSON args", tool: "tool", observe: "observe", valid: "valid", broken: "broken" },
  es: { title: "function calling es un protocolo aprendido", hint: "esquema · roles · parser", schema: "esquema", roles: "roles", parser: "parser", prompt: "prompt", special: "tokens especiales", args: "args JSON", tool: "tool", observe: "observa", valid: "válido", broken: "roto" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("schema");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.schema }, { color: P.violet, label: t.special }, { color: P.amber, label: t.tool }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "schema", label: t.schema, tone: P.teal }, { value: "roles", label: t.roles, tone: P.violet }, { value: "parser", label: t.parser, tone: P.rose }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "schema" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.prompt}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.schema}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">el esquema consume contexto antes del turno</Tag></>}
    {mode === "roles" && <>{[[t.args, P.teal, -1.7], [t.tool, P.amber, 0], [t.observe, P.violet, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "amber", "violet"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Ribbon points={[[-1, 0.2, 0], [1, 0.2, 0]]} color={P.lineStrong} radius={0.04} opacity={0.7} /><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">assistant → tool → observation</Tag></>}
    {mode === "parser" && <><Node3D position={[-1.7, 0.2, 0]} color={P.teal} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.valid}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Node3D position={[1.7, 0.2, 0]} color={P.rose} radius={0.2} pulse={0.45} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">{t.broken}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">misma plantilla al entrenar y servir</Tag></>}
  </PointerTilt></Stage></Figure>;
}

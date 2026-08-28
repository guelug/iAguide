"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "bills" | "turn" | "limits";
const COPY = {
  en: { title: "an agent turn can create three bills", hint: "subscription · tokens · electricity", bills: "bills", turn: "agent turn", limits: "limits", subscription: "subscription", tokens: "API tokens", power: "electricity", tools: "N tool calls", quota: "quota", 429: "429", 402: "402", cache: "prompt cache" },
  es: { title: "un turno de agente puede crear tres facturas", hint: "suscripción · tokens · electricidad", bills: "facturas", turn: "turno agente", limits: "límites", subscription: "suscripción", tokens: "tokens API", power: "electricidad", tools: "N llamadas tool", quota: "cuota", 429: "429", 402: "402", cache: "caché prompt" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("bills");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.subscription }, { color: P.violet, label: t.tokens }, { color: P.amber, label: t.power }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "bills", label: t.bills, tone: P.teal }, { value: "turn", label: t.turn, tone: P.violet }, { value: "limits", label: t.limits, tone: P.rose }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "bills" && <>{[[t.subscription, P.teal, -1.7], [t.tokens, P.violet, 0], [t.power, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">cuota ≠ API ≠ vatios</Tag></>}
    {mode === "turn" && <><Node3D position={[-1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">1 prompt</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.tools}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">coste = prompt + N × tools</Tag></>}
    {mode === "limits" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.rose} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="rose">{t.quota}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.4} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t[429]} ↔ {t[402]}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.cache} muerta cambia la factura</Tag></>}
  </PointerTilt></Stage></Figure>;
}

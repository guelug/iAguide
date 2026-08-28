"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Lattice, Motes, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "token" | "amortize" | "open";
const COPY = {
  en: { label: "the cheapest token is the useful one", hint: "per-token · amortize · open vs closed", token: "per token", amortize: "amortize", open: "open vs closed", input: "input", output: "output", fixed: "fixed cost", uses: "uses", openModel: "open model", closedModel: "closed api", cache: "cache" },
  es: { label: "el token más barato es el que sirve", hint: "por token · amortiza · abierto vs cerrado", token: "por token", amortize: "amortiza", open: "abierto vs cerrado", input: "entrada", output: "salida", fixed: "coste fijo", uses: "usos", openModel: "modelo abierto", closedModel: "api cerrada", cache: "caché" },
};
export default function Visual() { const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("token"); return <Figure label={t.label} hint={t.hint} legend={[{ color: P.teal, label: t.input }, { color: P.violet, label: t.output }, { color: P.amber, label: t.cache }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "token", label: t.token, tone: P.teal }, { value: "amortize", label: t.amortize, tone: P.amber }, { value: "open", label: t.open, tone: P.violet }]} ariaLabel={t.label} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
{mode === "token" && <><Slab position={[-1.8, 0.5, 0]} size={[1.8, 0.8, 0.12]} color={P.teal} fill={0.25} /><Tag position={[-1.8, 1.05, 0.15]} tone="teal">{t.input}</Tag><Ribbon points={[[-0.8, 0.5, 0], [0.3, 0.5, 0]]} color={P.lineStrong} radius={0.04} opacity={0.8} /><Slab position={[1.3, 0.5, 0]} size={[1.8, 0.8, 0.12]} color={P.violet} fill={0.25} /><Tag position={[1.3, 1.05, 0.15]} tone="violet">{t.output}</Tag><Lattice cells={Array.from({ length: 16 }, (_, i) => ({ position: [-2.4 + (i % 8) * 0.6, -0.7, 0.15] as [number, number, number], color: i < 10 ? P.teal : P.amber }))} size={0.12} opacity={0.9} matte /><Tag position={[0, -1.2, 0.15]} tone="amber" size="xs">input + output + {t.cache}</Tag></>}
{mode === "amortize" && <><Slab position={[-2.0, 0.6, 0]} size={[1.7, 1.1, 0.14]} color={P.amber} fill={0.3} rim={0.7} /><Tag position={[-2.0, 1.3, 0.15]} tone="amber">{t.fixed}</Tag>{[0,1,2,3,4].map(i => <Ribbon key={i} points={[[-1.1, 0.6, 0], [0.0 + i * 0.6, -0.2, 0]]} color={P.teal} radius={0.025} opacity={0.65} />)}<Wire points={[[0, -0.6, 0], [2.7, -0.6, 0]]} color={P.lineStrong} opacity={0.6} /><Tag position={[1.2, -1.05, 0.15]} tone="teal" size="xs">{t.uses} ↑ · coste/unidad ↓</Tag></>}
{mode === "open" && <><Slab position={[-1.7, 0.4, 0]} size={[2.1, 1.5, 0.14]} color={P.teal} fill={0.2} /><Tag position={[-1.7, 1.35, 0.15]} tone="teal">{t.openModel}</Tag><Slab position={[1.7, 0.4, 0]} size={[2.1, 1.5, 0.14]} color={P.violet} fill={0.2} /><Tag position={[1.7, 1.35, 0.15]} tone="violet">{t.closedModel}</Tag><Halo position={[-1.7, 0.4, 0]} radius={0.85} color={P.amber} opacity={0.4} spin={0.15} /><Tag position={[0, -1.1, 0.15]} tone="muted" size="xs">control vs convenience</Tag></>}
</PointerTilt></Stage></Figure>; }

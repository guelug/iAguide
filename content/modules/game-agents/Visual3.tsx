"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "loop" | "latency" | "guard";
const COPY = {
  en: { title: "a game agent acts inside a legal action set", hint: "loop · latency · guard", loop: "loop", latency: "latency", guard: "guard", state: "game state", thought: "thought", action: "action", observe: "observe", fps: "30 FPS", turn: "turn-based", script: "script fallback", legal: "legal actions", reject: "reject" },
  es: { title: "un agente de juego actúa dentro de acciones legales", hint: "bucle · latencia · guardia", loop: "bucle", latency: "latencia", guard: "guardia", state: "estado juego", thought: "piensa", action: "acción", observe: "observa", fps: "30 FPS", turn: "por turnos", script: "fallback script", legal: "acciones legales", reject: "rechazar" },
};
export default function Visual3() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("loop");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.state }, { color: P.violet, label: t.thought }, { color: P.amber, label: t.action }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "loop", label: t.loop, tone: P.teal }, { value: "latency", label: t.latency, tone: P.violet }, { value: "guard", label: t.guard, tone: P.rose }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "loop" && <>{[[t.state, P.teal, -1.7], [t.thought, P.violet, 0], [t.action, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Ribbon points={[[1.7, 0.2, 0], [-1.7, 0.2, 0]]} color={P.violet} radius={0.04} opacity={0.75} /><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.state} → {t.thought} → {t.action} → {t.observe}</Tag></>}
    {mode === "latency" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.rose} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="rose">{t.fps}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.teal} radius={0.2} pulse={0.35} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.turn}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">30 FPS no deja tiempo para un LLM</Tag></>}
    {mode === "guard" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.legal}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.rose} radius={0.05} opacity={0.9} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.rose} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="rose">{t.reject}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">si tarda demasiado → {t.script}</Tag></>}
  </PointerTilt></Stage></Figure>;
}

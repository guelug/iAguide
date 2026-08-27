"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "paths" | "adapter" | "deadline";
const COPY = {
  en: { title: "platform adapter, shared waist", hint: "plugin · contract · deadline", paths: "paths", adapter: "adapter", deadline: "deadline", user: "user", platform: "platform", gateway: "Gateway", agent: "AIAgent", plugin: "plugin", builtin: "built-in", connect: "connect", send: "send", ack: "ack now", later: "answer later" },
  es: { title: "adaptador de plataforma, cintura compartida", hint: "plugin · contrato · deadline", paths: "vías", adapter: "adaptador", deadline: "deadline", user: "usuario", platform: "plataforma", gateway: "Gateway", agent: "AIAgent", plugin: "plugin", builtin: "integrado", connect: "conecta", send: "envía", ack: "ack ya", later: "respuesta después" },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("paths");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.plugin }, { color: P.violet, label: t.gateway }, { color: P.amber, label: t.agent }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "paths", label: t.paths, tone: P.teal }, { value: "adapter", label: t.adapter, tone: P.violet }, { value: "deadline", label: t.deadline, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "paths" && <><Slab position={[-1.7, 0.2, 0]} size={[1.7, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.plugin}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.7, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.builtin}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">plugin: cero core · built-in: veinte ficheros</Tag></>}
        {mode === "adapter" && <><Slab position={[-1.7, 0.2, 0]} size={[1.45, 0.8, 0.12]} color={P.teal} fill={0.24} /><Tag position={[-1.7, 0.72, 0.15]} tone="teal">{t.platform}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[1.7, 0.72, 0.15]} tone="amber">{t.gateway}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">connect · disconnect · send · handleMessage</Tag></>}
        {mode === "deadline" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.ack}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.later}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">WeCom: cinco segundos no son un loop</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

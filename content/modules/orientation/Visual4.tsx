"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "roles" | "window" | "agent";
const COPY = {
  en: {
    title: "the thread is glued back every call",
    hint: "roles · window · agent loop",
    roles: "roles",
    window: "window",
    agent: "agent",
    system: "system",
    user: "user",
    assistant: "assistant",
    tool: "tool",
    budget: "budget",
    chat: "chat",
    loop: "loop",
  },
  es: {
    title: "el hilo se pega en cada llamada",
    hint: "roles · ventana · bucle agente",
    roles: "roles",
    window: "ventana",
    agent: "agente",
    system: "system",
    user: "user",
    assistant: "assistant",
    tool: "tool",
    budget: "presupuesto",
    chat: "chat",
    loop: "bucle",
  },
};

export default function Visual4() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("roles");
  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.system },
        { color: P.violet, label: t.assistant },
        { color: P.amber, label: t.tool },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "roles", label: t.roles, tone: P.teal },
            { value: "window", label: t.window, tone: P.violet },
            { value: "agent", label: t.agent, tone: P.amber },
          ]}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
        <Motes count={90} radius={7} opacity={0.28} />
        <PointerTilt amount={0.07}>
          {mode === "roles" && (
            <>
              {[
                [t.system, P.teal, "teal", -1.8],
                [t.user, P.violet, "violet", -0.6],
                [t.assistant, P.amber, "amber", 0.6],
                [t.tool, P.rose, "rose", 1.8],
              ].map(([label, color, tone, x], i) => (
                <group key={label as string}>
                  <Slab position={[x as number, 0.12, 0]} size={[1.05, 0.85, 0.12]} color={color as string} fill={0.22} />
                  <Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">
                    {label as string}
                  </Tag>
                </group>
              ))}
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                una cadena, no un cajón
              </Tag>
            </>
          )}
          {mode === "window" && (
            <>
              <Slab position={[0, 0.1, 0]} size={[5.2, 0.7, 0.1]} color={P.violet} fill={0.1} />
              <Slab position={[-1.4, 0.1, 0.08]} size={[2.2, 0.55, 0.1]} color={P.teal} fill={0.28} />
              <Slab position={[1.15, 0.1, 0.08]} size={[1.6, 0.55, 0.1]} color={P.amber} fill={0.28} />
              <Tag position={[-1.4, 0.78, 0.15]} tone="teal" size="xs">
                {t.system} + hilo
              </Tag>
              <Tag position={[1.15, 0.78, 0.15]} tone="amber" size="xs">
                respuesta
              </Tag>
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                {t.budget}: 4k · 32k · 128k
              </Tag>
            </>
          )}
          {mode === "agent" && (
            <>
              <Node3D position={[-1.7, 0.15, 0]} color={P.violet} radius={0.2} pulse={0.3} />
              <Tag position={[-1.7, 0.8, 0.15]} tone="violet" size="xs">
                {t.chat}
              </Tag>
              <Ribbon points={[[-0.85, 0.15, 0], [0.85, 0.15, 0]]} color={P.amber} radius={0.045} opacity={0.85} />
              <Halo position={[1.7, 0.15, 0]} radius={0.7} color={P.amber} opacity={0.32} spin={0.18} />
              <Node3D position={[1.7, 0.15, 0]} color={P.amber} radius={0.18} />
              <Flow points={[[1.7, 0.55, 0], [1.7, 0.85, 0], [0.2, 0.85, 0], [-1.7, 0.55, 0]]} color={P.rose} count={4} />
              <Tag position={[1.7, 0.8, 0.15]} tone="amber" size="xs">
                {t.loop}
              </Tag>
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                escribe la petición · el código la corre
              </Tag>
            </>
          )}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

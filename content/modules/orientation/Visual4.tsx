"use client";
import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire } from "@/components/three/atoms";
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
    response: "answer",
    chat: "chat",
    loop: "loop",
    rolesNote: "one chain, not a drawer",
    windowNote: "what falls off the left is gone",
    agentNote: "the model writes the request · code runs it",
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
    response: "respuesta",
    chat: "chat",
    loop: "bucle",
    rolesNote: "una cadena, no un cajón",
    windowNote: "lo que sale por la izquierda se pierde",
    agentNote: "el modelo escribe la petición · el código la corre",
  },
};

/* Roles as beads threaded on one string — concatenated, not stored apart. */
function RolesScene({ t }: { t: (typeof COPY)["es"] }) {
  const beads: { label: string; color: string; tone: "teal" | "violet" | "amber" | "rose"; x: number; y: number }[] = [
    { label: t.system, color: P.teal, tone: "teal", x: -2.1, y: 0.34 },
    { label: t.user, color: P.violet, tone: "violet", x: -0.7, y: 0.08 },
    { label: t.assistant, color: P.amber, tone: "amber", x: 0.7, y: 0.34 },
    { label: t.tool, color: P.rose, tone: "rose", x: 2.1, y: 0.08 },
  ];
  const thread = beads.map((b) => [b.x, b.y, 0] as [number, number, number]);
  return (
    <>
      <Ribbon points={thread} color={P.inkSoft} radius={0.022} opacity={0.55} />
      <Flow points={thread} color={P.teal} count={5} speed={0.14} size={0.04} lineOpacity={0} />
      {beads.map((b) => (
        <group key={b.label} position={[b.x, b.y, 0]}>
          <mesh>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshStandardMaterial color={b.color} roughness={0.32} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
            <meshStandardMaterial color={P.paper} roughness={0.6} />
          </mesh>
          <Tag position={[0, 0.52, 0.15]} tone={b.tone} size="xs" center>
            {b.label}
          </Tag>
        </group>
      ))}
    </>
  );
}

/* The window as a physical container; old messages slide off the left edge. */
function WindowScene({ t }: { t: (typeof COPY)["es"] }) {
  return (
    <>
      <Slab position={[0.3, 0.05, 0]} size={[4.4, 1.0, 0.1]} color={P.violet} fill={0.08} rim={0.8} />
      <Slab position={[-0.85, 0.05, 0.09]} size={[1.7, 0.72, 0.1]} color={P.teal} fill={0.3} />
      <Slab position={[1.25, 0.05, 0.09]} size={[1.9, 0.72, 0.1]} color={P.amber} fill={0.3} />
      <group position={[-2.85, 0.05, 0]}>
        <Slab position={[0, 0, 0]} size={[0.9, 0.72, 0.1]} color={P.rose} fill={0.12} rim={0.35} />
        <Flow points={[[0.55, 0, 0], [-0.75, 0, 0]]} color={P.rose} count={3} speed={0.2} />
      </group>
      <Tag position={[-0.85, 0.78, 0.15]} tone="teal" size="xs" center>
        {t.system} + hilo
      </Tag>
      <Tag position={[1.25, 0.78, 0.15]} tone="amber" size="xs" center>
        {t.response}
      </Tag>
      <Tag position={[0.3, -0.72, 0.15]} tone="violet" size="xs" center>
        {t.budget}: 4k · 32k · 128k
      </Tag>
    </>
  );
}

/* Chat and tool on a real circuit: the loop is drawn, not implied. */
function AgentScene({ t }: { t: (typeof COPY)["es"] }) {
  return (
    <>
      <group position={[-1.75, 0.1, 0]}>
        <Node3D position={[0, 0, 0]} color={P.violet} radius={0.22} pulse={0.3} />
        <Halo position={[0, 0, 0]} radius={0.4} color={P.violet} opacity={0.4} spin={0.14} />
        <Tag position={[0, 0.82, 0.15]} tone="violet" size="xs" center>
          {t.chat}
        </Tag>
      </group>
      <Flow points={[[-1.4, 0.3, 0], [-0.5, 0.62, 0], [0.5, 0.62, 0], [1.4, 0.3, 0]]} color={P.amber} count={4} speed={0.22} />
      <group position={[1.75, 0.1, 0]}>
        <RoundedBox args={[0.6, 0.6, 0.3]} radius={0.1} smoothness={4}>
          <meshStandardMaterial color={P.amber} roughness={0.32} metalness={0.1} />
        </RoundedBox>
        <Wire points={[[-0.44, 0.16, 0], [-0.3, 0.16, 0]]} color={P.amberDeep} width={2} />
        <Wire points={[[0.3, -0.16, 0], [0.44, -0.16, 0]]} color={P.amberDeep} width={2} />
        <Halo position={[0, 0, 0]} radius={0.52} color={P.amber} opacity={0.35} spin={-0.16} />
        <Tag position={[0, 0.82, 0.15]} tone="amber" size="xs" center>
          {t.tool}
        </Tag>
      </group>
      <Flow points={[[1.4, -0.15, 0], [0.5, -0.5, 0], [-0.5, -0.5, 0], [-1.4, -0.15, 0]]} color={P.rose} count={4} speed={0.22} />
      <Tag position={[0, -0.95, 0.15]} tone="muted" size="xs" center>
        {t.loop}
      </Tag>
    </>
  );
}

export default function Visual4() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("roles");
  const note = mode === "roles" ? t.rolesNote : mode === "window" ? t.windowNote : t.agentNote;
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
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }} background={P.paper}>
        <Motes count={110} radius={7} color={P.lineStrong} size={0.024} opacity={0.22} />
        <PointerTilt amount={0.08}>
          {mode === "roles" && <RolesScene t={t} />}
          {mode === "window" && <WindowScene t={t} />}
          {mode === "agent" && <AgentScene t={t} />}
          <ShadowBlob position={[0, -1.02, 0]} scale={4.2} opacity={0.07} />
          <Tag position={[0, -1.28, 0.15]} tone="muted" size="xs" center>
            {note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

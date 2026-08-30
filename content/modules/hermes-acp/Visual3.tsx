"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Node3D, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Three lanes that all say "ACP", told by two questions.
 *
 * Follow the lit core to see who actually runs the agent loop; follow the
 * arrow to see who opened the conversation. That is the whole section:
 * Hermes *is* the server wrapping its own AIAgent, openclaw acp forwards
 * to a Gateway that owns the loop somewhere else, and /acp spawn points
 * the other way entirely — OpenClaw launching an external harness.
 *
 * Facts and transports are from the lesson's cited pages: stdio into
 * hermes acp, WebSocket from the OpenClaw bridge to the Gateway, and
 * acpx as the backend plugin that spawns Claude Code or Codex.
 */

type Lane = "hermes" | "bridge" | "spawn";

/** A box on a lane. `core` marks the one that runs the loop. */
type Box = { label: string; core?: boolean; color: string; w?: number };

const COPY = {
  en: {
    title: "who runs the loop, and who called first",
    hint: "the lit core is the agent loop · the arrow is who opened the conversation",
    hermes: "hermes acp",
    bridge: "openclaw acp",
    spawn: "/acp spawn",
    legendCore: "runs the loop",
    legendPass: "forwards only",
    legendDir: "who called first",
    ide: "IDE / ACP client",
    gateway: "Gateway",
    harness: "Claude Code · Codex",
    stdio: "stdio",
    ws: "WebSocket",
    acpx: "@openclaw/acpx",
    loop: "AIAgent",
    session: "session key",
    task: "background task",
    hermesNote:
      "Hermes is the server. HermesACPAgent wraps a live AIAgent, so the loop runs right here, in-process, at the end of a stdio pipe.",
    bridgeNote:
      "a Gateway-backed bridge, not a full native ACP runtime. It takes the stdio connection and forwards prompts over WebSocket, mapping ACP sessions onto Gateway session keys — the loop is downstream, not in the bridge.",
    spawnNote:
      "the inverse direction. Here OpenClaw is the one calling: it launches an external code harness through the acpx backend plugin and tracks each spawn as a background task. Hermes fits in neither of OpenClaw's two boxes.",
  },
  es: {
    title: "quién corre el bucle, y quién llamó primero",
    hint: "el núcleo encendido es el bucle del agente · la flecha es quién abrió la conversación",
    hermes: "hermes acp",
    bridge: "openclaw acp",
    spawn: "/acp spawn",
    legendCore: "corre el bucle",
    legendPass: "solo reenvía",
    legendDir: "quién llamó primero",
    ide: "IDE / cliente ACP",
    gateway: "Gateway",
    harness: "Claude Code · Codex",
    stdio: "stdio",
    ws: "WebSocket",
    acpx: "@openclaw/acpx",
    loop: "AIAgent",
    session: "clave de sesión",
    task: "tarea de fondo",
    hermesNote:
      "Hermes es el servidor. HermesACPAgent envuelve un AIAgent vivo, así que el bucle corre aquí mismo, in-process, al final de una tubería stdio.",
    bridgeNote:
      "un puente respaldado por el Gateway, no un runtime ACP nativo completo. Coge la conexión stdio y reenvía prompts por WebSocket, mapeando sesiones ACP a claves de sesión del Gateway — el bucle está aguas abajo, no en el puente.",
    spawnNote:
      "la dirección inversa. Aquí quien llama es OpenClaw: lanza un harness de código externo por el plugin de backend acpx y sigue cada spawn como tarea de fondo. Hermes no cabe en ninguna de las dos cajas de OpenClaw.",
  },
};

/** One box, with an optional loop burning inside it. */
function Unit({
  position,
  box,
  active,
  coreLabel,
}: {
  position: V3;
  box: Box;
  active: boolean;
  coreLabel: string;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, active ? 0.16 : 0, 6, dt);
  });

  const w = box.w ?? 1.9;

  return (
    <group ref={ref} position={position}>
      <RoundedBox
        args={[w, box.core ? 1.1 : 0.62, 1.5]}
        radius={0.07}
        smoothness={3}
        position={[0, (box.core ? 0.55 : 0.31) + 0.02, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={active ? box.color : P.sunken}
          transparent
          opacity={box.core ? 0.34 : 0.95}
          roughness={0.36}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>

      {/* A box that runs the loop gets a core; one that forwards does not.
          That single difference is the answer to the whole section. */}
      {box.core ? (
        <group position={[0, 0.55, 0]}>
          <Node3D position={[0, 0, 0]} color={active ? box.color : P.line} radius={0.26} faceted pulse={active ? 0.2 : 0} />
          <Halo radius={0.5} color={active ? box.color : P.line} opacity={active ? 0.8 : 0.25} spin={0.4} />
          <Halo
            radius={0.66}
            color={active ? box.color : P.line}
            opacity={active ? 0.4 : 0.15}
            rotation={[0.7, 0.3, 0]}
            spin={-0.3}
          />
          <Tag position={[0, 0.95, 0]} tone={active ? "ink" : "muted"} size="xs" center>
            {coreLabel}
          </Tag>
        </group>
      ) : null}

      <Tag position={[0, -0.3, 0.9]} tone={active ? "ink" : "muted"} size="xs" center>
        {box.label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [lane, setLane] = useState<Lane>("hermes");

  /* Each lane is a different sentence about direction and ownership. */
  const LANES: Record<Lane, { boxes: Box[]; transports: string[]; reversed: boolean; color: string }> = {
    hermes: {
      boxes: [
        { label: t.ide, color: P.inkSoft },
        { label: "hermes acp", core: true, color: P.violet, w: 2.3 },
      ],
      transports: [t.stdio],
      reversed: false,
      color: P.violet,
    },
    bridge: {
      boxes: [
        { label: t.ide, color: P.inkSoft },
        { label: "openclaw acp", color: P.teal },
        { label: t.gateway, core: true, color: P.teal, w: 2.3 },
      ],
      transports: [t.stdio, t.ws],
      reversed: false,
      color: P.teal,
    },
    spawn: {
      boxes: [
        { label: "OpenClaw", color: P.amber },
        { label: t.acpx, color: P.amber },
        { label: t.harness, core: true, color: P.amber, w: 2.5 },
      ],
      transports: [t.acpx, t.task],
      reversed: true,
      color: P.amber,
    },
  };

  const active = LANES[lane];
  const note =
    lane === "hermes" ? t.hermesNote : lane === "bridge" ? t.bridgeNote : t.spawnNote;

  // Lanes are laid out left to right; the spawn lane reads right to left,
  // which is the point, so its arrow is flipped rather than its boxes.
  const xs = [-4.3, -0.4, 3.6];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.violet, label: t.legendCore },
        { color: P.line, label: t.legendPass },
        { color: P.amber, label: t.legendDir },
      ]}
      controls={
        <Switcher
          value={lane}
          onChange={setLane}
          options={[
            { value: "hermes", label: t.hermes, tone: P.violet },
            { value: "bridge", label: t.bridge, tone: P.teal },
            { value: "spawn", label: t.spawn, tone: P.amber },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[lane]}</strong> — {note}
        </>
      }
      height="h-[380px] md:h-[470px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={14} depth={8} y={-0.04} />
        <PlanTrace
          points={[
            [-6, 2.6],
            [6, 2.6],
          ]}
          y={-0.02}
          color={P.line}
          opacity={0.6}
        />

        {active.boxes.map((box, i) => (
          <Unit
            key={box.label}
            position={[xs[i] ?? 0, 0, 0]}
            box={box}
            active
            coreLabel={lane === "bridge" ? t.session : t.loop}
          />
        ))}

        {/* The transport between each pair, drawn as traffic so the
            direction is legible while it moves. */}
        {active.transports.map((label, i) => {
          const a = xs[i] ?? 0;
          const b = xs[i + 1] ?? 0;
          const from: V3 = active.reversed ? [b - 1.1, 0.36, 0] : [a + 1.1, 0.36, 0];
          const to: V3 = active.reversed ? [a + 1.1, 0.36, 0] : [b - 1.1, 0.36, 0];
          return (
            <group key={label}>
              <Flow
                points={[from, to]}
                color={active.color}
                count={3}
                speed={0.45}
                size={0.075}
                lineOpacity={0.5}
                width={1.8}
              />
              <Tag position={[(a + b) / 2, 0.95, 0]} tone="muted" size="xs" center>
                {label}
              </Tag>
            </group>
          );
        })}

        {/* Who opened the conversation, stated once, big. */}
        <group position={[0, 2.15, -1.9]}>
          <Tag position={[0, 0, 0]} tone="ink" size="xs" center>
            {t.legendDir}: {active.reversed ? "OpenClaw" : t.ide}
          </Tag>
          <AxisLine
            from={[active.reversed ? 2.6 : -2.6, -0.35, 0]}
            to={[active.reversed ? -2.6 : 2.6, -0.35, 0]}
            overrun={0.3}
            color={active.color}
            opacity={0.6}
            dashed={false}
          />
        </group>

        <IsoDust count={26} center={[0, 1.2, 0]} spread={[5, 0.7, 1]} />
      </Stage>
    </Figure>
  );
}

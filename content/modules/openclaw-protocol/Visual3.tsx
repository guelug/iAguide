"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * The handshake is mandatory, and skipping it fails in the least helpful
 * way available: the socket closes with no useful body.
 *
 * That is a hard failure to debug precisely because there is nothing to
 * read, so the scene shows the frame that never got answered rather than
 * an error message that does not exist. Send health first and watch the
 * pipe shut before it ever reaches the Gateway.
 */

type Order = "correct" | "wrong";

/** Frames a client sends, in the order it chose to send them. */
const CORRECT = ["connect", "health", "status", "agent"];
const WRONG = ["health", "connect", "status", "agent"];

const COPY = {
  en: {
    title: "the handshake is not optional",
    hint: "send health first and there is nothing to read afterwards",
    correct: "connect first",
    wrong: "health first",
    legendOk: "accepted",
    legendDropped: "never answered",
    legendClosed: "socket closed",
    client: "dashboard",
    gateway: "Gateway socket",
    first: "first frame",
    outcome: "outcome",
    open: "stays open",
    closed: "closed, no useful body",
    frames: "frames delivered",
    correctNote:
      "connect opens the contract, and health, status and agent all mean something afterwards. Every client and node on the Gateway socket is speaking this one protocol — which is why a Hermes MessageEvent does not belong in an OpenClaw WS client, and connect.challenge does not belong in hermes acp's stdout.",
    wrongNote:
      "the dashboard sent health before connect. The socket closes without a useful body, so there is no error text to search for and nothing in the response to explain it. The frames queued behind it are never answered either.",
  },
  es: {
    title: "el handshake no es opcional",
    hint: "manda health primero y después no hay nada que leer",
    correct: "connect primero",
    wrong: "health primero",
    legendOk: "aceptado",
    legendDropped: "sin respuesta",
    legendClosed: "socket cerrado",
    client: "dashboard",
    gateway: "socket del Gateway",
    first: "primer frame",
    outcome: "resultado",
    open: "sigue abierto",
    closed: "cerrado, sin cuerpo útil",
    frames: "frames entregados",
    correctNote:
      "connect abre el contrato, y health, status y agent significan algo después. Cada cliente y nodo en el socket del Gateway habla este mismo protocolo — por eso un MessageEvent de Hermes no pinta nada en un cliente WS de OpenClaw, ni connect.challenge en el stdout de hermes acp.",
    wrongNote:
      "el dashboard mandó health antes que connect. El socket cierra sin cuerpo útil, así que no hay texto de error que buscar ni nada en la respuesta que lo explique. Los frames que venían detrás tampoco se contestan.",
  },
};

/** A frame travelling the wire, or stopped where the socket shut. */
function Frame({
  label,
  index,
  delivered,
  color,
}: {
  label: string;
  index: number;
  delivered: boolean;
  color: string;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    if (delivered) {
      const t = ((clock.elapsedTime * 0.3 + index * 0.25) % 1);
      g.position.x = MathUtils.lerp(-3.4, 3.2, t);
    } else {
      // Nothing past the cut moves; that silence is the symptom.
      g.position.x = MathUtils.damp(g.position.x, -3.4 - index * 0.1, 5, dt);
    }
  });
  return (
    <group ref={ref} position={[-3.4, 0.45, -1.6 + index * 1.05]}>
      <RoundedBox args={[1.5, 0.24, 0.6]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial
          color={delivered ? color : P.sunken}
          transparent={!delivered}
          opacity={delivered ? 1 : 0.55}
          roughness={0.36}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>
      <Tag position={[0, 0.32, 0]} tone={delivered ? "ink" : "muted"} size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [order, setOrder] = useState<Order>("correct");

  const frames = order === "correct" ? CORRECT : WRONG;
  /* Only frames sent after a successful connect are answered at all. */
  const ok = order === "correct";
  const deliveredCount = ok ? frames.length : 0;
  const note = ok ? t.correctNote : t.wrongNote;
  const accent = ok ? P.teal : P.rose;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendOk },
        { color: P.line, label: t.legendDropped },
        { color: P.rose, label: t.legendClosed },
      ]}
      controls={
        <Switcher
          value={order}
          onChange={setOrder}
          options={[
            { value: "correct", label: t.correct, tone: P.teal },
            { value: "wrong", label: t.wrong, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                { label: t.first, value: frames[0], tone: ok ? "var(--teal)" : "var(--rose)" },
                {
                  label: t.outcome,
                  value: ok ? t.open : t.closed,
                  tone: ok ? "var(--teal)" : "var(--rose)",
                },
                {
                  label: t.frames,
                  value: `${deliveredCount} / ${frames.length}`,
                  tone: ok ? "var(--teal)" : "var(--rose)",
                },
              ]}
            />
          </div>
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
        <IsoFrame width={13} depth={9} y={-0.05} />

        {/* The client, and the wire it is shouting down. */}
        <group position={[-4.6, 0, 0]}>
          <RoundedBox args={[1.4, 0.7, 3.4]} radius={0.08} smoothness={3} position={[0, 0.35, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={P.surface} roughness={0.36} metalness={0.05} envMapIntensity={0.95} />
          </RoundedBox>
          <Tag position={[0, 1.05, 0]} tone="ink" size="xs" center>
            {t.client}
          </Tag>
        </group>

        {/* The pipe: intact, or cut where the socket closed. */}
        {[-1.6, -0.55, 0.5, 1.55].map((z, i) => (
          <RoundedBox
            key={z}
            args={[6.6, 0.1, 0.9]}
            radius={0.04}
            smoothness={3}
            position={[0, 0.12, z]}
            receiveShadow
          >
            <meshStandardMaterial
              color={ok || i === 0 ? P.sunken : P.roseWash}
              roughness={0.5}
            />
          </RoundedBox>
        ))}

        {frames.map((label, i) => (
          <Frame key={label} label={label} index={i} delivered={ok} color={P.teal} />
        ))}

        {/* Where it shuts, when it shuts. */}
        {!ok ? (
          <group position={[-1.4, 0.5, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <boxGeometry args={[0.14, 4.2, 0.14]} />
              <meshStandardMaterial color={P.rose} roughness={0.4} />
            </mesh>
            <Node3D position={[0, 0.55, -2.4]} color={P.rose} radius={0.15} />
            <Halo position={[0, 0.55, -2.4]} radius={0.44} color={P.rose} opacity={0.8} spin={0.6} />
            <Tag position={[0, 1.05, -2.4]} tone="rose" size="xs" center>
              {t.legendClosed}
            </Tag>
          </group>
        ) : null}

        {/* The Gateway end of the socket. */}
        <group position={[4.2, 0, 0]}>
          <RoundedBox args={[1.6, 0.9, 3.4]} radius={0.08} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>
            <meshStandardMaterial
              color={ok ? P.surface : P.sunken}
              transparent={!ok}
              opacity={ok ? 1 : 0.6}
              roughness={0.36}
              metalness={0.05}
              envMapIntensity={0.95}
            />
          </RoundedBox>
          <Tag position={[0, 1.25, 0]} tone={ok ? "ink" : "muted"} size="xs" center>
            {t.gateway}
          </Tag>
          {ok ? <Halo position={[0, 0.9, 0]} radius={0.6} color={P.teal} opacity={0.6} spin={0.3} /> : null}
        </group>

        <AxisLine
          from={[-3.8, 0.2, -2.4]}
          to={[3.4, 0.2, -2.4]}
          overrun={0.3}
          color={accent}
          opacity={0.45}
        />

        <IsoDust count={20} center={[0, 1, 0]} spread={[3.4, 0.6, 2]} />
      </Stage>
    </Figure>
  );
}

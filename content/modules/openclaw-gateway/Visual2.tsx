"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* openclaw-gateway: WS fan-in, auth tokens, presence halos. */
type Mode = "fanin" | "auth" | "presence";

const COPY = {
  en: {
    one_gateway_many_clients: "one gateway, many clients",
    ws_fan_in_tokens_presence: "ws fan-in · tokens · presence",
    fanin: "fan-in",
    auth: "auth",
    presence: "presence",
    ws_client: "ws client",
    token: "token",
    device_code: "device code",
    online: "online",
    last_seen: "last seen",
  },
  es: {
    one_gateway_many_clients: "un gateway, muchos clientes",
    ws_fan_in_tokens_presence: "fan-in ws · tokens · presencia",
    fanin: "fan-in",
    auth: "auth",
    presence: "presencia",
    ws_client: "cliente ws",
    token: "token",
    device_code: "device code",
    online: "conectado",
    last_seen: "último ping",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("fanin");

  return (
    <Figure
      label={t.one_gateway_many_clients}
      hint={t.ws_fan_in_tokens_presence}
      legend={[
        { color: P.teal, label: t.ws_client },
        { color: P.violet, label: t.auth },
        { color: P.amber, label: t.presence },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "fanin", label: t.fanin, tone: P.teal },
            { value: "auth", label: t.auth, tone: P.violet },
            { value: "presence", label: t.presence, tone: P.amber },
          ]}
          ariaLabel={t.one_gateway_many_clients}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "fanin" && (
          <>
            {/* three WS clients converging */}
            {(
              [
                [P.teal, -2.3, 1.0],
                [P.violet, -2.3, 0.4],
                [P.amber, -2.3, -0.2],
              ] as const
            ).map(([col, x, y], i) => (
              <group key={i}>
                <Slab position={[x, y, 0]} size={[1.5, 0.5, 0.12]} color={col} fill={0.22} />
                <Tag position={[x, y + 0.4, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"} size="xs">
                  {t.ws_client} {i + 1}
                </Tag>
                <Ribbon points={[[x + 0.85, y, 0], [-0.6, 0.4, 0]]} color={col} radius={0.035} opacity={0.85} />
              </group>
            ))}
            {/* the gateway slab */}
            <Slab position={[0.6, 0.4, 0]} size={[1.6, 1.3, 0.16]} color={P.teal} fill={0.26} rim={0.8} />
            <Tag position={[0.6, 1.25, 0.15]} tone="teal">gateway</Tag>
            {/* out to services */}
            <Ribbon points={[[1.4, 0.4, 0], [2.6, 0.4, 0]]} color={P.lineStrong} radius={0.045} opacity={0.9} />
            <Slab position={[2.6, 0.4, 0]} size={[0.9, 0.9, 0.12]} color={P.violet} fill={0.22} />
            <Tag position={[2.6, 1.0, 0.15]} tone="violet" size="xs">workers</Tag>
          </>
        )}

        {mode === "auth" && (
          <>
            {/* token slab + device code slab */}
            <Slab position={[-1.6, 0.9, 0]} size={[1.8, 0.6, 0.12]} color={P.violet} fill={0.26} />
            <Tag position={[-1.6, 1.35, 0.15]} tone="violet">{t.token}</Tag>
            <Slab position={[-1.6, 0.0, 0]} size={[1.8, 0.6, 0.12]} color={P.amber} fill={0.26} />
            <Tag position={[-1.6, 0.45, 0.15]} tone="amber">{t.device_code}</Tag>
            {/* both flow into an auth halo */}
            <Ribbon points={[[-0.6, 0.9, 0], [0.4, 0.7, 0]]} color={P.violet} radius={0.04} opacity={0.85} />
            <Ribbon points={[[-0.6, 0.0, 0], [0.4, 0.3, 0]]} color={P.amber} radius={0.04} opacity={0.85} />
            <Halo position={[1.3, 0.5, 0]} radius={0.55} color={P.teal} opacity={0.55} spin={0.2} />
            <Node3D position={[1.3, 0.5, 0]} color={P.teal} radius={0.18} pulse={0.3} />
            <Tag position={[1.3, 1.05, 0.15]} tone="teal">gate</Tag>
            {/* accepted */}
            <Ribbon points={[[1.85, 0.5, 0], [2.7, 0.5, 0]]} color={P.teal} radius={0.045} opacity={0.9} />
          </>
        )}

        {mode === "presence" && (
          <>
            {/* three online clients with halos, one offline solid */}
            {[P.teal, P.violet, P.amber].map((col, i) => (
              <group key={i}>
                <Node3D position={[-1.6 + i * 1.6, 0.6, 0]} color={col} radius={0.18} pulse={i * 0.3} />
                <Halo position={[-1.6 + i * 1.6, 0.6, 0]} radius={0.55 + i * 0.1} color={col} opacity={0.6 - i * 0.08} spin={0.18 + i * 0.06} />
                <Tag position={[-1.6 + i * 1.6, 1.45, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"} size="xs">
                  {t.online}
                </Tag>
              </group>
            ))}
            {/* the offline one */}
            <Node3D position={[1.6, -0.5, 0]} color={P.muted} radius={0.18} matte />
            <Tag position={[1.6, -0.05, 0.15]} tone="muted" size="xs">{t.last_seen}</Tag>
            <Ribbon points={[[-0.4, -0.4, 0], [1.4, -0.4, 0]]} color={P.lineStrong} radius={0.02} opacity={0.5} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

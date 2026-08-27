"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* OAuth vs API keys: scopes, rotation, storage. */
type Mode = "scopes" | "rotate" | "store";

const COPY = {
  en: {
    two_paths_into_a_provider: "two paths into a provider",
    scope_rotation_storage: "scope, rotation, storage",
    scopes: "scopes",
    rotate: "rotation",
    store: "storage",
    read: "read",
    write: "write",
    admin: "admin",
    old: "old",
    new: "new",
    expiring: "expiring",
    takes_over: "takes over",
    env_file: ".env",
    keychain: "keychain",
    secrets_mgr: "secrets mgr",
    never_in_git: "never in git",
    oauth: "oauth",
    api_key: "api key",
  },
  es: {
    two_paths_into_a_provider: "dos caminos hacia un proveedor",
    scope_rotation_storage: "scope, rotación, almacenamiento",
    scopes: "scopes",
    rotate: "rotación",
    store: "almacén",
    read: "lectura",
    write: "escritura",
    admin: "admin",
    old: "vieja",
    new: "nueva",
    expiring: "expira",
    takes_over: "toma el relevo",
    env_file: ".env",
    keychain: "keychain",
    secrets_mgr: "gestor de secretos",
    never_in_git: "nunca en git",
    oauth: "oauth",
    api_key: "api key",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("scopes");

  return (
    <Figure
      label={t.two_paths_into_a_provider}
      hint={t.scope_rotation_storage}
      legend={[
        { color: P.teal, label: t.oauth },
        { color: P.amber, label: t.api_key },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "scopes", label: t.scopes, tone: P.teal },
            { value: "rotate", label: t.rotate, tone: P.amber },
            { value: "store", label: t.store, tone: P.violet },
          ]}
          ariaLabel={t.two_paths_into_a_provider}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "scopes" && (
          <>
            {/* key at the center, concentric scope rings */}
            <Halo position={[0, 0.4, 0]} radius={0.55} color={P.teal} opacity={0.7} spin={0.3} />
            <Halo position={[0, 0.4, 0]} radius={0.95} color={P.amber} opacity={0.5} spin={-0.15} />
            <Halo position={[0, 0.4, 0]} radius={1.4} color={P.rose} opacity={0.35} spin={0.1} />
            <Node3D position={[0, 0.4, 0]} color={P.violet} radius={0.2} pulse={0.3} />
            <Tag position={[0, 0.4, 0.2]} tone="violet" size="xs">key</Tag>
            <Tag position={[0.85, 0.95, 0.15]} tone="teal" size="xs">{t.read}</Tag>
            <Tag position={[1.35, 0.15, 0.15]} tone="amber" size="xs">{t.write}</Tag>
            <Tag position={[-1.65, 0.95, 0.15]} tone="rose" size="xs">{t.admin}</Tag>
            <Tag position={[0, -1.35, 0.15]} tone="muted" size="xs">{t.scopes}</Tag>
          </>
        )}

        {mode === "rotate" && (
          <>
            <Slab position={[-1.6, 0.6, 0]} size={[1.8, 1.1, 0.14]} color={P.rose} fill={0.18} />
            <Tag position={[-1.6, 1.35, 0.15]} tone="rose">{t.old}</Tag>
            <Tag position={[-1.6, 0.05, 0.15]} tone="rose" size="xs">{t.expiring}</Tag>
            <Slab position={[1.6, 0.6, 0]} size={[1.8, 1.1, 0.14]} color={P.teal} fill={0.26} />
            <Tag position={[1.6, 1.35, 0.15]} tone="teal">{t.new}</Tag>
            <Tag position={[1.6, 0.05, 0.15]} tone="teal" size="xs">{t.takes_over}</Tag>
            {/* traffic moves */}
            <Flow points={[[-0.6, 0.6, 0], [0.6, 0.6, 0]]} color={P.teal} count={3} />
            {/* service consumer underneath */}
            <Slab position={[0, -0.9, 0]} size={[2.6, 0.5, 0.12]} color={P.violet} fill={0.16} />
            <Tag position={[0, -1.45, 0.15]} tone="violet" size="xs">service</Tag>
            <Wire points={[[-1.0, -0.6, 0], [-1.4, 0.05, 0]]} color={P.rose} dashed opacity={0.5} />
            <Wire points={[[1.0, -0.6, 0], [1.4, 0.05, 0]]} color={P.teal} opacity={0.7} />
          </>
        )}

        {mode === "store" && (
          <>
            {(
              [
                [t.env_file, P.amber, -2.3],
                [t.keychain, P.teal, 0],
                [t.secrets_mgr, P.violet, 2.3],
              ] as const
            ).map(([lab, col, x]) => (
              <group key={lab}>
                <Slab position={[x, 0.5, 0]} size={[1.7, 1.2, 0.14]} color={col} fill={0.2} />
                <Tag position={[x, 1.3, 0.15]} tone={col === P.teal ? "teal" : col === P.amber ? "amber" : "violet"} size="xs">
                  {lab}
                </Tag>
              </group>
            ))}
            {/* a lock behind them */}
            <Halo position={[0, 0.5, -0.5]} radius={2.2} color={P.lineStrong} opacity={0.3} />
            <Tag position={[0, -0.5, 0.15]} tone="rose" size="xs">{t.never_in_git}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

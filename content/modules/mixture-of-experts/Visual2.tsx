"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* mixture-of-experts: router → top-2 experts, load imbalance, capacity drops. */
type Mode = "router" | "balance" | "capacity";

const COPY = {
  en: {
    sparse_activation_is_the_trick: "sparse activation is the trick",
    router_top2_balance_capacity: "router · top-2 · balance · capacity",
    router: "router",
    balance: "load balance",
    capacity: "capacity",
    token: "token",
    experts: "experts",
    top2: "top-2",
    overloaded: "overloaded",
    dropped: "dropped",
    gate: "gate",
  },
  es: {
    sparse_activation_is_the_trick: "la activación dispersa es el truco",
    router_top2_balance_capacity: "router · top-2 · balance · capacidad",
    router: "router",
    balance: "balance de carga",
    capacity: "capacidad",
    token: "token",
    experts: "expertos",
    top2: "top-2",
    overloaded: "sobrecargado",
    dropped: "descartado",
    gate: "puerta",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("router");

  return (
    <Figure
      label={t.sparse_activation_is_the_trick}
      hint={t.router_top2_balance_capacity}
      legend={[
        { color: P.teal, label: t.token },
        { color: P.violet, label: t.experts },
        { color: P.amber, label: t.gate },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "router", label: t.router, tone: P.teal },
            { value: "balance", label: t.balance, tone: P.violet },
            { value: "capacity", label: t.capacity, tone: P.rose },
          ]}
          ariaLabel={t.sparse_activation_is_the_trick}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "router" && (
          <>
            {/* tokens hit router; only 2 of 8 lights */}
            <Slab position={[-2.4, 0.4, 0]} size={[1.5, 1.5, 0.14]} color={P.teal} fill={0.2} />
            <Lattice
              cells={Array.from({ length: 9 }, (_, i) => ({
                position: [-2.8 + (i % 3) * 0.4, 0.9 - Math.floor(i / 3) * 0.4, 0.15] as [number, number, number],
                color: P.teal,
              }))}
              size={0.14}
              opacity={0.9}
              matte
            />
            <Tag position={[-2.4, 1.35, 0.15]} tone="teal" size="xs">{t.token}</Tag>
            <Flow points={[[-1.6, 0.4, 0], [-0.6, 0.4, 0]]} color={P.teal} count={3} />
            <Halo position={[0.1, 0.4, 0]} radius={0.55} color={P.amber} opacity={0.6} spin={0.2} />
            <Node3D position={[0.1, 0.4, 0]} color={P.amber} radius={0.18} pulse={0.35} />
            <Tag position={[0.1, 1.05, 0.15]} tone="amber">{t.router}</Tag>
            {/* expert ring */}
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const active = i === 1 || i === 6;
              return (
                <group key={i}>
                  <Node3D position={[1.9 + Math.cos(a) * 1.0, 0.4 + Math.sin(a) * 1.0, 0]} color={active ? P.violet : P.muted} radius={active ? 0.15 : 0.09} pulse={active ? 0.35 : 0} matte={!active} />
                  {active && <Flow points={[[0.35, 0.4, 0], [1.2 + Math.cos(a) * 0.6, 0.4 + Math.sin(a) * 0.6, 0]]} color={P.violet} count={2} size={0.045} />}
                </group>
              );
            })}
            <Tag position={[2.0, 1.75, 0.15]} tone="violet" size="xs">{t.top2} / 8</Tag>
          </>
        )}

        {mode === "balance" && (
          <>
            {/* uneven expert bars, one overloaded rose */}
            {[0, 1, 2, 3].map((i) => {
              const h = [1.0, 1.65, 0.7, 2.4][i];
              const col = i === 3 ? P.rose : P.violet;
              return (
                <group key={i}>
                  <Slab position={[-1.8 + i * 1.2, -0.6 + h / 2, 0]} size={[0.8, h, 0.14]} color={col} fill={0.3} />
                  <Tag position={[-1.8 + i * 1.2, 1.75, 0.15]} tone={i === 3 ? "rose" : "violet"} size="xs">E{i + 1}</Tag>
                  <Tag position={[-1.8 + i * 1.2, -0.95, 0.15]} tone={i === 3 ? "rose" : "muted"} size="xs">{Math.round(h * 10)}%</Tag>
                </group>
              );
            })}
            <Wire points={[[-2.6, -0.6, 0], [2.5, -0.6, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[2.5, -1.3, 0.15]} tone="rose" size="xs">{t.overloaded}</Tag>
            <Ribbon points={[[-2.4, 1.3, 0], [0.0, 0.4, 0], [1.8, 1.4, 0]]} color={P.amber} radius={0.03} opacity={0.7} />
            <Tag position={[0, 1.6, 0.15]} tone="amber" size="xs">aux loss</Tag>
          </>
        )}

        {mode === "capacity" && (
          <>
            {/* capacity ring per expert; last tokens fall outside */}
            <Slab position={[0, 0.4, 0]} size={[3.8, 1.6, 0.14]} color={P.violet} fill={0.12} rim={0.8} />
            <Tag position={[0, 1.5, 0.15]} tone="violet">{t.experts} · capacity</Tag>
            <Lattice
              cells={Array.from({ length: 15 }, (_, i) => ({
                position: [-1.6 + (i % 5) * 0.8, 0.9 - Math.floor(i / 5) * 0.42, 0.15] as [number, number, number],
                color: i > 11 ? P.rose : P.teal,
              }))}
              size={0.2}
              opacity={0.9}
              matte
            />
            {/* red tokens outside the capacity line */}
            <Ribbon points={[[2.0, 0.4, 0], [2.8, -0.3, 0]]} color={P.rose} radius={0.04} opacity={0.9} />
            <Node3D position={[2.9, -0.4, 0]} color={P.rose} radius={0.14} pulse={0.6} />
            <Tag position={[2.6, -0.85, 0.15]} tone="rose" size="xs">{t.dropped}</Tag>
            <Halo position={[0, 0.4, 0]} radius={1.9} color={P.amber} opacity={0.28} spin={0.1} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

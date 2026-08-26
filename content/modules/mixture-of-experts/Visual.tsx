"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "dense" | "route" | "vram";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("dense");

  // Eight experts in a row, plus a router above.
  const N_EXPERTS = 8;
  const expertX = (i: number) => -3.5 + i * 1.0;
  const expertY = -0.4;

  // For "route" mode, decide which experts are active. A stable pattern:
  // tokens 1-4 favour experts {1, 5}; tokens 5-8 favour {2, 6}.
  const activeOnRoute = (i: number) => i === 1 || i === 5;
  const activeOnDense = () => true;

  // Build a Lattice of "memory slots" for the VRAM mode — 48B worth of blocks
  // visually conveyed as a stack of slabs.
  const totalExperts = 16;
  const stackY = (i: number) => -2.4 + Math.floor(i / 8) * 0.45;
  const stackX = (i: number) => -2.4 + (i % 8) * 0.7;

  return (
    <Figure
      label="router · experts · A3B"
      hint="most parameters sleep"
      legend={[
        { color: P.teal, label: "dense (all on)" },
        { color: P.amber, label: "top-k active" },
        { color: P.violet, label: "VRAM holds all" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "dense", label: "Dense", tone: P.teal },
            { value: "route", label: "Top-k", tone: P.amber },
            { value: "vram", label: "VRAM", tone: P.violet },
          ]}
          ariaLabel="most parameters sleep"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 9], fov: 38 }}>
        {/* Background dust for depth. */}
        <Motes count={120} radius={7} color={P.faint} size={0.025} opacity={0.32} />

        {/* The router at the top — pulses to remind you it's the gatekeeper. */}
        <Node3D position={[0, 1.5, 0]} color={P.amber} radius={0.22} pulse={0.5} />
        <Tag position={[0, 2.0, 0.2]} tone="amber">router · top-2</Tag>

        {/* Token input on the left. */}
        <Node3D position={[-4.6, 1.5, 0]} color={P.ink} radius={0.16} pulse={0.7} />
        <Tag position={[-4.6, 2.0, 0.2]} tone="ink">token</Tag>

        {/* Connection token → router. */}
        <Flow
          points={[[-4.4, 1.5, 0], [-1.8, 1.5, 0], [0, 1.4, 0]]}
          color={P.amber}
          count={3}
        />

        {/* Experts row. */}
        {Array.from({ length: N_EXPERTS }, (_, i) => {
          const on = mode === "dense" ? activeOnDense() : activeOnRoute(i);
          const color = on ? (mode === "vram" ? P.violet : P.teal) : P.line;
          const fill = on ? 0.32 : 0.08;
          return (
            <group key={i}>
              <Slab
                position={[expertX(i), expertY, 0]}
                size={[0.8, 1.5, 0.12]}
                color={color}
                fill={fill}
              />
              <Tag position={[expertX(i), expertY - 1.0, 0.2]} tone={on ? "teal" : "muted"}>
                E{i}
              </Tag>
              {/* Connection router → expert, only lit when active. */}
              {on && (
                <Flow
                  points={[
                    [0, 1.3, 0],
                    [expertX(i), expertY + 0.6, 0],
                  ]}
                  color={P.teal}
                  count={2}
                />
              )}
            </group>
          );
        })}

        {/* Below the experts: a "compute" slab — the active FLOPs. */}
        {mode === "route" && (
          <Slab
            position={[expertX(3), -2.1, 0]}
            size={[2.4, 0.5, 0.1]}
            color={P.teal}
            fill={0.25}
          />
        )}
        {mode === "route" && (
          <Tag position={[expertX(3), -2.4, 0.2]} tone="teal">~3B active FLOPs</Tag>
        )}
        {mode === "dense" && (
          <Slab
            position={[expertX(3.5), -2.1, 0]}
            size={[7.6, 0.5, 0.1]}
            color={P.teal}
            fill={0.25}
          />
        )}
        {mode === "dense" && (
          <Tag position={[expertX(3.5), -2.4, 0.2]} tone="teal">~48B active FLOPs</Tag>
        )}

        {/* VRAM mode: a stack of all 16 expert slabs, regardless of who fired. */}
        {mode === "vram" && (
          <>
            {Array.from({ length: totalExperts }, (_, i) => {
              const isHighlight = i === 1 || i === 5; // the "active" ones
              return (
                <Slab
                  key={i}
                  position={[stackX(i), stackY(i), 0]}
                  size={[0.6, 0.32, 0.1]}
                  color={isHighlight ? P.amber : P.violet}
                  fill={isHighlight ? 0.45 : 0.22}
                />
              );
            })}
            <Slab
              position={[expertX(3.5), -2.1, 0]}
              size={[7.6, 0.5, 0.1]}
              color={P.violet}
              fill={0.3}
            />
            <Tag position={[expertX(3.5), -2.4, 0.2]} tone="violet">all 48B resident</Tag>
            <Halo position={[stackX(1), stackY(1), 0.2]} radius={0.45} color={P.amber} opacity={0.6} spin={0.6} />
            <Halo position={[stackX(5), stackY(5), 0.2]} radius={0.45} color={P.amber} opacity={0.6} spin={0.6} />
            <Tag position={[stackX(1), stackY(1) - 0.45, 0]} tone="amber">active</Tag>
            <Tag position={[stackX(5), stackY(5) - 0.45, 0]} tone="amber">active</Tag>
            <Tag position={[stackX(8), stackY(8) - 0.45, 0]} tone="violet">asleep</Tag>
          </>
        )}

        {/* Auxiliary loss note on the route mode. */}
        {mode === "route" && (
          <>
            <Wire
              points={[
                [expertX(1), expertY - 1.4, 0],
                [expertX(7), expertY - 1.4, 0],
              ]}
              color={P.rose}
              opacity={0.6}
              dashed
            />
            <Node3D position={[expertX(1), expertY - 1.4, 0]} color={P.rose} radius={0.08} />
            <Node3D position={[expertX(7), expertY - 1.4, 0]} color={P.faint} radius={0.08} />
            <Tag position={[expertX(4), expertY - 1.75, 0]} tone="rose">
              aux loss: balance load
            </Tag>
          </>
        )}

        {/* Shared experts slab — small footer note in dense mode. */}
        {mode === "dense" && (
          <>
            <Ribbon
              points={[
                [-4.6, 1.5, 0],
                [-4.6, expertY, 0],
                [expertX(0), expertY, 0],
              ]}
              color={P.teal}
              radius={0.025}
              opacity={0.5}
            />
            <Tag position={[expertX(0), expertY - 1.65, 0.2]} tone="muted">shared expert</Tag>
          </>
        )}
      </Stage>
    </Figure>
  );
}

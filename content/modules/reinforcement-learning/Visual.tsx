"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "sft" | "dpo" | "grpo";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("sft");

  // Four candidate rollouts for GRPO mode.
  const rolloutScores = [0.7, 0.4, 0.85, 0.2, 0.6];
  const rolloutColors = [
    P.teal,
    P.rose,
    P.teal,
    P.rose,
    P.amber,
  ];

  return (
    <Figure
      label="preference · group"
      hint="which completion is less bad"
      legend={[
        { color: P.teal, label: "chosen" },
        { color: P.rose, label: "rejected" },
        { color: P.violet, label: "group" },
        { color: P.amber, label: "judge" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "sft", label: "SFT", tone: P.teal },
            { value: "dpo", label: "DPO", tone: P.amber },
            { value: "grpo", label: "GRPO", tone: P.violet },
          ]}
          ariaLabel="which completion is less bad"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 9], fov: 38 }}>
        <Motes count={100} radius={6.5} color={P.faint} size={0.025} opacity={0.32} />

        {/* Prompt at top — same in all modes. */}
        <Slab position={[0, 2.2, 0]} size={[4.2, 0.5, 0.1]} color={P.ink} fill={0.18} />
        <Tag position={[0, 2.7, 0.2]} tone="ink">prompt: explain routers</Tag>

        {/* Mode-specific lower scene. */}
        {mode === "sft" && (
          <>
            <Node3D position={[-2.0, 0.5, 0]} color={P.teal} radius={0.28} pulse={0.4} />
            <Tag position={[-2.0, -0.1, 0.2]} tone="teal">imitate</Tag>
            <Slab position={[1.5, 0.5, 0]} size={[2.4, 1.4, 0.12]} color={P.teal} fill={0.25} />
            <Tag position={[1.5, 1.4, 0.2]} tone="teal">demo</Tag>
            <Flow
              points={[[-1.7, 0.5, 0], [0.25, 0.5, 0]]}
              color={P.teal}
              count={3}
            />
            <Tag position={[0, -1.6, 0]} tone="muted">SFT: one demo, imitate the style</Tag>
          </>
        )}

        {mode === "dpo" && (
          <>
            <Slab position={[-2.2, 0.4, 0]} size={[2.0, 1.5, 0.12]} color={P.teal} fill={0.32} />
            <Tag position={[-2.2, 1.35, 0.2]} tone="teal">chosen</Tag>
            <Slab position={[2.2, 0.4, 0]} size={[2.0, 1.5, 0.12]} color={P.rose} fill={0.28} />
            <Tag position={[2.2, 1.35, 0.2]} tone="rose">rejected</Tag>
            <Node3D position={[0, 0.4, 0]} color={P.amber} radius={0.22} pulse={0.5} />
            <Tag position={[0, -0.3, 0.2]} tone="amber">policy</Tag>
            <Flow
              points={[[-1.2, 0.4, 0], [-0.25, 0.4, 0]]}
              color={P.teal}
              count={2}
              speed={0.5}
            />
            <Flow
              points={[[0.25, 0.4, 0], [1.2, 0.4, 0]]}
              color={P.rose}
              count={2}
              speed={0.5}
            />
            <Slab position={[0, -1.4, 0]} size={[4.5, 0.4, 0.1]} color={P.violet} fill={0.18} />
            <Tag position={[0, -1.85, 0.2]} tone="violet">direct loss on the pair</Tag>
            <Ribbon
              points={[[-1.2, 0.0, 0], [1.2, 0.0, 0]]}
              color={P.violet}
              radius={0.025}
              opacity={0.45}
            />
          </>
        )}

        {mode === "grpo" && (
          <>
            {/* Five rollouts fanned out below the prompt. */}
            {Array.from({ length: 5 }, (_, i) => {
              const x = -3.2 + i * 1.6;
              const isWin = rolloutScores[i] > 0.5;
              const color = rolloutColors[i];
              return (
                <group key={i}>
                  <Slab
                    position={[x, 0.4, 0]}
                    size={[1.2, 1.0, 0.1]}
                    color={color}
                    fill={isWin ? 0.32 : 0.16}
                  />
                  <Tag position={[x, 1.05, 0.2]} tone={isWin ? "teal" : "rose"}>
                    r{i + 1}
                  </Tag>
                  <Halo
                    position={[x, 0.4, 0.15]}
                    radius={0.55}
                    color={color}
                    opacity={isWin ? 0.55 : 0.25}
                    spin={0.3}
                  />
                  <Flow
                    points={[[0, 1.9, 0], [x, 1.4, 0]]}
                    color={color}
                    count={1}
                    speed={0.6}
                  />
                </group>
              );
            })}
            {/* Group mean baseline. */}
            <Slab position={[0, -0.95, 0]} size={[8.5, 0.3, 0.1]} color={P.violet} fill={0.22} />
            <Tag position={[0, -1.4, 0.2]} tone="violet">group mean (baseline)</Tag>
            {/* Advantage arrows up for winners, down for losers. */}
            {Array.from({ length: 5 }, (_, i) => {
              const x = -3.2 + i * 1.6;
              const isWin = rolloutScores[i] > 0.5;
              return (
                <Flow
                  key={`adv-${i}`}
                  points={
                    isWin
                      ? [
                          [x, -0.7, 0],
                          [x, -0.3, 0],
                        ]
                      : [
                          [x, -0.3, 0],
                          [x, -0.7, 0],
                        ]
                  }
                  color={isWin ? P.teal : P.rose}
                  count={1}
                  speed={0.4}
                />
              );
            })}
          </>
        )}

        {/* Reward / verifier hook in the corner — useful in all modes, but highlight GRPO. */}
        {mode === "grpo" && (
          <>
            <Node3D position={[4.2, -2.0, 0]} color={P.amber} radius={0.2} pulse={0.6} />
            <Tag position={[4.2, -2.5, 0.2]} tone="amber">verifier</Tag>
            <Flow
              points={[[0, -0.95, 0], [4.0, -2.0, 0]]}
              color={P.amber}
              count={2}
              speed={0.4}
            />
          </>
        )}

        {/* Caption footer. */}
        <Slab position={[0, -2.6, 0]} size={[9.0, 0.4, 0.1]} color={P.line} fill={0.08} />
        <Tag position={[0, -2.6, 0.2]} tone="muted">
          {mode === "sft"
            ? "SFT: imitate one demo"
            : mode === "dpo"
              ? "DPO: pairwise direct loss"
              : "GRPO: group-relative advantage"}
        </Tag>
      </Stage>
    </Figure>
  );
}

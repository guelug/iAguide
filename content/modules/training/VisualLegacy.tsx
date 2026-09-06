"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

type Mode = "pt" | "sft" | "rl";

export default function Visual() {
  const [mode, setMode] = useState<Mode>("pt");

  // Pretrain: a corpus of tokens flowing into a giant model.
  const corpusCells = Array.from({ length: 24 }, (_, i) => ({
    position: [-4.6 + (i % 8) * 0.18, 2.0 - Math.floor(i / 8) * 0.22, 0] as [number, number, number],
    scale: 1,
    color: P.teal,
  }));

  // Pretrain loss curve points (mini sparkline) below.
  const lossPoints: [number, number, number][] = Array.from({ length: 10 }, (_, i) => [
    -4.2 + i * 0.9,
    -1.7 + Math.exp(-i * 0.5) * 0.8,
    0,
  ]);

  return (
    <Figure
      label="pretrain · SFT · RL"
      hint="step the figure"
      legend={[
        { color: P.teal, label: "pretrain" },
        { color: P.amber, label: "sft" },
        { color: P.violet, label: "preference" },
        { color: P.rose, label: "loss / reward" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "pt", label: "Pretrain", tone: P.teal },
            { value: "sft", label: "SFT", tone: P.amber },
            { value: "rl", label: "Preference", tone: P.violet },
          ]}
          ariaLabel="step the figure"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 9.5], fov: 38 }}>
        <Motes count={120} radius={7} color={P.faint} size={0.025} opacity={0.32} />

        {/* Pipeline strip — three stages horizontally. */}
        <Slab
          position={[-2.2, 0.5, 0]}
          size={[2.2, 1.7, 0.12]}
          color={P.teal}
          fill={mode === "pt" ? 0.36 : 0.12}
        />
        <Tag position={[-2.2, 1.55, 0.2]} tone="teal">pretrain</Tag>

        <Slab
          position={[0, 0.5, 0]}
          size={[2.2, 1.7, 0.12]}
          color={P.amber}
          fill={mode === "sft" ? 0.36 : 0.12}
        />
        <Tag position={[0, 1.55, 0.2]} tone="amber">SFT</Tag>

        <Slab
          position={[2.2, 0.5, 0]}
          size={[2.2, 1.7, 0.12]}
          color={P.violet}
          fill={mode === "rl" ? 0.36 : 0.12}
        />
        <Tag position={[2.2, 1.55, 0.2]} tone="violet">preference</Tag>

        {/* Connections between stages. */}
        <Flow points={[[-1.1, 0.5, 0], [-1.05, 0.5, 0]]} color={P.teal} count={2} />
        <Flow points={[[1.1, 0.5, 0], [1.05, 0.5, 0]]} color={P.amber} count={2} />

        {/* Pretrain mode: corpus of tokens on the left, loss curve below. */}
        {mode === "pt" && (
          <>
            <Lattice cells={corpusCells} size={0.13} matte />
            <Tag position={[-3.2, 2.4, 0.2]} tone="muted">corpus</Tag>
            <Flow
              points={[[-3.0, 1.4, 0], [-2.6, 0.8, 0]]}
              color={P.teal}
              count={4}
              speed={0.5}
            />
            {/* Loss curve. */}
            <Slab position={[-0.5, -1.6, 0]} size={[6.4, 1.0, 0.08]} color={P.rose} fill={0.12} />
            <Wire points={lossPoints} color={P.rose} opacity={0.9} width={2} />
            <Tag position={[-3.5, -1.3, 0.2]} tone="rose">loss ↓</Tag>
            <Node3D position={lossPoints[lossPoints.length - 1]} color={P.rose} radius={0.08} pulse={0.6} />
          </>
        )}

        {/* SFT mode: pairs (prompt, demo) with a template. */}
        {mode === "sft" && (
          <>
            <Slab position={[-2.6, 2.4, 0]} size={[1.8, 0.5, 0.1]} color={P.teal} fill={0.22} />
            <Tag position={[-2.6, 2.75, 0.2]} tone="teal">prompts</Tag>
            <Slab position={[0.4, 2.4, 0]} size={[1.8, 0.5, 0.1]} color={P.amber} fill={0.22} />
            <Tag position={[0.4, 2.75, 0.2]} tone="amber">demos</Tag>
            <Flow
              points={[[-1.7, 2.4, 0], [-0.5, 2.4, 0]]}
              color={P.teal}
              count={3}
              speed={0.5}
            />
            <Flow
              points={[[-1.4, 2.1, 0], [0.0, 1.2, 0]]}
              color={P.amber}
              count={3}
              speed={0.5}
            />
            <Node3D position={[0, 0.5, 0]} color={P.amber} radius={0.18} pulse={0.5} />
            <Tag position={[0, -0.2, 0.2]} tone="amber">template match</Tag>
            {/* Footer: "stops here" for many teams. */}
            <Slab position={[0, -1.7, 0]} size={[3.6, 0.5, 0.1]} color={P.violet} fill={0.16} />
            <Tag position={[0, -2.1, 0.2]} tone="violet">local chat models often stop here</Tag>
          </>
        )}

        {/* Preference mode: chosen vs rejected, judge, policy update. */}
        {mode === "rl" && (
          <>
            <Slab position={[1.4, 2.4, 0]} size={[1.4, 0.5, 0.1]} color={P.teal} fill={0.26} />
            <Tag position={[1.4, 2.75, 0.2]} tone="teal">chosen</Tag>
            <Slab position={[3.0, 2.4, 0]} size={[1.4, 0.5, 0.1]} color={P.rose} fill={0.22} />
            <Tag position={[3.0, 2.75, 0.2]} tone="rose">rejected</Tag>
            {/* Judge */}
            <Node3D position={[2.2, 1.6, 0]} color={P.amber} radius={0.22} pulse={0.5} />
            <Tag position={[2.2, 1.15, 0.2]} tone="amber">judge</Tag>
            <Flow
              points={[[1.4, 2.1, 0], [2.05, 1.7, 0]]}
              color={P.teal}
              count={2}
              speed={0.5}
            />
            <Flow
              points={[[3.0, 2.1, 0], [2.4, 1.7, 0]]}
              color={P.rose}
              count={2}
              speed={0.5}
            />
            {/* Policy update arrow into preference slab. */}
            <Flow
              points={[[2.2, 1.35, 0], [2.2, 0.5, 0]]}
              color={P.violet}
              count={3}
              speed={0.4}
            />
            {/* Reward curve going UP. */}
            <Slab position={[0, -1.6, 0]} size={[6.4, 1.0, 0.08]} color={P.teal} fill={0.12} />
            <Wire
              points={Array.from({ length: 10 }, (_, i) => [
                -3.0 + i * 0.6,
                -2.0 + (1 - Math.exp(-i * 0.4)) * 0.9,
                0,
              ])}
              color={P.teal}
              opacity={0.9}
              width={2}
            />
            <Tag position={[-3.5, -1.3, 0.2]} tone="teal">reward ↑</Tag>
            {/* Watch out for reward hacking. */}
            <Node3D position={[3.6, -1.8, 0]} color={P.rose} radius={0.12} pulse={0.7} />
            <Tag position={[3.6, -2.2, 0.2]} tone="rose">watch: reward hacking</Tag>
          </>
        )}

        {/* Footer. */}
        <Slab position={[0, -2.6, 0]} size={[9.0, 0.4, 0.1]} color={P.line} fill={0.08} />
        <Tag position={[0, -2.6, 0.2]} tone="muted">
          {mode === "pt"
            ? "pretrain: predict the next token over a huge corpus"
            : mode === "sft"
              ? "SFT: imitate demos in your serving template"
              : "preference: push the policy toward chosen, away from rejected"}
        </Tag>
      </Stage>
    </Figure>
  );
}

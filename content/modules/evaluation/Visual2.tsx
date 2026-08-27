"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* evaluation: three benchmarks slabs, leaderboard bars, contamination leak. */
type Mode = "benches" | "leaderboard" | "contam";

const COPY = {
  en: {
    measuring_is_a_separate_art: "measuring is a separate art",
    benchmarks_leaderboard_contamination: "benchmarks · leaderboard · contamination",
    benches: "benchmarks",
    leaderboard: "leaderboard",
    contaminate: "contamination",
    arc: "arc",
    gsm: "gsm8k",
    hella: "hellaswag",
    score: "score",
    leak: "leak",
    contaminates: "contaminates",
    train: "train",
    test: "test",
  },
  es: {
    measuring_is_a_separate_art: "medir es un arte aparte",
    benchmarks_leaderboard_contamination: "benchmarks · leaderboard · contaminación",
    benches: "benchmarks",
    leaderboard: "leaderboard",
    contaminate: "contaminación",
    arc: "arc",
    gsm: "gsm8k",
    hella: "hellaswag",
    score: "score",
    leak: "fuga",
    contaminates: "contamina",
    train: "train",
    test: "test",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("benches");

  // leaderboard: four models, four bar heights
  const bars = [
    [P.teal, 1.9, "model A"],
    [P.violet, 1.55, "model B"],
    [P.amber, 1.2, "model C"],
    [P.muted, 0.8, "model D"],
  ] as const;

  return (
    <Figure
      label={t.measuring_is_a_separate_art}
      hint={t.benchmarks_leaderboard_contamination}
      legend={[
        { color: P.teal, label: t.arc },
        { color: P.violet, label: t.gsm },
        { color: P.amber, label: t.hella },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "benches", label: t.benches, tone: P.teal },
            { value: "leaderboard", label: t.leaderboard, tone: P.violet },
            { value: "contam", label: t.contaminate, tone: P.rose },
          ]}
          ariaLabel={t.measuring_is_a_separate_art}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "benches" && (
          <>
            {(
              [
                [t.arc, P.teal, -2.0],
                [t.gsm, P.violet, 0],
                [t.hella, P.amber, 2.0],
              ] as const
            ).map(([lab, col, x]) => (
              <group key={lab}>
                <Slab position={[x, 0.4, 0]} size={[1.7, 1.3, 0.14]} color={col} fill={0.18} />
                <Tag position={[x, 1.3, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"}>{lab}</Tag>
                {/* number of items */}
                <Tag position={[x, -0.35, 0.15]} tone="muted" size="xs">
                  {lab === t.arc ? "7,787 q" : lab === t.gsm ? "8,792 q" : "10,000 q"}
                </Tag>
              </group>
            ))}
            <Wire points={[[-3.0, -0.5, 0], [3.0, -0.5, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[0, -0.95, 0.15]} tone="muted" size="xs">items</Tag>
          </>
        )}

        {mode === "leaderboard" && (
          <>
            {bars.map(([col, h, lab], i) => {
              const tones = ["teal", "violet", "amber", "muted"] as const;
              return (
                <group key={lab}>
                  <Slab position={[-1.7 + i * 1.15, -0.5 + h / 2, 0]} size={[0.9, h, 0.14]} color={col} fill={0.32} />
                  <Tag position={[-1.7 + i * 1.15, 0.0 + h * 1.0, 0.15]} tone={tones[i]} size="xs">
                    {lab}
                  </Tag>
                </group>
              );
            })}
            <Wire points={[[-2.6, -0.5, 0], [2.6, -0.5, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[2.5, -0.85, 0.15]} tone="muted" size="xs">{t.score}</Tag>
          </>
        )}

        {mode === "contam" && (
          <>
            {/* the training blob absorbing a test set ribbon */}
            <Lattice
              cells={Array.from({ length: 30 }, (_, i) => ({
                position: [-1.5 + (i % 6) * 0.5, 0.8 - Math.floor(i / 6) * 0.45, 0] as [number, number, number],
                color: P.teal,
              }))}
              size={0.23}
              opacity={0.85}
            />
            <Tag position={[-1.5, 1.6, 0.15]} tone="teal" size="xs">{t.train}</Tag>
            {/* contamination ribbon seeping in */}
            <Ribbon
              points={[[2.3, 1.0, 0], [1.0, 0.6, 0], [0.3, 0.3, 0], [-0.2, 0.0, 0]]}
              color={P.rose}
              radius={0.05}
              opacity={0.9}
            />
            <Slab position={[2.4, 1.1, 0]} size={[1.3, 0.6, 0.1]} color={P.rose} fill={0.32} />
            <Tag position={[2.4, 1.6, 0.15]} tone="rose" size="xs">{t.test}</Tag>
            <Tag position={[0.5, 0.85, 0.15]} tone="rose" size="xs">{t.leak}</Tag>
            <Tag position={[0, -1.0, 0.15]} tone="muted" size="xs">{t.contaminates}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

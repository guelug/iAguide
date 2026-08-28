"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* GAIA: question → agent → judge, three levels, the human bar. */
type Mode = "pipeline" | "levels" | "gap";

const COPY = {
  en: {
    what_a_ranking_really_measures: "what a ranking really measures",
    question_agent_judge_and_the_human_bar: "question, agent, judge — and the human bar",
    pipeline: "pipeline",
    levels: "levels",
    the_gap: "the gap",
    question: "question",
    agent: "agent",
    judge: "judge",
    level_1: "level 1",
    level_2: "level 2",
    level_3: "level 3",
    tools_count: "tools",
    humans_92: "humans 92%",
    best_agent: "best agent",
    score: "score",
  },
  es: {
    what_a_ranking_really_measures: "qué mide de verdad un ranking",
    question_agent_judge_and_the_human_bar: "pregunta, agente, juez — y la barra humana",
    pipeline: "pipeline",
    levels: "niveles",
    the_gap: "la brecha",
    question: "pregunta",
    agent: "agente",
    judge: "juez",
    level_1: "nivel 1",
    level_2: "nivel 2",
    level_3: "nivel 3",
    tools_count: "tools",
    humans_92: "humanos 92%",
    best_agent: "mejor agente",
    score: "puntuación",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("pipeline");

  return (
    <Figure
      label={t.what_a_ranking_really_measures}
      hint={t.question_agent_judge_and_the_human_bar}
      legend={[
        { color: P.teal, label: t.question },
        { color: P.violet, label: t.agent },
        { color: P.amber, label: t.judge },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "pipeline", label: t.pipeline, tone: P.teal },
            { value: "levels", label: t.levels, tone: P.violet },
            { value: "gap", label: t.the_gap, tone: P.rose },
          ]}
          ariaLabel={t.what_a_ranking_really_measures}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "pipeline" && (
          <>
            <Slab position={[-2.5, 0.6, 0]} size={[1.6, 0.9, 0.14]} color={P.teal} fill={0.2} />
            <Tag position={[-2.5, 1.25, 0.15]} tone="teal">{t.question}</Tag>
            <Flow points={[[-1.65, 0.6, 0], [-0.7, 0.6, 0]]} color={P.teal} count={2} size={0.05} />
            <Node3D position={[0, 0.6, 0]} color={P.violet} radius={0.2} pulse={0.3} />
            <Tag position={[0, 1.05, 0.15]} tone="violet">{t.agent}</Tag>
            <Flow points={[[0.25, 0.6, 0], [1.4, 0.6, 0]]} color={P.violet} count={3} />
            <Slab position={[2.3, 0.6, 0]} size={[1.4, 0.7, 0.12]} color={P.amber} fill={0.22} />
            <Tag position={[2.3, 1.15, 0.15]} tone="amber">{t.judge}</Tag>
            {/* exact-match verdict */}
            <Flow points={[[2.3, 0.2, 0], [0.6, -1.2, 0]]} color={P.amber} count={2} size={0.045} />
            <Tag position={[0.6, -1.55, 0.15]} tone="muted" size="xs">exact match</Tag>
            <Wire points={[[-2.5, 0.15, 0], [-2.5, -1.0, 0], [0.6, -1.0, 0]]} color={P.lineStrong} dashed opacity={0.5} />
          </>
        )}

        {mode === "levels" && (
          <>
            {(
              [
                [t.level_1, 1, P.teal, -2.2],
                [t.level_2, 3, P.violet, 0],
                [t.level_3, 6, P.rose, 2.2],
              ] as const
            ).map(([lab, tools, col, x]) => (
              <group key={lab}>
                <Slab
                  position={[x, 0.5, 0]}
                  size={[1.8, 0.5 + (tools as number) * 0.22, 0.14]}
                  color={col}
                  fill={0.2}
                />
                <Tag position={[x, 1.0 + (tools as number) * 0.11 + 0.35, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "rose"}>
                  {lab}
                </Tag>
                {Array.from({ length: tools as number }, (_, i) => (
                  <Node3D
                    key={i}
                    position={[x - 0.6 + (i % 3) * 0.6, 0.5 + Math.floor(i / 3) * 0.4, 0.15]}
                    color={col}
                    radius={0.08}
                    matte
                  />
                ))}
                <Tag position={[x, -0.05, 0.15]} tone="muted" size="xs">
                  {tools} {t.tools_count}
                </Tag>
              </group>
            ))}
          </>
        )}

        {mode === "gap" && (
          <>
            {/* two bars: humans 92, best agent ~15 (2024 GAIA) */}
            <Slab position={[-1.4, -0.15 + 0.92, 0]} size={[1.6, 1.84, 0.14]} color={P.teal} fill={0.3} />
            <Tag position={[-1.4, 1.85, 0.15]} tone="teal">{t.humans_92}</Tag>
            <Slab position={[1.4, -0.15 + 0.075, 0]} size={[1.6, 0.15, 0.14]} color={P.rose} fill={0.32} />
            <Tag position={[1.4, 0.25, 0.15]} tone="rose">{t.best_agent}</Tag>
            <Wire points={[[-2.6, -1.0, 0], [2.6, -1.0, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[2.6, -1.3, 0.15]} tone="muted" size="xs">{t.score}</Tag>
            <Flow points={[[-0.5, 1.6, 0], [0.6, 0.2, 0]]} color={P.rose} count={3} size={0.05} />
            <Tag position={[0, 2.0, 0.15]} tone="rose" size="xs">{t.the_gap}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

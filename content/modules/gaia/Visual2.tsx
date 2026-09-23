"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useRef, useState } from "react";
import type { Group } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Motes, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
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

function LegacyVisual() {
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

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: los tres niveles de GAIA como terrazas y la brecha de puntuación
 * como un marcador. Cada terraza lleva su recorrido de pasos y sus tools
 * (recuentos ilustrativos dentro de los rangos del curso: Nivel 1 < 5 pasos,
 * Nivel 2 de 5 a 10, Nivel 3 largo plazo). El marcador usa las cifras que
 * cita la Unit 4: humanos ~92 %, Deep Research 67,36 % (validación),
 * GPT-4 con plugins ~15 %, y la barra del 30 % en 20 preguntas de Nivel 1.
 */

type Level = 1 | 2 | 3;

const LEVELS: Record<Level, { steps: number; tools: number; label: string; range: string; tone: string }> = {
  1: { steps: 4, tools: 1, label: "Nivel 1", range: "menos de 5 pasos, uso mínimo de tools", tone: P.teal },
  2: { steps: 8, tools: 3, label: "Nivel 2", range: "5–10 pasos, varias tools coordinadas", tone: P.violet },
  3: { steps: 12, tools: 5, label: "Nivel 3", range: "planificación a largo plazo, integración avanzada de tools", tone: P.rose },
};

const SUBSET = 20;
const BAR = 0.3;
const SCORES = [
  { key: "humans", label: "humanos", value: 0.92, color: P.teal },
  { key: "deep", label: "D. Research", value: 0.6736, color: P.violet },
  { key: "gpt4", label: "GPT-4", value: 0.15, color: P.amber },
];

const esPct = new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 2 });

const TERRACE_W = 1.75;
const TERRACE_D = 2.3;
const terraceX = (i: Level) => -4.3 + (i - 1) * 1.95;
const terraceTop = (i: Level) => 0.24 + i * 0.3;

function stepPositions(level: Level): V3[] {
  const n = LEVELS[level].steps;
  return Array.from({ length: n }, (_, s) => {
    const row = Math.floor(s / 3);
    const inRow = s % 3;
    const col = row % 2 === 0 ? inRow : 2 - inRow;
    return [terraceX(level) - 0.48 + col * 0.48, terraceTop(level) + 0.04, 0.72 - row * 0.44];
  });
}

/** Avanza un contador desde dentro del Stage: respeta pausa y movimiento reducido. */
function Ticker({ seconds, onTick }: { seconds: number; onTick: () => void }) {
  const { still } = useStage();
  const elapsed = useRef(0);
  useFrame((_, dt) => {
    if (still) {
      elapsed.current = 0;
      return;
    }
    elapsed.current += dt;
    if (elapsed.current >= seconds) {
      elapsed.current = 0;
      onTick();
    }
  });
  return null;
}

function Walker({ target, color }: { target: V3; color: string }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : 1 - Math.exp(-7 * dt);
    g.position.set(g.position.x + (target[0] - g.position.x) * k, g.position.y + (target[1] - g.position.y) * k, g.position.z + (target[2] - g.position.z) * k);
  });
  return (
    <group ref={ref} position={target}>
      <Node3D position={[0, 0.16, 0]} color={color} radius={0.11} />
    </group>
  );
}

function Terrace({ level, active, cursor }: { level: Level; active: boolean; cursor: number }) {
  const info = LEVELS[level];
  const x = terraceX(level);
  const top = terraceTop(level);
  const steps = stepPositions(level);
  return (
    <group>
      <RoundedBox args={[TERRACE_W, top - 0.24, TERRACE_D]} position={[x, 0.24 + (top - 0.24) / 2, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={active ? mixHex("#DDD5C6", info.tone, 0.22) : "#D2CABB"} roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.3} />
      </RoundedBox>
      {steps.map((p, s) => {
        const done = active && s <= cursor;
        return (
          <RoundedBox key={s} args={[0.36, 0.05, 0.32]} position={p} radius={0.02} smoothness={2} castShadow receiveShadow>
            <meshPhysicalMaterial color={done ? info.tone : active ? mixHex(P.paper, info.tone, 0.35) : "#BDB5A5"} roughness={0.38} clearcoat={0.45} />
          </RoundedBox>
        );
      })}
      {steps.slice(1).map((p, s) => (
        <Wire key={s} points={[[steps[s][0], steps[s][1] + 0.04, steps[s][2]], [p[0], p[1] + 0.04, p[2]]]} color={active ? info.tone : P.lineStrong} width={1.2} opacity={0.6} />
      ))}
      {Array.from({ length: info.tools }, (_, t) => (
        <group key={t} position={[x + 0.72, top, 0.8 - t * 0.38]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.12, 10]} />
            <meshStandardMaterial color="#8C9895" metalness={0.6} roughness={0.35} />
          </mesh>
          <RoundedBox args={[0.2, 0.14, 0.2]} position={[0, 0.19, 0]} radius={0.03} smoothness={2} castShadow>
            <meshPhysicalMaterial color={active ? P.amber : mixHex(P.paper, P.amber, 0.4)} roughness={0.35} clearcoat={0.5} />
          </RoundedBox>
        </group>
      ))}
      <Tag position={[x, 0.3, TERRACE_D / 2 + 0.3]} tone={active ? "ink" : "muted"} size="xs" center plate={active}>
        {info.label}
      </Tag>
    </group>
  );
}

function Scoreboard({ correct }: { correct: number }) {
  const bx = 1.95;
  const bars = [...SCORES, { key: "you", label: "tu agente", value: correct / SUBSET, color: correct / SUBSET >= BAR ? P.inkSoft : P.rose }];
  const H = 2.4;
  const barX = (i: number) => bx + i * 0.8;
  const mid = bx + 1.2;
  return (
    <group>
      <RoundedBox args={[3.4, 0.14, 1.3]} position={[mid, 0.31, -0.3]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#2C3332" roughness={0.42} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[3.4, H + 0.3, 0.08]} position={[mid, 0.38 + (H + 0.3) / 2, -0.92]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#E9E3D6" roughness={0.6} />
      </RoundedBox>
      {bars.map((b, i) => (
        <group key={b.key}>
          <RoundedBox args={[0.4, Math.max(0.02, b.value * H), 0.4]} position={[barX(i), 0.38 + Math.max(0.02, b.value * H) / 2, -0.35]} radius={0.04} smoothness={2} castShadow receiveShadow>
            <meshPhysicalMaterial color={b.color} roughness={0.34} clearcoat={0.55} clearcoatRoughness={0.2} />
          </RoundedBox>
          <Tag position={[barX(i), 0.38 + b.value * H + 0.22, -0.35]} tone="ink" size="xs" center>
            {`${b.label} ${esPct.format(b.value)}`}
          </Tag>
        </group>
      ))}
      <Wire points={[[bx - 0.35, 0.38 + BAR * H, -0.12], [barX(3) + 0.35, 0.38 + BAR * H, -0.12]]} color={P.rose} dashed width={1.5} opacity={0.9} />
      <Tag position={[barX(3) + 0.42, 0.38 + BAR * H, -0.12]} tone="rose" size="xs">
        barra 30 %
      </Tag>
      {/* subconjunto de estudiantes: 20 preguntas de Nivel 1 */}
      <RoundedBox args={[1.9, 0.08, 1.05]} position={[mid, 0.28, 1.25]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#B9B09E" roughness={0.5} />
      </RoundedBox>
      {Array.from({ length: SUBSET }, (_, q) => (
        <RoundedBox key={q} args={[0.26, 0.06, 0.18]} position={[mid - 0.72 + (q % 5) * 0.36, 0.35, 0.89 + Math.floor(q / 5) * 0.24]} radius={0.02} smoothness={2} castShadow>
          <meshPhysicalMaterial color={q < correct ? P.teal : q === 5 ? mixHex(P.paper, P.rose, 0.45) : "#DAD4C8"} roughness={0.4} clearcoat={0.4} />
        </RoundedBox>
      ))}
      <Tag position={[mid, 0.3, 2.03]} tone="muted" size="xs" center plate={false}>
        20 de Nivel 1
      </Tag>
    </group>
  );
}

function SpanishVisual() {
  const [level, setLevel] = useState<Level>(1);
  const [correct, setCorrect] = useState(6);
  const [cursor, setCursor] = useState(0);
  const info = LEVELS[level];
  const pos = Math.min(cursor, info.steps - 1);
  const steps = stepPositions(level);
  const pass = correct / SUBSET >= BAR;
  const needed = Math.ceil(BAR * SUBSET);

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
        {[
          ["Nivel seleccionado", info.label],
          ["Tu agente", `${correct} / ${SUBSET} = ${esPct.format(correct / SUBSET)}`],
          ["Certificado del curso", pass ? "supera el 30 %" : `faltan ${needed - correct}`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>
        {info.label}: {info.range}. La terraza dibuja {info.steps} pasos y {info.tools} {info.tools === 1 ? "tool" : "tools"}; el recorrido avanza
        paso a paso porque cada uno depende del anterior.{" "}
        {level === 1
          ? "El subconjunto de estudiantes son 20 preguntas de este nivel, del set de validación."
          : "El subconjunto de estudiantes no llega a este nivel; es donde la brecha con las personas se ensancha."}
      </p>
      <p>
        Marcador de la Unit 4: humanos ~92 %, GPT-4 con plugins ~15 %, Deep Research 67,36 % en validación. La barra del certificado es el 30 %
        del subconjunto: {needed} aciertos de {SUBSET}. {pass ? "Tu agente la supera." : "Tu agente se queda por debajo (barra rosa)."}
      </p>
      <p className="text-xs text-muted">
        Recuentos de pasos y tools ilustrativos dentro de los rangos del curso; los porcentajes son los que cita la unidad, no una medición de
        iAguide. Las alturas de las barras son proporcionales al porcentaje.
      </p>
    </div>
  );

  return (
    <Figure
      label="Tres niveles de GAIA y la brecha humana"
      hint="terrazas de pasos y tools · marcador del curso"
      height="h-[500px] md:h-[580px]"
      legend={[
        { color: info.tone, label: "pasos del nivel" },
        { color: P.amber, label: "tools" },
        { color: P.rose, label: "barra del 30 %" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Nivel de GAIA"
            value={String(level) as "1" | "2" | "3"}
            onChange={(v) => {
              setLevel(Number(v) as Level);
              setCursor(0);
            }}
            options={[
              { value: "1", label: "Nivel 1", tone: P.teal },
              { value: "2", label: "Nivel 2", tone: P.violet },
              { value: "3", label: "Nivel 3", tone: P.rose },
            ]}
          />
          <Knob label="Aciertos /20" min={0} max={SUBSET} value={correct} onChange={setCorrect} tone={pass ? P.teal : P.rose} />
          <Readout items={[{ label: "paso", value: `${pos + 1}/${info.steps}`, tone: info.tone }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3, 5.5, 10], fov: 34 }} fit={1.06}>
        <ShadowBlob position={[-0.4, 0.004, 0]} scale={10} opacity={0.1} />
        <RoundedBox args={[10.8, 0.24, 3.7]} position={[-0.4, 0.12, 0.45]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
        </RoundedBox>
        {([1, 2, 3] as Level[]).map((l) => (
          <Terrace key={l} level={l} active={l === level} cursor={pos} />
        ))}
        <Walker target={steps[pos]} color={info.tone} />
        <Scoreboard correct={correct} />
        <Ticker seconds={0.9} onTick={() => setCursor((c) => (Math.min(c, info.steps - 1) + 1) % info.steps)} />
      </Stage>
    </Figure>
  );
}

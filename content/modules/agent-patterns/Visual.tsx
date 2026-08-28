"use client";

import { RoundedBox } from "@react-three/drei";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Flow,
  Halo,
  Marker,
  Node3D,
  Panel,
  PointerTilt,
  ShadowBlob,
  Tag,
  useCycle,
  type V3,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "react" | "code" | "graph";

const COPY = {
  en: {
    title: "one cycle, three encodings",
    hint: "ReAct is the idea; the libraries are dialects of it",
    react: "ReAct",
    code: "smolagents",
    graph: "LangGraph",
    legendThink: "think",
    legendAct: "act",
    legendObserve: "observe",
    phases: [
      { name: "think", note: "the model writes a reason, in prose" },
      { name: "act", note: "it names one tool and its arguments" },
      { name: "observe", note: "the result is appended and the loop repeats" },
    ],
    codePhases: [
      { name: "think", note: "the model writes a plan" },
      { name: "act", note: "it writes Python that calls several tools at once" },
      { name: "observe", note: "stdout and return values come back as one observation" },
    ],
    graphPhases: [
      { name: "node", note: "each step is a named node with typed state" },
      { name: "edge", note: "a router decides which node runs next" },
      { name: "state", note: "state is persisted, so a run can pause and resume" },
    ],
    tools: "tools",
    router: "router",
    state: "state",
    reactNote: "one tool per turn, chosen in prose — simple, chatty, many round trips",
    codeNote: "one code block can call three tools and loop — fewer turns, more blast radius",
    graphNote: "explicit nodes and edges — harder to write, far easier to resume and audit",
  },
  es: {
    title: "un ciclo, tres codificaciones",
    hint: "ReAct es la idea; las librerías son dialectos suyos",
    react: "ReAct",
    code: "smolagents",
    graph: "LangGraph",
    legendThink: "pensar",
    legendAct: "actuar",
    legendObserve: "observar",
    phases: [
      { name: "pensar", note: "el modelo escribe un razonamiento, en prosa" },
      { name: "actuar", note: "nombra una herramienta y sus argumentos" },
      { name: "observar", note: "el resultado se añade y el bucle se repite" },
    ],
    codePhases: [
      { name: "pensar", note: "el modelo escribe un plan" },
      { name: "actuar", note: "escribe Python que llama a varias herramientas de golpe" },
      { name: "observar", note: "stdout y valores de retorno vuelven como una observación" },
    ],
    graphPhases: [
      { name: "nodo", note: "cada paso es un nodo con estado tipado" },
      { name: "arista", note: "un router decide qué nodo se ejecuta después" },
      { name: "estado", note: "el estado se persiste: una ejecución puede pausarse y seguir" },
    ],
    tools: "herramientas",
    router: "router",
    state: "estado",
    reactNote: "una herramienta por turno, elegida en prosa — simple, charlatán, muchas idas y venidas",
    codeNote: "un bloque de código llama a tres herramientas y hace bucles — menos turnos, más radio de daño",
    graphNote: "nodos y aristas explícitos — más costoso de escribir, mucho más fácil de reanudar y auditar",
  },
};

/** The three phases sit on a triangle so the cycle reads as a cycle. */
const TRI: V3[] = [
  [0, 1.15, 0],
  [1.75, -0.75, 0.35],
  [-1.75, -0.75, 0.35],
];

const TONES = [P.teal, P.amber, P.violet];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("react");
  const [phase] = useCycle(3, 2.1);

  const accent = mode === "code" ? P.amber : mode === "graph" ? P.violet : P.teal;
  const phases = mode === "code" ? t.codePhases : mode === "graph" ? t.graphPhases : t.phases;
  const note = mode === "code" ? t.codeNote : mode === "graph" ? t.graphNote : t.reactNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendThink },
        { color: P.amber, label: t.legendAct },
        { color: P.violet, label: t.legendObserve },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "react", label: t.react, tone: P.teal },
            { value: "code", label: t.code, tone: P.amber },
            { value: "graph", label: t.graph, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      height="h-[370px] md:h-[460px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 7.4], fov: 40 }} background={P.paper} fit={1.1}>
        <PointerTilt amount={0.09}>
          <group position={[mode === "graph" ? -0.9 : 0, 0.15, 0]}>
            <ShadowBlob position={[0, -1.5, 0]} scale={6} opacity={0.05} />

            {/* The cycle itself: identical in all three dialects. */}
            <Flow
              points={[...TRI, TRI[0]]}
              color={accent}
              count={3}
              speed={0.18}
              size={0.06}
              lineOpacity={0.3}
              width={1.6}
            />

            {TRI.map((p, i) => {
              const on = i === phase;
              return (
                <group key={i} position={p}>
                  <Halo
                    radius={on ? 0.52 : 0.4}
                    color={TONES[i]}
                    opacity={on ? 0.8 : 0.25}
                    rotation={[0, 0, 0]}
                    spin={on ? 0.5 : 0}
                  />
                  {i === 1 && mode === "code" ? (
                    // smolagents: the action is a code block, not a name.
                    <group>
                      <RoundedBox args={[0.86, 0.6, 0.14]} radius={0.05} smoothness={3}>
                        <meshStandardMaterial color={P.surface} roughness={0.5} />
                      </RoundedBox>
                      {[0.16, 0.03, -0.1, -0.22].map((y, j) => (
                        <mesh key={y} position={[-0.06 + (j % 2) * 0.07, y, 0.08]}>
                          <boxGeometry args={[0.5 - (j % 3) * 0.12, 0.045, 0.02]} />
                          <meshStandardMaterial color={P.amber} roughness={0.45} />
                        </mesh>
                      ))}
                    </group>
                  ) : (
                    <Node3D
                      position={[0, 0, 0]}
                      color={on ? TONES[i] : P.lineStrong}
                      radius={0.24}
                      faceted
                      pulse={on ? 0.2 : 0}
                    />
                  )}
                  <Marker position={[0.42, 0.42, 0.2]} n={i + 1} color={on ? TONES[i] : P.faint} />
                  <Tag position={[0, i === 0 ? 0.74 : -0.7, 0.2]} tone={on ? "ink" : "muted"} size="xs" center>
                    {phases[i].name}
                  </Tag>
                </group>
              );
            })}

            {/* How many tools one "act" can reach is the real difference. */}
            <group position={[1.75, -1.85, 0.35]}>
              {(mode === "code" ? [-0.5, 0, 0.5] : [0]).map((x, i) => (
                <group key={x} position={[x, 0, 0]}>
                  <RoundedBox args={[0.36, 0.24, 0.16]} radius={0.05} smoothness={3}>
                    <meshStandardMaterial color={i === 0 ? accent : P.sunken} roughness={0.45} />
                  </RoundedBox>
                  <Arrow from={[0, 0.78, 0]} to={[0, 0.2, 0]} color={accent} width={1.3} head={0.08} opacity={0.75} />
                </group>
              ))}
              <Tag position={[0, -0.34, 0.12]} tone="muted" size="xs" center>
                {t.tools}
              </Tag>
            </group>
          </group>

          {/* LangGraph adds the two things prose loops never had. */}
          {mode === "graph" ? (
            <group position={[2.55, 0.2, 0]}>
              <Panel position={[0, 0.72, 0]} size={[1.5, 0.68]} color={P.violet} title={t.router} active fill={0.12} />
              <Panel position={[0, -0.55, 0]} size={[1.5, 0.68]} color={P.violetDeep} title={t.state} active fill={0.12} />
              <Arrow from={[-0.78, 0.72, 0]} to={[-1.5, 0.4, 0]} color={P.violet} width={1.4} head={0.09} dashed />
              <Arrow from={[0, -0.05, 0]} to={[0, 0.35, 0]} color={P.violetDeep} width={1.4} head={0.09} />
            </group>
          ) : null}
        </PointerTilt>

        <group position={[0, -2.05, 0]}>
          <Tag position={[0, 0.26, 0]} tone="ink" size="xs" center>
            {phase + 1}. {phases[phase].name} — {phases[phase].note}
          </Tag>
          <Tag position={[0, -0.06, 0]} tone={mode === "code" ? "amber" : mode === "graph" ? "violet" : "teal"} size="xs" center>
            {note}
          </Tag>
        </group>
      </Stage>
    </Figure>
  );
}

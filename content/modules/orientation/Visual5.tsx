"use client";

import { useMemo, useRef, useState } from "react";

import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* A model, the *editable* numbers view: a cloud of points (the weights)
   with three small stories running through it. */
type Phase = "before" | "while" | "after";

const COPY = {
  en: {
    title: "a model is a habit, stored as numbers",
    hint: "before · adjusting · after",
    before: "before",
    while: "adjusting",
    after: "after",
    weights: "weights",
    cloud: "habit cloud",
    loss: "loss",
    train: "training run",
    eval: "evaluation",
    step: "step",
    beforeNote: "statistical habit; no fact lookup",
    whileNote: "numbers move · loss drops · time costs GPU",
    afterNote: "new file, new habit · nothing about you yet",
    needle: "your prompt",
  },
  es: {
    title: "un modelo es un hábito, guardado como números",
    hint: "antes · ajustando · después",
    before: "antes",
    while: "ajustando",
    after: "después",
    weights: "pesos",
    cloud: "nube de hábitos",
    loss: "pérdida",
    train: "carrera de entrenamiento",
    eval: "evaluación",
    step: "paso",
    beforeNote: "hábito estadístico · no consulta hechos",
    whileNote: "los números se mueven · la pérdida baja · cuesta GPU",
    afterNote: "archivo nuevo, hábito nuevo · aún no sabe nada de ti",
    needle: "tu prompt",
  },
};

const SEED = 31415;

/* Cheap, deterministic PRNG so server/client render the same cloud. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function WeightCloud({ active }: { active: boolean }) {
  const ref = useRef<Group>(null);
  const rand = useMemo(() => mulberry32(SEED), []);
  const points = useMemo(() => {
    const pts: { x: number; y: number; z: number; tone: number }[] = [];
    // A flattened ellipsoid — the "habit cloud" — 160 weights, denser at the core.
    for (let i = 0; i < 160; i++) {
      const r = Math.pow(rand(), 0.5) * 1.6;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta) * 1.15;
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.45;
      const z = r * Math.cos(phi) * 0.95;
      pts.push({ x, y, z, tone: rand() });
    }
    return pts;
  }, [rand]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = active ? 0.06 : 0;
    ref.current.rotation.y = MathUtils.damp(ref.current.rotation.y, target, 1.4, dt);
  });

  return (
    <group ref={ref}>
      {points.map((p, i) => {
        const tone = p.tone;
        const color = tone > 0.66 ? P.violet : tone > 0.33 ? P.teal : P.amber;
        return (
          <Node3D
            key={i}
            position={[p.x, p.y, p.z]}
            color={color}
            radius={0.04 + (1 - p.tone) * 0.025}
            matte
          />
        );
      })}
    </group>
  );
}

function LossCurve({ active }: { active: boolean }) {
  /* Hand-drawn loss curve — high, jagged, dropping, flat, dropping again.
     Plain DOM via Tag for crispness, but a 3D-style ribbon underpins it. */
  return (
    <group position={[0, -0.4, 0.55]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 0.2]} />
        <meshBasicMaterial color={P.surface} transparent opacity={0.7} />
      </mesh>
      <Slab position={[0, 0, 0.005]} size={[3.4, 0.16, 0.01]} color={P.paper} fill={0} rim={0.18} />
      <Flow
        points={[
          [-1.55, 0.06, 0.02],
          [-1.15, 0.03, 0.02],
          [-0.85, -0.02, 0.02],
          [-0.45, 0.04, 0.02],
          [-0.05, -0.05, 0.02],
          [0.45, -0.06, 0.02],
          [0.95, -0.08, 0.02],
          [1.45, -0.075, 0.02],
        ]}
        color={P.amber}
        count={active ? 6 : 2}
        speed={0.32}
        size={0.04}
        lineOpacity={0.32}
      />
      <Ribbon
        points={[
          [-1.65, 0.16, 0],
          [-1.15, 0.04, 0],
          [-0.85, -0.02, 0],
          [-0.45, 0.05, 0],
          [-0.05, -0.06, 0],
          [0.45, -0.07, 0],
          [0.95, -0.085, 0],
          [1.65, -0.085, 0],
        ]}
        color={P.amberDeep}
        radius={0.014}
        opacity={0.85}
      />
    </group>
  );
}

export default function Visual5() {
  const t = useCopy(COPY);
  const [phase, setPhase] = useState<Phase>("before");

  const phases: Phase[] = ["before", "while", "after"];
  const labels = { before: t.before, while: t.while, after: t.after };
  const tones = { before: "violet", while: "amber", after: "teal" } as const;
  const colors = { before: P.violet, while: P.amber, after: P.teal };

  const note = phase === "before" ? t.beforeNote : phase === "while" ? t.whileNote : t.afterNote;
  const activeColor = colors[phase];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={phases.map((p) => ({ color: colors[p], label: labels[p] }))}
      controls={
        <Switcher
          value={phase}
          onChange={setPhase}
          options={phases.map((p) => ({
            value: p,
            label: labels[p],
            tone: colors[p],
          }))}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 6.6], fov: 38 }} background={P.paper} maxDpr={2} fit={1}>
        <Motes count={120} radius={6.5} color={P.lineStrong} size={0.02} opacity={0.18} />
        <PointerTilt amount={0.08}>
          {/* the cloud of weights, base layer */}
          <group position={[0, 0.55, 0]}>
            <WeightCloud active={phase === "while"} />
          </group>

          {/* the "your prompt" needle entering on the left */}
          <group position={[-2.05, -0.05, 0.4]}>
            <Wire points={[[-0.05, 0, 0], [0.6, 0, 0]]} color={P.ink} width={1.8} opacity={0.9} />
            <Node3D position={[0.62, 0, 0]} color={P.ink} radius={0.05} matte />
            <Tag position={[0.05, 0.22, 0]} tone="ink" size="xs">
              {t.needle}
            </Tag>
          </group>

          {/* the output stream leaving on the right */}
          <group position={[2.05, -0.05, 0.4]}>
            <Flow
              points={[[-0.55, 0, 0], [-0.05, 0, 0]]}
              color={activeColor}
              count={phase === "after" ? 5 : 3}
              speed={0.36}
              size={0.04}
              lineOpacity={0.18}
            />
            <Tag position={[-0.05, 0.22, 0]} tone={tones[phase]} size="xs">
              {t.cloud}
            </Tag>
          </group>

          {/* loss curve, only when actively adjusting */}
          {phase === "while" ? (
            <group position={[0, -0.4, 0]}>
              <LossCurve active />
            </group>
          ) : (
            <group position={[0, -0.4, 0]}>
              <LossCurve active={false} />
            </group>
          )}

          {/* ground */}
          <ShadowBlob position={[0, -0.85, 0]} scale={4.4} opacity={0.07} />
          {/* connecting ribbon between input, cloud, output */}
          <Ribbon
            points={[
              [-1.55, -0.05, 0.4],
              [-0.7, 0.4, 0.2],
              [0, 0.55, 0],
              [0.7, 0.4, 0.2],
              [1.55, -0.05, 0.4],
            ]}
            color={P.lineStrong}
            radius={0.012}
            opacity={0.32}
          />

          {/* context note that explains the phase */}
          <Tag position={[0, -1.16, 0.06]} tone={tones[phase]} size="sm" center>
            {note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Group } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Bars, Marker, PointerTilt, ShadowBlob, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "one" | "batch" | "spec";

const COPY = {
  en: {
    title: "one GPU, three schedules",
    hint: "bottom row is the GPU's own clock · every gap is money burning",
    one: "One user",
    batch: "Continuous batch",
    spec: "Speculative",
    legendStep: "GPU step",
    legendIdle: "idle",
    legendToken: "token delivered",
    gpu: "gpu",
    request: "req",
    busy: "gpu busy",
    perStep: "tokens / step",
    oneNote: "a single stream leaves the GPU idle between steps — latency is fine, throughput is a waste",
    batchNote: "other requests join the same step: the step costs a little more and pays out many times",
    specNote: "a small draft model proposes several tokens; one verification pass keeps the ones it got right",
    drafted: "drafted",
    kept: "kept",
  },
  es: {
    title: "una GPU, tres calendarios",
    hint: "la fila de abajo es el reloj de la GPU · cada hueco es dinero quemándose",
    one: "Un usuario",
    batch: "Batch continuo",
    spec: "Especulativo",
    legendStep: "paso de GPU",
    legendIdle: "inactiva",
    legendToken: "token entregado",
    gpu: "gpu",
    request: "pet",
    busy: "gpu ocupada",
    perStep: "tokens / paso",
    oneNote: "un solo flujo deja la GPU parada entre pasos — la latencia está bien, el rendimiento se tira",
    batchNote: "otras peticiones se suben al mismo paso: cuesta un poco más y rinde muchas veces",
    specNote: "un modelo borrador propone varios tokens; una pasada de verificación se queda los acertados",
    drafted: "propuestos",
    kept: "aceptados",
  },
};

const T0 = -2.9;
const T1 = 2.9;
const SPANT = T1 - T0;
const PERIOD = 0.74;
const STEPS = 8;

type Plan = {
  /** Width of one GPU step on the time axis. */
  width: number;
  /** Requests served per step. */
  lanes: number;
  /** Tokens delivered per request per step. */
  perLane: number;
};

const PLANS: Record<Mode, Plan> = {
  one: { width: 0.2, lanes: 1, perLane: 1 },
  batch: { width: 0.5, lanes: 5, perLane: 1 },
  spec: { width: 0.34, lanes: 1, perLane: 3 },
};

/** A step block on the GPU's timeline. */
function Step({ x, width, color }: { x: number; width: number; color: string }) {
  return (
    <mesh position={[x + width / 2, 0, 0]}>
      <boxGeometry args={[width, 0.26, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.42} metalness={0.04} />
    </mesh>
  );
}

/** Sweeps the timeline so the reader sees the schedule being consumed. */
function Playhead({ color }: { color: string }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = (clock.elapsedTime * 0.22) % 1;
    g.position.x = T0 + t * SPANT;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.55, 0.3]}>
        <boxGeometry args={[0.02, 2.5, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("one");
  const plan = PLANS[mode];
  const accent = mode === "batch" ? P.amber : mode === "spec" ? P.violet : P.teal;
  const note = mode === "batch" ? t.batchNote : mode === "spec" ? t.specNote : t.oneNote;

  const steps = useMemo(
    () => Array.from({ length: STEPS }, (_, i) => T0 + 0.1 + i * PERIOD),
    [],
  );

  // Both numbers describe the picture above them, not a benchmark.
  const busy = Math.min(1, plan.width / PERIOD);
  const tokensPerStep = plan.lanes * plan.perLane;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendStep },
        { color: P.line, label: t.legendIdle },
        { color: P.amber, label: t.legendToken },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "one", label: t.one, tone: P.teal },
            { value: "batch", label: t.batch, tone: P.amber },
            { value: "spec", label: t.spec, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      height="h-[370px] md:h-[460px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.6, 7.2], fov: 40 }} background={P.paper} fit={1.1}>
        <PointerTilt amount={0.06}>
          <group position={[0, 0.15, 0]} rotation={[-0.18, 0, 0]}>
            <ShadowBlob position={[0, -1.35, 0]} scale={8} opacity={0.05} />

            {/* Request lanes: who is waiting, and what they get back. */}
            {Array.from({ length: plan.lanes }, (_, lane) => {
              const y = 1.65 - lane * 0.34;
              return (
                <group key={lane} position={[0, y, 0]}>
                  <Wire
                    points={[
                      [T0, 0, 0],
                      [T1, 0, 0],
                    ]}
                    color={P.line}
                    opacity={0.9}
                    width={1}
                  />
                  {steps.map((x, i) =>
                    Array.from({ length: plan.perLane }, (_, k) => (
                      <mesh
                        key={`${i}-${k}`}
                        position={[x + plan.width + 0.08 + k * 0.13, 0.09, 0]}
                      >
                        <boxGeometry args={[0.1, 0.1, 0.1]} />
                        <meshStandardMaterial
                          color={mode === "spec" && k === 2 ? P.rose : P.amber}
                          roughness={0.42}
                        />
                      </mesh>
                    )),
                  )}
                  <Tag position={[T0 - 0.42, 0, 0]} tone="muted" size="xs">
                    {t.request} {lane + 1}
                  </Tag>
                </group>
              );
            })}

            {/* The GPU's own clock. Gaps here are the whole lesson. */}
            <group position={[0, -0.55, 0]}>
              <mesh position={[0, 0, -0.03]}>
                <boxGeometry args={[SPANT, 0.3, 0.34]} />
                <meshStandardMaterial color={P.sunken} roughness={0.6} />
              </mesh>
              {steps.map((x, i) => (
                <Step key={i} x={x} width={plan.width} color={accent} />
              ))}
              <Tag position={[T0 - 0.42, 0, 0]} tone="ink" size="xs">
                {t.gpu}
              </Tag>
              <Marker position={[T0 + 0.1 + plan.width / 2, -0.36, 0.2]} n={1} color={accent} />
            </group>

            <Playhead color={accent} />

            {mode === "spec" ? (
              <group position={[0, -1.15, 0]}>
                <Tag position={[-1.2, 0, 0]} tone="amber" size="xs" center>
                  {t.drafted}: 3
                </Tag>
                <Tag position={[1.2, 0, 0]} tone="teal" size="xs" center>
                  {t.kept}: 2
                </Tag>
              </group>
            ) : null}
          </group>

          <group position={[0, -2.15, 0]}>
            <Bars
              bars={[
                { label: t.busy, value: busy, color: accent, note: `${Math.round(busy * 100)}%` },
                {
                  label: t.perStep,
                  value: Math.min(1, tokensPerStep / 6),
                  color: P.amber,
                  note: `${tokensPerStep}`,
                },
              ]}
              height={0.6}
              width={0.46}
              gap={0.95}
              depth={0.28}
            />
          </group>
        </PointerTilt>

        <Tag position={[0, -3.0, 0]} tone={mode === "batch" ? "amber" : mode === "spec" ? "violet" : "teal"} size="xs" center>
          {note}
        </Tag>
      </Stage>
    </Figure>
  );
}

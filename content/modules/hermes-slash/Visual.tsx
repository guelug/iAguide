"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Ribbon, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  Duct,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFloat,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Three slash levers, drawn as three desks — not a row of slabs.
 *
 * /btw is a one-way carbon copy of the live transcript.
 * /bg is a sister session that does not inherit the live stack.
 * /model swaps this session's brain and resets the prompt cache;
 * YAML is not in the picture unless a tag says --global (it does not).
 */

type Step = "btw" | "bg" | "model";

const COPY = {
  en: {
    title: "slash commands, three levers",
    hint: "snapshot · sister session · this session's model",
    btw: "/btw",
    bg: "/bg",
    model: "/model",
    live: "live session",
    ghost: "read-only snapshot",
    sister: "sister session",
    cache: "prompt cache resets",
    sessionOnly: "session only",
    legendLive: "live session",
    legendSnap: "snapshot",
    legendSister: "sister session",
    notes: {
      btw: "/btw is a one-shot side question on a read-only snapshot: the live transcript and its prompt cache stay untouched.",
      bg: "/bg starts a fresh background session. The duct does not come from the live history — the sister begins empty.",
      model: "A mid-session /model swap changes this session's brain and resets the prompt cache. YAML is not written unless you pass --global.",
    },
  },
  es: {
    title: "comandos rápidos, tres palancas",
    hint: "snapshot · sesión hermana · modelo de esta sesión",
    btw: "/btw",
    bg: "/bg",
    model: "/model",
    live: "sesión viva",
    ghost: "snapshot de solo lectura",
    sister: "sesión hermana",
    cache: "la prompt caché se resetea",
    sessionOnly: "solo sesión",
    legendLive: "sesión viva",
    legendSnap: "snapshot",
    legendSister: "sesión hermana",
    notes: {
      btw: "/btw es una pregunta lateral de un tiro sobre un snapshot de solo lectura: el transcript vivo y su prompt caché no se tocan.",
      bg: "/bg arranca una sesión de fondo nueva. El ducto no sale del historial vivo: la hermana empieza vacía.",
      model: "Un /model a mitad de sesión cambia el cerebro de esta sesión y resetea la prompt caché. El YAML no se escribe salvo --global.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

const LIVE: V3 = [0.15, 0, 1.2];
const GHOST: V3 = [-3.15, 0, -1.7];
const SISTER: V3 = [3.2, 0, -1.45];
const BG_START: V3 = [4.15, 0.22, 2.55];

const LIVE_TOP: V3 = [LIVE[0], 1.05, LIVE[2]];
const GHOST_TOP: V3 = [GHOST[0], 1.55, GHOST[2]];
const SISTER_TOP: V3 = [SISTER[0], 1.15, SISTER[2]];
const BRAIN: V3 = [LIVE[0] + 0.12, 2.55, LIVE[2] + 0.12];

const LIVE_SPINE: V3[] = [
  [LIVE[0] + 0.35, 0.08, LIVE[2] + 0.2],
  [LIVE[0] + 0.2, 0.42, LIVE[2] + 0.08],
  [LIVE[0] + 0.08, 0.82, LIVE[2] - 0.02],
];

function Brain({ color }: { color: string }) {
  return (
    <group position={BRAIN}>
      <mesh castShadow>
        <boxGeometry args={[0.46, 0.46, 0.46]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.38}
          roughness={0.12}
          metalness={0.04}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[0.46, 0.46, 0.46]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function LiveStack({ on, writing }: { on: boolean; writing: boolean }) {
  const fill = on ? 0.88 : 0.22;
  const color = on ? P.tealWash : P.line;
  const mark = writing ? P.teal : P.lineStrong;
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <Sheet
          key={i}
          position={[
            LIVE[0] + 0.28 + i * 0.045,
            0.05 + i * 0.075,
            LIVE[2] + 0.18 - i * 0.04,
          ]}
          size={[1.55, 1.08]}
          color={color}
          fill={fill}
          marks={4}
          markColor={mark}
        />
      ))}
    </group>
  );
}

function GhostStack({ on }: { on: boolean }) {
  const fill = on ? 0.34 : 0.1;
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <Sheet
          key={i}
          position={[
            GHOST[0] + 0.18 + i * 0.07,
            0.92 + i * 0.07,
            GHOST[2] + 0.1 - i * 0.05,
          ]}
          size={[1.42, 0.98]}
          color={P.amber}
          fill={fill}
          marks={on ? 3 : 1}
          markColor={P.amberDeep}
        />
      ))}
    </group>
  );
}

function SisterStack({ on }: { on: boolean }) {
  return (
    <group>
      {[0, 1].map((i) => (
        <Sheet
          key={i}
          position={[
            SISTER[0] + 0.22 + i * 0.05,
            0.05 + i * 0.07,
            SISTER[2] + 0.12 - i * 0.03,
          ]}
          size={[1.35, 0.95]}
          color={on ? P.violetWash : P.line}
          fill={on ? 0.55 : 0.16}
          marks={0}
        />
      ))}
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [step, setStep] = useState<Step>("btw");

  const liveOn = step === "model" || step === "btw";
  const ghostOn = step === "btw";
  const sisterOn = step === "bg";
  const modelOn = step === "model";
  const brainColor = modelOn ? P.amber : P.teal;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendLive },
        { color: P.amber, label: t.legendSnap },
        { color: P.violet, label: t.legendSister },
      ]}
      controls={
        <Switcher
          value={step}
          onChange={setStep}
          options={[
            { value: "btw", label: t.btw, tone: P.amber },
            { value: "bg", label: t.bg, tone: P.violet },
            { value: "model", label: t.model, tone: P.teal },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[step]}</strong>
          {" — "}
          {t.notes[step]}
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.14}
      >
        <IsoFrame width={13.2} depth={12.4} y={-0.04} />
        <PlanTrace
          points={[
            [-5.8, 4.1],
            [-2.2, 4.1],
            [-2.2, 1.9],
          ]}
          y={-0.03}
          color={P.line}
          opacity={0.8}
        />
        <PlanTrace
          points={[
            [5.7, -3.9],
            [3.0, -3.9],
            [3.0, -1.6],
          ]}
          y={-0.03}
          color={P.line}
          opacity={0.8}
        />
        <PlanTrace
          points={[
            [-5.4, -3.6],
            [-5.4, -1.7],
            [-3.4, -1.7],
          ]}
          y={-0.03}
          color={P.amber}
          opacity={ghostOn ? 0.7 : 0.28}
        />
        <PlanTrace
          points={[
            [5.5, 3.8],
            [4.2, 3.8],
            [4.2, 2.4],
          ]}
          y={-0.03}
          color={P.violet}
          opacity={sisterOn ? 0.7 : 0.28}
        />

        {/* Live session: teal plate + running transcript. */}
        <GlassPanel
          position={[LIVE[0], 1.55, LIVE[2]]}
          rotation={ISO}
          size={[2.25, 2.55]}
          color={P.teal}
          opacity={liveOn || modelOn ? 0.26 : 0.08}
        />
        <LiveStack on={liveOn || modelOn} writing={!modelOn} />
        <Ribbon points={LIVE_SPINE} color={P.teal} radius={0.028} opacity={liveOn || modelOn ? 1 : 0.25} />
        <Flow
          points={LIVE_SPINE}
          color={P.teal}
          count={3}
          speed={0.22}
          size={0.055}
          lineOpacity={0}
          paused={!liveOn && !modelOn}
        />
        <Tag
          position={[LIVE[0], 3.12, LIVE[2]]}
          tone={liveOn || modelOn ? "teal" : "muted"}
          size="xs"
          center
        >
          {t.live}
        </Tag>
        <AxisLine
          from={[LIVE[0] - 1.35, 0.02, LIVE[2] - 1.05]}
          to={[LIVE[0] + 1.45, 0.02, LIVE[2] + 1.15]}
          overrun={0.45}
          color={P.teal}
          opacity={liveOn || modelOn ? 0.4 : 0.16}
        />
        <Brain color={brainColor} />

        {/* /btw: one-way snapshot. Ghost does not duct back into live. */}
        <GlassPanel
          position={[GHOST[0], 1.85, GHOST[2]]}
          rotation={ISO}
          size={[2.05, 2.15]}
          color={P.amber}
          opacity={ghostOn ? 0.22 : 0.07}
        />
        <IsoFloat amount={ghostOn ? 0.07 : 0.03} speed={0.55} seed={1.2}>
          <GhostStack on={ghostOn} />
        </IsoFloat>
        <Duct
          from={LIVE_TOP}
          to={GHOST_TOP}
          color={ghostOn ? P.amber : P.lineStrong}
          radius={0.09}
          bend={0.82}
        />
        {ghostOn ? (
          <Flow
            points={[LIVE_TOP, [ -1.4, 1.85, -0.15 ], GHOST_TOP]}
            color={P.amber}
            count={4}
            speed={0.18}
            size={0.07}
            lineOpacity={0}
          />
        ) : null}
        <Tag
          position={[GHOST[0], 3.05, GHOST[2]]}
          tone={ghostOn ? "amber" : "muted"}
          size="xs"
          center
        >
          {t.ghost}
        </Tag>
        <AxisLine
          from={[GHOST[0] - 1.1, 0.02, GHOST[2] - 0.9]}
          to={[GHOST[0] + 1.2, 0.02, GHOST[2] + 0.95]}
          overrun={0.4}
          color={P.amber}
          opacity={ghostOn ? 0.42 : 0.14}
        />

        {/* /bg: sister session. Duct from a side start, not the live stack. */}
        <GlassPanel
          position={[SISTER[0], 1.45, SISTER[2]]}
          rotation={ISO}
          size={[2.1, 2.35]}
          color={P.violet}
          opacity={sisterOn ? 0.24 : 0.07}
        />
        <SisterStack on={sisterOn} />
        <mesh position={BG_START} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial
            color={sisterOn ? P.violet : P.lineStrong}
            roughness={0.38}
            metalness={0.06}
          />
        </mesh>
        <Duct
          from={BG_START}
          to={SISTER_TOP}
          color={sisterOn ? P.violet : P.lineStrong}
          radius={0.09}
          bend={0.78}
        />
        {sisterOn ? (
          <Flow
            points={[BG_START, [3.7, 1.7, 0.4], SISTER_TOP]}
            color={P.violet}
            count={4}
            speed={0.2}
            size={0.07}
            lineOpacity={0}
          />
        ) : null}
        <Tag
          position={[SISTER[0], 2.95, SISTER[2]]}
          tone={sisterOn ? "violet" : "muted"}
          size="xs"
          center
        >
          {t.sister}
        </Tag>
        <Tag
          position={[BG_START[0], BG_START[1] + 0.55, BG_START[2]]}
          tone={sisterOn ? "violet" : "muted"}
          size="xs"
          center
        >
          {t.bg}
        </Tag>
        <AxisLine
          from={[SISTER[0] - 1.05, 0.02, SISTER[2] - 0.85]}
          to={[SISTER[0] + 1.25, 0.02, SISTER[2] + 1.0]}
          overrun={0.4}
          color={P.violet}
          opacity={sisterOn ? 0.42 : 0.14}
        />

        {/* /model: brain swaps teal → amber; cache note; no YAML. */}
        {modelOn ? (
          <group>
            <AxisLine
              from={BRAIN}
              to={[BRAIN[0] + 1.85, BRAIN[1] + 0.35, BRAIN[2] + 0.15]}
              overrun={0.25}
              color={P.amber}
              opacity={0.55}
            />
            <Tag
              position={[BRAIN[0] + 2.15, BRAIN[1] + 0.55, BRAIN[2] + 0.2]}
              tone="amber"
              size="xs"
              center
            >
              {t.cache}
            </Tag>
            <Tag
              position={[BRAIN[0] - 0.15, BRAIN[1] + 0.62, BRAIN[2] - 0.05]}
              tone="teal"
              size="xs"
              center
            >
              {t.sessionOnly}
            </Tag>
            <IsoDust count={36} center={[BRAIN[0], BRAIN[1] - 0.35, BRAIN[2]]} spread={[0.7, 0.55, 0.7]} />
          </group>
        ) : null}

        {ghostOn ? (
          <IsoDust count={32} center={[GHOST[0], 1.35, GHOST[2]]} spread={[0.9, 0.7, 0.9]} color={P.amber} />
        ) : null}
        {sisterOn ? (
          <IsoDust count={32} center={[SISTER[0], 1.1, SISTER[2]]} spread={[0.85, 0.65, 0.85]} color={P.violet} />
        ) : null}
        {step === "btw" ? (
          <IsoDust count={20} center={[LIVE[0], 1.15, LIVE[2]]} spread={[0.7, 0.5, 0.7]} color={P.teal} />
        ) : null}
      </Stage>
    </Figure>
  );
}

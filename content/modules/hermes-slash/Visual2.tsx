"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Flow,
  Halo,
  Motes,
  Node3D,
  PointerTilt,
  Slab,
  Tag,
  Wire,
  type V3,
} from "@/components/three/atoms";
import {
  Duct,
  ISO_CAMERA,
  IsoDust,
  IsoFloat,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Command = "refine" | "review" | "branch";

const COPY = {
  en: {
    title: "three slash commands, three destinations",
    hint: "snapshot · reviewer · session fork",
    refine: "/refine",
    review: "/review",
    branch: "/branch",
    live: "live",
    snapshot: "snapshot",
    reviewer: "reviewer",
    tools: "tools",
    result: "result",
    fork: "fork",
    pathA: "path A",
    pathB: "path B",
    refineNote:
      "/refine runs memory and skill review now against a read-only snapshot. The live session and prompt cache stay untouched; its result returns in the background.",
    reviewNote:
      "/review starts an independent full-tool reviewer over the recent work. It investigates in the background and re-enters as a subagent completion.",
    branchNote:
      "/branch (or /fork) splits the current session to explore another path. The new path keeps the conversation state but can evolve separately.",
  },
  es: {
    title: "tres comandos slash, tres destinos",
    hint: "snapshot · revisor · fork de sesión",
    refine: "/refine",
    review: "/review",
    branch: "/branch",
    live: "viva",
    snapshot: "snapshot",
    reviewer: "revisor",
    tools: "tools",
    result: "resultado",
    fork: "fork",
    pathA: "ruta A",
    pathB: "ruta B",
    refineNote:
      "/refine revisa memoria y skills ahora contra un snapshot de solo lectura. La sesión viva y la prompt caché quedan intactas; el resultado vuelve en segundo plano.",
    reviewNote:
      "/review arranca un revisor independiente con tools sobre el trabajo reciente. Investiga en segundo plano y vuelve como completion de subagente.",
    branchNote:
      "/branch (o /fork) parte la sesión actual para explorar otra ruta. La nueva ruta conserva el estado de la conversación, pero puede evolucionar aparte.",
  },
};

type Copy = (typeof COPY)["es"];

function GroundTrace({
  points,
  y,
  color,
  opacity,
}: {
  points: [number, number][];
  y?: number;
  color: string;
  opacity?: number;
}) {
  return (
    <group userData={{ noFit: true }}>
      <PlanTrace points={points} y={y} color={color} opacity={opacity} />
    </group>
  );
}

function SessionStack({
  position,
  color,
  label,
  count = 4,
}: {
  position: V3;
  color: string;
  label: string;
  count?: number;
}) {
  const tone = color === P.teal ? "teal" : color === P.amber ? "amber" : color === P.violet ? "violet" : "muted";
  return (
    <group position={position}>
      <IsoFloat amount={0.035} speed={0.45} seed={position[0] * 0.3 + position[2]}>
        <group>
          {Array.from({ length: count }, (_, i) => (
            <Sheet
              key={i}
              position={[0.04 + i * 0.055, 0.18 + i * 0.07, 0.08 - i * 0.035]}
              size={[1.72, 1.15]}
              color={color}
              fill={0.54 + (count - i) * 0.08}
              marks={i % 2 === 0 ? 3 : 2}
              markColor={color}
            />
          ))}
          <Slab position={[0, 1.42, 0]} size={[1.9, 1.85, 0.18]} color={color} fill={0.68} rim={0.94} />
          <Tag position={[0, 2.5, 0.2]} tone={tone} size="xs" center>
            {label}
          </Tag>
          <Node3D position={[0.63, 0.68, 0.2]} color={color} radius={0.085} pulse={0.7} matte />
        </group>
      </IsoFloat>
    </group>
  );
}

function RefineView({ t }: { t: Copy }) {
  return (
    <>
      <GroundTrace points={[[-5.8, 3.6], [-3.5, 3.6], [-3.5, 1.7], [-0.9, 1.7]]} y={-0.03} color={P.amber} opacity={0.52} />
      <GroundTrace points={[[0.6, -1.5], [2.7, -1.5], [2.7, -3.7], [5.7, -3.7]]} y={-0.03} color={P.teal} opacity={0.38} />
      <SessionStack position={[-3.2, 0, 0.55]} color={P.teal} label={t.live} />
      <SessionStack position={[2.65, 0, -0.45]} color={P.amber} label={t.snapshot} count={3} />
      <Slab position={[0, 2.08, 0.12]} size={[1.54, 0.62, 0.14]} color={P.amber} fill={0.76} rim={0.96} />
      <Tag position={[0, 2.08, 0.36]} tone="amber" size="xs" center>
        {t.refine}
      </Tag>
      <Duct from={[-2.05, 1.58, 0.5]} to={[1.68, 1.63, -0.25]} color={P.amber} radius={0.065} bend={0.72} />
      <Flow points={[[-2.0, 1.58, 0.52], [-0.15, 1.85, 0.2], [1.7, 1.63, -0.24]]} color={P.amber} count={4} speed={0.18} size={0.055} lineOpacity={0} />
      <Arrow from={[2.18, 0.9, -0.4]} to={[3.45, 0.9, -0.4]} color={P.teal} width={1.6} head={0.1} />
      <Slab position={[4.12, 0.9, -0.42]} size={[1.4, 0.58, 0.14]} color={P.teal} fill={0.74} rim={0.94} />
      <Tag position={[4.12, 0.9, -0.17]} tone="teal" size="xs" center>
        {t.result}
      </Tag>
      <Wire points={[[-1.9, 0.77, 0.57], [1.42, 0.72, -0.28]]} color={P.lineStrong} width={1.15} dashed />
      <Tag position={[0, -0.68, 0.4]} tone="muted" size="xs" center>
        read-only
      </Tag>
      <Halo position={[2.65, 1.45, -0.44]} radius={1.02} color={P.amber} opacity={0.18} spin={0.1} />
    </>
  );
}

function ReviewView({ t }: { t: Copy }) {
  return (
    <>
      <GroundTrace points={[[-5.6, 3.7], [-3.6, 3.7], [-3.6, 1.65], [-1.2, 1.65]]} y={-0.03} color={P.teal} opacity={0.52} />
      <GroundTrace points={[[1.0, -1.65], [2.8, -1.65], [2.8, -3.7], [5.6, -3.7]]} y={-0.03} color={P.violet} opacity={0.42} />
      <SessionStack position={[-3.3, 0, 0.5]} color={P.teal} label={t.live} />
      <SessionStack position={[2.25, 0, -0.35]} color={P.violet} label={t.reviewer} count={3} />
      <Slab position={[0, 2.12, 0.14]} size={[1.62, 0.64, 0.14]} color={P.violet} fill={0.76} rim={0.96} />
      <Tag position={[0, 2.12, 0.39]} tone="violet" size="xs" center>
        {t.review}
      </Tag>
      <Duct from={[-2.13, 1.58, 0.5]} to={[1.24, 1.6, -0.25]} color={P.violet} radius={0.065} bend={0.7} />
      <Flow points={[[-2.05, 1.58, 0.52], [-0.2, 1.85, 0.18], [1.25, 1.6, -0.23]]} color={P.violet} count={4} speed={0.19} size={0.055} lineOpacity={0} />
      <Node3D position={[2.88, 1.24, -0.1]} color={P.amber} radius={0.1} pulse={0.8} />
      <Node3D position={[3.25, 0.93, 0.1]} color={P.amber} radius={0.1} pulse={1.2} />
      <Node3D position={[2.86, 0.62, -0.12]} color={P.amber} radius={0.1} pulse={1.6} />
      <Tag position={[3.12, 1.65, 0.22]} tone="amber" size="xs" center>
        {t.tools}
      </Tag>
      <Arrow from={[3.1, 0.26, -0.3]} to={[4.12, 0.26, -0.3]} color={P.violet} width={1.5} head={0.1} />
      <Slab position={[4.72, 0.26, -0.32]} size={[1.36, 0.58, 0.14]} color={P.violet} fill={0.74} rim={0.94} />
      <Tag position={[4.72, 0.26, -0.08]} tone="violet" size="xs" center>
        {t.result}
      </Tag>
      <Tag position={[0, -0.73, 0.38]} tone="muted" size="xs" center>
        tools
      </Tag>
      <Halo position={[2.25, 1.45, -0.35]} radius={1.02} color={P.violet} opacity={0.18} spin={0.1} />
    </>
  );
}

function BranchView({ t }: { t: Copy }) {
  return (
    <>
      <GroundTrace points={[[-5.7, 3.7], [-2.1, 3.7], [-2.1, 1.6], [0, 1.6]]} y={-0.03} color={P.teal} opacity={0.5} />
      <GroundTrace points={[[0, 1.6], [2.15, 1.6], [2.15, 3.7], [5.7, 3.7]]} y={-0.03} color={P.violet} opacity={0.42} />
      <GroundTrace points={[[0, 1.6], [-0.2, -1.4], [-2.1, -1.4], [-2.1, -3.7], [-5.6, -3.7]]} y={-0.03} color={P.amber} opacity={0.38} />
      <SessionStack position={[-3.1, 0, 0.48]} color={P.teal} label={t.live} />
      <Slab position={[0, 1.8, 0.15]} size={[1.42, 0.62, 0.14]} color={P.inkSoft} fill={0.74} rim={0.94} />
      <Tag position={[0, 1.8, 0.4]} tone="ink" size="xs" center>
        {t.fork}
      </Tag>
      <Node3D position={[0, 1.05, 0.18]} color={P.inkSoft} radius={0.13} pulse={0.6} />
      <Duct from={[-2.12, 1.58, 0.5]} to={[0, 1.1, 0.18]} color={P.inkSoft} radius={0.065} bend={0.55} />
      <Flow points={[[-2.06, 1.58, 0.5], [-0.9, 1.35, 0.36], [0, 1.08, 0.18]]} color={P.inkSoft} count={3} speed={0.18} size={0.05} lineOpacity={0} />
      <Duct from={[0.05, 1.05, 0.18]} to={[2.18, 1.55, -0.22]} color={P.violet} radius={0.06} bend={0.5} />
      <Duct from={[-0.04, 1.03, 0.18]} to={[-1.35, 0.26, 0.4]} color={P.amber} radius={0.06} bend={0.36} />
      <Flow points={[[0.05, 1.05, 0.2], [1.1, 1.25, -0.02], [2.2, 1.55, -0.22]]} color={P.violet} count={2} speed={0.18} size={0.05} lineOpacity={0} />
      <Flow points={[[-0.04, 1.03, 0.18], [-0.65, 0.62, 0.3], [-1.36, 0.26, 0.42]]} color={P.amber} count={2} speed={0.17} size={0.05} lineOpacity={0} />
      <SessionStack position={[2.75, 0, -0.38]} color={P.violet} label={t.pathA} count={3} />
      <SessionStack position={[-2.35, -0.28, 0.48]} color={P.amber} label={t.pathB} count={2} />
      <Tag position={[0, -0.82, 0.4]} tone="muted" size="xs" center>
        shared
      </Tag>
      <IsoDust count={22} center={[0, 1.0, 0.2]} spread={[2.8, 1.4, 1]} color={P.faint} size={0.024} />
    </>
  );
}

export default function Visual2() {
  const t = useCopy(COPY);
  const [command, setCommand] = useState<Command>("refine");
  const note = command === "refine" ? t.refineNote : command === "review" ? t.reviewNote : t.branchNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.live },
        { color: P.amber, label: t.snapshot },
        { color: P.violet, label: t.reviewer },
      ]}
      controls={
        <Switcher
          value={command}
          onChange={setCommand}
          options={[
            { value: "refine", label: t.refine, tone: P.amber },
            { value: "review", label: t.review, tone: P.violet },
            { value: "branch", label: t.branch, tone: P.teal },
          ]}
          ariaLabel={t.title}
        />
      }
      note={note}
      height="h-[410px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={14} depth={11.3} y={-0.04} />
        <Motes count={42} radius={7} opacity={0.2} />
        <PointerTilt amount={0.055}>
          {command === "refine" ? <RefineView t={t} /> : null}
          {command === "review" ? <ReviewView t={t} /> : null}
          {command === "branch" ? <BranchView t={t} /> : null}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  Duct,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Agent View is a supervisor table, not a chat.
 *
 * Enter on the dispatch plate starts a NEW session. Peek looks without
 * attaching. Attach enters the row; detach returns to the table. The
 * intro slideshow already names Agent View; this scene sits on the
 * section that walks states and keys.
 */

type Mode = "dispatch" | "states" | "peek";

const COPY = {
  en: {
    title: "Agent View: dispatch, do not chat",
    hint: "Enter starts a new session · peek is not attach · the table survives sleep",
    dispatch: "dispatch",
    states: "states",
    peek: "peek / attach",
    legendNew: "new session",
    legendLive: "working",
    legendWait: "needs input",
    input: "dispatch",
    table: "Agent View",
    working: "Working",
    needs: "Needs input",
    idle: "Idle",
    done: "Completed",
    notes: {
      dispatch:
        "The input is not a chat. Each Enter starts a new background session. It is not a follow-up to the selected row. To continue a task, attach to that session and type there.",
      states:
        "Each row has a documented state: Working, Needs input, Idle, Completed, Failed, Stopped. Ten agents in parallel cost on the order of ten times one. Leaving the TUI does not kill them.",
      peek: "Space peeks without attaching. Enter or right-arrow attaches. Left-arrow detaches: you return to the table and the session keeps running. A host shutdown stops them; attach, peek, or a reply restarts.",
    },
  },
  es: {
    title: "Agent View: despachar, no conversar",
    hint: "Enter arranca una sesión nueva · peek no es attach · la tabla sobrevive al sleep",
    dispatch: "despacho",
    states: "estados",
    peek: "peek / attach",
    legendNew: "sesión nueva",
    legendLive: "trabajando",
    legendWait: "pide input",
    input: "despacho",
    table: "Agent View",
    working: "Working",
    needs: "Needs input",
    idle: "Idle",
    done: "Completed",
    notes: {
      dispatch:
        "El input no es un chat. Cada Enter arranca una sesión nueva en segundo plano. No es un follow-up a la fila seleccionada. Para continuar una tarea, adjunta a esa sesión y escribe allí.",
      states:
        "Cada fila tiene un estado documentado: Working, Needs input, Idle, Completed, Failed, Stopped. Diez agentes en paralelo cuestan del orden de diez veces uno. Salir de la TUI no las mata.",
      peek: "Space mira sin adjuntarte. Enter o flecha derecha adjunta. Flecha izquierda desadjunta: vuelves a la tabla y la sesión sigue. Un shutdown del host las para; attach, peek o una respuesta las reinicia.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("dispatch");

  const rows = [
    { label: t.working, color: P.teal, wash: P.tealWash, tone: "teal" as const },
    { label: t.needs, color: P.amber, wash: P.amberWash, tone: "amber" as const },
    { label: t.idle, color: P.violet, wash: P.violetWash, tone: "violet" as const },
    { label: t.done, color: P.teal, wash: P.tealWash, tone: "muted" as const },
  ];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.violet, label: t.legendNew },
        { color: P.teal, label: t.legendLive },
        { color: P.amber, label: t.legendWait },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "dispatch", label: t.dispatch, tone: P.violet },
            { value: "states", label: t.states, tone: P.teal },
            { value: "peek", label: t.peek, tone: P.amber },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[mode]}</strong>
          {" — "}
          {t.notes[mode]}
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={13.3} depth={11.5} y={-0.04} />
        <PlanTrace
          points={[[-5.5, 3.3], [-2.2, 3.3], [-2.2, 0.4]]}
          y={-0.03}
          color={mode === "dispatch" ? P.violet : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.7, 0, 2.2]} to={[4.8, 0, 2.2]} />
        <IsoDust count={42} center={[0, 0.5, 0]} spread={[5.0, 0.9, 3.5]} />

        <GlassPanel
          position={[-3.15, 1.15, 1.45]}
          rotation={ISO}
          size={[2.25, 1.7]}
          color={P.violet}
          opacity={mode === "dispatch" ? 0.3 : 0.12}
        />
        <Tag position={[-3.15, 2.2, 1.45]} tone="violet" size="xs">
          {t.input}
        </Tag>
        <Sheet
          position={[-3.05, 0.06, 1.5]}
          size={[1.35, 0.9]}
          color={P.violetWash}
          fill={mode === "dispatch" ? 0.9 : 0.35}
          marks={2}
          markColor={P.violet}
        />

        <GlassPanel
          position={[1.55, 1.55, -0.15]}
          rotation={ISO}
          size={[5.4, 2.55]}
          color={P.teal}
          opacity={0.1}
        />
        <Tag position={[1.55, 3.05, -0.15]} tone="teal">
          {t.table}
        </Tag>
        {rows.map((r, i) => (
          <group key={r.label}>
            <Sheet
              position={[-0.55 + (i % 2) * 2.35, 0.06, 0.85 - Math.floor(i / 2) * 1.35]}
              size={[1.85, 0.95]}
              color={r.wash}
              fill={mode === "peek" && i === 1 ? 0.95 : 0.8}
              marks={mode === "states" || (mode === "peek" && i === 1) ? 4 : 2}
              markColor={r.color}
            />
            <Tag
              position={[-0.55 + (i % 2) * 2.35, 1.2, 0.85 - Math.floor(i / 2) * 1.35]}
              tone={r.tone}
              size="xs"
            >
              {r.label}
            </Tag>
          </group>
        ))}

        {mode === "dispatch" ? (
          <>
            <Duct from={[-2.15, 0.28, 1.25]} to={[-0.15, 0.22, 0.9]} color={P.violet} radius={0.1} bend={0.45} />
            <Flow
              points={[
                [-2.0, 0.3, 1.2],
                [0.0, 0.22, 0.9],
              ]}
              color={P.violet}
              count={3}
            />
          </>
        ) : null}
        {mode === "peek" ? (
          <Duct from={[1.7, 1.4, 0.2]} to={[1.8, 0.35, 0.2]} color={P.amber} radius={0.08} bend={0.2} />
        ) : null}
      </Stage>
    </Figure>
  );
}

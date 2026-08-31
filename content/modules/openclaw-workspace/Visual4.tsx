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
 * Bootstrap files as a pipeline of iso sheets into Project Context.
 *
 * Injected on the first turn of a new session. Blank files are skipped.
 * BOOTSTRAP.md is a one-time ritual sheet that is not recreated later.
 */

type Mode = "inject" | "skip" | "ritual";

const COPY = {
  en: {
    title: "bootstrap files, injected",
    hint: "sheets into Project Context · blanks skipped · BOOTSTRAP.md once",
    inject: "inject",
    skip: "skip blanks",
    ritual: "BOOTSTRAP.md",
    legendLive: "injected this turn",
    legendSkip: "blank / missing",
    legendOnce: "one-time ritual",
    context: "Project Context",
    files: "workspace",
    notes: {
      inject:
        "On the first turn of a new session, OpenClaw injects AGENTS, SOUL, IDENTITY, USER, and MEMORY when they exist at the workspace root. They land in Project Context, not as a user message.",
      skip: "Blank files are skipped. A missing file other than MEMORY.md injects a one-line marker. USER.md and MEMORY.md are omitted when absent. Large files are truncated.",
      ritual:
        "BOOTSTRAP.md is created only for a brand-new workspace. After the ritual it is deleted and is not reseeded on later restarts. Attestation lives in SQLite, not a sidecar.",
    },
  },
  es: {
    title: "archivos bootstrap, inyectados",
    hint: "hojas al Project Context · vacíos se saltan · BOOTSTRAP.md una vez",
    inject: "inyectar",
    skip: "saltar vacíos",
    ritual: "BOOTSTRAP.md",
    legendLive: "inyectado este turno",
    legendSkip: "vacío / faltante",
    legendOnce: "ritual de un tiro",
    context: "Project Context",
    files: "workspace",
    notes: {
      inject:
        "En el primer turno de una sesión nueva, OpenClaw inyecta AGENTS, SOUL, IDENTITY, USER y MEMORY cuando existen en la raíz del workspace. Caen en Project Context, no como mensaje de usuario.",
      skip: "Los archivos en blanco se saltan. Un archivo faltante distinto de MEMORY.md inyecta una línea marcador. USER.md y MEMORY.md se omiten si faltan. Los grandes se recortan.",
      ritual:
        "BOOTSTRAP.md solo se crea para un workspace nuevo. Tras el ritual se borra y no se vuelve a sembrar. La atestación vive en SQLite, no en un sidecar.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

const FILES = [
  { name: "AGENTS.md", color: P.teal, wash: P.tealWash },
  { name: "SOUL.md", color: P.teal, wash: P.tealWash },
  { name: "IDENTITY.md", color: P.amber, wash: P.amberWash },
  { name: "USER.md", color: P.amber, wash: P.amberWash },
  { name: "MEMORY.md", color: P.violet, wash: P.violetWash },
  { name: "BOOTSTRAP.md", color: P.violet, wash: P.violetWash },
];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("inject");

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendLive },
        { color: P.rose, label: t.legendSkip },
        { color: P.violet, label: t.legendOnce },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "inject", label: t.inject, tone: P.teal },
            { value: "skip", label: t.skip, tone: P.rose },
            { value: "ritual", label: t.ritual, tone: P.violet },
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
        <IsoFrame width={13.4} depth={11.6} y={-0.04} />
        <PlanTrace
          points={[[-5.6, 3.4], [0.2, 3.4], [0.2, 0.4]]}
          y={-0.03}
          color={mode === "skip" ? P.rose : mode === "ritual" ? P.violet : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.8, 0, 2.3]} to={[4.8, 0, 2.3]} />
        <IsoDust count={46} center={[0, 0.55, 0]} spread={[5.2, 1.0, 3.6]} />

        <Tag position={[-2.6, 1.85, 1.55]} tone="muted" size="xs">
          {t.files}
        </Tag>
        {FILES.map((f, i) => {
          const blank = mode === "skip" && (i === 3 || i === 4);
          const ritualOnly = f.name === "BOOTSTRAP.md";
          const show = mode === "ritual" ? ritualOnly : !ritualOnly || mode === "inject";
          const fill = blank ? 0.12 : mode === "ritual" && ritualOnly ? 0.95 : show ? 0.85 : 0.08;
          return (
            <Sheet
              key={f.name}
              position={[-3.6 + i * 0.85, 0.05, 1.15 - (i % 2) * 0.25]}
              size={[0.72, 1.05]}
              color={blank ? P.roseWash : f.wash}
              fill={fill}
              marks={blank || !show ? 0 : 3}
              markColor={blank ? P.rose : f.color}
            />
          );
        })}

        <GlassPanel
          position={[3.15, 1.45, -0.35]}
          rotation={ISO}
          size={[2.55, 2.35]}
          color={mode === "ritual" ? P.violet : P.teal}
          opacity={0.26}
        />
        <Tag position={[3.15, 2.85, -0.35]} tone={mode === "ritual" ? "violet" : "teal"}>
          {t.context}
        </Tag>
        {[0, 1, 2].map((i) => (
          <Sheet
            key={`ctx-${i}`}
            position={[3.25, 0.55 + i * 0.08, -0.25]}
            size={[1.55, 1.05]}
            color={mode === "skip" ? P.roseWash : mode === "ritual" ? P.violetWash : P.tealWash}
            fill={mode === "skip" ? 0.35 : 0.7}
            marks={mode === "skip" ? 1 : 4}
            markColor={mode === "skip" ? P.rose : mode === "ritual" ? P.violet : P.teal}
          />
        ))}

        <Duct
          from={[-0.4, 0.22, 0.9]}
          to={[2.05, 0.7, -0.1]}
          color={mode === "skip" ? P.rose : mode === "ritual" ? P.violet : P.teal}
          radius={0.1}
          bend={0.55}
        />
        <Flow
          points={[
            [-0.2, 0.25, 0.85],
            [1.9, 0.72, -0.05],
          ]}
          color={mode === "skip" ? P.rose : mode === "ritual" ? P.violet : P.teal}
          count={4}
        />
      </Stage>
    </Figure>
  );
}

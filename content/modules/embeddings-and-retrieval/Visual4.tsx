"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "big" | "small" | "overlap";

const COPY = {
  en: {
    title: "the cut that decides the answer",
    hint: "too big drowns · too small splits · overlap keeps the number",
    big: "too big",
    small: "too small",
    overlap: "overlap",
    legendDoc: "document",
    legendHit: "the number",
    legendLost: "lost at the cut",
    doc: "manual",
    notes: {
      big: "One huge chunk brings the chapter. The number is in there, diluted under noise the reranker has to ignore.",
      small: "Tiny shards cut the sentence in half. The number lives on one side of the boundary; the question retrieves the other.",
      overlap: "Adjacent chunks share a strip. 10-20% overlap is enough for a sentence that crosses the cut to survive in both.",
    },
  },
  es: {
    title: "el corte que decide la respuesta",
    hint: "demasiado grande ahoga · demasiado pequeño parte · el overlap guarda el número",
    big: "demasiado grande",
    small: "demasiado pequeño",
    overlap: "overlap",
    legendDoc: "documento",
    legendHit: "el número",
    legendLost: "perdido en el corte",
    doc: "manual",
    notes: {
      big: "Un chunk enorme trae el capítulo. El número está ahí, diluido bajo ruido que el reranker tiene que ignorar.",
      small: "Trozos minúsculos parten la frase. El número queda a un lado del borde; la pregunta recupera el otro.",
      overlap: "Los chunks vecinos comparten una franja. Un 10-20% de overlap basta para que una frase que cruza el corte sobreviva en ambos.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("big");

  const sheets =
    mode === "big"
      ? [{ x: 0, z: 0, w: 3.4, h: 2.4, fill: 0.55, marks: 8, hit: true }]
      : mode === "small"
        ? Array.from({ length: 8 }, (_, i) => ({
            x: -2.4 + (i % 4) * 1.25,
            z: (Math.floor(i / 4) - 0.5) * 1.35,
            w: 0.95,
            h: 1.05,
            fill: 0.7,
            marks: 2,
            hit: i === 2,
          }))
        : [
            { x: -1.15, z: 0.15, w: 2.15, h: 1.7, fill: 0.7, marks: 4, hit: true },
            { x: 1.15, z: -0.15, w: 2.15, h: 1.7, fill: 0.7, marks: 4, hit: true },
          ];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendDoc },
        { color: P.amber, label: t.legendHit },
        { color: P.rose, label: t.legendLost },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "big", label: t.big, tone: P.teal },
            { value: "small", label: t.small, tone: P.rose },
            { value: "overlap", label: t.overlap, tone: P.amber },
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
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.14}
      >
        <IsoFrame width={12.8} depth={10.8} y={-0.04} />
        <PlanTrace
          points={[
            [-5.2, 3.0],
            [0, 3.0],
            [0, 0.2],
          ]}
          y={-0.03}
          color={P.line}
          opacity={0.7}
        />
        <AxisLine from={[-4.4, 0, 2.0]} to={[4.4, 0, 2.0]} />
        <IsoDust count={36} center={[0, 0.5, 0]} spread={[4.4, 0.8, 3.0]} />

        <GlassPanel
          position={[0, 1.55, -0.1]}
          rotation={ISO}
          size={[7.2, 3.4]}
          color={P.teal}
          opacity={0.08}
        />
        <Tag position={[0, 3.35, -0.1]} tone="teal">
          {t.doc}
        </Tag>

        {sheets.map((s, i) => (
          <Sheet
            key={i}
            position={[s.x, 0.08, s.z]}
            size={[s.w, s.h]}
            color={s.hit ? P.amberWash : P.tealWash}
            fill={s.fill}
            marks={s.marks}
            markColor={s.hit ? P.amber : mode === "small" ? P.rose : P.teal}
          />
        ))}
      </Stage>
    </Figure>
  );
}

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
 * Export is the same template and the same EOS, or a silent quality bug.
 *
 * Three artefacts — adapters, GGUF, merged 16-bit — are honest only when
 * they keep the Qwen chat template you trained with. A second wrapper at
 * serve time is the loop the previous lesson already named.
 */

type Mode = "match" | "three" | "mismatch";

const COPY = {
  en: {
    title: "same template, same EOS",
    hint: "adapter · GGUF · merged 16-bit · mismatch is a silent bug",
    match: "match",
    three: "three artefacts",
    mismatch: "mismatch",
    legendTpl: "trained template",
    legendShip: "exported artefact",
    legendWrap: "second wrapper",
    template: "Qwen template",
    eos: "EOS",
    adapters: "adapters",
    gguf: "GGUF",
    merged: "merged 16-bit",
    serve: "serve wrapper",
    notes: {
      match:
        "Whatever you ship must use the same chat template and EOS you trained with. The collator saw a completed turn. The engine will add the generation prompt at serve time — do not bake that header into the rows.",
      three:
        "Three honest artefacts: adapters you reload on the same base, GGUF q4_k_m for llama.cpp / Desktop, merged 16-bit for vLLM. Pick from the job. All three keep one template plate.",
      mismatch:
        "A second wrapper at serve time — Ollama's template around a model that never saw it — is the silent loop. The GGUF troubleshooting page is the same story, now with a Qwen template attached.",
    },
  },
  es: {
    title: "misma plantilla, mismo EOS",
    hint: "adapter · GGUF · 16-bit fusionado · el desajuste es un bug silencioso",
    match: "coincide",
    three: "tres artefactos",
    mismatch: "desajuste",
    legendTpl: "plantilla entrenada",
    legendShip: "artefacto exportado",
    legendWrap: "segundo envoltorio",
    template: "plantilla Qwen",
    eos: "EOS",
    adapters: "adapters",
    gguf: "GGUF",
    merged: "16-bit fusionado",
    serve: "envoltorio al servir",
    notes: {
      match:
        "Lo que envíes debe usar la misma plantilla de chat y el mismo EOS con los que entrenaste. El collator vio un turno completado. El motor añadirá el prompt de generación al servir — no metas esa cabecera en las filas.",
      three:
        "Tres artefactos honestos: adapters que recargas sobre la misma base, GGUF q4_k_m para llama.cpp / Desktop, 16-bit fusionado para vLLM. Elige por el trabajo. Los tres conservan una placa de plantilla.",
      mismatch:
        "Un segundo envoltorio al servir — la plantilla de Ollama alrededor de un modelo que nunca la vio — es el bucle silencioso. La página de problemas GGUF es la misma historia, ahora con una plantilla Qwen enganchada.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("match");
  const broken = mode === "mismatch";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendTpl },
        { color: P.amber, label: t.legendShip },
        { color: P.rose, label: t.legendWrap },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "match", label: t.match, tone: P.teal },
            { value: "three", label: t.three, tone: P.amber },
            { value: "mismatch", label: t.mismatch, tone: P.rose },
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
        <IsoFrame width={13.2} depth={11.4} y={-0.04} />
        <PlanTrace
          points={[[-5.4, 3.2], [-1.5, 3.2], [-1.5, 0.3]]}
          y={-0.03}
          color={broken ? P.rose : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.6, 0, 2.1]} to={[4.7, 0, 2.1]} />
        <IsoDust count={40} center={[0, 0.5, 0]} spread={[5.0, 0.9, 3.4]} />

        <GlassPanel
          position={[-2.55, 1.35, 0.85]}
          rotation={ISO}
          size={[2.45, 2.15]}
          color={P.teal}
          opacity={0.28}
        />
        <Tag position={[-2.55, 2.65, 0.85]} tone="teal">
          {t.template}
        </Tag>
        <Sheet
          position={[-2.45, 0.08, 0.95]}
          size={[1.45, 1.05]}
          color={P.tealWash}
          fill={0.9}
          marks={4}
          markColor={P.teal}
        />
        <Tag position={[-2.55, 1.55, -0.55]} tone="teal" size="xs">
          {t.eos}
        </Tag>

        {[
          { x: 2.05, z: 1.45, label: t.adapters, wash: P.amberWash, color: P.amber },
          { x: 2.55, z: 0.05, label: t.gguf, wash: P.violetWash, color: P.violet },
          { x: 2.15, z: -1.35, label: t.merged, wash: P.tealWash, color: P.teal },
        ].map((a) => (
          <group key={a.label}>
            <Sheet
              position={[a.x, 0.06, a.z]}
              size={[1.55, 1.0]}
              color={broken && a.label === t.gguf ? P.roseWash : a.wash}
              fill={mode === "three" || !broken ? 0.88 : a.label === t.gguf ? 0.35 : 0.7}
              marks={4}
              markColor={broken && a.label === t.gguf ? P.rose : a.color}
            />
            <Tag
              position={[a.x, 1.25, a.z]}
              tone={broken && a.label === t.gguf ? "rose" : a.color === P.amber ? "amber" : a.color === P.violet ? "violet" : "teal"}
              size="xs"
            >
              {a.label}
            </Tag>
          </group>
        ))}

        {broken ? (
          <>
            <GlassPanel
              position={[3.55, 1.55, 1.65]}
              rotation={ISO}
              size={[1.85, 1.45]}
              color={P.rose}
              opacity={0.22}
            />
            <Tag position={[3.55, 2.45, 1.65]} tone="rose" size="xs">
              {t.serve}
            </Tag>
            <Duct from={[2.7, 0.35, 0.15]} to={[3.3, 0.7, 1.35]} color={P.rose} radius={0.09} bend={0.5} />
          </>
        ) : (
          <Duct from={[-1.4, 0.3, 0.7]} to={[1.35, 0.25, 0.2]} color={P.teal} radius={0.1} bend={0.45} />
        )}
        <Flow
          points={
            broken
              ? [
                  [2.55, 0.3, 0.1],
                  [3.2, 0.65, 1.25],
                ]
              : [
                  [-1.25, 0.32, 0.65],
                  [1.2, 0.28, 0.2],
                ]
          }
          color={broken ? P.rose : P.teal}
          count={3}
        />
      </Stage>
    </Figure>
  );
}

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
 * Prefill is FLOPs-bound: shrinking the weight plate barely changes the
 * parallel pass. Decode re-reads the whole plate for one token, so Q4
 * (a thinner plate) is four times the bandwidth per token.
 */

type Mode = "prefill" | "decode" | "q4";

const COPY = {
  en: {
    title: "where quantization pays",
    hint: "prefill is FLOPs · decode re-reads the weights",
    prefill: "prefill",
    decode: "decode",
    q4: "Q4 decode",
    legendCompute: "compute-bound",
    legendBand: "bandwidth-bound",
    legendQ4: "thinner weights",
    weights: "weights",
    tokens: "prompt tokens",
    one: "one token",
    notes: {
      prefill: "The prompt is read in parallel. The bottleneck is FLOPs. Quantizing the plate helps only a little.",
      decode: "Each new token re-reads the whole weight plate. The bottleneck is bytes per second.",
      q4: "Q4 is about a quarter of the bytes of FP16. On decode that is often about 4x tokens per second; on prefill the margin stays modest.",
    },
  },
  es: {
    title: "dónde paga la cuantización",
    hint: "prefill son FLOPs · decode relee los pesos",
    prefill: "prefill",
    decode: "decode",
    q4: "decode Q4",
    legendCompute: "acotado por cómputo",
    legendBand: "acotado por ancho de banda",
    legendQ4: "pesos más finos",
    weights: "pesos",
    tokens: "tokens del prompt",
    one: "un token",
    notes: {
      prefill: "El prompt se lee en paralelo. El cuello son los FLOPs. Cuantizar la placa ayuda poco.",
      decode: "Cada token nuevo relee la placa de pesos entera. El cuello son bytes por segundo.",
      q4: "Q4 son unos un cuarto de los bytes de FP16. En decode suele ser unas 4 veces más tokens por segundo; en prefill el margen sigue siendo modesto.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];
const W: V3 = [-0.15, 0, 0.2];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("prefill");
  const thin = mode === "q4";
  const decode = mode === "decode" || mode === "q4";
  const wH = thin ? 0.55 : 1.85;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendCompute },
        { color: P.amber, label: t.legendBand },
        { color: P.violet, label: t.legendQ4 },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "prefill", label: t.prefill, tone: P.teal },
            { value: "decode", label: t.decode, tone: P.amber },
            { value: "q4", label: t.q4, tone: P.violet },
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
        <IsoFrame width={13} depth={11.2} y={-0.04} />
        <PlanTrace
          points={[
            [-5.4, 3.2],
            [0, 3.2],
            [0, 0.4],
          ]}
          y={-0.03}
          color={decode ? P.amber : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.8, 0, 2.2]} to={[4.8, 0, 2.2]} />
        <IsoDust count={40} center={[0, 0.7, 0]} spread={[4.8, 1.0, 3.4]} />

        <GlassPanel
          position={[W[0], 0.15 + wH / 2, W[2]]}
          rotation={ISO}
          size={[2.6, wH]}
          color={thin ? P.violet : P.teal}
          opacity={0.32}
        />
        <Tag position={[W[0], wH + 1.15, W[2]]} tone={thin ? "violet" : "teal"}>
          {t.weights}
        </Tag>

        {!decode
          ? Array.from({ length: 6 }, (_, i) => (
              <Sheet
                key={i}
                position={[-3.6 + i * 0.55, 0.05, 2.05]}
                size={[0.48, 0.7]}
                color={P.tealWash}
                fill={0.85}
                marks={2}
                markColor={P.teal}
              />
            ))
          : (
            <Sheet
              position={[3.15, 0.06, 1.55]}
              size={[0.7, 0.9]}
              color={P.amberWash}
              fill={0.9}
              marks={1}
              markColor={P.amber}
            />
          )}
        <Tag
          position={decode ? [3.15, 1.35, 1.55] : [-2.0, 1.2, 2.05]}
          tone={decode ? "amber" : "teal"}
          size="xs"
        >
          {decode ? t.one : t.tokens}
        </Tag>

        {decode ? (
          <>
            <Duct
              from={[W[0] + 1.15, 0.35, W[2] + 0.2]}
              to={[2.7, 0.22, 1.4]}
              color={thin ? P.violet : P.amber}
              radius={thin ? 0.09 : 0.16}
              bend={0.45}
            />
            <Flow
              points={[
                [W[0] + 1.0, 0.4, W[2] + 0.15],
                [2.55, 0.25, 1.35],
              ]}
              color={thin ? P.violet : P.amber}
              count={thin ? 5 : 2}
            />
          </>
        ) : (
          <Flow
            points={[
              [-3.5, 0.25, 1.55],
              [W[0] - 1.2, 0.45, W[2] + 0.3],
            ]}
            color={P.teal}
            count={4}
          />
        )}
      </Stage>
    </Figure>
  );
}

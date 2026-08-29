"use client";

import { useMemo, useState } from "react";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Bars,
  Lattice,
  Marker,
  PointerTilt,
  ShadowBlob,
  Tag,
  type Cell,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "input" | "output" | "cache";

const COPY = {
  en: {
    title: "tokens are a bill",
    hint: "count on the left, cost on the right — they are not the same shape",
    input: "Input",
    output: "Output",
    cache: "Cache",
    legendInput: "input token",
    legendOutput: "output token",
    legendCached: "cached input",
    cachedPct: "cached",
    inputLabel: "input",
    outputLabel: "output",
    costLabel: "share of bill",
    total: "relative bill",
    assume: "assumed rates · input ×1 · output ×5 · cached input ×0.1",
    unitsInput: "12k tok",
    unitsOutput: "0.8k tok",
    inputNote: "the prompt is most of the tokens and rarely most of the bill",
    outputNote: "generated tokens are few and cost several times more each — length is the lever",
    cacheNote: "a stable prefix moves input tokens to the cheap column; drag the slider and watch",
  },
  es: {
    title: "los tokens son la factura",
    hint: "cantidad a la izquierda, coste a la derecha — no tienen la misma forma",
    input: "Entrada",
    output: "Salida",
    cache: "Caché",
    legendInput: "token de entrada",
    legendOutput: "token de salida",
    legendCached: "entrada cacheada",
    cachedPct: "cacheado",
    inputLabel: "entrada",
    outputLabel: "salida",
    costLabel: "peso en la factura",
    total: "factura relativa",
    assume: "tarifas supuestas · entrada ×1 · salida ×5 · entrada cacheada ×0,1",
    unitsInput: "12k tok",
    unitsOutput: "0,8k tok",
    inputNote: "el prompt es casi todos los tokens y casi nunca casi toda la factura",
    outputNote: "los tokens generados son pocos y cuestan varias veces más cada uno — la longitud es la palanca",
    cacheNote: "un prefijo estable mueve tokens de entrada a la columna barata; mueve el control y míralo",
  },
};

/** Illustrative shape of a typical agent turn, in thousands of tokens. */
const INPUT_K = 12;
const OUTPUT_K = 0.8;
const RATE_IN = 1;
const RATE_OUT = 5;
const RATE_CACHED = 0.1;

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("input");
  const [cached, setCached] = useState(60);

  const { costIn, costCached, costOut, total } = useMemo(() => {
    const cachedK = (INPUT_K * cached) / 100;
    const freshK = INPUT_K - cachedK;
    const ci = freshK * RATE_IN;
    const cc = cachedK * RATE_CACHED;
    const co = OUTPUT_K * RATE_OUT;
    return { costIn: ci, costCached: cc, costOut: co, total: ci + cc + co };
  }, [cached]);

  // Left column: one cube per 250 tokens, so the count is literally counted.
  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    const perCube = 0.25;
    const inputCubes = Math.round(INPUT_K / perCube);
    const cachedCubes = Math.round((inputCubes * cached) / 100);
    const cols = 8;
    for (let i = 0; i < inputCubes; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      out.push({
        position: [-1.95 + c * 0.17, -1.0 + r * 0.17, 0],
        scale: 1,
        color: i < cachedCubes ? P.tealWash : P.teal,
      });
    }
    const outputCubes = Math.round(OUTPUT_K / perCube);
    for (let i = 0; i < outputCubes; i++) {
      out.push({
        position: [0.05 + (i % 4) * 0.17, -1.0 + Math.floor(i / 4) * 0.17, 0],
        scale: 1,
        color: P.amber,
      });
    }
    return out;
  }, [cached]);

  const note = mode === "output" ? t.outputNote : mode === "cache" ? t.cacheNote : t.inputNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendInput },
        { color: P.tealWash, label: t.legendCached },
        { color: P.amber, label: t.legendOutput },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "input", label: t.input, tone: P.teal },
              { value: "output", label: t.output, tone: P.amber },
              { value: "cache", label: t.cache, tone: P.violet },
            ]}
            ariaLabel={t.title}
          />
          <Knob
            label={t.cachedPct}
            value={cached}
            min={0}
            max={95}
            step={5}
            onChange={setCached}
            format={(v) => `${v}%`}
            tone={P.violet}
          />
        </>
      }
      note={note}
      height="h-[370px] md:h-[460px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.35, 6.9], fov: 40 }} background={P.paper} fit={1.12}>
        <PointerTilt amount={0.07}>
          <group position={[-0.6, 0.5, 0]}>
            <ShadowBlob position={[0, -1.25, 0]} scale={5} opacity={0.05} />
            <Lattice cells={cells} size={0.14} />
            <Tag position={[-1.35, 0.75, 0.1]} tone={mode === "input" ? "ink" : "muted"} size="xs" center>
              {t.inputLabel} · {t.unitsInput}
            </Tag>
            <Tag position={[0.35, 0.75, 0.1]} tone={mode === "output" ? "ink" : "muted"} size="xs" center>
              {t.outputLabel} · {t.unitsOutput}
            </Tag>
            <Marker position={[-2.35, -1.0, 0.2]} n={1} color={P.teal} />
            <Marker position={[-0.35, -1.0, 0.2]} n={2} color={P.amber} />
          </group>

          {/* Same turn, priced. The shape flips, and that is the lesson. */}
          <group position={[2.35, -0.65, 0]}>
            <Bars
              bars={[
                {
                  label: t.inputLabel,
                  value: costIn / Math.max(1, total),
                  color: P.teal,
                  note: costIn.toFixed(1),
                },
                {
                  label: t.cachedPct,
                  value: costCached / Math.max(1, total),
                  color: P.violet,
                  note: costCached.toFixed(1),
                },
                {
                  label: t.outputLabel,
                  value: costOut / Math.max(1, total),
                  color: P.amber,
                  note: costOut.toFixed(1),
                },
              ]}
              height={1.55}
              width={0.36}
              gap={0.3}
              depth={0.3}
            />
            <Tag position={[0, 1.95, 0]} tone="ink" size="xs" center>
              {t.total}: {total.toFixed(1)}
            </Tag>
            <Tag position={[0, -0.62, 0]} tone="muted" size="xs" center>
              {t.costLabel}
            </Tag>
          </group>
        </PointerTilt>

        <group position={[0, -2.35, 0]}>
          <Tag position={[0, -0.06, 0]} tone="muted" size="xs" center>
            {t.assume}
          </Tag>
        </group>
      </Stage>
    </Figure>
  );
}

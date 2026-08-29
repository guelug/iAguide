"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type Group } from "three";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Bars, PointerTilt, ShadowBlob, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Why a model that loaded fine dies at long context.
 *
 * The column is a real budget with real arithmetic: weights are
 * parameters times bytes-per-parameter, and the KV cache is
 * 2 * layers * kv_heads * head_dim * bytes * tokens * batch. Drag the
 * context and the cache grows linearly until it walks out of the cage —
 * which is the failure everyone hits and almost nobody predicts.
 */

type Mode = "fp16" | "q8" | "q4";

const COPY = {
  en: {
    title: "what actually fills the card",
    hint: "weights are fixed; the KV cache is a function of context × batch",
    fp16: "FP16 weights",
    q8: "Q8 weights",
    q4: "Q4 weights",
    legendWeights: "weights",
    legendRuntime: "runtime",
    legendKv: "KV cache",
    legendOver: "over budget",
    context: "context",
    batch: "batch",
    budget: "budget",
    weights: "weights",
    runtime: "runtime",
    kv: "KV cache",
    total: "total",
    headroom: "headroom",
    over: "over by",
    perToken: "per token",
    maxCtx: "fits up to",
    fits: "fits",
    doesNot: "does not fit",
    spec: "8B · 32 layers · 8 KV heads · head dim 128 · FP16 cache",
    fp16Note:
      "half-precision weights eat two thirds of a 24 GB card before a single token of context exists",
    q8Note:
      "one byte per parameter halves the fixed cost, and on this card that is about 60k more tokens of context",
    q4Note:
      "four-bit weights are mostly about context, not speed: the room you free up is room the cache can use",
  },
  es: {
    title: "qué llena de verdad la tarjeta",
    hint: "los pesos son fijos; la caché KV es una función de contexto × lote",
    fp16: "Pesos FP16",
    q8: "Pesos Q8",
    q4: "Pesos Q4",
    legendWeights: "pesos",
    legendRuntime: "runtime",
    legendKv: "caché KV",
    legendOver: "fuera de presupuesto",
    context: "contexto",
    batch: "lote",
    budget: "presupuesto",
    weights: "pesos",
    runtime: "runtime",
    kv: "caché KV",
    total: "total",
    headroom: "margen",
    over: "te pasas por",
    perToken: "por token",
    maxCtx: "cabe hasta",
    fits: "cabe",
    doesNot: "no cabe",
    spec: "8B · 32 capas · 8 cabezas KV · dim 128 · caché FP16",
    fp16Note:
      "los pesos en media precisión se comen dos tercios de una tarjeta de 24 GB antes de existir un solo token de contexto",
    q8Note:
      "un byte por parámetro parte por la mitad el coste fijo, y en esta tarjeta eso son unos 60k tokens más de contexto",
    q4Note:
      "los pesos de cuatro bits van sobre todo de contexto, no de velocidad: el sitio que liberas es sitio para la caché",
  },
};

/* ------------------------------------------------------------ the numbers */

const PARAMS = 8e9;
const LAYERS = 32;
const KV_HEADS = 8; // grouped-query attention, not one per attention head
const HEAD_DIM = 128;
const CACHE_BYTES = 2; // FP16 keys and values
const RUNTIME_GB = 1.2;
const BUDGET_GB = 24;
const GB = 1024 ** 3;

const BYTES_PER_PARAM: Record<Mode, number> = { fp16: 2, q8: 1, q4: 0.55 };

/** Bytes of KV cache per token, per sequence in the batch. */
const KV_PER_TOKEN = 2 * LAYERS * KV_HEADS * HEAD_DIM * CACHE_BYTES;

/** World units per GB, so 24 GB is a comfortable column. */
const UNIT = 0.115;

function Segment({
  label,
  gb,
  base,
  color,
  tone,
}: {
  label: string;
  gb: number;
  base: number;
  color: string;
  tone: "teal" | "amber" | "violet" | "rose" | "muted";
}) {
  const ref = useRef<Group>(null);
  const h = Math.max(0.001, gb * UNIT);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.scale.y = MathUtils.damp(g.scale.y, h, 7, dt);
    g.position.y = MathUtils.damp(g.position.y, base + g.scale.y / 2, 7, dt);
  });

  return (
    <group ref={ref} position={[0, base, 0]} scale={[1, 0.001, 1]}>
      <RoundedBox args={[1.5, 1, 1.5]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.46} metalness={0.03} />
      </RoundedBox>
      <Tag position={[1.05, 0, 0]} tone={tone} size="xs">
        {label} {gb.toFixed(1)} GB
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("fp16");
  const [ctxK, setCtxK] = useState(32);
  const [batch, setBatch] = useState(1);

  const n = useMemo(() => {
    const weights = (PARAMS * BYTES_PER_PARAM[mode]) / GB;
    const kv = (KV_PER_TOKEN * ctxK * 1024 * batch) / GB;
    const total = weights + RUNTIME_GB + kv;
    // The number a reader actually needs: how long a context this card
    // can hold once the weights have taken their cut.
    const freeForCache = (BUDGET_GB - weights - RUNTIME_GB) * GB;
    const maxTokens = Math.max(0, freeForCache / (KV_PER_TOKEN * batch));

    return {
      weights,
      kv,
      total,
      over: total > BUDGET_GB,
      slack: BUDGET_GB - total,
      perTokenKiB: KV_PER_TOKEN / 1024,
      maxK: maxTokens / 1024,
    };
  }, [mode, ctxK, batch]);

  const note = mode === "q4" ? t.q4Note : mode === "q8" ? t.q8Note : t.fp16Note;
  const kvColor = n.over ? P.rose : P.violet;
  const cage = BUDGET_GB * UNIT;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendWeights },
        { color: P.amber, label: t.legendRuntime },
        { color: P.violet, label: t.legendKv },
        { color: P.rose, label: t.legendOver },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "fp16", label: t.fp16, tone: P.teal },
              { value: "q8", label: t.q8, tone: P.amber },
              { value: "q4", label: t.q4, tone: P.violet },
            ]}
            ariaLabel={t.title}
          />
          <Knob
            label={t.context}
            value={ctxK}
            min={1}
            max={128}
            step={1}
            onChange={setCtxK}
            format={(v) => `${v}k`}
            tone={P.violet}
          />
          <Knob
            label={t.batch}
            value={batch}
            min={1}
            max={8}
            step={1}
            onChange={setBatch}
            format={(v) => `×${v}`}
            tone={P.amber}
          />
        </>
      }
      note={note}
      height="h-[400px] md:h-[490px]"
    >
      <Stage
        className="h-full w-full"
        camera={{ position: [3.6, 2.4, 5.4], fov: 38 }}
        background={P.paper}
        fit={1.12}
      >
        <PointerTilt amount={0.07}>
          <group position={[-0.4, -1.5, 0]}>
            <ShadowBlob position={[0, -0.02, 0]} scale={3.4} opacity={0.07} />

            {/* The card's ceiling. Everything above this line is a crash. */}
            <mesh position={[0, cage / 2, 0]}>
              <boxGeometry args={[1.72, cage, 1.72]} />
              <meshBasicMaterial color={P.lineStrong} wireframe transparent opacity={0.45} />
            </mesh>
            <Wire
              points={[
                [-1.15, cage, 0.9],
                [1.15, cage, 0.9],
              ]}
              color={n.over ? P.rose : P.ink}
              width={2.2}
              opacity={0.9}
            />
            <Tag position={[-1.35, cage, 0.9]} tone={n.over ? "rose" : "ink"} size="xs">
              {t.budget} {BUDGET_GB} GB
            </Tag>

            <Segment label={t.weights} gb={n.weights} base={0} color={P.teal} tone="teal" />
            <Segment
              label={t.runtime}
              gb={RUNTIME_GB}
              base={n.weights * UNIT}
              color={P.amber}
              tone="amber"
            />
            <Segment
              label={t.kv}
              gb={n.kv}
              base={(n.weights + RUNTIME_GB) * UNIT}
              color={kvColor}
              tone={n.over ? "rose" : "violet"}
            />

            <Tag position={[0, -0.32, 0.9]} tone={n.over ? "rose" : "teal"} size="xs" center>
              {n.over ? `${t.doesNot} · ${t.over} ${(-n.slack).toFixed(1)} GB` : `${t.fits} · ${t.headroom} ${n.slack.toFixed(1)} GB`}
            </Tag>
          </group>

          <group position={[2.9, -1.3, 0]}>
            <Bars
              bars={[
                {
                  label: t.weights,
                  value: n.weights / BUDGET_GB,
                  color: P.teal,
                  note: n.weights.toFixed(1),
                },
                {
                  label: t.kv,
                  value: Math.min(1.6, n.kv / BUDGET_GB),
                  color: kvColor,
                  note: n.kv.toFixed(1),
                },
                {
                  label: t.total,
                  value: Math.min(1.6, n.total / BUDGET_GB),
                  color: n.over ? P.rose : P.ink,
                  note: n.total.toFixed(1),
                },
              ]}
              height={1.6}
              width={0.34}
              gap={0.34}
              depth={0.28}
            />
          </group>
        </PointerTilt>

        <group position={[0, -2.55, 0]}>
          <Tag position={[0, 0.28, 0]} tone="muted" size="xs" center>
            {t.spec} · {n.perTokenKiB.toFixed(0)} KiB {t.perToken} · {t.maxCtx}{" "}
            {n.maxK.toFixed(0)}k
          </Tag>
        </group>
      </Stage>
    </Figure>
  );
}

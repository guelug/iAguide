"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { ShadowBlob, hash, type Cell } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* quantization: precision bars, calibration histogram, GPTQ vs AWQ packing. */
type Mode = "precision" | "calibration" | "packing";

const COPY = {
  en: {
    quantization_is_lossy_compression: "quantization is lossy compression",
    precision_calibration_packing: "precision · calibration · packing",
    precision: "fp16 vs int4",
    calibration: "calibration",
    packing: "gptq vs awq",
    fp16: "fp16",
    int4: "int4",
    scale: "scale",
    zero: "zero-point",
    gptq: "GPTQ",
    awq: "AWQ",
  },
  es: {
    quantization_is_lossy_compression: "la cuantización es compresión con pérdida",
    precision_calibration_packing: "precisión · calibración · empaquetado",
    precision: "fp16 vs int4",
    calibration: "calibración",
    packing: "gptq vs awq",
    fp16: "fp16",
    int4: "int4",
    scale: "escala",
    zero: "punto cero",
    gptq: "GPTQ",
    awq: "AWQ",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("precision");

  // a weight histogram before quantization
  const histo = [0.3, 0.7, 1.5, 1.0, 0.4, 0.2, 0.1, 0.05];

  return (
    <Figure
      label={t.quantization_is_lossy_compression}
      hint={t.precision_calibration_packing}
      legend={[
        { color: P.teal, label: t.precision },
        { color: P.violet, label: t.calibration },
        { color: P.amber, label: t.packing },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "precision", label: t.precision, tone: P.teal },
            { value: "calibration", label: t.calibration, tone: P.violet },
            { value: "packing", label: t.packing, tone: P.amber },
          ]}
          ariaLabel={t.quantization_is_lossy_compression}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "precision" && (
          <>
            {/* two bars: same weight value, different bit width */}
            <Slab position={[-1.6, 0.4, 0]} size={[1.6, 0.4, 0.1]} color={P.teal} fill={0.32} />
            <Tag position={[-1.6, 0.85, 0.15]} tone="teal">{t.fp16} · 16 bits</Tag>
            {[0, 1, 2, 3].map((i) => (
              <Slab
                key={i}
                position={[0.7 + i * 0.45, 0.4, 0]}
                size={[0.4, 0.4, 0.1]}
                color={P.amber}
                fill={0.32}
              />
            ))}
            <Tag position={[1.35, 0.85, 0.15]} tone="amber">{t.int4} · 4×4 bits</Tag>
            {/* the rounding gap */}
            <Wire points={[[-0.3, 0.05, 0], [0.5, 0.05, 0]]} color={P.rose} dashed opacity={0.7} />
            <Tag position={[0.1, -0.3, 0.15]} tone="rose" size="xs">≈</Tag>
            <Ribbon
              points={[[-1.6, -0.35, 0], [-0.5, -0.35, 0], [1.4, -0.35, 0]]}
              color={P.teal}
              radius={0.03}
              opacity={0.7}
            />
            <Tag position={[0, -0.8, 0.15]} tone="muted" size="xs">peso ≈ 0.3147</Tag>
          </>
        )}

        {mode === "calibration" && (
          <>
            {histo.map((h, i) => (
              <Slab
                key={i}
                position={[-2.6 + i * 0.55, -0.6 + h / 2, 0]}
                size={[0.45, h, 0.08]}
                color={P.teal}
                fill={0.3}
              />
            ))}
            <Wire points={[[-3.1, -0.6, 0], [2.4, -0.6, 0]]} color={P.lineStrong} opacity={0.6} />
            {/* scale+zero-point box */}
            <Slab position={[1.9, 0.9, 0]} size={[1.6, 1.2, 0.12]} color={P.violet} fill={0.2} />
            <Tag position={[1.9, 1.7, 0.15]} tone="violet" size="xs">{t.scale}</Tag>
            <Tag position={[1.9, 0.9, 0.15]} tone="violet" size="xs">{t.zero}</Tag>
            <Wire points={[[1.0, 0.4, 0], [1.1, 0.7, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">clip range</Tag>
          </>
        )}

        {mode === "packing" && (
          <>
            <Slab position={[-1.6, 0.6, 0]} size={[2.0, 1.4, 0.14]} color={P.teal} fill={0.18} />
            <Tag position={[-1.6, 1.5, 0.15]} tone="teal">{t.gptq}</Tag>
            {/* rowwise */}
            {[0, 1, 2].map((i) => (
              <Slab key={i} position={[-1.6, 1.0 - i * 0.4, 0.1]} size={[1.6, 0.25, 0.06]} color={P.teal} fill={0.3} />
            ))}
            <Slab position={[1.6, 0.6, 0]} size={[2.0, 1.4, 0.14]} color={P.amber} fill={0.18} />
            <Tag position={[1.6, 1.5, 0.15]} tone="amber">{t.awq}</Tag>
            <Lattice
              cells={Array.from({ length: 8 }, (_, i) => ({
                position: [1.1 + (i % 2) * 0.5, 1.1 - Math.floor(i / 2) * 0.32, 0.15] as [number, number, number],
                color: P.amber,
              }))}
              size={0.16}
              opacity={0.85}
              matte
            />
            <Tag position={[0, -0.4, 0.15]} tone="muted" size="xs">rowwise vs grouped</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

const COUNT = 32;
const OUTLIER_AT = 5;
const OUTLIER = 2.4;
const SCALE_BITS = 16; // one FP16 scale per block

/* 32 teaching weights: a deterministic bell-ish spread around zero. */
const BASE_WEIGHTS = Array.from({ length: COUNT }, (_, i) => {
  const u = hash(i, 11) + hash(i, 12) + hash(i, 13) - 1.5; // sum of uniforms
  return Math.round(u * 0.9 * 1000) / 1000;
});

function quantize(bits: number, block: number, outlier: boolean) {
  const w = BASE_WEIGHTS.map((v, i) => (outlier && i === OUTLIER_AT ? OUTLIER : v));
  const qmax = 2 ** (bits - 1) - 1; // symmetric: int4 → −8..7, we use ±7
  const blocks = COUNT / block;
  const scales: number[] = [];
  const q: number[] = [];
  const deq: number[] = [];
  for (let b = 0; b < blocks; b++) {
    const slice = w.slice(b * block, (b + 1) * block);
    const s = Math.max(...slice.map(Math.abs)) / qmax || 1e-6;
    scales.push(s);
    slice.forEach((v) => {
      const k = Math.max(-qmax - 1, Math.min(qmax, Math.round(v / s)));
      q.push(k);
      deq.push(k * s);
    });
  }
  const err = w.map((v, i) => deq[i] - v);
  const rmse = Math.sqrt(err.reduce((a, e) => a + e * e, 0) / COUNT);
  // RMSE of the ordinary weights only, so the outlier's damage to its
  // neighbours is visible rather than hidden inside its own error.
  const others = err.filter((_, i) => !(outlier && i === OUTLIER_AT));
  const rmseOthers = Math.sqrt(others.reduce((a, e) => a + e * e, 0) / others.length);
  const zeros = q.filter((k, i) => k === 0 && Math.abs(w[i]) > 0.05).length;
  const bpw = bits + SCALE_BITS / block;
  return { w, q, deq, err, scales, rmse, rmseOthers, zeros, bpw, qmax, blocks, gb8b: (8e9 * bpw) / 8 / 1e9 };
}

const nf = (n: number, d = 2) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

function SpanishVisual() {
  const [bits, setBits] = useState<"2" | "3" | "4" | "8">("4");
  const [blockExp, setBlockExp] = useState(5); // 2^5 = 32
  const [outlier, setOutlier] = useState(false);
  const block = 2 ** blockExp;
  const m = useMemo(() => quantize(Number(bits), block, outlier), [bits, block, outlier]);
  const note = (
    <div className="space-y-3">
      <p>
        <strong>Cuantizar por bloques es redondear a una rejilla.</strong> Cada bloque de {block} pesos guarda una escala FP16 = máx|w| / {m.qmax}; cada peso se guarda como el entero más cercano de ±{m.qmax} y se reconstruye como entero × escala. Con {bits} bits el error cuadrático medio es {nf(m.rmse, 3)}; el almacenamiento real es {nf(m.bpw)} bits por peso porque la escala también ocupa sitio ({nf(m.gb8b, 1)} GB para 8·10⁹ pesos).
        {outlier ? ` Un solo peso atípico (${nf(OUTLIER, 1)}) estira la escala de su bloque: ${m.zeros} pesos pequeños caen a cero y el error del resto sube a ${nf(m.rmseOthers, 3)}. Bloques más pequeños lo aíslan; AWQ protege los canales importantes.` : ""}
      </p>
      <Readout
        items={[
          { label: "bits", value: bits, tone: "var(--teal)" },
          { label: "bloque", value: `${block} pesos · ${m.blocks} escala${m.blocks > 1 ? "s" : ""}`, tone: "var(--amber)" },
          { label: "bits/peso", value: nf(m.bpw), tone: "var(--ink)" },
          { label: "RMSE", value: nf(m.rmse, 3), tone: "var(--rose)" },
        ]}
      />
      <p className="text-xs text-muted">Esquema simétrico didáctico con 32 pesos inventados. Q4_K de llama.cpp usa superbloques con escalas y mínimos cuantizados, NF4 usa niveles no uniformes y GPTQ/AWQ corrigen con datos de calibración: la idea de escala por bloque es común, los detalles no. Recuerda el caso de la lección: si el Q4 «parece tonto», revisa antes la plantilla de chat.</p>
    </div>
  );
  return (
    <Figure
      label="Cuantización por bloques · pesos, rejilla y escala"
      hint="redondeo, error y bits que se guardan"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.amber, label: "peso original" },
        { color: P.teal, label: "peso reconstruido" },
        { color: P.rose, label: "error" },
        { color: P.violet, label: "bits de la escala" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={bits} onChange={setBits} ariaLabel="Bits por peso" options={(["2", "3", "4", "8"] as const).map((b) => ({ value: b, label: b + " bits", tone: P.teal }))} />
          <Knob label="bloque" value={blockExp} min={3} max={5} onChange={setBlockExp} format={(v) => String(2 ** v)} tone="var(--amber)" />
          <button type="button" className="chip" aria-pressed={outlier} style={outlier ? { background: "var(--rose-wash)", borderColor: "var(--rose)" } : undefined} onClick={() => setOutlier(!outlier)}>
            {outlier ? "Quitar atípico" : "Añadir peso atípico"}
          </button>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1, 2.2, 11.5], fov: 35 }} fit={1.02}>
        <BlockScene m={m} block={block} bits={Number(bits)} />
      </Stage>
    </Figure>
  );
}

type QM = ReturnType<typeof quantize>;
function BlockScene({ m, block, bits }: { m: QM; block: number; bits: number }) {
  void m; void block; void bits;
  return <group />;
}

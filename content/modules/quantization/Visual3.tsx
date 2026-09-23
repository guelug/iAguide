"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { ExtrudeGeometry, Group, MathUtils, Shape } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { ShadowBlob, Wire } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

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

function LegacyVisual() {
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

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Prec = "fp16" | "q8" | "q4";
/* Bits per weight. Q8_0 and Q4_K_M include their block scales; the values
   are the usual llama.cpp approximations, not a measurement of one file. */
const PREC: Record<Prec, { label: string; bpw: number; color: string }> = {
  fp16: { label: "FP16", bpw: 16, color: P.amber },
  q8: { label: "Q8_0", bpw: 8.5, color: P.violet },
  q4: { label: "Q4_K_M", bpw: 4.85, color: P.teal },
};
const N_PARAMS = 8e9;
const PEAK_FLOPS = 165e12; // didactic GPU: 165 TFLOP/s effective
const BANDWIDTH = 1.0e12; // 1 TB/s
const RIDGE = PEAK_FLOPS / BANDWIDTH; // FLOP per byte where the roof flattens

function phase(tokens: number, bpw: number) {
  const bytes = (N_PARAMS * bpw) / 8; // weights read once per forward pass
  const flops = 2 * N_PARAMS * tokens;
  const tCompute = flops / PEAK_FLOPS;
  const tMemory = bytes / BANDWIDTH;
  const intensity = flops / bytes;
  const perf = Math.min(PEAK_FLOPS, intensity * BANDWIDTH);
  return { bytes, flops, tCompute, tMemory, time: Math.max(tCompute, tMemory), intensity, perf, bound: tCompute >= tMemory ? "cómputo" : "memoria" };
}

function roofModel(prec: Prec, prompt: number) {
  const bpw = PREC[prec].bpw;
  const prefill = phase(prompt, bpw);
  const decode = phase(1, bpw);
  const base = { prefill: phase(prompt, 16), decode: phase(1, 16) };
  return { prefill, decode, base, tokS: 1 / decode.time, speedup: base.decode.time / decode.time, prefillGain: base.prefill.time / prefill.time };
}

const fmt = (n: number, d = 1) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

function SpanishVisual() {
  const [prec, setPrec] = useState<Prec>("q4");
  const [promptExp, setPromptExp] = useState(9); // 2^9 = 512 tokens
  const prompt = 2 ** promptExp;
  const m = useMemo(() => roofModel(prec, prompt), [prec, prompt]);
  const note = (
    <div className="space-y-3">
      <p>
        <strong>Mismo modelo, dos puntos en el techo.</strong> El prefill de {prompt} tokens hace {fmt(m.prefill.intensity, 0)} FLOP por byte de pesos leído: está a la derecha del codo ({fmt(RIDGE, 0)} FLOP/B) y lo limita el cómputo ({fmt(m.prefill.time * 1e3)} ms, {m.prefill.bound}). El decode genera un token por pasada: {fmt(m.decode.intensity, 2)} FLOP/B, en la rampa del ancho de banda. Con {PREC[prec].label} cada token relee {fmt(m.decode.bytes / 1e9, 2)} GB y sale a {fmt(m.tokS, 0)} tokens/s, {fmt(m.speedup, 2)}× respecto a FP16; el prefill mejora {fmt(m.prefillGain, 2)}×.
      </p>
      <Readout
        items={[
          { label: "prefill", value: `${fmt(m.prefill.time * 1e3)} ms · ${m.prefill.bound}`, tone: "var(--violet)" },
          { label: "decode", value: `${fmt(m.decode.time * 1e3, 2)} ms/token · ${m.decode.bound}`, tone: "var(--teal)" },
          { label: "tokens/s", value: fmt(m.tokS, 0), tone: "var(--teal)" },
          { label: "vs FP16", value: `${fmt(m.speedup, 2)}×`, tone: "var(--amber)" },
        ]}
      />
      <p className="rounded border border-line bg-paper p-2 font-mono text-xs">tiempo = max(2·N·tokens / 165 TFLOP/s, N·bits/8 / 1 TB/s), N = 8·10⁹</p>
      <p className="text-xs text-muted">Modelo roofline didáctico: GPU imaginaria de 165 TFLOP/s efectivos y 1 TB/s; ignora caché KV, FLOPs de atención, kernels de descuantización y solapamiento. Los bits por peso de Q8_0 (8,5) y Q4_K_M (≈4,85) incluyen escalas de bloque y son aproximados.</p>
    </div>
  );
  return (
    <Figure
      label="Roofline · prefill frente a decode"
      hint="cómputo arriba, ancho de banda en la rampa"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.violet, label: "prefill" },
        { color: P.teal, label: "decode" },
        { color: P.inkSoft, label: "techo del chip" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={prec} onChange={setPrec} ariaLabel="Precisión de los pesos" options={(Object.keys(PREC) as Prec[]).map((k) => ({ value: k, label: PREC[k].label, tone: PREC[k].color }))} />
          <Knob label="prompt" value={promptExp} min={4} max={13} onChange={setPromptExp} format={(v) => String(2 ** v)} tone="var(--violet)" />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1, 2.2, 11.5], fov: 35 }} fit={1.02}>
        <RoofScene m={m} prec={prec} />
      </Stage>
    </Figure>
  );
}

type RM = ReturnType<typeof roofModel>;
const LX0 = -0.5;
const LX1 = 4.6;
const FLOOR = -1.35;
const DEPTH = 1.3;
const toX = (lx: number) => -4 + ((lx - LX0) / (LX1 - LX0)) * 7.8;
const toY = (ly: number) => -1.1 + (ly + 0.6) * 1.15;
const roofLy = (lx: number) => Math.min(lx + Math.log10(BANDWIDTH / 1e12), Math.log10(PEAK_FLOPS / 1e12));
const RIDGE_LX = Math.log10(RIDGE);

function AttainableBlock() {
  const geom = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(toX(LX0), FLOOR);
    shape.lineTo(toX(LX0), toY(roofLy(LX0)));
    shape.lineTo(toX(RIDGE_LX), toY(roofLy(RIDGE_LX)));
    shape.lineTo(toX(LX1), toY(roofLy(LX1)));
    shape.lineTo(toX(LX1), FLOOR);
    shape.closePath();
    const g = new ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    g.translate(0, 0, -DEPTH / 2);
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <mesh geometry={geom} castShadow receiveShadow>
      <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.14)} roughness={0.35} clearcoat={0.5} transparent opacity={0.82} />
    </mesh>
  );
}

function RoofEdge() {
  const pts: [number, number, number][] = [
    [toX(LX0), toY(roofLy(LX0)) + 0.05, DEPTH / 2 + 0.04],
    [toX(RIDGE_LX), toY(roofLy(RIDGE_LX)) + 0.05, DEPTH / 2 + 0.04],
    [toX(LX1), toY(roofLy(LX1)) + 0.05, DEPTH / 2 + 0.04],
  ];
  return <Wire points={pts} color={P.inkSoft} width={3} opacity={0.95} />;
}

function Axes() {
  const xt = [0, 1, 2, 3, 4];
  const yt = [0, 1, 2];
  return (
    <group>
      {xt.map((e) => (
        <group key={e} position={[toX(e), FLOOR - 0.02, DEPTH / 2 + 0.1]}>
          <mesh><boxGeometry args={[0.03, 0.14, 0.03]} /><meshBasicMaterial color={P.inkSoft} /></mesh>
          <Tag position={[0, -0.26, 0]} tone="muted" size="xs" center>{new Intl.NumberFormat("es-ES").format(10 ** e)}</Tag>
        </group>
      ))}
      <Tag position={[toX(2), FLOOR - 0.62, DEPTH / 2 + 0.1]} tone="ink" size="xs" center>FLOP por byte</Tag>
      {yt.map((e) => (
        <group key={e}>
          <Wire points={[[toX(LX0), toY(e), -DEPTH / 2 - 0.02], [toX(LX1), toY(e), -DEPTH / 2 - 0.02]]} color={P.lineStrong} width={1} opacity={0.6} dashed />
          <Tag position={[toX(LX0) - 0.2, toY(e), -DEPTH / 2]} tone="muted" size="xs" center>{10 ** e + " TF/s"}</Tag>
        </group>
      ))}
      <Tag position={[toX(RIDGE_LX), toY(roofLy(RIDGE_LX)) + 0.38, DEPTH / 2]} tone="ink" size="xs" center>codo · 165</Tag>
    </group>
  );
}

function Pin({ lx, color, label, ghost = false }: { lx: number; color: string; label?: string; ghost?: boolean }) {
  const ref = useRef<Group>(null);
  const stem = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const tx = toX(lx);
    const ty = toY(roofLy(lx));
    g.position.x = still ? tx : MathUtils.damp(g.position.x, tx, 5, dt);
    const lxNow = LX0 + ((g.position.x + 4) / 7.8) * (LX1 - LX0);
    const yNow = still ? ty : toY(roofLy(lxNow));
    g.position.y = yNow;
    if (stem.current) {
      const h = yNow - FLOOR;
      stem.current.scale.y = h;
      stem.current.position.y = -h / 2;
    }
  });
  return (
    <group ref={ref} position={[toX(lx), toY(roofLy(lx)), DEPTH / 2 + (ghost ? 0.12 : 0.3)]}>
      <group ref={stem}>
        <mesh><cylinderGeometry args={[ghost ? 0.012 : 0.025, ghost ? 0.012 : 0.025, 1, 10]} /><meshStandardMaterial color={color} transparent opacity={ghost ? 0.4 : 0.9} /></mesh>
      </group>
      <mesh castShadow>
        <sphereGeometry args={[ghost ? 0.07 : 0.15, 24, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.7} transparent={ghost} opacity={ghost ? 0.5 : 1} />
      </mesh>
      {label ? <Tag position={[0, 0.38, 0]} tone={color === P.teal ? "teal" : "violet"} size="xs" center>{label}</Tag> : null}
    </group>
  );
}

function RoofScene({ m, prec }: { m: RM; prec: Prec }) {
  return (
    <group>
      <ShadowBlob position={[0, FLOOR - 0.35, 0.1]} scale={9.4} opacity={0.1} />
      <RoundedBox position={[0, FLOOR - 0.2, 0]} args={[9.4, 0.26, 2.3]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#2D3436" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox position={[0, (toY(2.3) + FLOOR) / 2, -DEPTH / 2 - 0.1]} args={[8.6, toY(2.3) - FLOOR, 0.1]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#E4DFD3" roughness={0.6} />
      </RoundedBox>
      <AttainableBlock />
      <RoofEdge />
      <Axes />
      {(Object.keys(PREC) as Prec[]).filter((k) => k !== prec).map((k) => (
        <Pin key={k} lx={Math.log10(roofModel(k, 1).decode.intensity)} color={PREC[k].color} ghost />
      ))}
      <Pin lx={Math.log10(m.decode.intensity)} color={P.teal} label={`decode · ${fmt(m.tokS, 0)} tok/s`} />
      <Pin lx={Math.log10(m.prefill.intensity)} color={P.violet} label={`prefill · ${fmt(m.prefill.time * 1e3, 0)} ms`} />
    </group>
  );
}

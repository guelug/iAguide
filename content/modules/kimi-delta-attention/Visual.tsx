"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Node3D, ShadowBlob, Slab, Tag, Turntable, Wire, type Cell } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "softmax" | "kda" | "hybrid";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "hybrid": "hybrid",
      "kda_fixed_s": "KDA / fixed S",
      "softmax_kv": "softmax KV",
      "hybrid_mix": "hybrid mix"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "hybrid": "híbrido",
      "kda_fixed_s": "KDA / S fijo",
      "softmax_kv": "KV de softmax",
      "hybrid_mix": "mezcla híbrida"
    },
  });

  const OPTIONS = [
    { value: "softmax" as const, label: "softmax", tone: "var(--amber)" },
    { value: "kda" as const, label: "kda", tone: "var(--teal)" },
    { value: "hybrid" as const, label: t.hybrid, tone: "var(--violet)" },
  ];
  const [step, setStep] = useState<Step>("softmax");

  return (
    <Figure
      label="Cache vs state"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.kda_fixed_s },
        { color: P.amber, label: t.softmax_kv },
        { color: P.violet, label: t.hybrid_mix },
      ]}
      controls={
        <Switcher
          ariaLabel="kimi delta attention diagrams"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.4, 7.6], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active }: { active: Step }) {
  return (
    <group>
      {active === "softmax" ? <SoftmaxScene /> : null}
      {active === "kda" ? <KdaScene /> : null}
      {active === "hybrid" ? <HybridScene /> : null}
    </group>
  );
}

function SoftmaxScene() {
  const heights = [0.28, 0.42, 0.56, 0.72, 0.9, 1.1, 1.32, 1.55];
  return (
    <group>
      <Wire points={[[-2.8, -0.7, 0], [2.8, -0.7, 0]]} color={P.line} opacity={0.45} />
      <Tag position={[0, -1.25, 0]} tone="amber" center>
        KV grows with T
      </Tag>
      {heights.map((h, i) => {
        const x = -2.2 + i * 0.62;
        return (
          <Slab
            key={i}
            position={[x, -0.7 + h / 2, 0]}
            size={[0.48, h, 0.14]}
            color={P.amber}
            fill={0.18 + i * 0.08}
          />
        );
      })}
      <Node3D position={[2.55, 1.15, 0]} color={P.amber} radius={0.14} pulse={0.4} />
      <Tag position={[2.55, 1.55, 0]} tone="amber" center>
        decode O(T)
      </Tag>
      <Flow points={[[-2.4, 1.15, 0], [2.4, 1.15, 0]]} color={P.amber} count={4} speed={0.32} />
    </group>
  );
}

function KdaScene() {
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      cells.push({ x: -0.54 + c * 0.36, y: -0.15 + r * 0.36 });
    }
  }
  return (
    <group>
      <Wire
        points={[
          [-2.2, 0.35, 0],
          [-1.1, 0.35, 0],
          [-1.1, -0.85, 0],
          [1.1, -0.85, 0],
          [1.1, 0.35, 0],
          [2.2, 0.35, 0],
        ]}
        color={P.line}
        opacity={0.5}
      />
      <Flow
        points={[
          [-2.2, 0.35, 0],
          [-1.1, 0.35, 0],
          [-1.1, -0.85, 0],
          [1.1, -0.85, 0],
          [1.1, 0.35, 0],
          [2.2, 0.35, 0],
        ]}
        color={P.teal}
        count={3}
        speed={0.28}
      />
      {cells.map((p, i) => (
        <Slab
          key={i}
          position={[p.x, p.y, 0]}
          size={[0.28, 0.28, 0.1]}
          color={P.teal}
          fill={0.5}
        />
      ))}
      <Tag position={[0, 1.55, 0]} tone="teal" center>
        fixed S  128 x 128
      </Tag>
      <Tag position={[-2.2, 0.85, 0]} tone="teal" center>
        k, v in
      </Tag>
      <Tag position={[2.2, 0.85, 0]} tone="teal" center>
        o = S q
      </Tag>
      <Node3D position={[0, -1.2, 0]} color={P.teal} radius={0.12} pulse={0.3} />
    </group>
  );
}

function HybridScene() {
  const kdaX = [-2.25, -0.95, 0.35];
  return (
    <group>
      <Wire points={[[-2.6, -0.55, 0], [2.6, -0.55, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.6, -0.55, 0], [2.6, -0.55, 0]]} color={P.violet} count={3} speed={0.3} />
      {kdaX.map((x, i) => (
        <group key={i}>
          <Slab position={[x, 0.35, 0]} size={[1.05, 0.72, 0.12]} color={P.teal} fill={0.52} />
          <Tag position={[x, 0.95, 0]} tone="teal" center>
            KDA
          </Tag>
          <Slab position={[x, -1.05, 0]} size={[0.72, 0.28, 0.1]} color={P.teal} fill={0.45} />
        </group>
      ))}
      <Slab position={[1.85, 0.35, 0]} size={[1.05, 0.72, 0.12]} color={P.amber} fill={0.55} />
      <Tag position={[1.85, 0.95, 0]} tone="amber" center>
        MLA
      </Tag>
      {[0, 1, 2, 3].map((i) => (
        <Slab
          key={i}
          position={[1.85, -0.85 + i * 0.16, 0]}
          size={[0.72, 0.12, 0.08]}
          color={P.amber}
          fill={0.35 + i * 0.08}
        />
      ))}
      <Tag position={[0, 1.55, 0]} tone="violet" center>
        3 KDA : 1 MLA
      </Tag>
    </group>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: memoria de servicio frente a longitud de contexto T.
 * Ocho capas en fila. Una capa de atención completa guarda
 * 2 × T × n_heads × d_head números (fórmula de la lección: 16 cabezas KV,
 * d_head 128, BF16): una torre que crece con T. Una capa KDA guarda un
 * estado fijo 128 × 128 por cabeza: una losa que no cambia. El híbrido
 * 3:1 pone una capa completa (MLA) cada cuatro.
 */

type Arch = "full" | "kda" | "hybrid";

const LAYERS = 8;
const HEADS = 16;
const D_HEAD = 128;
const BYTES = 2;
const T_OPTIONS = [4096, 32768, 131072, 262144, 524288, 1_000_000];
const T_LABELS = ["4k", "32k", "128k", "256k", "512k", "1M"];
const TOWER_MAX = 3.2;
const SLICE = 0.1;
const BAY = 1.05;

const kvBytesPerLayer = (t: number) => 2 * t * HEADS * D_HEAD * BYTES;
const STATE_BYTES = HEADS * D_HEAD * D_HEAD * BYTES;

function isFull(arch: Arch, layer: number) {
  if (arch === "full") return true;
  if (arch === "kda") return false;
  return layer % 4 === 3;
}

function gb(bytes: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: bytes >= 1e10 ? 1 : 2 }).format(bytes / 1e9);
}

function MemoryRow({ arch, t }: { arch: Arch; t: number }) {
  const height = Math.max(SLICE, (t / T_OPTIONS[T_OPTIONS.length - 1]) * TOWER_MAX);
  const slices = Math.max(1, Math.round(height / SLICE));
  const bayX = (l: number) => (l - (LAYERS - 1) / 2) * BAY;
  const { tower, state } = useMemo(() => {
    const towerCells: Cell[] = [];
    const stateCells: Cell[] = [];
    for (let l = 0; l < LAYERS; l += 1) {
      const x = bayX(l);
      if (isFull(arch, l)) {
        for (let s = 0; s < slices; s += 1) {
          towerCells.push({
            position: [x, 0.52 + s * SLICE + SLICE * 0.4, 0],
            scale: [0.62, SLICE * 0.8, 0.62],
            color: mixHex(P.paper, P.amber, 0.55 + (s / slices) * 0.4),
          });
        }
      } else {
        for (let c = 0; c < 16; c += 1) {
          stateCells.push({
            position: [x - 0.24 + (c % 4) * 0.16, 0.56, -0.24 + Math.floor(c / 4) * 0.16],
            scale: [0.13, 0.08, 0.13],
            color: mixHex(P.paper, P.teal, 0.55 + ((c * 7) % 5) * 0.09),
          });
        }
      }
    }
    return { tower: towerCells, state: stateCells };
  }, [arch, slices]);

  return (
    <group>
      <ShadowBlob position={[0, 0.004, 0.2]} scale={LAYERS * BAY + 1.5} opacity={0.1} />
      <RoundedBox args={[LAYERS * BAY + 0.9, 0.24, 2.5]} position={[0, 0.12, 0.25]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      {Array.from({ length: LAYERS }, (_, l) => {
        const full = isFull(arch, l);
        return (
          <group key={l}>
            <RoundedBox args={[0.88, 0.2, 0.88]} position={[bayX(l), 0.38, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
              <meshPhysicalMaterial color={full ? "#3A3430" : "#2C3332"} roughness={0.42} metalness={0.2} clearcoat={0.3} />
            </RoundedBox>
            <mesh position={[bayX(l), 0.39, 0.445]}>
              <planeGeometry args={[0.7, 0.07]} />
              <meshStandardMaterial color={full ? P.amber : P.teal} roughness={0.5} />
            </mesh>
            <Tag position={[bayX(l), 0.3, 0.85]} tone={full ? "amber" : "teal"} size="xs" center plate={false}>
              {full ? (arch === "full" ? "completa" : "MLA") : "KDA"}
            </Tag>
            {full ? (
              <Flow
                points={[[bayX(l) + 0.4, 0.55, 0.36], [bayX(l) + 0.4, 0.55 + height, 0.36]]}
                color={P.amber}
                count={2}
                size={0.035}
                speed={0.5}
                offset={l * 0.13}
                lineOpacity={0.15}
              />
            ) : null}
          </group>
        );
      })}
      {/* regla fija hasta 1M: mantiene la escala entre valores de T */}
      <mesh position={[bayX(LAYERS - 1) + 0.8, 0.52 + TOWER_MAX / 2, -0.45]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, TOWER_MAX, 8]} />
        <meshStandardMaterial color="#8C9895" metalness={0.6} roughness={0.35} />
      </mesh>
      {[0.25, 0.5, 1].map((f) => (
        <group key={f}>
          <mesh position={[bayX(LAYERS - 1) + 0.8, 0.52 + f * TOWER_MAX, -0.45]}>
            <boxGeometry args={[0.18, 0.02, 0.02]} />
            <meshStandardMaterial color={P.inkSoft} />
          </mesh>
          <Tag position={[bayX(LAYERS - 1) + 1.02, 0.52 + f * TOWER_MAX, -0.45]} tone="muted" size="xs" plate={false}>
            {f === 1 ? "1M" : f === 0.5 ? "500k" : "250k"}
          </Tag>
        </group>
      ))}
      <Lattice cells={tower} size={1} />
      <Lattice cells={state} size={1} />
      <Tag position={[bayX(LAYERS - 1) - 0.1, 0.75 + height, 0]} tone="amber" size="xs" center>
        {arch === "kda" ? "sin caché KV" : `caché KV · ${T_LABELS[T_OPTIONS.indexOf(t)]}`}
      </Tag>
      <Tag position={[bayX(0) - 0.9, 0.62, 0]} tone="teal" size="xs" center>
        {arch === "full" ? "8 capas" : "estado fijo"}
      </Tag>
    </group>
  );
}

function SpanishVisual() {
  const [arch, setArch] = useState<Arch>("hybrid");
  const [tIndex, setTIndex] = useState(5);
  const t = T_OPTIONS[tIndex];
  const fullLayers = Array.from({ length: LAYERS }, (_, l) => isFull(arch, l)).filter(Boolean).length;
  const kdaLayers = LAYERS - fullLayers;
  const total = fullLayers * kvBytesPerLayer(t) + kdaLayers * STATE_BYTES;
  const baseline = LAYERS * kvBytesPerLayer(t);
  const saving = 1 - total / baseline;
  const esPct = new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 1 });

  const text: Record<Arch, string> = {
    full: "Softmax en todas las capas: cada token nuevo añade una key y un value por capa y cabeza, y el decode relee la torre entera. Las partículas suben por la caché: esa lectura crece con T.",
    kda: "KDA en todas las capas: cada capa guarda S de 128 × 128 por cabeza, lo mismo a 4k que a 1M. El decode es un producto matriz-vector contra un estado fijo. Es rápido, pero una matriz finita recupera peor que la lista exacta.",
    hybrid: "Híbrido 3:1: tres capas KDA con estado fijo y una capa MLA que sigue dueña de una caché KV real, para el copiado y la recuperación exacta. La caché solo existe en un cuarto de la pila.",
  };

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
        {[
          ["Por capa completa", `${gb(kvBytesPerLayer(t))} GB`],
          ["Por capa KDA", `${new Intl.NumberFormat("es-ES").format(STATE_BYTES / 1024)} KiB`],
          ["Total 8 capas", `${gb(total)} GB`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>{text[arch]}</p>
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        KV por capa = 2 × T × 16 cabezas × 128 × 2 B = {gb(kvBytesPerLayer(t))} GB con T = {T_LABELS[tIndex]} · estado KDA = 16 × 128 × 128 × 2 B = 512 KiB
        · ahorro frente a softmax en todas: {esPct.format(saving)}
      </p>
      <p className="text-xs text-muted">
        Fórmula de la lección para una capa de atención completa, batch 1. MLA real comprime su caché en un latente, así que las cifras absolutas son
        ilustrativas; la proporción 3:1 es la del paper (hasta un 75 % menos de KV). La altura de las torres es lineal en T.
      </p>
    </div>
  );

  return (
    <Figure
      label="Memoria de servicio: la torre KV frente al estado fijo"
      hint="ocho capas · la altura crece con el contexto T"
      height="h-[500px] md:h-[580px]"
      legend={[
        { color: P.amber, label: "caché KV (crece con T)" },
        { color: P.teal, label: "estado KDA (fijo)" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Arquitectura"
            value={arch}
            onChange={setArch}
            options={[
              { value: "full", label: "Softmax", tone: P.amber },
              { value: "kda", label: "KDA", tone: P.teal },
              { value: "hybrid", label: "Híbrido 3:1", tone: P.violet },
            ]}
          />
          <Knob label="Contexto T" min={0} max={T_OPTIONS.length - 1} value={tIndex} onChange={setTIndex} format={(i) => T_LABELS[i]} tone={P.amber} />
          <Readout items={[{ label: "total", value: `${gb(total)} GB`, tone: P.ink }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3.5, 4.6, 10], fov: 34 }} fit={1.08}>
        <MemoryRow arch={arch} t={t} />
      </Stage>
    </Figure>
  );
}

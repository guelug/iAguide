"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { MathUtils, type Group } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Wire, hash, type Cell, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

type Mode = "layers" | "train" | "api";
const COPY = {
  en: {
    title: "name the layer before you blame it",
    hint: "product · train vs use · file vs API",
    layers: "layers",
    train: "train / use",
    api: "file / API",
    product: "product",
    harness: "harness",
    model: "model",
    weights: "weights",
    chat: "chat",
    lora: "LoRA",
    disk: "on disk",
    rent: "per token",
    layersNote: "the failure is always in one layer",
    trainNote: "LoRA rewrites numbers · chat does not",
    apiNote: "same weights: owned or rented",
  },
  es: {
    title: "nombra la capa antes de culpar",
    hint: "producto · entrenar / usar · archivo / API",
    layers: "capas",
    train: "entrenar / usar",
    api: "archivo / API",
    product: "producto",
    harness: "arnés",
    model: "modelo",
    weights: "pesos",
    chat: "chat",
    lora: "LoRA",
    disk: "en disco",
    rent: "por token",
    layersNote: "el fallo siempre vive en una capa",
    trainNote: "LoRA reescribe números · el chat no",
    apiNote: "los mismos pesos: tuyos o alquilados",
  },
};

function LayersScene({ t }: { t: (typeof COPY)["es"] }) {
  const layers: { label: string; color: string; tone: "teal" | "violet" | "amber"; y: number }[] = [
    { label: t.model, color: P.amber, tone: "amber", y: -0.62 },
    { label: t.harness, color: P.violet, tone: "violet", y: 0 },
    { label: t.product, color: P.teal, tone: "teal", y: 0.62 },
  ];
  return (
    <group rotation={[-0.42, 0, 0]} position={[0, 0.12, 0]}>
      {layers.map((layer) => (
        <group key={layer.label}>
          <Slab position={[0, layer.y, 0]} size={[3.4, 0.16, 1.7]} color={layer.color} fill={0.3} />
          <Tag position={[-2.05, layer.y + 0.12, 0.2]} tone={layer.tone} size="xs">
            {layer.label}
          </Tag>
        </group>
      ))}
      <Flow points={[[0, 0.72, 0.2], [0, 0.5, 0.1], [0, 0.1, 0], [0, -0.14, 0], [0, -0.5, 0.1], [0, -0.72, 0.2]]} color={P.inkSoft} count={4} speed={0.16} size={0.04} lineOpacity={0.3} />
    </group>
  );
}

function TrainScene({ t }: { t: (typeof COPY)["es"] }) {
  const cells = [-0.27, -0.09, 0.09, 0.27].flatMap((x, xi) =>
    [-0.12, 0.06].map((y, yi) => ({
      position: [x, y + 0.05, 0.1] as [number, number, number],
      color: (xi * 2 + yi) % 3 === 0 ? P.rose : P.teal,
      scale: 0.8,
    })),
  );
  return (
    <>
      <group position={[-1.75, 0.1, 0]}>
        <Slab position={[0, 0, 0]} size={[1.35, 0.9, 0.14]} color={P.rose} fill={0.2} />
        <Lattice cells={cells} size={0.11} />
        <Halo position={[0, 0, 0.06]} radius={0.68} color={P.rose} opacity={0.4} spin={0.2} />
        <Tag position={[0, 0.82, 0.15]} tone="rose" size="xs" center>
          {t.lora}
        </Tag>
      </group>
      <Ribbon points={[[-0.9, 0.1, 0], [0.9, 0.1, 0]]} color={P.lineStrong} radius={0.03} opacity={0.6} />
      <group position={[1.75, 0.1, 0]}>
        <Slab position={[0, 0, 0]} size={[1.35, 0.9, 0.14]} color={P.teal} fill={0.2} />
        <Lattice cells={cells.map((c) => ({ ...c, color: P.teal }))} size={0.11} />
        <Tag position={[0, 0.82, 0.15]} tone="teal" size="xs" center>
          {t.chat}
        </Tag>
      </group>
    </>
  );
}

function ApiScene({ t }: { t: (typeof COPY)["es"] }) {
  return (
    <>
      <group position={[-1.75, 0.05, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.5, 40]} />
          <meshStandardMaterial color={P.teal} roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.14, 0.4, 40]} />
          <meshBasicMaterial color={P.tealDeep} transparent opacity={0.7} />
        </mesh>
        <Tag position={[0, 0.82, 0.15]} tone="teal" size="xs" center>
          {t.disk}
        </Tag>
      </group>
      <Flow points={[[-1.1, 0.1, 0], [1.1, 0.1, 0]]} color={P.amber} count={6} speed={0.3} />
      <group position={[1.75, 0.05, 0]}>
        <Node3D position={[0, 0, 0]} color={P.amber} radius={0.2} pulse={0.4} />
        <Halo position={[0, 0, 0]} radius={0.5} color={P.amber} opacity={0.5} spin={0.16} />
        <Halo position={[0, 0, 0]} radius={0.66} color={P.amber} opacity={0.28} spin={-0.1} />
        <Tag position={[0, 0.82, 0.15]} tone="amber" size="xs" center>
          {t.rent}
        </Tag>
      </group>
    </>
  );
}

export default function Visual2() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("layers");
  const note = mode === "layers" ? t.layersNote : mode === "train" ? t.trainNote : t.apiNote;
  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.product },
        { color: P.violet, label: t.harness },
        { color: P.amber, label: t.model },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "layers", label: t.layers, tone: P.teal },
            { value: "train", label: t.train, tone: P.violet },
            { value: "api", label: t.api, tone: P.amber },
          ]}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }} background={P.paper}>
        <Motes count={110} radius={7} color={P.lineStrong} size={0.024} opacity={0.22} />
        <PointerTilt amount={0.08}>
          {mode === "layers" && <LayersScene t={t} />}
          {mode === "train" && <TrainScene t={t} />}
          {mode === "api" && <ApiScene t={t} />}
          <ShadowBlob position={[0, -1.02, 0]} scale={4.2} opacity={0.07} />
          <Tag position={[0, -0.95, 0.15]} tone="muted" size="xs" center>
            {note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Casa seccionada: producto, arnés y modelo son plantas distintas.
 * El modelo es una rejilla de 64 pesos (didáctica) con una huella
 * calculada sobre sus valores. Chatear la deja intacta; cada paso de
 * entrenamiento la mueve w ← w − η·g; cambiar de modelo cambia el archivo
 * sin tocar la planta del producto. El archivo puede estar en disco o
 * alquilarse por token en otro edificio.
 */

type Op = "chat" | "train" | "swap";
type Where = "disk" | "api";

const N = 8;
const ETA = 0.15;
const baseWeights = (salt: number) => Array.from({ length: N * N }, (_, i) => Math.round((hash(i, salt) * 2 - 1) * 1000) / 1000);
const GRAD = Array.from({ length: N * N }, (_, i) => Math.round((hash(i, 91) * 2 - 1) * 1000) / 1000);

function weightsFor(op: Op, steps: number) {
  if (op === "swap") return baseWeights(7);
  const w = baseWeights(3);
  if (op !== "train") return w;
  return w.map((v, i) => Math.round((v - ETA * steps * GRAD[i]) * 1000) / 1000);
}

/** FNV-1a over the weights quantised to 1/1000: a stand-in for a file checksum. */
function fingerprint(w: number[]) {
  let h = 0x811c9dc5;
  for (const v of w) {
    h ^= Math.round(v * 1000) & 0xffff;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function HMat({ color, rough = 0.45, coat = 0.4, metal = 0, opacity = 1 }: { color: string; rough?: number; coat?: number; metal?: number; opacity?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} transparent={opacity < 1} opacity={opacity} />;
}

const FLOOR_H = 0.95;
const FY = { model: -1.0, harness: -1.0 + FLOOR_H, product: -1.0 + 2 * FLOOR_H };
const HOUSE = { w: 4.2, d: 2.3 };

function weightCells(w: number[], x0: number, y0: number, z0: number): Cell[] {
  return w.map((v, i) => {
    const c = i % N;
    const r = Math.floor(i / N);
    const h = 0.05 + Math.abs(v) * 0.4;
    return {
      position: [x0 + (c - (N - 1) / 2) * 0.22, y0 + h / 2, z0 + (r - (N - 1) / 2) * 0.2] as V3,
      scale: [0.17, h, 0.15] as V3,
      color: v >= 0 ? mixHex(P.tealWash, P.teal, Math.min(1, Math.abs(v))) : mixHex(P.amberWash, P.amber, Math.min(1, Math.abs(v))),
    };
  });
}

function Slabfloor({ y, color }: { y: number; color: string }) {
  return (
    <RoundedBox args={[HOUSE.w, 0.1, HOUSE.d]} position={[0, y, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
      <HMat color={color} rough={0.5} coat={0.3} />
    </RoundedBox>
  );
}

function ChatScreen() {
  return (
    <group position={[0, FY.product + 0.05, -0.7]}>
      <RoundedBox args={[2.2, 0.72, 0.1]} position={[0, 0.42, 0]} radius={0.05} smoothness={3} castShadow>
        <HMat color="#2a2e33" rough={0.4} coat={0.5} />
      </RoundedBox>
      {[0.6, 0.45, 0.3].map((y, i) => (
        <mesh key={y} position={[i % 2 ? 0.25 : -0.25, y, 0.055]}>
          <planeGeometry args={[1.2, 0.09]} />
          <meshBasicMaterial color={i % 2 ? P.violetWash : P.tealWash} />
        </mesh>
      ))}
      <mesh position={[0, 0.16, 0.055]}>
        <planeGeometry args={[1.9, 0.1]} />
        <meshBasicMaterial color={P.surface} />
      </mesh>
      {/* quota meter and billing card: product concerns */}
      <mesh position={[1.55, 0.3, 0.3]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 28]} />
        <HMat color={P.surface} rough={0.4} />
      </mesh>
      <mesh position={[1.55, 0.37, 0.3]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.02, 0.01, 0.14]} />
        <meshBasicMaterial color={P.rose} />
      </mesh>
      <RoundedBox args={[0.5, 0.04, 0.32]} position={[-1.5, 0.03, 0.4]} radius={0.01} smoothness={2} castShadow>
        <HMat color={P.amber} rough={0.4} />
      </RoundedBox>
    </group>
  );
}

function HarnessDesk() {
  return (
    <group position={[0, FY.harness + 0.05, -0.3]}>
      <RoundedBox args={[1.9, 0.08, 0.9]} position={[-0.4, 0.4, 0]} radius={0.02} smoothness={2} castShadow receiveShadow>
        <HMat color="#6b513a" rough={0.5} />
      </RoundedBox>
      {[[-1.2, -0.35], [0.4, -0.35], [-1.2, 0.35], [0.4, 0.35]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.18, z]} castShadow>
          <boxGeometry args={[0.06, 0.36, 0.06]} />
          <HMat color="#9aa3ab" metal={0.6} rough={0.3} coat={0} />
        </mesh>
      ))}
      {[P.teal, mixHex(P.paper, P.inkSoft, 0.4), P.surface].map((c, i) => (
        <mesh key={i} position={[-0.7 + i * 0.03, 0.46 + i * 0.03, i * 0.02]} rotation={[0, 0.08 * i, 0]} castShadow>
          <boxGeometry args={[0.7, 0.025, 0.5]} />
          <HMat color={c} rough={0.6} coat={0.1} />
        </mesh>
      ))}
      <RoundedBox args={[0.55, 0.5, 0.5]} position={[1.25, 0.25, 0.1]} radius={0.05} smoothness={3} castShadow>
        <HMat color={mixHex(P.paper, P.amber, 0.35)} rough={0.45} coat={0.5} />
      </RoundedBox>
    </group>
  );
}

function House({ op, where, weights }: { op: Op; where: Where; weights: number[] }) {
  const cells = useMemo(() => weightCells(weights, where === "disk" ? 0 : 4.6, FY.model + 0.08, 0.05), [weights, where]);
  const wallMat = <HMat color={mixHex(P.paper, P.inkSoft, 0.08)} rough={0.6} coat={0.1} opacity={0.55} />;
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0.8, -1.4, 0.2]} scale={9} opacity={0.12} />
        <RoundedBox args={[5.0, 0.24, 2.9]} position={[0, -1.18, 0]} radius={0.1} smoothness={3} castShadow receiveShadow>
          <HMat color="#3a3f44" rough={0.6} coat={0.2} />
        </RoundedBox>
        <Slabfloor y={FY.model} color={mixHex(P.paper, P.violet, 0.12)} />
        <Slabfloor y={FY.harness} color={mixHex(P.paper, P.amber, 0.14)} />
        <Slabfloor y={FY.product} color={mixHex(P.paper, P.teal, 0.12)} />
        <Slabfloor y={FY.product + FLOOR_H} color="#50565c" />
        <mesh position={[0, FY.model + 1.5 * FLOOR_H, -HOUSE.d / 2]}>
          <boxGeometry args={[HOUSE.w, 3 * FLOOR_H, 0.06]} />
          {wallMat}
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[(sx * HOUSE.w) / 2, FY.model + 1.5 * FLOOR_H, 0]}>
            <boxGeometry args={[0.06, 3 * FLOOR_H, HOUSE.d]} />
            {wallMat}
          </mesh>
        ))}
        <ChatScreen />
        <HarnessDesk />
        {where === "api" ? (
          <group>
            <RoundedBox args={[2.3, 0.3, 2.1]} position={[4.6, -1.13, 0.05]} radius={0.1} smoothness={3} castShadow receiveShadow>
              <HMat color="#45403a" rough={0.6} coat={0.2} />
            </RoundedBox>
            <Tag position={[4.6, 0.1, 0.05]} tone="violet" center>API · por token</Tag>
            <Flow points={[[1.8, FY.harness + 0.3, 0.2], [3.0, FY.harness + 0.8, 0.3], [4.2, FY.model + 0.6, 0.2]]} color={P.violet} count={3} speed={0.4} size={0.045} lineOpacity={0.45} />
          </group>
        ) : null}
        <Lattice cells={cells} size={1} />
        {op === "chat" ? (
          <>
            <Flow points={[[0.9, FY.product + 0.5, 0.6], [1.1, FY.harness + 0.5, 0.7], [where === "disk" ? 0.6 : 1.6, FY.model + 0.55, 0.7]]} color={P.teal} count={3} speed={0.45} size={0.05} lineOpacity={0.4} />
            <Flow points={[[where === "disk" ? -0.6 : 1.4, FY.model + 0.55, 0.8], [-1.1, FY.harness + 0.5, 0.8], [-0.9, FY.product + 0.5, 0.6]]} color={P.violet} count={3} speed={0.45} size={0.05} lineOpacity={0.4} />
          </>
        ) : null}
        {op === "train" ? (
          <group>
            <RoundedBox args={[1.0, 0.7, 1.0]} position={[-3.3, -0.72, 1.6]} radius={0.06} smoothness={3} castShadow>
              <HMat color={mixHex(P.paper, P.rose, 0.3)} rough={0.45} coat={0.5} />
            </RoundedBox>
            <Tag position={[-3.3, -0.12, 1.6]} tone="rose" size="xs" center>datos + GPU</Tag>
            <Flow points={[[-2.8, -0.6, 1.5], [-1.6, -0.55, 1.2], [where === "disk" ? -0.4 : 3.8, FY.model + 0.4, 0.6]]} color={P.rose} count={3} speed={0.45} size={0.05} lineOpacity={0.4} />
          </group>
        ) : null}
        <Tag position={[-HOUSE.w / 2 - 0.55, FY.product + 0.45, HOUSE.d / 2]} tone="teal" center>producto</Tag>
        <Tag position={[-HOUSE.w / 2 - 0.45, FY.harness + 0.45, HOUSE.d / 2]} tone="amber" center>arnés</Tag>
        <Tag position={[-HOUSE.w / 2 - 0.5, FY.model + 0.45, HOUSE.d / 2]} tone="violet" center>modelo</Tag>
        {where === "api" ? <Tag position={[0, FY.model + 0.45, 0.4]} tone="muted" size="xs" center>planta vacía</Tag> : null}
      </group>
    </PointerTilt>
  );
}

const OP_TEXT: Record<Op, string> = {
  chat: "Chatear es inferencia: la petición baja del producto al arnés, que arma el prompt y llama al modelo; la respuesta sube. Los pesos no se mueven: la huella es la misma antes y después.",
  train: "Entrenar cambia números. Cada paso aplica w ← w − η·g sobre los 64 pesos y la huella del archivo cambia. Producto y arnés no se enteran.",
  swap: "Cambiar de modelo es cambiar de archivo. La planta del producto sigue idéntica: la misma pantalla puede ocultar otro modelo.",
};

function SpanishVisual() {
  const [op, setOp] = useState<Op>("chat");
  const [where, setWhere] = useState<Where>("disk");
  const [steps, setSteps] = useState(1);
  const weights = useMemo(() => weightsFor(op, steps), [op, steps]);
  const before = fingerprint(baseWeights(3));
  const now = fingerprint(weights);
  const changed = weights.filter((v, i) => v !== baseWeights(3)[i]).length;
  return (
    <Figure
      label="Casa seccionada · producto, arnés y modelo"
      hint="tres plantas; solo entrenar toca los números"
      legend={[{ color: P.teal, label: "producto / peso positivo" }, { color: P.amber, label: "arnés / peso negativo" }, { color: P.violet, label: "modelo / respuesta" }, { color: P.rose, label: "entrenamiento" }]}
      note={
        <div className="space-y-2">
          <p><strong>{op === "chat" ? "Chatear" : op === "train" ? "Entrenar" : "Cambiar de modelo"}.</strong> {OP_TEXT[op]} {where === "api" ? "Aquí el archivo no está en tu edificio: lo alquilas por token y el proveedor puede cambiarlo detrás del mismo nombre." : "Aquí el archivo está en tu disco: lo controlas, y pagas en VRAM, electricidad y tiempo."}</p>
          <Readout items={[
            { label: "huella inicial", value: before, tone: "var(--muted)" },
            { label: "huella ahora", value: now, tone: now === before ? "var(--teal)" : "var(--rose)" },
            { label: "pesos distintos", value: `${changed} / ${N * N}`, tone: changed ? "var(--rose)" : "var(--teal)" },
            { label: "planta del producto", value: "sin cambios", tone: "var(--ink)" },
          ]} />
          <p className="text-xs text-muted">Modelo didáctico: 64 pesos deterministas, gradiente fijo y η = {ETA}. La huella es un FNV-1a sobre los pesos redondeados, como sustituto de la suma de verificación de un archivo real de miles de millones de parámetros.</p>
        </div>
      }
      controls={
        <>
          <Switcher value={op} onChange={setOp} options={[{ value: "chat", label: "Chatear", tone: P.teal }, { value: "train", label: "Entrenar", tone: P.rose }, { value: "swap", label: "Cambiar modelo", tone: P.violet }]} ariaLabel="Operación" />
          {op === "train" ? <Knob label="pasos" min={1} max={5} value={steps} onChange={setSteps} tone={P.rose} /> : null}
          <Switcher value={where} onChange={setWhere} options={[{ value: "disk", label: "En disco", tone: P.inkSoft }, { value: "api", label: "API por token", tone: P.violet }]} ariaLabel="Dónde vive el archivo" />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.4, 3.2, 10.5], fov: 34 }} fit={1.06}>
        <House op={op} where={where} weights={weights} />
      </Stage>
    </Figure>
  );
}

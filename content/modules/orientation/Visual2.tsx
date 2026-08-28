"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

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

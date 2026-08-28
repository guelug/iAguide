"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
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
  },
};

export default function Visual2() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("layers");
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
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
        <Motes count={90} radius={7} opacity={0.28} />
        <PointerTilt amount={0.07}>
          {mode === "layers" && (
            <>
              {[
                [t.product, P.teal, "teal", -1.8, 1.15],
                [t.harness, P.violet, "violet", 0, 0.85],
                [t.model, P.amber, "amber", 1.8, 0.55],
              ].map(([label, color, tone, x, h], i) => (
                <group key={label as string}>
                  <Slab position={[x as number, -0.35 + (h as number) / 2, 0]} size={[1.5, h as number, 0.12]} color={color as string} fill={0.24} />
                  <Tag position={[x as number, 0.8, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">
                    {label as string}
                  </Tag>
                </group>
              ))}
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                {t.product} → {t.harness} → {t.model}
              </Tag>
            </>
          )}
          {mode === "train" && (
            <>
              <Slab position={[-1.7, 0.15, 0]} size={[1.6, 1.05, 0.12]} color={P.rose} fill={0.22} />
              <Tag position={[-1.7, 0.8, 0.15]} tone="rose" size="xs">
                {t.lora}
              </Tag>
              <Ribbon points={[[-0.8, 0.15, 0], [0.8, 0.15, 0]]} color={P.violet} radius={0.045} opacity={0.8} />
              <Slab position={[1.7, 0.15, 0]} size={[1.6, 1.05, 0.12]} color={P.teal} fill={0.22} />
              <Tag position={[1.7, 0.8, 0.15]} tone="teal" size="xs">
                {t.chat}
              </Tag>
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                {t.lora} cambia números · {t.chat} no
              </Tag>
            </>
          )}
          {mode === "api" && (
            <>
              <Node3D position={[-1.7, 0.15, 0]} color={P.teal} radius={0.22} pulse={0.3} />
              <Tag position={[-1.7, 0.8, 0.15]} tone="teal" size="xs">
                {t.disk}
              </Tag>
              <Flow points={[[-0.85, 0.15, 0], [0.85, 0.15, 0]]} color={P.amber} count={5} />
              <Halo position={[1.7, 0.15, 0]} radius={0.55} color={P.amber} opacity={0.4} spin={0.14} />
              <Node3D position={[1.7, 0.15, 0]} color={P.amber} radius={0.18} />
              <Tag position={[1.7, 0.8, 0.15]} tone="amber" size="xs">
                {t.rent}
              </Tag>
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                {t.weights} en casa o alquilados
              </Tag>
            </>
          )}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

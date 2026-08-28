"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "foundations" | "harness" | "training" | "metal";
const COPY = {
  en: {
    title: "four tracks",
    hint: "foundations · harness · training · metal",
    foundations: "foundations",
    harness: "harness",
    training: "training",
    metal: "metal",
    here: "start here",
  },
  es: {
    title: "cuatro vías",
    hint: "fundamentos · arnés · entrenamiento · metal",
    foundations: "fundamentos",
    harness: "arnés",
    training: "entrenamiento",
    metal: "metal",
    here: "empieza aquí",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("foundations");
  const tracks: { id: Mode; color: string; x: number; tone: "teal" | "violet" | "amber" | "rose" }[] = [
    { id: "foundations", color: P.teal, x: -2.25, tone: "teal" },
    { id: "harness", color: P.violet, x: -0.75, tone: "violet" },
    { id: "training", color: P.amber, x: 0.75, tone: "amber" },
    { id: "metal", color: P.rose, x: 2.25, tone: "rose" },
  ];
  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={tracks.map((tr) => ({ color: tr.color, label: t[tr.id] }))}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={tracks.map((tr) => ({ value: tr.id, label: t[tr.id], tone: tr.color }))}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.35, 8.6], fov: 37 }}>
        <Motes count={90} radius={7} opacity={0.28} />
        <PointerTilt amount={0.07}>
          {tracks.map((tr) => {
            const on = mode === tr.id;
            return (
              <group key={tr.id}>
                <Slab position={[tr.x, 0.05, 0]} size={[1.35, on ? 1.35 : 0.95, 0.12]} color={tr.color} fill={on ? 0.32 : 0.12} />
                <Tag position={[tr.x, 0.82, 0.15]} tone={tr.tone} size="xs">
                  {t[tr.id]}
                </Tag>
                {on ? <Halo position={[tr.x, 0.05, 0]} radius={0.95} color={tr.color} opacity={0.35} spin={0.1} /> : null}
              </group>
            );
          })}
          <Flow points={[[-1.55, 0.05, 0], [-1.45, 0.05, 0]]} color={P.teal} count={2} />
          <Flow points={[[-0.05, 0.05, 0], [0.05, 0.05, 0]]} color={P.violet} count={2} />
          <Flow points={[[1.45, 0.05, 0], [1.55, 0.05, 0]]} color={P.amber} count={2} />
          {mode === "foundations" ? (
            <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
              {t.here}
            </Tag>
          ) : null}
          <Ribbon points={[[-2.9, -1.15, 0], [2.9, -1.15, 0]]} color={P.lineStrong} radius={0.02} opacity={0.25} />
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

"use client";
import { useMemo, useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "token" | "next" | "invent";
const COPY = {
  en: {
    title: "the model only ever continues",
    hint: "pieces · next token · fluent guess",
    token: "token",
    next: "next",
    invent: "invents",
    word: "word",
    piece: "piece",
    eos: "EOS",
    fact: "no row",
    fluent: "fluent",
  },
  es: {
    title: "el modelo solo continúa",
    hint: "piezas · siguiente · conjetura fluida",
    token: "token",
    next: "siguiente",
    invent: "inventa",
    word: "palabra",
    piece: "pieza",
    eos: "EOS",
    fact: "sin fila",
    fluent: "fluido",
  },
};

export default function Visual3() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("token");
  const cells = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        position: [-2.1 + (i % 6) * 0.42, 0.35 - Math.floor(i / 6) * 0.45, 0] as [number, number, number],
        color: i % 3 === 0 ? P.teal : i % 3 === 1 ? P.violet : P.amber,
        scale: 0.85 + (i % 4) * 0.08,
      })),
    [],
  );
  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.piece },
        { color: P.violet, label: t.next },
        { color: P.rose, label: t.invent },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "token", label: t.token, tone: P.teal },
            { value: "next", label: t.next, tone: P.violet },
            { value: "invent", label: t.invent, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
        <Motes count={90} radius={7} opacity={0.28} />
        <PointerTilt amount={0.07}>
          {mode === "token" && (
            <>
              <Lattice cells={cells} size={0.16} opacity={0.95} matte />
              <Tag position={[0, 0.82, 0.15]} tone="teal" size="xs">
                {t.word} ≠ {t.piece}
              </Tag>
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                cuenta tokens, no caracteres
              </Tag>
            </>
          )}
          {mode === "next" && (
            <>
              {[-1.8, -0.6, 0.6].map((x, i) => (
                <Node3D key={x} position={[x, 0.1, 0]} color={P.violet} radius={0.16} pulse={0.2 + i * 0.25} />
              ))}
              <Flow points={[[-1.35, 0.1, 0], [-1.05, 0.1, 0]]} color={P.violet} count={3} />
              <Flow points={[[-0.15, 0.1, 0], [0.15, 0.1, 0]]} color={P.violet} count={3} />
              <Halo position={[1.8, 0.1, 0]} radius={0.42} color={P.amber} opacity={0.45} spin={0.16} />
              <Node3D position={[1.8, 0.1, 0]} color={P.amber} radius={0.2} pulse={0.5} />
              <Tag position={[1.8, 0.8, 0.15]} tone="amber" size="xs">
                {t.eos}
              </Tag>
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                elige · añade · repite
              </Tag>
            </>
          )}
          {mode === "invent" && (
            <>
              <Node3D position={[-1.7, 0.15, 0]} color={P.teal} radius={0.2} matte />
              <Tag position={[-1.7, 0.8, 0.15]} tone="teal" size="xs">
                {t.fact}
              </Tag>
              <Ribbon points={[[-0.85, 0.15, 0], [0.85, 0.15, 0]]} color={P.rose} radius={0.05} opacity={0.85} />
              <Node3D position={[1.7, 0.15, 0]} color={P.rose} radius={0.22} pulse={0.4} />
              <Tag position={[1.7, 0.8, 0.15]} tone="rose" size="xs">
                {t.fluent}
              </Tag>
              <Tag position={[0, -0.92, 0.15]} tone="muted" size="xs">
                suena bien ≠ es cierto
              </Tag>
            </>
          )}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

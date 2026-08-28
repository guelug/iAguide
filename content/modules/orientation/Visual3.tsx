"use client";
import { useState } from "react";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
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
    tokenNote: "count tokens, not characters",
    nextNote: "pick · append · repeat",
    inventNote: "sounds right ≠ is true",
    candidates: "candidates",
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
    tokenNote: "cuenta tokens, no caracteres",
    nextNote: "elige · añade · repite",
    inventNote: "suena bien ≠ es cierto",
    candidates: "candidatos",
  },
};

/* A word slab splits into uneven token chips: width is the message. */
function TokenScene({ t }: { t: (typeof COPY)["es"] }) {
  const chips: { w: number; x: number; color: string }[] = [
    { w: 0.9, x: -1.6, color: P.teal },
    { w: 0.55, x: -0.85, color: P.tealDeep },
    { w: 1.1, x: 0.0, color: P.violet },
    { w: 0.4, x: 0.78, color: P.amber },
    { w: 0.72, x: 1.42, color: P.teal },
  ];
  return (
    <>
      <Slab position={[-1.6, 0.55, -0.35]} size={[2.6, 0.5, 0.1]} color={P.inkSoft} fill={0.1} rim={0.5} />
      <Tag position={[-1.6, 0.98, -0.3]} tone="muted" size="xs" center>
        {t.word}
      </Tag>
      <Flow points={[[-0.9, 0.42, -0.3], [-0.4, 0.16, -0.1], [0, 0, 0]]} color={P.inkSoft} count={3} size={0.035} lineOpacity={0.3} />
      {chips.map((chip, i) => (
        <group key={i} position={[chip.x, -0.18, 0.15]}>
          <RoundedBox args={[chip.w, 0.42, 0.24]} radius={0.07} smoothness={4}>
            <meshStandardMaterial color={chip.color} roughness={0.38} metalness={0.04} />
          </RoundedBox>
        </group>
      ))}
      <Tag position={[0.1, 0.42, 0.3]} tone="teal" size="xs" center>
        {t.piece} × 5
      </Tag>
    </>
  );
}

/* The stream so far, then a fan of candidates — one gets picked. */
function NextScene({ t }: { t: (typeof COPY)["es"] }) {
  const past = [-2.2, -1.45, -0.7];
  const fan: { y: number; p: number; color: string; hot: boolean }[] = [
    { y: 0.42, p: 0.62, color: P.amber, hot: true },
    { y: 0.05, p: 0.28, color: P.violet, hot: false },
    { y: -0.32, p: 0.1, color: P.violet, hot: false },
  ];
  return (
    <>
      {past.map((x, i) => (
        <Node3D key={x} position={[x, 0.05, 0]} color={P.teal} radius={0.15} pulse={0.2 + i * 0.25} />
      ))}
      <Flow points={[[past[0], 0.05, 0], [past[2], 0.05, 0]]} color={P.teal} count={4} speed={0.24} />
      {fan.map((f, i) => (
        <group key={i}>
          <Wire points={[[-0.35, 0.05, 0], [0.9, f.y, 0]]} color={f.color} opacity={f.hot ? 0.85 : 0.3} width={f.hot ? 1.8 : 1.1} dashed={!f.hot} />
          <Node3D position={[1.35, f.y, 0]} color={f.color} radius={f.hot ? 0.19 : 0.12} pulse={f.hot ? 0.4 : 0} />
          <Ribbon points={[[1.75, f.y, 0], [1.75 + f.p * 1.1, f.y, 0]]} color={f.color} radius={0.028} opacity={f.hot ? 0.9 : 0.4} />
        </group>
      ))}
      <Tag position={[1.35, 0.82, 0.15]} tone="amber" size="xs" center>
        {t.candidates}
      </Tag>
      <Halo position={[2.6, 0.05, 0]} radius={0.34} color={P.rose} opacity={0.5} spin={0.18} />
      <Tag position={[2.6, -0.45, 0.15]} tone="rose" size="xs" center>
        {t.eos}
      </Tag>
    </>
  );
}

/* A question looks for its row, finds an empty slot, answers fluently anyway. */
function InventScene({ t }: { t: (typeof COPY)["es"] }) {
  const rows = [-0.36, -0.12, 0.12, 0.36];
  return (
    <>
      <Node3D position={[-2.15, 0.15, 0]} color={P.teal} radius={0.18} pulse={0.3} />
      <Flow points={[[-1.85, 0.15, 0], [-1.15, 0.15, 0]]} color={P.teal} count={3} />
      <group position={[-0.35, 0.1, 0]}>
        <Slab position={[0, 0, 0]} size={[1.3, 1.15, 0.12]} color={P.violet} fill={0.14} />
        {rows.map((y, i) => (
          <Ribbon key={y} points={[[-0.45, y, 0.09], [0.45, y, 0.09]]} color={i === 2 ? P.rose : P.violet} radius={i === 2 ? 0.014 : 0.03} opacity={i === 2 ? 0.9 : 0.75} />
        ))}
        <Tag position={[0, 0.82, 0.15]} tone="rose" size="xs" center>
          {t.fact}
        </Tag>
      </group>
      <Flow points={[[0.45, 0.15, 0], [1.15, 0.15, 0]]} color={P.rose} count={3} />
      <group position={[1.85, 0.15, 0]}>
        <Ribbon points={[[-0.5, -0.18, 0.1], [-0.2, 0.08, 0.1], [0.15, -0.05, 0.1], [0.5, 0.14, 0.1]]} color={P.rose} radius={0.045} opacity={0.9} />
        <Halo position={[0, 0, 0]} radius={0.55} color={P.rose} opacity={0.3} spin={-0.14} />
        <Tag position={[0, 0.82, 0.15]} tone="rose" size="xs" center>
          {t.fluent}
        </Tag>
      </group>
    </>
  );
}

export default function Visual3() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("token");
  const note = mode === "token" ? t.tokenNote : mode === "next" ? t.nextNote : t.inventNote;
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
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }} background={P.paper}>
        <Motes count={110} radius={7} color={P.lineStrong} size={0.024} opacity={0.22} />
        <PointerTilt amount={0.08}>
          {mode === "token" && <TokenScene t={t} />}
          {mode === "next" && <NextScene t={t} />}
          {mode === "invent" && <InventScene t={t} />}
          <ContactShadows position={[0, -1.05, 0]} opacity={0.15} scale={7} blur={3} far={2.4} color={P.ink} />
          <Tag position={[0, -0.95, 0.15]} tone="muted" size="xs" center>
            {note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

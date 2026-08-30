"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * What the cross-stage cache actually saves.
 *
 * The section states an exact total and an order for the peak, so the
 * scene computes the first and labels the second rather than inventing a
 * formula the paper does not give. The picture carries the reason: blocks
 * a rank received in virtual stage 1 are still in its memory when stage 2
 * starts, so what crosses the wire is an increment, not the history.
 */

type Mode = "cached" | "naive";

const COPY = {
  en: {
    title: "the increment, not the history",
    hint: "turn P and V · the bundles are what crosses the wire",
    cached: "cached",
    naive: "resend everything",
    legendHeld: "already in memory",
    legendSent: "sent this transition",
    legendPeak: "peak per transition",
    rank: "rank",
    stage: "virtual stage",
    total: "total comm",
    peak: "peak per transition",
    factor: "improvement",
    order: "order",
    formula: "P(P−1)/2 · Np·d + (V−1) · P²Np·d",
    units: "blocks · d",
    cachedNote:
      "the first virtual stage has no cache and accumulates the usual triangular sum over P physical hops. From the second onwards, a receiver ships only the blocks produced since it last saw its counterpart — about P·Np new ones, not the whole history. Backward reuses the same cache; there is no second protocol.",
    naiveNote:
      "without the cache every virtual stage re-sends what the receiving rank is already holding. The peak cost of a single transition grows with both P and V, and that peak is the thing that stops the traffic hiding behind 1F1B compute.",
  },
  es: {
    title: "el incremento, no el historial",
    hint: "gira P y V · los haces son lo que cruza el cable",
    cached: "con caché",
    naive: "reenviar todo",
    legendHeld: "ya está en memoria",
    legendSent: "enviado en esta transición",
    legendPeak: "pico por transición",
    rank: "rank",
    stage: "etapa virtual",
    total: "comunicación total",
    peak: "pico por transición",
    factor: "mejora",
    order: "orden",
    formula: "P(P−1)/2 · Np·d + (V−1) · P²Np·d",
    units: "bloques · d",
    cachedNote:
      "la primera etapa virtual no tiene caché y acumula la suma triangular de siempre sobre P saltos físicos. Desde la segunda, un receptor envía solo los bloques producidos desde que vio por última vez a su homólogo — unos P·Np nuevos, no el historial entero. El backward reusa la misma caché; no hay un segundo protocolo.",
    naiveNote:
      "sin caché, cada etapa virtual reenvía lo que el rank receptor ya tiene guardado. El coste pico de una sola transición crece con P y con V, y ese pico es lo que impide que el tráfico se esconda detrás del cómputo 1F1B.",
  },
};

/** A bundle of blocks crossing between two ranks. Thickness is cost. */
function Bundle({
  from,
  to,
  weight,
  color,
  moving,
}: {
  from: V3;
  to: V3;
  weight: number;
  color: string;
  moving: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || !moving) return;
    const t = (clock.elapsedTime * 0.45) % 1;
    g.position.x = MathUtils.lerp(from[0], to[0], t);
    g.position.y = MathUtils.lerp(from[1], to[1], t);
    g.position.z = MathUtils.lerp(from[2], to[2], t);
  });
  const h = Math.max(0.06, Math.min(0.6, weight * 0.1));
  return (
    <group>
      <AxisLine from={from} to={to} overrun={0} color={color} opacity={0.35} dashed={false} />
      <group ref={ref} position={from}>
        <RoundedBox args={[0.3, h, 0.3]} radius={0.03} smoothness={2} castShadow>
          <meshStandardMaterial color={color} roughness={0.34} metalness={0.06} envMapIntensity={0.9} />
        </RoundedBox>
      </group>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("cached");
  const [ranks, setRanks] = useState(4);
  const [stages, setStages] = useState(3);

  /* The exact total the section gives, in units of Np·d. */
  const totalCached =
    (ranks * (ranks - 1)) / 2 + (stages - 1) * ranks * ranks;

  /* The peak is given as an order, so it is reported as one: O(P) with
     the cache, O(P·V) without, a factor of V either way. */
  const peakCached = ranks;
  const peakNaive = ranks * stages;
  const cached = mode === "cached";

  const note = cached ? t.cachedNote : t.naiveNote;
  const accent = cached ? P.teal : P.rose;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.line, label: t.legendHeld },
        { color: P.teal, label: t.legendSent },
        { color: P.rose, label: t.legendPeak },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "cached", label: t.cached, tone: P.teal },
              { value: "naive", label: t.naive, tone: P.rose },
            ]}
            ariaLabel={t.title}
          />
          <Knob label="P" value={ranks} min={2} max={6} step={1} onChange={setRanks} tone={P.teal} />
          <Knob label="V" value={stages} min={1} max={5} step={1} onChange={setStages} tone={P.violet} />
        </>
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                { label: t.total, value: `${totalCached} ${t.units}`, tone: "var(--teal)" },
                {
                  label: t.peak,
                  value: cached ? `O(P) ≈ ${peakCached}` : `O(P·V) ≈ ${peakNaive}`,
                  tone: cached ? "var(--teal)" : "var(--rose)",
                },
                { label: t.factor, value: `×${stages}`, tone: "var(--violet)" },
                { label: "", value: t.formula, tone: "var(--muted)" },
              ]}
            />
          </div>
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={14} depth={11} y={-0.05} />

        {/* Physical ranks along Z, virtual stages along X. */}
        {Array.from({ length: ranks }, (_, r) => (
          <group key={r} position={[0, 0, -2.6 + r * (5.2 / Math.max(1, ranks - 1))]}>
            <RoundedBox args={[9, 0.12, 0.7]} radius={0.04} smoothness={3} position={[0, 0.06, 0]} receiveShadow>
              <meshStandardMaterial color={P.sunken} roughness={0.5} />
            </RoundedBox>
            <Tag position={[-5.1, 0.15, 0]} tone="muted" size="xs" center>
              {t.rank} {r}
            </Tag>
          </group>
        ))}

        {Array.from({ length: stages }, (_, v) => {
          const x = -3.6 + v * (7.2 / Math.max(1, stages));
          return (
            <group key={v}>
              <AxisLine from={[x, 0.1, -3.4]} to={[x, 0.1, 3.4]} overrun={0.2} color={P.line} opacity={0.4} />
              <Tag position={[x, 0.3, -3.7]} tone={v === 0 ? "ink" : "violet"} size="xs" center>
                v{v + 1}
              </Tag>
            </group>
          );
        })}

        {/* What each rank is already holding after the first stage. */}
        {Array.from({ length: ranks }, (_, r) => {
          const z = -2.6 + r * (5.2 / Math.max(1, ranks - 1));
          const held = cached ? r : 0;
          return Array.from({ length: held }, (_, k) => (
            <Node3D
              key={`${r}-${k}`}
              position={[-4.4 + k * 0.24, 0.24, z]}
              color={P.line}
              radius={0.09}
              matte
            />
          ));
        })}

        {/* The bundles crossing between stages: thin when cached, thick
            when the whole history is resent. */}
        {Array.from({ length: Math.max(0, stages - 1) }, (_, v) => {
          const x0 = -3.6 + v * (7.2 / Math.max(1, stages));
          const x1 = -3.6 + (v + 1) * (7.2 / Math.max(1, stages));
          return Array.from({ length: ranks }, (_, r) => {
            const z = -2.6 + r * (5.2 / Math.max(1, ranks - 1));
            const weight = cached ? ranks : ranks * (v + 2);
            return (
              <Bundle
                key={`${v}-${r}`}
                from={[x0, 0.4, z]}
                to={[x1, 0.4, z]}
                weight={weight}
                color={cached ? P.teal : P.rose}
                moving
              />
            );
          });
        })}

        {/* The peak, as the tallest thing on the plate. */}
        <group position={[4.9, 0, 0]}>
          <RoundedBox
            args={[0.7, Math.max(0.2, (cached ? peakCached : peakNaive) * 0.12), 0.7]}
            radius={0.05}
            smoothness={3}
            position={[0, Math.max(0.1, (cached ? peakCached : peakNaive) * 0.06), 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={accent} roughness={0.36} metalness={0.05} envMapIntensity={0.9} />
          </RoundedBox>
          <Tag
            position={[0, Math.max(0.3, (cached ? peakCached : peakNaive) * 0.12) + 0.35, 0]}
            tone={cached ? "teal" : "rose"}
            size="xs"
            center
          >
            {cached ? "O(P)" : "O(P·V)"}
          </Tag>
          {!cached ? <Halo position={[0, 0.1, 0]} radius={0.8} color={P.rose} opacity={0.6} spin={0.4} /> : null}
        </group>

        <IsoDust count={20} center={[0, 1.1, 0]} spread={[4, 0.6, 2.6]} />
      </Stage>
    </Figure>
  );
}

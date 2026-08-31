"use client";

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
 * hello-ok is a photograph taken at connect time. The daemon keeps
 * writing; the plate does not. Reconnect to take another photograph.
 * Discovery is a short conservative list, not the live method rack.
 */

type Mode = "snap" | "reconnect" | "discover";

const COPY = {
  en: {
    title: "hello-ok is a snapshot",
    hint: "photograph at connect · not a live config feed",
    snap: "snapshot",
    reconnect: "reconnect",
    discover: "discovery",
    legendLive: "live daemon",
    legendSnap: "hello-ok plate",
    legendSkip: "not in discovery",
    live: "daemon",
    plate: "hello-ok",
    methods: "discovery",
    rack: "live methods",
    notes: {
      snap: "hello-ok copies protocol, connId, policy and scopes at handshake. The daemon keeps moving; the plate does not.",
      reconnect: "Attachment ceilings and plugin surfaces expire. Re-read the plate on every connect — it is a new photograph, not a subscription.",
      discover: "features.methods is a conservative list. Some real methods are kept off discovery on purpose; treat it as feature detection, not a dump.",
    },
  },
  es: {
    title: "hello-ok es un snapshot",
    hint: "fotografía al conectar · no es config viva",
    snap: "snapshot",
    reconnect: "reconectar",
    discover: "discovery",
    legendLive: "daemon vivo",
    legendSnap: "placa hello-ok",
    legendSkip: "fuera del discovery",
    live: "daemon",
    plate: "hello-ok",
    methods: "discovery",
    rack: "métodos vivos",
    notes: {
      snap: "hello-ok copia protocolo, connId, policy y scopes en el handshake. El daemon sigue escribiendo; la placa no.",
      reconnect: "Los techos de attachment y las superficies de plugin caducan. Relean la placa en cada connect: es una foto nueva, no una suscripción.",
      discover: "features.methods es una lista conservadora. Algunos métodos reales se excluyen a propósito; es detección de features, no un dump.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];
const LIVE: V3 = [2.05, 0, 1.15];
const SNAP: V3 = [-2.55, 0, -0.85];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("snap");
  const snapOn = mode === "snap" || mode === "reconnect";
  const discOn = mode === "discover";
  const reconnect = mode === "reconnect";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendLive },
        { color: P.amber, label: t.legendSnap },
        { color: P.rose, label: t.legendSkip },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "snap", label: t.snap, tone: P.amber },
            { value: "reconnect", label: t.reconnect, tone: P.teal },
            { value: "discover", label: t.discover, tone: P.violet },
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
        <IsoFrame width={13.2} depth={11.6} y={-0.04} />
        <PlanTrace
          points={[
            [-5.6, 3.4],
            [-2.6, 3.4],
            [-2.6, -0.4],
          ]}
          y={-0.03}
          color={P.amber}
          opacity={snapOn ? 0.7 : 0.25}
        />
        <PlanTrace
          points={[
            [5.5, 3.6],
            [2.1, 3.6],
            [2.1, 1.2],
          ]}
          y={-0.03}
          color={P.teal}
          opacity={0.55}
        />
        <AxisLine from={[-4.4, 0, 2.4]} to={[4.6, 0, 2.4]} />
        <IsoDust count={48} center={[0, 0.6, 0]} spread={[5.2, 1.1, 3.8]} />

        <GlassPanel
          position={[LIVE[0], 1.45, LIVE[2]]}
          rotation={ISO}
          size={[2.15, 2.4]}
          color={P.teal}
          opacity={0.28}
        />
        {[0, 1, 2, 3].map((i) => (
          <Sheet
            key={i}
            position={[
              LIVE[0] + 0.22 + i * 0.05,
              0.06 + i * 0.08,
              LIVE[2] + 0.16 - i * 0.04,
            ]}
            size={[1.45, 1.02]}
            color={P.tealWash}
            fill={0.85}
            marks={4}
            markColor={P.teal}
          />
        ))}
        <Tag position={[LIVE[0] + 0.15, 2.85, LIVE[2] + 0.2]} tone="teal">
          {t.live}
        </Tag>

        <GlassPanel
          position={[SNAP[0], 1.35, SNAP[2]]}
          rotation={ISO}
          size={[2.35, 2.2]}
          color={P.amber}
          opacity={snapOn ? 0.3 : 0.08}
        />
        {[0, 1, 2].map((i) => (
          <Sheet
            key={i}
            position={[
              SNAP[0] + 0.18 + i * 0.06,
              0.72 + i * 0.07,
              SNAP[2] + 0.08 - i * 0.05,
            ]}
            size={[1.55, 1.05]}
            color={P.amberWash}
            fill={snapOn ? (reconnect && i === 2 ? 0.95 : 0.4) : 0.12}
            marks={3}
            markColor={reconnect && i === 2 ? P.teal : P.amber}
          />
        ))}
        <Tag position={[SNAP[0], 2.7, SNAP[2]]} tone="amber">
          {t.plate}
        </Tag>

        <Duct
          from={[LIVE[0] - 0.9, 0.35, LIVE[2] - 0.2]}
          to={[SNAP[0] + 1.05, 0.85, SNAP[2] + 0.15]}
          color={snapOn ? P.amber : P.line}
          radius={0.11}
          bend={0.55}
        />
        <Flow
          points={[
            [LIVE[0] - 0.7, 0.42, LIVE[2] - 0.1],
            [SNAP[0] + 0.9, 0.9, SNAP[2] + 0.1],
          ]}
          color={P.amber}
          count={3} paused={!snapOn}
        />

        {discOn
          ? Array.from({ length: 7 }, (_, i) => {
              const skipped = i === 4 || i === 6;
              return (
                <Sheet
                  key={i}
                  position={[3.55 + (i % 4) * 0.42, 0.05, -1.85 - Math.floor(i / 4) * 0.7]}
                  size={[0.55, 0.72]}
                  color={skipped ? P.roseWash : P.violetWash}
                  fill={skipped ? 0.22 : 0.8}
                  marks={skipped ? 0 : 2}
                  markColor={skipped ? P.rose : P.violet}
                />
              );
            })
          : null}
        {discOn ? (
          <>
            <Tag position={[3.9, 1.55, -1.55]} tone="violet" size="xs">
              {t.methods}
            </Tag>
            <Tag position={[4.55, 0.15, -2.85]} tone="rose" size="xs">
              {t.rack}
            </Tag>
          </>
        ) : null}
      </Stage>
    </Figure>
  );
}

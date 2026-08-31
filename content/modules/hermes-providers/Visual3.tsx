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
 * Credential pools versus fallback.
 *
 * Inner ring: several keys for the SAME provider. A 429 rotates to the
 * next healthy key. Outer ring: a different provider, only after the
 * pool is exhausted. Rotation resets the prompt cache.
 */

type Mode = "pool" | "fallback" | "cache";

const COPY = {
  en: {
    title: "same provider, next key",
    hint: "pool first · fallback later · rotation resets the cache",
    pool: "pool",
    fallback: "fallback",
    cache: "cache reset",
    legendKeys: "keys of one provider",
    legendNext: "next provider",
    legendCache: "prompt cache",
    provider: "provider",
    other: "fallback provider",
    cachePlate: "prompt cache",
    notes: {
      pool: "Several API keys or OAuth tokens for the same provider. On 429 Hermes retries once, then rotates. On 402 it rotates immediately. This is not fallback — the model host does not change.",
      fallback:
        "When every key in the pool is exhausted, then the fallback chain runs: a different provider-plus-model. Subagents inherit the live provider, not the leftover fallback list.",
      cache:
        "Key rotation resets the prompt cache. Provider-side caches are bound to the account that made the request. The next call rereads the whole history at undiscounted input price.",
    },
  },
  es: {
    title: "mismo proveedor, siguiente clave",
    hint: "pool primero · fallback después · la rotación resetea la caché",
    pool: "pool",
    fallback: "fallback",
    cache: "caché reset",
    legendKeys: "claves de un proveedor",
    legendNext: "otro proveedor",
    legendCache: "prompt caché",
    provider: "proveedor",
    other: "proveedor fallback",
    cachePlate: "prompt caché",
    notes: {
      pool: "Varias claves API o tokens OAuth para el mismo proveedor. Ante 429 Hermes reintenta una vez y luego rota. Ante 402 rota al momento. No es fallback: el host del modelo no cambia.",
      fallback:
        "Cuando se agotan todas las claves del pool, entonces corre la cadena de fallback: otro par proveedor-más-modelo. Los subagentes heredan el proveedor vivo, no la lista de fallback sobrante.",
      cache:
        "La rotación de clave resetea la prompt caché. Las cachés del lado del proveedor están acotadas a la cuenta que hizo la petición. La siguiente llamada relee el historial entero a precio de input sin descuento.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("pool");
  const poolOn = mode === "pool" || mode === "cache";
  const fallOn = mode === "fallback";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.amber, label: t.legendKeys },
        { color: P.violet, label: t.legendNext },
        { color: P.teal, label: t.legendCache },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "pool", label: t.pool, tone: P.amber },
            { value: "fallback", label: t.fallback, tone: P.violet },
            { value: "cache", label: t.cache, tone: P.teal },
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
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={13.2} depth={11.5} y={-0.04} />
        <PlanTrace
          points={[[-5.5, 3.3], [-1.8, 3.3], [-1.8, 0.3]]}
          y={-0.03}
          color={P.amber}
          opacity={poolOn ? 0.7 : 0.3}
        />
        <PlanTrace
          points={[[5.4, 3.4], [2.4, 3.4], [2.4, 0.8]]}
          y={-0.03}
          color={P.violet}
          opacity={fallOn ? 0.7 : 0.22}
        />
        <AxisLine from={[-4.6, 0, 2.2]} to={[4.7, 0, 2.2]} />
        <IsoDust count={44} center={[0, 0.55, 0]} spread={[5.0, 1.0, 3.5]} />

        <GlassPanel
          position={[-2.15, 1.4, 0.85]}
          rotation={ISO}
          size={[3.4, 2.3]}
          color={P.teal}
          opacity={0.18}
        />
        <Tag position={[-2.15, 2.8, 0.85]} tone="teal">
          {t.provider}
        </Tag>
        {[0, 1, 2].map((i) => {
          const active = mode === "pool" ? i === 1 : mode === "cache" ? i === 2 : i === 0;
          const dead = mode !== "pool" && i < 2;
          return (
            <Sheet
              key={i}
              position={[-3.15 + i * 1.05, 0.06, 0.95]}
              size={[0.85, 1.15]}
              color={dead ? P.roseWash : P.amberWash}
              fill={active ? 0.95 : dead ? 0.2 : 0.7}
              marks={dead ? 0 : 4}
              markColor={dead ? P.rose : P.amber}
            />
          );
        })}

        <GlassPanel
          position={[3.05, 1.3, -0.85]}
          rotation={ISO}
          size={[2.35, 2.1]}
          color={P.violet}
          opacity={fallOn ? 0.3 : 0.08}
        />
        <Tag position={[3.05, 2.6, -0.85]} tone="violet">
          {t.other}
        </Tag>
        <Sheet
          position={[3.15, 0.08, -0.75]}
          size={[1.35, 1.05]}
          color={P.violetWash}
          fill={fallOn ? 0.9 : 0.12}
          marks={fallOn ? 4 : 0}
          markColor={P.violet}
        />

        {mode === "cache" ? (
          <>
            <GlassPanel
              position={[2.85, 1.15, 1.65]}
              rotation={ISO}
              size={[2.15, 1.55]}
              color={P.teal}
              opacity={0.12}
            />
            <Tag position={[2.85, 2.15, 1.65]} tone="teal" size="xs">
              {t.cachePlate}
            </Tag>
            <Sheet
              position={[2.95, 0.08, 1.7]}
              size={[1.25, 0.9]}
              color={P.tealWash}
              fill={0.18}
              marks={0}
              markColor={P.teal}
            />
          </>
        ) : null}

        {fallOn ? (
          <>
            <Duct from={[-0.4, 0.25, 0.7]} to={[2.05, 0.4, -0.55]} color={P.violet} radius={0.1} bend={0.5} />
            <Flow
              points={[
                [-0.25, 0.28, 0.65],
                [1.9, 0.42, -0.5],
              ]}
              color={P.violet}
              count={3}
            />
          </>
        ) : (
          <Flow
            points={[
              [-3.1, 0.25, 0.95],
              [-1.05, 0.25, 0.95],
            ]}
            color={P.amber}
            count={3}
          />
        )}
      </Stage>
    </Figure>
  );
}

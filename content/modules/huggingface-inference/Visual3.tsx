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
 * Inference Providers as a router, plus the free-key arithmetic.
 *
 * One HF_TOKEN hits the router. Partners sit behind it. Hugging Face
 * charges partner rates with no surcharge. A $0.10 free credit is a
 * classroom budget, and an agent loop spends many completions per turn.
 */

type Mode = "router" | "bill" | "free";

const COPY = {
  en: {
    title: "the router, the bill, the ten cents",
    hint: "no shards change hands · partner rates · a free key dies in a few agent turns",
    router: "router",
    bill: "pricing",
    free: "free key",
    legendRouter: "HF router",
    legendPartner: "partner backend",
    legendCredit: "monthly credit",
    routerPlate: "router",
    partners: "partners",
    credit: "free credit",
    agent: "agent loop",
    notes: {
      router:
        "Inference Providers is a unified OpenAI-shaped API in front of partner backends. You send a Hub repo id plus a routing suffix (:fastest, :cheapest, :preferred, or a provider name). No shards download.",
      bill: "Hugging Face charges the same rates as the partner, with no extra fee. Custom partner keys in Hub settings are billed by the partner and do not spend the monthly Hub credits.",
      free: "Hermes and Hugging Face both document $0.10 per month of free credit, subject to change. An agent loop makes many completions per user turn. A handful of 397B turns can spend the month.",
    },
  },
  es: {
    title: "el router, la factura, los diez céntimos",
    hint: "no cambian de manos shards · tarifas del partner · una clave gratis muere en pocos turnos de agente",
    router: "router",
    bill: "precios",
    free: "clave gratis",
    legendRouter: "router HF",
    legendPartner: "backend partner",
    legendCredit: "crédito mensual",
    routerPlate: "router",
    partners: "partners",
    credit: "crédito gratis",
    agent: "bucle agente",
    notes: {
      router:
        "Inference Providers es una API unificada con forma OpenAI delante de backends partner. Envías un id de repo del Hub más un sufijo de routing (:fastest, :cheapest, :preferred o un nombre de provider). No se descargan shards.",
      bill: "Hugging Face cobra las mismas tarifas que el partner, sin recargo. Las claves custom de provider en settings las factura el partner y no gastan los créditos mensuales del Hub.",
      free: "Hermes y Hugging Face documentan 0,10 dólares al mes de crédito gratuito, sujeto a cambio. Un bucle de agente hace muchas completions por turno de usuario. Un puñado de turnos 397B puede gastar el mes.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("router");
  const drain = mode === "free";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendRouter },
        { color: P.amber, label: t.legendPartner },
        { color: P.rose, label: t.legendCredit },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "router", label: t.router, tone: P.teal },
            { value: "bill", label: t.bill, tone: P.amber },
            { value: "free", label: t.free, tone: P.rose },
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
        <IsoFrame width={13.3} depth={11.6} y={-0.04} />
        <PlanTrace
          points={[[-5.5, 3.4], [0.1, 3.4], [0.1, 0.3]]}
          y={-0.03}
          color={drain ? P.rose : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.7, 0, 2.3]} to={[4.8, 0, 2.3]} />
        <IsoDust count={46} center={[0, 0.55, 0]} spread={[5.1, 1.0, 3.6]} />

        <GlassPanel
          position={[0.05, 1.45, 0.15]}
          rotation={ISO}
          size={[2.55, 2.35]}
          color={P.teal}
          opacity={0.3}
        />
        <Tag position={[0.05, 2.85, 0.15]} tone="teal">
          {t.routerPlate}
        </Tag>
        <Sheet
          position={[0.15, 0.08, 0.25]}
          size={[1.45, 1.05]}
          color={P.tealWash}
          fill={0.85}
          marks={4}
          markColor={P.teal}
        />

        {[
          { x: 3.35, z: 1.55 },
          { x: 3.55, z: 0.05 },
          { x: 3.25, z: -1.45 },
        ].map((p, i) => (
          <group key={i}>
            <GlassPanel
              position={[p.x, 0.95, p.z]}
              rotation={ISO}
              size={[1.7, 1.45]}
              color={P.amber}
              opacity={mode === "bill" ? 0.3 : 0.18}
            />
            <Sheet
              position={[p.x + 0.08, 0.06, p.z]}
              size={[1.05, 0.8]}
              color={P.amberWash}
              fill={0.8}
              marks={2}
              markColor={P.amber}
            />
            {i === 0 ? (
              <Tag position={[p.x, 1.85, p.z]} tone="amber" size="xs">
                {t.partners}
              </Tag>
            ) : null}
          </group>
        ))}

        <Duct from={[1.15, 0.35, 0.2]} to={[2.55, 0.35, 0.4]} color={P.amber} radius={0.09} bend={0.4} />
        <Flow
          points={[
            [1.0, 0.38, 0.2],
            [2.4, 0.38, 0.35],
          ]}
          color={P.amber}
          count={3}
        />

        {drain ? (
          <>
            <GlassPanel
              position={[-3.25, 1.15, 1.15]}
              rotation={ISO}
              size={[2.15, 1.7]}
              color={P.rose}
              opacity={0.28}
            />
            <Tag position={[-3.25, 2.2, 1.15]} tone="rose" size="xs">
              {t.credit}
            </Tag>
            <Sheet
              position={[-3.15, 0.06, 1.2]}
              size={[1.15, 0.75]}
              color={P.roseWash}
              fill={0.25}
              marks={1}
              markColor={P.rose}
            />
            <Tag position={[-3.25, 1.45, -0.55]} tone="muted" size="xs">
              {t.agent}
            </Tag>
            {[0, 1, 2, 3].map((i) => (
              <Sheet
                key={i}
                position={[-3.55 + i * 0.35, 0.05, -0.75]}
                size={[0.42, 0.65]}
                color={P.violetWash}
                fill={0.8}
                marks={1}
                markColor={P.violet}
              />
            ))}
            <Duct from={[-2.3, 0.22, 0.9]} to={[-1.05, 0.4, 0.25]} color={P.rose} radius={0.09} bend={0.45} />
          </>
        ) : (
          <Sheet
            position={[-3.35, 0.06, 1.05]}
            size={[1.35, 0.95]}
            color={P.tealWash}
            fill={0.8}
            marks={3}
            markColor={P.teal}
          />
        )}
      </Stage>
    </Figure>
  );
}

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
 * Anthropic's number-one surprise, as two desks.
 *
 * Max + extra credits: OAuth is open, spend hits only the overage plate,
 * base Max stays untouched. Pro: the OAuth plate is shut; the supported
 * path is the API key. Always-on gateway: the key is the safer path.
 * Steps are the ones the lesson already names — nothing invented.
 */

type Mode = "max" | "pro" | "key";

const COPY = {
  en: {
    title: "Anthropic: the number-one surprise",
    hint: "Max OAuth spends extra credits · Pro has no OAuth · key for a gateway",
    max: "Max + extra",
    pro: "Pro blocked",
    key: "API key",
    legendOauth: "OAuth path",
    legendExtra: "extra / overage credits",
    legendKey: "pay-per-token key",
    oauth: "OAuth",
    extra: "extra credits",
    base: "base Max",
    closed: "no OAuth",
    gateway: "always-on gateway",
    notes: {
      max: "Claude Max plus purchased extra usage is the OAuth path Hermes documents. Spend hits only those extra/overage credits. The base Max allowance stays untouched.",
      pro: "Claude Pro looks like it should OAuth. It does not. Hermes documents this as the usual surprise. The supported alternative is ANTHROPIC_API_KEY, billed pay-per-token against the key's organisation.",
      key: "For an always-on gateway, OpenClaw still recommends the API key. Same model family, different bill — independent of any Claude subscription.",
    },
  },
  es: {
    title: "Anthropic: la sorpresa número uno",
    hint: "Max OAuth gasta créditos extra · Pro no tiene OAuth · clave para un gateway",
    max: "Max + extra",
    pro: "Pro bloqueado",
    key: "clave API",
    legendOauth: "camino OAuth",
    legendExtra: "créditos extra / overage",
    legendKey: "clave de pago por token",
    oauth: "OAuth",
    extra: "créditos extra",
    base: "cupo base Max",
    closed: "sin OAuth",
    gateway: "gateway siempre encendido",
    notes: {
      max: "Claude Max más créditos extra comprados es el camino OAuth que documenta Hermes. El gasto pega solo a esos créditos extra/overage. El cupo base de Max queda intacto.",
      pro: "Claude Pro parece que debería hacer OAuth. No vale. Hermes lo documenta como la sorpresa habitual. La alternativa soportada es ANTHROPIC_API_KEY, facturada pago por token contra la organización de esa clave.",
      key: "Para un gateway siempre encendido, OpenClaw sigue recomendando la clave API. Misma familia de modelo, distinta factura — independiente de cualquier suscripción Claude.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("max");
  const oauthOpen = mode === "max";
  const keyOn = mode === "pro" || mode === "key";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendOauth },
        { color: P.amber, label: t.legendExtra },
        { color: P.violet, label: t.legendKey },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "max", label: t.max, tone: P.teal },
            { value: "pro", label: t.pro, tone: P.rose },
            { value: "key", label: t.key, tone: P.violet },
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
          points={[[-5.5, 3.3], [-2.4, 3.3], [-2.4, -0.2]]}
          y={-0.03}
          color={oauthOpen ? P.teal : P.rose}
          opacity={oauthOpen ? 0.7 : 0.35}
        />
        <PlanTrace
          points={[[5.4, 3.4], [2.3, 3.4], [2.3, 0.6]]}
          y={-0.03}
          color={P.violet}
          opacity={keyOn ? 0.7 : 0.25}
        />
        <AxisLine from={[-4.5, 0, 2.2]} to={[4.6, 0, 2.2]} />
        <IsoDust count={44} center={[0, 0.55, 0]} spread={[5.0, 1.0, 3.6]} />

        <GlassPanel
          position={[-2.45, 1.35, -0.55]}
          rotation={ISO}
          size={[2.5, 2.2]}
          color={oauthOpen ? P.teal : P.rose}
          opacity={oauthOpen ? 0.3 : 0.1}
        />
        <Tag position={[-2.45, 2.7, -0.55]} tone={oauthOpen ? "teal" : "rose"}>
          {oauthOpen ? t.oauth : t.closed}
        </Tag>
        {[0, 1].map((i) => (
          <Sheet
            key={i}
            position={[-2.35 + i * 0.08, 0.08 + i * 0.07, -0.4]}
            size={[1.55, 1.05]}
            color={oauthOpen ? P.amberWash : P.roseWash}
            fill={oauthOpen ? 0.85 : 0.18}
            marks={oauthOpen ? 3 : 0}
            markColor={oauthOpen ? P.amber : P.rose}
          />
        ))}
        <Tag position={[-2.35, 1.55, 0.85]} tone="amber" size="xs">
          {mode === "max" ? t.extra : t.base}
        </Tag>
        {mode === "max" ? (
          <Sheet
            position={[-3.85, 0.06, 1.55]}
            size={[1.15, 0.85]}
            color={P.tealWash}
            fill={0.55}
            marks={2}
            markColor={P.teal}
          />
        ) : null}

        <GlassPanel
          position={[2.45, 1.25, 1.15]}
          rotation={ISO}
          size={[2.35, 2.05]}
          color={P.violet}
          opacity={keyOn ? 0.3 : 0.08}
        />
        <Tag position={[2.45, 2.55, 1.15]} tone="violet">
          {mode === "key" ? t.gateway : t.key}
        </Tag>
        <Sheet
          position={[2.55, 0.08, 1.25]}
          size={[1.45, 1.0]}
          color={P.violetWash}
          fill={keyOn ? 0.9 : 0.15}
          marks={keyOn ? 4 : 0}
          markColor={P.violet}
        />

        {keyOn ? (
          <>
            <Duct
              from={[-1.3, 0.25, -0.2]}
              to={[1.45, 0.35, 1.0]}
              color={P.violet}
              radius={0.1}
              bend={0.5}
            />
            <Flow
              points={[
                [-1.15, 0.28, -0.1],
                [1.3, 0.38, 0.95],
              ]}
              color={P.violet}
              count={3}
            />
          </>
        ) : (
          <Flow
            points={[
              [-2.4, 0.3, -0.2],
              [-2.2, 0.45, 0.9],
            ]}
            color={P.amber}
            count={3}
          />
        )}
      </Stage>
    </Figure>
  );
}

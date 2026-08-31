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
 * The five boxes, in situ on one desk.
 *
 * Schema is what the model sees. Registry maps name to handler.
 * Dispatch is the pulse. Policy is the gate — if it hides a schema,
 * the tool does not exist for the model. Backend is where it actually
 * runs. The nearby intro visual already names the chain; this one
 * sits on the section that walks each box.
 */

type Mode = "chain" | "gate" | "backend";

const COPY = {
  en: {
    title: "five boxes between the model and the host",
    hint: "schema · registry · dispatch · policy · backend",
    chain: "the chain",
    gate: "policy gate",
    backend: "backends",
    legendCore: "core path",
    legendGate: "policy",
    legendHost: "backend",
    model: "model",
    host: "host",
    schema: "schema",
    registry: "registry",
    dispatch: "dispatch",
    policy: "policy",
    notes: {
      chain:
        "Five boxes, one desk. The model emits a tool_call. Schema is what it saw this turn. Registry looks up the name. Dispatch parses, validates, calls. Policy sits between model and host. Backend is where the callable actually runs.",
      gate: "If policy removes a tool, the model does not see its schema. That is the door — not a please in the system prompt. A failure in any of the five looks like a dumb model. It is not.",
      backend:
        "Terminal and browser are backends behind tools, not second brains. Hermes names local, Docker, SSH, Daytona, Modal. OpenClaw browser can target sandbox, host, or a paired node.",
    },
  },
  es: {
    title: "cinco cajas entre el modelo y el host",
    hint: "esquema · registro · despacho · política · backend",
    chain: "la cadena",
    gate: "puerta",
    backend: "backends",
    legendCore: "ruta núcleo",
    legendGate: "política",
    legendHost: "backend",
    model: "modelo",
    host: "host",
    schema: "esquema",
    registry: "registro",
    dispatch: "despacho",
    policy: "política",
    notes: {
      chain:
        "Cinco cajas, un escritorio. El modelo emite un tool_call. El esquema es lo que vio este turno. El registro busca el nombre. El despacho parsea, valida, llama. La política está entre el modelo y el host. El backend es donde el callable corre de verdad.",
      gate: "Si la política quita una tool, el modelo no ve su esquema. Esa es la puerta — no un por favor en el system prompt. Un fallo en cualquiera de las cinco se parece a un modelo tonto. No lo es.",
      backend:
        "Terminal y browser son backends detrás de tools, no segundos cerebros. Hermes nombra local, Docker, SSH, Daytona, Modal. OpenClaw browser puede apuntar a sandbox, host o un node emparejado.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

const BOXES: { key: "schema" | "registry" | "dispatch" | "policy"; color: string; wash: string }[] = [
  { key: "schema", color: P.teal, wash: P.tealWash },
  { key: "registry", color: P.teal, wash: P.tealWash },
  { key: "dispatch", color: P.amber, wash: P.amberWash },
  { key: "policy", color: P.violet, wash: P.violetWash },
];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("chain");
  const hideSchema = mode === "gate";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendCore },
        { color: P.violet, label: t.legendGate },
        { color: P.amber, label: t.legendHost },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "chain", label: t.chain, tone: P.teal },
            { value: "gate", label: t.gate, tone: P.violet },
            { value: "backend", label: t.backend, tone: P.amber },
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
        <IsoFrame width={13.4} depth={11.4} y={-0.04} />
        <PlanTrace
          points={[[-5.6, 3.3], [-2.6, 3.3], [-2.6, 0.4]]}
          y={-0.03}
          color={mode === "gate" ? P.violet : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.8, 0, 2.2]} to={[4.8, 0, 2.2]} />
        <IsoDust count={40} center={[0, 0.5, 0]} spread={[5.2, 0.9, 3.4]} />

        <GlassPanel position={[-4.05, 1.15, 1.35]} rotation={ISO} size={[1.7, 1.7]} color={P.teal} opacity={0.22} />
        <Tag position={[-4.05, 2.2, 1.35]} tone="teal" size="xs">
          {t.model}
        </Tag>

        {BOXES.map((b, i) => {
          const hidden = hideSchema && b.key === "schema";
          return (
            <group key={b.key}>
              <GlassPanel
                position={[-1.85 + i * 1.35, 1.05, 0.15]}
                rotation={ISO}
                size={[1.15, 1.55]}
                color={hidden ? P.rose : b.color}
                opacity={hidden ? 0.08 : 0.28}
              />
              <Sheet
                position={[-1.85 + i * 1.35, 0.05, 0.2]}
                size={[0.85, 0.7]}
                color={hidden ? P.roseWash : b.wash}
                fill={hidden ? 0.12 : 0.85}
                marks={hidden ? 0 : 3}
                markColor={hidden ? P.rose : b.color}
              />
              <Tag
                position={[-1.85 + i * 1.35, 2.05, 0.15]}
                tone={hidden ? "rose" : b.color === P.teal ? "teal" : b.color === P.amber ? "amber" : "violet"}
                size="xs"
              >
                {t[b.key]}
              </Tag>
            </group>
          );
        })}

        <GlassPanel
          position={[3.85, 1.2, -0.85]}
          rotation={ISO}
          size={[1.85, 1.85]}
          color={P.amber}
          opacity={mode === "backend" ? 0.32 : 0.18}
        />
        <Tag position={[3.85, 2.35, -0.85]} tone="amber" size="xs">
          {t.host}
        </Tag>
        {mode === "backend"
          ? [0, 1, 2].map((i) => (
              <Sheet
                key={i}
                position={[3.55 + i * 0.22, 0.05, -0.55 - i * 0.18]}
                size={[0.7, 0.55]}
                color={P.amberWash}
                fill={0.85}
                marks={2}
                markColor={P.amber}
              />
            ))
          : (
            <Sheet
              position={[3.9, 0.05, -0.75]}
              size={[1.05, 0.8]}
              color={P.amberWash}
              fill={0.8}
              marks={3}
              markColor={P.amber}
            />
          )}

        <Duct
          from={[-3.3, 0.28, 1.05]}
          to={hideSchema ? [-1.9, 0.45, 0.2] : [3.05, 0.4, -0.55]}
          color={hideSchema ? P.rose : P.teal}
          radius={0.09}
          bend={0.45}
        />
        <Flow
          points={[
            [-3.15, 0.3, 1.0],
            hideSchema ? [-1.75, 0.42, 0.2] : [2.9, 0.42, -0.5],
          ]}
          color={hideSchema ? P.rose : P.teal}
          count={4}
        />
      </Stage>
    </Figure>
  );
}

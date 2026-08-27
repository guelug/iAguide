"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "map" | "mechanism" | "tradeoff";
type Tone = "teal" | "violet" | "amber";
const COPY = {
  "en": {
    "topic1": "concept 1 · openclaw-browser",
    "topic2": "concept 2 · openclaw-browser",
    "topic3": "concept 3 · openclaw-browser",
    "title": "three dimensions of the idea",
    "hint": "map, mechanism, trade-off",
    "map": "map",
    "mechanism": "mechanism",
    "tradeoff": "trade-off",
    "input": "input",
    "output": "output",
    "decision": "decision",
    "context": "context",
    "system": "system",
    "constraint": "constraint",
    "signal": "signal",
    "cost": "cost",
    "result": "result"
  },
  "es": {
    "topic1": "Un browser solo para el agente",
    "topic2": "Perfiles: openclaw, user, chrome",
    "topic3": "Control del plugin",
    "title": "tres dimensiones de la idea",
    "hint": "mapa, mecanismo y trade-off",
    "map": "mapa",
    "mechanism": "mecanismo",
    "tradeoff": "trade-off",
    "input": "entrada",
    "output": "salida",
    "decision": "decisión",
    "context": "contexto",
    "system": "sistema",
    "constraint": "restricción",
    "signal": "señal",
    "cost": "coste",
    "result": "resultado"
  }
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("map");
  const tones: Tone[] = ["teal", "violet", "amber"];
  const colors = [P.teal, P.violet, P.amber];
  const tone = (i: number) => tones[i % 3];
  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.topic1 },
        { color: P.violet, label: t.topic2 },
        { color: P.amber, label: t.topic3 },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "map", label: t.map, tone: P.teal },
            { value: "mechanism", label: t.mechanism, tone: P.violet },
            { value: "tradeoff", label: t.tradeoff, tone: P.amber },
          ]}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>
          {mode === "map" && <>
            {[t.topic1, t.topic2, t.topic3].map((topic, i) => (
              <group key={topic}>
                <Slab position={[(i - 1) * 2.2, 0.5, 0]} size={[1.8, 1.05, 0.14]} color={colors[i]} fill={0.2} />
                <Tag position={[(i - 1) * 2.2, 1.25, 0.15]} tone={tone(i)} size="xs">{topic}</Tag>
                <Node3D position={[(i - 1) * 2.2, 0.5, 0.18]} color={colors[i]} radius={0.13} pulse={i * 0.25} />
              </group>
            ))}
            <Flow points={[[-1.0, 0.5, 0], [1.0, 0.5, 0]]} color={P.lineStrong} count={3} size={0.045} />
            <Tag position={[0, -0.9, 0.15]} tone="muted" size="xs">{t.input} → {t.system} → {t.output}</Tag>
          </>}
          {mode === "mechanism" && <>
            <Halo position={[0, 0.45, 0]} radius={0.65} color={P.violet} opacity={0.55} spin={0.2} />
            <Node3D position={[0, 0.45, 0]} color={P.violet} radius={0.2} pulse={0.35} />
            <Tag position={[0, 1.15, 0.15]} tone="violet">{t.system}</Tag>
            {[t.topic1, t.topic2, t.topic3].map((topic, i) => {
              const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(a) * 2.25, y = 0.45 + Math.sin(a) * 1.15;
              return <group key={topic}>
                <Node3D position={[x, y, 0]} color={colors[i]} radius={0.13} matte />
                <Tag position={[x, y + 0.32, 0.15]} tone={tone(i)} size="xs">{topic}</Tag>
                <Flow points={[[x * 0.55, 0.45 + (y - 0.45) * 0.55, 0], [x * 0.9, 0.45 + (y - 0.45) * 0.9, 0]]} color={colors[i]} count={2} size={0.04} />
              </group>;
            })}
            <Tag position={[0, -1.35, 0.15]} tone="muted" size="xs">{t.context} + {t.signal} → {t.result}</Tag>
          </>}
          {mode === "tradeoff" && <>
            <Slab position={[-1.55, 0.45, 0]} size={[2.2, 1.55, 0.14]} color={P.teal} fill={0.18} />
            <Tag position={[-1.55, 1.5, 0.15]} tone="teal">{t.topic1}</Tag>
            <Tag position={[-1.55, 0.35, 0.15]} tone="teal" size="xs">{t.signal}</Tag>
            <Slab position={[1.55, 0.45, 0]} size={[2.2, 1.55, 0.14]} color={P.rose} fill={0.18} />
            <Tag position={[1.55, 1.5, 0.15]} tone="rose">{t.topic2}</Tag>
            <Tag position={[1.55, 0.35, 0.15]} tone="rose" size="xs">{t.constraint}</Tag>
            <Flow points={[[-0.4, 0.45, 0], [0.4, 0.45, 0]]} color={P.amber} count={3} size={0.05} />
            <Tag position={[0, 1.05, 0.15]} tone="amber" size="xs">{t.decision}</Tag>
            <Wire points={[[-2.65, -0.8, 0], [2.65, -0.8, 0]]} color={P.lineStrong} opacity={0.55} />
            <Tag position={[0, -1.15, 0.15]} tone="muted" size="xs">{t.cost} ↔ {t.result}</Tag>
          </>}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Bars, Marker, PointerTilt, ShadowBlob, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "trace" | "spans" | "errors";

const COPY = {
  en: {
    title: "one turn, many clocks",
    hint: "a trace is the turn; spans are where the seconds actually went",
    trace: "Trace",
    spans: "Spans",
    errors: "Failure",
    legendModel: "model time",
    legendTool: "tool time",
    legendFail: "failure",
    spanNames: ["assemble", "prefill", "decode", "tool: search", "decode", "tool: write", "stream"],
    total: "turn",
    slowest: "slowest span",
    retry: "retry",
    traceNote: "one trace per turn, with the id you can paste into a bug report",
    spansNote: "most of this turn is not the model thinking; it is a tool waiting on a network",
    errorsNote: "a failed span plus its retry is the shape of most 'the agent is flaky' reports",
    ms: "ms",
  },
  es: {
    title: "un turno, muchos relojes",
    hint: "la traza es el turno; los spans son adónde se fueron los segundos",
    trace: "Traza",
    spans: "Spans",
    errors: "Fallo",
    legendModel: "tiempo de modelo",
    legendTool: "tiempo de tool",
    legendFail: "fallo",
    spanNames: ["montaje", "prefill", "decode", "tool: buscar", "decode", "tool: escribir", "stream"],
    total: "turno",
    slowest: "span más lento",
    retry: "reintento",
    traceNote: "una traza por turno, con el id que puedes pegar en un informe de bug",
    spansNote: "casi todo este turno no es el modelo pensando: es una tool esperando a la red",
    errorsNote: "un span fallido más su reintento es la forma de casi todo «el agente va raro»",
    ms: "ms",
  },
};

/** [start, duration, depth, kind] in arbitrary but consistent time units. */
const SPANS: { start: number; dur: number; depth: number; tool: boolean }[] = [
  { start: 0, dur: 0.35, depth: 0, tool: false },
  { start: 0.35, dur: 0.9, depth: 1, tool: false },
  { start: 1.25, dur: 1.1, depth: 1, tool: false },
  { start: 2.35, dur: 4.0, depth: 2, tool: true },
  { start: 6.35, dur: 0.9, depth: 1, tool: false },
  { start: 7.25, dur: 1.8, depth: 2, tool: true },
  { start: 9.05, dur: 0.5, depth: 1, tool: false },
];

const TOTAL = 9.55;
const X0 = -3.1;
const WIDTH = 6.2;
const FAIL_INDEX = 3;

function Span({
  start,
  dur,
  depth,
  color,
  dim,
}: {
  start: number;
  dur: number;
  depth: number;
  color: string;
  dim: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    // Spans light up in order, so the waterfall reads as elapsed time.
    const cycle = (clock.elapsedTime * 0.5) % (TOTAL + 1.5);
    const on = cycle > start && cycle < start + dur + 0.25;
    g.scale.z = on ? 1.5 : 1;
  });

  const w = (dur / TOTAL) * WIDTH;
  const x = X0 + (start / TOTAL) * WIDTH + w / 2;

  return (
    <group ref={ref} position={[x, 0.95 - depth * 0.52, 0]}>
      <mesh>
        <boxGeometry args={[Math.max(0.06, w - 0.04), 0.3, 0.22]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={dim ? 0.3 : 1}
          roughness={0.44}
          metalness={0.03}
        />
      </mesh>
      <Tag position={[0, 0.3, 0.14]} tone={dim ? "muted" : "ink"} size="xs" center>
        {Math.round(dur * 220)}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("trace");
  const note = mode === "errors" ? t.errorsNote : mode === "spans" ? t.spansNote : t.traceNote;

  const slowest = SPANS.reduce((a, b) => (b.dur > a.dur ? b : a));
  const toolTime = SPANS.filter((s) => s.tool).reduce((n, s) => n + s.dur, 0);
  const modelTime = TOTAL - toolTime;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendModel },
        { color: P.amber, label: t.legendTool },
        { color: P.rose, label: t.legendFail },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "trace", label: t.trace, tone: P.teal },
            { value: "spans", label: t.spans, tone: P.amber },
            { value: "errors", label: t.errors, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
      height="h-[360px] md:h-[440px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.5, 6.9], fov: 40 }} background={P.paper} fit={1.12}>
        <PointerTilt amount={0.06}>
          <group position={[0, 0.35, 0]} rotation={[-0.2, 0, 0]}>
            <ShadowBlob position={[0, -1.35, 0]} scale={8} opacity={0.05} />

            {/* The whole turn, as one bar: the number a user feels. */}
            <group position={[0, 1.62, 0]}>
              <mesh position={[X0 + WIDTH / 2, 0, 0]}>
                <boxGeometry args={[WIDTH, 0.26, 0.24]} />
                <meshStandardMaterial color={P.teal} roughness={0.42} />
              </mesh>
              <Tag position={[X0 - 0.5, 0, 0]} tone="ink" size="xs">
                {t.total}
              </Tag>
              <Tag position={[X0 + WIDTH + 0.55, 0, 0]} tone="ink" size="xs" center>
                {Math.round(TOTAL * 220)} {t.ms}
              </Tag>
              <Marker position={[X0 + WIDTH / 2, 0.34, 0.18]} n={1} color={P.teal} />
            </group>

            {SPANS.map((s, i) => {
              const failed = mode === "errors" && i === FAIL_INDEX;
              const dim = mode === "spans" && !s.tool;
              return (
                <Span
                  key={i}
                  start={s.start}
                  dur={s.dur}
                  depth={s.depth}
                  color={failed ? P.rose : s.tool ? P.amber : P.teal}
                  dim={dim}
                />
              );
            })}

            {/* Span names, printed once down the left edge. */}
            {SPANS.map((s, i) => (
              <Tag
                key={`n${i}`}
                position={[X0 + (s.start / TOTAL) * WIDTH, 0.95 - s.depth * 0.52 - 0.3, 0.16]}
                tone={mode === "errors" && i === FAIL_INDEX ? "rose" : s.tool ? "amber" : "muted"}
                size="xs"
              >
                {t.spanNames[i]}
              </Tag>
            ))}

            {mode === "errors" ? (
              <group position={[X0 + ((SPANS[FAIL_INDEX].start + SPANS[FAIL_INDEX].dur) / TOTAL) * WIDTH, 0.95 - 2 * 0.52, 0]}>
                <mesh position={[0.35, 0, 0]}>
                  <boxGeometry args={[0.55, 0.3, 0.22]} />
                  <meshStandardMaterial color={P.amberWash} roughness={0.45} />
                </mesh>
                <Tag position={[0.35, -0.3, 0.14]} tone="amber" size="xs" center>
                  {t.retry}
                </Tag>
              </group>
            ) : null}

            {/* Time axis. Without it the bars are just rectangles. */}
            <Wire
              points={[
                [X0, -1.05, 0],
                [X0 + WIDTH, -1.05, 0],
              ]}
              color={P.lineStrong}
              opacity={0.8}
              width={1.2}
            />
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <Tag key={f} position={[X0 + f * WIDTH, -1.28, 0]} tone="muted" size="xs" center>
                {Math.round(f * TOTAL * 220)}
              </Tag>
            ))}
          </group>

          <group position={[0, -2.05, 0]}>
            <Bars
              bars={[
                { label: t.legendModel, value: modelTime / TOTAL, color: P.teal, note: `${Math.round((modelTime / TOTAL) * 100)}%` },
                { label: t.legendTool, value: toolTime / TOTAL, color: P.amber, note: `${Math.round((toolTime / TOTAL) * 100)}%` },
              ]}
              height={0.55}
              width={0.46}
              gap={0.9}
              depth={0.28}
            />
          </group>
        </PointerTilt>

        <group position={[0, -2.95, 0]}>
          <Tag position={[0, 0.24, 0]} tone="muted" size="xs" center>
            {t.slowest}: {t.spanNames[SPANS.indexOf(slowest)]} · {Math.round(slowest.dur * 220)} {t.ms}
          </Tag>
          <Tag position={[0, -0.06, 0]} tone={mode === "errors" ? "rose" : mode === "spans" ? "amber" : "teal"} size="xs" center>
            {note}
          </Tag>
        </group>
      </Stage>
    </Figure>
  );
}

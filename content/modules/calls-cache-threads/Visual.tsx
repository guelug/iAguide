"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Bars,
  Flow,
  Marker,
  PointerTilt,
  ShadowBlob,
  Tag,
  Wire,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "hit" | "bust" | "nested";

const COPY = {
  en: {
    title: "what the prefix cache actually reuses",
    hint: "top row: last request · bottom row: this one",
    hit: "Cache hit",
    bust: "Bust",
    nested: "Child thread",
    reused: "reused",
    recomputed: "recomputed",
    changed: "changed",
    prev: "previous request",
    now: "this request",
    child: "child thread",
    hitNote: "same bytes, same order → only the new tail is prefilled",
    bustNote: "one edited token near the front → everything after it is recomputed",
    nestedNote: "a child gets its own short prefix; the parent's cache survives untouched",
    cost: "prefill work",
    tokens: "tok",
  },
  es: {
    title: "qué reutiliza de verdad la caché de prefijo",
    hint: "fila de arriba: petición anterior · abajo: esta",
    hit: "Acierto",
    bust: "Rotura",
    nested: "Hilo hijo",
    reused: "reutilizado",
    recomputed: "recomputado",
    changed: "cambiado",
    prev: "petición anterior",
    now: "esta petición",
    child: "hilo hijo",
    hitNote: "mismos bytes, mismo orden → solo se prefillea la cola nueva",
    bustNote: "un token editado al principio → se recomputa todo lo que va detrás",
    nestedNote: "el hijo tiene su propio prefijo corto; la caché del padre sigue intacta",
    cost: "trabajo de prefill",
    tokens: "tok",
  },
};

const N = 26;
const PITCH = 0.24;
const SPAN = (N - 1) * PITCH;
const BUST_AT = 5;
const TAIL_AT = 20;

function Chip({
  x,
  y,
  color,
  lift,
  delay,
}: {
  x: number;
  y: number;
  color: string;
  lift: number;
  delay: number;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    // Recomputed chips bob: work is happening there, and nowhere else.
    const wave = lift > 0 ? Math.sin(clock.elapsedTime * 2.2 - delay) * 0.5 + 0.5 : 0;
    g.position.y = MathUtils.damp(g.position.y, y + lift * (0.06 + wave * 0.07), 8, dt);
  });
  return (
    <group ref={ref} position={[x, y, 0]}>
      <mesh>
        <boxGeometry args={[0.17, 0.17, 0.17]} />
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.03} />
      </mesh>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("hit");

  /** Index from which this request stops matching the cached prefix. */
  const divergeAt = mode === "bust" ? BUST_AT : TAIL_AT;
  const reused = divergeAt;
  const recomputed = N - divergeAt;

  const rows = useMemo(() => Array.from({ length: N }, (_, i) => i * PITCH - SPAN / 2), []);

  const accent = mode === "bust" ? P.rose : mode === "nested" ? P.violet : P.teal;
  const note = mode === "bust" ? t.bustNote : mode === "nested" ? t.nestedNote : t.hitNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.reused },
        { color: P.amber, label: t.recomputed },
        { color: P.rose, label: t.changed },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "hit", label: t.hit, tone: P.teal },
            { value: "bust", label: t.bust, tone: P.rose },
            { value: "nested", label: t.nested, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      height="h-[360px] md:h-[440px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.9, 6.6], fov: 40 }} background={P.paper} fit={1.12}>
        <PointerTilt amount={0.06}>
          <group rotation={[-0.22, 0, 0]} position={[0, 0.1, 0]}>
            <ShadowBlob position={[0, -1.15, 0]} scale={7.6} opacity={0.05} />

            {/* Previous request: the thing the cache already knows. */}
            <group position={[0, 0.72, 0]}>
              {rows.map((x, i) => (
                <Chip
                  key={i}
                  x={x}
                  y={0}
                  color={i < TAIL_AT ? P.tealWash : P.line}
                  lift={0}
                  delay={0}
                />
              ))}
              <Tag position={[-SPAN / 2 - 0.55, 0, 0.2]} tone="muted" size="xs">
                {t.prev}
              </Tag>
            </group>

            {/* Match lines: drawn only where the two rows agree. */}
            {rows.map((x, i) =>
              i < divergeAt ? (
                <Wire
                  key={`m${i}`}
                  points={[
                    [x, 0.62, 0],
                    [x, -0.12, 0],
                  ]}
                  color={P.teal}
                  opacity={0.32}
                  width={1}
                />
              ) : null,
            )}

            {/* This request. Everything past the divergence is fresh work. */}
            <group position={[0, -0.22, 0]}>
              {rows.map((x, i) => {
                const isChange = mode === "bust" && i === BUST_AT;
                const fresh = i >= divergeAt;
                return (
                  <Chip
                    key={i}
                    x={x}
                    y={0}
                    color={isChange ? P.rose : fresh ? P.amber : P.teal}
                    lift={fresh ? 1 : 0}
                    delay={(i - divergeAt) * 0.32}
                  />
                );
              })}
              <Tag position={[-SPAN / 2 - 0.55, 0, 0.2]} tone="ink" size="xs">
                {t.now}
              </Tag>
              <Marker
                position={[rows[divergeAt] ?? SPAN / 2, -0.34, 0.2]}
                n={divergeAt + 1}
                color={accent}
              />
            </group>

            {/* Prefill sweeps the recomputed span, left to right. */}
            <Flow
              points={[
                [rows[divergeAt] - 0.12, -0.46, 0.16],
                [SPAN / 2 + 0.12, -0.46, 0.16],
              ]}
              color={P.amber}
              count={3}
              speed={0.5}
              size={0.05}
              lineOpacity={0.35}
            />

            {mode === "nested" ? (
              <group position={[SPAN / 2 - 0.9, -1.15, 0.35]}>
                <Arrow
                  from={[-0.5, 0.75, -0.2]}
                  to={[-0.15, 0.12, 0]}
                  color={P.violet}
                  width={1.6}
                  head={0.1}
                />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Chip key={i} x={i * PITCH} y={0} color={P.violet} lift={0} delay={0} />
                ))}
                <Tag position={[PITCH * 2.5, -0.3, 0.2]} tone="violet" size="xs" center>
                  {t.child}
                </Tag>
              </group>
            ) : null}
          </group>

          {/* The claim, made quantitative. */}
          <group position={[0, -1.62, 0]}>
            <Bars
              bars={[
                { label: t.reused, value: reused / N, color: P.teal, note: `${reused} ${t.tokens}` },
                {
                  label: t.recomputed,
                  value: recomputed / N,
                  color: P.amber,
                  note: `${recomputed} ${t.tokens}`,
                },
              ]}
              height={0.62}
              width={0.5}
              gap={0.5}
              depth={0.3}
            />
            <Tag position={[0, -0.5, 0]} tone="muted" size="xs" center>
              {t.cost}
            </Tag>
          </group>
        </PointerTilt>

        <group position={[0, -2.42, 0]}>
          <Tag position={[0, 0, 0]} tone={mode === "bust" ? "rose" : mode === "nested" ? "violet" : "teal"} size="xs" center>
            {note}
          </Tag>
        </group>
      </Stage>
    </Figure>
  );
}

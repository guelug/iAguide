"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Same operation, different thing left behind.
 *
 * Both products summarise a long history. The difference the section is
 * really drawing is what happens to the session's *identity*: Hermes
 * compression starts a child lineage, and OpenClaw compaction keeps the
 * current sqlite row. Draw the id chip and the answer is obvious; write
 * it in prose and it reads like an implementation detail.
 */

type Mode = "openclaw" | "hermes" | "custom";

const LIMIT = 100;

const COPY = {
  en: {
    title: "what survives the summary",
    hint: "fill the window · watch the id, not the text",
    openclaw: "OpenClaw compaction",
    hermes: "Hermes compression",
    custom: "custom matcher",
    legendKept: "kept verbatim",
    legendSummary: "summarised",
    legendId: "session identity",
    window: "context",
    before: "before",
    after: "after",
    idSame: "same id",
    idChild: "child id",
    recent: "recent turns",
    suffix: "split-turn suffix",
    overflowLabel: "provider overflow",
    matched: "already matched",
    unmatched: "never fires",
    idLabel: "session id",
    outcome: "identity",
    openclawNote:
      "the summary replaces the old turns and the sqlite session row keeps its identity. Recent-turn context and the split-turn suffix are preserved after the provider's output, so the thread does not lose its footing.",
    hermesNote:
      "compression starts a child session lineage instead: the history is summarised into a new session that points back at its parent, and /resume is how you pick one up. Do not paste compression.protect_last_n into keepRecentTokens — different product, different key.",
    customNote:
      "OpenClaw already matches dozens of provider overflow strings — request_too_large, context length exceeded, Bedrock token-count errors, Ollama's own phrasing — and maps them to compact-and-retry. A hand-written matcher sits beside a runtime that already handled it, and fires never.",
  },
  es: {
    title: "qué sobrevive al resumen",
    hint: "llena la ventana · mira el id, no el texto",
    openclaw: "Compaction de OpenClaw",
    hermes: "Compresión de Hermes",
    custom: "matcher propio",
    legendKept: "se conserva literal",
    legendSummary: "resumido",
    legendId: "identidad de sesión",
    window: "contexto",
    before: "antes",
    after: "después",
    idSame: "mismo id",
    idChild: "id hijo",
    recent: "turnos recientes",
    suffix: "sufijo de split-turn",
    overflowLabel: "overflow del proveedor",
    matched: "ya reconocido",
    unmatched: "no dispara nunca",
    idLabel: "id de sesión",
    outcome: "identidad",
    openclawNote:
      "el resumen sustituye a los turnos viejos y la fila sqlite de la sesión conserva su identidad. El contexto de turnos recientes y el sufijo de split-turn se preservan tras la salida del provider, así que el hilo no pierde pie.",
    hermesNote:
      "la compresión arranca en cambio un linaje de sesión hija: el historial se resume en una sesión nueva que apunta a su padre, y /resume es como se retoma una. No peguéis compression.protect_last_n en keepRecentTokens — otro producto, otra clave.",
    customNote:
      "OpenClaw ya matchea docenas de strings de overflow de proveedor — request_too_large, context length exceeded, errores de token-count de Bedrock, la redacción propia de Ollama — y los mapea a compact-and-retry. Un matcher escrito a mano se sienta al lado de un runtime que ya lo resolvió, y no dispara nunca.",
  },
};

/** The context window as a bar that fills and then gets cut. */
function Window({
  fill,
  keptRatio,
  z,
  label,
  color,
}: {
  fill: number;
  keptRatio: number;
  z: number;
  label: string;
  color: string;
}) {
  const summarised = useRef<Group>(null);
  const kept = useRef<Group>(null);
  const w = 6.4;

  useFrame((_, dt) => {
    const s = summarised.current;
    const k = kept.current;
    if (!s || !k) return;
    const total = (fill / LIMIT) * w;
    const keptW = Math.max(0.02, total * keptRatio);
    const sumW = Math.max(0.02, total - keptW);
    s.scale.x = MathUtils.damp(s.scale.x, sumW, 7, dt);
    s.position.x = MathUtils.damp(s.position.x, -w / 2 + sumW / 2, 7, dt);
    k.scale.x = MathUtils.damp(k.scale.x, keptW, 7, dt);
    k.position.x = MathUtils.damp(k.position.x, -w / 2 + sumW + keptW / 2, 7, dt);
  });

  return (
    <group position={[0, 0, z]}>
      {/* The window itself: the wall the history runs into. */}
      <RoundedBox args={[w + 0.3, 0.1, 1]} radius={0.04} smoothness={3} position={[0, 0.05, 0]} receiveShadow>
        <meshStandardMaterial color={P.sunken} roughness={0.5} />
      </RoundedBox>
      <group ref={summarised} position={[0, 0.28, 0]} scale={[1, 1, 1]}>
        <RoundedBox args={[1, 0.3, 0.8]} radius={0.04} smoothness={3} castShadow>
          <meshStandardMaterial color={P.line} roughness={0.45} envMapIntensity={0.8} />
        </RoundedBox>
      </group>
      <group ref={kept} position={[0, 0.28, 0]} scale={[1, 1, 1]}>
        <RoundedBox args={[1, 0.3, 0.8]} radius={0.04} smoothness={3} castShadow>
          <meshStandardMaterial color={color} roughness={0.36} metalness={0.05} envMapIntensity={0.9} />
        </RoundedBox>
      </group>
      <Tag position={[-w / 2 - 0.85, 0.28, 0]} tone="muted" size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("openclaw");
  const [fill, setFill] = useState(92);

  /* Over the limit is where the runtime decides to act. */
  const over = fill >= LIMIT;
  const childLineage = mode === "hermes";
  const fires = mode !== "custom";

  const note =
    mode === "openclaw" ? t.openclawNote : mode === "hermes" ? t.hermesNote : t.customNote;
  const accent = mode === "hermes" ? P.violet : mode === "custom" ? P.rose : P.teal;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendKept },
        { color: P.line, label: t.legendSummary },
        { color: P.violet, label: t.legendId },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "openclaw", label: t.openclaw, tone: P.teal },
              { value: "hermes", label: t.hermes, tone: P.violet },
              { value: "custom", label: t.custom, tone: P.rose },
            ]}
            ariaLabel={t.title}
          />
          <Knob
            label={t.window}
            value={fill}
            min={40}
            max={130}
            step={2}
            onChange={setFill}
            format={(v) => `${v}%`}
            tone={accent}
          />
        </>
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                {
                  label: t.overflowLabel,
                  value: over ? (fires ? t.matched : t.unmatched) : "—",
                  tone: over ? (fires ? "var(--teal)" : "var(--rose)") : "var(--muted)",
                },
                {
                  label: t.outcome,
                  value: childLineage ? t.idChild : t.idSame,
                  tone: childLineage ? "var(--violet)" : "var(--teal)",
                },
              ]}
            />
          </div>
        </>
      }
      height="h-[400px] md:h-[490px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={13} depth={9} y={-0.05} />

        <Window fill={Math.min(fill, LIMIT)} keptRatio={1} z={-2} label={t.before} color={P.teal} />
        <Window
          fill={over && fires ? 62 : Math.min(fill, LIMIT)}
          keptRatio={over && fires ? 0.42 : 1}
          z={1.4}
          label={t.after}
          color={P.teal}
        />

        {/* The wall the history runs into, and whether it was handled. */}
        <group position={[3.5, 0, -2]}>
          <AxisLine from={[0, 0.05, -0.9]} to={[0, 0.05, 3.2]} overrun={0.3} color={over ? P.rose : P.line} opacity={0.6} />
          {over ? (
            <group position={[0, 0.7, 0]}>
              <Node3D position={[0, 0, 0]} color={fires ? P.amber : P.rose} radius={0.15} />
              <Halo radius={0.44} color={fires ? P.amber : P.rose} opacity={0.75} spin={0.5} />
              <Tag position={[0, 0.5, 0]} tone={fires ? "amber" : "rose"} size="xs" center>
                {fires ? t.matched : t.unmatched}
              </Tag>
            </group>
          ) : null}
        </group>

        {/* What compaction preserves after the provider's output. */}
        {over && fires ? (
          <group position={[1.9, 0.62, 1.4]}>
            <Tag position={[0, 0.3, 0]} tone="teal" size="xs" center>
              {t.recent}
            </Tag>
            <Tag position={[0, 0, 0]} tone="teal" size="xs" center>
              {t.suffix}
            </Tag>
          </group>
        ) : null}

        {/* The identity chip: the only thing that really differs. */}
        <group position={[-4.9, 0, -0.3]}>
          <RoundedBox args={[1.5, 0.5, 1.5]} radius={0.07} smoothness={3} position={[0, 0.25, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={P.surface} roughness={0.36} metalness={0.05} envMapIntensity={0.95} />
          </RoundedBox>
          <Node3D position={[0, 0.72, 0]} color={P.teal} radius={0.17} faceted />
          <Tag position={[0, 1.15, 0]} tone="ink" size="xs" center>
            {t.idLabel}
          </Tag>

          {/* Hermes mints a child and links it back to its parent. */}
          {childLineage && over ? (
            <group position={[0, 0, 2.6]}>
              <RoundedBox args={[1.5, 0.5, 1.5]} radius={0.07} smoothness={3} position={[0, 0.25, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={P.violetWash} roughness={0.4} envMapIntensity={0.9} />
              </RoundedBox>
              <Node3D position={[0, 0.72, 0]} color={P.violet} radius={0.17} faceted pulse={0.2} />
              <Halo position={[0, 0.72, 0]} radius={0.42} color={P.violet} opacity={0.7} spin={0.4} />
              <Tag position={[0, 1.15, 0]} tone="violet" size="xs" center>
                {t.idChild}
              </Tag>
              <AxisLine from={[0, 0.72, -1.3]} to={[0, 0.72, -0.2]} overrun={0} color={P.violet} opacity={0.6} />
            </group>
          ) : (
            <Tag position={[0, 0.35, 1.35]} tone="teal" size="xs" center>
              {t.idSame}
            </Tag>
          )}
        </group>

        <IsoDust count={22} center={[0, 1.1, 0]} spread={[3.4, 0.6, 2.4]} />
      </Stage>
    </Figure>
  );
}

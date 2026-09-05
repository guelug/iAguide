"use client";

import { RoundedBox } from "@react-three/drei";
import { useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag } from "@/components/three/atoms";
import { AxisLine, ISO_CAMERA, IsoDust, IsoFrame } from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * One user turn, billed as the calls it really is.
 *
 * The section's whole point is a denominator: a turn is not a call, and
 * the fixed prefix is paid again on every one of them. Drawn as a row of
 * slips, that stops being an argument and becomes a shape — the bottom
 * band is identical on every slip, and it is the tallest thing in the
 * picture by the time you have six.
 *
 * The numbers are the section's own worked example: six calls, a 4k
 * system-plus-tools prefix re-sent each time, history starting at 2k and
 * growing, 500 tokens of fresh tool JSON, 400 tokens out. They are
 * recomputed here rather than quoted, and they reproduce the two figures
 * the prose states: 24k of prefix and 2.4k of output.
 *
 * No price is shown. The section is explicit that caching bills the
 * prefix at a cached rate without naming one, so the readout counts
 * tokens eligible for that rate and stops there.
 */

type Cache = "none" | "warm" | "rotated";

/** The worked example's assumptions, all stated in the section. */
const PREFIX = 4000;
const HIST0 = 2000;
const HIST_STEP = 500;
const TOOL_JSON = 500;
const OUT = 400;
/** Where the 429 lands when the pool rotates, in call numbers. */
const ROTATE_AT = 4;

const UNIT = 1 / 5200;

const COPY = {
  en: {
    title: "a user turn is not a call",
    hint: "drag the calls · the bottom band is the same prefix, paid again",
    none: "no cache",
    warm: "cache alive",
    rotated: "the pool rotates",
    legendPrefix: "fixed prefix, full price",
    legendCached: "prefix at cached rate",
    legendHistory: "growing history",
    calls: "calls",
    call: "call",
    tokens: "tokens this turn",
    resent: "input that is re-sent prefix",
    vsOne: "vs assuming one call",
    eligible: "eligible for cached rate",
    tools: "tool JSON",
    out: "output",
    rotate: "429 · new key, cold cache",
    noneNote:
      "six calls, and the 4k system-and-tools prefix rides along on every one of them. That is 24k of input before any history, and history is climbing too. The turn costs 48.9k tokens where a reader who assumed a turn was a call would have budgeted 6.9k.",
    warmNote:
      "with a prompt cache alive on this key, the first call pays the prefix and the rest can bill it at the cached rate. Nothing about the token count changes — the same bytes cross the wire — but the share of them at full price collapses.",
    rotatedNote:
      "the pool rotating on a 429 keeps the session alive and costs a full-price pass: the new key has a cold cache, so that call re-reads everything at undiscounted input. Rotation is not free, it is cheaper than dying. That is the documented wording, not a metaphor.",
  },
  es: {
    title: "un turno de usuario no es una llamada",
    hint: "mueve las llamadas · la banda de abajo es el mismo prefijo, pagado otra vez",
    none: "sin caché",
    warm: "caché viva",
    rotated: "el pool rota",
    legendPrefix: "prefijo fijo, precio completo",
    legendCached: "prefijo a tarifa cacheada",
    legendHistory: "historia creciente",
    calls: "llamadas",
    call: "llamada",
    tokens: "tokens del turno",
    resent: "entrada que es prefijo reenviado",
    vsOne: "frente a suponer una llamada",
    eligible: "elegible para tarifa cacheada",
    tools: "JSON de tools",
    out: "salida",
    rotate: "429 · clave nueva, caché fría",
    noneNote:
      "seis llamadas, y el prefijo de system y tools de 4k viaja en todas. Son 24k de entrada antes de cualquier historia, y la historia también sube. El turno cuesta 48,9k tokens donde quien supuso que un turno era una llamada habría presupuestado 6,9k.",
    warmNote:
      "con una caché de prompt viva en esta clave, la primera llamada paga el prefijo y las demás pueden facturarlo a tarifa cacheada. El recuento de tokens no cambia — cruzan los mismos bytes — pero la porción a precio completo se desploma.",
    rotatedNote:
      "que el pool rote ante un 429 mantiene viva la sesión y cuesta un pase a precio completo: la clave nueva tiene la caché fría, así que esa llamada relee todo a entrada sin descuento. Rotar no es gratis, es más barato que morir. Esa es la redacción documentada, no una metáfora.",
  },
};

/** One model call, drawn as what it bills. */
function Slip({
  x,
  index,
  cached,
  rotation,
}: {
  x: number;
  index: number;
  cached: boolean;
  rotation: boolean;
}) {
  const w = 0.62;

  /* Bands are laid out by scanning the list, not by mutating a cursor
     while rendering — the compiler treats that as an impure render. */
  const bands = [
    { h: PREFIX * UNIT, color: cached ? P.teal : P.rose },
    { h: (HIST0 + HIST_STEP * index) * UNIT, color: P.amber },
    { h: TOOL_JSON * UNIT, color: P.violet },
  ];
  const offsets = bands.reduce<number[]>(
    (acc, b) => [...acc, acc[acc.length - 1] + b.h],
    [0],
  );
  const stack = offsets[offsets.length - 1];

  return (
    <group position={[x, 0, 0]}>
      {bands.map((b, i) => (
        <RoundedBox
          key={i}
          args={[w, b.h, w]}
          radius={0.02}
          smoothness={2}
          position={[0, offsets[i] + b.h / 2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={b.color}
            roughness={0.38}
            metalness={0.05}
            envMapIntensity={0.9}
          />
        </RoundedBox>
      ))}
      {/* Output floats clear of the input stack: it is billed apart. */}
      <RoundedBox
        args={[w * 0.8, OUT * UNIT, w * 0.8]}
        radius={0.02}
        smoothness={2}
        position={[0, stack + 0.18 + (OUT * UNIT) / 2, 0]}
        castShadow
      >
        <meshStandardMaterial color={P.inkSoft} roughness={0.42} metalness={0.04} />
      </RoundedBox>
      {rotation ? (
        <>
          <Node3D position={[-0.55, stack + 0.55, 0]} color={P.rose} radius={0.11} faceted />
          <Halo position={[-0.55, stack + 0.55, 0]} radius={0.32} color={P.rose} opacity={0.8} spin={0.6} />
        </>
      ) : null}
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [cache, setCache] = useState<Cache>("none");
  const [calls, setCalls] = useState(6);

  /* Recomputed, not quoted: at six calls this reproduces the section's
     own 24k of prefix and 2.4k of output. */
  let prefix = 0;
  let hist = 0;
  let tools = 0;
  let out = 0;
  for (let i = 0; i < calls; i++) {
    prefix += PREFIX;
    hist += HIST0 + HIST_STEP * i;
    tools += TOOL_JSON;
    out += OUT;
  }
  const input = prefix + hist + tools;
  const total = input + out;
  const oneCall = PREFIX + HIST0 + TOOL_JSON + OUT;

  /* A call bills the prefix at the cached rate when a live cache has
     already seen it. The first call never can, and the call that lands
     on a freshly rotated key cannot either. */
  const rotates = cache === "rotated" && calls >= ROTATE_AT;
  const cachedCalls =
    cache === "none" ? 0 : Math.max(0, calls - 1 - (rotates ? 1 : 0));
  const eligible = cachedCalls * PREFIX;

  const isCached = (i: number) => {
    if (cache === "none" || i === 0) return false;
    if (rotates && i === ROTATE_AT - 1) return false;
    return true;
  };

  const note = cache === "none" ? t.noneNote : cache === "warm" ? t.warmNote : t.rotatedNote;
  const span = Math.min(9.4, calls * 1.05);

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.rose, label: t.legendPrefix },
        { color: P.teal, label: t.legendCached },
        { color: P.amber, label: t.legendHistory },
      ]}
      controls={
        <>
          <Switcher
            value={cache}
            onChange={setCache}
            options={[
              { value: "none", label: t.none, tone: P.rose },
              { value: "warm", label: t.warm, tone: P.teal },
              { value: "rotated", label: t.rotated, tone: P.amber },
            ]}
            ariaLabel={t.title}
          />
          <Knob
            label={t.calls}
            value={calls}
            min={1}
            max={10}
            step={1}
            onChange={setCalls}
            tone={P.violet}
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
                  label: t.tokens,
                  value: `${(total / 1000).toFixed(1)}k`,
                  tone: "var(--ink-soft)",
                },
                {
                  label: t.resent,
                  value: `${Math.round((100 * prefix) / input)}%`,
                  tone: "var(--rose)",
                },
                {
                  label: t.vsOne,
                  value: `×${(total / oneCall).toFixed(1)}`,
                  tone: "var(--violet)",
                },
                {
                  label: t.eligible,
                  value: eligible ? `${(eligible / 1000).toFixed(0)}k` : "0",
                  tone: eligible ? "var(--teal)" : "var(--muted)",
                },
              ]}
            />
          </div>
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.16}>
        <IsoFrame width={13} depth={8} y={-0.05} />

        {Array.from({ length: calls }, (_, i) => (
          <Slip
            key={i}
            x={-span / 2 + (calls === 1 ? span / 2 : (i * span) / (calls - 1))}
            index={i}
            cached={isCached(i)}
            rotation={rotates && i === ROTATE_AT - 1}
          />
        ))}

        {/* The prefix band, called out once rather than on every slip:
            repeating the label is what the point is about, but eight
            copies of it is unreadable. */}
        <AxisLine
          from={[-span / 2 - 0.7, PREFIX * UNIT, 0]}
          to={[span / 2 + 0.7, PREFIX * UNIT, 0]}
          overrun={0.2}
          color={P.lineStrong}
          opacity={0.45}
          dashed
        />
        <Tag position={[0, PREFIX * UNIT + 0.3, 2.6]} tone="ink" size="xs" center>
          {cache === "none" ? t.legendPrefix : t.legendCached} · 4k
        </Tag>

        <Tag position={[-span / 2, -0.35, 0]} tone="muted" size="xs" center>
          {t.call} 1
        </Tag>
        {calls > 1 ? (
          <Tag position={[span / 2, -0.35, 0]} tone="muted" size="xs" center>
            {t.call} {calls}
          </Tag>
        ) : null}

        {rotates ? (
          <Tag
            position={[-span / 2 + ((ROTATE_AT - 1) * span) / Math.max(1, calls - 1), 2.9, 0]}
            tone="rose"
            size="xs"
            center
          >
            {t.rotate}
          </Tag>
        ) : null}

        <IsoDust count={18} center={[0, 1.4, 0]} spread={[4, 0.7, 1.4]} />
      </Stage>
    </Figure>
  );
}

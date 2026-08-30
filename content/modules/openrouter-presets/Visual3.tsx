"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
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
 * A preference is not an obligation, and the difference has teeth.
 *
 * The section says it plainly and then moves on: preferred_min_throughput
 * and preferred_max_latency sort and deprioritise, while max_price,
 * data_collection, ZDR and the allow/deny lists can make a request
 * impossible and error. Two classes of knob doing visibly different
 * things to the same rank of endpoints is the fastest way to keep them
 * apart.
 */

type Knob = "sort" | "throughput" | "price" | "priceLow" | "zdr";

/** One endpoint OpenRouter could route this model to. */
type Endpoint = {
  id: string;
  price: number;
  throughput: number;
  zdr: boolean;
};

const ENDPOINTS: Endpoint[] = [
  { id: "A", price: 0.4, throughput: 90, zdr: false },
  { id: "B", price: 0.9, throughput: 140, zdr: true },
  { id: "C", price: 1.6, throughput: 210, zdr: true },
  { id: "D", price: 2.4, throughput: 60, zdr: false },
];

const COPY = {
  en: {
    title: "sorting versus refusing",
    hint: "soft knobs reorder the rank · hard knobs can empty it",
    sort: "sort: price",
    throughput: "preferred_min_throughput",
    price: "max_price $1",
    priceLow: "max_price $0.2",
    zdr: "ZDR required",
    legendSoft: "reorders",
    legendHard: "removes",
    legendOut: "no longer eligible",
    endpoints: "endpoints for this model",
    surviving: "still eligible",
    impossible: "request impossible",
    routed: "routed to",
    kind: "knob",
    soft: "preference",
    hard: "filter",
    sortNote:
      "sort is a preference. It changes which endpoint goes first and nothing else — every endpoint is still eligible, so the request cannot fail because of it.",
    throughputNote:
      "preferred_min_throughput deprioritises the endpoints below the bar rather than removing them. They drop to the back of the rank and are still there if the ones above fail.",
    priceNote:
      "max_price is a filter. Endpoints above the ceiling stop being eligible at all, and if the ceiling is low enough the rank empties and the request errors instead of quietly costing more.",
    zdrNote:
      "zero data retention is a filter too. It is not a tie-breaker: an endpoint that does not offer ZDR is removed, and a model whose only endpoints lack it becomes unreachable under this preset.",
  },
  es: {
    title: "ordenar frente a rechazar",
    hint: "los mandos blandos reordenan · los duros pueden vaciar la lista",
    sort: "sort: precio",
    throughput: "preferred_min_throughput",
    price: "max_price $1",
    priceLow: "max_price $0.2",
    zdr: "ZDR obligatorio",
    legendSoft: "reordena",
    legendHard: "elimina",
    legendOut: "ya no elegible",
    endpoints: "endpoints para este modelo",
    surviving: "siguen elegibles",
    impossible: "petición imposible",
    routed: "va a",
    kind: "mando",
    soft: "preferencia",
    hard: "filtro",
    sortNote:
      "sort es una preferencia. Cambia cuál va primero y nada más — todos los endpoints siguen siendo elegibles, así que la petición no puede fallar por su culpa.",
    throughputNote:
      "preferred_min_throughput deprioriza los endpoints por debajo del listón en vez de quitarlos. Caen al final del orden y siguen ahí si fallan los de arriba.",
    priceNote:
      "max_price es un filtro. Los endpoints por encima del techo dejan de ser elegibles, y si el techo es bajo la lista se vacía y la petición da error en vez de costarte más en silencio.",
    zdrNote:
      "la retención cero de datos también es un filtro. No es un desempate: un endpoint que no ofrece ZDR se elimina, y un modelo cuyos únicos endpoints no lo ofrecen queda inalcanzable bajo este preset.",
  },
};

/** An endpoint card: its rank position, and whether it is still in play. */
function Card({
  ep,
  rank,
  out,
  reason,
}: {
  ep: Endpoint;
  rank: number;
  out: boolean;
  reason: string;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    // Rank is a position, so a re-sort is something you watch happen.
    g.position.z = MathUtils.damp(g.position.z, -2.4 + rank * 1.6, 5, dt);
    g.position.y = MathUtils.damp(g.position.y, out ? -0.35 : 0, 5, dt);
  });

  return (
    <group ref={ref} position={[0, 0, -2.4 + rank * 1.6]}>
      <RoundedBox args={[3.4, 0.38, 1.15]} radius={0.07} smoothness={3} position={[0, 0.19, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color={out ? P.sunken : rank === 0 ? P.teal : P.surface}
          transparent
          opacity={out ? 0.5 : 1}
          roughness={0.36}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>
      {/* A struck-out card is not a slower option, it is gone. */}
      {out ? (
        <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.08, 3.2, 0.08]} />
          <meshBasicMaterial color={P.rose} />
        </mesh>
      ) : null}
      <Tag position={[-2.1, 0.25, 0]} tone={out ? "muted" : "ink"} size="xs" center>
        {ep.id}
      </Tag>
      <Tag position={[2.3, 0.25, 0]} tone={out ? "rose" : "muted"} size="xs">
        {out ? reason : `$${ep.price.toFixed(1)} · ${ep.throughput} tok/s`}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [knob, setKnob] = useState<Knob>("sort");

  /* Soft knobs reorder; hard knobs remove. Keeping the two operations
     literally separate in the code is the point of the figure. */
  const isHard = knob === "price" || knob === "priceLow" || knob === "zdr";
  const priceCap = knob === "priceLow" ? 0.2 : 1.0;
  const minThroughput = 100;

  const removed = (e: Endpoint) =>
    knob === "price" || knob === "priceLow"
      ? e.price > priceCap
      : knob === "zdr"
        ? !e.zdr
        : false;

  const eligible = ENDPOINTS.filter((e) => !removed(e));
  const ranked = [...ENDPOINTS].sort((a, b) => {
    const aOut = removed(a) ? 1 : 0;
    const bOut = removed(b) ? 1 : 0;
    if (aOut !== bOut) return aOut - bOut;
    if (knob === "throughput") {
      // Below the bar is deprioritised, not dropped.
      const aLow = a.throughput < minThroughput ? 1 : 0;
      const bLow = b.throughput < minThroughput ? 1 : 0;
      if (aLow !== bLow) return aLow - bLow;
      return b.throughput - a.throughput;
    }
    return a.price - b.price;
  });

  const impossible = eligible.length === 0;
  const note =
    knob === "sort"
      ? t.sortNote
      : knob === "throughput"
        ? t.throughputNote
        : knob === "price" || knob === "priceLow"
          ? t.priceNote
          : t.zdrNote;

  const reason = knob === "zdr" ? "no ZDR" : `> $${priceCap.toFixed(1)}`;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendSoft },
        { color: P.rose, label: t.legendHard },
        { color: P.line, label: t.legendOut },
      ]}
      controls={
        <Switcher
          value={knob}
          onChange={setKnob}
          options={[
            { value: "sort", label: t.sort, tone: P.teal },
            { value: "throughput", label: t.throughput, tone: P.teal },
            { value: "price", label: t.price, tone: P.rose },
            { value: "priceLow", label: t.priceLow, tone: P.rose },
            { value: "zdr", label: t.zdr, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                { label: t.kind, value: isHard ? t.hard : t.soft, tone: isHard ? "var(--rose)" : "var(--teal)" },
                {
                  label: t.surviving,
                  value: `${eligible.length} / ${ENDPOINTS.length}`,
                  tone: impossible ? "var(--rose)" : "var(--teal)",
                },
                {
                  label: t.routed,
                  value: impossible ? t.impossible : ranked[0].id,
                  tone: impossible ? "var(--rose)" : "var(--ink)",
                },
              ]}
            />
          </div>
        </>
      }
      height="h-[390px] md:h-[480px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={13} depth={10} y={-0.05} />

        <Tag position={[0, 0.2, -3.6]} tone="muted" size="xs" center>
          {t.endpoints}
        </Tag>

        {ranked.map((ep, rank) => (
          <Card
            key={ep.id}
            ep={ep}
            rank={rank}
            out={removed(ep)}
            reason={reason}
          />
        ))}

        {/* The request, arriving at whatever is left at the top. */}
        <group position={[-4.4, 0, -2.4]}>
          <RoundedBox args={[1.2, 0.5, 1.2]} radius={0.07} smoothness={3} position={[0, 0.25, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={P.surface} roughness={0.36} metalness={0.05} envMapIntensity={0.95} />
          </RoundedBox>
          <Node3D
            position={[0, 0.75, 0]}
            color={impossible ? P.rose : P.teal}
            radius={0.16}
            faceted
            pulse={impossible ? 0 : 0.2}
          />
          {impossible ? <Halo position={[0, 0.75, 0]} radius={0.44} color={P.rose} opacity={0.8} spin={0.6} /> : null}
          <AxisLine
            from={[0.7, 0.4, 0]}
            to={[-1.8, 0.4, 0]}
            overrun={0}
            color={impossible ? P.rose : P.teal}
            opacity={0.7}
            dashed={impossible}
          />
        </group>

        {impossible ? (
          <Tag position={[0, 1.2, 0]} tone="rose" size="sm" center>
            {t.impossible}
          </Tag>
        ) : null}

        <IsoDust count={20} center={[0, 1, 0]} spread={[3.4, 0.6, 2.6]} />
      </Stage>
    </Figure>
  );
}

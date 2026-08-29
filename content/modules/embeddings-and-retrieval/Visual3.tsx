"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { DoubleSide, MathUtils, Quaternion, Vector3, type Group } from "three";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Bars,
  Halo,
  Node3D,
  PointerTilt,
  Tag,
  hash,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Why cosine and euclidean retrieve different documents.
 *
 * Every document is a real vector here, the neighbourhoods are the real
 * shapes each metric defines — a cone from the origin for cosine, a ball
 * around the query for euclidean — and the counts under the scene are
 * computed from those shapes, not asserted. The punchline is the rose
 * number: on-topic documents that euclidean drops purely for being short.
 */

type Mode = "cosine" | "euclid" | "unit";

const COPY = {
  en: {
    title: "the shape of a neighbourhood",
    hint: "same documents, same query — two metrics, two different answers",
    cosine: "Cosine",
    euclid: "Euclidean",
    unit: "Normalised",
    legendHit: "retrieved",
    legendMiss: "not retrieved",
    legendQuery: "query",
    threshold: "threshold",
    query: "query",
    retrieved: "retrieved",
    onTopic: "on-topic",
    dropped: "on-topic, dropped",
    cosineNote:
      "cosine only looks at direction, so a two-line note and a long essay about the same thing score the same",
    euclidNote:
      "euclidean measures the gap between the points, so it quietly prefers documents whose length happens to match the query's",
    unitNote:
      "normalise every vector to length 1 and the two metrics agree exactly — which is why most vector stores store them that way",
  },
  es: {
    title: "la forma de un vecindario",
    hint: "mismos documentos, misma consulta — dos métricas, dos respuestas distintas",
    cosine: "Coseno",
    euclid: "Euclídea",
    unit: "Normalizado",
    legendHit: "recuperado",
    legendMiss: "no recuperado",
    legendQuery: "consulta",
    threshold: "umbral",
    query: "consulta",
    retrieved: "recuperados",
    onTopic: "del tema",
    dropped: "del tema, descartados",
    cosineNote:
      "el coseno solo mira la dirección, así que una nota de dos líneas y un ensayo largo sobre lo mismo puntúan igual",
    euclidNote:
      "la euclídea mide la distancia entre los puntos, así que prefiere en silencio los documentos cuya longitud se parece a la de la consulta",
    unitNote:
      "normaliza cada vector a longitud 1 y las dos métricas coinciden exactamente — por eso casi todos los almacenes vectoriales los guardan así",
  },
};

const N = 54;
const QUERY_DIR = new Vector3(0.62, 0.36, 0.7).normalize();
const QUERY_LEN = 1.75;
const QUERY = QUERY_DIR.clone().multiplyScalar(QUERY_LEN);
/** A document is "on topic" if its direction is close to the query's. */
const TOPIC_COS = 0.86;

/** Rotation that points a +Y cone down the query direction. */
const CONE_Q = new Quaternion()
  .setFromUnitVectors(new Vector3(0, 1, 0), QUERY_DIR)
  .toArray() as [number, number, number, number];

type Doc = { v: Vector3; unit: Vector3; cos: number; onTopic: boolean };

const DOCS: Doc[] = Array.from({ length: N }, (_, i) => {
  // A blob that is denser near the query direction, with lengths spread
  // wide — short notes and long documents about the same subject.
  const bias = i % 3 === 0 ? 0.75 : 0;
  const dir = new Vector3(
    hash(i, 1) * 2 - 1 + QUERY_DIR.x * bias,
    hash(i, 2) * 2 - 1 + QUERY_DIR.y * bias,
    hash(i, 3) * 2 - 1 + QUERY_DIR.z * bias,
  );
  if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
  dir.normalize();
  const len = 0.35 + Math.pow(hash(i, 4), 1.6) * 2.35;
  const v = dir.clone().multiplyScalar(len);
  const cos = dir.dot(QUERY_DIR);
  return { v, unit: dir, cos, onTopic: cos >= TOPIC_COS };
});

/** Points glide between raw position and the unit sphere. */
function Cloud({
  mode,
  hits,
}: {
  mode: Mode;
  hits: boolean[];
}) {
  const group = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const doc = DOCS[i];
      if (!doc) return;
      const to = mode === "unit" ? doc.unit : doc.v;
      child.position.x = MathUtils.damp(child.position.x, to.x, 5, dt);
      child.position.y = MathUtils.damp(child.position.y, to.y, 5, dt);
      child.position.z = MathUtils.damp(child.position.z, to.z, 5, dt);
    });
  });

  return (
    <group ref={group}>
      {DOCS.map((doc, i) => {
        const hit = hits[i];
        const missed = doc.onTopic && !hit;
        return (
          <group key={i} position={[doc.v.x, doc.v.y, doc.v.z]}>
            <Node3D
              position={[0, 0, 0]}
              color={missed ? P.rose : hit ? P.teal : P.line}
              radius={hit || missed ? 0.075 : 0.05}
              matte={!hit && !missed}
            />
          </group>
        );
      })}
    </group>
  );
}

/** The cosine neighbourhood: a cone opening from the origin. */
function Cone({ halfAngle }: { halfAngle: number }) {
  const h = 2.9;
  const r = Math.tan(halfAngle) * h;
  return (
    <group
      position={[(QUERY_DIR.x * h) / 2, (QUERY_DIR.y * h) / 2, (QUERY_DIR.z * h) / 2]}
      quaternion={CONE_Q}
    >
      <mesh>
        <coneGeometry args={[r, h, 40, 1, true]} />
        <meshStandardMaterial
          color={P.teal}
          transparent
          opacity={0.16}
          roughness={0.7}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh>
        <coneGeometry args={[r, h, 24, 1, true]} />
        <meshBasicMaterial color={P.teal} wireframe transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

/** The euclidean neighbourhood: a ball around the query point. */
function Ball({ radius, at }: { radius: number; at: Vector3 }) {
  return (
    <group position={[at.x, at.y, at.z]}>
      <mesh>
        <sphereGeometry args={[radius, 32, 24]} />
        <meshStandardMaterial
          color={P.amber}
          transparent
          opacity={0.14}
          roughness={0.7}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius, 20, 14]} />
        <meshBasicMaterial color={P.amber} wireframe transparent opacity={0.24} />
      </mesh>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("cosine");
  const [threshold, setThreshold] = useState(80);

  // One knob, read by whichever metric is on screen.
  const cosMin = threshold / 100;
  const ballR = (1 - threshold / 100) * 3.4 + 0.35;
  const halfAngle = Math.acos(MathUtils.clamp(cosMin, -1, 1));

  /* On unit vectors ||a-b||^2 = 2 - 2cos, so this radius is the exact
     euclidean twin of the cosine threshold. The "normalised" mode draws a
     ball with it and selects by distance — and lands on the same
     documents the cone did, which is the whole claim. */
  const unitR = Math.sqrt(Math.max(0, 2 - 2 * cosMin));

  const { hits, nRetrieved, nDropped, nTopic } = useMemo(() => {
    const h = DOCS.map((d) => {
      if (mode === "euclid") return d.v.distanceTo(QUERY) <= ballR;
      if (mode === "unit") return d.unit.distanceTo(QUERY_DIR) <= unitR;
      return d.cos >= cosMin;
    });
    const topic = DOCS.filter((d) => d.onTopic).length;
    return {
      hits: h,
      nRetrieved: h.filter(Boolean).length,
      nDropped: DOCS.filter((d, i) => d.onTopic && !h[i]).length,
      nTopic: topic,
    };
  }, [mode, cosMin, ballR, unitR]);

  const accent = mode === "euclid" ? P.amber : mode === "unit" ? P.violet : P.teal;
  const note = mode === "euclid" ? t.euclidNote : mode === "unit" ? t.unitNote : t.cosineNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendHit },
        { color: P.line, label: t.legendMiss },
        { color: P.rose, label: t.dropped },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "cosine", label: t.cosine, tone: P.teal },
              { value: "euclid", label: t.euclid, tone: P.amber },
              { value: "unit", label: t.unit, tone: P.violet },
            ]}
            ariaLabel={t.title}
          />
          <Knob
            label={t.threshold}
            value={threshold}
            min={50}
            max={97}
            step={1}
            onChange={setThreshold}
            format={(v) => `${(v / 100).toFixed(2)}`}
            tone={accent}
          />
        </>
      }
      note={note}
      height="h-[390px] md:h-[480px]"
    >
      <Stage
        className="h-full w-full"
        camera={{ position: [3.2, 2.2, 4.4], fov: 42 }}
        background={P.paper}
        fit={1.14}
      >
        <PointerTilt amount={0.1}>
          <group position={[0, 0.15, 0]}>
            {/* The origin matters here: cosine is measured from it. */}
            <Node3D position={[0, 0, 0]} color={P.inkSoft} radius={0.06} matte />
            <Halo radius={1} color={P.line} opacity={mode === "unit" ? 0.5 : 0.22} rotation={[0, 0, 0]} />
            <Halo radius={1} color={P.line} opacity={mode === "unit" ? 0.5 : 0.22} rotation={[Math.PI / 2, 0, 0]} />

            <Cloud mode={mode} hits={hits} />

            {mode === "euclid" ? <Ball radius={ballR} at={QUERY} /> : null}
            {mode === "unit" ? <Ball radius={unitR} at={QUERY_DIR} /> : null}
            {mode !== "euclid" ? <Cone halfAngle={halfAngle} /> : null}

            <Arrow
              from={[0, 0, 0]}
              to={[QUERY.x, QUERY.y, QUERY.z]}
              color={P.ink}
              width={2.2}
              head={0.14}
            />
            <Tag position={[QUERY.x * 1.12, QUERY.y * 1.12 + 0.18, QUERY.z * 1.12]} tone="ink" size="xs">
              {t.query}
            </Tag>
          </group>
        </PointerTilt>

        <group position={[0, -2.5, 0]}>
          <Bars
            bars={[
              {
                label: t.retrieved,
                value: nRetrieved / N,
                color: accent,
                note: `${nRetrieved}`,
              },
              { label: t.onTopic, value: nTopic / N, color: P.teal, note: `${nTopic}` },
              {
                label: t.dropped,
                value: nDropped / Math.max(1, nTopic),
                color: P.rose,
                note: `${nDropped}`,
              },
            ]}
            height={0.6}
            width={0.4}
            gap={0.6}
            depth={0.28}
          />
        </group>

      </Stage>
    </Figure>
  );
}

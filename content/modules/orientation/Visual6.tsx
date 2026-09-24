"use client";

import { useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { Figure, Knob } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";
import { useLayoutEffect } from "react";
import { Color, Object3D, type InstancedMesh } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

/* Same prompt, very different answers depending on temperature. The left
   side is the prompt and the next-token bar; the right side is the fan of
   candidate continuations the model considered. Temperature > 0 broadens
   the fan, temperature = 0 collapses it onto the single most likely. */

const COPY = {
  en: {
    title: "same prompt, different answers",
    hint: "raise temperature → fan opens",
    prompt: "prompt",
    candidates: "candidates",
    pick: "picked",
    temp: "temperature",
    oneNote: "temperature 0: always the most likely",
    coolNote: "low: stable, slightly robotic",
    warmNote: "medium: balanced, default for chat",
    hotNote: "high: creative, often strange",
    cred: "VotingLab-style sampling visualisation",
  },
  es: {
    title: "misma pregunta, distinta respuesta",
    hint: "sube la temperatura → el abanico se abre",
    prompt: "prompt",
    candidates: "candidatos",
    pick: "elegida",
    temp: "temperatura",
    oneNote: "temperatura 0: siempre la más probable",
    coolNote: "baja: estable, algo robótica",
    warmNote: "media: equilibrada, la habitual",
    hotNote: "alta: creativa, a menudo rara",
    cred: "visualización estilo VotingLab",
  },
};

const TEMPS = [0, 0.35, 0.7, 1.1];

const CANDIDATES = [
  { token: "París", prob: 0.62, tone: P.teal },
  { token: "Roma", prob: 0.12, tone: P.violet },
  { token: "Berlín", prob: 0.09, tone: P.amber },
  { token: "Madrid", prob: 0.07, tone: P.rose },
  { token: "Lisboa", prob: 0.04, tone: P.tealWash },
  { token: "Viena", prob: 0.03, tone: P.violetWash },
  { token: "Praga", prob: 0.03, tone: P.amberWash },
];

function CandidateBar({
  y,
  candidate,
  spread,
  picked,
  showBar,
}: {
  y: number;
  candidate: (typeof CANDIDATES)[number];
  spread: number;
  picked: boolean;
  showBar: boolean;
}) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[-0.95, 0, 0]}>
        <planeGeometry args={[0.7, 0.18]} />
        <meshBasicMaterial color={P.paper} transparent opacity={0.6} />
      </mesh>
      <Slab
        position={[-0.95, 0, 0.005]}
        size={[0.7, 0.18, 0.01]}
        color={picked ? candidate.tone : P.lineStrong}
        fill={picked ? 0.86 : 0.18}
        rim={0.34}
      />
      <Tag position={[-0.95 + 0.4 * spread, 0, 0.04]} tone="muted" size="xs">
        {candidate.token}
      </Tag>
      {showBar ? (
        <Slab
          position={[-0.95 + 0.42 * spread + 0.05, 0, 0.012]}
          size={[candidate.prob * 2.4 * spread, 0.12, 0.008]}
          color={candidate.tone}
          fill={picked ? 0.94 : 0.62}
          rim={0.18}
        />
      ) : null}
      {picked ? (
        <Halo position={[-0.95 + 0.42 * spread + 0.05 + candidate.prob * 1.2 * spread, 0, 0.02]} radius={0.18} color={candidate.tone} opacity={0.42} spin={0.4} />
      ) : null}
    </group>
  );
}

export default function Visual6() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY);
  const [temp, setTemp] = useState(0.7);

  /* "spread" controls how much of the bar (and the slice widths) gets used.
     temperature 0 collapses everything into the top candidate; temp 1.1 fans
     out the long tail into view. */
  const spread = useMemo(() => {
    const order = TEMPS.indexOf(temp as (typeof TEMPS)[number]);
    const stops = [0.18, 0.34, 0.6, 0.85];
    return stops[order === -1 ? 2 : order];
  }, [temp]);

  const note =
    temp === 0 ? t.oneNote : temp < 0.5 ? t.coolNote : temp < 0.9 ? t.warmNote : t.hotNote;
  const tone = temp < 0.3 ? "teal" : temp < 0.8 ? "amber" : "rose";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.candidates },
        { color: P.amber, label: t.pick },
      ]}
      controls={
        <Knob
          label={t.temp}
          tone={temp < 0.3 ? P.teal : temp < 0.8 ? P.amber : P.rose}
          value={temp}
          min={0}
          max={1.2}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={setTemp}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.2, 7.5], fov: 36 }} background={P.paper} maxDpr={2} fit={1.05}>
        <Motes count={120} radius={6} color={P.lineStrong} size={0.018} opacity={0.2} />

        {/* prompt tag on the left */}
        <group position={[-3.05, 0.05, 0.2]}>
          <RoundedBox args={[1.1, 0.36, 0.06]} radius={0.05} smoothness={3}>
            <meshStandardMaterial color={P.surface} roughness={0.34} metalness={0.05} />
          </RoundedBox>
          <Tag position={[0, 0, 0.04]} tone="ink" size="xs" center>
            capital de Francia ·
          </Tag>
          <Wire
            points={[
              [0.55, -0.02, 0.04],
              [1.55, -0.02, 0.04],
            ]}
            color={P.ink}
            width={1.6}
            opacity={0.7}
          />
          <Node3D position={[1.6, -0.02, 0.04]} color={P.ink} radius={0.045} matte />
          <Tag position={[1.6, 0.18, 0.04]} tone="muted" size="xs" center>
            {t.prompt}
          </Tag>
        </group>

        {/* the fan of candidates on the right */}
        <PointerTilt amount={0.05}>
          <group position={[1.05, 0.4, 0]} rotation={[-0.05, 0, 0]}>
            {/* `showBar` encodes probability-proportional widths; collapse at T=0 */}
            {CANDIDATES.map((c, i) => (
              <CandidateBar
                key={c.token}
                y={(i - (CANDIDATES.length - 1) / 2) * 0.36}
                candidate={c}
                spread={spread}
                showBar={i === 0 ? true : spread > 0.14 + i * 0.06}
                picked={false}
              />
            ))}
            {/* picked indicator moves as temperature rises */}
            <PickedMarker spread={spread} temp={temp} />
          </group>

          {/* ground for the chart */}
          <ShadowBlob position={[0, -1.32, 0]} scale={5.2} opacity={0.07} />

          {/* context note */}
          <Tag position={[0, -1.36, 0.06]} tone={tone} size="sm" center>
            {note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* A small triangle that slides along the bar indicating which candidate was
   picked at the current temperature. At T=0 it always sits on the top one. */
function PickedMarker({ spread, temp }: { spread: number; temp: number }) {
  const ref = useRef<Group>(null);
  const targetIndex = useMemo(() => {
    if (temp < 0.05) return 0;
    if (temp < 0.5) return Math.floor(temp * 1.8);
    if (temp < 0.9) return 2;
    return 4;
  }, [temp]);
  const y = (targetIndex - (CANDIDATES.length - 1) / 2) * 0.36;
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.y = MathUtils.damp(ref.current.position.y, y, 4, dt);
    ref.current.position.x = MathUtils.damp(ref.current.position.x, -0.95 + 0.42 * spread + 0.18 + CANDIDATES[targetIndex].prob * 1.2 * spread, 4, dt);
  });
  return (
    <group ref={ref} position={[-0.95 + 0.42 * spread + 0.18, 0, 0.06]}>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.12, 0.12]} />
        <meshBasicMaterial color={P.ink} />
      </mesh>
      <Halo radius={0.16} color={P.amber} opacity={0.42} spin={0.6} />
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * La urna de la temperatura. Mismo prompt («La capital de Francia es»),
 * mismos logits; la temperatura T reescala: p = softmax(logit / T). La
 * urna tiene 100 bolas repartidas según p (mayores restos) y la bandeja
 * muestra 20 extracciones con una semilla fija: el modelo no cambia de
 * opinión, saca otra bola de la misma urna. T = 0 es voraz: siempre París.
 */

const URN_CANDS = [
  { t: "París", logit: 5.0, color: P.teal },
  { t: "Lyon", logit: 2.3, color: P.violet },
  { t: "Roma", logit: 1.9, color: P.amber },
  { t: "Lisboa", logit: 1.6, color: P.rose },
  { t: "Marsella", logit: 1.3, color: "#4C7A9B" },
  { t: "Atlántida", logit: 0.2, color: P.inkSoft },
];
const BALLS = 100;
const DRAWS = 20;

function urnProbs(T: number) {
  if (T <= 0) return URN_CANDS.map((c, i) => ({ ...c, p: i === 0 ? 1 : 0 }));
  const mx = Math.max(...URN_CANDS.map((c) => c.logit / T));
  const e = URN_CANDS.map((c) => Math.exp(c.logit / T - mx));
  const z = e.reduce((a, b) => a + b, 0);
  return URN_CANDS.map((c, i) => ({ ...c, p: e[i] / z }));
}

/** Largest-remainder apportionment of BALLS balls. */
function ballCounts(ps: number[]) {
  const raw = ps.map((p) => p * BALLS);
  const base = raw.map(Math.floor);
  let left = BALLS - base.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem);
  for (const o of order) {
    if (left <= 0) break;
    base[o.i] += 1;
    left -= 1;
  }
  return base;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawSamples(ps: number[], seed: number) {
  const rnd = mulberry32(seed * 7919 + 17);
  return Array.from({ length: DRAWS }, () => {
    const r = rnd();
    let acc = 0;
    for (let i = 0; i < ps.length; i += 1) {
      acc += ps[i];
      if (r < acc) return i;
    }
    return 0;
  });
}

function UMat({ color, rough = 0.4, coat = 0.5, metal = 0, opacity = 1 }: { color: string; rough?: number; coat?: number; metal?: number; opacity?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.25} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />;
}

const _o = new Object3D();
function Spheres({ items, radius }: { items: { position: V3; color: string }[]; radius: number }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new Color();
    items.forEach((it, i) => {
      _o.position.set(...it.position);
      _o.updateMatrix();
      mesh.setMatrixAt(i, _o.matrix);
      mesh.setColorAt(i, c.set(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} key={items.length} castShadow receiveShadow>
      <sphereGeometry args={[radius, 18, 14]} />
      <meshPhysicalMaterial roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.2} />
    </instancedMesh>
  );
}

const URN = { x: -2.5, r: 1.05, h: 2.4, y0: -1.0 };

function UrnScene({ T, seed }: { T: number; seed: number }) {
  const probs = useMemo(() => urnProbs(T), [T]);
  const counts = useMemo(() => ballCounts(probs.map((p) => p.p)), [probs]);
  const draws = useMemo(() => drawSamples(probs.map((p) => p.p), seed), [probs, seed]);
  const balls = useMemo(() => {
    const colors: string[] = [];
    counts.forEach((n, i) => {
      for (let k = 0; k < n; k += 1) colors.push(URN_CANDS[i].color);
    });
    // Deterministic shuffle so the urn looks mixed, not banded.
    const order = colors.map((c, i) => ({ c, k: hashU(i) })).sort((a, b) => a.k - b.k);
    return order.map((o, i) => {
      const layer = Math.floor(i / 12);
      const a = (i % 12) / 12 * Math.PI * 2 + layer * 0.5;
      const rr = (i % 3 === 0 ? 0.35 : 0.75) * URN.r;
      return { position: [URN.x + Math.cos(a) * rr, URN.y0 + 0.2 + layer * 0.25, Math.sin(a) * rr] as V3, color: o.c };
    });
  }, [counts]);
  const drawn = useMemo(
    () => draws.map((d, i) => ({ position: [-3.4 + (i % 10) * 0.36, -0.88, 1.55 + Math.floor(i / 10) * 0.36] as V3, color: URN_CANDS[d].color })),
    [draws],
  );
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -1.46, 0.4]} scale={9.5} opacity={0.12} />
        <RoundedBox args={[9.8, 0.3, 4.2]} position={[0.4, -1.25, 0.5]} radius={0.15} smoothness={4} castShadow receiveShadow>
          <UMat color="#40362d" rough={0.62} coat={0.2} />
        </RoundedBox>
        <RoundedBox args={[9.5, 0.08, 3.9]} position={[0.4, -1.07, 0.5]} radius={0.04} smoothness={2} receiveShadow>
          <UMat color="#6b513a" rough={0.5} coat={0.25} />
        </RoundedBox>
        {/* the urn */}
        <mesh position={[URN.x, URN.y0 + 0.04, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[URN.r + 0.15, URN.r + 0.2, 0.12, 48]} />
          <UMat color="#b68442" metal={0.6} rough={0.3} coat={0.1} />
        </mesh>
        <mesh position={[URN.x, URN.y0 + URN.h / 2 + 0.1, 0]}>
          <cylinderGeometry args={[URN.r + 0.08, URN.r + 0.08, URN.h, 48, 1, true]} />
          <meshPhysicalMaterial color={P.paper} transparent opacity={0.18} roughness={0.05} clearcoat={1} side={2} depthWrite={false} />
        </mesh>
        <mesh position={[URN.x, URN.y0 + URN.h + 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[URN.r + 0.08, 0.035, 10, 64]} />
          <UMat color="#b68442" metal={0.6} rough={0.3} coat={0.1} />
        </mesh>
        <Spheres items={balls} radius={0.12} />
        <Tag position={[URN.x, URN.y0 + URN.h + 0.5, 0]} tone="ink" center>{T === 0 ? "T = 0 · voraz" : `T = ${T.toLocaleString("es-ES")}`}</Tag>
        {/* probability bars */}
        {probs.map((c, i) => {
          const h = 0.04 + c.p * 2.4;
          const x = -0.3 + i * 0.98;
          return (
            <group key={c.t} position={[x, -1.0, -0.2]}>
              <RoundedBox args={[0.5, h, 0.5]} position={[0, h / 2 + 0.03, 0]} radius={0.05} smoothness={3} castShadow>
                <UMat color={c.color} />
              </RoundedBox>
              <Tag position={[0, h + 0.3 + (i % 2) * 0.32, 0]} tone={i === 0 ? "teal" : "muted"} size="xs" center>{`${c.t} ${(c.p * 100).toLocaleString("es-ES", { maximumFractionDigits: c.p < 0.01 && c.p > 0 ? 1 : 0 })} %`}</Tag>
            </group>
          );
        })}
        {/* the draws */}
        <RoundedBox args={[3.9, 0.08, 0.9]} position={[-1.78, -1.0, 1.73]} radius={0.03} smoothness={2} receiveShadow castShadow>
          <UMat color="#2a2e33" rough={0.5} />
        </RoundedBox>
        <Spheres items={drawn} radius={0.13} />
        <Tag position={[0.55, -0.75, 1.73]} tone="ink" size="xs" center>20 tiradas</Tag>
      </group>
    </PointerTilt>
  );
}

function hashU(i: number) {
  const v = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return v - Math.floor(v);
}

function SpanishVisual() {
  const [T, setT] = useState(0.7);
  const [seed, setSeed] = useState(1);
  const probs = urnProbs(T);
  const counts = ballCounts(probs.map((p) => p.p));
  const draws = drawSamples(probs.map((p) => p.p), seed);
  const notParis = draws.filter((d) => d !== 0).length;
  const pct = (p: number) => `${(p * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`;
  return (
    <Figure
      label="La urna de la temperatura · mismo prompt, otra bola"
      hint="p = softmax(logit / T)"
      legend={URN_CANDS.map((c) => ({ color: c.color, label: c.t }))}
      note={
        <div className="space-y-2">
          <p>
            <strong>«La capital de Francia es…» a T = {T.toLocaleString("es-ES")}.</strong>{" "}
            {T === 0
              ? "Temperatura 0 es voraz: siempre el token más probable. Repetible, pero no por eso cierto."
              : T < 0.5
                ? "Temperatura baja: la urna es casi toda de París."
                : T <= 1
                  ? "Temperatura media: caben Lyon, Roma o Lisboa de vez en cuando, dichas con la misma voz segura."
                  : "Temperatura alta: la urna se iguala y hasta «Atlántida» sale alguna vez."}{" "}
            En estas 20 tiradas, {notParis} no dicen París.
          </p>
          <Readout items={probs.map((c, i) => ({ label: c.t, value: `${pct(c.p)} · ${counts[i]} bolas`, tone: c.color }))} />
          <p className="text-xs text-muted">Logits inventados para la lámina; softmax, reparto de las 100 bolas (mayores restos) y tiradas con semilla fija se calculan en el navegador. «Nueva tirada» cambia la semilla, no la urna. Aleatorio no es creativo, y determinista no es honesto.</p>
        </div>
      }
      controls={
        <>
          <Knob label="temperatura" min={0} max={2} step={0.1} value={T} onChange={(v) => setT(Math.round(v * 10) / 10)} format={(v) => v.toLocaleString("es-ES")} tone={P.rose} />
          <button type="button" className="chip" onClick={() => setSeed((s) => s + 1)}>Nueva tirada</button>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 3.6, 10.5], fov: 34 }} fit={1.05}>
        <UrnScene T={T} seed={seed} />
      </Stage>
    </Figure>
  );
}

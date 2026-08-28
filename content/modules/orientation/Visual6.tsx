"use client";

import { useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { Figure, Knob } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

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

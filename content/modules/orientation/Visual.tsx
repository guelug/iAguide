"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, type ReactNode } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "foundations" | "harness" | "training" | "metal";
type Tone = "teal" | "violet" | "amber" | "rose";

const COPY = {
  en: {
    title: "four tracks, one route",
    hint: "choose a track to inspect its terrain",
    foundations: "foundations",
    harness: "harness",
    training: "training",
    metal: "metal",
    foundationsNote: "learn the language of models",
    harnessNote: "turn a model into a working system",
    trainingNote: "change what the model has learned",
    metalNote: "make the system fit the machine",
    here: "your route starts here",
  },
  es: {
    title: "cuatro vías, una ruta",
    hint: "elige una vía para explorar su terreno",
    foundations: "fundamentos",
    harness: "arnés",
    training: "entrenamiento",
    metal: "metal",
    foundationsNote: "aprende el lenguaje de los modelos",
    harnessNote: "convierte un modelo en un sistema",
    trainingNote: "cambia lo que el modelo ha aprendido",
    metalNote: "haz que el sistema encaje en la máquina",
    here: "tu ruta empieza aquí",
  },
};

const TRACKS: { id: Mode; color: string; tone: Tone; x: number; z: number }[] = [
  { id: "foundations", color: P.teal, tone: "teal", x: -2.4, z: 0.25 },
  { id: "harness", color: P.violet, tone: "violet", x: -0.8, z: -0.15 },
  { id: "training", color: P.amber, tone: "amber", x: 0.8, z: -0.15 },
  { id: "metal", color: P.rose, tone: "rose", x: 2.4, z: 0.25 },
];

function Focus({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const scale = MathUtils.damp(ref.current.scale.x, active ? 1.22 : 1, 5, dt);
    ref.current.scale.setScalar(scale);
    ref.current.position.y = MathUtils.damp(ref.current.position.y, active ? 0.16 : -0.04, 5, dt);
  });
  return <group ref={ref}>{children}</group>;
}

function Pedestal({ color, active }: { color: string; active: boolean }) {
  return (
    <>
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.56, 0.68, 0.18, 48]} />
        <meshStandardMaterial color={active ? color : P.sunken} roughness={0.46} metalness={0.04} />
      </mesh>
      <mesh position={[0, -0.315, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.035, 48]} />
        <meshStandardMaterial color={P.surface} roughness={0.28} metalness={0.08} />
      </mesh>
      {active ? <Halo position={[0, -0.29, 0]} radius={0.62} color={color} opacity={0.58} spin={0.16} /> : null}
    </>
  );
}

function FoundationsIcon({ active }: { active: boolean }) {
  return (
    <>
      <Node3D position={[0, 0.03, 0]} color={P.teal} radius={0.21} pulse={active ? 0.3 : 0} />
      <Halo position={[0, 0.03, 0]} radius={0.38} color={P.teal} opacity={active ? 0.78 : 0.34} spin={0.22} />
      <Halo position={[0, 0.03, 0]} radius={0.47} color={P.tealDeep} opacity={active ? 0.36 : 0.16} rotation={[0, Math.PI / 2, Math.PI / 5]} spin={-0.12} />
      {[[0.41, 0.22], [-0.36, 0.29], [0.08, -0.42]].map(([x, y], i) => (
        <Node3D key={i} position={[x, y, 0.02]} color={P.tealDeep} radius={0.055} matte />
      ))}
    </>
  );
}

function HarnessIcon({ active }: { active: boolean }) {
  const satellites: [number, number, number][] = [[-0.43, 0.24, 0], [0.43, 0.24, 0], [-0.43, -0.14, 0], [0.43, -0.14, 0]];
  return (
    <>
      <RoundedBox position={[0, 0.05, 0]} args={[0.46, 0.46, 0.34]} radius={0.09} smoothness={4}>
        <meshStandardMaterial color={P.violet} roughness={0.3} metalness={0.12} />
      </RoundedBox>
      {satellites.map((point, i) => (
        <group key={i}>
          <Wire points={[[0, 0.05, 0], point]} color={P.violet} opacity={active ? 0.8 : 0.34} width={1.5} />
          <Node3D position={point} color={i % 2 ? P.teal : P.violetDeep} radius={0.07} pulse={active ? i * 0.35 + 0.2 : 0} matte />
        </group>
      ))}
    </>
  );
}

function TrainingIcon({ active }: { active: boolean }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <RoundedBox key={i} position={[0, -0.17 + i * 0.16, -i * 0.025]} args={[0.78 - i * 0.08, 0.1, 0.48]} radius={0.035} smoothness={3}>
          <meshStandardMaterial color={i === 3 ? P.amber : P.amberWash} roughness={0.4} metalness={i === 3 ? 0.08 : 0} />
        </RoundedBox>
      ))}
      <Flow points={[[0, -0.15, 0.27], [0, 0.16, 0.27], [0, 0.48, 0.08]]} color={P.amber} count={active ? 4 : 2} speed={0.28} size={0.035} lineOpacity={0.3} />
      <Node3D position={[0, 0.5, 0.06]} color={P.amberDeep} radius={0.075} pulse={active ? 0.2 : 0} />
    </>
  );
}

function MetalIcon({ active }: { active: boolean }) {
  const pins = [-0.34, -0.12, 0.12, 0.34];
  return (
    <>
      <RoundedBox position={[0, 0.05, 0]} args={[0.74, 0.54, 0.16]} radius={0.07} smoothness={4}>
        <meshStandardMaterial color={P.inkSoft} roughness={0.3} metalness={0.3} />
      </RoundedBox>
      <RoundedBox position={[0, 0.055, 0.09]} args={[0.38, 0.27, 0.045]} radius={0.04} smoothness={3}>
        <meshStandardMaterial color={P.rose} roughness={0.34} metalness={0.16} />
      </RoundedBox>
      {pins.map((x) => (
        <group key={x}>
          <Ribbon points={[[x, -0.31, 0], [x, -0.22, 0]]} color={P.rose} radius={0.018} />
          <Ribbon points={[[x, 0.32, 0], [x, 0.4, 0]]} color={P.rose} radius={0.018} />
        </group>
      ))}
      {active ? <Halo position={[0, 0.05, 0]} radius={0.5} color={P.rose} opacity={0.34} rotation={[Math.PI / 2.7, 0, 0]} spin={-0.18} /> : null}
    </>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("foundations");
  const note = t[`${mode}Note` as keyof typeof t];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={TRACKS.map((track) => ({ color: track.color, label: t[track.id] }))}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={TRACKS.map((track) => ({ value: track.id, label: t[track.id], tone: track.color }))}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.45, 7.5], fov: 34 }} background={P.paper} maxDpr={2} fit={1.05}>
        <Motes count={150} radius={7} color={P.lineStrong} size={0.025} opacity={0.24} />
        <PointerTilt amount={0.09}>
          <group rotation={[-0.1, 0, 0]} position={[0, 0.18, 0]}>
            <Ribbon
              points={TRACKS.map((track, i) => [track.x, -0.45, track.z + (i % 2 ? -0.08 : 0.08)])}
              color={P.lineStrong}
              radius={0.025}
              opacity={0.72}
            />
            <Flow
              points={TRACKS.map((track, i) => [track.x, -0.43, track.z + (i % 2 ? -0.08 : 0.08)])}
              color={TRACKS.find((track) => track.id === mode)?.color ?? P.teal}
              count={7}
              speed={0.12}
              size={0.042}
              lineOpacity={0}
            />
            {TRACKS.map((track) => {
              const active = track.id === mode;
              return (
                <group
                  key={track.id}
                  position={[track.x, 0, track.z]}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMode(track.id);
                  }}
                  onPointerOver={() => {
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={() => {
                    document.body.style.cursor = "auto";
                  }}
                >
                  <Pedestal color={track.color} active={active} />
                  <ShadowBlob position={[0, -0.53, 0]} scale={1.5} opacity={active ? 0.13 : 0.08} />
                  <Focus active={active}>
                    {track.id === "foundations" ? <FoundationsIcon active={active} /> : null}
                    {track.id === "harness" ? <HarnessIcon active={active} /> : null}
                    {track.id === "training" ? <TrainingIcon active={active} /> : null}
                    {track.id === "metal" ? <MetalIcon active={active} /> : null}
                  </Focus>
                  <Tag position={[0, 0.82, 0.16]} tone={track.tone} size="xs" center>
                    {t[track.id]}
                  </Tag>
                </group>
              );
            })}
            <ShadowBlob position={[0, -0.56, 0]} scale={4.6} opacity={0.06} />
          </group>
          <Slab position={[0, -1.17, 0]} size={[4.5, 0.38, 0.04]} color={TRACKS.find((track) => track.id === mode)?.color ?? P.teal} fill={0.08} rim={0.34} />
          <Tag position={[0, -1.16, 0.08]} tone={TRACKS.find((track) => track.id === mode)?.tone ?? "teal"} size="xs" center>
            {mode === "foundations" ? `${t.here} · ${note}` : note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

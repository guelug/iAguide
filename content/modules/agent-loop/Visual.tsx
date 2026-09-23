"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { Group } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Arrow, Marker, PointerTilt, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "intake" | "assemble" | "model" | "tools" | "persist";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "the_agent_loop": "The agent loop",
      "step_the_diagram": "step the diagram",
      "intake": "intake",
      "assemble": "assemble",
      "model": "model",
      "persist": "persist",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "the_agent_loop": "El bucle del agente",
      "step_the_diagram": "recorre el diagrama",
      "intake": "entrada",
      "assemble": "ensambla",
      "model": "modelo",
      "persist": "persiste",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "intake" as const, label: t.intake, tone: "var(--teal)" },
    { value: "assemble" as const, label: t.assemble, tone: "var(--teal)" },
    { value: "model" as const, label: t.model, tone: "var(--amber)" },
    { value: "tools" as const, label: "tools", tone: "var(--violet)" },
    { value: "persist" as const, label: t.persist, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("intake");

  return (
    <Figure
      label={t.the_agent_loop}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="agent-loop diagram steps"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.4], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} t={t} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active, t }: { active: Step; t: Record<string, string> }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "intake" ? P.teal : P.lineStrong}
        fill={active === "intake" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.intake}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "assemble" ? P.amber : P.lineStrong}
        fill={active === "assemble" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.assemble}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "model" ? P.violet : P.lineStrong}
        fill={active === "model" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.model}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "tools" ? P.teal : P.lineStrong}
        fill={active === "tools" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        tools
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "persist" ? P.amber : P.lineStrong}
        fill={active === "persist" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.persist}</Tag>
    </group>
  );
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Un turno del arnés en cinco estaciones. El contexto se mide en tokens
   didácticos: cada ronda de herramientas añade una Action y una
   Observation, y la siguiente llamada al modelo vuelve a pagar el prefill
   del contexto entero (sin caché de prefijo). */

type LoopStep = "intake" | "assemble" | "model" | "tools" | "persist";
const LOOP_STEPS: LoopStep[] = ["intake", "assemble", "model", "tools", "persist"];
const STEP_LABEL: Record<LoopStep, string> = {
  intake: "1 · Entrada",
  assemble: "2 · Armar",
  model: "3 · Modelo",
  tools: "4 · Herramientas",
  persist: "5 · Persistir",
};

const CONTEXT_BLOCKS = [
  { id: "system", label: "política de sistema", tokens: 1200, color: P.teal },
  { id: "skills", label: "skills", tokens: 900, color: mixHex(P.teal, P.paper, 0.35) },
  { id: "memory", label: "memoria durable", tokens: 400, color: P.violet },
  { id: "recent", label: "turnos recientes", tokens: 2600, color: mixHex(P.inkSoft, P.paper, 0.25) },
  { id: "message", label: "mensaje nuevo", tokens: 60, color: P.amber },
];
const ACTION_TOKENS = 90;
const OBSERVATION_TOKENS = 350;
const ANSWER_TOKENS = 180;
const TOKEN_HEIGHT = 0.00021; // unidades de escena por token
const fmtN = (n: number) => new Intl.NumberFormat("es-ES").format(n);

function simulateTurn(rounds: number) {
  const base = CONTEXT_BLOCKS.reduce((sum, block) => sum + block.tokens, 0);
  const perRound = ACTION_TOKENS + OBSERVATION_TOKENS;
  const calls = Array.from({ length: rounds + 1 }, (_, i) => base + i * perRound);
  const totalPrefill = calls.reduce((sum, value) => sum + value, 0);
  return {
    base,
    perRound,
    calls,
    totalPrefill,
    lastPrefill: calls[calls.length - 1],
    ratio: totalPrefill / base,
    persisted: 2 + rounds * 2,
    finalContext: base + rounds * perRound + ANSWER_TOKENS,
  };
}

const ST = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  brass: "#B68442",
  steel: "#9EA5A2",
  charcoal: "#24292B",
};

const STATION_X: Record<LoopStep, V3> = {
  intake: [-4.5, 0, 0.35],
  assemble: [-2.25, 0, 0.35],
  model: [0.15, 0, 0.35],
  tools: [2.25, 0, -1.25],
  persist: [4.45, 0, 0.35],
};

function Bench() {
  return (
    <group>
      <ShadowBlob position={[0, -0.62, 0]} scale={12.5} opacity={0.12} />
      <RoundedBox args={[11.6, 0.34, 4.3]} position={[0, -0.42, -0.35]} radius={0.14} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={ST.base} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[11.25, 0.08, 3.95]} position={[0, -0.22, -0.35]} radius={0.04} smoothness={3} receiveShadow>
        <meshStandardMaterial color={ST.baseTop} roughness={0.45} metalness={0.22} />
      </RoundedBox>
      {/* raíl principal del turno */}
      {[0.95, -0.25].map((z) => (
        <mesh key={z} position={[0, -0.15, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 10.4, 14]} />
          <meshStandardMaterial color={ST.brass} roughness={0.28} metalness={0.75} />
        </mesh>
      ))}
      {[-5.55, 5.55].flatMap((x) => [1.55, -2.25].map((z) => (
        <mesh key={`${x}:${z}`} position={[x, -0.17, z]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
          <meshStandardMaterial color={ST.steel} roughness={0.3} metalness={0.8} />
        </mesh>
      )))}
    </group>
  );
}

function Pad({ position, active, color, w = 1.75, d = 1.45 }: { position: V3; active: boolean; color: string; w?: number; d?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={[w, 0.1, d]} position={[0, -0.12, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={active ? mixHex(ST.deck, color, 0.18) : ST.deck} roughness={0.5} clearcoat={0.35} clearcoatRoughness={0.4} />
      </RoundedBox>
      <mesh position={[0, -0.065, d / 2 - 0.08]}>
        <boxGeometry args={[w - 0.3, 0.012, 0.05]} />
        <meshStandardMaterial color={active ? color : ST.steel} roughness={0.35} metalness={0.4} emissive={active ? color : "#000"} emissiveIntensity={active ? 0.25 : 0} />
      </mesh>
    </group>
  );
}

function IntakeTray({ active }: { active: boolean }) {
  return (
    <group position={STATION_X.intake}>
      <Pad position={[0, 0, 0]} active={active} color={P.amber} />
      {/* bandeja abierta */}
      <RoundedBox args={[1.25, 0.06, 0.95]} position={[0, -0.03, 0]} radius={0.02} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={ST.charcoal} roughness={0.4} metalness={0.3} />
      </RoundedBox>
      {[[-0.61, 0], [0.61, 0]].map(([x]) => (
        <mesh key={x} position={[x, 0.09, 0]} castShadow>
          <boxGeometry args={[0.04, 0.22, 0.95]} />
          <meshStandardMaterial color={ST.charcoal} roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.09, -0.46]} castShadow>
        <boxGeometry args={[1.25, 0.22, 0.04]} />
        <meshStandardMaterial color={ST.charcoal} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* mensaje de usuario y una interrupción en cola, detrás */}
      <RoundedBox args={[0.95, 0.05, 0.55]} position={[0, active ? 0.12 : 0.04, 0.12]} radius={0.02} smoothness={2} castShadow>
        <meshPhysicalMaterial color={P.amberWash} roughness={0.55} clearcoat={0.3} />
      </RoundedBox>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.12 + i * 0.05, (active ? 0.15 : 0.07), 0.02 + i * 0.12]}>
          <boxGeometry args={[0.6 - i * 0.12, 0.01, 0.035]} />
          <meshStandardMaterial color={P.amber} roughness={0.5} />
        </mesh>
      ))}
      <RoundedBox args={[0.85, 0.05, 0.3]} position={[0, 0.03, -0.3]} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color={mixHex(P.roseWash, ST.deck, 0.3)} roughness={0.6} />
      </RoundedBox>
    </group>
  );
}

function ContextStack({ active, rounds, stepIndex }: { active: boolean; rounds: number; stepIndex: number }) {
  /* Tras volver de herramientas (paso 4 o posterior), el mismo contexto
     lleva ya las Actions y Observations de cada ronda. */
  const withRounds = stepIndex >= 3 ? rounds : 0;
  let y = 0;
  const blocks = [
    ...CONTEXT_BLOCKS.map((block) => ({ key: block.id, tokens: block.tokens, color: block.color })),
    ...Array.from({ length: withRounds }, (_, i) => [
      { key: `a${i}`, tokens: ACTION_TOKENS, color: P.violet },
      { key: `o${i}`, tokens: OBSERVATION_TOKENS, color: mixHex(P.paper, P.ink, 0.12) },
    ]).flat(),
  ].map((block) => {
    const h = Math.max(0.03, block.tokens * TOKEN_HEIGHT);
    const item = { ...block, h, y: y + h / 2 };
    y += h + 0.012;
    return item;
  });
  const total = blocks.reduce((sum, block) => sum + block.tokens, 0);
  return (
    <group position={STATION_X.assemble}>
      <Pad position={[0, 0, 0]} active={active} color={P.teal} />
      {/* guías del apilado */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, y / 2 - 0.05, -0.38]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, y + 0.2, 10]} />
          <meshStandardMaterial color={ST.steel} roughness={0.3} metalness={0.75} />
        </mesh>
      ))}
      {blocks.map((block) => (
        <RoundedBox key={block.key} args={[0.92, block.h, 0.7]} position={[0, block.y - 0.05, 0]} radius={Math.min(0.03, block.h / 2.2)} smoothness={2} castShadow receiveShadow>
          <meshPhysicalMaterial color={block.color} roughness={0.45} clearcoat={0.45} clearcoatRoughness={0.3} />
        </RoundedBox>
      ))}
      <Tag position={[0, y + 0.2, 0]} tone="teal" size="xs" center>{`${fmtN(total)} tokens`}</Tag>
    </group>
  );
}

function ModelSocket({ active, generating }: { active: boolean; generating: boolean }) {
  const cartridge = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }) => {
    if (!cartridge.current) return;
    const lift = active && !still ? 0.04 + Math.sin(clock.elapsedTime * 3) * 0.02 : 0;
    cartridge.current.position.y = lift;
  });
  return (
    <group position={STATION_X.model}>
      <Pad position={[0, 0, 0]} active={active} color={P.violet} w={1.95} />
      {/* zócalo del arnés: el modelo es un cartucho intercambiable */}
      <RoundedBox args={[1.5, 0.16, 1.1]} position={[0, 0.0, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={ST.steel} roughness={0.32} metalness={0.7} />
      </RoundedBox>
      {[-0.62, 0.62].flatMap((x) => [-0.42, 0.42].map((z) => (
        <mesh key={`${x}:${z}`} position={[x, 0.09, z]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
          <meshStandardMaterial color={ST.brass} roughness={0.3} metalness={0.8} />
        </mesh>
      )))}
      <group ref={cartridge}>
        <RoundedBox args={[1.1, 0.72, 0.78]} position={[0, 0.46, 0]} radius={0.08} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color={ST.charcoal} roughness={0.35} metalness={0.25} clearcoat={0.6} clearcoatRoughness={0.25} />
        </RoundedBox>
        {/* ranura de entrada (prefill) y ventana de salida (decode) */}
        <mesh position={[0, 0.83, 0]}>
          <boxGeometry args={[0.7, 0.02, 0.1]} />
          <meshStandardMaterial color={active ? P.teal : "#11151A"} emissive={active ? P.teal : "#000"} emissiveIntensity={active ? 0.6 : 0} />
        </mesh>
        <mesh position={[0, 0.46, 0.395]}>
          <boxGeometry args={[0.72, 0.1, 0.01]} />
          <meshStandardMaterial color={generating ? P.amber : "#3A4046"} emissive={generating ? P.amber : "#000"} emissiveIntensity={generating ? 0.5 : 0} />
        </mesh>
        {[-0.3, -0.1, 0.1, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.25, 0.392]}>
            <boxGeometry args={[0.1, 0.03, 0.01]} />
            <meshStandardMaterial color="#4A5157" roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const TOOL_NAMES = ["get_weather", "search", "calc"];
function ToolRack({ active, rounds }: { active: boolean; rounds: number }) {
  return (
    <group position={STATION_X.tools}>
      <Pad position={[0, 0, 0]} active={active} color={P.violet} w={2.05} d={1.25} />
      <RoundedBox args={[1.75, 0.12, 0.5]} position={[0, -0.01, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={ST.charcoal} roughness={0.4} metalness={0.35} />
      </RoundedBox>
      {TOOL_NAMES.map((name, i) => {
        const used = rounds > 0 && i === 0;
        const lift = active && used ? 0.18 : 0;
        return (
          <group key={name} position={[-0.55 + i * 0.55, 0.3 + lift, 0]}>
            <RoundedBox args={[0.38, 0.5, 0.36]} radius={0.05} smoothness={3} castShadow receiveShadow>
              <meshPhysicalMaterial color={used ? P.violetWash : ST.deck} roughness={0.45} clearcoat={0.4} />
            </RoundedBox>
            <mesh position={[0, 0.12, 0.185]}>
              <boxGeometry args={[0.24, 0.04, 0.01]} />
              <meshStandardMaterial color={used ? P.violet : ST.steel} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
      {/* contador de rondas: una muesca por Action → Observation */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[-0.6 + i * 0.4, 0.07, 0.42]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 18]} />
          <meshStandardMaterial color={i < rounds ? P.violet : "#C9C4B7"} roughness={0.4} metalness={0.2} emissive={i < rounds ? P.violet : "#000"} emissiveIntensity={i < rounds ? 0.25 : 0} />
        </mesh>
      ))}
    </group>
  );
}

function Archive({ active, persisted }: { active: boolean; persisted: number }) {
  return (
    <group position={STATION_X.persist}>
      <Pad position={[0, 0, 0]} active={active} color={P.amber} />
      {/* cajón de transcript: una hoja por mensaje persistido */}
      <RoundedBox args={[1.3, 0.5, 1.05]} position={[0, 0.17, -0.05]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(ST.charcoal, P.amber, 0.12)} roughness={0.4} clearcoat={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.43, -0.05]}>
        <boxGeometry args={[1.12, 0.02, 0.88]} />
        <meshStandardMaterial color="#15191C" roughness={0.6} />
      </mesh>
      {Array.from({ length: persisted }, (_, i) => (
        <mesh key={i} position={[0, 0.45 + i * 0.035, 0.3 - i * 0.06]} rotation={[-0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.95, 0.012, 0.62]} />
          <meshStandardMaterial color={i === 0 ? P.amberWash : i === persisted - 1 ? P.violetWash : ST.deck} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.17, 0.48]}>
        <boxGeometry args={[0.36, 0.06, 0.04]} />
        <meshStandardMaterial color={ST.brass} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

function TurnCarrier({ step }: { step: LoopStep }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const target = STATION_X[step];
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : Math.min(1, dt * 3.5);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.z += ((step === "tools" ? 0.35 : target[2] + 0.62) - g.position.z) * k;
  });
  const x = target[0];
  return (
    <group ref={ref} position={[x, -0.1, target[2] + 0.62]}>
      <RoundedBox args={[0.5, 0.1, 0.34]} position={[0, 0, 0.35]} radius={0.04} smoothness={3} castShadow>
        <meshPhysicalMaterial color={P.amber} roughness={0.35} clearcoat={0.6} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

function LoopScene({ step, rounds }: { step: LoopStep; rounds: number }) {
  const stepIndex = LOOP_STEPS.indexOf(step);
  const sim = useMemo(() => simulateTurn(rounds), [rounds]);
  const m = STATION_X.model;
  const tl = STATION_X.tools;
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0, 0]}>
        <Bench />
        <IntakeTray active={step === "intake"} />
        <ContextStack active={step === "assemble"} rounds={rounds} stepIndex={stepIndex} />
        <ModelSocket active={step === "model"} generating={step === "model" || step === "persist"} />
        <ToolRack active={step === "tools"} rounds={rounds} />
        <Archive active={step === "persist"} persisted={stepIndex >= 4 ? sim.persisted : 0} />
        <TurnCarrier step={step} />

        {/* ruta del turno */}
        <Arrow from={[-3.55, 0.25, 0.35]} to={[-3.15, 0.25, 0.35]} color={P.amber} head={0.08} />
        <Arrow from={[-1.3, 0.25, 0.35]} to={[-0.85, 0.25, 0.35]} color={P.teal} head={0.08} />
        <Arrow from={[1.2, 0.25, 0.35]} to={[3.5, 0.25, 0.35]} color={P.amber} head={0.08} dashed={step !== "persist"} />
        {step === "assemble" || step === "model" ? (
          <Flow points={[[-1.8, 0.95, 0.35], [-0.9, 1.25, 0.35], [m[0], 0.95, m[2]]]} color={P.teal} count={4} speed={0.4} />
        ) : null}
        {/* el while: modelo ⇄ herramientas, una vuelta por ronda */}
        <Wire points={[[m[0] + 0.55, 0.75, m[2] - 0.3], [1.35, 1.25, -0.5], [tl[0] - 0.2, 0.75, tl[2] + 0.2]]} color={P.violet} opacity={rounds > 0 ? 0.8 : 0.25} width={rounds > 0 ? 2 : 1.2} dashed={rounds === 0} />
        <Wire points={[[tl[0] + 0.1, 0.1, tl[2] + 0.62], [1.4, 0.05, 0.05], [m[0] + 0.8, 0.12, m[2] - 0.1]]} color={P.violet} opacity={rounds > 0 ? 0.8 : 0.25} width={rounds > 0 ? 2 : 1.2} dashed={rounds === 0} />
        {step === "tools" && rounds > 0 ? (
          <>
            <Flow points={[[m[0] + 0.55, 0.75, m[2] - 0.3], [1.35, 1.25, -0.5], [tl[0] - 0.2, 0.75, tl[2] + 0.2]]} color={P.violet} count={rounds} speed={0.45} />
            <Flow points={[[tl[0] + 0.1, 0.1, tl[2] + 0.62], [1.4, 0.05, 0.05], [m[0] + 0.8, 0.12, m[2] - 0.1]]} color={P.inkSoft} count={rounds} speed={0.45} offset={0.5} />
          </>
        ) : null}
        {step === "persist" ? <Flow points={[[1.0, 0.45, 0.85], [2.6, 0.55, 1.15], [3.85, 0.6, 0.75]]} color={P.amber} count={3} speed={0.4} /> : null}

        {LOOP_STEPS.map((s, i) => {
          const p = STATION_X[s];
          return <group key={s} position={[p[0] - 0.7, -0.055, p[2] + 0.55]} rotation={[-Math.PI / 2, 0, 0]}><Marker position={[0, 0, 0]} n={i + 1} color={s === step ? P.ink : P.faint} active /></group>;
        })}
        <Tag position={[STATION_X.intake[0], 0.72, 0.35]} tone="amber" size="xs" center>entrada</Tag>
        <Tag position={[m[0], 1.3, m[2]]} tone="violet" size="xs" center>modelo</Tag>
        <Tag position={[tl[0], 1.05, tl[2]]} tone="violet" size="xs" center>{rounds === 1 ? "1 ronda" : `${rounds} rondas`}</Tag>
        <Tag position={[STATION_X.persist[0], 1.05, 0.35]} tone="amber" size="xs" center>transcript</Tag>
      </group>
    </PointerTilt>
  );
}

const STEP_NOTE: Record<LoopStep, { title: string; body: string; fault: string }> = {
  intake: {
    title: "Entrada.",
    body: "Llega el mensaje del usuario a la bandeja. Detrás puede esperar una interrupción en cola: el arnés decide si aborta el turno en curso o la encola.",
    fault: "Aquí viven los fallos de cola y de interrupción: un mensaje nuevo a mitad de stream.",
  },
  assemble: {
    title: "Armar contexto.",
    body: "La pila es el prompt real: política de sistema, skills, memoria durable, turnos recientes y el mensaje nuevo. Su altura es proporcional a los tokens.",
    fault: "Un fallo de contexto (falta una skill, memoria obsoleta) vive en este paso; no se arregla tocando la temperatura.",
  },
  model: {
    title: "Llamar al modelo.",
    body: "El cartucho se puede cambiar; el zócalo no. Cada llamada procesa en prefill la pila entera y luego genera, token a token, texto o una petición de herramienta.",
    fault: "Proveedor caído, 429 o 5xx: aquí entra la cadena de fallback.",
  },
  tools: {
    title: "Ejecutar herramientas.",
    body: "Si el modelo pidió una herramienta, el arnés la ejecuta y añade la Observation. Luego vuelve al paso 3: ese es el while de Thought → Action → Observation.",
    fault: "Un fallo de parseo de la Action o de permisos vive en este paso.",
  },
  persist: {
    title: "Persistir.",
    body: "Con el texto final, el turno se cierra: se guarda el transcript (una hoja por mensaje) y se vuelca la memoria durable.",
    fault: "Un fallo de persistencia (un fragmento parcial guardado como turno cerrado) rompe la alternancia en la siguiente llamada.",
  },
};

function LoopNote({ step, rounds }: { step: LoopStep; rounds: number }) {
  const sim = simulateTurn(rounds);
  const note = STEP_NOTE[step];
  return (
    <div className="space-y-3">
      <p><strong>{note.title}</strong> {note.body} {rounds === 0 && step === "tools" ? "En este turno el modelo no pidió herramientas: el paso 4 se salta y se pasa a persistir." : null}</p>
      <Readout items={[
        { label: "llamadas al modelo", value: String(sim.calls.length), tone: "var(--violet)" },
        { label: "prefill de la última", value: `${fmtN(sim.lastPrefill)} tokens`, tone: "var(--teal)" },
        { label: "prefill acumulado", value: `${fmtN(sim.totalPrefill)} tokens`, tone: "var(--amber)" },
        { label: "mensajes persistidos", value: String(sim.persisted), tone: "var(--ink)" },
      ]} />
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">
        contexto base = {CONTEXT_BLOCKS.map((b) => fmtN(b.tokens)).join(" + ")} = {fmtN(sim.base)} · cada ronda añade {ACTION_TOKENS} (Action) + {OBSERVATION_TOKENS} (Observation) · prefill total = {sim.calls.map(fmtN).join(" + ")} = {fmtN(sim.totalPrefill)} ({sim.ratio.toLocaleString("es-ES", { maximumFractionDigits: 2 })} × la primera llamada)
      </p>
      <p className="text-xs text-muted"><strong className="text-ink">Dónde depurar:</strong> {note.fault} Tokens didácticos, sin caché de prefijo; un proveedor con prefix caching reutiliza parte del prefill entre vueltas.</p>
    </div>
  );
}

function SpanishVisual() {
  const [rounds, setRounds] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [index, setIndex] = useState(0);
  const step = LOOP_STEPS[index];
  return (
    <Figure
      label="Un turno, cinco verbos · el bucle es el producto"
      hint="entrada → armar → modelo ⇄ herramientas → persistir"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "contexto armado" },
        { color: P.violet, label: "ronda de herramientas" },
        { color: P.amber, label: "mensaje y transcript" },
      ]}
      note={<LoopNote step={step} rounds={rounds} />}
      controls={
        <>
          <Switcher
            value={step}
            onChange={(next) => { setPlaying(false); setIndex(LOOP_STEPS.indexOf(next)); }}
            options={LOOP_STEPS.map((s) => ({ value: s, label: STEP_LABEL[s], tone: s === "tools" || s === "model" ? P.violet : s === "assemble" ? P.teal : P.amber }))}
            ariaLabel="Paso del turno"
          />
          <Knob label="rondas" value={rounds} min={0} max={4} onChange={setRounds} tone="var(--violet)" />
          <button type="button" className="chip" aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? "Detener recorrido" : "Recorrer solo"}</button>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3.2, 6.2, 10.5], fov: 34 }} fit={1.06}>
        <StepTicker enabled={playing} seconds={2.6} onTick={() => setIndex((i) => (i + 1) % LOOP_STEPS.length)} />
        <LoopScene step={step} rounds={rounds} />
      </Stage>
    </Figure>
  );
}

/* Avanza el recorrido desde dentro del Stage para respetar la pausa del
   visor y el movimiento reducido. */
function StepTicker({ enabled, seconds, onTick }: { enabled: boolean; seconds: number; onTick: () => void }) {
  const { still } = useStage();
  const tick = useRef(onTick);
  useEffect(() => { tick.current = onTick; });
  useEffect(() => {
    if (!enabled || still) return;
    const id = setInterval(() => tick.current(), seconds * 1000);
    return () => clearInterval(id);
  }, [enabled, still, seconds]);
  return null;
}

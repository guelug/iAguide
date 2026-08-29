"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Bars,
  Halo,
  Marker,
  Node3D,
  PointerTilt,
  ShadowBlob,
  Tag,
  useCycle,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "unit" | "loop" | "outcome";

const COPY = {
  en: {
    title: "three layers of an eval",
    hint: "wide and cheap at the bottom, narrow and honest at the top",
    unit: "Unit",
    loop: "Loop",
    outcome: "Outcome",
    legendUnit: "unit · no model",
    legendLoop: "loop · stubbed tools",
    legendOutcome: "outcome · real run",
    tiers: ["unit", "loop", "outcome"],
    speed: "runs / minute",
    cost: "cost / run",
    catches: "catches",
    misses: "misses",
    unitCatch: "parsers, schemas, prompt assembly, truncation rules",
    unitMiss: "anything that depends on what the model actually says",
    loopCatch: "tool wiring, retries, permission gates, compaction",
    loopMiss: "real model judgement — the stubs always answer politely",
    outcomeCatch: "the only layer that can tell you the product works",
    outcomeMiss: "nothing, and that is why you can only afford twenty of them",
    unitNote: "no prefill, no decode, no bill — run these on every commit",
    loopNote: "the harness runs for real, the world does not — fast enough to run on every PR",
    outcomeNote: "real model, real tools, real money — a small fixed set you actually read",
  },
  es: {
    title: "tres capas de una eval",
    hint: "ancha y barata abajo, estrecha y honesta arriba",
    unit: "Unidad",
    loop: "Bucle",
    outcome: "Resultado",
    legendUnit: "unidad · sin modelo",
    legendLoop: "bucle · tools simuladas",
    legendOutcome: "resultado · run real",
    tiers: ["unidad", "bucle", "resultado"],
    speed: "runs / minuto",
    cost: "coste / run",
    catches: "pilla",
    misses: "se le escapa",
    unitCatch: "parsers, esquemas, montaje del prompt, reglas de truncado",
    unitMiss: "todo lo que dependa de lo que el modelo diga de verdad",
    loopCatch: "cableado de tools, reintentos, permisos, compactación",
    loopMiss: "el juicio real del modelo — los stubs siempre contestan educados",
    outcomeCatch: "la única capa que puede decirte si el producto funciona",
    outcomeMiss: "nada, y por eso solo te puedes permitir veinte",
    unitNote: "sin prefill, sin decode, sin factura — pásalas en cada commit",
    loopNote: "el arnés corre de verdad, el mundo no — bastante rápido para cada PR",
    outcomeNote: "modelo real, tools reales, dinero real — un conjunto pequeño que sí lees",
  },
};

const TIERS: { id: Mode; y: number; w: number; color: string; speed: number; cost: number }[] = [
  { id: "unit", y: -0.75, w: 3.3, color: P.teal, speed: 1, cost: 0.02 },
  { id: "loop", y: -0.06, w: 2.2, color: P.amber, speed: 0.35, cost: 0.2 },
  { id: "outcome", y: 0.63, w: 1.1, color: P.violet, speed: 0.05, cost: 1 },
];

/** Evenly spaced case markers across a tier's width. */
function CASES(w: number) {
  const n = Math.max(1, Math.round(w * 3));
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * 0.28);
}

function Tier({
  y,
  w,
  color,
  active,
  onSelect,
}: {
  y: number;
  w: number;
  color: string;
  active: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.z = MathUtils.damp(g.position.z, active ? 0.3 : 0, 6, dt);
  });
  return (
    <group
      ref={ref}
      position={[0, y, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <mesh>
        <boxGeometry args={[w, 0.6, 1.15]} />
        <meshStandardMaterial
          color={active ? color : P.surface}
          transparent
          opacity={active ? 0.55 : 0.95}
          roughness={0.5}
          metalness={0.02}
        />
      </mesh>
      {/* Cases sitting on the tier: width is literally how many you run. */}
      <group position={[0, 0.36, 0.2]}>
        {CASES(w).map((x, i) => (
          <Node3D
            key={i}
            position={[x, 0, 0]}
            color={active ? color : P.line}
            radius={0.055}
            matte
          />
        ))}
      </group>
      {active ? <Halo position={[0, -0.32, 0]} radius={w * 0.62} color={color} opacity={0.5} spin={0.2} /> : null}
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("unit");
  const [side] = useCycle(2, 2.8);

  const idx = TIERS.findIndex((x) => x.id === mode);
  const tier = TIERS[idx];
  const catches = mode === "unit" ? t.unitCatch : mode === "loop" ? t.loopCatch : t.outcomeCatch;
  const misses = mode === "unit" ? t.unitMiss : mode === "loop" ? t.loopMiss : t.outcomeMiss;
  const note = mode === "unit" ? t.unitNote : mode === "loop" ? t.loopNote : t.outcomeNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendUnit },
        { color: P.amber, label: t.legendLoop },
        { color: P.violet, label: t.legendOutcome },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "unit", label: t.unit, tone: P.teal },
            { value: "loop", label: t.loop, tone: P.amber },
            { value: "outcome", label: t.outcome, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      note={note}
      height="h-[370px] md:h-[450px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.9, 7.0], fov: 40 }} background={P.paper} fit={1.1}>
        <PointerTilt amount={0.07}>
          <group position={[-1.0, 0.25, 0]} rotation={[-0.2, 0.3, 0]}>
            <ShadowBlob position={[0, -1.15, 0]} scale={5} opacity={0.06} />
            {TIERS.map((x, i) => (
              <group key={x.id}>
                <Tier
                  y={x.y}
                  w={x.w}
                  color={x.color}
                  active={x.id === mode}
                  onSelect={() => setMode(x.id)}
                />
                <Marker
                  position={[-x.w / 2 - 0.32, x.y, 0.6]}
                  n={i + 1}
                  color={x.id === mode ? x.color : P.faint}
                />
                <Tag
                  position={[x.w / 2 + 0.45, x.y, 0.6]}
                  tone={x.id === mode ? "ink" : "muted"}
                  size="xs"
                >
                  {t.tiers[i]}
                </Tag>
              </group>
            ))}
          </group>

          <group position={[2.55, -0.55, 0]}>
            <Bars
              bars={[
                { label: t.speed, value: tier.speed, color: tier.color, note: "" },
                { label: t.cost, value: tier.cost, color: P.rose, note: "" },
              ]}
              height={1.35}
              width={0.42}
              gap={0.55}
              depth={0.3}
            />
          </group>
        </PointerTilt>

        {/* Alternating "catches / misses" keeps both halves of the trade
            on screen without printing a wall of text. */}
        <group position={[0, -2.15, 0]}>
          <Tag position={[0, 0.28, 0]} tone={side === 0 ? "teal" : "rose"} size="xs" center>
            {side === 0 ? t.catches : t.misses}: {side === 0 ? catches : misses}
          </Tag>
        </group>
      </Stage>
    </Figure>
  );
}
